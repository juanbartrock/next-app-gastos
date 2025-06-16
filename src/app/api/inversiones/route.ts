import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options';
import prisma, { executeWithTimeout } from '@/lib/prisma';

// GET /api/inversiones - Obtener todas las inversiones del usuario
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener todas las inversiones del usuario con su tipo usando timeout
    const inversiones = await executeWithTimeout(async () => {
      return await prisma.inversion.findMany({
        where: {
          userId: session.user.id as string,
        },
        include: {
          tipo: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 100 // Límite de seguridad
      })
    }, 15000, 3)

    return NextResponse.json({ inversiones });
  } catch (error) {
    console.error('Error al obtener inversiones:', error);
    return NextResponse.json(
      { error: 'Error al obtener inversiones' },
      { status: 500 }
    );
  }
}

// POST /api/inversiones - Crear una nueva inversión
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await req.json();
    
    // Validar datos mínimos necesarios
    if (!data.nombre || !data.montoInicial || !data.tipoId) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    console.log("Datos recibidos:", {
      nombre: data.nombre,
      tipoId: data.tipoId,
      userId: session.user.id
    });

    // Verificar que el tipo de inversión exista
    const tipoInversion = await prisma.tipoInversion.findUnique({
      where: {
        id: data.tipoId
      }
    });

    console.log("Tipo encontrado:", tipoInversion);

    if (!tipoInversion) {
      return NextResponse.json(
        { error: `El tipo de inversión seleccionado no existe (ID: ${data.tipoId})` },
        { status: 400 }
      );
    }

    // Buscar la categoría "Inversiones" (creada anteriormente)
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

    // Usar transacción para crear inversión y gasto automáticamente
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Crear la nueva inversión
      const nuevaInversion = await tx.inversion.create({
        data: {
          nombre: data.nombre,
          descripcion: data.descripcion,
          montoInicial: parseFloat(data.montoInicial),
          montoActual: parseFloat(data.montoInicial), // Inicialmente igual al monto inicial
          rendimientoTotal: 0,
          rendimientoAnual: data.rendimientoAnual ? parseFloat(data.rendimientoAnual) : null,
          fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : new Date(),
          fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : null,
          tipoId: data.tipoId,
          userId: session.user.id as string,
          plataforma: data.plataforma,
          notas: data.notas,
        },
      });

      // 2. Crear gasto automático por la inversión realizada
      const gastoInversion = await tx.gasto.create({
        data: {
          concepto: `Inversión: ${data.nombre} (${tipoInversion.nombre})`,
          monto: parseFloat(data.montoInicial),
          fecha: data.fechaInicio ? new Date(data.fechaInicio) : new Date(),
          categoria: categoriaInversiones.descripcion, // Campo legacy
          categoriaId: categoriaInversiones.id,
          tipoTransaccion: 'expense', // Es un gasto (salida de dinero)
          tipoMovimiento: 'digital', // Por defecto digital
          userId: session.user.id as string,
          incluirEnFamilia: true,
          fechaImputacion: data.fechaInicio ? new Date(data.fechaInicio) : new Date()
        }
      });

      console.log('✅ Inversión creada:', nuevaInversion.id);
      console.log('✅ Gasto automático creado:', gastoInversion.id);

      return { inversion: nuevaInversion, gastoGenerado: gastoInversion };
    });

    return NextResponse.json({ 
      inversion: resultado.inversion,
      gastoGenerado: resultado.gastoGenerado,
      message: 'Inversión creada con éxito. Se generó automáticamente el registro del gasto.' 
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear inversión:', error);
    return NextResponse.json(
      { error: 'Error al crear la inversión' },
      { status: 500 }
    );
  }
} 