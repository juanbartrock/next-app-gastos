import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'

// GET - Obtener grupos del usuario autenticado
export async function GET() {
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

    // Buscar grupos donde el usuario es miembro
    const gruposMiembro = await prisma.grupoMiembro.findMany({
      where: {
        userId: usuario.id,
      },
      include: {
        grupo: {
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
              take: 10, // Limitamos para no sobrecargar
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Formatear la respuesta para incluir el rol del usuario en cada grupo
    const grupos = gruposMiembro.map((membership) => ({
      id: membership.grupo.id,
      nombre: membership.grupo.nombre,
      descripcion: membership.grupo.descripcion,
      adminId: membership.grupo.adminId,
      admin: membership.grupo.admin,
      rol: membership.rol,
      miembros: membership.grupo.miembros,
      createdAt: membership.grupo.createdAt,
      updatedAt: membership.grupo.updatedAt,
    }))

    return NextResponse.json(grupos)
  } catch (error) {
    console.error('Error al obtener grupos:', error)
    return NextResponse.json(
      { error: 'Error al obtener los grupos' },
      { status: 500 }
    )
  }
}

// POST - Crear un nuevo grupo
export async function POST(request: Request) {
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

    const { nombre, descripcion } = await request.json()

    // Validación básica
    if (!nombre || nombre.trim() === '') {
      return NextResponse.json(
        { error: "El nombre del grupo es obligatorio" },
        { status: 400 }
      )
    }

    // Crear grupo con el usuario actual como administrador
    const nuevoGrupo = await prisma.grupo.create({
      data: {
        nombre,
        descripcion: descripcion || null,
        adminId: usuario.id,
        updatedAt: new Date(),
        // Crear el usuario como miembro del grupo automáticamente
        miembros: {
          create: {
            userId: usuario.id,
            rol: "ADMIN", // El creador es admin por defecto
          },
        },
      },
      include: {
        admin: true,
        miembros: {
          include: {
            user: true,
          },
        },
      },
    })

    return NextResponse.json(nuevoGrupo)
  } catch (error) {
    console.error('Error al crear grupo:', error)
    return NextResponse.json(
      { error: 'Error al crear el grupo' },
      { status: 500 }
    )
  }
} 