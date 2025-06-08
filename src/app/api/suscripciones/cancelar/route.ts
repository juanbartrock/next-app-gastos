import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { suscripcionId } = await request.json()

    if (!suscripcionId) {
      return NextResponse.json({ error: 'Suscripción ID requerido' }, { status: 400 })
    }

    // Por ahora simulamos la cancelación
    console.log('Cancelando suscripción:', suscripcionId)

    return NextResponse.json({
      success: true,
      message: 'Suscripción cancelada correctamente',
      suscripcionId
    })

  } catch (error) {
    console.error('Error cancelando suscripción:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 