import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"
import prisma from "@/lib/prisma"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Función auxiliar para limpiar y extraer JSON de respuestas de OpenAI
function extraerJSON(content: string): any {
  try {
    // Primero intentar parsear directamente
    return JSON.parse(content)
  } catch (error) {
    // Si falla, buscar JSON envuelto en markdown
    console.log('[OCR] Intentando extraer JSON de markdown...')
    
    // Remover bloques de código markdown (```json ... ``` o ``` ... ```)
    let cleanContent = content.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    
    try {
      return JSON.parse(cleanContent)
    } catch (error2) {
      // Si aún falla, buscar el primer objeto JSON en el contenido
      const jsonMatch = content.match(/\{[\s\S]*?\}(?=\s*(?:```|\n\n|$))/g)
      if (jsonMatch && jsonMatch.length > 0) {
        return JSON.parse(jsonMatch[0])
      }
      
      throw new Error('No se pudo extraer JSON válido de la respuesta')
    }
  }
}

// Detectar tipo de archivo desde base64
function detectarTipoArchivo(contenidoBase64: string): 'pdf' | 'imagen' {
  const base64Data = contenidoBase64.includes(',') ? contenidoBase64.split(',')[1] : contenidoBase64
  
  try {
    const buffer = Buffer.from(base64Data, 'base64')
    
    if (buffer.length >= 4) {
      // PDF: %PDF (0x25504446)
      if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
        return 'pdf'
      }
      
      // JPEG: FF D8 FF
      if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
        return 'imagen'
      }
      
      // PNG: 89 50 4E 47
      if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        return 'imagen'
      }
    }
    
    return 'imagen'
  } catch (error) {
    console.error('[BUZON] Error detectando tipo de archivo:', error)
    return 'imagen'
  }
}

// Procesamiento específico para transferencias
async function procesarTransferencia(contenidoBase64: string) {
  const tipoArchivo = detectarTipoArchivo(contenidoBase64)
  
  if (tipoArchivo === 'pdf') {
    throw new Error('Los PDFs no son compatibles con la extracción de transferencias. Por favor, convierte a imagen.')
  }

  const prompt = `
Analiza este comprobante de transferencia bancaria y extrae la información en formato JSON.

Estructura JSON requerida:
{
  "monto": número,
  "bancoEmisor": "nombre banco",
  "bancoReceptor": "nombre banco" o null,
  "cbuEmisor": "22 dígitos" o null,
  "cbuReceptor": "22 dígitos" o null,
  "concepto": "descripción transferencia" o null,
  "fecha": "DD/MM/YYYY",
  "destinatarioNombre": "nombre destinatario",
  "numeroOperacion": "número" o null,
  "hora": "HH:MM:SS" o null,
  "cuentaOrigen": "número cuenta" o null,
  "alias": "alias CBU" o null
}

Extrae solo los datos visibles. Si un campo no está presente, usa null.
Convierte fechas al formato DD/MM/YYYY.
RESPONDE SOLO CON JSON VÁLIDO, sin texto adicional.
`

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${contenidoBase64.includes(',') ? contenidoBase64.split(',')[1] : contenidoBase64}`,
            },
          },
        ],
      },
    ],
    max_tokens: 2000,
    temperature: 0.1,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No se pudo extraer información de la transferencia')
  }

  return extraerJSON(content)
}

