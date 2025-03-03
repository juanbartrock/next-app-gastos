import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const gastos = await prisma.gasto.findMany({
      orderBy: {
        fecha: 'desc'
      }
    })
    return NextResponse.json(gastos)
  } catch (error) {
    console.error('Error al obtener gastos:', error)
    return NextResponse.json(
      { error: 'Error al obtener los gastos' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { concepto, monto, categoria, tipoTransaccion, tipoMovimiento, fecha } = await request.json()

    const gasto = await prisma.gasto.create({
      data: {
        concepto,
        monto,
        categoria,
        tipoTransaccion: tipoTransaccion || 'expense',
        tipoMovimiento: tipoMovimiento || 'efectivo',
        fecha: fecha || new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json(gasto)
  } catch (error) {
    console.error('Error al crear gasto:', error)
    return NextResponse.json(
      { error: 'Error al crear el gasto' },
      { status: 500 }
    )
  }
} 