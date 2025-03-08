import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'

// GET - Obtener todas las promociones disponibles para el usuario
export async function GET() {
  try {
    const session = await getServerSession(options)
    
    // Si no hay un usuario autenticado, devolver error
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    
    // Buscar al usuario por email
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    // Si no se encuentra al usuario, devolver error
    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }
    
    // Obtener todos los servicios del usuario
    const servicios = await prisma.servicio.findMany({
      where: { userId: usuario.id }
    })
    
    // Obtener IDs de los servicios
    const serviciosIds = servicios.map(servicio => servicio.id)
    
    // Obtener promociones relacionadas con los servicios del usuario
    const promociones = await prisma.promocion.findMany({
      where: {
        servicioId: {
          in: serviciosIds
        },
        estado: 'active', // Solo promociones activas
        OR: [
          { fechaVencimiento: null },
          { fechaVencimiento: { gt: new Date() } }
        ]
      },
      include: {
        servicio: true,
        alternativas: true
      },
      orderBy: { fechaCreacion: 'desc' }
    })
    
    return NextResponse.json(promociones)
  } catch (error) {
    console.error('Error al obtener promociones:', error)
    return NextResponse.json(
      { error: 'Error al obtener las promociones' },
      { status: 500 }
    )
  }
}

// POST - Crear una nueva promoción
export async function POST(request: Request) {
  try {
    const session = await getServerSession(options)
    
    // Si no hay un usuario autenticado, devolver error
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    
    // Obtener datos del request
    const data = await request.json()
    const { 
      titulo, 
      descripcion, 
      urlOrigen, 
      descuento, 
      porcentajeAhorro, 
      fechaVencimiento,
      servicioId,
      alternativas
    } = data
    
    // Validar campos obligatorios
    if (!titulo || !descripcion) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      )
    }
    
    // Si se proporciona servicioId, verificar que el servicio existe y pertenece al usuario
    if (servicioId) {
      const servicio = await prisma.servicio.findUnique({
        where: { id: servicioId },
        include: { user: true }
      })
      
      if (!servicio) {
        return NextResponse.json(
          { error: 'El servicio no existe' },
          { status: 404 }
        )
      }
      
      if (servicio.user.email !== session.user.email) {
        return NextResponse.json(
          { error: 'No tienes permiso para asociar esta promoción a este servicio' },
          { status: 403 }
        )
      }
    }
    
    // Crear la promoción con transacción para incluir alternativas
    const promocion = await prisma.$transaction(async (tx) => {
      // Crear la promoción
      const promocionCreada = await tx.promocion.create({
        data: {
          titulo,
          descripcion,
          urlOrigen,
          descuento: descuento ? parseFloat(descuento.toString()) : null,
          porcentajeAhorro: porcentajeAhorro ? parseFloat(porcentajeAhorro.toString()) : null,
          fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
          servicioId: servicioId ? parseInt(servicioId.toString()) : null,
        }
      })
      
      // Si hay alternativas, crearlas
      if (alternativas && Array.isArray(alternativas) && alternativas.length > 0) {
        for (const alt of alternativas) {
          await tx.servicioAlternativo.create({
            data: {
              nombre: alt.nombre,
              descripcion: alt.descripcion || null,
              monto: parseFloat(alt.monto.toString()),
              urlOrigen: alt.urlOrigen || null,
              promocionId: promocionCreada.id
            }
          })
        }
      }
      
      // Retornar la promoción creada
      return await tx.promocion.findUnique({
        where: { id: promocionCreada.id },
        include: { alternativas: true }
      })
    })
    
    return NextResponse.json(promocion)
  } catch (error) {
    console.error('Error al crear promoción:', error)
    return NextResponse.json(
      { error: 'Error al crear la promoción' },
      { status: 500 }
    )
  }
} 