import prisma from './prisma'

// Función para despertar la base de datos Neon
export async function wakeUpDatabase(): Promise<boolean> {
  try {
    console.log('🔄 Despertando base de datos Neon...')
    
    // Realizar una consulta simple para despertar la conexión
    await prisma.$queryRaw`SELECT 1`
    
    console.log('✅ Base de datos despertada exitosamente')
    return true
  } catch (error) {
    console.error('❌ Error al despertar base de datos:', error)
    return false
  }
}

// Función para verificar la salud de la base de datos
export async function checkDatabaseHealth(): Promise<{
  isHealthy: boolean
  latency: number
  error?: string
}> {
  const startTime = Date.now()
  
  try {
    // Probar conexión básica
    await prisma.$queryRaw`SELECT NOW()`
    
    const latency = Date.now() - startTime
    
    return {
      isHealthy: true,
      latency
    }
  } catch (error) {
    const latency = Date.now() - startTime
    
    return {
      isHealthy: false,
      latency,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

// Función para intentar reconexión automática
export async function autoReconnect(maxAttempts = 3): Promise<boolean> {
  console.log('🔄 Iniciando reconexión automática...')
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`📡 Intento ${attempt}/${maxAttempts}...`)
      
      // Desconectar primero
      await prisma.$disconnect()
      
      // Esperar un momento
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Intentar despertar la base de datos
      const isAwake = await wakeUpDatabase()
      
      if (isAwake) {
        console.log('✅ Reconexión exitosa')
        return true
      }
      
    } catch (error) {
      console.log(`❌ Intento ${attempt} falló:`, error)
    }
    
    // Esperar antes del próximo intento (exponential backoff)
    if (attempt < maxAttempts) {
      const delay = Math.pow(2, attempt) * 1000
      console.log(`⏱️ Esperando ${delay}ms antes del próximo intento...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  console.log('❌ No se pudo establecer reconexión')
  return false
} 