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

    // ✅ VALIDAR LÍMITES DE IA ANTES DE USAR
    try {
      const { validateLimit, incrementUsage } = await import('@/lib/plan-limits')
      const validacionIA = await validateLimit(session.user.id, 'consultas_ia_mes')
      
      if (!validacionIA.allowed) {
        return NextResponse.json({
          error: 'Límite de consultas IA alcanzado',
          codigo: 'LIMIT_REACHED',
          limite: validacionIA.limit,
          uso: validacionIA.usage,
          upgradeRequired: true,
          mensaje: validacionIA.limit === 3 
            ? 'Has alcanzado el límite de 3 consultas IA mensuales del Plan Gratuito. Upgrade al Plan Básico para 15 consultas mensuales.'
            : `Has alcanzado el límite de ${validacionIA.limit} consultas IA mensuales de tu plan actual.`
        }, { status: 403 })
      }
    } catch (limitError) {
      console.error('Error validando límites IA (no crítico):', limitError)
    }

    const { searchParams } = new URL(request.url)
    const mesesAtras = parseInt(searchParams.get('meses') || '6')

    if (mesesAtras < 1 || mesesAtras > 24) {
      return NextResponse.json({ 
        error: 'El parámetro meses debe estar entre 1 y 24' 
      }, { status: 400 })
    }

    const aiAnalyzer = new AIAnalyzer()
    const patrones = await aiAnalyzer.analizarPatronesGastos(session.user.id, mesesAtras)

    // ✅ INCREMENTAR CONTADOR DESPUÉS DE USAR IA EXITOSAMENTE
    try {
      const { incrementUsage } = await import('@/lib/plan-limits')
      await incrementUsage(session.user.id, 'consultas_ia_mes', 1)
    } catch (incrementError) {
      console.error('Error incrementando uso IA (no crítico):', incrementError)
    }

    return NextResponse.json({
      success: true,
      patrones,
      metadatos: {
        userId: session.user.id,
        mesesAnalizados: mesesAtras,
        fechaAnalisis: new Date().toISOString(),
        patronesDetectados: patrones.length
      }
    })
  } catch (error) {
    console.error('Error analizando patrones:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
} 