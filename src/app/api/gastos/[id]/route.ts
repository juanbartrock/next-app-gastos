import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(options)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id: idParam } = await params

    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    const gasto = await prisma.gasto.findFirst({
      where: {
        id: parseInt(idParam),
        userId: usuario.id
      },
      include: {
        categoriaRel: {
          select: {
            id: true,
            descripcion: true,
            grupo_categoria: true
          }
        },
        financiacion: true,
        detalles: true
      }
    })

    if (!gasto) {
      return NextResponse.json(
        { error: 'Gasto no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(gasto)
  } catch (error) {
    console.error('Error al obtener gasto:', error)
    return NextResponse.json(
      { error: 'Error al obtener el gasto' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(options)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id: idParam } = await params

    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    const { 
      concepto, 
      monto, 
      categoria, 
      categoriaId, 
      tipoTransaccion, 
      tipoMovimiento, 
      fecha, 
      fechaImputacion,  // Nuevo campo para imputación contable
      incluirEnFamilia,
      gastoRecurrenteId  // NUEVO: ID del gasto recurrente a asociar
    } = await request.json()

    // Verificar que el gasto existe y pertenece al usuario
    const gastoExistente = await prisma.gasto.findFirst({
      where: {
        id: parseInt(idParam),
        userId: usuario.id
      }
    })

    if (!gastoExistente) {
      return NextResponse.json(
        { error: 'Gasto no encontrado o no autorizado' },
        { status: 404 }
      )
    }

    // Verificar que la categoría existe si se proporciona un ID
    let categoriaExiste = null
    let nombreCategoria = categoria;
    
    if (categoriaId) {
      categoriaExiste = await prisma.categoria.findUnique({
        where: { id: Number(categoriaId) }
      });
      
      if (!categoriaExiste) {
        return NextResponse.json(
          { error: 'La categoría seleccionada no existe' },
          { status: 400 }
        )
      }
      
      if (categoriaExiste && !categoria) {
        nombreCategoria = categoriaExiste.descripcion;
      }
    }

    // NUEVO: Verificar gasto recurrente si se proporciona
    let gastoRecurrente = null;
    if (gastoRecurrenteId) {
      gastoRecurrente = await prisma.gastoRecurrente.findFirst({
        where: {
          id: Number(gastoRecurrenteId),
          userId: usuario.id  // Verificar que pertenece al usuario
        }
      });
      
      if (!gastoRecurrente) {
        return NextResponse.json(
          { error: 'El gasto recurrente seleccionado no existe o no tienes permisos' },
          { status: 400 }
        )
      }
    }

    // Procesar fecha de imputación
    let fechaImputacionProcessed = null;
    if (fechaImputacion) {
      try {
        fechaImputacionProcessed = new Date(fechaImputacion);
        if (isNaN(fechaImputacionProcessed.getTime())) {
          fechaImputacionProcessed = null;
        }
      } catch (error) {
        fechaImputacionProcessed = null;
      }
    }

    // Procesar fecha principal
    let fechaProcessed = gastoExistente.fecha; // Mantener la original si no se proporciona
    if (fecha) {
      try {
        fechaProcessed = new Date(fecha);
        if (isNaN(fechaProcessed.getTime())) {
          fechaProcessed = gastoExistente.fecha;
        }
      } catch (error) {
        fechaProcessed = gastoExistente.fecha;
      }
    }

    // Usar transacción para actualizar gasto y recurrente si es necesario
    const resultado = await prisma.$transaction(async (tx) => {
      // Actualizar el gasto
      const gastoActualizado = await tx.gasto.update({
        where: { id: parseInt(idParam) },
        data: {
          concepto: concepto || gastoExistente.concepto,
          monto: monto !== undefined ? Number(monto) : gastoExistente.monto,
          categoria: nombreCategoria || gastoExistente.categoria,
          tipoTransaccion: tipoTransaccion || gastoExistente.tipoTransaccion,
          tipoMovimiento: tipoMovimiento || gastoExistente.tipoMovimiento,
          fecha: fechaProcessed,
          fechaImputacion: fechaImputacion !== undefined ? fechaImputacionProcessed : gastoExistente.fechaImputacion,
          incluirEnFamilia: incluirEnFamilia !== undefined ? Boolean(incluirEnFamilia) : gastoExistente.incluirEnFamilia,
          updatedAt: new Date(),
          ...(categoriaId && { categoriaId: Number(categoriaId) }),
          ...(gastoRecurrenteId !== undefined && { gastoRecurrenteId: gastoRecurrenteId ? Number(gastoRecurrenteId) : null })
        },
        include: {
          categoriaRel: {
            select: {
              id: true,
              descripcion: true,
              grupo_categoria: true
            }
          }
        }
      })

      // Si se asoció a un recurrente (nuevo o cambio), actualizar su estado
      if (gastoRecurrente) {
        // Calcular total pagado para este recurrente
        const totalPagado = await tx.gasto.aggregate({
          where: { gastoRecurrenteId: gastoRecurrente.id },
          _sum: { monto: true }
        });

        const montoPagado = totalPagado._sum.monto || 0;
        const montoTotal = gastoRecurrente.monto;
        
        // Determinar estado basado en el pago
        let nuevoEstado = 'pendiente';
        if (montoPagado >= montoTotal) {
          nuevoEstado = 'pagado';
        } else if (montoPagado > 0) {
          nuevoEstado = 'pago_parcial';
        }

        // Actualizar el gasto recurrente
        await tx.gastoRecurrente.update({
          where: { id: gastoRecurrente.id },
          data: {
            estado: nuevoEstado,
            ultimoPago: new Date(),
            updatedAt: new Date()
          }
        });
      }

      // Si se desasocía de un recurrente (gastoRecurrenteId es null pero había uno antes), actualizar el anterior
      if (gastoRecurrenteId === null && gastoExistente.gastoRecurrenteId) {
        const recurrenteAnterior = await tx.gastoRecurrente.findUnique({
          where: { id: gastoExistente.gastoRecurrenteId }
        });

        if (recurrenteAnterior) {
          // Recalcular estado del recurrente anterior sin este gasto
          const totalPagadoAnterior = await tx.gasto.aggregate({
            where: { 
              gastoRecurrenteId: recurrenteAnterior.id,
              id: { not: parseInt(idParam) }  // Excluir el gasto que se está editando
            },
            _sum: { monto: true }
          });

          const montoPagadoAnterior = totalPagadoAnterior._sum.monto || 0;
          
          // Determinar nuevo estado
          let nuevoEstadoAnterior = 'pendiente';
          if (montoPagadoAnterior >= recurrenteAnterior.monto) {
            nuevoEstadoAnterior = 'pagado';
          } else if (montoPagadoAnterior > 0) {
            nuevoEstadoAnterior = 'pago_parcial';
          }

          await tx.gastoRecurrente.update({
            where: { id: recurrenteAnterior.id },
            data: {
              estado: nuevoEstadoAnterior,
              updatedAt: new Date()
            }
          });
        }
      }

      return gastoActualizado;
    });

    return NextResponse.json(resultado)
  } catch (error) {
    console.error('Error al actualizar gasto:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el gasto' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(options)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id: idParam } = await params

    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el gasto existe y pertenece al usuario
    const gastoExistente = await prisma.gasto.findFirst({
      where: {
        id: parseInt(idParam),
        userId: usuario.id
      }
    })

    if (!gastoExistente) {
      return NextResponse.json(
        { error: 'Gasto no encontrado o no autorizado' },
        { status: 404 }
      )
    }

    // Eliminar el gasto (Prisma se encarga de eliminar financiaciones y detalles por cascade)
    await prisma.gasto.delete({
      where: { id: parseInt(idParam) }
    })

    return NextResponse.json({ message: 'Gasto eliminado correctamente' })
  } catch (error) {
    console.error('Error al eliminar gasto:', error)
    return NextResponse.json(
      { error: 'Error al eliminar el gasto' },
      { status: 500 }
    )
  }
} 