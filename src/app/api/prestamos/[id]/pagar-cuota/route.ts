import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"
import prisma from "@/lib/prisma"
import { addMonths } from "date-fns"

// POST - Registrar el pago de una cuota
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(options)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Obtener el préstamo
    const prestamo = await prisma.prestamo.findFirst({
      where: {
        id: params.id,
        userId: usuario.id
      }
    })

    if (!prestamo) {
      return NextResponse.json(
        { error: 'Préstamo no encontrado' },
        { status: 404 }
      )
    }

    if (prestamo.cuotasPendientes <= 0) {
      return NextResponse.json(
        { error: 'El préstamo ya está completamente pagado' },
        { status: 400 }
      )
    }

    // Obtener datos del pago
    const data = await request.json()
    const {
      montoPagado,
      montoCapital,
      montoInteres,
      montoSeguro = 0,
      montoComision = 0,
      fechaPago,
      fechaVencimiento,
      diasMora = 0,
      interesMora = 0,
      metodoPago,
      comprobante,
      observaciones
    } = data

    // Validaciones
    if (!montoPagado || !montoCapital || !montoInteres || !fechaPago || !fechaVencimiento) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios para el pago' },
        { status: 400 }
      )
    }

    const numeroCuota = prestamo.cuotasPagadas + 1

    // Calcular nueva fecha de próxima cuota
    let nuevaFechaProximaCuota = null
    if (prestamo.cuotasPendientes > 1) {
      nuevaFechaProximaCuota = addMonths(new Date(fechaVencimiento), 1)
    }

    // Calcular nuevo saldo
    const nuevoSaldo = prestamo.saldoActual - montoCapital

    // Usar transacción para asegurar consistencia
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear el registro de pago
      const pago = await tx.pagoPrestamo.create({
        data: {
          prestamoId: prestamo.id,
          numeroCuota,
          montoPagado,
          montoCapital,
          montoInteres,
          montoSeguro,
          montoComision,
          fechaPago: new Date(fechaPago),
          fechaVencimiento: new Date(fechaVencimiento),
          diasMora,
          interesMora,
          metodoPago,
          comprobante,
          observaciones
        }
      })

      // Actualizar el préstamo
      const prestamoActualizado = await tx.prestamo.update({
        where: { id: prestamo.id },
        data: {
          cuotasPagadas: prestamo.cuotasPagadas + 1,
          cuotasPendientes: prestamo.cuotasPendientes - 1,
          saldoActual: nuevoSaldo,
          fechaProximaCuota: nuevaFechaProximaCuota,
          estado: prestamo.cuotasPendientes === 1 ? 'pagado' : prestamo.estado,
          updatedAt: new Date()
        }
      })

      // Registrar el pago como un gasto en el sistema
      const conceptoPago = `Cuota ${numeroCuota}/${prestamo.plazoMeses}: ${prestamo.entidadFinanciera} - ${prestamo.tipoCredito}`
      
      // Buscar o crear categoría para pagos de préstamos
      let categoriaPrestamo = await tx.categoria.findFirst({
        where: {
          descripcion: "Pago Préstamo",
          status: true
        }
      })

      if (!categoriaPrestamo) {
        categoriaPrestamo = await tx.categoria.create({
          data: {
            descripcion: "Pago Préstamo",
            grupo_categoria: "Pagos",
            status: true
          }
        })
      }

      // Crear el gasto asociado al pago
      const gastoRegistro = await tx.gasto.create({
        data: {
          concepto: conceptoPago,
          monto: montoPagado,
          fecha: new Date(fechaPago),
          categoria: "Pago Préstamo",
          tipoTransaccion: "expense",
          tipoMovimiento: metodoPago || "transferencia",
          userId: usuario.id,
          categoriaId: categoriaPrestamo.id
        }
      })

      return {
        pago,
        prestamo: prestamoActualizado,
        gastoRegistrado: gastoRegistro
      }
    })

    return NextResponse.json(resultado)
  } catch (error) {
    console.error('Error al registrar pago de cuota:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 