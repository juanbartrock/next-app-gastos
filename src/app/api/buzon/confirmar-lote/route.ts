import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"
import prisma from "@/lib/prisma"
import { executeWithRetry } from "@/lib/db-utils"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Función auxiliar para detectar el tipo de archivo desde base64
function detectarTipoArchivo(contenidoBase64: string): 'pdf' | 'imagen' {
  // Remover el prefijo data:...;base64, si existe
  const base64Data = contenidoBase64.includes(',') ? contenidoBase64.split(',')[1] : contenidoBase64
  
  try {
    // Convertir base64 a buffer para leer los primeros bytes
    const buffer = Buffer.from(base64Data, 'base64')
    
    // Verificar magic numbers
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
    
    // Fallback: si tiene datos válidos pero no detectamos el tipo, asumimos imagen
    return 'imagen'
  } catch (error) {
    console.error('[BUZON] Error detectando tipo de archivo:', error)
    return 'imagen' // Fallback seguro
  }
}

// Funciones de extracción eliminadas - procesamos PDFs directamente con GPT-4o

// Función para buscar gastos recurrentes que coincidan con la transferencia
async function buscarGastosRecurrentesCoincidentes(
  userId: string, 
  monto: number, 
  destinatarioNombre: string | null,
  fecha: Date
): Promise<Array<{gastoRecurrente: any, score: number, motivo: string}>> {
  try {
    // Obtener gastos recurrentes pendientes o con pago parcial
    const gastosRecurrentes = await prisma.gastoRecurrente.findMany({
      where: {
        userId: userId,
        estado: { in: ['pendiente', 'pago_parcial'] }
      },
      include: {
        categoria: { select: { descripcion: true } },
        gastosGenerados: { 
          select: { monto: true, fecha: true },
          orderBy: { createdAt: 'desc' },
          take: 5 // Últimos 5 pagos para análisis
        }
      }
    })

    const coincidencias: Array<{gastoRecurrente: any, score: number, motivo: string}> = []

    for (const recurrente of gastosRecurrentes) {
      let score = 0
      let motivos: string[] = []

      // 1. COINCIDENCIA DE MONTO (40% del score)
      const toleranciaMonto = recurrente.monto * 0.10 // ±10%
      const diferenciaMonto = Math.abs(monto - recurrente.monto)
      
      if (diferenciaMonto <= toleranciaMonto) {
        const exactitudMonto = 1 - (diferenciaMonto / toleranciaMonto)
        score += exactitudMonto * 40
        motivos.push(`Monto similar: $${monto.toLocaleString()} vs $${recurrente.monto.toLocaleString()}`)
      }

      // 2. COINCIDENCIA DE DESTINATARIO (30% del score)
      if (destinatarioNombre && recurrente.concepto) {
        const nombreLimpio = destinatarioNombre.toLowerCase().replace(/[^a-z\s]/g, '')
        const conceptoLimpio = recurrente.concepto.toLowerCase().replace(/[^a-z\s]/g, '')
        
        // Buscar palabras coincidentes (más tolerante)
        const palabrasNombre = nombreLimpio.split(' ').filter(p => p.length > 2)
        const palabrasConcepto = conceptoLimpio.split(' ').filter(p => p.length > 2)
        
        let coincidenciasPalabras = 0
        let palabrasCoincidentes: string[] = []
        
        // Buscar coincidencias exactas y parciales
        for (const palabra of palabrasNombre) {
          for (const palabraConcepto of palabrasConcepto) {
            // Coincidencia exacta
            if (palabra === palabraConcepto) {
              coincidenciasPalabras += 2 // Doble peso para coincidencias exactas
              palabrasCoincidentes.push(palabra)
            }
            // Coincidencia parcial (una palabra contiene a la otra)
            else if (palabra.length > 3 && palabraConcepto.includes(palabra)) {
              coincidenciasPalabras += 1.5
              palabrasCoincidentes.push(`${palabra} ≈ ${palabraConcepto}`)
            }
            else if (palabraConcepto.length > 3 && palabra.includes(palabraConcepto)) {
              coincidenciasPalabras += 1.5
              palabrasCoincidentes.push(`${palabraConcepto} ≈ ${palabra}`)
            }
          }
        }
        
        if (coincidenciasPalabras > 0) {
          const exactitudNombre = Math.min(coincidenciasPalabras / Math.max(palabrasNombre.length, palabrasConcepto.length), 1)
          score += exactitudNombre * 30
          motivos.push(`Destinatario coincide: "${destinatarioNombre}" con "${recurrente.concepto}" (${palabrasCoincidentes.join(', ')})`)
          
          console.log(`[BUZON-MATCHING] Coincidencia encontrada: ${palabrasCoincidentes.join(', ')} - Score: ${exactitudNombre * 30}`)
        }
      }

      // 3. COINCIDENCIA DE FECHA (20% del score)
      if (recurrente.proximaFecha) {
        const diasDiferencia = Math.abs(
          (fecha.getTime() - new Date(recurrente.proximaFecha).getTime()) / (1000 * 60 * 60 * 24)
        )
        
        if (diasDiferencia <= 7) { // Dentro de 7 días
          const exactitudFecha = 1 - (diasDiferencia / 7)
          score += exactitudFecha * 20
          motivos.push(`Fecha cercana a vencimiento: ${diasDiferencia.toFixed(0)} días de diferencia`)
        }
      }

      // 4. HISTORIAL DE PAGOS (10% del score)
      if (recurrente.gastosGenerados.length > 0) {
        const montosHistoricos = recurrente.gastosGenerados.map(g => g.monto)
        const montoPromedio = montosHistoricos.reduce((sum, m) => sum + m, 0) / montosHistoricos.length
        
        const toleranciaHistorica = montoPromedio * 0.15 // ±15% del promedio histórico
        if (Math.abs(monto - montoPromedio) <= toleranciaHistorica) {
          score += 10
          motivos.push(`Monto consistente con historial: promedio $${montoPromedio.toLocaleString()}`)
        }
      }

      // Solo incluir coincidencias con score mínimo del 25%
      if (score >= 25) {
        coincidencias.push({
          gastoRecurrente: {
            id: recurrente.id,
            concepto: recurrente.concepto,
            monto: recurrente.monto,
            estado: recurrente.estado,
            proximaFecha: recurrente.proximaFecha,
            categoria: recurrente.categoria?.descripcion
          },
          score: Math.round(score),
          motivo: motivos.join(' | ')
        })
      }
    }

    // Ordenar por score descendente
    return coincidencias.sort((a, b) => b.score - a.score)

  } catch (error) {
    console.error('[BUZON-MATCHING] Error buscando coincidencias:', error)
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    console.log('[BUZON-DEBUG] Usuario autenticado:', session.user.id)

    // Parsear body con manejo de errores
    let body
    try {
      body = await request.json()
      console.log('[BUZON-DEBUG] Body recibido:', JSON.stringify(body, null, 2))
    } catch (parseError) {
      console.error('[BUZON-DEBUG] Error parseando JSON:', parseError)
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const { comprobanteIds } = body

    console.log('[BUZON-DEBUG] comprobanteIds extraídos:', comprobanteIds)
    console.log('[BUZON-DEBUG] Tipo de comprobanteIds:', typeof comprobanteIds)
    console.log('[BUZON-DEBUG] Es array:', Array.isArray(comprobanteIds))

    if (!comprobanteIds || !Array.isArray(comprobanteIds)) {
      console.error('[BUZON-DEBUG] Validación fallida - comprobanteIds no es array válido')
      return NextResponse.json({ 
        error: 'Lista de IDs requerida',
        debug: {
          comprobanteIds,
          type: typeof comprobanteIds,
          isArray: Array.isArray(comprobanteIds)
        }
      }, { status: 400 })
    }

    if (comprobanteIds.length === 0) {
      console.error('[BUZON-DEBUG] Array vacío')
      return NextResponse.json({ error: 'Se requiere al menos un ID' }, { status: 400 })
    }

    console.log(`[BUZON-DEBUG] Procesando ${comprobanteIds.length} IDs válidos`)

    const exitosos: any[] = []
    const errores: any[] = []

    // Procesar cada comprobante en lote
    for (const id of comprobanteIds) {
      try {
        console.log(`[BUZON] Procesando comprobante ID: ${id}`)

        // Obtener comprobante pendiente
        const comprobante = await executeWithRetry(async () => {
          return await prisma.comprobantePendiente.findUnique({
            where: { id }
          })
        })

        if (!comprobante || comprobante.userId !== session.user.id) {
          errores.push({
            comprobanteId: id,
            error: 'Comprobante no encontrado o sin permisos'
          })
          continue
        }

        if (comprobante.estado === 'confirmado') {
          errores.push({
            comprobanteId: id,
            error: 'Comprobante ya procesado'
          })
          continue
        }

        // Procesar según tipo de comprobante detectado
        let gastoCreado = null
        let datosExtraidos = null
        
        if (comprobante.tipoDetectado === 'servicio') {
          const resultado = await procesarComprobanteServicio(comprobante, session.user.id)
          gastoCreado = resultado.gasto
          datosExtraidos = resultado.datosExtraidos
        } else if (comprobante.tipoDetectado === 'transferencia') {
          const resultado = await procesarComprobanteTransferencia(comprobante, session.user.id)
          gastoCreado = resultado.gasto
          datosExtraidos = resultado.datosExtraidos
        } else {
          // Para otros tipos, usar procesamiento genérico
          const resultado = await procesarComprobanteGenerico(comprobante, session.user.id)
          gastoCreado = resultado.gasto
          datosExtraidos = resultado.datosExtraidos
        }

        // Marcar como procesado
        await executeWithRetry(async () => {
          return await prisma.comprobantePendiente.update({
            where: { id },
            data: {
              estado: 'confirmado',
              fechaConfirmado: new Date(),
              datosExtraidos: datosExtraidos ? JSON.parse(JSON.stringify(datosExtraidos)) : null
            }
          })
        })

        // Buscar sugerencias de gastos recurrentes
        const sugerenciasRecurrentes = await buscarGastosRecurrentesCoincidentes(
          session.user.id,
          gastoCreado?.monto || 0,
          datosExtraidos?.destinatarioNombre || datosExtraidos?.entidad || null,
          new Date()
        )

        exitosos.push({
          comprobanteId: id,
          nombreArchivo: comprobante.nombreArchivo,
          datosExtraidos: datosExtraidos,
          sugerenciasRecurrentes: sugerenciasRecurrentes,
          gastoCreado: gastoCreado
        })

      } catch (error) {
        console.error(`[BUZON] Error procesando comprobante ${id}:`, error)
        errores.push({
          comprobanteId: id,
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
      }
    }

    console.log(`[BUZON] Lote procesado: ${exitosos.length} exitosos, ${errores.length} errores`)

    // IMPORTANTE: Devolver estructura que el frontend espera
    return NextResponse.json({
      exitosos: exitosos,
      errores: errores,
      estadisticas: {
        exitosos: exitosos.length,
        fallidos: errores.length,
        procesados: exitosos.length + errores.length
      }
    })

  } catch (error) {
    console.error('[BUZON] Error procesando lote:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Procesar comprobante de servicio
async function procesarComprobanteServicio(comprobante: any, userId: string) {
  try {
    const tipoArchivo = detectarTipoArchivo(comprobante.contenidoBase64)
    console.log(`[BUZON] Procesando servicio - Tipo detectado: ${tipoArchivo}`)

    let prompt = ''
    let modelToUse = ''
    let messages: any[] = []
    
    if (tipoArchivo === 'pdf') {
      console.log('[BUZON] 🔄 Procesando PDF directamente con GPT-4o...')
      
      // Limpiar base64 si tiene prefijo
      let base64Data = comprobante.contenidoBase64
      if (base64Data.includes(',')) {
        base64Data = base64Data.split(',')[1]
      }
      
      prompt = `
Analiza este documento PDF de un comprobante de pago de servicio argentino y extrae los datos exactos:

CONTEXTO ESPECÍFICO ARGENTINO:
- EDENOR: empresa de electricidad, busca "CUOTA" o "ELECTRICIDAD"  
- METROGAS: empresa de gas, busca "GAS NATURAL"
- Montos argentinos: formato $15.259,07 (punto para miles, coma para decimales)
- Fechas argentinas: DD/MM/YYYY
- Códigos de pago: números largos para Link Pagos o PagoMisCuentas

DATOS REQUERIDOS:
- importe: Monto a pagar (solo número, sin símbolos)
- entidad: Empresa del servicio (Edenor, Metrogas, etc.)
- concepto: Tipo de servicio (Electricidad, Gas Natural, etc.)
- fechaPago: Fecha de pago o vencimiento
- codigoLinkPagos: Código de pago Link Pagos si existe
- numeroReferencia: Número de referencia o comprobante

INSTRUCCIONES ESPECÍFICAS:
1. Si ves "EDENOR" → entidad: "Edenor", concepto: "Electricidad"
2. Si ves "METROGAS" → entidad: "Metrogas", concepto: "Gas Natural"  
3. Busca el importe más grande que aparezca (puede estar como CUOTA, TOTAL, IMPORTE)
4. Extrae fechas en formato DD/MM/YYYY
5. Si no encuentras algún dato, usa valores por defecto razonables

Responde SOLO con un objeto JSON válido:
{
  "importe": number,
  "entidad": "string",
  "concepto": "string", 
  "fechaPago": "string",
  "codigoLinkPagos": "string",
  "numeroReferencia": "string"
}
      `
      
      modelToUse = "gpt-4o" // GPT-4o puede procesar PDFs
      messages = [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:application/pdf;base64,${base64Data}`,
              },
            },
          ],
        },
      ]
      
    } else {
      // Es una imagen, usar GPT-4o Vision
      let base64Data = comprobante.contenidoBase64
      let mimeType = 'image/jpeg'
      
      if (base64Data.includes(',')) {
        base64Data = base64Data.split(',')[1]
      }
      
      const buffer = Buffer.from(base64Data, 'base64')
      if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        mimeType = 'image/png'
      }
      
      prompt = `
Analiza este comprobante de pago de servicio argentino y extrae los datos exactos:

CONTEXTO ESPECÍFICO ARGENTINO:
- EDENOR: empresa de electricidad, busca "CUOTA" o "ELECTRICIDAD"  
- METROGAS: empresa de gas, busca "GAS NATURAL"
- Montos argentinos: formato $15.259,07 (punto para miles, coma para decimales)
- Fechas argentinas: DD/MM/YYYY
- Códigos de pago: números largos para Link Pagos o PagoMisCuentas

DATOS REQUERIDOS:
- importe: Monto a pagar (solo número, sin símbolos)
- entidad: Empresa del servicio (Edenor, Metrogas, etc.)
- concepto: Tipo de servicio (Electricidad, Gas Natural, etc.)
- fechaPago: Fecha de pago o vencimiento
- codigoLinkPagos: Código de pago Link Pagos si existe
- numeroReferencia: Número de referencia o comprobante

INSTRUCCIONES ESPECÍFICAS:
1. Si ves "EDENOR" → entidad: "Edenor", concepto: "Electricidad"
2. Si ves "METROGAS" → entidad: "Metrogas", concepto: "Gas Natural"  
3. Busca el importe más grande que aparezca (puede estar como CUOTA, TOTAL, IMPORTE)
4. Extrae fechas en formato DD/MM/YYYY
5. Si no encuentras algún dato, usa valores por defecto razonables

Responde SOLO con un objeto JSON válido:
{
  "importe": number,
  "entidad": "string",
  "concepto": "string", 
  "fechaPago": "string",
  "codigoLinkPagos": "string",
  "numeroReferencia": "string"
}
      `
      
      modelToUse = "gpt-4o" // GPT-4o Vision para imágenes
      messages = [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Data}`,
              },
            },
          ],
        },
      ]
    }
    
    console.log(`[BUZON] Enviando a ${modelToUse}...`)

    const response = await openai.chat.completions.create({
      model: modelToUse,
      messages: messages,
      max_tokens: 500,
      temperature: 0.1,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No se pudo extraer información del comprobante')
    }

    console.log(`[BUZON] Respuesta de ${modelToUse}: ${content}`)

    let datosExtraidos: any
    try {
      datosExtraidos = JSON.parse(content)
    } catch (parseError) {
      console.error('[BUZON] Error parseando respuesta JSON:', parseError)
      // Intentar extraer JSON de la respuesta si hay texto adicional
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        datosExtraidos = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Respuesta no contiene JSON válido')
      }
    }

    console.log('[BUZON] Datos extraídos exitosamente:', datosExtraidos)

    // Buscar o crear categoría para servicios
    let categoria = await prisma.categoria.findFirst({
      where: {
        descripcion: {
          contains: 'servicio',
          mode: 'insensitive'
        }
      }
    })

    if (!categoria) {
      categoria = await executeWithRetry(async () => {
        return await prisma.categoria.create({
          data: {
            descripcion: 'Servicios'
          }
        })
      })
    }

    // Crear gasto
    const gasto = await executeWithRetry(async () => {
      return await prisma.gasto.create({
        data: {
          userId,
          monto: datosExtraidos.importe || 0,
          concepto: `${datosExtraidos.entidad} - ${datosExtraidos.concepto}`,
          fecha: new Date(), // Usar fecha actual para el registro
          categoriaId: categoria.id,
          categoria: 'Servicios',
          tipoMovimiento: 'digital',
          origenComprobante: 'buzon_automatico'
        }
      })
    })

    return { gasto, datosExtraidos }

  } catch (error) {
    console.error('[BUZON] Error procesando servicio:', error)
    throw new Error(`Error procesando comprobante de servicio: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  }
}

// Procesar comprobante de transferencia
async function procesarComprobanteTransferencia(comprobante: any, userId: string) {
  try {
    const tipoArchivo = detectarTipoArchivo(comprobante.contenidoBase64)
    console.log(`[BUZON] Procesando transferencia - Tipo detectado: ${tipoArchivo}`)

    let prompt = ''
    let modelToUse = ''
    let messages: any[] = []
    
    if (tipoArchivo === 'pdf') {
      console.log('[BUZON] 🔄 Procesando PDF directamente con GPT-4o...')
      
      // Limpiar base64 si tiene prefijo
      let base64Data = comprobante.contenidoBase64
      if (base64Data.includes(',')) {
        base64Data = base64Data.split(',')[1]
      }
      
      prompt = `
Analiza este documento PDF de un comprobante de transferencia bancaria argentina y extrae todos los datos:

DATOS REQUERIDOS:
- monto: Importe transferido (solo número decimal)
- bancoEmisor: Banco que realiza la transferencia  
- bancoReceptor: Banco que recibe la transferencia
- cbuEmisor: CBU del emisor (22 dígitos)
- cbuReceptor: CBU del receptor (22 dígitos)
- concepto: Concepto de la transferencia (ej: "Varios", "Pago", etc.)
- fecha: Fecha de la operación (formato DD/MM/YYYY)
- destinatarioNombre: Nombre completo del destinatario (buscar después de "DESTINO:")

BANCOS ARGENTINOS COMUNES:
- Banco Ciudad, Banco Macro, Banco Nación, Banco Santander, BBVA, Banco Galicia

INSTRUCCIONES ESPECÍFICAS:
1. Busca el monto más grande que aparezca en el comprobante
2. Identifica bancos argentinos por sus nombres o logos
3. Extrae CBUs completos (22 dígitos)
4. El destinatarioNombre debe ser el nombre de la persona que recibe
5. Si no encuentras algún dato, déjalo como null

Responde SOLO con JSON válido:
{
  "monto": number,
  "bancoEmisor": "string",
  "bancoReceptor": "string", 
  "cbuEmisor": "string",
  "cbuReceptor": "string",
  "concepto": "string",
  "fecha": "string",
  "destinatarioNombre": "string"
}
      `
      
      modelToUse = "gpt-4o" // GPT-4o puede procesar PDFs
      messages = [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:application/pdf;base64,${base64Data}`,
              },
            },
          ],
        },
      ]
      
    } else {
      // Es una imagen, usar GPT-4o Vision
      let base64Data = comprobante.contenidoBase64
      let mimeType = 'image/jpeg'
      
      if (base64Data.includes(',')) {
        base64Data = base64Data.split(',')[1]
      }
      
      const buffer = Buffer.from(base64Data, 'base64')
      if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        mimeType = 'image/png'
      }
      
      prompt = `
Analiza este comprobante de transferencia bancaria argentina y extrae todos los datos:

DATOS REQUERIDOS:
- monto: Importe transferido (solo número decimal)
- bancoEmisor: Banco que realiza la transferencia  
- bancoReceptor: Banco que recibe la transferencia
- cbuEmisor: CBU del emisor (22 dígitos)
- cbuReceptor: CBU del receptor (22 dígitos)
- concepto: Concepto de la transferencia (ej: "Varios", "Pago", etc.)
- fecha: Fecha de la operación (formato DD/MM/YYYY)
- destinatarioNombre: Nombre completo del destinatario (buscar después de "DESTINO:")

BANCOS ARGENTINOS COMUNES:
- Banco Ciudad, Banco Macro, Banco Nación, Banco Santander, BBVA, Banco Galicia

INSTRUCCIONES ESPECÍFICAS:
1. Busca el monto más grande que aparezca en el comprobante
2. Identifica bancos argentinos por sus nombres o logos
3. Extrae CBUs completos (22 dígitos)
4. El destinatarioNombre debe ser el nombre de la persona que recibe
5. Si no encuentras algún dato, déjalo como null

Responde SOLO con JSON válido:
{
  "monto": number,
  "bancoEmisor": "string",
  "bancoReceptor": "string", 
  "cbuEmisor": "string",
  "cbuReceptor": "string",
  "concepto": "string",
  "fecha": "string",
  "destinatarioNombre": "string"
}
      `
      
      modelToUse = "gpt-4o" // GPT-4o Vision para imágenes
      messages = [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Data}`,
              },
            },
          ],
        },
      ]
    }
    
    console.log(`[BUZON] Enviando a ${modelToUse}...`)

    const response = await openai.chat.completions.create({
      model: modelToUse,
      messages: messages,
      max_tokens: 500,
      temperature: 0.1,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No se pudo extraer información de la transferencia')
    }

    console.log(`[BUZON] Respuesta de ${modelToUse}: ${content}`)

    let datosExtraidos: any
    try {
      datosExtraidos = JSON.parse(content)
    } catch (parseError) {
      console.error('[BUZON] Error parseando respuesta JSON:', parseError)
      // Intentar extraer JSON de la respuesta si hay texto adicional
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        datosExtraidos = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Respuesta no contiene JSON válido')
      }
    }

    console.log('[BUZON] Datos extraídos exitosamente:', datosExtraidos)

    // Crear registro de transferencia
    const transferencia = await executeWithRetry(async () => {
      return await prisma.comprobanteTransferencia.create({
        data: {
          userId,
          nombreArchivo: comprobante.nombreArchivo,
          tipoArchivo: tipoArchivo === 'pdf' ? 'application/pdf' : 'image/jpeg',
          tamanioArchivo: comprobante.tamaño,
          fecha: new Date(),
          monto: datosExtraidos.monto || 0,
          bancoEmisor: datosExtraidos.bancoEmisor || 'Banco Ciudad',
          cuentaDestino: datosExtraidos.bancoReceptor || 'No especificado',
          cbuOrigen: datosExtraidos.cbuEmisor || '',
          cbuDestino: datosExtraidos.cbuReceptor || '',
          concepto: datosExtraidos.concepto || 'Transferencia',
          numeroOperacion: comprobante.id,
          estadoProcesamiento: 'procesado',
          datosOriginalesOCR: JSON.stringify({
            ...datosExtraidos,
            archivoOriginal: comprobante.nombreArchivo,
            tipoArchivo: tipoArchivo
          })
        }
      })
    })

    // También crear un gasto asociado
    let categoria = await executeWithRetry(async () => {
      return await prisma.categoria.findFirst({
        where: { descripcion: 'Transferencias' }
      })
    })

    if (!categoria) {
      categoria = await executeWithRetry(async () => {
        return await prisma.categoria.create({
          data: {
            descripcion: 'Transferencias'
          }
        })
      })
    }

    const gasto = await executeWithRetry(async () => {
      return await prisma.gasto.create({
        data: {
          userId,
          monto: datosExtraidos.monto || 0,
          concepto: `Transferencia - ${datosExtraidos.concepto || 'No especificado'}`,
          fecha: new Date(),
          categoriaId: categoria.id,
          categoria: 'Transferencias',
          tipoMovimiento: 'digital',
          origenComprobante: 'buzon_automatico'
        }
      })
    })

    // Vincular transferencia con gasto
    await executeWithRetry(async () => {
      return await prisma.comprobanteTransferencia.update({
        where: { id: transferencia.id },
        data: { gastoGeneradoId: gasto.id }
      })
    })

    return { gasto, datosExtraidos }

  } catch (error) {
    console.error('[BUZON] Error procesando transferencia:', error)
    throw new Error(`Error procesando transferencia: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  }
}

