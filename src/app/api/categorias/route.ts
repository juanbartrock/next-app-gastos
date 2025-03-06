import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'

// GET - Obtener todas las categorías
export async function GET() {
  try {
    // Obtener categorías activas
    const categorias = await prisma.$queryRaw`
      SELECT id, descripcion, grupo_categoria, status, createdAt, updatedAt
      FROM Categoria
      WHERE status = true
      ORDER BY descripcion ASC
    `;
    
    return NextResponse.json(categorias)
  } catch (error) {
    console.error('Error al obtener categorías:', error)
    return NextResponse.json(
      { error: 'Error al obtener las categorías' },
      { status: 500 }
    )
  }
}

// POST - Crear una nueva categoría
export async function POST(request: Request) {
  try {
    const session = await getServerSession(options)
    
    // Verificar autenticación
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    const { descripcion, grupo_categoria, status } = await request.json()
    
    if (!descripcion) {
      return NextResponse.json(
        { error: 'La descripción es obligatoria' },
        { status: 400 }
      )
    }
    
    const statusValue = status !== undefined ? status : true;
    
    // Usar SQL directo para insertar
    const result = await prisma.$executeRaw`
      INSERT INTO Categoria (descripcion, grupo_categoria, status, createdAt, updatedAt)
      VALUES (${descripcion}, ${grupo_categoria}, ${statusValue}, datetime('now'), datetime('now'))
    `;
    
    // Obtener la categoría recién creada
    const categorias = await prisma.$queryRaw`
      SELECT * FROM Categoria 
      WHERE descripcion = ${descripcion}
      ORDER BY id DESC
      LIMIT 1
    `;
    
    const categoria = Array.isArray(categorias) && categorias.length > 0 ? categorias[0] : null;
    
    return NextResponse.json(categoria)
  } catch (error) {
    console.error('Error al crear categoría:', error)
    return NextResponse.json(
      { error: 'Error al crear la categoría' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar una categoría
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(options)
    
    // Verificar autenticación
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    const { id, descripcion, grupo_categoria, status } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'El ID es obligatorio' },
        { status: 400 }
      )
    }
    
    // Actualizar mediante SQL directo
    await prisma.$executeRaw`
      UPDATE Categoria
      SET 
        descripcion = ${descripcion},
        grupo_categoria = ${grupo_categoria},
        status = ${status},
        updatedAt = datetime('now')
      WHERE id = ${id}
    `;
    
    // Obtener la categoría actualizada
    const categorias = await prisma.$queryRaw`SELECT * FROM Categoria WHERE id = ${id}`;
    const categoria = Array.isArray(categorias) && categorias.length > 0 ? categorias[0] : null;
    
    return NextResponse.json(categoria)
  } catch (error) {
    console.error('Error al actualizar categoría:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la categoría' },
      { status: 500 }
    )
  }
}

// DELETE - Desactivar una categoría (soft delete)
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(options)
    
    // Verificar autenticación
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'El ID es obligatorio' },
        { status: 400 }
      )
    }
    
    // Desactivar mediante SQL directo
    await prisma.$executeRaw`
      UPDATE Categoria
      SET status = false, updatedAt = datetime('now')
      WHERE id = ${parseInt(id)}
    `;
    
    // Obtener la categoría actualizada
    const categorias = await prisma.$queryRaw`SELECT * FROM Categoria WHERE id = ${parseInt(id)}`;
    const categoria = Array.isArray(categorias) && categorias.length > 0 ? categorias[0] : null;
    
    return NextResponse.json(categoria)
  } catch (error) {
    console.error('Error al eliminar categoría:', error)
    return NextResponse.json(
      { error: 'Error al eliminar la categoría' },
      { status: 500 }
    )
  }
} 