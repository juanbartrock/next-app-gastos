import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

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
    
    // Verificar datos obligatorios
    if (!gastoId || !cantidadCuotas || !montoCuota) {
      return NextResponse.json(
        { error: 'Faltan datos obligatorios' },
        { status: 400 }
      )
    }

    // Verificar que el gasto existe y pertenece al usuario
    const gasto = await prisma.gasto.findUnique({
      where: { id: gastoId }
    })
    
    if (!gasto || gasto.userId !== usuario.id) {
      return NextResponse.json(
        { error: 'Gasto no encontrado o no pertenece al usuario' },
        { status: 404 }
      )
    }
    
    // Verificar que el gasto no tenga ya una financiación
    const financiacionExistente = await prisma.financiacion.findUnique({
      where: { gastoId }
    })
    
    if (financiacionExistente) {
      return NextResponse.json(
        { error: 'Este gasto ya tiene una financiación asociada' },
        { status: 400 }
      )
    }
    
    // Crear la financiación
    const financiacion = await prisma.financiacion.create({
      data: {
        gastoId,
        userId: usuario.id,
        cantidadCuotas: Number(cantidadCuotas),
        cuotasPagadas: 0,
        cuotasRestantes: Number(cantidadCuotas),
        montoCuota: Number(montoCuota),
        fechaPrimerPago: fechaPrimerPago ? new Date(fechaPrimerPago) : null,
        fechaProximoPago: fechaPrimerPago ? new Date(fechaPrimerPago) : null,
        diaPago: diaPago ? Number(diaPago) : null
      }
    })
    
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