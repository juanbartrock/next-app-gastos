import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"
import { createInitialCategories } from "@/lib/dbSetup";

// Remover la llamada automática para evitar creaciones duplicadas
// createInitialCategories().catch(error => {
//   console.error("Error al inicializar categorías al cargar el módulo:", error);
// });

export async function GET() {
  try {
    // Verificar y crear categorías si es necesario, solo cuando se solicitan los gastos
    await crearCategoriasIniciales();
    
    const session = await getServerSession(options)
    
    // Si hay un usuario autenticado, filtrar por sus gastos
    if (session?.user?.email) {
      const usuario = await prisma.user.findUnique({
        where: { email: session.user.email }
      })
      
      // Si encontramos al usuario, obtenemos sus gastos personales y los de sus grupos
      if (usuario) {
        // Obtener IDs de grupos a los que pertenece el usuario
        const gruposMiembro = await prisma.grupoMiembro.findMany({
          where: { userId: usuario.id },
          select: { grupoId: true }
        })
        
        const gruposIds = gruposMiembro.map(g => g.grupoId)
        
        // Obtener gastos personales y de los grupos a los que pertenece
        const gastos = await prisma.gasto.findMany({
          where: {
            OR: [
              { userId: usuario.id },
              { grupoId: { in: gruposIds.length > 0 ? gruposIds : undefined } }
            ],
            // Excluir los gastos de tipo tarjeta para que no impacten en el flujo de dinero
            AND: [
              { 
                NOT: { 
                  tipoMovimiento: "tarjeta" 
                } 
              }
            ]
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            grupo: {
              select: {
                id: true,
                nombre: true
              }
            }
          },
          orderBy: {
            fecha: 'desc'
          }
        })
        
        return NextResponse.json(gastos)
      }
    }
    
    // Si no hay usuario autenticado o no se encontró, devolver todos los gastos
    const gastos = await prisma.gasto.findMany({
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
    let userId: string | undefined = undefined
    
    // Si hay un usuario autenticado, obtener su ID
    if (session?.user?.email) {
      const usuario = await prisma.user.findUnique({
        where: { email: session.user.email }
      })
      
      if (usuario) {
        userId = usuario.id
      }
    }
    
    const { concepto, monto, categoria, categoriaId, tipoTransaccion, tipoMovimiento, fecha, grupoId } = await request.json()
    
    // Si se está asociando a un grupo, verificar que el usuario pertenezca a ese grupo
    if (grupoId && userId) {
      const esMiembro = await prisma.grupoMiembro.findUnique({
        where: {
          grupoId_userId: {
            grupoId,
            userId
          }
        }
      })
      
      if (!esMiembro) {
        return NextResponse.json(
          { error: 'No perteneces a este grupo' },
          { status: 403 }
        )
      }
    }

    // Verificar que la categoría existe si se proporciona un ID
    let categoriaExiste = null
    let nombreCategoria = categoria;
    
    if (categoriaId) {
      // Usar Prisma client 
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

    const gasto = await prisma.gasto.create({
      data: {
        concepto,
        monto,
        categoria: nombreCategoria || categoria || 'Sin categoría',
        tipoTransaccion: tipoTransaccion || 'expense',
        tipoMovimiento: tipoMovimiento || 'efectivo',
        fecha: fecha || new Date(),
        updatedAt: new Date(),
        ...(userId && { userId }),
        ...(grupoId && { grupoId }),
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