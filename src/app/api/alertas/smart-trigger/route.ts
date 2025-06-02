import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import { smartAlertTrigger } from '@/lib/alert-engine/SmartTrigger'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { source = 'unknown' } = body

    console.log(`🎯 Smart Trigger activado desde: ${source} por usuario: ${session.user.email}`)

    // Ejecutar el Smart Trigger
    const result = await smartAlertTrigger.tryExecuteAlerts(session.user.id)

    // Obtener estadísticas
    const stats = await smartAlertTrigger.getStats()

    return NextResponse.json({
      success: true,
      result,
      stats,
      timestamp: new Date().toISOString(),
      message: result.executed 
        ? `Smart Trigger ejecutado: ${result.alertasCreadas} alertas creadas`
        : `Smart Trigger no ejecutado: ${result.reason}`
    })

  } catch (error) {
    console.error('❌ Error en Smart Trigger API:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo obtener estadísticas sin ejecutar
    const stats = await smartAlertTrigger.getStats()

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
      message: 'Estadísticas del Smart Trigger'
    })

  } catch (error) {
    console.error('❌ Error obteniendo stats Smart Trigger:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 