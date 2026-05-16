import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'

// Mapea el medioPago del servicio al tipoMovimiento del gasto
function mapMedioPagoToTipoMovimiento(medioPago: string): string {
  const mp = medioPago.toLowerCase()
  if (mp.includes('crédito') || mp.includes('credito')) {
    return 'tarjeta'
  }
  if (mp.includes('débito automático') || mp.includes('debito automatico') ||
      mp.includes('débito auto') || mp.includes('debito auto')) {
    return 'debito_automatico'
  }
  if (mp.includes('efectivo')) {
    return 'efectivo'
  }
  // Transferencia, débito simple, digital, u otro
  return 'digital'
}

// Calcula la próxima fecha de cobro según la periodicidad indicada en medioPago
function calcularProximaFechaCobro(fechaBase: Date, medioPago: string): Date {
  const mp = medioPago.toLowerCase()
  const nuevaFecha = new Date(fechaBase)

  if (mp.includes('anual')) {
    nuevaFecha.setFullYear(nuevaFecha.getFullYear() + 1)
  } else if (mp.includes('trimestral')) {
    nuevaFecha.setMonth(nuevaFecha.getMonth() + 3)
  } else if (mp.includes('semestral')) {
    nuevaFecha.setMonth(nuevaFecha.getMonth() + 6)
  } else if (mp.includes('bimestral')) {
    nuevaFecha.setMonth(nuevaFecha.getMonth() + 2)
  } else {
    // Default: mensual
    nuevaFecha.setMonth(nuevaFecha.getMonth() + 1)
  }

  return nuevaFecha
}

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
    const servicioId = parseInt(idParam)

    if (isNaN(servicioId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    // Obtener el servicio
    const servicio = await prisma.servicio.findFirst({
      where: {
        id: servicioId,
        userId: session.user.id
      }
    })

    if (!servicio) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
    }

    const ahora = new Date()
    const tipoMovimiento = mapMedioPagoToTipoMovimiento(servicio.medioPago)

    // Calcular próxima fecha de cobro para actualizar el servicio
    const fechaBase = servicio.fechaCobro ? new Date(servicio.fechaCobro) : ahora
    const proximaFechaCobro = calcularProximaFechaCobro(fechaBase, servicio.medioPago)

    const resultado = await prisma.$transaction(async (tx) => {
      // Crear el gasto
      const nuevoGasto = await tx.gasto.create({
        data: {
          concepto: servicio.nombre,
          monto: servicio.monto,
          moneda: servicio.moneda || 'ARS',
          fecha: ahora,
          categoria: 'Servicios',
          tipoTransaccion: 'expense',
          tipoMovimiento,
          userId: session.user.id!,
        }
      })

      // Si es tarjeta de crédito, crear registro de financiación (1 cuota)
      // para que el cargo aparezca en la sección de financiación/tarjeta
      if (tipoMovimiento === 'tarjeta') {
        await tx.financiacion.create({
          data: {
            gastoId: nuevoGasto.id,
            userId: session.user.id!,
            cantidadCuotas: 1,
            cuotasPagadas: 0,
            cuotasRestantes: 1,
            montoCuota: servicio.monto,
            fechaPrimerPago: ahora,
            fechaProximoPago: ahora,
          }
        })
      }

      // Actualizar la próxima fecha de cobro del servicio
      const servicioActualizado = await tx.servicio.update({
        where: { id: servicio.id },
        data: {
          fechaCobro: proximaFechaCobro,
          updatedAt: ahora
        }
      })

      return {
        gasto: nuevoGasto,
        servicio: servicioActualizado,
        tipoMovimiento
      }
    })

    const mensaje = tipoMovimiento === 'tarjeta'
      ? 'Cargo de tarjeta registrado y agregado a financiación'
      : 'Pago generado exitosamente'

    return NextResponse.json({
      success: true,
      message: mensaje,
      data: resultado
    })

  } catch (error) {
    console.error('Error al generar pago de servicio:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
