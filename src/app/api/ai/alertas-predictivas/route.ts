import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import AIAnalyzer from '@/lib/ai/AIAnalyzer'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const aiAnalyzer = new AIAnalyzer()
    const alertasPredictivas = await aiAnalyzer.generarAlertasPredictivas(session.user.id)

    return NextResponse.json({
      success: true,
      alertasPredictivas,
      metadatos: {
        userId: session.user.id,
        fechaGeneracion: new Date().toISOString(),
        totalAlertas: alertasPredictivas.length,
        distribucionImpacto: {
          bajo: alertasPredictivas.filter(a => a.impacto === 'bajo').length,
          medio: alertasPredictivas.filter(a => a.impacto === 'medio').length,
          alto: alertasPredictivas.filter(a => a.impacto === 'alto').length,
        },
        probabilidadPromedio: alertasPredictivas.length > 0 
          ? Math.round(alertasPredictivas.reduce((sum, a) => sum + a.probabilidad, 0) / alertasPredictivas.length)
          : 0
      }
    })
  } catch (error) {
    console.error('Error generando alertas predictivas:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
} 