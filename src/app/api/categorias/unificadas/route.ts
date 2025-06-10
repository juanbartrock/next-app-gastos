import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'

// GET - Obtener todas las categorías que el usuario puede ver (unificado)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const url = new URL(request.url)
    const grupoId = url.searchParams.get('grupoId')
    const incluirPrivadas = url.searchParams.get('incluirPrivadas') === 'true'

    console.log('🔍 Obteniendo categorías unificadas para usuario:', session.user.id)
    console.log('📋 Parámetros:', { grupoId, incluirPrivadas })

    // 1. CATEGORÍAS GENÉRICAS (siempre visibles para todos)
    const categoriasGenericas = await prisma.categoria.findMany({
      where: {
        userId: null,        // No pertenecen a ningún usuario (genéricas del sistema)
        status: true         // Activas
      },
      orderBy: { descripcion: 'asc' },
      select: {
        id: true,
        descripcion: true,
        colorHex: true,
        icono: true,
        grupo_categoria: true,
        createdAt: true,
        userId: true,
        esPrivada: true
      }
    })

    // 2. MIS CATEGORÍAS PERSONALES (siempre las veo)
    const misCategoriasPersonales = await prisma.categoria.findMany({
      where: {
        userId: session.user.id,
        status: true
      },
      orderBy: { descripcion: 'asc' },
      select: {
        id: true,
        descripcion: true,
        colorHex: true,
        icono: true,
        grupo_categoria: true,
        createdAt: true,
        userId: true,
        esPrivada: true
      }
    })

    let categoriasCompartidas: any[] = []

    // 3. CATEGORÍAS COMPARTIDAS DE GRUPOS donde soy miembro
    const gruposDelUsuario = await prisma.grupoMiembro.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        grupo: {
          include: {
            miembros: {
              where: {
                userId: { not: session.user.id } // Otros miembros del grupo
              },
              include: {
                user: {
                  select: { id: true, name: true, email: true }
                }
              }
            }
          }
        }
      }
    })

    console.log(`👥 Grupos del usuario:`, gruposDelUsuario.length)

    // Para cada grupo, obtener categorías compartidas de otros miembros
    for (const miembro of gruposDelUsuario) {
      // Obtener IDs de otros miembros del grupo
      const otrosMiembros = miembro.grupo.miembros.map(m => m.userId)
      
      if (otrosMiembros.length > 0) {
        // Categorías de otros miembros del grupo que NO son privadas
        const categoriasOtrosMiembros = await prisma.categoria.findMany({
          where: {
            userId: { in: otrosMiembros },
            status: true,
            esPrivada: false  // Solo las no privadas son compartidas
          },
          include: {
            propietario: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { descripcion: 'asc' }
        })

        categoriasCompartidas.push(...categoriasOtrosMiembros)
      }
    }

    console.log(`🤝 Categorías compartidas encontradas:`, categoriasCompartidas.length)

    // 4. FILTRAR CATEGORÍAS PRIVADAS SI NO SE SOLICITAN
    let misCategoriasFiltered = misCategoriasPersonales
    if (!incluirPrivadas) {
      misCategoriasFiltered = misCategoriasPersonales.filter(cat => !cat.esPrivada)
    }

    // 5. ELIMINAR DUPLICADOS POR ID
    const todasLasCategorias = [
      ...categoriasGenericas.map(cat => ({ ...cat, tipo: 'generica', propietario: null })),
      ...misCategoriasFiltered.map(cat => ({ ...cat, tipo: 'personal', propietario: null })),
      ...categoriasCompartidas.map(cat => ({ ...cat, tipo: 'compartida' }))
    ]

    // Eliminar duplicados por ID
    const categoriasUnicas = todasLasCategorias.filter((categoria, index, arr) => 
      arr.findIndex(c => c.id === categoria.id) === index
    )

    console.log('✅ Resumen de categorías:')
    console.log(`   🌍 Genéricas: ${categoriasGenericas.length}`)
    console.log(`   👤 Personales: ${misCategoriasFiltered.length}`)
    console.log(`   🤝 Compartidas: ${categoriasCompartidas.length}`)
    console.log(`   📊 Total únicas: ${categoriasUnicas.length}`)

    return NextResponse.json({
      categorias: categoriasUnicas,
      estadisticas: {
        genericas: categoriasGenericas.length,
        personales: misCategoriasFiltered.length,
        compartidas: categoriasCompartidas.length,
        total: categoriasUnicas.length
      },
      metadatos: {
        usuarioId: session.user.id,
        grupoId,
        incluirPrivadas,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('❌ Error al obtener categorías unificadas:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
} 