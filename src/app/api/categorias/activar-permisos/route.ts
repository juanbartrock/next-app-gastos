import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    console.log('🔧 Activando permisos familiares para usuario:', session.user.email)

    // Activar permisos para todos los miembros de los grupos del usuario actual
    const resultado = await prisma.$queryRaw`
      UPDATE "GrupoMiembro" 
      SET "puedeVerFamiliar" = true 
      WHERE "grupoId" IN (
        SELECT DISTINCT "grupoId" 
        FROM "GrupoMiembro" 
        WHERE "userId" = ${session.user.id}
      )
    ` as any

    // Verificar el resultado
    const miembrosActualizados = await prisma.$queryRaw`
      SELECT 
        gm."userId", 
        u.email, 
        u.name,
        gm."puedeVerFamiliar",
        g.nombre as "grupoNombre"
      FROM "GrupoMiembro" gm
      INNER JOIN "User" u ON gm."userId" = u."id"
      INNER JOIN "Grupo" g ON gm."grupoId" = g."id"
      WHERE gm."grupoId" IN (
        SELECT DISTINCT "grupoId" 
        FROM "GrupoMiembro" 
        WHERE "userId" = ${session.user.id}
      )
      ORDER BY u.email
    ` as any[]

    return NextResponse.json({
      mensaje: 'Permisos familiares activados exitosamente',
      miembrosActualizados: miembrosActualizados,
      totalActualizados: miembrosActualizados.length
    })
    
  } catch (error) {
    console.error('❌ Error activando permisos:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
} 