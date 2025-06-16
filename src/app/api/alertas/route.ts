import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"
import prisma, { executeWithTimeout } from "@/lib/prisma"
import { z } from "zod"

// Esquema de validación para crear alertas - Solo tipos implementados
const crearAlertaSchema = z.object({
  tipo: z.enum([
    "PAGO_RECURRENTE",
    "PRESUPUESTO_80", 
    "PRESUPUESTO_90",
    "PRESUPUESTO_SUPERADO",
    "INVERSION_VENCIMIENTO",
    "PRESTAMO_CUOTA",
    "GASTO_INUSUAL",
    "TAREA_VENCIMIENTO"
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
    const limiteParsed = limite ? Math.min(parseInt(limite), 100) : 50 // Limitar máximo
    const paginaParsed = pagina ? parseInt(pagina) : 1
    const skip = (paginaParsed - 1) * limiteParsed

    // Obtener alertas con relaciones usando timeout
    const alertas = await executeWithTimeout(async () => {
      return await prisma.alerta.findMany({
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
    }, 15000, 3)

    // Contar total para paginación con timeout
    const [total, noLeidas, totalGeneral] = await Promise.all([
      executeWithTimeout(async () => {
        return await prisma.alerta.count({ where })
      }, 10000, 2),
      executeWithTimeout(async () => {
        return await prisma.alerta.count({
          where: { userId: session.user.id, leida: false }
        })
      }, 10000, 2),
      executeWithTimeout(async () => {
        return await prisma.alerta.count({
          where: { userId: session.user.id }
        })
      }, 10000, 2)
    ])

    return NextResponse.json({
      alertas,
      pagination: {
        total,
        pagina: paginaParsed,
        limite: limiteParsed,
        totalPaginas: Math.ceil(total / limiteParsed)
      },
      stats: {
        noLeidas,
        total: totalGeneral
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

    // Crear la alerta con timeout
    const nuevaAlerta = await executeWithTimeout(async () => {
      // Preparar datos eliminando propiedades undefined
      const datosAlerta: any = {
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
        accionesDisponibles: datosValidados.accionesDisponibles || {}
      }

      // Agregar relaciones opcionales solo si están definidas
      if (datosValidados.gastoRecurrenteId !== undefined) {
        datosAlerta.gastoRecurrenteId = datosValidados.gastoRecurrenteId
      }
      if (datosValidados.prestamoId !== undefined) {
        datosAlerta.prestamoId = datosValidados.prestamoId
      }
      if (datosValidados.inversionId !== undefined) {
        datosAlerta.inversionId = datosValidados.inversionId
      }
      if (datosValidados.presupuestoId !== undefined) {
        datosAlerta.presupuestoId = datosValidados.presupuestoId
      }
      if (datosValidados.tareaId !== undefined) {
        datosAlerta.tareaId = datosValidados.tareaId
      }
      if (datosValidados.promocionId !== undefined) {
        datosAlerta.promocionId = datosValidados.promocionId
      }

      return await prisma.alerta.create({
        data: datosAlerta,
        include: {
          gastoRecurrente: true,
          prestamo: true,
          inversion: true,
          presupuesto: true,
          tarea: true,
          promocion: true
        }
      })
    }, 15000, 3)

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