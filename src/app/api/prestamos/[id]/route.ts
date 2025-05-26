import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"
import prisma from "@/lib/prisma"

// GET - Obtener un préstamo específico
export async function GET(
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

    const prestamo = await prisma.prestamo.findFirst({
      where: {
        id: params.id,
        userId: usuario.id
      },
      include: {
        pagos: {
          orderBy: { numeroCuota: 'asc' }
        }
      }
    })

    if (!prestamo) {
      return NextResponse.json(
        { error: 'Préstamo no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(prestamo)
  } catch (error) {
    console.error('Error al obtener préstamo:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar un préstamo
export async function PUT(
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

    // Verificar que el préstamo existe y pertenece al usuario
    const prestamoExistente = await prisma.prestamo.findFirst({
      where: {
        id: params.id,
        userId: usuario.id
      }
    })

    if (!prestamoExistente) {
      return NextResponse.json(
        { error: 'Préstamo no encontrado' },
        { status: 404 }
      )
    }

    const data = await request.json()
    
    // Actualizar el préstamo
    const prestamoActualizado = await prisma.prestamo.update({
      where: { id: params.id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(prestamoActualizado)
  } catch (error) {
    console.error('Error al actualizar préstamo:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un préstamo
export async function DELETE(
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

    // Verificar que el préstamo existe y pertenece al usuario
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

    // Eliminar el préstamo (los pagos se eliminan automáticamente por la relación en cascada)
    await prisma.prestamo.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Préstamo eliminado exitosamente' })
  } catch (error) {
    console.error('Error al eliminar préstamo:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 