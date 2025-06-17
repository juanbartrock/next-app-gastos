import crypto from 'crypto'

// Configuración de encriptación
const ENCRYPTION_ALGORITHM = 'aes-256-gcm'
const PBKDF2_ITERATIONS = 100000
const SALT_LENGTH = 32
const IV_LENGTH = 16
const TAG_LENGTH = 16

// Clave maestra - solo accesible por desarrolladores
const MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'default-dev-key-change-in-production'

export interface EncryptedData {
  encryptedValue: string
  iv: string
  tag: string
  salt: string // Para derivación de clave del usuario
}

/**
 * Deriva una clave de encriptación única para el usuario
 * Combina la contraseña del usuario con una sal única
 */
function deriveUserKey(userPassword: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(userPassword, salt, PBKDF2_ITERATIONS, 32, 'sha256')
}

/**
 * Combina la clave del usuario con la clave maestra
 * Esto permite recuperación por desarrolladores
 */
function deriveEncryptionKey(userKey: Buffer): Buffer {
  const masterKeyBuffer = Buffer.from(MASTER_KEY)
  return crypto.createHmac('sha256', masterKeyBuffer)
    .update(userKey)
    .digest()
    .slice(0, 32) // AES-256 requiere 32 bytes
}

/**
 * Encripta un valor numérico usando la contraseña del usuario
 */
export function encryptNumericValue(
  value: number, 
  userPassword: string
): EncryptedData {
  try {
    // Generar sal única para este valor
    const salt = crypto.randomBytes(SALT_LENGTH)
    
    // Derivar clave del usuario
    const userKey = deriveUserKey(userPassword, salt)
    
    // Generar clave final de encriptación
    const encryptionKey = deriveEncryptionKey(userKey)
    
    // Generar IV aleatorio
    const iv = crypto.randomBytes(IV_LENGTH)
    
    // Crear cipher
    const cipher = crypto.createCipher(ENCRYPTION_ALGORITHM, encryptionKey)
    cipher.setAAD(Buffer.from('financial-data'))
    
    // Encriptar el valor
    const valueString = value.toString()
    let encrypted = cipher.update(valueString, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    // Obtener tag de autenticación
    const tag = cipher.getAuthTag()
    
    return {
      encryptedValue: encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      salt: salt.toString('hex')
    }
  } catch (error) {
    console.error('Error encriptando valor:', error)
    throw new Error('Error en la encriptación')
  }
}

/**
 * Desencripta un valor numérico usando la contraseña del usuario
 */
export function decryptNumericValue(
  encryptedData: EncryptedData,
  userPassword: string
): number {
  try {
    const salt = Buffer.from(encryptedData.salt, 'hex')
    const iv = Buffer.from(encryptedData.iv, 'hex')
    const tag = Buffer.from(encryptedData.tag, 'hex')
    
    // Derivar clave del usuario
    const userKey = deriveUserKey(userPassword, salt)
    
    // Generar clave final de encriptación
    const encryptionKey = deriveEncryptionKey(userKey)
    
    // Crear decipher
    const decipher = crypto.createDecipher(ENCRYPTION_ALGORITHM, encryptionKey)
    decipher.setAAD(Buffer.from('financial-data'))
    decipher.setAuthTag(tag)
    
    // Desencriptar el valor
    let decrypted = decipher.update(encryptedData.encryptedValue, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return parseFloat(decrypted)
  } catch (error) {
    console.error('Error desencriptando valor:', error)
    throw new Error('Error en la desencriptación')
  }
}

/**
 * FUNCIÓN DE RECUPERACIÓN PARA DESARROLLADORES
 * Permite desencriptar sin la contraseña del usuario usando solo la clave maestra
 */
export function developerDecryptValue(
  encryptedData: EncryptedData,
  userSalt: string, // Obtenido de la base de datos del usuario
  emergencyMasterKey?: string // Para casos extremos
): number {
  try {
    const masterKey = emergencyMasterKey || MASTER_KEY
    
    // Reconstruir clave usando directamente la sal del usuario
    const userKey = crypto.pbkdf2Sync(masterKey, Buffer.from(userSalt, 'hex'), PBKDF2_ITERATIONS, 32, 'sha256')
    const encryptionKey = deriveEncryptionKey(userKey)
    
    const iv = Buffer.from(encryptedData.iv, 'hex')
    const tag = Buffer.from(encryptedData.tag, 'hex')
    
    const decipher = crypto.createDecipher(ENCRYPTION_ALGORITHM, encryptionKey)
    decipher.setAAD(Buffer.from('financial-data'))
    decipher.setAuthTag(tag)
    
    let decrypted = decipher.update(encryptedData.encryptedValue, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return parseFloat(decrypted)
  } catch (error) {
    console.error('Error en recuperación de desarrollador:', error)
    throw new Error('Error en recuperación de datos')
  }
}

/**
 * Utilidad para verificar si un valor está encriptado
 */
export function isEncryptedValue(value: any): value is EncryptedData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'encryptedValue' in value &&
    'iv' in value &&
    'tag' in value &&
    'salt' in value
  )
}

/**
 * Middleware para encriptar automáticamente campos numéricos
 */
export function encryptFinancialFields(
  data: Record<string, any>,
  userPassword: string,
  fieldsToEncrypt: string[]
): Record<string, any> {
  const encryptedData = { ...data }
  
  fieldsToEncrypt.forEach(field => {
    if (field in data && typeof data[field] === 'number') {
      encryptedData[field] = encryptNumericValue(data[field], userPassword)
    }
  })
  
  return encryptedData
}

/**
 * Middleware para desencriptar automáticamente campos numéricos
 */
export function decryptFinancialFields(
  data: Record<string, any>,
  userPassword: string,
  fieldsToDecrypt: string[]
): Record<string, any> {
  const decryptedData = { ...data }
  
  fieldsToDecrypt.forEach(field => {
    if (field in data && isEncryptedValue(data[field])) {
      decryptedData[field] = decryptNumericValue(data[field], userPassword)
    }
  })
  
  return decryptedData
} 