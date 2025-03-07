import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'

// GET - Obtener todas las financiaciones del usuario
export async function GET() {
  try {
    const session = await getServerSession(options)
    
    // Si no hay un usuario autenticado, devolver error
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    
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
    
    // Obtener las financiaciones del usuario
    const financiaciones = await prisma.financiacion.findMany({
      where: { userId: usuario.id },
      include: {
        gasto: {
          select: {
            id: true,
            concepto: true,
            monto: true,
            fecha: true,
            categoria: true
          }
        }
      },
      orderBy: {
        fechaProximoPago: 'asc'
      }
    })
    
    return NextResponse.json(financiaciones)
  } catch (error: any) {
    console.error('Error al obtener financiaciones:', error)
    return NextResponse.json(
      { 
        error: 'Error al obtener las financiaciones',
        details: error.message || 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

// POST - Crear una nueva financiación (normalmente se crea automáticamente al crear un gasto de tipo tarjeta)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(options)
    
    // Si no hay un usuario autenticado, devolver error
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    
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
    
    // Obtener los datos del request
    const { 
      gastoId, 
      cantidadCuotas, 
      montoCuota, 
      fechaPrimerPago,
      diaPago
    } = await request.json()

    console.log("Datos recibidos para financiación:", {
      gastoId, 
      cantidadCuotas, 
      montoCuota, 
      fechaPrimerPago,
      diaPago
    })
    
    // Verificar datos obligatorios
    if (!gastoId) {
      return NextResponse.json(
        { error: 'El ID del gasto es obligatorio' },
        { status: 400 }
      )
    }
    
    if (!cantidadCuotas || cantidadCuotas < 1) {
      return NextResponse.json(
        { error: 'La cantidad de cuotas debe ser al menos 1' },
        { status: 400 }
      )
    }
    
    if (!montoCuota || montoCuota <= 0) {
      return NextResponse.json(
        { error: 'El monto de la cuota debe ser mayor a 0' },
        { status: 400 }
      )
    }

    // Verificar que el gasto existe y pertenece al usuario
    const gasto = await prisma.gasto.findUnique({
      where: { id: Number(gastoId) }
    })
    
    if (!gasto) {
      return NextResponse.json(
        { error: `Gasto con ID ${gastoId} no encontrado` },
        { status: 404 }
      )
    }
    
    if (gasto.userId !== usuario.id) {
      return NextResponse.json(
        { error: 'El gasto no pertenece al usuario actual' },
        { status: 403 }
      )
    }
    
    // Verificar que el gasto no tenga ya una financiación
    const financiacionExistente = await prisma.financiacion.findUnique({
      where: { gastoId: Number(gastoId) }
    })
    
    if (financiacionExistente) {
      return NextResponse.json(
        { error: 'Este gasto ya tiene una financiación asociada' },
        { status: 400 }
      )
    }
    
    // Procesar fechaPrimerPago si existe
    let fechaPrimerPagoDate = null;
    if (fechaPrimerPago) {
      try {
        fechaPrimerPagoDate = new Date(fechaPrimerPago);
        if (isNaN(fechaPrimerPagoDate.getTime())) {
          throw new Error('Fecha inválida');
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Formato de fecha primer pago inválido' },
          { status: 400 }
        )
      }
    }

    // Crear la financiación
    const financiacion = await prisma.financiacion.create({
      data: {
        gastoId: Number(gastoId),
        userId: usuario.id,
        cantidadCuotas: Number(cantidadCuotas),
        cuotasPagadas: 0,
        cuotasRestantes: Number(cantidadCuotas),
        montoCuota: Number(montoCuota),
        fechaPrimerPago: fechaPrimerPagoDate,
        fechaProximoPago: fechaPrimerPagoDate,
        diaPago: diaPago ? Number(diaPago) : null
      }
    })
    
    console.log("Financiación creada:", financiacion)
    
    return NextResponse.json(financiacion)
  } catch (error: any) {
    console.error('Error al crear financiación:', error)
    return NextResponse.json(
      { 
        error: 'Error al crear la financiación',
        details: error.message || 'Error desconocido'
      },
      { status: 500 }
    )
  }
} 