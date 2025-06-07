import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: idParam } = await params
    const recurrenteId = parseInt(idParam)
    
    if (isNaN(recurrenteId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    // Obtener el gasto recurrente
    const gastoRecurrente = await prisma.gastoRecurrente.findFirst({
      where: {
        id: recurrenteId,
        userId: session.user.id
      },
      include: {
        categoria: true
      }
    })

    if (!gastoRecurrente) {
      return NextResponse.json({ error: 'Gasto recurrente no encontrado' }, { status: 404 })
    }

    // Calcular próxima fecha basada en periodicidad
    const calcularProximaFecha = (fechaActual: Date, periodicidad: string): Date => {
      const nuevaFecha = new Date(fechaActual)
      
      switch (periodicidad.toLowerCase()) {
        case 'mensual':
          nuevaFecha.setMonth(nuevaFecha.getMonth() + 1)
          break
        case 'bimestral':
          nuevaFecha.setMonth(nuevaFecha.getMonth() + 2)
          break
        case 'trimestral':
          nuevaFecha.setMonth(nuevaFecha.getMonth() + 3)
          break
        case 'semestral':
          nuevaFecha.setMonth(nuevaFecha.getMonth() + 6)
          break
        case 'anual':
          nuevaFecha.setFullYear(nuevaFecha.getFullYear() + 1)
          break
        default:
          nuevaFecha.setMonth(nuevaFecha.getMonth() + 1) // Default a mensual
      }
      
      return nuevaFecha
    }

    const ahora = new Date()

    // Usar transacción para crear el gasto y actualizar el recurrente
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear el gasto con relación al recurrente
      const nuevoGasto = await tx.gasto.create({
        data: {
          concepto: gastoRecurrente.concepto,
          monto: gastoRecurrente.monto,
          fecha: ahora,
          categoria: gastoRecurrente.categoria?.descripcion || 'Sin categoría',
          tipoTransaccion: 'expense',
          tipoMovimiento: (gastoRecurrente as any).tipoMovimiento || 'efectivo',
          userId: session.user.id!,
          categoriaId: gastoRecurrente.categoriaId,
          gastoRecurrenteId: gastoRecurrente.id
        },
        include: {
          categoriaRel: true,
          gastoRecurrente: true
        }
      })

      // Actualizar el gasto recurrente
      const proximaFecha = calcularProximaFecha(ahora, gastoRecurrente.periodicidad)
      
      const gastoRecurrenteActualizado = await tx.gastoRecurrente.update({
        where: { id: gastoRecurrente.id },
        data: {
          ultimoPago: ahora,
          proximaFecha: proximaFecha,
          estado: 'pagado', // Estado automático
          updatedAt: ahora
        },
        include: {
          categoria: true,
          gastosGenerados: {
            orderBy: { createdAt: 'desc' },
            take: 5 // Últimos 5 pagos generados
          }
        }
      })

      return {
        gasto: nuevoGasto,
        gastoRecurrente: gastoRecurrenteActualizado
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Pago generado exitosamente',
      data: resultado
    })

  } catch (error) {
    console.error('Error al generar pago:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 