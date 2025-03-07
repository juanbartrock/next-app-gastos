import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'

// GET - Obtener grupos del usuario autenticado
export async function GET(request: Request) {
  try {
    // Verificar si hay información de depuración en los headers (agregada por middleware)
    const headers = request.headers;
    const userId = headers.get('x-user-id');
    const userEmail = headers.get('x-user-email');
    
    console.log("Info de sesión en headers:", { userId, userEmail });
    
    const session = await getServerSession(options)
    
    console.log("Sesión de usuario:", session);
    
    if (!session?.user?.email) {
      console.log("Error: No hay usuario autenticado");
      
      // Si tenemos email en el header (del token) pero no en la sesión, hay un problema
      if (userEmail) {
        console.log("Inconsistencia detectada: token válido pero sesión inválida");
      }
      
      return NextResponse.json(
        { error: "No autenticado. Por favor, cierre sesión e inicie sesión nuevamente." },
        { status: 401 }
      )
    }

    console.log("Email del usuario autenticado:", session.user.email);

    // Obtener el usuario de la base de datos usando el email
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!usuario) {
      console.log("Error: Usuario no encontrado en la base de datos para el email:", session.user.email);
      console.log("Creando usuario automáticamente...");
      
      try {
        // Crear usuario automáticamente
        const nuevoUsuario = await prisma.user.create({
          data: {
            name: session.user.name || session.user.email.split('@')[0],
            email: session.user.email,
            // Nota: no podemos establecer una contraseña aquí ya que no la conocemos
          }
        });
        
        console.log("Usuario creado automáticamente:", nuevoUsuario.id);
        
        // Crear grupo por defecto para el nuevo usuario
        const grupoDefault = await prisma.grupo.create({
          data: {
            nombre: "Mi primer grupo",
            descripcion: "Grupo creado automáticamente",
            adminId: nuevoUsuario.id,
            miembros: {
              create: {
                userId: nuevoUsuario.id,
                rol: "ADMIN"
              }
            }
          },
          include: {
            admin: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            miembros: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        });
        
        console.log("Grupo por defecto creado:", grupoDefault.id);
        
        // Retornar el grupo creado
        return NextResponse.json([{
          id: grupoDefault.id,
          nombre: grupoDefault.nombre,
          descripcion: grupoDefault.descripcion,
          adminId: nuevoUsuario.id,
          admin: {
            id: nuevoUsuario.id,
            name: nuevoUsuario.name,
            email: nuevoUsuario.email
          },
          rol: "ADMIN",
          miembros: grupoDefault.miembros,
          createdAt: grupoDefault.createdAt,
          updatedAt: grupoDefault.updatedAt
        }]);
      } catch (error) {
        console.error("Error al crear usuario automáticamente:", error);
        return NextResponse.json(
          { 
            error: "Sesión inconsistente. El usuario en su sesión ya no existe en la base de datos y no se pudo recrear automáticamente. Por favor, cierre sesión e inicie sesión nuevamente."
          },
          { status: 400 }
        );
      }
    }

    console.log("Usuario encontrado:", usuario.id);

    // Buscar grupos donde el usuario es miembro
    const gruposMiembro = await prisma.grupoMiembro.findMany({
      where: {
        userId: usuario.id,
      },
      include: {
        grupo: {
          include: {
            admin: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            miembros: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
              take: 10, // Limitamos para no sobrecargar
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`Se encontraron ${gruposMiembro.length} grupos para el usuario`);

    // Si el usuario no tiene grupos, crear uno por defecto
    if (gruposMiembro.length === 0) {
      console.log("El usuario no tiene grupos, creando uno por defecto...");
      
      try {
        // Crear un grupo por defecto para el usuario
        const grupoDefault = await prisma.grupo.create({
          data: {
            nombre: "Mi primer grupo",
            descripcion: "Grupo creado automáticamente",
            adminId: usuario.id,
            miembros: {
              create: {
                userId: usuario.id,
                rol: "ADMIN"
              }
            }
          }
        });
        
        console.log("Grupo por defecto creado:", grupoDefault.id);
        
        // Devolver un array con el grupo recién creado
        return NextResponse.json([{
          id: grupoDefault.id,
          nombre: grupoDefault.nombre,
          descripcion: grupoDefault.descripcion,
          adminId: usuario.id,
          admin: {
            id: usuario.id,
            name: usuario.name,
            email: usuario.email
          },
          rol: "ADMIN",
          miembros: [{
            grupoId: grupoDefault.id,
            userId: usuario.id,
            rol: "ADMIN",
            user: {
              id: usuario.id,
              name: usuario.name,
              email: usuario.email
            }
          }],
          createdAt: grupoDefault.createdAt,
          updatedAt: grupoDefault.updatedAt
        }]);
      } catch (errorCreacion) {
        console.error("Error al crear grupo por defecto:", errorCreacion);
        // En caso de error, devolver un array vacío en lugar de un error
        return NextResponse.json([]);
      }
    }

    // Formatear la respuesta para incluir el rol del usuario en cada grupo
    const grupos = gruposMiembro.map((membership) => ({
      id: membership.grupo.id,
      nombre: membership.grupo.nombre,
      descripcion: membership.grupo.descripcion,
      adminId: membership.grupo.adminId,
      admin: membership.grupo.admin,
      rol: membership.rol,
      miembros: membership.grupo.miembros,
      createdAt: membership.grupo.createdAt,
      updatedAt: membership.grupo.updatedAt,
    }))

    return NextResponse.json(grupos)
  } catch (error) {
    console.error('Error al obtener grupos:', error)
    return NextResponse.json(
      { error: 'Error al obtener los grupos' },
      { status: 500 }
    )
  }
}

// POST - Crear un nuevo grupo
export async function POST(request: Request) {
  try {
    const session = await getServerSession(options)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }

    // Obtener el usuario de la base de datos usando el email
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    const { nombre, descripcion } = await request.json()

    // Validación básica
    if (!nombre || nombre.trim() === '') {
      return NextResponse.json(
        { error: "El nombre del grupo es obligatorio" },
        { status: 400 }
      )
    }

    // Crear grupo con el usuario actual como administrador
    const nuevoGrupo = await prisma.grupo.create({
      data: {
        nombre,
        descripcion: descripcion || null,
        adminId: usuario.id,
        updatedAt: new Date(),
        // Crear el usuario como miembro del grupo automáticamente
        miembros: {
          create: {
            userId: usuario.id,
            rol: "ADMIN", // El creador es admin por defecto
          },
        },
      },
      include: {
        admin: true,
        miembros: {
          include: {
            user: true,
          },
        },
      },
    })

    return NextResponse.json(nuevoGrupo)
  } catch (error) {
    console.error('Error al crear grupo:', error)
    return NextResponse.json(
      { error: 'Error al crear el grupo' },
      { status: 500 }
    )
  }
} 