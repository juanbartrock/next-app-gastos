import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import prisma from '@/lib/prisma';

// Obtener un presupuesto específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(options);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // ✅ NEXT.JS 15: Await params requerido
    const { id } = await params;
    
    const presupuesto = await prisma.presupuesto.findUnique({
      where: {
        id,
      },
      include: {
        categoria: true,
        grupo: {
          include: {
            miembros: {
              include: {
                user: { select: { id: true, name: true } }
              }
            }
          }
        },
        categorias: {
          include: {
            categoria: true
          }
        }
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
    let usuariosParaCalcular: string[] = [session.user.id!]; // Por defecto, solo el usuario actual
    
    // Si es presupuesto grupal, obtener todos los miembros del grupo
    if (presupuesto.tipo === 'grupal' && presupuesto.grupoId && presupuesto.grupo) {
      const usuariosDelGrupo = presupuesto.grupo.miembros.map(m => m.userId);
      if (usuariosDelGrupo.length > 0) {
        usuariosParaCalcular = usuariosDelGrupo;
      }
    }
    
    // Obtener categorías a considerar (puede ser múltiples)
    const categoriasParaCalcular: number[] = [];
    
    if (presupuesto.categorias && presupuesto.categorias.length > 0) {
      // Presupuesto con múltiples categorías
      categoriasParaCalcular.push(...presupuesto.categorias.map(pc => pc.categoriaId));
    } else if (presupuesto.categoriaId) {
      // Presupuesto con una sola categoría (legacy)
      categoriasParaCalcular.push(presupuesto.categoriaId);
    }
    
    if (categoriasParaCalcular.length > 0) {
      // Obtener todos los gastos para las categorías y usuarios relevantes
      const gastos = await prisma.gasto.findMany({
        where: {
          userId: { 
            in: usuariosParaCalcular 
          },
          categoriaId: {
            in: categoriasParaCalcular
          },
          tipoTransaccion: 'expense',
          tipoMovimiento: {
            not: 'tarjeta'
          },
        },
        include: {
          user: { select: { name: true } }
        }
      });
      
      // Filtrar por fecha contable (fechaImputacion si existe, sino fecha)
      const fechaInicio = new Date(presupuesto.año, presupuesto.mes - 1, 1);
      const fechaFin = new Date(presupuesto.año, presupuesto.mes, 1);
      
      const gastosFiltrados = gastos.filter(gasto => {
        const fechaContable = (gasto as any).fechaImputacion || gasto.fecha;
        return fechaContable >= fechaInicio && fechaContable < fechaFin;
      });
      
      gastoActual = gastosFiltrados.reduce((sum, gasto) => sum + gasto.monto, 0);
    }
    
    const presupuestoConGasto = {
      ...presupuesto,
      gastoActual,
      porcentajeConsumido: presupuesto.monto > 0 ? (gastoActual / presupuesto.monto) * 100 : 0,
      disponible: presupuesto.monto - gastoActual,
      esGrupal: presupuesto.tipo === 'grupal',
      tipoDescripcion: presupuesto.tipo === 'grupal' ? 'Grupal' : 'Personal',
      totalUsuarios: usuariosParaCalcular.length,
      totalCategorias: categoriasParaCalcular.length
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(options);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // ✅ NEXT.JS 15: Await params requerido
    const { id } = await params;
    const { 
      nombre, 
      monto, 
      categoriaId, 
      mes, 
      año, 
      descripcion,
      tipo = 'personal',
      grupoId,
      categorias = []
    } = await request.json();
    
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
    
    // Usar transacción para actualizar presupuesto y categorías
    const presupuesto = await prisma.$transaction(async (tx) => {
      // Actualizar presupuesto principal
      const presupuestoActualizado = await tx.presupuesto.update({
        where: { id },
        data: {
          nombre,
          monto,
          categoriaId,
          mes,
          año,
          descripcion,
          tipo,
          grupoId: tipo === 'grupal' ? grupoId : null,
        },
      });

      // Actualizar categorías asociadas si se proporcionan
      if (categorias && categorias.length > 0) {
        // Eliminar categorías existentes
        await tx.presupuestoCategoria.deleteMany({
          where: { presupuestoId: id }
        });

        // Crear nuevas asociaciones de categorías
        await tx.presupuestoCategoria.createMany({
          data: categorias.map((cat: any) => ({
            presupuestoId: id,
            categoriaId: cat.categoriaId,
            porcentaje: cat.porcentaje || 100,
            montoMaximo: cat.montoMaximo || null,
            activo: true
          }))
        });
      }

      return presupuestoActualizado;
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(options);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // ✅ NEXT.JS 15: Await params requerido
    const { id } = await params;
    
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