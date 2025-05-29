import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"
import prisma from "@/lib/prisma"
import { z } from "zod"

// Esquema de validación para configuraciones de alertas
const configuracionAlertaSchema = z.object({
  tipoAlerta: z.enum([
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
  habilitado: z.boolean(),
  canales: z.array(z.enum(["IN_APP", "EMAIL", "SMS", "WHATSAPP", "PUSH"])),
  frecuencia: z.enum(["INMEDIATA", "DIARIA", "SEMANAL", "MENSUAL", "PERSONALIZADA"]),
  horarioInicio: z.string().optional(),
  horarioFin: z.string().optional(),
  diasSemana: z.array(z.number().min(0).max(6)).optional(),
  montoMinimo: z.number().optional(),
  categoriasExcluidas: z.array(z.string()).optional(),
  configuracionExtra: z.record(z.any()).optional()
})

// GET /api/alertas/config - Obtener configuraciones del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const configuraciones = await prisma.configuracionAlerta.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        tipoAlerta: "asc"
      }
    })

    // Si no hay configuraciones, crear las por defecto
    if (configuraciones.length === 0) {
      const tiposAlerta = [
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
      ]

      const configuracionesPorDefecto = await Promise.all(
        tiposAlerta.map(tipo => 
          prisma.configuracionAlerta.create({
            data: {
              userId: session.user.id,
              tipoAlerta: tipo as any,
              habilitado: true,
              canales: ["IN_APP"],
              frecuencia: "INMEDIATA"
            }
          })
        )
      )

      return NextResponse.json(configuracionesPorDefecto)
    }

    return NextResponse.json(configuraciones)

  } catch (error) {
    console.error("Error al obtener configuraciones:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// PUT /api/alertas/config - Actualizar configuraciones del usuario
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    
    // Validar que sea un array de configuraciones
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: "Se esperaba un array de configuraciones" },
        { status: 400 }
      )
    }

    const configuracionesValidadas = body.map(config => 
      configuracionAlertaSchema.parse(config)
    )

    // Actualizar o crear cada configuración
    const configuracionesActualizadas = await Promise.all(
      configuracionesValidadas.map(async (config) => {
        return await prisma.configuracionAlerta.upsert({
          where: {
            userId_tipoAlerta: {
              userId: session.user.id,
              tipoAlerta: config.tipoAlerta
            }
          },
          update: {
            habilitado: config.habilitado,
            canales: config.canales,
            frecuencia: config.frecuencia,
            horarioInicio: config.horarioInicio,
            horarioFin: config.horarioFin,
            diasSemana: config.diasSemana || [],
            montoMinimo: config.montoMinimo,
            categoriasExcluidas: config.categoriasExcluidas || [],
            configuracionExtra: config.configuracionExtra || {}
          },
          create: {
            userId: session.user.id,
            tipoAlerta: config.tipoAlerta,
            habilitado: config.habilitado,
            canales: config.canales,
            frecuencia: config.frecuencia,
            horarioInicio: config.horarioInicio,
            horarioFin: config.horarioFin,
            diasSemana: config.diasSemana || [],
            montoMinimo: config.montoMinimo,
            categoriasExcluidas: config.categoriasExcluidas || [],
            configuracionExtra: config.configuracionExtra || {}
          }
        })
      })
    )

    return NextResponse.json(configuracionesActualizadas)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: error.errors },
        { status: 400 }
      )
    }

    console.error("Error al actualizar configuraciones:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
} 