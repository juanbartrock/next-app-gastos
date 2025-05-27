import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import { isAdmin } from '@/lib/auth-utils'

// GET - Obtener todos los grupos de categorías únicos
export async function GET() {
  try {
    const grupos = await prisma.categoria.findMany({
      select: {
        grupo_categoria: true
      },
      distinct: ['grupo_categoria'],
      where: {
        grupo_categoria: { not: null },
        status: true
      },
      orderBy: {
        grupo_categoria: 'asc'
      }
    })

    // Filtrar valores null y mapear a string simple
    const gruposLimpios = grupos
      .map(g => g.grupo_categoria)
      .filter(Boolean)
      .sort()

    return NextResponse.json(gruposLimpios)
  } catch (error) {
    console.error('Error al obtener grupos de categorías:', error)
    return NextResponse.json(
      { error: 'Error al obtener los grupos de categorías' },
      { status: 500 }
    )
  }
}

// POST - Crear un nuevo grupo de categoría (solo admins)
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
        { error: "Acceso denegado. Solo administradores pueden crear grupos de categorías" },
        { status: 403 }
      )
    }
    
    const data = await request.json()
    const { nombre } = data
    
    if (!nombre?.trim()) {
      return NextResponse.json(
        { error: 'El nombre del grupo es requerido' },
        { status: 400 }
      )
    }

    // Verificar que no exista un grupo con el mismo nombre
    const grupoExistente = await prisma.categoria.findFirst({
      where: {
        grupo_categoria: nombre.trim(),
        status: true
      }
    })

    if (grupoExistente) {
      return NextResponse.json(
        { error: 'Ya existe un grupo con ese nombre' },
        { status: 400 }
      )
    }

    // Crear una categoría base para el nuevo grupo
    const nuevaCategoria = await prisma.categoria.create({
      data: {
        descripcion: `Categoría base - ${nombre.trim()}`,
        grupo_categoria: nombre.trim(),
        status: true
      }
    })
    
    return NextResponse.json(
      { 
        mensaje: 'Grupo de categoría creado con éxito', 
        grupo: nombre.trim(),
        categoria: nuevaCategoria 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error al crear grupo de categoría:', error)
    return NextResponse.json(
      { error: 'Error al crear el grupo de categoría' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar un grupo de categoría (solo admins)
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
        { error: "Acceso denegado. Solo administradores pueden actualizar grupos de categorías" },
        { status: 403 }
      )
    }
    
    const data = await request.json()
    const { nombreAnterior, nombreNuevo } = data
    
    if (!nombreAnterior || !nombreNuevo?.trim()) {
      return NextResponse.json(
        { error: 'Se requieren el nombre anterior y el nuevo nombre' },
        { status: 400 }
      )
    }

    // Verificar que el nuevo nombre no exista ya
    if (nombreAnterior !== nombreNuevo.trim()) {
      const grupoExistente = await prisma.categoria.findFirst({
        where: {
          grupo_categoria: nombreNuevo.trim(),
          status: true
        }
      })

      if (grupoExistente) {
        return NextResponse.json(
          { error: 'Ya existe un grupo con ese nombre' },
          { status: 400 }
        )
      }
    }

    // Actualizar todas las categorías que pertenecen a este grupo
    const resultado = await prisma.categoria.updateMany({
      where: {
        grupo_categoria: nombreAnterior,
        status: true
      },
      data: {
        grupo_categoria: nombreNuevo.trim()
      }
    })
    
    return NextResponse.json(
      { 
        mensaje: 'Grupo de categoría actualizado con éxito', 
        categoriasActualizadas: resultado.count 
      }
    )
  } catch (error) {
    console.error('Error al actualizar grupo de categoría:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el grupo de categoría' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un grupo de categoría (solo admins)
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
        { error: "Acceso denegado. Solo administradores pueden eliminar grupos de categorías" },
        { status: 403 }
      )
    }
    
    const url = new URL(request.url)
    const nombre = url.searchParams.get('nombre')
    
    if (!nombre) {
      return NextResponse.json(
        { error: 'Se requiere el nombre del grupo' },
        { status: 400 }
      )
    }

    // Verificar si hay gastos asociados a categorías de este grupo
    const gastosAsociados = await prisma.gasto.findFirst({
      include: {
        categoriaRel: true
      },
      where: {
        categoriaRel: {
          grupo_categoria: nombre,
          status: true
        }
      }
    })

    if (gastosAsociados) {
      return NextResponse.json(
        { error: 'No se puede eliminar el grupo porque tiene gastos asociados' },
        { status: 400 }
      )
    }

    // Desactivar todas las categorías de este grupo
    const resultado = await prisma.categoria.updateMany({
      where: {
        grupo_categoria: nombre,
        status: true
      },
      data: {
        status: false
      }
    })
    
    return NextResponse.json(
      { 
        mensaje: 'Grupo de categoría eliminado con éxito', 
        categoriasDesactivadas: resultado.count 
      }
    )
  } catch (error) {
    console.error('Error al eliminar grupo de categoría:', error)
    return NextResponse.json(
      { error: 'Error al eliminar el grupo de categoría' },
      { status: 500 }
    )
  }
} 