import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"
import prisma from "@/lib/prisma"
import { TipoFeedback, PrioridadFeedback, EstadoFeedback } from "@prisma/client"

// ✅ GET - Listar feedback del usuario con filtros
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado') as EstadoFeedback | null
    const tipo = searchParams.get('tipo') as TipoFeedback | null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Construir filtros dinámicos
    const where: any = {
      userId: session.user.id
    }

    if (estado) where.estado = estado
    if (tipo) where.tipo = tipo

    // Ejecutar consultas en paralelo
    const [feedbacks, total] = await Promise.all([
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
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.feedbackBeta.count({ where })
    ])

    return NextResponse.json({
      feedbacks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error al obtener feedbacks:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
}

// ✅ POST - Crear nuevo feedback
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      titulo,
      descripcion,
      tipo,
      prioridad,
      versionApp,
      dispositivo,
      navegador,
      sistemaOS,
      enviarLogs,
      metadata
    } = body

    // Validaciones básicas
    if (!titulo || titulo.length < 5 || titulo.length > 80) {
      return NextResponse.json(
        { error: 'El título debe tener entre 5 y 80 caracteres' },
        { status: 400 }
      )
    }

    if (!descripcion || descripcion.length < 20) {
      return NextResponse.json(
        { error: 'La descripción debe tener al menos 20 caracteres' },
        { status: 400 }
      )
    }

    if (!Object.values(TipoFeedback).includes(tipo)) {
      return NextResponse.json(
        { error: 'Tipo de feedback no válido' },
        { status: 400 }
      )
    }

    if (!Object.values(PrioridadFeedback).includes(prioridad)) {
      return NextResponse.json(
        { error: 'Prioridad no válida' },
        { status: 400 }
      )
    }

    // Crear feedback en transacción
    const feedback = await prisma.$transaction(async (tx) => {
      // Crear el feedback
      const nuevoFeedback = await tx.feedbackBeta.create({
        data: {
          userId: session.user.id,
          titulo,
          descripcion,
          tipo,
          prioridad,
          versionApp: versionApp || "1.0.0-beta",
          dispositivo: dispositivo || "No especificado",
          navegador,
          sistemaOS,
          enviarLogs: enviarLogs ?? true,
          metadata,
          estado: EstadoFeedback.PENDIENTE
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      // Crear alerta para el administrador (jpautasso@gmail.com)
      const admin = await tx.user.findUnique({
        where: { email: "jpautasso@gmail.com" }
      })

      if (admin) {
        await tx.alerta.create({
          data: {
            userId: admin.id,
            tipo: "TAREA_VENCIMIENTO", // Usar tipo existente
            prioridad: prioridad === PrioridadFeedback.CRITICA ? "CRITICA" : 
                      prioridad === PrioridadFeedback.ALTA ? "ALTA" : "MEDIA",
            titulo: `🔔 Nuevo Feedback Beta: ${tipo}`,
            mensaje: `${nuevoFeedback.user.name || 'Usuario'} reportó: ${titulo}`,
            metadatos: {
              feedbackId: nuevoFeedback.id,
              tipo: tipo,
              prioridad: prioridad,
              userId: session.user.id,
              categoria: "feedback_beta"
            },
            canales: ["IN_APP"],
            fechaExpiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
          }
        })
      }

      return nuevoFeedback
    })

    return NextResponse.json(feedback, { status: 201 })

  } catch (error) {
    console.error('Error al crear feedback:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
} 