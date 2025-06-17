import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"
import prisma from "@/lib/prisma"
import { EstadoFeedback } from "@prisma/client"

// ✅ GET - Obtener feedback específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const session = await getServerSession(options)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const feedback = await prisma.feedbackBeta.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        admin: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback no encontrado' }, { status: 404 })
    }

    // Verificar permisos: solo el usuario que creó el feedback o un admin
    const isOwner = feedback.userId === session.user.id
    const isAdmin = session.user.email === "jpautasso@gmail.com"
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Sin permisos para ver este feedback' }, { status: 403 })
    }

    return NextResponse.json(feedback)

  } catch (error) {
    console.error('Error al obtener feedback:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
}

// ✅ PUT - Actualizar feedback (solo para admin o cambio de estado del usuario)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const session = await getServerSession(options)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { estado, respuesta, adminId } = body

    const feedback = await prisma.feedbackBeta.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback no encontrado' }, { status: 404 })
    }

    // Verificar permisos
    const isOwner = feedback.userId === session.user.id
    const isAdmin = session.user.email === "jpautasso@gmail.com"
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Sin permisos para actualizar este feedback' }, { status: 403 })
    }

    // Validaciones para actualización de estado
    if (estado && !Object.values(EstadoFeedback).includes(estado)) {
      return NextResponse.json({ error: 'Estado no válido' }, { status: 400 })
    }

    // Preparar datos de actualización
    const updateData: any = {}
    
    if (estado) updateData.estado = estado
    if (respuesta && isAdmin) {
      updateData.respuesta = respuesta
      updateData.fechaRespuesta = new Date()
      updateData.adminId = session.user.id
    }
    if (adminId && isAdmin) updateData.adminId = adminId

    // Actualizar en transacción
    const feedbackActualizado = await prisma.$transaction(async (tx) => {
      const updated = await tx.feedbackBeta.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          admin: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      // Si es una respuesta del admin, crear alerta para el usuario
      if (respuesta && isAdmin && feedback.userId !== session.user.id) {
        await tx.alerta.create({
          data: {
            userId: feedback.userId,
            tipo: "TAREA_VENCIMIENTO", // Usar tipo existente
            prioridad: "MEDIA",
            titulo: `💬 Respuesta a tu Feedback Beta`,
            mensaje: `Hay una nueva respuesta a tu reporte: "${feedback.titulo}"`,
            metadatos: {
              feedbackId: id,
              tipoOriginal: feedback.tipo,
              categoria: "feedback_respuesta"
            },
            canales: ["IN_APP"],
            fechaExpiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
          }
        })
      }

      return updated
    })

    return NextResponse.json(feedbackActualizado)

  } catch (error) {
    console.error('Error al actualizar feedback:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
}

// ✅ DELETE - Eliminar feedback (solo para admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const session = await getServerSession(options)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo el admin puede eliminar feedback
    const isAdmin = session.user.email === "jpautasso@gmail.com"
    if (!isAdmin) {
      return NextResponse.json({ error: 'Solo administradores pueden eliminar feedback' }, { status: 403 })
    }

    const feedback = await prisma.feedbackBeta.findUnique({
      where: { id }
    })

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback no encontrado' }, { status: 404 })
    }

    await prisma.feedbackBeta.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Feedback eliminado correctamente' })

  } catch (error) {
    console.error('Error al eliminar feedback:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
} 