import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'
import { z } from 'zod'

// Schema de validación para categorías de grupo
const categoriaGrupoSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida'),
  colorHex: z.string().optional(),
  icono: z.string().optional(),
  grupo_categoria: z.string().optional(),
  activa: z.boolean().default(true)
})

// GET - Obtener categorías híbridas para un grupo
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: grupoId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el usuario pertenece al grupo
    const miembro = await prisma.grupoMiembro.findFirst({
      where: {
        grupoId,
        userId: session.user.id
      }
    })

    if (!miembro) {
      return NextResponse.json({ error: 'No perteneces a este grupo' }, { status: 403 })
    }

    // Obtener categorías híbridas (genéricas + específicas del grupo)
    const [categoriasGenericas, categoriasGrupo] = await Promise.all([
      // Categorías genéricas del sistema (disponibles para todos)
      prisma.categoria.findMany({
        where: {
          esGenerica: true,
          activa: true
        },
        orderBy: { ordenDisplay: 'asc' }
      }),
      
      // Categorías específicas del grupo
      prisma.categoria.findMany({
        where: {
          grupoId,
          esGenerica: false,
          activa: true
        },
        include: {
          adminCreador: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ])

    return NextResponse.json({
      categoriasGenericas,
      categoriasGrupo,
      estadisticas: {
        genericasDisponibles: categoriasGenericas.length,
        grupoCreadas: categoriasGrupo.length
      }
    })
    
  } catch (error) {
    console.error('Error al obtener categorías del grupo:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST - Crear nueva categoría específica para el grupo
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: grupoId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permisos
    const [miembro, usuario] = await Promise.all([
      prisma.grupoMiembro.findFirst({
        where: {
          grupoId,
          userId: session.user.id
        }
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        include: { plan: true }
      })
    ])

    if (!miembro) {
      return NextResponse.json({ error: 'No perteneces a este grupo' }, { status: 403 })
    }

    // Verificar si tiene permisos para crear categorías
    const esAdminGrupo = miembro.rol === 'admin' || miembro.puedeEditarGrupo
    const esAdminGeneral = usuario?.isAdmin

    if (!esAdminGrupo && !esAdminGeneral) {
      return NextResponse.json({ 
        error: 'No tienes permisos para crear categorías en este grupo' 
      }, { status: 403 })
    }

    // Verificar limitaciones del plan
    if (usuario?.plan?.limitaciones) {
      const limitaciones = usuario.plan.limitaciones as any
      const maxCategorias = limitaciones.categorias_personalizadas || 0

      if (maxCategorias !== -1) { // -1 significa ilimitado
        const categoriasExistentes = await prisma.categoria.count({
          where: {
            grupoId,
            esGenerica: false,
            activa: true
          }
        })

        if (categoriasExistentes >= maxCategorias) {
          return NextResponse.json({ 
            error: `Has alcanzado el límite de ${maxCategorias} categorías personalizadas para tu plan`,
            limitePlan: true,
            planActual: usuario.plan.nombre
          }, { status: 402 }) // Payment Required
        }
      }
    }

    const body = await request.json()
    const validatedData = categoriaGrupoSchema.parse(body)

    // Verificar que no existe una categoría con el mismo nombre en el grupo
    const categoriaExistente = await prisma.categoria.findFirst({
      where: {
        descripcion: validatedData.descripcion,
        grupoId,
        activa: true
      }
    })

    if (categoriaExistente) {
      return NextResponse.json({ 
        error: 'Ya existe una categoría con ese nombre en el grupo' 
      }, { status: 400 })
    }

    // Crear la nueva categoría específica del grupo
    const nuevaCategoria = await prisma.categoria.create({
      data: {
        ...validatedData,
        grupoId,
        esGenerica: false,
        tipo: 'grupo',
        status: true,
        adminCreadorId: session.user.id,
        limitePlan: usuario?.plan?.nombre || null
      },
      include: {
        adminCreador: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json(nuevaCategoria, { status: 201 })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Datos inválidos', 
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Error al crear categoría del grupo:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PUT - Actualizar categoría específica del grupo
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: grupoId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { categoriaId, ...updateData } = body
    
    if (!categoriaId) {
      return NextResponse.json({ error: 'ID de categoría requerido' }, { status: 400 })
    }

    const validatedData = categoriaGrupoSchema.partial().parse(updateData)

    // Verificar permisos sobre la categoría
    const categoria = await prisma.categoria.findFirst({
      where: {
        id: categoriaId,
        grupoId,
        esGenerica: false // Solo categorías de grupo son editables
      },
      include: {
        adminCreador: true
      }
    })

    if (!categoria) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
    }

    // Verificar permisos: debe ser el creador, admin del grupo o admin general
    const [miembro, usuario] = await Promise.all([
      prisma.grupoMiembro.findFirst({
        where: {
          grupoId,
          userId: session.user.id
        }
      }),
      prisma.user.findUnique({
        where: { id: session.user.id }
      })
    ])

    const esCreador = categoria.adminCreadorId === session.user.id
    const esAdminGrupo = miembro?.rol === 'admin' || miembro?.puedeEditarGrupo
    const esAdminGeneral = usuario?.isAdmin

    if (!esCreador && !esAdminGrupo && !esAdminGeneral) {
      return NextResponse.json({ 
        error: 'No tienes permisos para editar esta categoría' 
      }, { status: 403 })
    }

    // Actualizar la categoría
    const categoriaActualizada = await prisma.categoria.update({
      where: { id: categoriaId },
      data: validatedData,
      include: {
        adminCreador: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json(categoriaActualizada)
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Datos inválidos', 
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Error al actualizar categoría del grupo:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE - Eliminar categoría específica del grupo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: grupoId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const url = new URL(request.url)
    const categoriaId = parseInt(url.searchParams.get('categoriaId') || '0')
    
    if (!categoriaId) {
      return NextResponse.json({ error: 'ID de categoría requerido' }, { status: 400 })
    }

    // Verificar que la categoría existe y pertenece al grupo
    const categoria = await prisma.categoria.findFirst({
      where: {
        id: categoriaId,
        grupoId,
        esGenerica: false
      },
      include: {
        _count: {
          select: {
            gastos: true,
            gastosRecurrentes: true,
            presupuestos: true
          }
        }
      }
    })

    if (!categoria) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
    }

    // Verificar permisos
    const [miembro, usuario] = await Promise.all([
      prisma.grupoMiembro.findFirst({
        where: {
          grupoId,
          userId: session.user.id
        }
      }),
      prisma.user.findUnique({
        where: { id: session.user.id }
      })
    ])

    const esCreador = categoria.adminCreadorId === session.user.id
    const esAdminGrupo = miembro?.rol === 'admin' || miembro?.puedeEditarGrupo
    const esAdminGeneral = usuario?.isAdmin

    if (!esCreador && !esAdminGrupo && !esAdminGeneral) {
      return NextResponse.json({ 
        error: 'No tienes permisos para eliminar esta categoría' 
      }, { status: 403 })
    }

    // Verificar si la categoría está en uso
    const usoTotal = categoria._count.gastos + categoria._count.gastosRecurrentes + categoria._count.presupuestos

    if (usoTotal > 0) {
      // No eliminar, solo desactivar
      const categoriaDesactivada = await prisma.categoria.update({
        where: { id: categoriaId },
        data: { activa: false }
      })

      return NextResponse.json({ 
        message: 'Categoría desactivada porque está en uso',
        categoria: categoriaDesactivada,
        enUso: {
          gastos: categoria._count.gastos,
          gastosRecurrentes: categoria._count.gastosRecurrentes,
          presupuestos: categoria._count.presupuestos
        }
      })
    } else {
      // Eliminar completamente
      await prisma.categoria.delete({
        where: { id: categoriaId }
      })

      return NextResponse.json({ 
        message: 'Categoría eliminada exitosamente' 
      })
    }
    
  } catch (error) {
    console.error('Error al eliminar categoría del grupo:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 