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
    const { nombre, descripcion, monto, medioPago, tarjeta, fechaCobro, fechaVencimiento, generaRecurrente } = data
    
    // Obtener el servicio actual con sus relaciones
    const servicioExistente = await prisma.servicio.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            id: true
          }
        },
        gastoRecurrente: true
      }
    })
    
    if (!servicioExistente) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
    }
    
    // Verificar que el servicio pertenezca al usuario
    if (servicioExistente.user.email !== session.user.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
    
    // Usar transacción para manejar las actualizaciones
    const resultado = await prisma.$transaction(async (tx) => {
      // Manejar la lógica de gasto recurrente
      if (generaRecurrente !== undefined) {
        if (generaRecurrente && !servicioExistente.gastoRecurrente) {
          // Crear nuevo gasto recurrente
          // Verificar si ya existe un gasto recurrente con el mismo concepto
          const gastoExistente = await tx.gastoRecurrente.findFirst({
            where: {
              userId: servicioExistente.user.id,
              concepto: nombre || servicioExistente.nombre,
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
            const medioFinal = medioPago || servicioExistente.medioPago
            if (medioFinal.toLowerCase().includes("anual")) {
              periodicidad = "anual"
            } else if (medioFinal.toLowerCase().includes("trimestral")) {
              periodicidad = "trimestral"
            }
            
            // Crear el gasto recurrente
            const gastoRecurrente = await tx.gastoRecurrente.create({
              data: {
                concepto: nombre || servicioExistente.nombre,
                periodicidad,
                monto: monto !== undefined ? parseFloat(monto.toString()) : servicioExistente.monto,
                comentario: `Gasto recurrente generado automáticamente desde servicio: ${nombre || servicioExistente.nombre}`,
                estado: "pendiente",
                userId: servicioExistente.user.id,
                categoriaId: categoriaServicio.id,
                proximaFecha: fechaCobro ? new Date(fechaCobro) : servicioExistente.fechaCobro,
                esServicio: true,
                servicioId: id
              }
            })
          }
        } else if (!generaRecurrente && servicioExistente.gastoRecurrente) {
          // Eliminar relación con gasto recurrente existente
          await tx.gastoRecurrente.update({
            where: { id: servicioExistente.gastoRecurrente.id },
            data: { 
              servicioId: null,
              esServicio: false
            }
          })
        }
      }
      
      // Actualizar el servicio
      const servicioActualizado = await tx.servicio.update({
        where: { id },
        data: {
          nombre: nombre || undefined,
          descripcion: descripcion !== undefined ? descripcion : undefined,
          monto: monto !== undefined ? parseFloat(monto.toString()) : undefined,
          medioPago: medioPago || undefined,
          tarjeta: tarjeta !== undefined ? tarjeta : undefined,
          fechaCobro: fechaCobro ? new Date(fechaCobro) : undefined,
          fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : undefined,
          generaRecurrente: generaRecurrente !== undefined ? generaRecurrente : undefined,
        },
        include: {
          gastoRecurrente: true
        }
      })
      
      // Si hay un gasto recurrente relacionado, actualizarlo también
      if (servicioActualizado.gastoRecurrente) {
        await tx.gastoRecurrente.update({
          where: { id: servicioActualizado.gastoRecurrente.id },
          data: {
            concepto: nombre || undefined,
            monto: monto !== undefined ? parseFloat(monto.toString()) : undefined,
            proximaFecha: fechaCobro ? new Date(fechaCobro) : undefined,
          }
        })
      }
      
      return servicioActualizado
    })
    
    return NextResponse.json(resultado)
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