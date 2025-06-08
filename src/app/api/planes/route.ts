import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Obtener todos los planes ordenados por precio
    const planes = await prisma.plan.findMany({
      orderBy: [
        { esPago: 'asc' }, // Gratis primero
        { precioMensual: 'asc' } // Luego por precio
      ]
    })

    return NextResponse.json(planes)

  } catch (error) {
    console.error('Error obteniendo planes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 