// Procesamiento específico para servicios
async function procesarServicio(contenidoBase64: string) {
  const tipoArchivo = detectarTipoArchivo(contenidoBase64)
  
  if (tipoArchivo === 'pdf') {
    throw new Error('Los PDFs no son compatibles con la extracción de servicios. Por favor, convierte a imagen.')
  }

  const prompt = `
Analiza este comprobante de pago de servicio y extrae la información en formato JSON.

Estructura JSON requerida:
{
  "importe": número,
  "entidad": "nombre empresa de servicio",
  "concepto": "tipo de servicio",
  "fechaPago": "DD/MM/YYYY HH:MM:SS",
  "codigoLinkPagos": "código" o null,
  "numeroReferencia": "referencia" o null,
  "numeroFactura": "número" o null,
  "metodoPago": "método" o null,
  "comisionPago": número o null
}

Extrae solo los datos visibles. Si un campo no está presente, usa null.
Convierte fechas al formato DD/MM/YYYY HH:MM:SS.
RESPONDE SOLO CON JSON VÁLIDO, sin texto adicional.
`

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${contenidoBase64.includes(',') ? contenidoBase64.split(',')[1] : contenidoBase64}`,
            },
          },
        ],
      },
    ],
    max_tokens: 2000,
    temperature: 0.1,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No se pudo extraer información del servicio')
  }

  return extraerJSON(content)
}

// Procesamiento específico para resúmenes de tarjeta
async function procesarResumenTarjeta(contenidoBase64: string) {
  const tipoArchivo = detectarTipoArchivo(contenidoBase64)
  
  if (tipoArchivo === 'pdf') {
    throw new Error('Los PDFs no son compatibles con la extracción de resúmenes. Por favor, convierte a imagen.')
  }

  const prompt = `
Analiza este resumen de tarjeta de crédito argentina y extrae la información en formato JSON.

IMPORTANTE: 
- Para movimientos, extrae máximo 15-20 transacciones más relevantes
- Prioriza movimientos con montos diferentes y comercios únicos
- Evita duplicar movimientos muy similares (mismo comercio y monto)
- Incluye solo compras nuevas, excluye "SALDO ANTERIOR" y "SU PAGO EN PESOS"

Estructura JSON requerida:
{
  "banco": "nombre del banco",
  "numeroTarjeta": "últimos 4 dígitos",
  "titular": "nombre del titular",
  "fechaVencimiento": "DD/MM/YYYY",
  "fechaProximoVencimiento": "DD/MM/YYYY", 
  "pagoMinimo": número,
  "saldoTotal": número,
  "saldoAnterior": número,
  "fechaResumen": "DD/MM/YYYY" o null,
  "fechaCierre": "DD/MM/YYYY",
  "limiteDeCopra": número,
  "consumoTotal": número o null,
  "movimientos": [
    {
      "fecha": "DD/MM/YYYY",
      "comercio": "nombre comercio",
      "montoPesos": número,
      "montoDolares": número o null,
      "cuotas": "formato cuotas" o null
    }
  ]
}

Extrae solo los datos visibles. Si un campo no está presente, usa null.
Convierte fechas al formato DD/MM/YYYY.
Para movimientos en cuotas, extrae el formato exacto (ej: "C.08/09").
RESPONDE SOLO CON JSON VÁLIDO, sin texto adicional.
`

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${contenidoBase64.includes(',') ? contenidoBase64.split(',')[1] : contenidoBase64}`,
            },
          },
        ],
      },
    ],
    max_tokens: 4000,
    temperature: 0.1,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No se pudo extraer información del resumen')
  }

  return extraerJSON(content)
}

// Buscar gastos recurrentes coincidentes
async function buscarGastosRecurrentesCoincidentes(
  userId: string, 
  monto: number, 
  concepto: string | null
): Promise<Array<{gastoRecurrente: any, score: number, motivo: string}>> {
  try {
    const gastosRecurrentes = await prisma.gastoRecurrente.findMany({
      where: {
        userId: userId,
        estado: { in: ['pendiente', 'pago_parcial'] }
      },
      include: {
        categoria: { select: { descripcion: true } },
      }
    })

    const coincidencias: Array<{gastoRecurrente: any, score: number, motivo: string}> = []

    for (const recurrente of gastosRecurrentes) {
      let score = 0
      let motivos: string[] = []

      // Coincidencia de monto (60% del score)
      const toleranciaMonto = recurrente.monto * 0.10 // ±10%
      const diferenciaMonto = Math.abs(monto - recurrente.monto)
      
      if (diferenciaMonto <= toleranciaMonto) {
        const exactitudMonto = 1 - (diferenciaMonto / toleranciaMonto)
        score += exactitudMonto * 60
        motivos.push(`Monto similar: $${monto.toLocaleString()} vs $${recurrente.monto.toLocaleString()}`)
      }

      // Coincidencia de concepto (40% del score)
      if (concepto && recurrente.concepto) {
        const conceptoLimpio = concepto.toLowerCase().replace(/[^a-z\s]/g, '')
        const recurrenteLimpio = recurrente.concepto.toLowerCase().replace(/[^a-z\s]/g, '')
        
        if (conceptoLimpio.includes(recurrenteLimpio) || recurrenteLimpio.includes(conceptoLimpio)) {
          score += 40
          motivos.push(`Concepto coincide: "${concepto}" con "${recurrente.concepto}"`)
        }
      }

      if (score >= 30) {
        coincidencias.push({
          gastoRecurrente: {
            id: recurrente.id,
            concepto: recurrente.concepto,
            monto: recurrente.monto,
            estado: recurrente.estado,
            categoria: recurrente.categoria?.descripcion
          },
          score: Math.round(score),
          motivo: motivos.join(' | ')
        })
      }
    }

    return coincidencias.sort((a, b) => b.score - a.score)
  } catch (error) {
    console.error('[BUZON-MATCHING] Error buscando coincidencias:', error)
    return []
  }
}

