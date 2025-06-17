import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Buscar todos los pagos del usuario
    const pagosMercadoPago = await prisma.pagoSuscripcionMP.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        plan: {
          select: {
            nombre: true
          }
        },
        suscripcion: {
          select: {
            estado: true
          }
        }
      },
      orderBy: {
        fechaCreacion: 'desc'
      }
    })

    // Formatear pagos para la respuesta
    const pagosFormateados = pagosMercadoPago.map(pago => ({
      id: pago.id,
      concepto: pago.concepto,
      monto: pago.monto,
      fechaCreacion: pago.fechaCreacion,
      fechaPago: pago.fechaPago,
      estado: pago.mpStatus,
      tipoPago: pago.tipoPago,
      planNombre: pago.plan?.nombre || 'Plan Desconocido',
      metodoPago: pago.mpPaymentMethod || 'MercadoPago',
      referencia: pago.mpExternalReference
    }))

    // Si no hay pagos de MercadoPago, buscar suscripciones activas/históricas
    if (pagosFormateados.length === 0) {
      const suscripciones = await prisma.suscripcion.findMany({
        where: {
          userId: session.user.id
        },
        include: {
          plan: {
            select: {
              nombre: true,
              precioMensual: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      // Crear "pagos virtuales" para planes gratuitos/lifetime
      const pagosVirtuales = suscripciones.map(suscripcion => ({
        id: `virtual-${suscripcion.id}`,
        concepto: `${suscripcion.plan?.nombre || 'Plan'} - ${suscripcion.metodoPago === 'gratuito' ? 'Gratuito' : 'Activado'}`,
        monto: suscripcion.montoMensual || 0,
        fechaCreacion: suscripcion.fechaInicio,
        fechaPago: suscripcion.metodoPago === 'gratuito' || suscripcion.metodoPago === 'grandfathered' 
          ? suscripcion.fechaInicio 
          : null,
        estado: suscripcion.estado === 'activa' ? 'APPROVED' : 'PENDING',
        tipoPago: suscripcion.metodoPago || 'gratuito',
        planNombre: suscripcion.plan?.nombre || 'Plan Desconocido',
        metodoPago: suscripcion.metodoPago === 'grandfathered' ? 'Acceso de por vida' : 
                   suscripcion.metodoPago === 'gratuito' ? 'Plan gratuito' : 'MercadoPago',
        referencia: suscripcion.referenciaPago || suscripcion.id
      }))

      return NextResponse.json({
        pagos: pagosVirtuales,
        totalPagos: pagosVirtuales.length,
        mensaje: pagosVirtuales.length === 0 
          ? 'No hay historial de pagos disponible' 
          : 'Historial de activaciones de plan'
      })
    }

    return NextResponse.json({
      pagos: pagosFormateados,
      totalPagos: pagosFormateados.length,
      montoTotal: pagosFormateados
        .filter(p => p.estado === 'APPROVED')
        .reduce((sum, p) => sum + p.monto, 0)
    })

  } catch (error) {
    console.error('Error obteniendo historial de pagos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 