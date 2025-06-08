import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'

// ✅ OBTENER ESTADO DE LÍMITES DEL USUARIO
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Por ahora devolvemos un estado mock hasta que se resuelvan los errores de Prisma
    // TODO: Implementar getLimitsStatus cuando se regenere el cliente Prisma
    
    const mockStatus = {
      plan: 'gratuito' as const,
      limits: {
        transacciones_mes: {
          allowed: true,
          limit: 50,
          usage: 12,
          remaining: 38
        },
        gastos_recurrentes: {
          allowed: true,
          limit: 2,
          usage: 1,
          remaining: 1
        },
        consultas_ia_mes: {
          allowed: true,
          limit: 3,
          usage: 0,
          remaining: 3
        },
        presupuestos_activos: {
          allowed: true,
          limit: 1,
          usage: 0,
          remaining: 1
        },
        categorias_personalizadas: {
          allowed: false,
          limit: 0,
          usage: 0,
          remaining: 0
        },
        modo_familiar: {
          allowed: false,
          limit: 0,
          usage: 0,
          remaining: 0
        },
        alertas_automaticas: {
          allowed: false,
          limit: 0,
          usage: 0,
          remaining: 0
        },
        prestamos_inversiones: {
          allowed: false,
          limit: 0,
          usage: 0,
          remaining: 0
        },
        exportacion: {
          allowed: false,
          limit: 0,
          usage: 0,
          remaining: 0
        },
        tareas: {
          allowed: false,
          limit: 0,
          usage: 0,
          remaining: 0
        },
        miembros_familia: {
          allowed: false,
          limit: 0,
          usage: 0,
          remaining: 0
        }
      },
      needsUpgrade: false,
      blockedFeatures: ['categorias_personalizadas', 'modo_familiar', 'alertas_automaticas', 'prestamos_inversiones', 'exportacion', 'tareas']
    }

    return NextResponse.json(mockStatus)

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