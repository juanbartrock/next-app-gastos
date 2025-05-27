import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'

// GET - Obtener todos los gastos recurrentes del usuario
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
    
    // Obtener los gastos recurrentes del usuario
    const gastosRecurrentes = await prisma.gastoRecurrente.findMany({
      where: { userId: usuario.id },
      include: {
        categoria: {
          select: {
            id: true,
            descripcion: true
          }
        }
      },
      orderBy: {
        proximaFecha: 'asc'
      }
    })
    
    return NextResponse.json(gastosRecurrentes)
  } catch (error) {
    console.error('Error al obtener gastos recurrentes:', error)
    return NextResponse.json(
      { error: 'Error al obtener los gastos recurrentes' },
      { status: 500 }
    )
  }
}

// POST - Crear un nuevo gasto recurrente
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
    
    // Obtener los datos del request
    const { 
      concepto, 
      periodicidad, 
      monto, 
      comentario, 
      estado, 
      categoriaId,
      proximaFecha,
      esServicio,
      medioPago
    } = await request.json()
    
    // Verificar datos obligatorios
    if (!concepto || !periodicidad || !monto) {
      return NextResponse.json(
        { error: 'Faltan datos obligatorios' },
        { status: 400 }
      )
    }

    // Verificar que la categoría existe si se proporciona un ID
    if (categoriaId) {
      const categoriaExiste = await prisma.categoria.findUnique({
        where: { id: categoriaId }
      })
      
      if (!categoriaExiste) {
        return NextResponse.json(
          { error: 'La categoría seleccionada no existe' },
          { status: 400 }
        )
      }
    }
    
    // Usar transacción para crear gasto recurrente y servicio si corresponde
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear el gasto recurrente
      const gastoRecurrente = await tx.gastoRecurrente.create({
        data: {
          concepto,
          periodicidad,
          monto: Number(monto),
          comentario,
          estado: estado || 'pendiente',
          proximaFecha: proximaFecha ? new Date(proximaFecha) : null,
          userId: usuario.id,
          esServicio: esServicio || false,
          ...(categoriaId && { categoriaId: Number(categoriaId) })
        }
      })
      
      // Si se marca como servicio, crear el servicio asociado
      if (esServicio) {
        // Verificar si ya existe un servicio con el mismo nombre
        const servicioExistente = await tx.servicio.findFirst({
          where: {
            userId: usuario.id,
            nombre: concepto,
            generaRecurrente: true
          }
        })
        
        if (!servicioExistente) {
          // Crear el servicio
          const servicio = await tx.servicio.create({
            data: {
              nombre: concepto,
              descripcion: `Servicio generado automáticamente desde gasto recurrente: ${concepto}`,
              monto: Number(monto),
              medioPago: medioPago || "efectivo",
              fechaCobro: proximaFecha ? new Date(proximaFecha) : null,
              generaRecurrente: true,
              userId: usuario.id
            }
          })
          
          // Actualizar el gasto recurrente con la relación al servicio
          await tx.gastoRecurrente.update({
            where: { id: gastoRecurrente.id },
            data: { servicioId: servicio.id }
          })
        }
      }
      
      return gastoRecurrente
    })
    
    return NextResponse.json(resultado)
  } catch (error) {
    console.error('Error al crear gasto recurrente:', error)
    return NextResponse.json(
      { error: 'Error al crear el gasto recurrente' },
      { status: 500 }
    )
  }
} 