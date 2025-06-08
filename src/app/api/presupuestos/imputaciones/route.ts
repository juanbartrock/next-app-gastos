import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import prisma from '@/lib/prisma';

// Obtener imputaciones de un presupuesto
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(options);
    
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const url = new URL(request.url);
    const presupuestoId = url.searchParams.get('presupuestoId');

    if (!presupuestoId) {
      return NextResponse.json({ error: 'presupuestoId es requerido' }, { status: 400 });
    }

    // Verificar que el presupuesto pertenece al usuario
    const presupuesto = await prisma.presupuesto.findFirst({
      where: {
        id: presupuestoId,
        userId: session.user.id
      }
    });

    if (!presupuesto) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });
    }

    const imputaciones = await prisma.presupuestoImputacion.findMany({
      where: {
        presupuestoId: presupuestoId,
        activo: true
      },
      include: {
        gasto: {
          include: {
            categoriaRel: true,
            user: {
              select: { id: true, name: true }
            }
          }
        },
        usuario: {
          select: { id: true, name: true }
        }
      },
      orderBy: {
        fechaImputacion: 'desc'
      }
    });

    return NextResponse.json(imputaciones);
  } catch (error) {
    console.error('Error al obtener imputaciones:', error);
    return NextResponse.json({ error: 'Error al obtener imputaciones' }, { status: 500 });
  }
}

// Crear nueva imputación
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(options);
    
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { 
      presupuestoId, 
      gastoId, 
      montoImputado, 
      porcentajeGasto = 100, 
      comentario 
    } = await request.json();

    // Validaciones
    if (!presupuestoId || !gastoId || !montoImputado) {
      return NextResponse.json(
        { error: 'presupuestoId, gastoId y montoImputado son obligatorios' },
        { status: 400 }
      );
    }

    // Verificar que el presupuesto pertenece al usuario
    const presupuesto = await prisma.presupuesto.findFirst({
      where: {
        id: presupuestoId,
        userId: session.user.id
      }
    });

    if (!presupuesto) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });
    }

    // Verificar que el gasto existe y pertenece al usuario
    const gasto = await prisma.gasto.findFirst({
      where: {
        id: gastoId,
        userId: session.user.id
      }
    });

    if (!gasto) {
      return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 });
    }

    // Verificar que no existe ya una imputación activa para este gasto y presupuesto
    const imputacionExistente = await prisma.presupuestoImputacion.findFirst({
      where: {
        presupuestoId: presupuestoId,
        gastoId: gastoId,
        activo: true
      }
    });

    if (imputacionExistente) {
      return NextResponse.json(
        { error: 'Ya existe una imputación activa para este gasto en este presupuesto' },
        { status: 400 }
      );
    }

    // Validar que el monto imputado no exceda el monto del gasto
    if (montoImputado > gasto.monto) {
      return NextResponse.json(
        { error: 'El monto imputado no puede ser mayor al monto del gasto' },
        { status: 400 }
      );
    }

    // Crear la imputación
    const imputacion = await prisma.presupuestoImputacion.create({
      data: {
        presupuestoId,
        gastoId,
        montoImputado,
        porcentajeGasto,
        comentario,
        creadoPor: session.user.id
      },
      include: {
        gasto: {
          include: {
            categoriaRel: true,
            user: {
              select: { id: true, name: true }
            }
          }
        },
        usuario: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json(imputacion);
  } catch (error) {
    console.error('Error al crear imputación:', error);
    return NextResponse.json({ error: 'Error al crear imputación' }, { status: 500 });
  }
}

// Eliminar imputación (marcar como inactiva)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(options);
    
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const url = new URL(request.url);
    const imputacionId = url.searchParams.get('id');

    if (!imputacionId) {
      return NextResponse.json({ error: 'ID de imputación es requerido' }, { status: 400 });
    }

    // Verificar que la imputación existe y pertenece al usuario
    const imputacion = await prisma.presupuestoImputacion.findFirst({
      where: {
        id: imputacionId,
        creadoPor: session.user.id
      }
    });

    if (!imputacion) {
      return NextResponse.json({ error: 'Imputación no encontrada' }, { status: 404 });
    }

    // Marcar como inactiva
    await prisma.presupuestoImputacion.update({
      where: { id: imputacionId },
      data: { activo: false }
    });

    return NextResponse.json({ message: 'Imputación eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar imputación:', error);
    return NextResponse.json({ error: 'Error al eliminar imputación' }, { status: 500 });
  }
} 