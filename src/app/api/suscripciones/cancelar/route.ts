import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { suscripcionId } = await request.json()

    if (!suscripcionId) {
      return NextResponse.json({ error: 'Suscripción ID requerido' }, { status: 400 })
    }

    // Verificar que la suscripción pertenezca al usuario
    const suscripcion = await prisma.suscripcion.findFirst({
      where: {
        id: suscripcionId,
        userId: session.user.id
      },
      include: {
        plan: {
          select: {
            nombre: true,
            esPago: true
          }
        }
      }
    })

    if (!suscripcion) {
      return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 })
    }

    // No permitir cancelar planes gratuitos o lifetime
    if (!suscripcion.plan.esPago) {
      return NextResponse.json({ 
        error: 'No puedes cancelar un plan gratuito o de por vida' 
      }, { status: 400 })
    }

    // Actualizar el estado de la suscripción
    const suscripcionCancelada = await prisma.suscripcion.update({
      where: { id: suscripcionId },
      data: {
        estado: 'cancelada',
        autoRenovacion: false,
        observaciones: `Suscripción cancelada por el usuario el ${new Date().toLocaleString('es-AR')}`,
        updatedAt: new Date()
      }
    })

    // También cambiar al usuario a plan gratuito inmediatamente o al final del período
    // Por ahora lo mantenemos hasta que expire
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        // Nota: Mantenemos el plan actual hasta que expire la suscripción
        // El sistema de limpieza se encargará de downgradearlo después
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Suscripción cancelada correctamente. Mantendrás acceso hasta el final del período pagado.',
      suscripcion: {
        id: suscripcionCancelada.id,
        estado: suscripcionCancelada.estado,
        fechaVencimiento: suscripcionCancelada.fechaVencimiento
      }
    })

  } catch (error) {
    console.error('Error cancelando suscripción:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 