import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options';
import prisma from '@/lib/prisma';

// POST /api/tareas/[id]/completar - Marcar tarea como completada
export async function POST(
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

    if (tarea.estado === 'completada') {
      return NextResponse.json({ error: 'La tarea ya está completada' }, { status: 400 });
    }

    const tareaActualizada = await prisma.tarea.update({
      where: {
        id: params.id,
      },
      data: {
        estado: 'completada',
        completadaEn: new Date(),
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

    return NextResponse.json(tareaActualizada);
  } catch (error) {
    console.error('Error al completar tarea:', error);
    return NextResponse.json(
      { error: 'Error al completar la tarea' },
      { status: 500 }
    );
  }
} 