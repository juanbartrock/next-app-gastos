import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import prisma from '@/lib/prisma';

// Obtener todos los presupuestos del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(options);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Parámetros de consulta opcionales
    const url = new URL(request.url);
    const mes = url.searchParams.get('mes') ? parseInt(url.searchParams.get('mes')!) : null;
    const año = url.searchParams.get('año') ? parseInt(url.searchParams.get('año')!) : null;
    const categoriaId = url.searchParams.get('categoriaId') ? parseInt(url.searchParams.get('categoriaId')!) : null;

    // Construir filtro basado en parámetros opcionales
    const filter: any = {
      userId: session.user.id,
    };

    if (mes !== null) filter.mes = mes;
    if (año !== null) filter.año = año;
    if (categoriaId !== null) filter.categoriaId = categoriaId;

    const presupuestos = await prisma.presupuesto.findMany({
      where: filter,
      include: {
        categoria: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Para cada presupuesto, calcular el gasto actual del mes
    const presupuestosConGastos = await Promise.all(
      presupuestos.map(async (presupuesto: any) => {
        let gastoActual = 0;
        
        // Obtener gastos para el mes y año específicos en la categoría
        if (presupuesto.categoriaId) {
          const gastos = await prisma.gasto.findMany({
            where: {
              userId: session.user.id,
              categoriaId: presupuesto.categoriaId,
              tipoTransaccion: 'expense',
              tipoMovimiento: {
                not: 'tarjeta'  // Excluir gastos de tipo tarjeta
              },
              fecha: {
                gte: new Date(presupuesto.año, presupuesto.mes - 1, 1),
                lt: new Date(presupuesto.año, presupuesto.mes, 1),
              },
            },
          });
          
          gastoActual = gastos.reduce((sum, gasto) => sum + gasto.monto, 0);
        }
        
        return {
          ...presupuesto,
          gastoActual,
          porcentajeConsumido: presupuesto.monto > 0 ? (gastoActual / presupuesto.monto) * 100 : 0,
          disponible: presupuesto.monto - gastoActual,
        };
      })
    );

    return NextResponse.json(presupuestosConGastos);
  } catch (error) {
    console.error('Error al obtener presupuestos:', error);
    return NextResponse.json({ error: 'Error al obtener presupuestos' }, { status: 500 });
  }
}

// Crear un nuevo presupuesto
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(options);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    const { nombre, monto, categoriaId, mes, año } = await request.json();
    
    // Verificar si ya existe un presupuesto para esta categoría, mes y año
    const existingBudget = await prisma.presupuesto.findFirst({
      where: {
        userId: session.user.id,
        categoriaId,
        mes,
        año,
      },
    });
    
    if (existingBudget) {
      return NextResponse.json(
        { error: 'Ya existe un presupuesto para esta categoría en el período especificado' },
        { status: 400 }
      );
    }
    
    const presupuesto = await prisma.presupuesto.create({
      data: {
        nombre,
        monto,
        categoriaId,
        mes,
        año,
        userId: session.user.id,
      },
    });
    
    return NextResponse.json(presupuesto);
  } catch (error) {
    console.error('Error al crear presupuesto:', error);
    return NextResponse.json({ error: 'Error al crear presupuesto' }, { status: 500 });
  }
} 