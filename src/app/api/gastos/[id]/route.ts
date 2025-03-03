import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const { concepto, monto, categoria, tipoTransaccion, tipoMovimiento, fecha } = await request.json()

    const gasto = await prisma.gasto.update({
      where: { id },
      data: {
        concepto,
        monto,
        categoria,
        tipoTransaccion,
        tipoMovimiento,
        fecha: fecha ? new Date(fecha) : new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json(gasto)
  } catch (error) {
    console.error('Error al actualizar el gasto:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el gasto' },
      { status: 500 }
    )
  }
} 