import { NextRequest, NextResponse } from 'next/server'
import { checkDatabaseHealth, wakeUpDatabase, autoReconnect } from '@/lib/db-health'

export async function GET(request: NextRequest) {
  try {
    // Verificar si se solicita despertar la base de datos
    const url = new URL(request.url)
    const wakeUp = url.searchParams.get('wakeup') === 'true'
    const reconnect = url.searchParams.get('reconnect') === 'true'
    
    if (reconnect) {
      console.log('🔄 Reconexión solicitada via API')
      const success = await autoReconnect()
      
      return NextResponse.json({
        status: success ? 'connected' : 'error',
        message: success ? 'Reconexión exitosa' : 'Error en reconexión',
        timestamp: new Date().toISOString()
      })
    }
    
    if (wakeUp) {
      console.log('🔄 Wake-up solicitado via API')
      const isAwake = await wakeUpDatabase()
      
      return NextResponse.json({
        status: isAwake ? 'awake' : 'sleeping',
        message: isAwake ? 'Base de datos despertada' : 'No se pudo despertar la base de datos',
        timestamp: new Date().toISOString()
      })
    }
    
    // Health check normal
    const health = await checkDatabaseHealth()
    
    return NextResponse.json({
      status: health.isHealthy ? 'healthy' : 'unhealthy',
      latency: health.latency,
      error: health.error,
      timestamp: new Date().toISOString(),
      database: 'neon-postgresql'
    }, {
      status: health.isHealthy ? 200 : 503
    })
    
  } catch (error) {
    console.error('❌ Error en health check:', error)
    
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, {
      status: 500
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    switch (action) {
      case 'wakeup':
        const isAwake = await wakeUpDatabase()
        return NextResponse.json({
          success: isAwake,
          message: isAwake ? 'Base de datos despertada' : 'Error al despertar'
        })
        
      case 'reconnect':
        const reconnected = await autoReconnect()
        return NextResponse.json({
          success: reconnected,
          message: reconnected ? 'Reconexión exitosa' : 'Error en reconexión'
        })
        
      default:
        return NextResponse.json({
          error: 'Acción no válida. Use "wakeup" o "reconnect"'
        }, { status: 400 })
    }
    
  } catch (error) {
    console.error('❌ Error en acción de health:', error)
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
} 