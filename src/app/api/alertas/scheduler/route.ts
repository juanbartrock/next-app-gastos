import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import AlertScheduler from '@/lib/alert-engine/AlertScheduler'

// Verificar si el usuario es administrador
async function isAdmin(userId: string) {
  // Esta función debería verificar si el usuario tiene permisos de admin
  // Por simplicidad, asumimos que todo usuario autenticado puede acceder por ahora
  return true
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const scheduler = AlertScheduler.getInstance()
    const status = scheduler.getStatus()

    return NextResponse.json({
      success: true,
      status,
      mensaje: status.isRunning ? 'Scheduler activo' : 'Scheduler inactivo'
    })
  } catch (error) {
    console.error('Error getting scheduler status:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const { action, intervalMinutes } = body

    const scheduler = AlertScheduler.getInstance()

    switch (action) {
      case 'start':
        scheduler.start(intervalMinutes || 60)
        return NextResponse.json({
          success: true,
          mensaje: `Scheduler iniciado con intervalo de ${intervalMinutes || 60} minutos`
        })

      case 'stop':
        scheduler.stop()
        return NextResponse.json({
          success: true,
          mensaje: 'Scheduler detenido'
        })

      case 'runOnce':
        const alertasCreadas = await scheduler.runOnce()
        return NextResponse.json({
          success: true,
          alertasCreadas,
          mensaje: `Evaluación inmediata completada: ${alertasCreadas} alertas creadas`
        })

      default:
        return NextResponse.json({ 
          error: 'Acción no válida. Use: start, stop, o runOnce' 
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Error controlling scheduler:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
} 