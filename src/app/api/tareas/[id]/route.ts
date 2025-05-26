import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options';
import prisma from '@/lib/prisma';

// GET /api/tareas/[id] - Obtener una tarea específica
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const tarea = await prisma.tarea.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
      include: {
        prestamo: {
          select: {
            id: true,
            entidadFinanciera: true,
            numeroCredito: true,
            fechaProximaCuota: true,
          }
        },
        gastoRecurrente: {
          select: {
            id: true,
            concepto: true,
            monto: true,
            proximaFecha: true,
          }
        },
        inversion: {
          select: {
            id: true,
            nombre: true,
            fechaVencimiento: true,
            tipo: {
              select: {
                nombre: true
              }
            }
          }
        },
        presupuesto: {
          select: {
            id: true,
            nombre: true,
            monto: true,
            mes: true,
            año: true,
          }
        }
      }
    });

    if (!tarea) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    return NextResponse.json(tarea);
  } catch (error) {
    console.error('Error al obtener tarea:', error);
    return NextResponse.json(
      { error: 'Error al obtener la tarea' },
      { status: 500 }
    );
  }
}

// PUT /api/tareas/[id] - Actualizar una tarea
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();

    // Verificar que la tarea existe y pertenece al usuario
    const tareaExistente = await prisma.tarea.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      }
    });

    if (!tareaExistente) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    // Validar prioridad si se proporciona
    if (data.prioridad && !['alta', 'media', 'baja'].includes(data.prioridad)) {
      return NextResponse.json(
        { error: 'Prioridad inválida' },
        { status: 400 }
      );
    }

    // Validar estado si se proporciona
    if (data.estado && !['pendiente', 'completada', 'cancelada'].includes(data.estado)) {
      return NextResponse.json(
        { error: 'Estado inválido' },
        { status: 400 }
      );
    }

    // Preparar datos para actualizar
    const updateData: any = {};
    
    if (data.titulo !== undefined) updateData.titulo = data.titulo;
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
    if (data.fechaVencimiento !== undefined) {
      updateData.fechaVencimiento = data.fechaVencimiento ? new Date(data.fechaVencimiento) : null;
    }
    if (data.prioridad !== undefined) updateData.prioridad = data.prioridad;
    if (data.estado !== undefined) {
      updateData.estado = data.estado;
      // Si se marca como completada, registrar la fecha
      if (data.estado === 'completada' && tareaExistente.estado !== 'completada') {
        updateData.completadaEn = new Date();
      }
      // Si se cambia de completada a otro estado, limpiar la fecha
      if (data.estado !== 'completada' && tareaExistente.estado === 'completada') {
        updateData.completadaEn = null;
      }
    }
    if (data.categoria !== undefined) updateData.categoria = data.categoria;
    if (data.recordatorio !== undefined) {
      updateData.recordatorio = data.recordatorio ? new Date(data.recordatorio) : null;
    }

    // Actualizar relaciones opcionales
    if (data.prestamoId !== undefined) updateData.prestamoId = data.prestamoId;
    if (data.gastoRecurrenteId !== undefined) {
      updateData.gastoRecurrenteId = data.gastoRecurrenteId ? parseInt(data.gastoRecurrenteId) : null;
    }
    if (data.inversionId !== undefined) updateData.inversionId = data.inversionId;
    if (data.presupuestoId !== undefined) updateData.presupuestoId = data.presupuestoId;

    const tareaActualizada = await prisma.tarea.update({
      where: {
        id: id,
      },
      data: updateData,
      include: {
        prestamo: {
          select: {
            id: true,
            entidadFinanciera: true,
            numeroCredito: true,
          }
        },
        gastoRecurrente: {
          select: {
            id: true,
            concepto: true,
            monto: true,
          }
        },
        inversion: {
          select: {
            id: true,
            nombre: true,
            tipo: {
              select: {
                nombre: true
              }
            }
          }
        },
        presupuesto: {
          select: {
            id: true,
            nombre: true,
            monto: true,
          }
        }
      }
    });

    return NextResponse.json(tareaActualizada);
  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la tarea' },
      { status: 500 }
    );
  }
}

// DELETE /api/tareas/[id] - Eliminar una tarea
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que la tarea existe y pertenece al usuario
    const tarea = await prisma.tarea.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      }
    });

    if (!tarea) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    await prisma.tarea.delete({
      where: {
        id: params.id,
      }
    });

    return NextResponse.json({ message: 'Tarea eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar tarea:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la tarea' },
      { status: 500 }
    );
  }
} 