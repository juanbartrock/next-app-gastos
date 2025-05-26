import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options';
import prisma from '@/lib/prisma';

// GET /api/tareas - Obtener todas las tareas del usuario
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const categoria = searchParams.get('categoria');
    const esFinanciera = searchParams.get('esFinanciera');
    const limite = searchParams.get('limite');

    // Construir filtros dinámicamente
    const where: any = {
      userId: session.user.id,
    };

    if (estado && estado !== 'todas') {
      where.estado = estado;
    }

    if (categoria && categoria !== 'todas') {
      where.categoria = categoria;
    }

    if (esFinanciera) {
      where.esFinanciera = esFinanciera === 'true';
    }

    const tareas = await prisma.tarea.findMany({
      where,
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
      },
      orderBy: [
        { estado: 'asc' }, // Pendientes primero
        { prioridad: 'desc' }, // Alta prioridad primero
        { fechaVencimiento: 'asc' }, // Próximas a vencer primero
        { createdAt: 'desc' }
      ],
      take: limite ? parseInt(limite) : undefined,
    });

    return NextResponse.json({ tareas });
  } catch (error) {
    console.error('Error al obtener tareas:', error);
    return NextResponse.json(
      { error: 'Error al obtener tareas' },
      { status: 500 }
    );
  }
}

// POST /api/tareas - Crear una nueva tarea
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await req.json();
    
    // Validar datos mínimos necesarios
    if (!data.titulo) {
      return NextResponse.json(
        { error: 'El título es requerido' },
        { status: 400 }
      );
    }

    // Validar prioridad
    if (data.prioridad && !['alta', 'media', 'baja'].includes(data.prioridad)) {
      return NextResponse.json(
        { error: 'Prioridad inválida' },
        { status: 400 }
      );
    }

    // Crear la tarea
    const tarea = await prisma.tarea.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : null,
        prioridad: data.prioridad || 'media',
        esFinanciera: data.esFinanciera || false,
        categoria: data.categoria,
        recordatorio: data.recordatorio ? new Date(data.recordatorio) : null,
        prestamoId: data.prestamoId,
        gastoRecurrenteId: data.gastoRecurrenteId ? parseInt(data.gastoRecurrenteId) : null,
        inversionId: data.inversionId,
        presupuestoId: data.presupuestoId,
        userId: session.user.id,
      },
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

    return NextResponse.json(tarea);
  } catch (error) {
    console.error('Error al crear tarea:', error);
    return NextResponse.json(
      { error: 'Error al crear la tarea' },
      { status: 500 }
    );
  }
} 