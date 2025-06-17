import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { codigo } = await request.json()
    
    if (!codigo || typeof codigo !== 'string') {
      return NextResponse.json({ error: 'Código inválido' }, { status: 400 })
    }

    // Buscar usuario
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { plan: true }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Buscar código promocional
    const codigoPromo = await prisma.codigoPromocional.findUnique({
      where: { codigo: codigo.toUpperCase() },
      include: {
        usos: {
          where: { userId: usuario.id }
        }
      }
    })

    if (!codigoPromo) {
      return NextResponse.json({ 
        error: 'Código promocional no válido',
        codigo: 'CODIGO_INVALIDO'
      }, { status: 400 })
    }

    // Validaciones
    if (!codigoPromo.activo) {
      return NextResponse.json({ 
        error: 'Este código promocional ya no está activo',
        codigo: 'CODIGO_INACTIVO'
      }, { status: 400 })
    }

    if (codigoPromo.fechaVencimiento && codigoPromo.fechaVencimiento < new Date()) {
      return NextResponse.json({ 
        error: 'Este código promocional ha expirado',
        codigo: 'CODIGO_EXPIRADO'
      }, { status: 400 })
    }

    if (codigoPromo.usos.length > 0) {
      return NextResponse.json({ 
        error: 'Ya has usado este código promocional',
        codigo: 'CODIGO_YA_USADO'
      }, { status: 400 })
    }

    if (codigoPromo.usosMaximos && codigoPromo.usoActual >= codigoPromo.usosMaximos) {
      return NextResponse.json({ 
        error: 'Este código promocional ha alcanzado su límite de usos',
        codigo: 'CODIGO_AGOTADO'
      }, { status: 400 })
    }

    // Obtener el plan de destino
    const planDestino = await prisma.plan.findUnique({
      where: { id: codigoPromo.planId }
    })

    if (!planDestino) {
      return NextResponse.json({ 
        error: 'Plan asociado al código no válido',
        codigo: 'PLAN_INVALIDO'
      }, { status: 400 })
    }

    // Canjear código
    await prisma.$transaction(async (tx) => {
      // Actualizar plan del usuario
      await tx.user.update({
        where: { id: usuario.id },
        data: { planId: codigoPromo.planId }
      })

      // Registrar uso del código
      await tx.usoCodigoPromocional.create({
        data: {
          codigoId: codigoPromo.id,
          userId: usuario.id,
          planAnterior: usuario.planId,
          planNuevo: codigoPromo.planId,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        }
      })

      // Incrementar contador de uso
      await tx.codigoPromocional.update({
        where: { id: codigoPromo.id },
        data: { usoActual: { increment: 1 } }
      })

      // Si es un plan premium de por vida, crear suscripción
      if (planDestino.nombre === 'Premium de por Vida') {
        await tx.suscripcion.create({
          data: {
            userId: usuario.id,
            planId: codigoPromo.planId,
            estado: 'activa',
            metodoPago: 'codigo_promocional',
            referenciaPago: `codigo-${codigoPromo.codigo}`,
            autoRenovacion: false,
            montoMensual: 0,
            montoTotal: 0,
            observaciones: `Plan obtenido con código promocional: ${codigoPromo.codigo}`
          }
        })
      }
    })

    return NextResponse.json({
      success: true,
      mensaje: 'Código promocional canjeado exitosamente',
      planAnterior: usuario.plan?.nombre || 'Sin plan',
      planNuevo: planDestino.nombre,
      descripcion: codigoPromo.descripcion || `Has obtenido el plan ${planDestino.nombre}`
    })

  } catch (error) {
    console.error('Error canjeando código promocional:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
} 