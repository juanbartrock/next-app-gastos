import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options';
import prisma from '@/lib/prisma';

// POST /api/inversiones/[id]/retirar - Retirar dinero de una inversión (parcial o total)
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
    const { montoRetiro, tipoRetiro, fecha, notas } = data;

    // Validar datos
    if (!montoRetiro || montoRetiro <= 0) {
      return NextResponse.json(
        { error: 'El monto de retiro debe ser mayor a 0' },
        { status: 400 }
      );
    }

    if (!['parcial', 'total'].includes(tipoRetiro)) {
      return NextResponse.json(
        { error: 'Tipo de retiro debe ser "parcial" o "total"' },
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
        { error: 'No se puede retirar de una inversión que no está activa' },
        { status: 400 }
      );
    }

    // Verificar que hay suficiente dinero para retirar
    if (montoRetiro > inversion.montoActual) {
      return NextResponse.json(
        { error: `Monto insuficiente. Disponible: $${inversion.montoActual.toLocaleString()}` },
        { status: 400 }
      );
    }

    // Buscar la categoría "Renta"
    const categoriaRenta = await prisma.categoria.findFirst({
      where: {
        descripcion: 'Renta',
        status: true
      }
    });

    if (!categoriaRenta) {
      return NextResponse.json(
        { error: 'Categoría "Renta" no encontrada. Contacte al administrador.' },
        { status: 500 }
      );
    }

    // Calcular nuevo monto actual y rendimientos
    const nuevoMontoActual = inversion.montoActual - montoRetiro;
    const rendimientoGenerado = Math.max(0, montoRetiro - inversion.montoInicial);
    const nuevoRendimientoTotal = Math.max(0, inversion.rendimientoTotal - rendimientoGenerado);

    // Usar transacción para actualizar inversión y crear ingreso
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Crear ingreso automático por el retiro
      const ingresoRetiro = await tx.gasto.create({
        data: {
          concepto: tipoRetiro === 'total' 
            ? `Retiro total: ${inversion.nombre} (${inversion.tipo.nombre})`
            : `Retiro parcial: ${inversion.nombre} (${inversion.tipo.nombre})`,
          monto: parseFloat(montoRetiro.toString()),
          fecha: fecha ? new Date(fecha) : new Date(),
          categoria: categoriaRenta.descripcion, // Campo legacy
          categoriaId: categoriaRenta.id,
          tipoTransaccion: 'income', // Es un ingreso (entrada de dinero)
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
          tipo: tipoRetiro === 'total' ? 'retiro_total' : 'retiro_parcial',
          monto: parseFloat(montoRetiro.toString()),
          fecha: fecha ? new Date(fecha) : new Date(),
          descripcion: notas || `${tipoRetiro === 'total' ? 'Retiro total' : 'Retiro parcial'} de la inversión`
        }
      });

      // 3. Actualizar la inversión
      const inversionActualizada = await tx.inversion.update({
        where: { id: inversion.id },
        data: {
          montoActual: tipoRetiro === 'total' ? 0 : nuevoMontoActual,
          rendimientoTotal: tipoRetiro === 'total' ? 0 : nuevoRendimientoTotal,
          estado: tipoRetiro === 'total' ? 'cerrada' : 'activa',
          ...(tipoRetiro === 'total' && { fechaVencimiento: new Date() }) // Si es retiro total, marcar como vencida
        },
        include: {
          tipo: true
        }
      });

      console.log(`✅ ${tipoRetiro === 'total' ? 'Retiro total' : 'Retiro parcial'} procesado:`, {
        inversionId: inversion.id,
        montoRetirado: montoRetiro,
        nuevoMontoActual: inversionActualizada.montoActual,
        ingresoGenerado: ingresoRetiro.id
      });

      return { 
        inversion: inversionActualizada, 
        transaccion: transaccionInversion,
        ingresoGenerado: ingresoRetiro 
      };
    });

    return NextResponse.json({
      inversion: resultado.inversion,
      transaccion: resultado.transaccion,
      ingresoGenerado: resultado.ingresoGenerado,
      message: tipoRetiro === 'total' 
        ? `Retiro total procesado. Se cerró la inversión y se generó un ingreso de $${montoRetiro.toLocaleString()}.`
        : `Retiro parcial procesado. Se generó un ingreso de $${montoRetiro.toLocaleString()}. Monto restante: $${resultado.inversion.montoActual.toLocaleString()}.`
    }, { status: 200 });

  } catch (error) {
    console.error('Error al procesar retiro:', error);
    return NextResponse.json(
      { error: 'Error al procesar el retiro' },
      { status: 500 }
    );
  }
} 