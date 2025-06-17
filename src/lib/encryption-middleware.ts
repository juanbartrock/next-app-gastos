import { 
  encryptFinancialFields, 
  decryptFinancialFields, 
  EncryptedData 
} from './encryption'
import prisma from './prisma'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'

// Configuración de campos a encriptar por modelo
export const ENCRYPTED_FIELDS_CONFIG = {
  gasto: ['monto'],
  gastoRecurrente: ['monto'],
  prestamo: ['montoSolicitado', 'montoAprobado', 'saldoActual', 'cuotaMensual'],
  inversion: ['montoInicial', 'montoActual', 'rendimientoTotal'],
  presupuesto: ['monto'],
  servicio: ['monto'],
  pagoPrestamo: ['montoPagado', 'montoCapital', 'montoInteres']
} as const

/**
 * Obtiene la contraseña del usuario para encriptación
 * En producción, esto debería obtenerse de forma segura
 */
async function getUserPassword(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true, email: true }
  })
  
  if (!user?.password) {
    throw new Error('Usuario sin contraseña configurada')
  }
  
  // En producción, usar la contraseña hasheada como base para derivación
  return user.password
}

/**
 * Almacena la sal de encriptación del usuario en la BD
 */
async function storeUserEncryptionSalt(userId: string, salt: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { 
      // Agregar campo encryptionSalt al schema
      encryptionSalt: salt 
    }
  })
}

/**
 * Middleware para encriptar datos antes de guardar en BD
 */
export async function encryptDataForStorage(
  data: Record<string, any>,
  modelName: keyof typeof ENCRYPTED_FIELDS_CONFIG,
  userId: string
): Promise<Record<string, any>> {
  try {
    const userPassword = await getUserPassword(userId)
    const fieldsToEncrypt = ENCRYPTED_FIELDS_CONFIG[modelName]
    
    return encryptFinancialFields(data, userPassword, fieldsToEncrypt)
  } catch (error) {
    console.error('Error encriptando datos:', error)
    // En caso de error, retornar datos sin encriptar (fallback)
    return data
  }
}

/**
 * Middleware para desencriptar datos al recuperar de BD
 */
export async function decryptDataFromStorage(
  data: Record<string, any>,
  modelName: keyof typeof ENCRYPTED_FIELDS_CONFIG,
  userId: string
): Promise<Record<string, any>> {
  try {
    const userPassword = await getUserPassword(userId)
    const fieldsToDecrypt = ENCRYPTED_FIELDS_CONFIG[modelName]
    
    return decryptFinancialFields(data, userPassword, fieldsToDecrypt)
  } catch (error) {
    console.error('Error desencriptando datos:', error)
    // En caso de error, retornar datos encriptados (para debugging)
    return data
  }
}

/**
 * Wrapper para operaciones de Prisma con encriptación automática
 */
export class EncryptedPrismaClient {
  static async createGasto(data: any, userId: string) {
    const encryptedData = await encryptDataForStorage(data, 'gasto', userId)
    return prisma.gasto.create({ data: encryptedData })
  }
  
  static async findManyGastos(where: any, userId: string) {
    const gastos = await prisma.gasto.findMany({ where })
    
    // Desencriptar cada gasto
    const decryptedGastos = await Promise.all(
      gastos.map(async (gasto) => 
        await decryptDataFromStorage(gasto, 'gasto', userId)
      )
    )
    
    return decryptedGastos
  }
  
  static async createPresupuesto(data: any, userId: string) {
    const encryptedData = await encryptDataForStorage(data, 'presupuesto', userId)
    return prisma.presupuesto.create({ data: encryptedData })
  }
  
  static async findManyPresupuestos(where: any, userId: string) {
    const presupuestos = await prisma.presupuesto.findMany({ where })
    
    const decryptedPresupuestos = await Promise.all(
      presupuestos.map(async (presupuesto) => 
        await decryptDataFromStorage(presupuesto, 'presupuesto', userId)
      )
    )
    
    return decryptedPresupuestos
  }
  
  // Métodos similares para otros modelos...
}

/**
 * Helper para verificar si la encriptación está habilitada
 */
export function isEncryptionEnabled(): boolean {
  return process.env.ENABLE_ENCRYPTION === 'true'
}

/**
 * Migración gradual - encripta datos existentes
 */
export async function migrateExistingDataToEncryption(userId: string, modelName: keyof typeof ENCRYPTED_FIELDS_CONFIG) {
  if (!isEncryptionEnabled()) {
    console.log('Encriptación deshabilitada, saltando migración')
    return
  }
  
  console.log(`🔐 Iniciando migración de encriptación para ${modelName} del usuario ${userId}`)
  
  try {
    const userPassword = await getUserPassword(userId)
    const fieldsToEncrypt = ENCRYPTED_FIELDS_CONFIG[modelName]
    
    // Ejemplo para gastos
    if (modelName === 'gasto') {
      const gastos = await prisma.gasto.findMany({
        where: { userId }
      })
      
      for (const gasto of gastos) {
        // Solo encriptar si no está ya encriptado
        const shouldEncrypt = fieldsToEncrypt.some(field => 
          typeof gasto[field as keyof typeof gasto] === 'number'
        )
        
        if (shouldEncrypt) {
          const encryptedData = encryptFinancialFields(gasto, userPassword, fieldsToEncrypt)
          
          await prisma.gasto.update({
            where: { id: gasto.id },
            data: encryptedData
          })
        }
      }
    }
    
    console.log(`✅ Migración completada para ${modelName}`)
  } catch (error) {
    console.error(`❌ Error en migración de ${modelName}:`, error)
    throw error
  }
}

/**
 * Función de emergencia para desarrolladores
 */
export async function emergencyDecryptUserData(userId: string, emergencyKey?: string) {
  console.log(`🚨 ACCESO DE EMERGENCIA - Desencriptando datos del usuario ${userId}`)
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        encryptionSalt: true,
        email: true,
        name: true 
      }
    })
    
    if (!user?.encryptionSalt) {
      throw new Error('Usuario sin sal de encriptación')
    }
    
    // Obtener datos encriptados
    const gastos = await prisma.gasto.findMany({ where: { userId } })
    
    // Usar función de desarrollador para desencriptar
    const { developerDecryptValue } = await import('./encryption')
    
    const decryptedGastos = gastos.map(gasto => {
      if (typeof gasto.monto === 'object') {
        return {
          ...gasto,
          monto: developerDecryptValue(gasto.monto as EncryptedData, user.encryptionSalt!, emergencyKey)
        }
      }
      return gasto
    })
    
    console.log(`✅ Datos desencriptados para ${user.name} (${user.email})`)
    return {
      user: { name: user.name, email: user.email },
      gastos: decryptedGastos
    }
    
  } catch (error) {
    console.error('❌ Error en acceso de emergencia:', error)
    throw error
  }
} 