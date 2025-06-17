import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'

// API para limpiar suscripciones vencidas y hacer downgrade a plan gratuito
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Solo admins pueden ejecutar esta función manualmente
    if (session && session.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { isAdmin: true }
      })
      
      if (!user?.isAdmin) {
        return NextResponse.json({ error: 'Solo administradores pueden ejecutar esto' }, { status: 403 })
      }
    }

    const hoy = new Date()
    console.log('🧹 Iniciando limpieza de suscripciones vencidas:', hoy.toISOString())

    // Buscar suscripciones vencidas
    const suscripcionesVencidas = await prisma.suscripcion.findMany({
      where: {
        estado: {
          in: ['activa', 'pendiente_renovacion']
        },
        fechaVencimiento: {
          lt: hoy // Vencidas (fecha de vencimiento anterior a hoy)
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            planId: true
          }
        },
        plan: {
          select: {
            id: true,
            nombre: true,
            esPago: true
          }
        }
      }
    })

    console.log(`📋 Encontradas ${suscripcionesVencidas.length} suscripciones vencidas`)

    // Buscar plan gratuito para hacer downgrade
    const planGratuito = await prisma.plan.findFirst({
      where: {
        nombre: {
          contains: 'Gratuito',
          mode: 'insensitive'
        },
        activo: true
      }
    })

    if (!planGratuito) {
      throw new Error('No se encontró plan gratuito para hacer downgrade')
    }

    const resultados = {
      procesadas: 0,
      downgrades: 0,
      expiradas: 0,
      errores: 0,
      detalles: [] as any[]
    }

    for (const suscripcion of suscripcionesVencidas) {
      resultados.procesadas++

      try {
        // Solo hacer downgrade de planes de pago
        if (suscripcion.plan.esPago) {
          // Marcar suscripción como expirada
          await prisma.suscripcion.update({
            where: { id: suscripcion.id },
            data: {
              estado: 'expirada',
              observaciones: `Suscripción expirada y usuario downgradeado a plan gratuito el ${hoy.toLocaleString('es-AR')}`,
              updatedAt: new Date()
            }
          })

          // Cambiar usuario a plan gratuito
          await prisma.user.update({
            where: { id: suscripcion.user.id },
            data: {
              planId: planGratuito.id
            }
          })

          // Crear nueva suscripción gratuita
          await prisma.suscripcion.create({
            data: {
              userId: suscripcion.user.id,
              planId: planGratuito.id,
              estado: 'activa',
              fechaInicio: hoy,
              fechaVencimiento: new Date(hoy.getFullYear() + 1, hoy.getMonth(), hoy.getDate()), // 1 año
              metodoPago: 'gratuito',
              referenciaPago: 'downgrade_automatico',
              autoRenovacion: false,
              montoMensual: 0,
              montoTotal: 0,
              observaciones: `Downgrade automático desde ${suscripcion.plan.nombre} por expiración`
            }
          })

          resultados.downgrades++
          resultados.detalles.push({
            suscripcionId: suscripcion.id,
            usuario: suscripcion.user.email,
            planAnterior: suscripcion.plan.nombre,
            planNuevo: planGratuito.nombre,
            accion: 'downgrade',
            fechaVencimiento: suscripcion.fechaVencimiento
          })

          console.log(`⬇️ Downgrade: ${suscripcion.user.email} de ${suscripcion.plan.nombre} a ${planGratuito.nombre}`)

        } else {
          // Para planes gratuitos/lifetime, solo marcar como expirada si es necesario
          await prisma.suscripcion.update({
            where: { id: suscripcion.id },
            data: {
              estado: 'expirada',
              observaciones: `Suscripción ${suscripcion.plan.nombre} expirada el ${hoy.toLocaleString('es-AR')}`,
              updatedAt: new Date()
            }
          })

          resultados.expiradas++
          resultados.detalles.push({
            suscripcionId: suscripcion.id,
            usuario: suscripcion.user.email,
            plan: suscripcion.plan.nombre,
            accion: 'expirada',
            fechaVencimiento: suscripcion.fechaVencimiento
          })
        }

        // TODO: Enviar notificación al usuario sobre la expiración/downgrade
        console.log(`📧 Notificar a ${suscripcion.user.email} sobre expiración de suscripción`)

      } catch (error) {
        console.error(`❌ Error procesando suscripción vencida ${suscripcion.id}:`, error)
        resultados.errores++
        resultados.detalles.push({
          suscripcionId: suscripcion.id,
          usuario: suscripcion.user.email,
          plan: suscripcion.plan.nombre,
          accion: 'error',
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
      }
    }

    console.log('✅ Limpieza de suscripciones vencidas completada:', resultados)

    return NextResponse.json({
      success: true,
      mensaje: 'Limpieza de suscripciones vencidas completada',
      resultados
    })

  } catch (error) {
    console.error('❌ Error en limpieza de suscripciones vencidas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// API para obtener estadísticas de suscripciones vencidas (GET)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true }
    })
    
    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
    }

    const hoy = new Date()

    // Contar suscripciones vencidas por estado
    const vencidasActivas = await prisma.suscripcion.count({
      where: {
        estado: 'activa',
        fechaVencimiento: {
          lt: hoy
        }
      }
    })

    const vencidasPendientes = await prisma.suscripcion.count({
      where: {
        estado: 'pendiente_renovacion',
        fechaVencimiento: {
          lt: hoy
        }
      }
    })

    // Suscripciones que vencen en los próximos 3 días
    const enTresDias = new Date(hoy)
    enTresDias.setDate(enTresDias.getDate() + 3)

    const proximas = await prisma.suscripcion.findMany({
      where: {
        estado: 'activa',
        fechaVencimiento: {
          gte: hoy,
          lte: enTresDias
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
      vencidas: {
        activas: vencidasActivas,
        pendientes: vencidasPendientes,
        total: vencidasActivas + vencidasPendientes
      },
      proximasAVencer: proximas.filter(s => s.fechaVencimiento).map(s => ({
        id: s.id,
        usuario: s.user.email,
        plan: s.plan.nombre,
        fechaVencimiento: s.fechaVencimiento!,
        monto: s.plan.precioMensual,
        horasRestantes: Math.ceil((s.fechaVencimiento!.getTime() - hoy.getTime()) / (1000 * 60 * 60))
      }))
    })

  } catch (error) {
    console.error('Error obteniendo estadísticas de vencimientos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 