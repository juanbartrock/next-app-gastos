import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Por ahora simulamos datos hasta tener el modelo completo
    const mockSuscripcion = {
      id: 'mock-123',
      planId: 'plan-premium',
      estado: 'ACTIVE',
      fechaInicio: new Date('2025-01-01'),
      fechaVencimiento: new Date('2025-02-01'),
      monto: 9.99,
      plan: {
        nombre: 'Premium',
        descripcion: 'Plan completo con todas las funcionalidades',
        colorHex: '#9333ea'
      }
    }

    return NextResponse.json(mockSuscripcion)

  } catch (error) {
    console.error('Error obteniendo suscripción actual:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 