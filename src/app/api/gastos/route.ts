import { NextRequest, NextResponse } from "next/server"
import prisma, { executeWithTimeout } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"
import { createInitialCategories } from "@/lib/dbSetup";
import { z } from "zod"
import { validateLimit, incrementUsage } from "@/lib/plan-limits"
import { calcularEstadoRecurrente } from "@/lib/gastos-recurrentes-utils"

// Remover la llamada automática para evitar creaciones duplicadas
// createInitialCategories().catch(error => {
//   console.error("Error al inicializar categorías al cargar el módulo:", error);
// });

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const desde = url.searchParams.get('desde')
    const hasta = url.searchParams.get('hasta')
    const soloFamiliares = url.searchParams.get('soloFamiliares') === 'true'
    const soloPersonales = url.searchParams.get('soloPersonales') === 'true'
    const includeDetailsCount = url.searchParams.get('includeDetails') === 'true'
    const usarFechaImputacion = url.searchParams.get('usarFechaImputacion') === 'true'

    // Parsear fechas si se proporcionaron
    const fechaDesde = desde ? new Date(desde) : null
    const fechaHasta = hasta ? new Date(hasta) : null

    // Validar fechas
    if ((desde && isNaN(fechaDesde?.getTime() || 0)) || (hasta && isNaN(fechaHasta?.getTime() || 0))) {
      return NextResponse.json(
        { error: 'Formato de fecha inválido' },
        { status: 400 }
      )
    }
    
    // Buscar usuario por email con timeout
    const usuario = await executeWithTimeout(async () => {
      return session?.user?.email 
        ? await prisma.user.findUnique({
            where: { email: session.user.email }
          })
        : null
    }, 15000, 3)

    if (!usuario) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Construir condiciones de consulta - Solo gastos del usuario logueado
    let whereCondition: any = {
      userId: usuario.id,
      // Excluir los gastos de tipo tarjeta para que no impacten en el flujo de dinero
      NOT: [
        { tipoMovimiento: "tarjeta" }
      ]
    }

    // Filtros adicionales
    if (soloFamiliares) {
      whereCondition.incluirEnFamilia = true
    } else if (soloPersonales) {
      whereCondition.incluirEnFamilia = false
    }
    
    // Agregar condiciones de fecha si se proporcionaron
    if (fechaDesde || fechaHasta) {
      whereCondition.AND = []
      
      if (fechaDesde) {
        const condicionFecha = usarFechaImputacion ? {
          OR: [
            { fechaImputacion: { gte: fechaDesde } },  // Usar fechaImputacion si existe
            { 
              AND: [
                { fechaImputacion: null },  // Si no hay fechaImputacion
                { fecha: { gte: fechaDesde } }  // Usar fecha normal
              ]
            }
          ]
        } : {
          fecha: { gte: fechaDesde }
        }
        
        whereCondition.AND.push(condicionFecha)
      }
      
      if (fechaHasta) {
        const condicionFecha = usarFechaImputacion ? {
          OR: [
            { fechaImputacion: { lte: fechaHasta } },  // Usar fechaImputacion si existe
            { 
              AND: [
                { fechaImputacion: null },  // Si no hay fechaImputacion
                { fecha: { lte: fechaHasta } }  // Usar fecha normal
              ]
            }
          ]
        } : {
          fecha: { lte: fechaHasta }
        }
        
        whereCondition.AND.push(condicionFecha)
      }
    }
    
    // Obtener gastos del usuario con timeout optimizado
    const gastos = await executeWithTimeout(async () => {
      return await prisma.gasto.findMany({
        where: whereCondition,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          categoriaRel: {
            select: {
              id: true,
              descripcion: true,
              grupo_categoria: true
            }
          },
          // Incluir detalles solo si se solicita explícitamente
          ...(includeDetailsCount && {
            detalles: {
              select: {
                id: true,
                descripcion: true,
                cantidad: true,
                subtotal: true
              },
              take: 10 // Limitar para performance
            }
          })
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 1000 // Límite de seguridad
      })
    }, 20000, 3) // Timeout más largo para consultas complejas
    
    return NextResponse.json(gastos)
  } catch (error) {
    console.error('Error al obtener gastos:', error)
    return NextResponse.json(
      { error: 'Error al obtener los gastos' },
      { status: 500 }
    )
  }
}

