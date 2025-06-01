import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"
import { createInitialCategories } from "@/lib/dbSetup";

// Remover la llamada automática para evitar creaciones duplicadas
// createInitialCategories().catch(error => {
//   console.error("Error al inicializar categorías al cargar el módulo:", error);
// });

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(options)

    // Obtener parámetros de fecha de la URL
    const url = new URL(request.url)
    const desde = url.searchParams.get('desde')
    const hasta = url.searchParams.get('hasta')
    const soloFamiliares = url.searchParams.get('soloFamiliares') === 'true'
    const soloPersonales = url.searchParams.get('soloPersonales') === 'true'
    const usarFechaImputacion = url.searchParams.get('usarFechaImputacion') === 'true'  // Nuevo parámetro
    
    // Convertir fechas si fueron proporcionadas
    const fechaDesde = desde ? new Date(desde) : null
    const fechaHasta = hasta ? new Date(hasta) : null
    
    // Verificar que las fechas sean válidas si se proporcionaron
    if ((desde && isNaN(fechaDesde?.getTime() || 0)) || (hasta && isNaN(fechaHasta?.getTime() || 0))) {
      return NextResponse.json(
        { error: 'Formato de fecha inválido' },
        { status: 400 }
      )
    }
    
    // Buscar usuario por email
    const usuario = session?.user?.email 
      ? await prisma.user.findUnique({
          where: { email: session.user.email }
        })
      : null

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
        { tipoMovimiento: "tarjeta" },
        // Excluir transferencias internas (son movimientos neutros para el flujo de dinero)
        // Solo excluir si la categoría es "Transferencias" Y es transferencia interna
        {
          AND: [
            { categoria: "Transferencias" },
            {
              OR: [
                { concepto: { contains: "Transferencia interna:" } },
                { concepto: { contains: "Transferencia recibida de" } }
              ]
            }
          ]
        }
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
    
    // Obtener gastos del usuario
    const gastos = await prisma.gasto.findMany({
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
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    })
    
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
      fechaImputacion,  // Nuevo campo para imputación contable
      incluirEnFamilia = true  // Nuevo campo con valor por defecto
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

    const gasto = await prisma.gasto.create({
      data: {
        concepto,
        monto,
        categoria: nombreCategoria || categoria || 'Sin categoría',
        tipoTransaccion: tipoTransaccion || 'expense',
        tipoMovimiento: tipoMovimiento || 'efectivo',
        fecha: fecha || new Date(),
        fechaImputacion: fechaImputacionProcessed,  // Fecha para imputación contable
        updatedAt: new Date(),
        userId: usuario.id,  // Siempre asignar al usuario logueado
        incluirEnFamilia: Boolean(incluirEnFamilia),  // Nuevo campo
        ...(categoriaId && { categoriaId })
      }
    })

    return NextResponse.json(gasto)
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