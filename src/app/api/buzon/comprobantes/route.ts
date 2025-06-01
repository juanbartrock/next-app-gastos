import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url)
    
    // Parámetros de filtrado
    const estado = searchParams.get('estado') || 'pendiente'
    const tipo = searchParams.get('tipo')
    const limite = parseInt(searchParams.get('limite') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const ordenar = searchParams.get('ordenar') || 'fechaSubida'
    const direccion = searchParams.get('direccion') || 'desc'

    console.log(`[BUZON] Listando comprobantes: estado=${estado}, tipo=${tipo}, userId=${userId}`)

    // Construir filtros
    const where: any = {
      userId: userId
    }

    if (estado !== 'todos') {
      where.estado = estado
    }

    if (tipo && tipo !== 'todos') {
      where.tipoDetectado = tipo
    }

    // Construir ordenamiento
    const orderBy: any = {}
    orderBy[ordenar] = direccion

    // Consultar comprobantes con paginación
    const [comprobantes, total] = await Promise.all([
      prisma.comprobantePendiente.findMany({
        where,
        orderBy,
        take: Math.min(limite, 100), // Máximo 100 por página
        skip: offset,
        select: {
          id: true,
          nombreArchivo: true,
          tipoDetectado: true,
          confianzaClasificacion: true,
          tamaño: true,
          estado: true,
          metadatos: true,
          datosExtraidos: true,
          errorProcesamiento: true,
          fechaSubida: true,
          fechaProcesado: true,
          fechaConfirmado: true,
          fechaDescartado: true,
          // NO incluir contenidoBase64 por default para performance
        }
      }),
      prisma.comprobantePendiente.count({ where })
    ])

    // Estadísticas por tipo y estado
    const estadisticas = await prisma.comprobantePendiente.groupBy({
      by: ['tipoDetectado', 'estado'],
      where: { userId },
      _count: {
        id: true
      }
    })

    // Organizar estadísticas
    const estadisticasOrganizadas = {
      porTipo: {} as Record<string, number>,
      porEstado: {} as Record<string, number>,
      total: total
    }

    estadisticas.forEach((stat: any) => {
      // Por tipo
      if (!estadisticasOrganizadas.porTipo[stat.tipoDetectado]) {
        estadisticasOrganizadas.porTipo[stat.tipoDetectado] = 0
      }
      estadisticasOrganizadas.porTipo[stat.tipoDetectado] += stat._count.id

      // Por estado
      if (!estadisticasOrganizadas.porEstado[stat.estado]) {
        estadisticasOrganizadas.porEstado[stat.estado] = 0
      }
      estadisticasOrganizadas.porEstado[stat.estado] += stat._count.id
    })

    console.log(`[BUZON] Encontrados ${comprobantes.length} comprobantes de ${total} total`)

    return NextResponse.json({
      comprobantes,
      estadisticas: estadisticasOrganizadas,
      paginacion: {
        total,
        limite,
        offset,
        tieneAnterior: offset > 0,
        tieneSiguiente: offset + limite < total
      }
    })

  } catch (error) {
    console.error("Error listando comprobantes:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
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