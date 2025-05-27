import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import { isAdmin } from '@/lib/auth-utils'

// GET - Obtener todas las categorías
export async function GET() {
  try {
    // Obtener categorías activas usando el cliente de Prisma en lugar de SQL directo
    const categorias = await prisma.categoria.findMany({
      where: {
        status: true
      },
      orderBy: {
        descripcion: 'asc'
      },
      select: {
        id: true,
        descripcion: true,
        grupo_categoria: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    return NextResponse.json(categorias)
  } catch (error) {
    console.error('Error al obtener categorías:', error)
    return NextResponse.json(
      { error: 'Error al obtener las categorías' },
      { status: 500 }
    )
  }
}

// POST - Crear una nueva categoría (solo admins)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(options)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }
    
    // Verificar que el usuario sea administrador
    const esAdmin = await isAdmin(session.user.id)
    if (!esAdmin) {
      return NextResponse.json(
        { error: "Acceso denegado. Solo administradores pueden crear categorías" },
        { status: 403 }
      )
    }
    
    const data = await request.json()
    const { descripcion, grupo_categoria } = data
    
    if (!descripcion) {
      return NextResponse.json(
        { error: 'Falta el nombre de la categoría' },
        { status: 400 }
      )
    }

    // Crear la nueva categoría
    const nuevaCategoria = await prisma.categoria.create({
      data: {
        descripcion,
        grupo_categoria,
        status: true
      }
    })
    
    return NextResponse.json(
      { mensaje: 'Categoría creada con éxito', categoria: nuevaCategoria },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error al crear categoría:', error)
    return NextResponse.json(
      { error: 'Error al crear la categoría' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar una categoría existente (solo admins)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(options)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }
    
    // Verificar que el usuario sea administrador
    const esAdmin = await isAdmin(session.user.id)
    if (!esAdmin) {
      return NextResponse.json(
        { error: "Acceso denegado. Solo administradores pueden actualizar categorías" },
        { status: 403 }
      )
    }
    
    const data = await request.json()
    const { id, descripcion, grupo_categoria, status } = data
    
    if (!id) {
      return NextResponse.json(
        { error: 'Falta el ID de la categoría' },
        { status: 400 }
      )
    }

    // Verificar que la categoría existe
    const categoriaExistente = await prisma.categoria.findUnique({
      where: { id: Number(id) }
    })

    if (!categoriaExistente) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      )
    }

    // Actualizar la categoría
    const categoriaActualizada = await prisma.categoria.update({
      where: { id: Number(id) },
      data: {
        descripcion: descripcion ?? categoriaExistente.descripcion,
        grupo_categoria: grupo_categoria !== undefined ? grupo_categoria : categoriaExistente.grupo_categoria,
        status: status !== undefined ? status : categoriaExistente.status
      }
    })
    
    return NextResponse.json(
      { mensaje: 'Categoría actualizada con éxito', categoria: categoriaActualizada }
    )
  } catch (error) {
    console.error('Error al actualizar categoría:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la categoría' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar una categoría (marca como inactiva, solo admins)
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(options)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }
    
    // Verificar que el usuario sea administrador
    const esAdmin = await isAdmin(session.user.id)
    if (!esAdmin) {
      return NextResponse.json(
        { error: "Acceso denegado. Solo administradores pueden eliminar categorías" },
        { status: 403 }
      )
    }
    
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Falta el ID de la categoría' },
        { status: 400 }
      )
    }

    // Verificar que la categoría existe
    const categoriaExistente = await prisma.categoria.findUnique({
      where: { id: Number(id) }
    })

    if (!categoriaExistente) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      )
    }

    // Marcar como inactiva (soft delete)
    const categoriaDesactivada = await prisma.categoria.update({
      where: { id: Number(id) },
      data: { status: false }
    })
    
    return NextResponse.json(
      { mensaje: 'Categoría eliminada con éxito', categoria: categoriaDesactivada }
    )
  } catch (error) {
    console.error('Error al eliminar categoría:', error)
    return NextResponse.json(
      { error: 'Error al eliminar la categoría' },
      { status: 500 }
    )
  }
} 