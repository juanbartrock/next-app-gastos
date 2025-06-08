import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'
import { z } from 'zod'

// Schema de validación para crear categorías
const categoriaSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida'),
  colorHex: z.string().optional(),
  icono: z.string().optional(),
  grupo_categoria: z.string().optional(),
  esGenerica: z.boolean().default(false),
  activa: z.boolean().default(true),
  tipo: z.string().default('grupo')
})

// GET - Obtener todas las categorías (para testing)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener todas las categorías ordenadas por tipo y descripción
    const categorias = await prisma.categoria.findMany({
      where: {
        status: true
      },
      orderBy: [
        { descripcion: 'asc' }
      ]
    })

    return NextResponse.json(categorias)
    
  } catch (error) {
    console.error('Error al obtener categorías:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST - Crear nueva categoría (para testing de categorías de grupo)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = categoriaSchema.parse(body)

    // Verificar que no existe una categoría con el mismo nombre
    const categoriaExistente = await prisma.categoria.findFirst({
      where: {
        descripcion: validatedData.descripcion,
        status: true
      }
    })

    if (categoriaExistente) {
      return NextResponse.json({ 
        error: 'Ya existe una categoría con ese nombre' 
      }, { status: 400 })
    }

    // Crear la nueva categoría con solo los campos disponibles
    const nuevaCategoria = await prisma.categoria.create({
      data: {
        descripcion: validatedData.descripcion,
        icono: validatedData.icono,
        grupo_categoria: validatedData.grupo_categoria,
        tipo: validatedData.tipo,
        status: true,
        adminCreadorId: session.user.id,
        esGenerica: validatedData.esGenerica,
        activa: validatedData.activa
      }
    })

    return NextResponse.json(nuevaCategoria, { status: 201 })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Datos inválidos', 
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Error al crear categoría:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PUT - Actualizar una categoría existente (solo admins)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
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
    const session = await getServerSession(authOptions)
    
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