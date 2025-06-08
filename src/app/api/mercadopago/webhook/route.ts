import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { MercadoPagoAR, MPSuscripciones } from '@/lib/mercadopago'

// ✅ WEBHOOK MERCADOPAGO PARA SUSCRIPCIONES
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📬 Webhook MercadoPago recibido:', body)
    
    // Verificar que es una notificación de payment
    if (body.type !== 'payment' || !body.data?.id) {
      console.log('❌ Webhook ignorado - no es de payment:', body.type)
      return NextResponse.json({ status: 'ignored' }, { status: 200 })
    }
    
    const paymentId = body.data.id
    
    // Obtener datos del pago desde MercadoPago
    const paymentData = await MercadoPagoAR.payment.get({ id: paymentId })
    
    if (!paymentData) {
      console.error('❌ No se pudo obtener datos del payment:', paymentId)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }
    
    console.log('💳 Datos del payment:', {
      id: paymentData.id,
      status: paymentData.status,
      external_reference: paymentData.external_reference
    })
    
    // Parsear external_reference para obtener datos de suscripción
    const refData = MPSuscripciones.parsearExternalReference(paymentData.external_reference || '')
    
    if (!refData || refData.tipo !== 'suscripcion') {
      console.log('❌ External reference no válido para suscripción:', paymentData.external_reference)
      return NextResponse.json({ status: 'ignored' }, { status: 200 })
    }
    
    // Buscar el registro de pago en la base de datos
    let pagoSuscripcion = await prisma.pagoSuscripcionMP.findUnique({
      where: { mpExternalReference: paymentData.external_reference || '' },
      include: {
        suscripcion: true,
        plan: true,
        user: true
      }
    })
    
    // Si no existe, crear el registro (webhook llegó antes que nosotros lo creáramos)
    if (!pagoSuscripcion) {
      console.log('⚠️ Pago no encontrado en DB, buscando suscripción...')
      
      const suscripcion = await prisma.suscripcion.findUnique({
        where: { id: refData.suscripcionId },
        include: { plan: true, user: true }
      })
      
      if (!suscripcion) {
        console.error('❌ Suscripción no encontrada:', refData.suscripcionId)
        return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
      }
      
      // Crear el registro de pago
      pagoSuscripcion = await prisma.pagoSuscripcionMP.create({
        data: {
          userId: suscripcion.userId,
          suscripcionId: suscripcion.id,
          planId: suscripcion.planId,
          concepto: `Suscripción ${suscripcion.plan.nombre} - ${refData.mes}/${refData.año}`,
          monto: suscripcion.plan.precioMensual || 0,
          mpPaymentId: paymentData.id,
          mpExternalReference: paymentData.external_reference || '',
          mpStatus: paymentData.status as any,
          mpPaymentType: paymentData.payment_type_id as any,
          mpPaymentMethod: paymentData.payment_method_id,
          tipoPago: refData.tipoPago,
          mesFacturado: refData.mes,
          añoFacturado: refData.año
        },
        include: {
          suscripcion: true,
          plan: true,
          user: true
        }
      })
    }
    
    // Registrar el webhook
    await prisma.webhookMercadoPago.create({
      data: {
        pagoSuscripcionId: pagoSuscripcion.id,
        mpResource: body.type,
        mpTopic: body.data?.type || 'payment',
        mpId: paymentId.toString(),
        mpUserId: body.user_id?.toString(),
        mpLiveMode: body.live_mode !== false,
        webhookData: body,
        procesado: false
      }
    })
    
    // Procesar según el estado del pago
    await procesarEstadoPago(pagoSuscripcion.id, paymentData.status)
    
    console.log('✅ Webhook procesado exitosamente')
    return NextResponse.json({ status: 'processed' }, { status: 200 })
    
  } catch (error) {
    console.error('❌ Error procesando webhook MercadoPago:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// ✅ PROCESAR ESTADO DEL PAGO
async function procesarEstadoPago(pagoId: string, status: string) {
  try {
    const pago = await prisma.pagoSuscripcionMP.findUnique({
      where: { id: pagoId },
      include: { suscripcion: true, plan: true, user: true }
    })
    
    if (!pago) {
      console.error('❌ Pago no encontrado para procesar:', pagoId)
      return
    }
    
    // Actualizar estado del pago
    await prisma.pagoSuscripcionMP.update({
      where: { id: pagoId },
      data: {
        mpStatus: status as any,
        fechaProcesado: new Date()
      }
    })
    
    // Procesar según estado
    switch (status) {
      case 'approved':
        await procesarPagoAprobado(pago)
        break
        
      case 'rejected':
      case 'cancelled':
        await procesarPagoRechazado(pago)
        break
        
      case 'pending':
      case 'in_process':
        console.log('⏳ Pago pendiente, esperando confirmación')
        break
        
      default:
        console.log('❓ Estado de pago no manejado:', status)
    }
    
    // Marcar webhook como procesado
    await prisma.webhookMercadoPago.updateMany({
      where: { pagoSuscripcionId: pagoId, procesado: false },
      data: { procesado: true, fechaProcesado: new Date() }
    })
    
  } catch (error) {
    console.error('❌ Error procesando estado del pago:', error)
  }
}

// ✅ PROCESAR PAGO APROBADO
async function procesarPagoAprobado(pago: any) {
  try {
    console.log('✅ Procesando pago aprobado:', pago.id)
    
    // Calcular fecha de vencimiento (30 días desde el pago)
    const fechaVencimiento = new Date()
    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1)
    
    // Actualizar pago
    await prisma.pagoSuscripcionMP.update({
      where: { id: pago.id },
      data: {
        fechaPago: new Date(),
        fechaVencimiento: fechaVencimiento
      }
    })
    
    // Actualizar suscripción
    await prisma.suscripcion.update({
      where: { id: pago.suscripcionId },
      data: {
        estado: 'activa',
        fechaVencimiento: fechaVencimiento,
        fechaProximoPago: fechaVencimiento,
        intentosFallidos: 0
      }
    })
    
    console.log('✅ Suscripción activada hasta:', fechaVencimiento)
    
  } catch (error) {
    console.error('❌ Error procesando pago aprobado:', error)
  }
}

// ✅ PROCESAR PAGO RECHAZADO
async function procesarPagoRechazado(pago: any) {
  try {
    console.log('❌ Procesando pago rechazado:', pago.id)
    
    // Incrementar intentos fallidos
    await prisma.suscripcion.update({
      where: { id: pago.suscripcionId },
      data: {
        intentosFallidos: { increment: 1 }
      }
    })
    
    // Si hay muchos intentos fallidos, suspender suscripción
    const suscripcion = await prisma.suscripcion.findUnique({
      where: { id: pago.suscripcionId }
    })
    
    if (suscripcion && suscripcion.intentosFallidos >= 3) {
      await prisma.suscripcion.update({
        where: { id: pago.suscripcionId },
        data: { estado: 'suspendida' }
      })
      console.log('⚠️ Suscripción suspendida por intentos fallidos')
    }
    
  } catch (error) {
    console.error('❌ Error procesando pago rechazado:', error)
  }
}

// GET para verificación de MercadoPago
export async function GET() {
  return NextResponse.json({ status: 'Webhook MercadoPago activo' })
} 