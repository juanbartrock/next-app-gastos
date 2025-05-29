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

    const { searchParams } = new URL(request.url)
    const mesesAtras = parseInt(searchParams.get('meses') || '6')

    if (mesesAtras < 1 || mesesAtras > 24) {
      return NextResponse.json({ 
        error: 'El parámetro meses debe estar entre 1 y 24' 
      }, { status: 400 })
    }

    const aiAnalyzer = new AIAnalyzer()
    const patrones = await aiAnalyzer.analizarPatronesGastos(session.user.id, mesesAtras)

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