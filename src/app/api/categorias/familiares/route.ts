import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'

// GET - Obtener categorías que puede ver el usuario (genéricas + propias + compartidas)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    console.log('🔍 Obteniendo categorías para usuario:', session.user.id)

    // Obtener IDs de usuarios del mismo grupo familiar con permisos para compartir
    const miembrosGrupo = await prisma.$queryRaw`
      SELECT DISTINCT gm."userId"
      FROM "GrupoMiembro" gm
      WHERE gm."grupoId" IN (
        SELECT DISTINCT "grupoId" 
        FROM "GrupoMiembro" 
        WHERE "userId" = ${session.user.id}
      )
      AND gm."puedeVerFamiliar" = true
      AND gm."userId" != ${session.user.id}
    ` as any[]

    // Extraer IDs de miembros del grupo
    const idsMiembros = miembrosGrupo.map((m: any) => m.userId)
    
    // Obtener categorías que puede ver el usuario
    let todasCategorias: any[]
    
    if (idsMiembros.length > 0) {
      // Si hay miembros del grupo, incluir sus categorías no privadas
      todasCategorias = await prisma.$queryRaw`
        SELECT 
          c.*,
          CASE 
            WHEN c."userId" IS NULL THEN 'Sistema'
            WHEN u."name" IS NOT NULL THEN u."name"
            ELSE 'Usuario'
          END as "creadorNombre",
          CASE 
            WHEN c."userId" IS NULL THEN 'generica'
            WHEN c."esPrivada" = true THEN 'privada'
            ELSE 'compartida'
          END as "tipo"
        FROM "Categoria" c
        LEFT JOIN "User" u ON c."userId" = u."id"
        WHERE c."status" = true 
        AND (
          c."userId" IS NULL OR 
          c."userId" = ${session.user.id} OR
          (c."esPrivada" = false AND c."userId" = ANY(${idsMiembros}))
        )
        ORDER BY (c."userId" IS NULL) DESC, c."descripcion" ASC
      ` as any[]
    } else {
      // Si no hay miembros del grupo, solo categorías propias y genéricas
      todasCategorias = await prisma.$queryRaw`
        SELECT 
          c.*,
          CASE 
            WHEN c."userId" IS NULL THEN 'Sistema'
            WHEN u."name" IS NOT NULL THEN u."name"
            ELSE 'Usuario'
          END as "creadorNombre",
          CASE 
            WHEN c."userId" IS NULL THEN 'generica'
            WHEN c."esPrivada" = true THEN 'privada'
            ELSE 'compartida'
          END as "tipo"
        FROM "Categoria" c
        LEFT JOIN "User" u ON c."userId" = u."id"
        WHERE c."status" = true 
        AND (
          c."userId" IS NULL OR 
          c."userId" = ${session.user.id}
        )
        ORDER BY (c."userId" IS NULL) DESC, c."descripcion" ASC
      ` as any[]
    }

    console.log('✅ Categorías encontradas:', todasCategorias.length)

    // Separar por tipo para compatibilidad  
    const categoriasGenericas = todasCategorias.filter(c => c.userId === null)
    const categoriasPersonales = todasCategorias.filter(c => c.userId !== null)

    const estadisticas = {
      genericasDisponibles: categoriasGenericas.length,
      personalesCreadas: categoriasPersonales.length,
      totalVisibles: todasCategorias.length
    }

    console.log('📊 Estadísticas de categorías:', estadisticas)

    return NextResponse.json({
      categorias: todasCategorias,
      categoriasGenericas: categoriasGenericas,
      categoriasFamiliares: categoriasPersonales, // Para compatibilidad con componentes existentes
      idsFamilia: [session.user.id],
      estadisticas
    })
    
  } catch (error) {
    console.error('❌ Error al obtener categorías familiares:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// POST - Crear nueva categoría personal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    console.log('🔍 Creando categoría para usuario:', session.user.id)

    const body = await request.json()
    const { descripcion, colorHex, icono, esPrivada } = body

    if (!descripcion || descripcion.trim() === '') {
      return NextResponse.json({ error: 'La descripción es requerida' }, { status: 400 })
    }

    // Verificar que no existe una categoría con el mismo nombre para este usuario
    const categoriaExistente = await prisma.$queryRaw`
      SELECT id FROM "Categoria" 
      WHERE "descripcion" = ${descripcion} 
      AND "userId" = ${session.user.id}
      AND "status" = true
      LIMIT 1
    ` as any[]

    if (categoriaExistente.length > 0) {
      return NextResponse.json({ 
        error: 'Ya tienes una categoría con ese nombre' 
      }, { status: 400 })
    }

    // Crear nueva categoría usando Prisma ORM  
    const nuevaCategoria = await prisma.categoria.create({
      data: {
        descripcion: descripcion,
        ...(colorHex && { colorHex }),
        ...(icono && { icono }),
        status: true,
        userId: session.user.id,
        esPrivada: esPrivada || false
      }
    })

    console.log('🎉 Categoría creada exitosamente con userId:', session.user.id)

    return NextResponse.json({ 
      message: 'Categoría creada exitosamente',
      descripcion: descripcion,
      esPrivada: esPrivada || false
    }, { status: 201 })
    
  } catch (error) {
    console.error('❌ Error al crear categoría familiar:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
} 