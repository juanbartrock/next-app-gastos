import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'
import { MercadoPagoAR, MPSuscripciones } from '@/lib/mercadopago'

// API para procesar renovaciones automáticas (se ejecuta diariamente)
export async function POST(request: NextRequest) {
  try {
    // Esta API puede ser llamada por un cron job o manualmente por admins
    const session = await getServerSession(authOptions)
    
    // Solo admins pueden ejecutar esta función manualmente
    if (session && !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Solo administradores pueden ejecutar esto' }, { status: 403 })
    }

    const hoy = new Date()
    const mañana = new Date(hoy)
    mañana.setDate(mañana.getDate() + 1)

    console.log('🔄 Procesando renovaciones automáticas para:', hoy.toISOString())

    // Buscar suscripciones que necesitan renovación
    const suscripcionesARenovar = await prisma.suscripcion.findMany({
      where: {
        estado: 'activa',
        autoRenovacion: true,
        fechaVencimiento: {
          lte: mañana // Vencen hoy o mañana
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        plan: {
          select: {
            id: true,
            nombre: true,
            precioMensual: true,
            esPago: true
          }
        }
      }
    })

    console.log(`📋 Encontradas ${suscripcionesARenovar.length} suscripciones para renovar`)

    const resultados = {
      procesadas: 0,
      exitosas: 0,
      fallidas: 0,
      detalles: [] as any[]
    }

    for (const suscripcion of suscripcionesARenovar) {
      resultados.procesadas++

      try {
        // Solo procesar planes de pago
        if (!suscripcion.plan.esPago || !suscripcion.plan.precioMensual) {
          // Planes gratuitos/lifetime se renuevan automáticamente
          const nuevaFechaVencimiento = new Date(hoy)
          nuevaFechaVencimiento.setFullYear(nuevaFechaVencimiento.getFullYear() + 1)

          await prisma.suscripcion.update({
            where: { id: suscripcion.id },
            data: {
              fechaVencimiento: nuevaFechaVencimiento,
              updatedAt: new Date()
            }
          })

          resultados.exitosas++
          resultados.detalles.push({
            suscripcionId: suscripcion.id,
            usuario: suscripcion.user.email,
            plan: suscripcion.plan.nombre,
            estado: 'renovado_automatico',
            motivo: 'Plan gratuito/lifetime'
          })
          continue
        }

        // Para planes de pago, crear preferencia de MercadoPago
        if (MercadoPagoAR.isEnabled) {
          const mesFacturado = hoy.getMonth() + 1
          const añoFacturado = hoy.getFullYear()

          const preferenceData = await MPSuscripciones.crearPreferenciaSuscripcion({
            planNombre: suscripcion.plan.nombre,
            planPrecio: suscripcion.plan.precioMensual,
            usuarioId: suscripcion.user.id,
            suscripcionId: suscripcion.id,
            planId: suscripcion.plan.id,
            tipoPago: 'renovacion',
            mesFacturado,
            añoFacturado
          })

          if (preferenceData) {
            // Crear registro de pago pendiente
            await prisma.pagoSuscripcionMP.create({
              data: {
                userId: suscripcion.user.id,
                suscripcionId: suscripcion.id,
                planId: suscripcion.plan.id,
                concepto: `Renovación ${suscripcion.plan.nombre} - ${mesFacturado}/${añoFacturado}`,
                monto: suscripcion.plan.precioMensual,
                mpPreferenceId: preferenceData.id,
                mpExternalReference: preferenceData.external_reference,
                mpStatus: 'PENDING',
                tipoPago: 'renovacion',
                mesFacturado,
                añoFacturado
              }
            })

            // Enviar notificación al usuario (por email/WhatsApp)
            // TODO: Implementar envío de notificaciones
            console.log(`📧 Notificar a ${suscripcion.user.email} sobre renovación pendiente`)

            // Dar gracia de 7 días antes de suspender
            const nuevaFechaVencimiento = new Date(hoy)
            nuevaFechaVencimiento.setDate(nuevaFechaVencimiento.getDate() + 7)

            await prisma.suscripcion.update({
              where: { id: suscripcion.id },
              data: {
                fechaVencimiento: nuevaFechaVencimiento,
                estado: 'pendiente_renovacion',
                intentosFallidos: (suscripcion.intentosFallidos || 0) + 1,
                observaciones: `Renovación automática iniciada el ${hoy.toLocaleString('es-AR')}`,
                updatedAt: new Date()
              }
            })

            resultados.exitosas++
            resultados.detalles.push({
              suscripcionId: suscripcion.id,
              usuario: suscripcion.user.email,
              plan: suscripcion.plan.nombre,
              estado: 'pendiente_pago',
              preferenceId: preferenceData.id,
              checkoutUrl: preferenceData.init_point
            })
          } else {
            throw new Error('Error creando preference en MercadoPago')
          }
        } else {
          // Si MercadoPago no está configurado, suspender suscripción
          await prisma.suscripcion.update({
            where: { id: suscripcion.id },
            data: {
              estado: 'suspendida',
              observaciones: `Suspendida por falta de configuración de pagos el ${hoy.toLocaleString('es-AR')}`,
              updatedAt: new Date()
            }
          })

          resultados.exitosas++
          resultados.detalles.push({
            suscripcionId: suscripcion.id,
            usuario: suscripcion.user.email,
            plan: suscripcion.plan.nombre,
            estado: 'suspendida',
            motivo: 'MercadoPago no configurado'
          })
        }

      } catch (error) {
        console.error(`❌ Error procesando suscripción ${suscripcion.id}:`, error)
        resultados.fallidas++
        resultados.detalles.push({
          suscripcionId: suscripcion.id,
          usuario: suscripcion.user.email,
          plan: suscripcion.plan.nombre,
          estado: 'error',
          error: error.message
        })
      }
    }

    console.log('✅ Procesamiento de renovaciones completado:', resultados)

    return NextResponse.json({
      success: true,
      mensaje: 'Procesamiento de renovaciones completado',
      resultados
    })

  } catch (error) {
    console.error('❌ Error en procesamiento de renovaciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// API para obtener estado de renovaciones (GET)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
    }

    const hoy = new Date()
    const enUnaSeamana = new Date(hoy)
    enUnaSeamana.setDate(enUnaSeamana.getDate() + 7)

    // Estadísticas de suscripciones
    const stats = await prisma.suscripcion.groupBy({
      by: ['estado'],
      _count: {
        id: true
      }
    })

    // Suscripciones que vencen pronto
    const proximasARenovar = await prisma.suscripcion.findMany({
      where: {
        estado: 'activa',
        fechaVencimiento: {
          lte: enUnaSeamana
        }
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        },
        plan: {
          select: {
            nombre: true,
            precioMensual: true
          }
        }
      },
      orderBy: {
        fechaVencimiento: 'asc'
      }
    })

    return NextResponse.json({
      stats: stats.reduce((acc, stat) => {
        acc[stat.estado] = stat._count.id
        return acc
      }, {} as Record<string, number>),
      proximasARenovar: proximasARenovar.map(s => ({
        id: s.id,
        usuario: s.user.email,
        plan: s.plan.nombre,
        fechaVencimiento: s.fechaVencimiento,
        monto: s.plan.precioMensual,
        diasRestantes: Math.ceil((s.fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
      }))
    })

  } catch (error) {
    console.error('Error obteniendo estado de renovaciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 