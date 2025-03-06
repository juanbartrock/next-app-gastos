import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// GET - Obtener un grupo específico y sus detalles
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(options)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }

    // Obtener el usuario de la base de datos usando el email
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // Verificar si el usuario es miembro del grupo
    const miembro = await prisma.grupoMiembro.findUnique({
      where: {
        grupoId_userId: {
          grupoId: params.id,
          userId: usuario.id,
        },
      },
    })

    if (!miembro) {
      return NextResponse.json(
        { error: "No tienes acceso a este grupo" },
        { status: 403 }
      )
    }

    // Obtener el grupo con sus miembros y gastos
    const grupo = await prisma.grupo.findUnique({
      where: { id: params.id },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        miembros: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        gastos: {
          orderBy: {
            fecha: 'desc',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!grupo) {
      return NextResponse.json(
        { error: "Grupo no encontrado" },
        { status: 404 }
      )
    }

    // Agregar el rol del usuario al resultado
    return NextResponse.json({
      ...grupo,
      miRol: miembro.rol,
    })
  } catch (error) {
    console.error('Error al obtener grupo:', error)
    return NextResponse.json(
      { error: 'Error al obtener el grupo' },
      { status: 500 }
    )
  }
}

// POST - Invitar a un usuario al grupo
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(options)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }

    // Obtener el usuario de la base de datos usando el email
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // Verificar si el usuario es administrador del grupo
    const miembro = await prisma.grupoMiembro.findUnique({
      where: {
        grupoId_userId: {
          grupoId: params.id,
          userId: usuario.id,
        },
      },
    })

    if (!miembro || miembro.rol !== "ADMIN") {
      return NextResponse.json(
        { error: "No tienes permisos para invitar a este grupo" },
        { status: 403 }
      )
    }

    const { email } = await request.json()

    // Verificar si el email existe
    if (!email || email.trim() === '') {
      return NextResponse.json(
        { error: "Email requerido" },
        { status: 400 }
      )
    }

    // Buscar al usuario a invitar
    const usuarioInvitado = await prisma.user.findUnique({
      where: { email },
    })

    if (!usuarioInvitado) {
      return NextResponse.json(
        { error: "Usuario no encontrado con ese email" },
        { status: 404 }
      )
    }

    // Verificar si ya es miembro
    const yaEsMiembro = await prisma.grupoMiembro.findUnique({
      where: {
        grupoId_userId: {
          grupoId: params.id,
          userId: usuarioInvitado.id,
        },
      },
    })

    if (yaEsMiembro) {
      return NextResponse.json(
        { error: "Este usuario ya es miembro del grupo" },
        { status: 400 }
      )
    }

    // Agregar al usuario al grupo
    const nuevoMiembro = await prisma.grupoMiembro.create({
      data: {
        grupoId: params.id,
        userId: usuarioInvitado.id,
        rol: "MIEMBRO", // Asegurarnos de que esté en mayúsculas
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(nuevoMiembro)
  } catch (error) {
    console.error('Error al agregar miembro:', error)
    return NextResponse.json(
      { error: 'Error al agregar el miembro' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un grupo (solo para admin)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(options)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }

    // Obtener el usuario de la base de datos usando el email
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // Verificar si el grupo existe
    const grupo = await prisma.grupo.findUnique({
      where: { id: params.id },
    })

    if (!grupo) {
      return NextResponse.json(
        { error: "Grupo no encontrado" },
        { status: 404 }
      )
    }

    // Verificar si el usuario es administrador del grupo
    if (grupo.adminId !== usuario.id) {
      return NextResponse.json(
        { error: "No tienes permisos para eliminar este grupo" },
        { status: 403 }
      )
    }

    // Eliminar todas las relaciones y luego el grupo
    await prisma.$transaction([
      // Eliminar todos los miembros del grupo
      prisma.grupoMiembro.deleteMany({
        where: { grupoId: params.id },
      }),
      // Actualizar gastos para desasociarlos del grupo eliminado
      prisma.gasto.updateMany({
        where: { grupoId: params.id },
        data: { grupoId: null },
      }),
      // Eliminar el grupo
      prisma.grupo.delete({
        where: { id: params.id },
      }),
    ])

    return NextResponse.json({ message: "Grupo eliminado exitosamente" })
  } catch (error) {
    console.error('Error al eliminar grupo:', error)
    return NextResponse.json(
      { error: 'Error al eliminar el grupo' },
      { status: 500 }
    )
  }
} 