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
    const recomendaciones = await aiAnalyzer.generarRecomendaciones(session.user.id)

    return NextResponse.json({
      success: true,
      recomendaciones,
      metadatos: {
        userId: session.user.id,
        fechaGeneracion: new Date().toISOString(),
        totalRecomendaciones: recomendaciones.length,
        resumen: {
          ahorro: recomendaciones.filter(r => r.tipo === 'ahorro').length,
          presupuesto: recomendaciones.filter(r => r.tipo === 'presupuesto').length,
          inversion: recomendaciones.filter(r => r.tipo === 'inversion').length,
          alerta: recomendaciones.filter(r => r.tipo === 'alerta').length,
          impactoEconomicoTotal: recomendaciones.reduce((sum, r) => sum + r.impactoEconomico, 0)
        }
      }
    })
  } catch (error) {
    console.error('Error generando recomendaciones:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
} 