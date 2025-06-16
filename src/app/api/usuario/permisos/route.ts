import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar si el usuario es administrador de algún grupo
    const grupoAdministrado = await prisma.grupo.findFirst({
      where: {
        adminId: session.user.id
      }
    })

    return NextResponse.json({
      esAdministradorGrupo: !!grupoAdministrado,
      grupoId: grupoAdministrado?.id || null,
      grupoNombre: grupoAdministrado?.nombre || null
    })

  } catch (error) {
    console.error('Error al verificar permisos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
} 