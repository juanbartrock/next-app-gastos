import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options';
import prisma from '@/lib/prisma';

// GET /api/inversiones/[id]/transacciones - Obtener transacciones relacionadas con una inversión
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: inversionId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que la inversión pertenece al usuario
    const inversion = await prisma.inversion.findFirst({
      where: { 
        id: inversionId,
        userId: session.user.id 
      }
    });

    if (!inversion) {
      return NextResponse.json({ error: 'Inversión no encontrada' }, { status: 404 });
    }

    // Buscar gastos relacionados con esta inversión
    // Los gastos de inversión se identifican por:
    // 1. Categoría "Inversiones" (egresos cuando se invierte)
    // 2. Categoría "Renta" (ingresos cuando se retira)
    // 3. Concepto que incluye el nombre de la inversión

    const transacciones = await prisma.gasto.findMany({
      where: {
        userId: session.user.id,
        OR: [
          {
            // Gastos de inversión (salidas de dinero)
            AND: [
              { categoria: 'Inversiones' },
              { concepto: { contains: inversion.nombre, mode: 'insensitive' } }
            ]
          },
          {
            // Ingresos de renta (retiros o ganancias)
            AND: [
              { categoria: 'Renta' },
              { concepto: { contains: inversion.nombre, mode: 'insensitive' } }
            ]
          }
        ]
      },
      orderBy: { fecha: 'desc' }
    });

    // Mapear las transacciones a un formato más amigable
    const transaccionesMapeadas = transacciones.map(transaccion => ({
      id: transaccion.id.toString(),
      tipo: transaccion.tipoTransaccion === 'expense' ? 'Inversión' : 'Retiro/Ganancia',
      monto: transaccion.monto,
      fecha: transaccion.fecha.toISOString(),
      descripcion: transaccion.concepto
    }));

    return NextResponse.json({ 
      transacciones: transaccionesMapeadas,
      total: transaccionesMapeadas.length
    });

  } catch (error) {
    console.error('Error al obtener transacciones de inversión:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
} 