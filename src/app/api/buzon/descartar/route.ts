import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"
import prisma from "@/lib/prisma"

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

    const userId = session.user.id
    const { comprobantesIds, motivo } = await request.json()

    if (!comprobantesIds || !Array.isArray(comprobantesIds) || comprobantesIds.length === 0) {
      return NextResponse.json(
        { error: "Se requiere al menos un comprobante" },
        { status: 400 }
      )
    }

    console.log(`[BUZON] Descartando ${comprobantesIds.length} comprobantes para usuario ${userId}`)

    const resultados = {
      exitosos: [] as string[],
      fallidos: [] as Array<{ id: string, error: string }>,
      estadisticas: {
        total: comprobantesIds.length,
        exitosos: 0,
        fallidos: 0
      }
    }

    // Descartar cada comprobante
    for (const comprobanteId of comprobantesIds) {
      try {
        // Verificar que el comprobante existe y pertenece al usuario
        const comprobante = await prisma.comprobantePendiente.findFirst({
          where: {
            id: comprobanteId,
            userId: userId,
            estado: { in: ['pendiente', 'procesando'] } // Solo se pueden descartar estos estados
          }
        })

        if (!comprobante) {
          resultados.fallidos.push({
            id: comprobanteId,
            error: "Comprobante no encontrado o ya procesado"
          })
          continue
        }

        // Marcar como descartado
        await prisma.comprobantePendiente.update({
          where: { id: comprobanteId },
          data: {
            estado: 'descartado',
            fechaDescartado: new Date(),
            errorProcesamiento: motivo || 'Descartado por usuario'
          }
        })

        resultados.exitosos.push(comprobanteId)
        
        console.log(`[BUZON] Comprobante ${comprobante.nombreArchivo} descartado`)

      } catch (error) {
        console.error(`[BUZON] Error descartando comprobante ${comprobanteId}:`, error)
        resultados.fallidos.push({
          id: comprobanteId,
          error: `Error interno: ${error}`
        })
      }
    }

    // Actualizar estadísticas
    resultados.estadisticas.exitosos = resultados.exitosos.length
    resultados.estadisticas.fallidos = resultados.fallidos.length

    console.log(`[BUZON] Descarte completado: ${resultados.estadisticas.exitosos} exitosos, ${resultados.estadisticas.fallidos} fallidos`)

    return NextResponse.json(resultados)

  } catch (error) {
    console.error("Error descartando comprobantes:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
} 