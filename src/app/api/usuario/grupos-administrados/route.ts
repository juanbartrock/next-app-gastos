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

    // Buscar todos los grupos donde el usuario es administrador
    const gruposAdministrados = await prisma.grupo.findMany({
      where: {
        adminId: session.user.id
      },
      include: {
        miembros: {
          select: {
            userId: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json({
      grupos: gruposAdministrados
    })

  } catch (error) {
    console.error('Error al cargar grupos administrados:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
} 