import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import prisma from '@/lib/prisma';

// Obtener todos los presupuestos del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(options);
    
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Parámetros de consulta opcionales
    const url = new URL(request.url);
    const mes = url.searchParams.get('mes') ? parseInt(url.searchParams.get('mes')!) : null;
    const año = url.searchParams.get('año') ? parseInt(url.searchParams.get('año')!) : null;
    const categoriaId = url.searchParams.get('categoriaId') ? parseInt(url.searchParams.get('categoriaId')!) : null;

    // Construir filtro basado en parámetros opcionales
    const filter: any = {
      userId: session.user.id
    };

    if (mes !== null) filter.mes = mes;
    if (año !== null) filter.año = año;
    if (categoriaId !== null) filter.categoriaId = categoriaId;

    const presupuestos = await prisma.presupuesto.findMany({
      where: filter,
      include: {
        categoria: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Para cada presupuesto, calcular el gasto actual del mes
    const presupuestosConGastos = await Promise.all(
      presupuestos.map(async (presupuesto: any) => {
        let gastoActual = 0;
        let usuariosParaCalcular: string[] = [session.user.id!]; // Por defecto, solo el usuario actual
        
        console.log(`🔍 Procesando presupuesto: ${presupuesto.nombre} - Tipo: ${presupuesto.tipo} - GrupoId: ${presupuesto.grupoId}`);
        
        // Calcular cuánto se gastó el mes anterior para comparar
        let gastoMesAnterior = 0;
        
        // Obtener fechas del mes anterior
        const fechaMesAnterior = new Date(presupuesto.año, presupuesto.mes - 2, 1); // mes-2 porque mes está en base 1
        const añoMesAnterior = fechaMesAnterior.getFullYear();
        const numeroMesAnterior = fechaMesAnterior.getMonth() + 1; // getMonth() devuelve base 0
        
        // Si es presupuesto grupal, obtener todos los miembros del grupo
        if (presupuesto.tipo === 'grupal' && presupuesto.grupoId) {
          try {
            const miembrosGrupo = await prisma.grupoMiembro.findMany({
              where: { grupoId: presupuesto.grupoId },
              select: { userId: true }
            });
            
            // Obtener todos los IDs de usuarios del grupo
            const usuariosDelGrupo = miembrosGrupo.map(m => m.userId);
            
            if (usuariosDelGrupo.length > 0) {
              usuariosParaCalcular = usuariosDelGrupo;
            }
            
            console.log(`Presupuesto grupal ${presupuesto.nombre} - Usuarios para calcular:`, usuariosParaCalcular);
          } catch (error) {
            console.error('Error obteniendo miembros del grupo:', error);
          }
        }
        
        // Obtener categorías a considerar (puede ser múltiples)
        const categoriasParaCalcular: number[] = [];
        
        // Verificar si tiene múltiples categorías asociadas
        let categoriasDelPresupuesto: any[] = [];
        try {
          categoriasDelPresupuesto = await prisma.presupuestoCategoria.findMany({
            where: { 
              presupuestoId: presupuesto.id,
              activo: true 
            },
            include: {
              categoria: true
            }
          });
        } catch (error) {
          console.error(`Error obteniendo categorías para presupuesto ${presupuesto.nombre}:`, error);
        }
        
        if (categoriasDelPresupuesto.length > 0) {
          // Presupuesto con múltiples categorías
          categoriasParaCalcular.push(...categoriasDelPresupuesto.map(pc => pc.categoriaId));
        } else if (presupuesto.categoriaId) {
          // Presupuesto con una sola categoría (legacy)
          categoriasParaCalcular.push(presupuesto.categoriaId);
        }
        
        // Obtener gastos para el mes y año específicos en las categorías
        if (categoriasParaCalcular.length > 0) {
          try {
            // Obtener todos los gastos de las categorías para los usuarios relevantes
            const todosLosGastos = await prisma.gasto.findMany({
              where: {
                userId: { 
                  in: usuariosParaCalcular 
                },
                categoriaId: {
                  in: categoriasParaCalcular
                },
                tipoTransaccion: 'expense',
                tipoMovimiento: {
                  not: 'tarjeta'  // Excluir gastos de tipo tarjeta
                },
              },
              include: {
                user: { select: { name: true } }
              }
            });
            
            console.log(`Presupuesto ${presupuesto.nombre} - Total gastos encontrados:`, todosLosGastos.length, `- Categorías: [${categoriasParaCalcular.join(', ')}]`);
            
            // Filtrar por fecha contable (fechaImputacion si existe, sino fecha)
            const fechaInicio = new Date(presupuesto.año, presupuesto.mes - 1, 1);
            const fechaFin = new Date(presupuesto.año, presupuesto.mes, 1);
            
            const gastosFiltrados = todosLosGastos.filter(gasto => {
              const fechaContable = (gasto as any).fechaImputacion || gasto.fecha;
              return fechaContable >= fechaInicio && fechaContable < fechaFin;
            });
            
            console.log(`Presupuesto ${presupuesto.nombre} - Gastos filtrados por fecha (${presupuesto.mes}/${presupuesto.año}):`, gastosFiltrados.length);
            
            gastoActual = gastosFiltrados.reduce((sum, gasto) => sum + gasto.monto, 0);
            
            // Debug información para presupuestos grupales
            if (presupuesto.tipo === 'grupal') {
              const gastosPorUsuario = gastosFiltrados.reduce((acc: any, gasto: any) => {
                const userName = gasto.user?.name || 'Usuario sin nombre';
                acc[userName] = (acc[userName] || 0) + gasto.monto;
                return acc;
              }, {});
              
              console.log(`Presupuesto grupal ${presupuesto.nombre} - Resumen:`, {
                totalUsuarios: usuariosParaCalcular.length,
                totalGastos: gastosFiltrados.length,
                gastoActual,
                gastosPorUsuario,
                totalCategorias: categoriasParaCalcular.length,
                categorias: categoriasDelPresupuesto.map(c => c.categoria?.descripcion).join(', ')
              });
            }
          } catch (error) {
            console.error(`Error calculando gastos para presupuesto ${presupuesto.nombre}:`, error);
          }
        }
        
        // Calcular cuánto se gastó el mes anterior en la misma categoría
        let comparacionMesAnterior = null;
        if (presupuesto.categoriaId) {
          try {
            // Calcular gastos reales del mes anterior
            const gastosDelMesAnterior = await prisma.gasto.findMany({
              where: {
                userId: { 
                  in: usuariosParaCalcular 
                },
                categoriaId: presupuesto.categoriaId,
                tipoTransaccion: 'expense',
                tipoMovimiento: {
                  not: 'tarjeta'
                },
              }
            });
            
            // Filtrar por fechas del mes anterior
            const inicioMesAnterior = new Date(añoMesAnterior, numeroMesAnterior - 1, 1);
            const finMesAnterior = new Date(añoMesAnterior, numeroMesAnterior, 1);
            
            const gastosDelMesAnteriorFiltrados = gastosDelMesAnterior.filter(gasto => {
              const fechaContable = (gasto as any).fechaImputacion || gasto.fecha;
              return fechaContable >= inicioMesAnterior && fechaContable < finMesAnterior;
            });
            
            gastoMesAnterior = gastosDelMesAnteriorFiltrados.reduce((sum, gasto) => sum + gasto.monto, 0);
            
            // Comparar gasto del mes anterior con presupuesto actual
            const diferencia = gastoMesAnterior - presupuesto.monto;
            
            comparacionMesAnterior = {
              gastoMesAnterior: gastoMesAnterior,
              presupuestoActual: presupuesto.monto,
              diferencia: diferencia,
              color: gastoMesAnterior <= presupuesto.monto ? 'green' : 'red',
              añoMesAnterior: añoMesAnterior,
              numeroMesAnterior: numeroMesAnterior
            };
            
            console.log(`📊 Comparación simple para ${presupuesto.nombre}: Mes anterior: $${gastoMesAnterior}, Presupuesto actual: $${presupuesto.monto}`);
            
          } catch (error) {
            console.error(`Error calculando gasto mes anterior para ${presupuesto.nombre}:`, error);
          }
        }
        
        return {
          ...presupuesto,
          gastoActual,
          porcentajeConsumido: presupuesto.monto > 0 ? (gastoActual / presupuesto.monto) * 100 : 0,
          disponible: presupuesto.monto - gastoActual,
          esGrupal: presupuesto.tipo === 'grupal',
          tipoDescripcion: presupuesto.tipo === 'grupal' ? 'Grupal' : 'Personal',
          totalUsuarios: usuariosParaCalcular.length,
          totalCategorias: categoriasParaCalcular?.length || 0,
          categoriasInfo: categoriasDelPresupuesto?.map(c => ({
            id: c.categoriaId,
            nombre: c.categoria?.descripcion,
            porcentaje: c.porcentaje
          })) || [],
          // NUEVA: Comparación con mes anterior
          comparacionMesAnterior: comparacionMesAnterior
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
    
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    const { nombre, descripcion, monto, categoriaId, mes, año, tipo, grupoId, categorias } = await request.json();
    
    // Validaciones básicas
    if (!nombre || !monto || !mes || !año) {
      return NextResponse.json(
        { error: 'Nombre, monto, mes y año son obligatorios' },
        { status: 400 }
      );
    }
    
    // Validar que si es grupal, tenga grupoId
    if (tipo === 'grupal' && !grupoId) {
      return NextResponse.json(
        { error: 'Para presupuestos grupales debe seleccionar un grupo' },
        { status: 400 }
      );
    }
    
    // Validar que el grupo existe y el usuario pertenece a él (si es grupal)
    if (tipo === 'grupal' && grupoId) {
      const miembroGrupo = await prisma.grupoMiembro.findFirst({
        where: {
          grupoId: grupoId,
          userId: session.user.id!
        }
      });
      
      if (!miembroGrupo) {
        return NextResponse.json(
          { error: 'No tienes permisos para crear presupuestos en este grupo' },
          { status: 403 }
        );
      }
    }
    
    // Verificar si ya existe un presupuesto similar
    const existingBudget = await prisma.presupuesto.findFirst({
      where: {
        nombre: nombre,
        mes: mes,
        año: año,
        userId: session.user.id
      },
    });
    
    if (existingBudget) {
      return NextResponse.json(
        { error: 'Ya existe un presupuesto con ese nombre para este período' },
        { status: 400 }
      );
    }
    
    // Usar transacción para crear presupuesto y categorías asociadas
    const presupuesto = await prisma.$transaction(async (tx) => {
      // Crear el presupuesto base
      const datosPresupuesto: any = {
        nombre,
        monto,
        categoriaId: categoriaId || null,
        mes,
        año,
        userId: session.user.id!,
      };
      
      // Agregar campos adicionales si están disponibles
      if (descripcion) datosPresupuesto.descripcion = descripcion;
      if (tipo) datosPresupuesto.tipo = tipo;
      if (tipo === 'grupal' && grupoId) datosPresupuesto.grupoId = grupoId;
      
      const nuevoPresupuesto = await tx.presupuesto.create({
        data: datosPresupuesto,
        include: {
          categoria: true,
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      // Si se proporcionan múltiples categorías, crearlas
      if (categorias && Array.isArray(categorias) && categorias.length > 0) {
        await tx.presupuestoCategoria.createMany({
          data: categorias.map((cat: any) => ({
            presupuestoId: nuevoPresupuesto.id,
            categoriaId: cat.categoriaId,
            porcentaje: cat.porcentaje || 100,
            montoMaximo: cat.montoMaximo || null,
            activo: true
          }))
        });
      }

      return nuevoPresupuesto;
    });
    
    console.log(`✅ Presupuesto creado: ${presupuesto.nombre} - Tipo: ${(presupuesto as any).tipo || 'personal'}${(presupuesto as any).grupoId ? ` - Grupo: ${(presupuesto as any).grupoId}` : ''}`);
     
    return NextResponse.json(presupuesto);
  } catch (error) {
    console.error('Error al crear presupuesto:', error);
    return NextResponse.json({ error: 'Error al crear presupuesto' }, { status: 500 });
  }
} 