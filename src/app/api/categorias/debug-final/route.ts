import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    console.log('🔍 DEBUG FINAL - Usuario actual:', session.user.email, session.user.id)

    // 1. Todas las categorías genéricas (userId IS NULL)
    const genericas = await prisma.$queryRaw`
      SELECT id, descripcion FROM "Categoria" 
      WHERE "userId" IS NULL AND status = true
    ` as any[]

    // 2. Mis categorías (privadas y familiares)
    const misCategorias = await prisma.$queryRaw`
      SELECT id, descripcion, "esPrivada" FROM "Categoria" 
      WHERE "userId" = ${session.user.id} AND status = true
    ` as any[]

    // 3. Usuarios de mi grupo familiar con permisos para compartir
    const miembrosGrupo = await prisma.$queryRaw`
      SELECT DISTINCT gm."userId", u.email, u.name
      FROM "GrupoMiembro" gm
      INNER JOIN "User" u ON gm."userId" = u."id"
      WHERE gm."grupoId" IN (
        SELECT DISTINCT "grupoId" 
        FROM "GrupoMiembro" 
        WHERE "userId" = ${session.user.id}
      )
      AND gm."puedeVerFamiliar" = true
      AND gm."userId" != ${session.user.id}
    ` as any[]

    // 4. Categorías familiares de esos usuarios
    const categoriasGrupo = []
    for (const miembro of miembrosGrupo) {
      const cats = await prisma.$queryRaw`
        SELECT c.id, c.descripcion, c."userId", c."esPrivada"
        FROM "Categoria" c
        WHERE c."userId" = ${miembro.userId} 
        AND c."esPrivada" = false 
        AND c.status = true
      ` as any[]
      categoriasGrupo.push(...cats.map(cat => ({
        ...cat,
        propietarioInfo: miembro
      })))
    }

    return NextResponse.json({
      usuarioActual: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      },
      categorias: {
        genericas: { 
          cantidad: genericas.length, 
          lista: genericas.map(c => ({ id: c.id, descripcion: c.descripcion }))
        },
        miasPrivadas: { 
          cantidad: misCategorias.filter(c => c.esPrivada).length,
          lista: misCategorias.filter(c => c.esPrivada).map(c => ({ id: c.id, descripcion: c.descripcion }))
        },
        miasFamiliares: { 
          cantidad: misCategorias.filter(c => !c.esPrivada).length,
          lista: misCategorias.filter(c => !c.esPrivada).map(c => ({ id: c.id, descripcion: c.descripcion }))
        },
        delGrupo: { 
          cantidad: categoriasGrupo.length,
          lista: categoriasGrupo.map(c => ({ 
            id: c.id, 
            descripcion: c.descripcion, 
            propietario: c.propietarioInfo?.email 
          }))
        }
      },
      miembrosGrupoConPermisos: miembrosGrupo,
      totalDeberiaVer: genericas.length + misCategorias.length + categoriasGrupo.length
    })
    
  } catch (error) {
    console.error('❌ Error en debug final:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
} 