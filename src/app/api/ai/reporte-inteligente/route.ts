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
    const mes = searchParams.get('mes') ? parseInt(searchParams.get('mes')!) : undefined
    const año = searchParams.get('año') ? parseInt(searchParams.get('año')!) : undefined

    // Validaciones
    if (mes && (mes < 1 || mes > 12)) {
      return NextResponse.json({ 
        error: 'El mes debe estar entre 1 y 12' 
      }, { status: 400 })
    }

    if (año && (año < 2020 || año > new Date().getFullYear() + 1)) {
      return NextResponse.json({ 
        error: 'El año debe estar entre 2020 y el próximo año' 
      }, { status: 400 })
    }

    const aiAnalyzer = new AIAnalyzer()
    const reporte = await aiAnalyzer.generarReporteInteligente(session.user.id, mes, año)

    if (!reporte) {
      return NextResponse.json({ 
        error: 'No se pudo generar el reporte con los datos disponibles' 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      reporte,
      metadatos: {
        userId: session.user.id,
        fechaGeneracion: new Date().toISOString(),
        parametros: {
          mes: mes || new Date().getMonth() + 1,
          año: año || new Date().getFullYear()
        }
      }
    })
  } catch (error) {
    console.error('Error generando reporte inteligente:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
} 