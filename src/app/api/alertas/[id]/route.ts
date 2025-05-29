import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"
import prisma from "@/lib/prisma"
import { z } from "zod"

// Esquema de validación para actualizar alertas
const actualizarAlertaSchema = z.object({
  leida: z.boolean().optional(),
  accionado: z.boolean().optional(),
  fechaExpiracion: z.string().optional(),
  metadatos: z.record(z.any()).optional(),
  accionesDisponibles: z.record(z.any()).optional()
})

// GET /api/alertas/[id] - Obtener alerta específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const alerta = await prisma.alerta.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      },
      include: {
        gastoRecurrente: {
          include: {
            categoria: true
          }
        },
        prestamo: true,
        inversion: {
          include: {
            tipo: true
          }
        },
        presupuesto: {
          include: {
            categoria: true
          }
        },
        tarea: true,
        promocion: {
          include: {
            servicio: true
          }
        }
      }
    })

    if (!alerta) {
      return NextResponse.json({ error: "Alerta no encontrada" }, { status: 404 })
    }

    return NextResponse.json(alerta)

  } catch (error) {
    console.error("Error al obtener alerta:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// PUT /api/alertas/[id] - Actualizar alerta
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const datosValidados = actualizarAlertaSchema.parse(body)

    // Verificar que la alerta pertenece al usuario
    const alertaExistente = await prisma.alerta.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!alertaExistente) {
      return NextResponse.json({ error: "Alerta no encontrada" }, { status: 404 })
    }

    // Actualizar la alerta
    const alertaActualizada = await prisma.alerta.update({
      where: { id: params.id },
      data: {
        leida: datosValidados.leida,
        accionado: datosValidados.accionado,
        fechaExpiracion: datosValidados.fechaExpiracion 
          ? new Date(datosValidados.fechaExpiracion) 
          : undefined,
        metadatos: datosValidados.metadatos,
        accionesDisponibles: datosValidados.accionesDisponibles
      },
      include: {
        gastoRecurrente: true,
        prestamo: true,
        inversion: true,
        presupuesto: true,
        tarea: true,
        promocion: true
      }
    })

    return NextResponse.json(alertaActualizada)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: error.errors },
        { status: 400 }
      )
    }

    console.error("Error al actualizar alerta:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// DELETE /api/alertas/[id] - Eliminar alerta
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar que la alerta pertenece al usuario
    const alertaExistente = await prisma.alerta.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!alertaExistente) {
      return NextResponse.json({ error: "Alerta no encontrada" }, { status: 404 })
    }

    // Eliminar la alerta
    await prisma.alerta.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Alerta eliminada correctamente" })

  } catch (error) {
    console.error("Error al eliminar alerta:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
} 