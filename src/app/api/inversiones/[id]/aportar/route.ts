import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options';
import prisma from '@/lib/prisma';

// POST /api/inversiones/[id]/aportar - Agregar dinero a una inversión existente
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: inversionId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { montoAporte, fecha, notas } = data;

    // Validar datos
    if (!montoAporte || montoAporte <= 0) {
      return NextResponse.json(
        { error: 'El monto del aporte debe ser mayor a 0' },
        { status: 400 }
      );
    }

    // Verificar que la inversión existe y pertenece al usuario
    const inversion = await prisma.inversion.findFirst({
      where: {
        id: inversionId,
        userId: session.user.id
      },
      include: {
        tipo: true
      }
    });

    if (!inversion) {
      return NextResponse.json(
        { error: 'Inversión no encontrada' },
        { status: 404 }
      );
    }

    if (inversion.estado !== 'activa') {
      return NextResponse.json(
        { error: 'No se puede aportar a una inversión que no está activa' },
        { status: 400 }
      );
    }

    // Buscar la categoría "Inversiones"
    const categoriaInversiones = await prisma.categoria.findFirst({
      where: {
        descripcion: 'Inversiones',
        status: true
      }
    });

    if (!categoriaInversiones) {
      return NextResponse.json(
        { error: 'Categoría "Inversiones" no encontrada. Contacte al administrador.' },
        { status: 500 }
      );
    }

    // Calcular nuevo monto actual
    const nuevoMontoActual = inversion.montoActual + montoAporte;
    const nuevoMontoInicial = inversion.montoInicial + montoAporte;

    // Usar transacción para actualizar inversión y crear gasto
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Crear gasto automático por el aporte adicional
      const gastoAporte = await tx.gasto.create({
        data: {
          concepto: `Aporte adicional: ${inversion.nombre} (${inversion.tipo.nombre})`,
          monto: parseFloat(montoAporte.toString()),
          fecha: fecha ? new Date(fecha) : new Date(),
          categoria: categoriaInversiones.descripcion, // Campo legacy
          categoriaId: categoriaInversiones.id,
          tipoTransaccion: 'expense', // Es un gasto (salida de dinero)
          tipoMovimiento: 'digital', // Por defecto digital
          userId: session.user.id as string,
          incluirEnFamilia: true,
          fechaImputacion: fecha ? new Date(fecha) : new Date()
        }
      });

      // 2. Registrar la transacción en TransaccionInversion
      const transaccionInversion = await tx.transaccionInversion.create({
        data: {
          inversionId: inversion.id,
          tipo: 'aporte_adicional',
          monto: parseFloat(montoAporte.toString()),
          fecha: fecha ? new Date(fecha) : new Date(),
          descripcion: notas || 'Aporte adicional a la inversión'
        }
      });

      // 3. Actualizar la inversión
      const inversionActualizada = await tx.inversion.update({
        where: { id: inversion.id },
        data: {
          montoInicial: nuevoMontoInicial, // Actualizar también el monto inicial
          montoActual: nuevoMontoActual,
          // rendimientoTotal se mantiene igual
        },
        include: {
          tipo: true
        }
      });

      console.log('✅ Aporte adicional procesado:', {
        inversionId: inversion.id,
        montoAportado: montoAporte,
        nuevoMontoActual: inversionActualizada.montoActual,
        gastoGenerado: gastoAporte.id
      });

      return { 
        inversion: inversionActualizada, 
        transaccion: transaccionInversion,
        gastoGenerado: gastoAporte 
      };
    });

    return NextResponse.json({
      inversion: resultado.inversion,
      transaccion: resultado.transaccion,
      gastoGenerado: resultado.gastoGenerado,
      message: `Aporte adicional procesado exitosamente. Se generó un gasto de $${montoAporte.toLocaleString()}. Nuevo monto total: $${resultado.inversion.montoActual.toLocaleString()}.`
    }, { status: 200 });

  } catch (error) {
    console.error('Error al procesar aporte:', error);
    return NextResponse.json(
      { error: 'Error al procesar el aporte' },
      { status: 500 }
    );
  }
} 