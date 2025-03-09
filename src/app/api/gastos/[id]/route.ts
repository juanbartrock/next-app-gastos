import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Verificar sesión
    const session = await getServerSession(options)
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    // Extraer y validar el ID de manera segura
    const { params } = context
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      )
    }
    
    const includeDetails = request.nextUrl.searchParams.get('includeDetails') === 'true'
    
    // Buscar el usuario por email
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email || "" }
    })
    
    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }
    
    // Obtener los grupos a los que pertenece el usuario
    const gruposMiembro = await prisma.grupoMiembro.findMany({
      where: { userId: usuario.id },
      select: { grupoId: true }
    })
    
    const gruposIds = gruposMiembro.map(g => g.grupoId)
    
    // Buscar el gasto asegurándose que pertenezca al usuario o a uno de sus grupos
    const gasto = await prisma.gasto.findFirst({
      where: {
        id,
        OR: [
          { userId: usuario.id },
          { grupoId: { in: gruposIds.length > 0 ? gruposIds : undefined } }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        grupo: {
          select: {
            id: true,
            nombre: true
          }
        },
        ...(includeDetails && {
          detalles: {
            orderBy: {
              id: 'asc'
            }
          }
        })
      }
    })
    
    if (!gasto) {
      return NextResponse.json(
        { error: "Gasto no encontrado o no tienes permisos para verlo" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(gasto)
  } catch (error) {
    console.error('Error al obtener el gasto:', error)
    return NextResponse.json(
      { error: 'Error al obtener el gasto' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { params } = context
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      )
    }
    
    const { concepto, monto, categoria, tipoTransaccion, tipoMovimiento, fecha } = await request.json()

    const gasto = await prisma.gasto.update({
      where: { id },
      data: {
        concepto,
        monto,
        categoria,
        tipoTransaccion,
        tipoMovimiento,
        fecha: fecha ? new Date(fecha) : new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json(gasto)
  } catch (error) {
    console.error('Error al actualizar el gasto:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el gasto' },
      { status: 500 }
    )
  }
} 