import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"
import prisma from "@/lib/prisma"
import { executeWithRetry } from "@/lib/db-utils"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const tipo = searchParams.get('tipo')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Construir filtros
    const where: any = {
      userId: session.user.id
    }

    if (estado) {
      where.estado = estado
    }

    if (tipo) {
      where.tipoDetectado = tipo
    }

    // Consultar comprobantes pendientes y sus gastos asociados
    const comprobantes = await prisma.comprobantePendiente.findMany({
      where,
      orderBy: { fechaSubida: 'desc' },
      take: limit,
      skip: offset,
    })

    // Transformar datos para la interfaz
    const comprobantesTransformados = comprobantes.map(comprobante => ({
      id: comprobante.id,
      nombreArchivo: comprobante.nombreArchivo,
      tipoDetectado: comprobante.tipoDetectado,
      estado: mapearEstado(comprobante.estado),
      fechaSubida: comprobante.fechaSubida.toISOString(),
      datosExtraidos: comprobante.datosExtraidos,
      error: comprobante.errorProcesamiento,
      gastosCreados: obtenerGastosCreados(comprobante.datosExtraidos)
    }))

    return NextResponse.json(comprobantesTransformados)

  } catch (error) {
    console.error('[API-COMPROBANTES] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Mapear estados de BD a estados de interfaz
function mapearEstado(estadoBD: string): 'pendiente' | 'procesado' | 'error' {
  switch (estadoBD) {
    case 'confirmado':
      return 'procesado'
    case 'pendiente':
    case 'procesando':
      return 'pendiente'
    default:
      return 'error'
  }
}

// Extraer información de gastos creados desde datosExtraidos
function obtenerGastosCreados(datosExtraidos: any): any[] | undefined {
  if (!datosExtraidos) return undefined

  // Si hay información de gastos creados en los metadatos
  if (datosExtraidos.gastosCreados) {
    return datosExtraidos.gastosCreados
  }

  // Si hay un monto, inferir que se creó al menos un gasto
  if (datosExtraidos.monto || datosExtraidos.importe || datosExtraidos.pagoMinimo) {
    return [{ id: 'inferred', monto: datosExtraidos.monto || datosExtraidos.importe || datosExtraidos.pagoMinimo }]
  }

  return undefined
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    // Verificar que el comprobante pertenece al usuario
    const comprobante = await executeWithRetry(async () => {
      return await prisma.comprobantePendiente.findUnique({
        where: { id }
      })
    })

    if (!comprobante || comprobante.userId !== session.user.id) {
      return NextResponse.json({ error: 'Comprobante no encontrado' }, { status: 404 })
    }

    // Eliminar comprobante
    await executeWithRetry(async () => {
      return await prisma.comprobantePendiente.delete({
        where: { id }
      })
    })

    return NextResponse.json({ 
      message: 'Comprobante eliminado exitosamente',
      id 
    })

  } catch (error) {
    console.error('Error al eliminar comprobante:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Obtener un comprobante específico con su contenido
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
    const { accion, comprobanteId } = await request.json()

    if (accion === 'obtener_contenido') {
      // Obtener comprobante específico CON contenido
      const comprobante = await prisma.comprobantePendiente.findFirst({
        where: {
          id: comprobanteId,
          userId: userId
        }
      })

      if (!comprobante) {
        return NextResponse.json(
          { error: "Comprobante no encontrado" },
          { status: 404 }
        )
      }

      console.log(`[BUZON] Contenido solicitado para ${comprobante.nombreArchivo}`)

      return NextResponse.json({
        comprobante: {
          ...comprobante,
          contenidoBase64: comprobante.contenidoBase64 // Incluir contenido completo
        }
      })
    }

    if (accion === 'cambiar_estado') {
      const { nuevoEstado } = await request.json()
      
      if (!['pendiente', 'procesando', 'confirmado', 'descartado'].includes(nuevoEstado)) {
        return NextResponse.json(
          { error: "Estado inválido" },
          { status: 400 }
        )
      }

      const fechaActual = new Date()
      const updateData: any = { estado: nuevoEstado }

      // Actualizar fechas según el estado
      switch (nuevoEstado) {
        case 'confirmado':
          updateData.fechaConfirmado = fechaActual
          break
        case 'descartado':
          updateData.fechaDescartado = fechaActual
          break
        case 'procesando':
          updateData.fechaProcesado = fechaActual
          break
      }

      const comprobante = await prisma.comprobantePendiente.update({
        where: {
          id: comprobanteId,
          userId: userId
        },
        data: updateData
      })

      console.log(`[BUZON] Estado cambiado a ${nuevoEstado} para ${comprobante.nombreArchivo}`)

      return NextResponse.json({ comprobante })
    }

    return NextResponse.json(
      { error: "Acción no válida" },
      { status: 400 }
    )

  } catch (error) {
    console.error("Error en operación POST comprobantes:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
} 