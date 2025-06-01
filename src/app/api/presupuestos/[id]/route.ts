import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import prisma from '@/lib/prisma';

// Obtener un presupuesto específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(options);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // El ID es string, no necesita parseInt
    const id = params.id;
    
    const presupuesto = await prisma.presupuesto.findUnique({
      where: {
        id,
      },
      include: {
        categoria: true,
      },
    });
    
    if (!presupuesto) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });
    }
    
    if (presupuesto.userId !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    
    // Calcular el gasto actual para este presupuesto
    let gastoActual = 0;
    
    if (presupuesto.categoriaId) {
      const gastos = await prisma.gasto.findMany({
        where: {
          userId: session.user.id,
          categoriaId: presupuesto.categoriaId,
          tipoTransaccion: 'expense',
          tipoMovimiento: {
            not: 'tarjeta'
          },
          fecha: {
            gte: new Date(presupuesto.año, presupuesto.mes - 1, 1),
            lt: new Date(presupuesto.año, presupuesto.mes, 1),
          },
        },
      });
      
      gastoActual = gastos.reduce((sum, gasto) => sum + gasto.monto, 0);
    }
    
    const presupuestoConGasto = {
      ...presupuesto,
      gastoActual,
      porcentajeConsumido: presupuesto.monto > 0 ? (gastoActual / presupuesto.monto) * 100 : 0,
      disponible: presupuesto.monto - gastoActual,
    };
    
    return NextResponse.json(presupuestoConGasto);
  } catch (error) {
    console.error('Error al obtener presupuesto:', error);
    return NextResponse.json({ error: 'Error al obtener presupuesto' }, { status: 500 });
  }
}

// Actualizar un presupuesto
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(options);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // El ID es string, no necesita parseInt
    const id = params.id;
    const { nombre, monto, categoriaId, mes, año } = await request.json();
    
    // Verificar que el presupuesto existe y pertenece al usuario
    const existingBudget = await prisma.presupuesto.findUnique({
      where: {
        id,
      },
    });
    
    if (!existingBudget) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });
    }
    
    if (existingBudget.userId !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    
    // Si se está cambiando la categoría, mes o año, verificar que no exista otro presupuesto
    if (
      categoriaId !== existingBudget.categoriaId ||
      mes !== existingBudget.mes ||
      año !== existingBudget.año
    ) {
      const duplicateBudget = await prisma.presupuesto.findFirst({
        where: {
          userId: session.user.id,
          categoriaId,
          mes,
          año,
          id: {
            not: id,
          },
        },
      });
      
      if (duplicateBudget) {
        return NextResponse.json(
          { error: 'Ya existe un presupuesto para esta categoría en el período especificado' },
          { status: 400 }
        );
      }
    }
    
    const presupuesto = await prisma.presupuesto.update({
      where: {
        id,
      },
      data: {
        nombre,
        monto,
        categoriaId,
        mes,
        año,
      },
    });
    
    return NextResponse.json(presupuesto);
  } catch (error) {
    console.error('Error al actualizar presupuesto:', error);
    return NextResponse.json({ error: 'Error al actualizar presupuesto' }, { status: 500 });
  }
}

// Eliminar un presupuesto
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(options);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // El ID es string, no necesita parseInt
    const id = params.id;
    
    // Verificar que el presupuesto existe y pertenece al usuario
    const existingBudget = await prisma.presupuesto.findUnique({
      where: {
        id,
      },
    });
    
    if (!existingBudget) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });
    }
    
    if (existingBudget.userId !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    
    await prisma.presupuesto.delete({
      where: {
        id,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar presupuesto:', error);
    return NextResponse.json({ error: 'Error al eliminar presupuesto' }, { status: 500 });
  }
} 