// Crear gasto desde transferencia
async function crearGastoTransferencia(userId: string, datosTransferencia: any, gastoRecurrenteId?: number) {
  const categoriaTransferencia = await prisma.categoria.findFirst({
    where: { descripcion: 'Transferencias' }
  })

  if (!categoriaTransferencia) {
    throw new Error('Categoría Transferencias no encontrada')
  }

  const fechaGasto = datosTransferencia.fecha ? new Date(datosTransferencia.fecha.split('/').reverse().join('-')) : new Date()

  return await prisma.$transaction(async (tx) => {
    // Crear la transferencia
    const transferencia = await tx.comprobanteTransferencia.create({
      data: {
        userId,
        nombreArchivo: 'comprobante-transferencia.jpg',
        tipoArchivo: 'image/jpeg',
        tamanioArchivo: 1024,
        fecha: fechaGasto,
        monto: datosTransferencia.monto,
        bancoEmisor: datosTransferencia.bancoEmisor,
        cuentaDestino: datosTransferencia.destinatarioNombre || 'Destinatario',
        cbuOrigen: datosTransferencia.cbuEmisor,
        cbuDestino: datosTransferencia.cbuReceptor,
        concepto: datosTransferencia.concepto || `Transferencia a ${datosTransferencia.destinatarioNombre || 'Destinatario'}`,
      }
    })

    // Crear el gasto asociado
    const gasto = await tx.gasto.create({
      data: {
        userId,
        monto: datosTransferencia.monto,
        concepto: transferencia.concepto || 'Transferencia',
        fecha: fechaGasto,
        categoria: categoriaTransferencia.descripcion,
        categoriaId: categoriaTransferencia.id,
        tipoMovimiento: 'digital',
        gastoRecurrenteId: gastoRecurrenteId || null
      }
    })

    // Asociar la transferencia al gasto
    await tx.comprobanteTransferencia.update({
      where: { id: transferencia.id },
      data: { gastoGeneradoId: gasto.id }
    })

    // Actualizar estado del gasto recurrente si aplica
    if (gastoRecurrenteId) {
      const totalPagado = await tx.gasto.aggregate({
        where: { gastoRecurrenteId },
        _sum: { monto: true }
      })

      const gastoRecurrente = await tx.gastoRecurrente.findUnique({
        where: { id: gastoRecurrenteId }
      })

      if (gastoRecurrente) {
        const montoPagado = totalPagado._sum.monto || 0
        const nuevoEstado = montoPagado >= gastoRecurrente.monto 
          ? 'pagado' 
          : montoPagado > 0 
            ? 'pago_parcial' 
            : 'pendiente'

        await tx.gastoRecurrente.update({
          where: { id: gastoRecurrenteId },
          data: { estado: nuevoEstado, ultimoPago: new Date() }
        })
      }
    }

    return { gasto, transferencia }
  })
}

// Crear gasto desde servicio
async function crearGastoServicio(userId: string, datosServicio: any, gastoRecurrenteId?: number) {
  const categoriaServicio = await prisma.categoria.findFirst({
    where: { descripcion: 'Servicios' }
  })

  if (!categoriaServicio) {
    throw new Error('Categoría Servicios no encontrada')
  }

  const fechaGasto = datosServicio.fechaPago ? new Date(datosServicio.fechaPago.split(' ')[0].split('/').reverse().join('-')) : new Date()

  return await prisma.$transaction(async (tx) => {
    const gasto = await tx.gasto.create({
      data: {
        userId,
        monto: datosServicio.importe,
        concepto: `${datosServicio.entidad} - ${datosServicio.concepto}`,
        fecha: fechaGasto,
        categoria: categoriaServicio.descripcion,
        categoriaId: categoriaServicio.id,
        tipoMovimiento: 'digital',
        gastoRecurrenteId: gastoRecurrenteId || null
      }
    })

    // Actualizar estado del gasto recurrente si aplica
    if (gastoRecurrenteId) {
      const totalPagado = await tx.gasto.aggregate({
        where: { gastoRecurrenteId },
        _sum: { monto: true }
      })

      const gastoRecurrente = await tx.gastoRecurrente.findUnique({
        where: { id: gastoRecurrenteId }
      })

      if (gastoRecurrente) {
        const montoPagado = totalPagado._sum.monto || 0
        const nuevoEstado = montoPagado >= gastoRecurrente.monto 
          ? 'pagado' 
          : montoPagado > 0 
            ? 'pago_parcial' 
            : 'pendiente'

        await tx.gastoRecurrente.update({
          where: { id: gastoRecurrenteId },
          data: { estado: nuevoEstado, ultimoPago: new Date() }
        })
      }
    }

    return { gasto }
  })
}

