import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'

// GET - Obtener categorías para un usuario (versión simplificada)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    console.log('🔍 Iniciando consulta de categorías para usuario:', session.user.id)

    // Consultar categorías usando SQL raw para evitar problemas de tipos
    const categoriasGenericas = await prisma.$queryRaw`
      SELECT * FROM "Categoria" 
      WHERE "esGenerica" = true 
      AND "activa" = true 
      AND "userId" IS NULL 
      AND "grupoId" IS NULL
      ORDER BY "descripcion" ASC
    `

    console.log('✅ Categorías genéricas encontradas:', Array.isArray(categoriasGenericas) ? categoriasGenericas.length : 0)

    const categoriasPersonales = await prisma.$queryRaw`
      SELECT * FROM "Categoria" 
      WHERE "userId" = ${session.user.id}
      AND "activa" = true 
      AND "esGenerica" = false 
      AND "grupoId" IS NULL
      ORDER BY "descripcion" ASC
    `

    console.log('✅ Categorías personales encontradas:', Array.isArray(categoriasPersonales) ? categoriasPersonales.length : 0)

    // Obtener grupos del usuario
    const gruposUsuario = await prisma.$queryRaw`
      SELECT gm.*, g."nombre" as "grupoNombre"
      FROM "GrupoMiembro" gm
      JOIN "Grupo" g ON gm."grupoId" = g."id"
      WHERE gm."userId" = ${session.user.id}
    `

    console.log('✅ Grupos del usuario encontrados:', Array.isArray(gruposUsuario) ? gruposUsuario.length : 0)

    // Por ahora, categorías de grupo vacías para evitar errores
    const categoriasGrupo: any[] = []

    const estadisticas = {
      genericasDisponibles: Array.isArray(categoriasGenericas) ? categoriasGenericas.length : 0,
      personalesCreadas: Array.isArray(categoriasPersonales) ? categoriasPersonales.length : 0,
      gruposConCategorias: categoriasGrupo.length,
      totalVisibles: (Array.isArray(categoriasGenericas) ? categoriasGenericas.length : 0) + 
                    (Array.isArray(categoriasPersonales) ? categoriasPersonales.length : 0) + 
                    categoriasGrupo.length
    }

    console.log('📊 Estadísticas finales:', estadisticas)

    return NextResponse.json({
      categoriasGenericas: categoriasGenericas || [],
      categoriasPersonales: categoriasPersonales || [],
      categoriasGrupo: categoriasGrupo || [],
      grupos: gruposUsuario || [],
      estadisticas
    })
    
  } catch (error) {
    console.error('❌ Error al obtener categorías del usuario:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// POST - Crear nueva categoría personal (versión simplificada)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    console.log('🔍 Creando categoría personal para usuario:', session.user.id)

    const body = await request.json()
    console.log('📝 Datos recibidos:', body)

    const { descripcion, colorHex, icono, grupo_categoria } = body

    if (!descripcion || descripcion.trim() === '') {
      return NextResponse.json({ error: 'La descripción es requerida' }, { status: 400 })
    }

    // Verificar categoría existente con SQL raw
    const categoriaExistente = await prisma.$queryRaw`
      SELECT id FROM "Categoria" 
      WHERE "descripcion" = ${descripcion} 
      AND "userId" = ${session.user.id}
      AND "activa" = true
      LIMIT 1
    `

    if (Array.isArray(categoriaExistente) && categoriaExistente.length > 0) {
      return NextResponse.json({ 
        error: 'Ya tienes una categoría personal con ese nombre' 
      }, { status: 400 })
    }

    // Crear nueva categoría con SQL raw
    const resultado = await prisma.$queryRaw`
      INSERT INTO "Categoria" (
        "descripcion", "colorHex", "icono", "grupo_categoria",
        "esGenerica", "activa", "tipo", "status",
        "userId", "adminCreadorId", "grupoId",
        "createdAt", "updatedAt"
      ) VALUES (
        ${descripcion}, ${colorHex || null}, ${icono || null}, ${grupo_categoria || null},
        false, true, 'personal', true,
        ${session.user.id}, ${session.user.id}, null,
        NOW(), NOW()
      )
      RETURNING *
    `

    console.log('🎉 Categoría personal creada exitosamente')

    return NextResponse.json({ 
      message: 'Categoría personal creada exitosamente',
      descripcion: descripcion
    }, { status: 201 })
    
  } catch (error) {
    console.error('❌ Error al crear categoría personal:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
} 