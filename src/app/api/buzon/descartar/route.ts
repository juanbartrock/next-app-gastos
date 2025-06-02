import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"
import prisma from "@/lib/prisma"
import { executeWithRetry } from "@/lib/db-utils"

export async function POST(request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { comprobanteIds, motivo } = await request.json()

    if (!comprobanteIds || !Array.isArray(comprobanteIds)) {
      return NextResponse.json({ error: 'Lista de IDs requerida' }, { status: 400 })
    }

    const resultados = {
      exitosos: [] as any[],
      errores: [] as any[],
      estadisticas: {
        descartados: 0,
        errores: 0
      }
    }

    // Procesar cada comprobante para descarte
    for (const id of comprobanteIds) {
      try {
        console.log(`[BUZON] Descartando comprobante ID: ${id}`)

        // Verificar que el comprobante existe y pertenece al usuario
        const comprobante = await executeWithRetry(async () => {
          return await prisma.comprobantePendiente.findUnique({
            where: { id }
          })
        })

        if (!comprobante || comprobante.userId !== session.user.id) {
          resultados.errores.push({
            id,
            error: 'Comprobante no encontrado o sin permisos'
          })
          continue
        }

        if (comprobante.estado === 'descartado') {
          resultados.errores.push({
            id,
            error: 'Comprobante ya descartado'
          })
          continue
        }

        // Marcar como descartado
        await executeWithRetry(async () => {
          return await prisma.comprobantePendiente.update({
            where: { id },
            data: {
              estado: 'descartado',
              fechaDescartado: new Date(),
              datosExtraidos: motivo ? JSON.parse(JSON.stringify({
                motivoDescarte: motivo,
                fechaDescarte: new Date().toISOString()
              })) : null
            }
          })
        })

        resultados.exitosos.push({
          id,
          nombreArchivo: comprobante.nombreArchivo,
          tipo: comprobante.tipoDetectado
        })

        resultados.estadisticas.descartados++

      } catch (error) {
        console.error(`[BUZON] Error descartando comprobante ${id}:`, error)
        resultados.errores.push({
          id,
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
        resultados.estadisticas.errores++
      }
    }

    console.log(`[BUZON] Descarte completado: ${resultados.estadisticas.descartados} descartados, ${resultados.estadisticas.errores} errores`)

    return NextResponse.json({
      message: 'Comprobantes descartados',
      resultados
    })

  } catch (error) {
    console.error('[BUZON] Error descartando comprobantes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Endpoint para eliminar comprobantes descartados permanentemente
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const diasAntiguedad = parseInt(searchParams.get('dias') || '30')

    // Eliminar comprobantes descartados hace más de X días
    const fechaLimite = new Date()
    fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad)

    const eliminados = await executeWithRetry(async () => {
      return await prisma.comprobantePendiente.deleteMany({
        where: {
          userId: session.user.id,
          estado: 'descartado',
          fechaDescartado: {
            lt: fechaLimite
          }
        }
      })
    })

    console.log(`[BUZON] Eliminados ${eliminados.count} comprobantes descartados antiguos`)

    return NextResponse.json({
      message: `${eliminados.count} comprobantes eliminados permanentemente`,
      eliminados: eliminados.count
    })

  } catch (error) {
    console.error('[BUZON] Error eliminando comprobantes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 