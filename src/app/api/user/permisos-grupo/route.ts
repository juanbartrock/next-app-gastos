import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { executeWithRetry } from "@/lib/db-utils"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"

// GET - Obtener permisos del usuario actual
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Buscar usuario con reintentos automáticos
    const usuario = await executeWithRetry(async () => {
      return await prisma.user.findUnique({
        where: { email: session.user.email! }
      })
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Obtener información de permisos en grupos familiares con reintentos
    const permisosFamiliares = await executeWithRetry(async () => {
      return await prisma.grupoMiembro.findMany({
        where: { userId: usuario.id },
        include: {
          grupo: {
            select: {
              id: true,
              nombre: true,
              descripcion: true,
              adminId: true
            }
          }
        }
      })
    })

    // Determinar permisos consolidados
    const permisos = {
      // Información básica del usuario
      usuarioId: usuario.id,
      esAdmin: usuario.isAdmin,
      
      // Permisos familiares
      puedeVerInformacionFamiliar: false,
      puedeEditarConfiguracionFamiliar: false,
      esAdministradorFamiliar: false,
      
      // Información de grupos
      gruposFamiliares: permisosFamiliares.map(miembro => ({
        grupoId: miembro.grupoId,
        nombreGrupo: miembro.grupo.nombre,
        rol: miembro.rol,
        // Simular valores basados en el rol actual hasta que se apliquen los cambios de schema
        rolFamiliar: miembro.rol === 'administrador' || miembro.grupo.adminId === usuario.id 
          ? 'ADMINISTRADOR_FAMILIAR' : 'MIEMBRO_LIMITADO',
        puedeVerFamiliar: miembro.rol === 'administrador' || miembro.grupo.adminId === usuario.id,
        puedeEditarGrupo: miembro.rol === 'administrador' || miembro.grupo.adminId === usuario.id,
        esAdminDelGrupo: miembro.grupo.adminId === usuario.id,
        fechaIncorporacion: miembro.createdAt
      })),
      
      // Resumen de capacidades
      nivel: 'PERSONAL' // Por defecto solo ve información personal
    }

    // Evaluar permisos consolidados
    if (permisosFamiliares.length > 0) {
      // Si es administrador de algún grupo O tiene permisos explícitos
      permisos.puedeVerInformacionFamiliar = permisosFamiliares.some(m => 
        m.grupo.adminId === usuario.id || 
        m.rol === 'administrador'
      )
      
      permisos.puedeEditarConfiguracionFamiliar = permisosFamiliares.some(m => 
        m.grupo.adminId === usuario.id || 
        m.rol === 'administrador'
      )
      
      permisos.esAdministradorFamiliar = permisosFamiliares.some(m => 
        m.grupo.adminId === usuario.id ||
        m.rol === 'administrador'
      )

      // Determinar nivel de acceso
      if (permisos.esAdministradorFamiliar) {
        permisos.nivel = 'ADMINISTRADOR_FAMILIAR'
      } else if (permisos.puedeVerInformacionFamiliar) {
        permisos.nivel = 'MIEMBRO_COMPLETO'
      } else {
        permisos.nivel = 'MIEMBRO_LIMITADO'
      }
    }

    return NextResponse.json(permisos)

  } catch (error) {
    console.error('Error al obtener permisos familiares:', error)
    
    // Proporcionar más información sobre el error
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    
    return NextResponse.json(
      { 
        error: 'Error al obtener permisos familiares',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

// PUT - Actualizar permisos de un miembro (solo administradores)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { 
      grupoId, 
      usuarioId, 
      rolFamiliar, 
      puedeVerFamiliar, 
      puedeEditarGrupo 
    } = await request.json()

    // Buscar usuario actual
    const usuarioActual = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!usuarioActual) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el usuario actual es administrador del grupo
    const grupo = await prisma.grupo.findUnique({
      where: { id: grupoId }
    })

    if (!grupo || (grupo.adminId !== usuarioActual.id && !usuarioActual.isAdmin)) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar este grupo' },
        { status: 403 }
      )
    }

    // Actualizar permisos del miembro - por ahora solo actualizar el rol string
    const nuevoRol = (rolFamiliar === 'ADMINISTRADOR_FAMILIAR' || puedeEditarGrupo) 
      ? 'administrador' : 'miembro'

    const miembroActualizado = await prisma.grupoMiembro.update({
      where: {
        grupoId_userId: {
          grupoId: grupoId,
          userId: usuarioId
        }
      },
      data: {
        rol: nuevoRol
        // Cuando se aplique el schema se podrán usar:
        // rolFamiliar: rolFamiliar,
        // puedeVerFamiliar: puedeVerFamiliar,
        // puedeEditarGrupo: puedeEditarGrupo
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
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Permisos actualizados exitosamente',
      miembro: miembroActualizado
    })

  } catch (error) {
    console.error('Error al actualizar permisos:', error)
    return NextResponse.json(
      { error: 'Error al actualizar permisos' },
      { status: 500 }
    )
  }
} 