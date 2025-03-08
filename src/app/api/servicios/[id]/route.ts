import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options'

// GET /api/servicios/[id] - Obtener un servicio específico
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    
    const servicio = await prisma.servicio.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    })
    
    if (!servicio) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
    }
    
    // Verificar que el servicio pertenezca al usuario
    if (servicio.user.email !== session.user.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
    
    return NextResponse.json(servicio)
  } catch (error) {
    console.error('Error al obtener servicio:', error)
    return NextResponse.json({ error: 'Error al obtener servicio' }, { status: 500 })
  }
}

// PUT /api/servicios/[id] - Actualizar un servicio existente
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    
    const data = await request.json()
    const { nombre, descripcion, monto, medioPago, tarjeta, fechaCobro, fechaVencimiento } = data
    
    // Obtener el servicio actual
    const servicioExistente = await prisma.servicio.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    })
    
    if (!servicioExistente) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
    }
    
    // Verificar que el servicio pertenezca al usuario
    if (servicioExistente.user.email !== session.user.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
    
    // Actualizar el servicio
    const servicioActualizado = await prisma.servicio.update({
      where: { id },
      data: {
        nombre: nombre || undefined,
        descripcion: descripcion !== undefined ? descripcion : undefined,
        monto: monto !== undefined ? parseFloat(monto.toString()) : undefined,
        medioPago: medioPago || undefined,
        tarjeta: tarjeta !== undefined ? tarjeta : undefined,
        fechaCobro: fechaCobro ? new Date(fechaCobro) : undefined,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : undefined,
      }
    })
    
    return NextResponse.json(servicioActualizado)
  } catch (error) {
    console.error('Error al actualizar servicio:', error)
    return NextResponse.json({ error: 'Error al actualizar servicio' }, { status: 500 })
  }
}

// DELETE /api/servicios/[id] - Eliminar un servicio
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    
    // Obtener el servicio actual
    const servicioExistente = await prisma.servicio.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    })
    
    if (!servicioExistente) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
    }
    
    // Verificar que el servicio pertenezca al usuario
    if (servicioExistente.user.email !== session.user.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
    
    // Eliminar el servicio
    await prisma.servicio.delete({
      where: { id }
    })
    
    return NextResponse.json({ message: 'Servicio eliminado con éxito' })
  } catch (error) {
    console.error('Error al eliminar servicio:', error)
    return NextResponse.json({ error: 'Error al eliminar servicio' }, { status: 500 })
  }
} 