// Crear gastos desde resumen de tarjeta
async function crearGastosResumenTarjeta(userId: string, datosResumen: any) {
  const categoriaTarjeta = await prisma.categoria.findFirst({
    where: { descripcion: 'Tarjeta de Crédito' }
  })

  if (!categoriaTarjeta) {
    throw new Error('Categoría Tarjeta de Crédito no encontrada')
  }

  return await prisma.$transaction(async (tx) => {
    const gastos = []

    // Crear gasto principal por el pago mínimo
    const fechaVencimiento = datosResumen.fechaVencimiento ? new Date(datosResumen.fechaVencimiento.split('/').reverse().join('-')) : new Date()
    
    const gastoPrincipal = await tx.gasto.create({
      data: {
        userId,
        monto: datosResumen.pagoMinimo,
        concepto: `${datosResumen.banco} - Pago mínimo: $${datosResumen.pagoMinimo.toLocaleString()}`,
        fecha: fechaVencimiento,
        categoria: categoriaTarjeta.descripcion,
        categoriaId: categoriaTarjeta.id,
        tipoMovimiento: 'digital'
      }
    })
    gastos.push(gastoPrincipal)

    // Crear detalles por movimientos (solo algunos representativos)
    if (datosResumen.movimientos && datosResumen.movimientos.length > 0) {
      const movimientosLimitados = datosResumen.movimientos.slice(0, 5) // Solo los primeros 5

      for (const movimiento of movimientosLimitados) {
        const gastoDetalle = await tx.gastoDetalle.create({
          data: {
            gastoId: gastoPrincipal.id,
            descripcion: movimiento.comercio,
            subtotal: movimiento.montoPesos
          }
        })
      }
    }

    return gastos
  })
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { comprobanteId, tipoComprobante, contenidoBase64, gastoRecurrenteId } = await request.json()

    if (!comprobanteId || !tipoComprobante || !contenidoBase64) {
      return NextResponse.json({ error: 'Datos faltantes' }, { status: 400 })
    }

    console.log(`[BUZON] Procesando comprobante ${comprobanteId} de tipo ${tipoComprobante}`)

    let datosExtraidos: any
    let gastosCreados: any[] = []
    let transferenciaCreada: any = null

    // Procesar según el tipo
    switch (tipoComprobante) {
      case 'transferencia':
        datosExtraidos = await procesarTransferencia(contenidoBase64)
        
        // Buscar coincidencias con gastos recurrentes
        const coincidenciasTransferencia = await buscarGastosRecurrentesCoincidentes(
          session.user.id, 
          datosExtraidos.monto, 
          datosExtraidos.concepto || datosExtraidos.destinatarioNombre
        )
        
        // Crear gasto y transferencia
        const resultadoTransferencia = await crearGastoTransferencia(
          session.user.id, 
          datosExtraidos, 
          gastoRecurrenteId
        )
        gastosCreados.push(resultadoTransferencia.gasto)
        transferenciaCreada = resultadoTransferencia.transferencia
        
        return NextResponse.json({
          success: true,
          datosExtraidos,
          gastosCreados,
          transferenciaCreada,
          coincidenciasRecurrentes: coincidenciasTransferencia
        })

      case 'servicio':
        datosExtraidos = await procesarServicio(contenidoBase64)
        
        // Buscar coincidencias con gastos recurrentes
        const coincidenciasServicio = await buscarGastosRecurrentesCoincidentes(
          session.user.id, 
          datosExtraidos.importe, 
          `${datosExtraidos.entidad} - ${datosExtraidos.concepto}`
        )
        
        // Crear gasto
        const resultadoServicio = await crearGastoServicio(
          session.user.id, 
          datosExtraidos, 
          gastoRecurrenteId
        )
        gastosCreados.push(resultadoServicio.gasto)
        
        return NextResponse.json({
          success: true,
          datosExtraidos,
          gastosCreados,
          coincidenciasRecurrentes: coincidenciasServicio
        })

      case 'resumen_tarjeta':
        datosExtraidos = await procesarResumenTarjeta(contenidoBase64)
        
        // Crear gastos del resumen
        const gastosResumen = await crearGastosResumenTarjeta(session.user.id, datosExtraidos)
        gastosCreados = gastosResumen
        
        return NextResponse.json({
          success: true,
          datosExtraidos,
          gastosCreados,
          coincidenciasRecurrentes: []
        })

      default:
        throw new Error(`Tipo de comprobante no soportado: ${tipoComprobante}`)
    }

  } catch (error) {
    console.error('[BUZON] Error procesando comprobante:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error desconocido',
        success: false
      },
      { status: 500 }
    )
  }
} 