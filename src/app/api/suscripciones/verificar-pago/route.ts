import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'
import { MercadoPagoAR } from '@/lib/mercadopago'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('payment_id')

    if (!paymentId) {
      return NextResponse.json({ error: 'payment_id requerido' }, { status: 400 })
    }

    // Verificar si MercadoPago está habilitado
    if (!MercadoPagoAR.isEnabled || !MercadoPagoAR.payment) {
      return NextResponse.json({ 
        error: 'MercadoPago no configurado',
        status: 'unavailable'
      }, { status: 503 })
    }

    // Buscar el pago en nuestra base de datos
    const pagoLocal = await prisma.pagoSuscripcionMP.findFirst({
      where: { 
        mpPaymentId: paymentId,
        userId: session.user.id
      },
      include: {
        suscripcion: true,
        plan: true
      }
    })

    // Si tenemos el pago localmente, devolver su estado
    if (pagoLocal) {
      return NextResponse.json({
        payment_id: paymentId,
        status: pagoLocal.mpStatus,
        amount: pagoLocal.monto,
        external_reference: pagoLocal.mpExternalReference,
        local_status: pagoLocal.mpStatus,
        subscription_id: pagoLocal.suscripcionId,
        plan_name: pagoLocal.plan?.nombre,
        processed_at: pagoLocal.fechaProcesado
      })
    }

    // Si no está en la BD, consultar directamente a MercadoPago
    try {
      const paymentData = await MercadoPagoAR.payment.get({ id: paymentId })
      
      if (!paymentData) {
        return NextResponse.json({ 
          error: 'Pago no encontrado',
          status: 'not_found'
        }, { status: 404 })
      }

      // Verificar que el pago pertenece al usuario actual
      const externalRef = paymentData.external_reference
      if (externalRef && externalRef.includes('USER_' + session.user.id)) {
        return NextResponse.json({
          payment_id: paymentId,
          status: paymentData.status,
          status_detail: paymentData.status_detail,
          amount: paymentData.transaction_amount,
          external_reference: paymentData.external_reference,
          payment_method: paymentData.payment_method_id,
          payment_type: paymentData.payment_type_id,
          created_at: paymentData.date_created,
          processed_at: paymentData.date_last_updated
        })
      } else {
        return NextResponse.json({ 
          error: 'Pago no autorizado para este usuario',
          status: 'unauthorized'
        }, { status: 403 })
      }

    } catch (mpError: any) {
      console.error('Error consultando MercadoPago:', mpError)
      
      // Si es un error de no encontrado, devolver 404
      if (mpError.status === 404) {
        return NextResponse.json({ 
          error: 'Pago no encontrado en MercadoPago',
          status: 'not_found'
        }, { status: 404 })
      }
      
      return NextResponse.json({ 
        error: 'Error consultando estado del pago',
        status: 'error',
        details: mpError.message
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error verificando pago:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      status: 'error'
    }, { status: 500 })
  }
}

// POST para actualizar estado manualmente (para debugging)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { paymentId, forceSync } = await request.json()

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId requerido' }, { status: 400 })
    }

    if (!MercadoPagoAR.isEnabled || !MercadoPagoAR.payment) {
      return NextResponse.json({ error: 'MercadoPago no configurado' }, { status: 503 })
    }

    // Obtener datos actualizados de MercadoPago
    const paymentData = await MercadoPagoAR.payment.get({ id: paymentId })
    
    if (!paymentData) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
    }

    // Buscar y actualizar el pago en nuestra BD
    const pagoExistente = await prisma.pagoSuscripcionMP.findFirst({
      where: { 
        mpPaymentId: paymentId,
        userId: session.user.id
      }
    })

    if (pagoExistente) {
      // Actualizar estado
      const pagoActualizado = await prisma.pagoSuscripcionMP.update({
        where: { id: pagoExistente.id },
        data: {
          mpStatus: paymentData.status as any,
          fechaProcesado: new Date()
        },
        include: {
          suscripcion: true,
          plan: true
        }
      })

      // Si el pago fue aprobado, actualizar suscripción
      if (paymentData.status === 'approved' && pagoExistente.mpStatus !== 'approved') {
        const fechaVencimiento = new Date()
        fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1)

        await prisma.suscripcion.update({
          where: { id: pagoActualizado.suscripcionId },
          data: {
            estado: 'activa',
            fechaVencimiento: fechaVencimiento,
            fechaProximoPago: fechaVencimiento,
            intentosFallidos: 0
          }
        })
      }

      return NextResponse.json({
        message: 'Pago sincronizado correctamente',
        payment_id: paymentId,
        status: paymentData.status,
        updated: true
      })
    }

    return NextResponse.json({ 
      error: 'Pago no encontrado en base de datos local',
      payment_id: paymentId,
      mp_status: paymentData.status
    }, { status: 404 })

  } catch (error) {
    console.error('Error sincronizando pago:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 