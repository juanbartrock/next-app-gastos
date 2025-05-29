import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"
import prisma from "@/lib/prisma"
import { z } from "zod"

// Esquema de validación para crear alertas
const crearAlertaSchema = z.object({
  tipo: z.enum([
    "PAGO_RECURRENTE",
    "PRESUPUESTO_80", 
    "PRESUPUESTO_90",
    "PRESUPUESTO_SUPERADO",
    "META_PROGRESO",
    "INVERSION_VENCIMIENTO",
    "PRESTAMO_CUOTA",
    "GASTO_INUSUAL",
    "OPORTUNIDAD_AHORRO",
    "SALDO_BAJO",
    "RECOMENDACION_IA",
    "TAREA_VENCIMIENTO",
    "PROMOCION_DISPONIBLE"
  ]),
  prioridad: z.enum(["BAJA", "MEDIA", "ALTA", "CRITICA"]),
  titulo: z.string().min(1, "El título es requerido"),
  mensaje: z.string().min(1, "El mensaje es requerido"),
  metadatos: z.record(z.any()).optional(),
  fechaExpiracion: z.string().optional(),
  canales: z.array(z.enum(["IN_APP", "EMAIL", "SMS", "WHATSAPP", "PUSH"])).optional(),
  accionesDisponibles: z.record(z.any()).optional(),
  // IDs opcionales para relaciones
  gastoRecurrenteId: z.number().optional(),
  prestamoId: z.string().optional(),
  inversionId: z.string().optional(), 
  presupuestoId: z.string().optional(),
  tareaId: z.string().optional(),
  promocionId: z.number().optional()
})

// GET /api/alertas - Listar alertas del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const url = new URL(request.url)
    const leidas = url.searchParams.get("leidas")
    const tipo = url.searchParams.get("tipo")
    const limite = url.searchParams.get("limite")
    const pagina = url.searchParams.get("pagina")

    // Construir filtros
    const where: any = {
      userId: session.user.id
    }

    if (leidas !== null) {
      where.leida = leidas === "true"
    }

    if (tipo) {
      where.tipo = tipo
    }

    // Paginación
    const limiteParsed = limite ? parseInt(limite) : 50
    const paginaParsed = pagina ? parseInt(pagina) : 1
    const skip = (paginaParsed - 1) * limiteParsed

    // Obtener alertas con relaciones
    const alertas = await prisma.alerta.findMany({
      where,
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
      },
      orderBy: {
        fechaCreacion: "desc"
      },
      take: limiteParsed,
      skip
    })

    // Contar total para paginación
    const total = await prisma.alerta.count({ where })

    return NextResponse.json({
      alertas,
      pagination: {
        total,
        pagina: paginaParsed,
        limite: limiteParsed,
        totalPaginas: Math.ceil(total / limiteParsed)
      },
      stats: {
        noLeidas: await prisma.alerta.count({
          where: { userId: session.user.id, leida: false }
        }),
        total: await prisma.alerta.count({
          where: { userId: session.user.id }
        })
      }
    })

  } catch (error) {
    console.error("Error al obtener alertas:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// POST /api/alertas - Crear nueva alerta
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const datosValidados = crearAlertaSchema.parse(body)

    // Crear la alerta
    const nuevaAlerta = await prisma.alerta.create({
      data: {
        userId: session.user.id,
        tipo: datosValidados.tipo,
        prioridad: datosValidados.prioridad,
        titulo: datosValidados.titulo,
        mensaje: datosValidados.mensaje,
        metadatos: datosValidados.metadatos || {},
        fechaExpiracion: datosValidados.fechaExpiracion 
          ? new Date(datosValidados.fechaExpiracion) 
          : null,
        canales: datosValidados.canales || ["IN_APP"],
        accionesDisponibles: datosValidados.accionesDisponibles || {},
        // Relaciones opcionales
        gastoRecurrenteId: datosValidados.gastoRecurrenteId,
        prestamoId: datosValidados.prestamoId,
        inversionId: datosValidados.inversionId,
        presupuestoId: datosValidados.presupuestoId,
        tareaId: datosValidados.tareaId,
        promocionId: datosValidados.promocionId
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

    return NextResponse.json(nuevaAlerta, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: error.errors },
        { status: 400 }
      )
    }

    console.error("Error al crear alerta:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
} 