// Función para crear categorías iniciales si no existen
async function crearCategoriasIniciales() {
  // Lista de categorías predefinidas
  const categoriasPredefinidas = [
    { descripcion: "Alimentación", grupo_categoria: "Necesidades básicas" },
    { descripcion: "Transporte", grupo_categoria: "Necesidades básicas" },
    { descripcion: "Servicios", grupo_categoria: "Hogar" },
    { descripcion: "Ocio", grupo_categoria: "Personal" },
    { descripcion: "Otros", grupo_categoria: null }
  ];

  try {
    console.log("Inicializando categorías...");
    
    // Primero verificamos si ya existen categorías para no duplicarlas
    let categoriasExistentes = [];
    try {
      // Intentamos listar las categorías existentes
      categoriasExistentes = await prisma.categoria.findMany({
        select: { descripcion: true }
      });
      console.log(`Se encontraron ${categoriasExistentes.length} categorías existentes`);
    } catch (error) {
      console.error("Error al consultar categorías existentes:", error);
      // Si hay un error consultando, asumimos que no hay categorías
      categoriasExistentes = [];
    }
    
    // Si no hay categorías, las creamos una por una
    if (categoriasExistentes.length === 0) {
      console.log("No se encontraron categorías. Creando categorías iniciales...");
      
      // Usamos un bucle for para crear cada categoría individualmente
      // Esto es más seguro que createMany en caso de problemas de conexión
      for (const cat of categoriasPredefinidas) {
        try {
          const nuevaCategoria = await prisma.categoria.create({
            data: {
              descripcion: cat.descripcion,
              grupo_categoria: cat.grupo_categoria,
              status: true
            }
          });
          console.log(`Categoría creada: ${nuevaCategoria.descripcion}`);
        } catch (errorCreacion) {
          console.error(`Error al crear categoría ${cat.descripcion}:`, errorCreacion);
        }
      }
      console.log("Proceso de creación de categorías iniciales completado");
    } else {
      console.log("Ya existen categorías en la base de datos, no se crearán nuevas");
    }
  } catch (error) {
    console.error("Error general al crear categorías iniciales:", error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(options)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    // Obtener usuario
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }
    
    const { 
      concepto, 
      monto, 
      categoria, 
      categoriaId, 
      tipoTransaccion, 
      tipoMovimiento, 
      fecha, 
      fechaImputacion,
      incluirEnFamilia = true,
      gastoRecurrenteId  // NUEVO: ID del gasto recurrente a asociar
    } = await request.json()

    // Verificar que la categoría existe si se proporciona un ID
    let categoriaExiste = null
    let nombreCategoria = categoria;
    
    if (categoriaId) {
      categoriaExiste = await prisma.categoria.findUnique({
        where: { id: Number(categoriaId) }
      });
      
      if (!categoriaExiste) {
        return NextResponse.json(
          { error: 'La categoría seleccionada no existe' },
          { status: 400 }
        )
      }
      
      if (categoriaExiste && !categoria) {
        nombreCategoria = categoriaExiste.descripcion;
      }
    }

    // NUEVO: Verificar gasto recurrente si se proporciona
    let gastoRecurrente = null;
    if (gastoRecurrenteId) {
      gastoRecurrente = await prisma.gastoRecurrente.findFirst({
        where: {
          id: Number(gastoRecurrenteId),
          userId: usuario.id  // Verificar que pertenece al usuario
        }
      });
      
      if (!gastoRecurrente) {
        return NextResponse.json(
          { error: 'El gasto recurrente seleccionado no existe o no tienes permisos' },
          { status: 400 }
        )
      }
    }

    // Procesar fecha de imputación
    let fechaImputacionProcessed = null;
    if (fechaImputacion) {
      try {
        fechaImputacionProcessed = new Date(fechaImputacion);
        if (isNaN(fechaImputacionProcessed.getTime())) {
          fechaImputacionProcessed = null;
        }
      } catch (error) {
        fechaImputacionProcessed = null;
      }
    }

    // ✅ VALIDAR LÍMITES DEL PLAN
    const validacionTransacciones = await validateLimit(usuario.id, 'transacciones_mes');
    if (!validacionTransacciones.allowed) {
      return NextResponse.json({
        error: 'Límite de transacciones alcanzado',
        codigo: 'LIMIT_REACHED',
        limite: validacionTransacciones.limit,
        uso: validacionTransacciones.usage,
        upgradeRequired: true,
        mensaje: validacionTransacciones.limit === 50 
          ? 'Has alcanzado el límite de 50 transacciones mensuales del Plan Gratuito. Upgrade al Plan Básico para transacciones ilimitadas.'
          : 'Has alcanzado el límite de transacciones de tu plan actual.'
      }, { status: 403 })
    }

    // Usar transacción para crear gasto y actualizar recurrente
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear el gasto
      const gasto = await tx.gasto.create({
        data: {
          concepto,
          monto,
          categoria: nombreCategoria || categoria || 'Sin categoría',
          tipoTransaccion: tipoTransaccion || 'expense',
          tipoMovimiento: tipoMovimiento || 'efectivo',
          fecha: fecha || new Date(),
          fechaImputacion: fechaImputacionProcessed,
          updatedAt: new Date(),
          userId: usuario.id,
          incluirEnFamilia: Boolean(incluirEnFamilia),
          ...(categoriaId && { categoriaId }),
          ...(gastoRecurrenteId && { gastoRecurrenteId: Number(gastoRecurrenteId) })
        }
      })

      // Si está asociado a un recurrente, actualizar su estado
      if (gastoRecurrente) {
        // Obtener todos los pagos del gasto recurrente (incluyendo el que acabamos de crear)
        const todosPagos = await tx.gasto.findMany({
          where: { gastoRecurrenteId: gastoRecurrente.id },
          select: {
            id: true,
            monto: true,
            fecha: true,
            fechaImputacion: true
          }
        });

        // Usar las nuevas utilidades para calcular el estado correcto por período
        const estadoCalculado = calcularEstadoRecurrente(gastoRecurrente, todosPagos);

        // Actualizar el gasto recurrente
        await tx.gastoRecurrente.update({
          where: { id: gastoRecurrente.id },
          data: {
            estado: estadoCalculado.estado,
            ultimoPago: new Date(),
            updatedAt: new Date()
          }
        });
      }

      return gasto;
    });

    // ✅ INCREMENTAR CONTADOR DE USO
    await incrementUsage(usuario.id, 'transacciones_mes');

    return NextResponse.json(resultado)
  } catch (error) {
    console.error('Error al crear gasto:', error)
    return NextResponse.json(
      { error: 'Error al crear el gasto' },
      { status: 500 }
    )
  }
}

// Remover la llamada automática al final del archivo para evitar duplicación
// crearCategoriasIniciales().catch(console.error); 