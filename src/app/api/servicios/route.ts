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
    const { nombre, descripcion, monto, medioPago, tarjeta, fechaCobro, fechaVencimiento, generaRecurrente } = data
    
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
    
    // Usar transacción para crear servicio y gasto recurrente si corresponde
    const resultado = await prisma.$transaction(async (tx) => {
      let gastoRecurrenteId = null
      
      // Si se marca como genera recurrente, crear el gasto recurrente primero
      if (generaRecurrente) {
        // Verificar si ya existe un gasto recurrente con el mismo concepto
        const gastoExistente = await tx.gastoRecurrente.findFirst({
          where: {
            userId: user.id,
            concepto: nombre,
            esServicio: true
          }
        })
        
        if (!gastoExistente) {
          // Buscar o crear categoría para servicios
          let categoriaServicio = await tx.categoria.findFirst({
            where: {
              descripcion: "Servicios",
              status: true
            }
          })
          
          if (!categoriaServicio) {
            categoriaServicio = await tx.categoria.create({
              data: {
                descripcion: "Servicios",
                grupo_categoria: "Servicios",
                status: true
              }
            })
          }
          
          // Determinar periodicidad basada en el medio de pago
          let periodicidad = "mensual"
          if (medioPago.toLowerCase().includes("anual")) {
            periodicidad = "anual"
          } else if (medioPago.toLowerCase().includes("trimestral")) {
            periodicidad = "trimestral"
          }
          
          // Crear el gasto recurrente
          const gastoRecurrente = await tx.gastoRecurrente.create({
            data: {
              concepto: nombre,
              periodicidad,
              monto: parseFloat(monto.toString()),
              comentario: `Gasto recurrente generado automáticamente desde servicio: ${nombre}`,
              estado: "pendiente",
              userId: user.id,
              categoriaId: categoriaServicio.id,
              proximaFecha: fechaCobro ? new Date(fechaCobro) : null,
              esServicio: true
            }
          })
          
          gastoRecurrenteId = gastoRecurrente.id
        } else {
          gastoRecurrenteId = gastoExistente.id
        }
      }
      
      // Crear el servicio
      const servicio = await tx.servicio.create({
        data: {
          nombre,
          descripcion,
          monto: parseFloat(monto.toString()),
          medioPago,
          tarjeta,
          fechaCobro: fechaCobro ? new Date(fechaCobro) : null,
          fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
          generaRecurrente: generaRecurrente || false,
          userId: user.id
        }
      })
      
      // Si se creó un gasto recurrente, actualizar la relación
      if (gastoRecurrenteId) {
        await tx.gastoRecurrente.update({
          where: { id: gastoRecurrenteId },
          data: { servicioId: servicio.id }
        })
      }
      
      return servicio
    })
    
    return NextResponse.json(resultado, { status: 201 })
  } catch (error) {
    console.error('Error al crear servicio:', error)
    return NextResponse.json({ error: 'Error al crear servicio' }, { status: 500 })
  }
} 