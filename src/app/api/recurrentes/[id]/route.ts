import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'

// GET - Obtener un gasto recurrente específico
export async function GET(
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
    
    // Obtener el gasto recurrente
    const gastoRecurrente = await prisma.gastoRecurrente.findUnique({
      where: { id },
      include: {
        categoria: {
          select: {
            id: true,
            descripcion: true
          }
        }
      }
    })
    
    // Si no existe o no pertenece al usuario, devolver error
    if (!gastoRecurrente || gastoRecurrente.userId !== usuario.id) {
      return NextResponse.json(
        { error: 'Gasto recurrente no encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(gastoRecurrente)
  } catch (error) {
    console.error('Error al obtener gasto recurrente:', error)
    return NextResponse.json(
      { error: 'Error al obtener el gasto recurrente' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar un gasto recurrente
export async function PUT(
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
    
    // Verificar si existe el gasto recurrente y pertenece al usuario
    const existeGasto = await prisma.gastoRecurrente.findUnique({
      where: { id }
    })
    
    if (!existeGasto || existeGasto.userId !== usuario.id) {
      return NextResponse.json(
        { error: 'Gasto recurrente no encontrado o no tienes permisos' },
        { status: 404 }
      )
    }
    
    // Obtener los datos del request
    const { 
      concepto, 
      periodicidad, 
      monto, 
      comentario, 
      estado, 
      categoriaId,
      proximaFecha,
      ultimoPago
    } = await request.json()
    
    // Actualizar el gasto recurrente
    const gastoActualizado = await prisma.gastoRecurrente.update({
      where: { id },
      data: {
        ...(concepto && { concepto }),
        ...(periodicidad && { periodicidad }),
        ...(monto && { monto: Number(monto) }),
        comentario,
        ...(estado && { estado }),
        proximaFecha: proximaFecha ? new Date(proximaFecha) : existeGasto.proximaFecha,
        ultimoPago: ultimoPago ? new Date(ultimoPago) : existeGasto.ultimoPago,
        ...(categoriaId && { categoriaId: Number(categoriaId) }),
        updatedAt: new Date()
      }
    })
    
    return NextResponse.json(gastoActualizado)
  } catch (error) {
    console.error('Error al actualizar gasto recurrente:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el gasto recurrente' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un gasto recurrente
export async function DELETE(
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
    
    // Verificar si existe el gasto recurrente y pertenece al usuario
    const existeGasto = await prisma.gastoRecurrente.findUnique({
      where: { id }
    })
    
    if (!existeGasto || existeGasto.userId !== usuario.id) {
      return NextResponse.json(
        { error: 'Gasto recurrente no encontrado o no tienes permisos' },
        { status: 404 }
      )
    }
    
    // Eliminar el gasto recurrente
    await prisma.gastoRecurrente.delete({
      where: { id }
    })
    
    return NextResponse.json({ message: 'Gasto recurrente eliminado con éxito' })
  } catch (error) {
    console.error('Error al eliminar gasto recurrente:', error)
    return NextResponse.json(
      { error: 'Error al eliminar el gasto recurrente' },
      { status: 500 }
    )
  }
} 