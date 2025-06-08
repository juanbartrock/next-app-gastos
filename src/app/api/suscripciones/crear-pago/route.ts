import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'
import { MercadoPagoAR, MPSuscripciones } from '@/lib/mercadopago'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { 
      planId, 
      tipoPago = 'inicial',
      montoCustom,
      conceptoCustom
    } = await request.json()

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID requerido' }, { status: 400 })
    }

    // Verificar si MercadoPago está habilitado
    if (!MercadoPagoAR.isEnabled || !MercadoPagoAR.preference) {
      return NextResponse.json({ 
        error: 'MercadoPago no configurado',
        message: 'Configura MERCADOPAGO_ACCESS_TOKEN en las variables de entorno'
      }, { status: 503 })
    }

    // Para testing, usar datos personalizados o planes predefinidos
    let planData
    
    if (planId === 'test-plan-premium' || montoCustom) {
      // Plan de prueba o monto personalizado
      planData = {
        id: planId,
        nombre: conceptoCustom || 'Plan Premium Test',
        precioMensual: montoCustom || 999,
        esPago: true
      }
    } else {
      // Buscar plan real en la base de datos
      const plan = await prisma.plan.findUnique({
        where: { id: planId }
      })

      if (!plan) {
        return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
      }

      if (!plan.esPago) {
        return NextResponse.json({ error: 'Este plan es gratuito' }, { status: 400 })
      }

      planData = plan
    }

    // Buscar o crear suscripción
    let suscripcion = await prisma.suscripcion.findFirst({
      where: { 
        userId: session.user.id,
        planId: planData.id
      }
    })

    if (!suscripcion) {
      // Crear nueva suscripción
      suscripcion = await prisma.suscripcion.create({
        data: {
          userId: session.user.id,
          planId: planData.id,
          estado: 'pendiente',
          fechaInicio: new Date(),
          fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
          monto: planData.precioMensual || 0
        }
      })
    }

    // Crear preference de MercadoPago
    const mesActual = new Date().getMonth() + 1
    const añoActual = new Date().getFullYear()

    const preferenceData = await MPSuscripciones.crearPreferenciaSuscripcion({
      planNombre: planData.nombre,
      planPrecio: planData.precioMensual || 0,
      usuarioId: session.user.id,
      suscripcionId: suscripcion.id,
      planId: planData.id,
      tipoPago: tipoPago as any,
      mesFacturado: mesActual,
      añoFacturado: añoActual
    })

    if (!preferenceData) {
      return NextResponse.json({ 
        error: 'Error creando preference en MercadoPago' 
      }, { status: 500 })
    }

    // Registrar el pago en la base de datos
    const pagoSuscripcion = await prisma.pagoSuscripcionMP.create({
      data: {
        userId: session.user.id,
        suscripcionId: suscripcion.id,
        planId: planData.id,
        concepto: `Suscripción ${planData.nombre} - ${mesActual}/${añoActual}`,
        monto: planData.precioMensual || 0,
        mpPaymentId: null, // Se asignará cuando se confirme el pago
        mpPreferenceId: preferenceData.id, // El preference ID
        mpExternalReference: preferenceData.external_reference,
        mpStatus: 'PENDING',
        tipoPago: tipoPago as any,
        mesFacturado: mesActual,
        añoFacturado: añoActual
      }
    })

    console.log('✅ Pago creado exitosamente:', {
      payment_id: pagoSuscripcion.id,
      preference_id: preferenceData.id,
      init_point: preferenceData.init_point
    })

    // Construir URLs de retorno
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    return NextResponse.json({
      success: true,
      payment_id: pagoSuscripcion.id,
      preference_id: preferenceData.id,
      external_reference: preferenceData.external_reference,
      init_point: preferenceData.init_point,
      sandbox_init_point: preferenceData.sandbox_init_point,
      planId: planData.id,
      planNombre: planData.nombre,
      monto: planData.precioMensual,
      suscripcionId: suscripcion.id,
      success_url: `${baseUrl}/suscripcion/exito`,
      failure_url: `${baseUrl}/suscripcion/fallo`,
      pending_url: `${baseUrl}/suscripcion/pendiente`,
      message: `Pago creado para ${planData.nombre} - $${planData.precioMensual}`
    })

  } catch (error) {
    console.error('❌ Error creando pago:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 