// Procesamiento genérico para otros tipos
async function procesarComprobanteGenerico(comprobante: any, userId: string) {
  try {
    const prompt = `
Analiza este comprobante y extrae la información básica:

DATOS REQUERIDOS:
- monto: Importe (solo número)
- concepto: Descripción del comprobante
- fecha: Fecha del documento

Responde SOLO con JSON válido:
{
  "monto": number,
  "concepto": "string",
  "fecha": "string"
}
    `

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${comprobante.contenidoBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
      temperature: 0.1,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No se pudo extraer información del comprobante')
    }

    const datosExtraidos = JSON.parse(content)

    // Crear gasto genérico
    let categoria = await executeWithRetry(async () => {
      return await prisma.categoria.findFirst({
        where: { descripcion: 'Otros' }
      })
    })

    if (!categoria) {
      categoria = await executeWithRetry(async () => {
        return await prisma.categoria.create({
          data: {
            descripcion: 'Otros'
          }
        })
      })
    }

    const gasto = await executeWithRetry(async () => {
      return await prisma.gasto.create({
        data: {
          userId,
          monto: datosExtraidos.monto || 0,
          concepto: datosExtraidos.concepto || 'Comprobante procesado automáticamente',
          fecha: new Date(),
          categoriaId: categoria.id,
          categoria: 'Otros',
          tipoMovimiento: 'digital',
          origenComprobante: 'buzon_automatico'
        }
      })
    })

    return { gasto, datosExtraidos }

  } catch (error) {
    console.error('[BUZON] Error procesando genérico:', error)
    throw new Error(`Error procesando comprobante: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  }
}