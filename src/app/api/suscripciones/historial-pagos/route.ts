import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Por ahora simulamos datos hasta tener el modelo completo
    const mockHistorialPagos = {
      pagos: [
        {
          id: 'pago-123',
          concepto: 'Suscripción Premium - Enero 2025',
          monto: 9.99,
          fechaCreacion: new Date('2025-01-01'),
          fechaPago: new Date('2025-01-01'),
          estado: 'APPROVED',
          tipoPago: 'inicial'
        },
        {
          id: 'pago-124',
          concepto: 'Suscripción Premium - Febrero 2025',
          monto: 9.99,
          fechaCreacion: new Date('2025-02-01'),
          fechaPago: null,
          estado: 'PENDING',
          tipoPago: 'renovacion'
        }
      ]
    }

    return NextResponse.json(mockHistorialPagos)

  } catch (error) {
    console.error('Error obteniendo historial de pagos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 