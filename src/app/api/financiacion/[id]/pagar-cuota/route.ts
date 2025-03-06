import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import { addMonths, format } from 'date-fns'

// POST - Registrar el pago de una cuota
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(options)
    
    // Si no hay un usuario autenticado, devolver error
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    
    const id = parseInt(params.id)
    
    // Buscar al usuario por email
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    // Si no se encuentra al usuario, devolver error
    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }
    
    // Verificar si existe la financiación y pertenece al usuario
    const financiacion = await prisma.financiacion.findUnique({
      where: { id },
      include: {
        gasto: true
      }
    })
    
    if (!financiacion || financiacion.userId !== usuario.id) {
      return NextResponse.json(
        { error: 'Financiación no encontrada o no tienes permisos' },
        { status: 404 }
      )
    }
    
    // Verificar que quedan cuotas por pagar
    if (financiacion.cuotasRestantes <= 0) {
      return NextResponse.json(
        { error: 'Esta financiación ya está completamente pagada' },
        { status: 400 }
      )
    }
    
    // Obtener datos del request
    const reqData = await request.json().catch(() => ({}))
    const { tipoMovimiento = "digital" } = reqData;
    
    // Calcular nueva fecha de próximo pago
    let nuevaFechaProximoPago = null
    
    if (financiacion.fechaProximoPago) {
      nuevaFechaProximoPago = addMonths(new Date(financiacion.fechaProximoPago), 1)
    } else if (financiacion.fechaPrimerPago) {
      nuevaFechaProximoPago = addMonths(
        new Date(financiacion.fechaPrimerPago), 
        financiacion.cuotasPagadas + 1
      )
    }
    
    // Actualizar la financiación
    const financiacionActualizada = await prisma.financiacion.update({
      where: { id },
      data: {
        cuotasPagadas: financiacion.cuotasPagadas + 1,
        cuotasRestantes: financiacion.cuotasRestantes - 1,
        fechaProximoPago: financiacion.cuotasRestantes > 1 ? nuevaFechaProximoPago : null,
        updatedAt: new Date()
      }
    })
    
    // Registrar el pago como un gasto
    const fechaActual = new Date();
    const conceptoPago = `Cuota ${financiacion.cuotasPagadas + 1}/${financiacion.cantidadCuotas}: ${financiacion.gasto.concepto}`;
    
    // Buscar o crear categoría para cuotas financiadas
    let categoriaFinanciacion = await prisma.categoria.findFirst({
      where: {
        descripcion: "Cuota Financiación",
        status: true
      }
    });
    
    if (!categoriaFinanciacion) {
      categoriaFinanciacion = await prisma.categoria.create({
        data: {
          descripcion: "Cuota Financiación",
          grupo_categoria: "Pagos",
          status: true
        }
      });
    }
    
    // Crear el gasto asociado al pago de la cuota
    const gastoRegistro = await prisma.gasto.create({
      data: {
        concepto: conceptoPago,
        monto: financiacion.montoCuota,
        fecha: fechaActual,
        categoria: "Cuota Financiación",
        tipoTransaccion: "expense",
        tipoMovimiento,
        userId: usuario.id,
        categoriaId: categoriaFinanciacion.id
      }
    });
    
    return NextResponse.json({
      financiacion: financiacionActualizada,
      gastoRegistrado: gastoRegistro
    })
  } catch (error: any) {
    console.error('Error al registrar pago de cuota:', error)
    return NextResponse.json(
      { 
        error: 'Error al registrar el pago de la cuota',
        details: error.message || 'Error desconocido'
      },
      { status: 500 }
    )
  }
} 