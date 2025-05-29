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
    const resultado = await aiAnalyzer.detectarGastosAnomalos(session.user.id)

    return NextResponse.json({
      success: true,
      gastosAnomalos: resultado.gastos,
      explicacion: resultado.explicacion,
      metadatos: {
        userId: session.user.id,
        fechaAnalisis: new Date().toISOString(),
        totalGastosAnomalos: resultado.gastos.length,
        distribucionRiesgo: {
          bajo: resultado.gastos.filter(g => g.nivelRiesgo === 'bajo').length,
          medio: resultado.gastos.filter(g => g.nivelRiesgo === 'medio').length,
          alto: resultado.gastos.filter(g => g.nivelRiesgo === 'alto').length,
        }
      }
    })
  } catch (error) {
    console.error('Error detectando anomalías:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
} 