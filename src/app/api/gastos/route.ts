import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET() {
  try {
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
    // Verificar si ya hay categorías
    const categoriasExistentes = await prisma.$queryRaw`SELECT COUNT(*) as count FROM Categoria`;
    const count = (categoriasExistentes as any)[0]?.count || 0;

    if (count === 0) {
      // No hay categorías, crear las predefinidas
      for (const cat of categoriasPredefinidas) {
        await prisma.$executeRaw`
          INSERT INTO Categoria (descripcion, grupo_categoria, status, createdAt, updatedAt) 
          VALUES (${cat.descripcion}, ${cat.grupo_categoria}, true, datetime('now'), datetime('now'))
        `;
      }
      console.log("Categorías iniciales creadas");
    }
  } catch (error) {
    console.error("Error al crear categorías iniciales:", error);
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
      const resultado = await prisma.$queryRaw`SELECT * FROM Categoria WHERE id = ${categoriaId}`;
      categoriaExiste = Array.isArray(resultado) && resultado.length > 0 ? resultado[0] : null;
      
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

// Inicializar categorías al iniciar el servidor
crearCategoriasIniciales().catch(console.error); 