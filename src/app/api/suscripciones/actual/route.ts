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

    // Buscar suscripción activa del usuario
    const suscripcion = await prisma.suscripcion.findFirst({
      where: {
        userId: session.user.id,
        estado: 'activa'
      },
      include: {
        plan: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            colorHex: true,
            precioMensual: true,
            esPago: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!suscripcion) {
      // Si no tiene suscripción activa, buscar si tiene plan asignado
      const usuario = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          plan: {
            select: {
              id: true,
              nombre: true,
              descripcion: true,
              colorHex: true,
              precioMensual: true,
              esPago: true
            }
          }
        }
      })

      if (usuario?.plan) {
        // Crear suscripción automática para plan gratuito o lifetime
        if (!usuario.plan.esPago) {
          const nuevaSuscripcion = await prisma.suscripcion.create({
            data: {
              userId: session.user.id,
              planId: usuario.plan.id,
              estado: 'activa',
              fechaInicio: new Date(),
              fechaVencimiento: usuario.plan.nombre.toLowerCase().includes('lifetime') 
                ? new Date('2099-12-31') // Fecha muy lejana para lifetime
                : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año para gratuito
              metodoPago: usuario.plan.nombre.toLowerCase().includes('lifetime') ? 'grandfathered' : 'gratuito',
              referenciaPago: 'auto_asignado',
              autoRenovacion: false,
              montoMensual: 0,
              montoTotal: 0,
              observaciones: `Suscripción ${usuario.plan.nombre} creada automáticamente`
            },
            include: {
              plan: {
                select: {
                  id: true,
                  nombre: true,
                  descripcion: true,
                  colorHex: true,
                  precioMensual: true,
                  esPago: true
                }
              }
            }
          })

          return NextResponse.json({
            id: nuevaSuscripcion.id,
            planId: nuevaSuscripcion.planId,
            estado: nuevaSuscripcion.estado,
            fechaInicio: nuevaSuscripcion.fechaInicio,
            fechaVencimiento: nuevaSuscripcion.fechaVencimiento,
            monto: nuevaSuscripcion.montoMensual || 0,
            plan: {
              nombre: nuevaSuscripcion.plan.nombre,
              descripcion: nuevaSuscripcion.plan.descripcion || '',
              colorHex: nuevaSuscripcion.plan.colorHex || '#6b7280'
            }
          })
        }
      }

      // No tiene suscripción activa ni plan asignado
      return NextResponse.json({ 
        error: 'No tienes suscripción activa',
        needsSubscription: true 
      }, { status: 404 })
    }

    // Formatear respuesta
    const response = {
      id: suscripcion.id,
      planId: suscripcion.planId,
      estado: suscripcion.estado,
      fechaInicio: suscripcion.fechaInicio,
      fechaVencimiento: suscripcion.fechaVencimiento,
      monto: suscripcion.montoMensual || suscripcion.plan?.precioMensual || 0,
      plan: {
        nombre: suscripcion.plan?.nombre || 'Plan Desconocido',
        descripcion: suscripcion.plan?.descripcion || '',
        colorHex: suscripcion.plan?.colorHex || '#6b7280'
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error obteniendo suscripción actual:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 