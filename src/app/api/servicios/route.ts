import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options'

// GET /api/servicios - Obtener todos los servicios del usuario
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const servicios = await prisma.servicio.findMany({
      where: {
        user: {
          email: session.user.email
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json(servicios)
  } catch (error) {
    console.error('Error al obtener servicios:', error)
    return NextResponse.json({ error: 'Error al obtener servicios' }, { status: 500 })
  }
}

// POST /api/servicios - Crear un nuevo servicio
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const data = await request.json()
    const { nombre, descripcion, monto, medioPago, tarjeta, fechaCobro, fechaVencimiento } = data
    
    // Validaciones básicas
    if (!nombre || !monto || !medioPago) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }
    
    // Obtener el usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }
    
    // Crear el servicio
    const servicio = await prisma.servicio.create({
      data: {
        nombre,
        descripcion,
        monto: parseFloat(monto.toString()),
        medioPago,
        tarjeta,
        fechaCobro: fechaCobro ? new Date(fechaCobro) : null,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
        userId: user.id
      }
    })
    
    return NextResponse.json(servicio, { status: 201 })
  } catch (error) {
    console.error('Error al crear servicio:', error)
    return NextResponse.json({ error: 'Error al crear servicio' }, { status: 500 })
  }
} 