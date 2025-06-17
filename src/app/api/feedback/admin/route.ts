import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"
import prisma from "@/lib/prisma"
import { TipoFeedback, PrioridadFeedback, EstadoFeedback } from "@prisma/client"

// ✅ GET - Listar TODOS los feedbacks (solo admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    
    // Verificar que sea el administrador principal
    if (!session?.user?.id || session.user.email !== "jpautasso@gmail.com") {
      return NextResponse.json({ error: 'Acceso denegado - Solo administradores' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado') as EstadoFeedback | null
    const tipo = searchParams.get('tipo') as TipoFeedback | null
    const prioridad = searchParams.get('prioridad') as PrioridadFeedback | null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '15')
    const offset = (page - 1) * limit

    // Construir filtros dinámicos
    const where: any = {}

    if (estado) where.estado = estado
    if (tipo) where.tipo = tipo
    if (prioridad) where.prioridad = prioridad

    // Ejecutar consultas en paralelo
    const [feedbacks, total, estadisticas] = await Promise.all([
      prisma.feedbackBeta.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          admin: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: [
          { estado: 'asc' }, // Pendientes primero
          { prioridad: 'desc' }, // Críticos primero
          { createdAt: 'desc' }
        ],
        skip: offset,
        take: limit
      }),
      prisma.feedbackBeta.count({ where }),
      // Estadísticas generales
      prisma.feedbackBeta.groupBy({
        by: ['estado'],
        _count: true
      })
    ])

    // Procesar estadísticas
    const stats = {
      total,
      pendientes: estadisticas.find(s => s.estado === EstadoFeedback.PENDIENTE)?._count || 0,
      enRevision: estadisticas.find(s => s.estado === EstadoFeedback.EN_REVISION)?._count || 0,
      planificados: estadisticas.find(s => s.estado === EstadoFeedback.PLANIFICADO)?._count || 0,
      implementados: estadisticas.find(s => s.estado === EstadoFeedback.IMPLEMENTADO)?._count || 0,
      solucionados: estadisticas.find(s => s.estado === EstadoFeedback.SOLUCIONADO)?._count || 0,
      rechazados: estadisticas.find(s => s.estado === EstadoFeedback.RECHAZADO)?._count || 0
    }

    return NextResponse.json({
      feedbacks,
      estadisticas: stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error al obtener feedbacks admin:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
}

// ✅ PUT - Actualizar masivamente feedbacks (solo admin)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    
    // Verificar que sea el administrador principal
    if (!session?.user?.id || session.user.email !== "jpautasso@gmail.com") {
      return NextResponse.json({ error: 'Acceso denegado - Solo administradores' }, { status: 403 })
    }

    const body = await request.json()
    const { feedbackIds, estado, respuesta } = body

    if (!feedbackIds || !Array.isArray(feedbackIds) || feedbackIds.length === 0) {
      return NextResponse.json({ error: 'IDs de feedback requeridos' }, { status: 400 })
    }

    if (estado && !Object.values(EstadoFeedback).includes(estado)) {
      return NextResponse.json({ error: 'Estado no válido' }, { status: 400 })
    }

    // Actualizar en transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Preparar datos de actualización
      const updateData: any = {}
      if (estado) updateData.estado = estado
      if (respuesta) {
        updateData.respuesta = respuesta
        updateData.fechaRespuesta = new Date()
        updateData.adminId = session.user.id
      }

      // Actualizar feedbacks
      const feedbacksActualizados = await tx.feedbackBeta.updateMany({
        where: {
          id: { in: feedbackIds }
        },
        data: updateData
      })

      // Si hay respuesta, crear alertas para los usuarios
      if (respuesta) {
        const feedbacks = await tx.feedbackBeta.findMany({
          where: { id: { in: feedbackIds } },
          select: { id: true, userId: true, titulo: true, tipo: true }
        })

        for (const feedback of feedbacks) {
          await tx.alerta.create({
            data: {
              userId: feedback.userId,
              tipo: "TAREA_VENCIMIENTO", // Usar tipo existente
              prioridad: "MEDIA",
              titulo: `💬 Respuesta a tu Feedback Beta`,
              mensaje: `Hay una nueva respuesta a tu reporte: "${feedback.titulo}"`,
              metadatos: {
                feedbackId: feedback.id,
                tipoOriginal: feedback.tipo,
                categoria: "feedback_respuesta"
              },
              canales: ["IN_APP"],
              fechaExpiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
            }
          })
        }
      }

      return { actualizados: feedbacksActualizados.count }
    })

    return NextResponse.json({
      message: `${resultado.actualizados} feedback(s) actualizado(s) correctamente`,
      actualizados: resultado.actualizados
    })

  } catch (error) {
    console.error('Error al actualizar feedbacks:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
} 