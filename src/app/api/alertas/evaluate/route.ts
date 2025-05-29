import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import AlertEngine from '@/lib/alert-engine/AlertEngine'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const alertEngine = new AlertEngine()
    const alertasCreadas = await alertEngine.runAutomaticEvaluation(session.user.id)

    return NextResponse.json({
      success: true,
      alertasCreadas,
      mensaje: `Se evaluaron las condiciones automáticas y se crearon ${alertasCreadas} nueva${alertasCreadas === 1 ? '' : 's'} alerta${alertasCreadas === 1 ? '' : 's'}.`
    })
  } catch (error) {
    console.error('Error evaluating alerts:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// GET para obtener estadísticas de evaluación
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const alertEngine = new AlertEngine()
    
    // Solo evaluar condiciones sin crear alertas para obtener estadísticas
    const alertasPotenciales = await alertEngine.evaluateConditions(session.user.id)

    return NextResponse.json({
      success: true,
      alertasPotenciales: alertasPotenciales.length,
      detalles: alertasPotenciales.map(alerta => ({
        tipo: alerta.tipo,
        prioridad: alerta.prioridad,
        titulo: alerta.titulo
      }))
    })
  } catch (error) {
    console.error('Error getting alert evaluation stats:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
} 