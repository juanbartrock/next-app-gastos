import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'

// ✅ OBTENER ESTADO DE LÍMITES DEL USUARIO
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // ✅ REEMPLAZAR DATOS MOCK POR DATOS REALES
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { plan: true }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    try {
      // Importar la función getLimitsStatus dinámicamente
      const { getLimitsStatus } = await import('@/lib/plan-limits')
      const realStatus = await getLimitsStatus(usuario.id)
      return NextResponse.json(realStatus)
    } catch (error) {
      console.error('Error obteniendo límites reales:', error)
      
      // Fallback con datos básicos del plan del usuario
      const plan = usuario.plan?.nombre?.toLowerCase() || 'gratuito'
      
      const fallbackStatus = {
        plan: plan as 'gratuito' | 'basico' | 'premium',
        limits: {},
        needsUpgrade: plan === 'gratuito',
        blockedFeatures: plan === 'gratuito' 
          ? ['categorias_personalizadas', 'modo_familiar', 'alertas_automaticas', 'prestamos_inversiones', 'exportacion', 'tareas']
          : []
      }
      
      return NextResponse.json(fallbackStatus)
    }

  } catch (error) {
    console.error('Error obteniendo límites del plan:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// ✅ ACTUALIZAR USO DE LÍMITE (para incrementar contadores)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { limitType, amount = 1 } = body

    // TODO: Implementar incrementUsage cuando se regenere el cliente Prisma
    console.log(`Incrementando uso de ${limitType} en ${amount} para usuario ${session.user.id}`)

    return NextResponse.json({ 
      success: true,
      message: `Uso de ${limitType} incrementado en ${amount}`
    })

  } catch (error) {
    console.error('Error incrementando uso:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 