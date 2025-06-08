import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { planId } = await request.json()

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID requerido' }, { status: 400 })
    }

    // Verificar que el plan existe
    const plan = await prisma.plan.findUnique({
      where: { id: planId }
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
    }

    if (!plan.esPago) {
      return NextResponse.json({ error: 'Este plan es gratuito' }, { status: 400 })
    }

    // Por ahora, simular la creación de pago
    return NextResponse.json({
      success: true,
      planId: plan.id,
      planNombre: plan.nombre,
      monto: plan.precioMensual,
      checkoutUrl: null, // TODO: Integrar con MercadoPago
      message: `Preparando pago para el plan ${plan.nombre} - $${plan.precioMensual}`
    })

  } catch (error) {
    console.error('Error creando pago:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 