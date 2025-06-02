import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"
import OpenAI from "openai"
import prisma from "@/lib/prisma"
import { executeWithRetry } from "@/lib/db-utils"

// Configurar cliente de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Tipos de comprobantes soportados
const TIPOS_COMPROBANTES = {
  TRANSFERENCIA: 'transferencia',
  TICKET: 'ticket',
  SERVICIO: 'servicio',
  RESUMEN_TARJETA: 'resumen_tarjeta',
  DESCONOCIDO: 'desconocido'
} as const

type TipoComprobante = typeof TIPOS_COMPROBANTES[keyof typeof TIPOS_COMPROBANTES]

interface ArchivoClasificado {
  archivoId: string
  nombre: string
  tipo: TipoComprobante
  contenidoBase64: string
  tamaño: number
  confianza: number // 0-100, qué tan segura está la clasificación
  metadatos?: Record<string, any>
}

interface ResultadoProcesamiento {
  exitosos: ArchivoClasificado[]
  fallidos: Array<{
    nombre: string
    error: string
  }>
  estadisticas: {
    total: number
    exitosos: number
    fallidos: number
    tiposDetectados: Record<TipoComprobante, number>
  }
}

// Función para clasificar automáticamente el tipo de comprobante
async function clasificarComprobante(
  contenidoBase64: string, 
  nombreArchivo: string
): Promise<{ tipo: TipoComprobante, confianza: number, metadatos?: Record<string, any> }> {
  
  // Detectar tipo de archivo primero
  const tipoArchivo = detectarTipoArchivo(contenidoBase64)
  
  // Clasificación inicial por nombre de archivo (más específica)
  const nombreLower = nombreArchivo.toLowerCase()
  
  // Patrones específicos para servicios (PRIORIDAD ALTA)
  const serviciosConocidos = ['metrogas', 'edenor', 'edelap', 'naturgy', 'telecom', 'claro', 'movistar', 'personal', 'aysa', 'aba']
  const esServicio = serviciosConocidos.some(servicio => nombreLower.includes(servicio))
  
  if (esServicio || nombreLower.includes('pago') && (nombreLower.includes('servicio') || nombreLower.includes('factura'))) {
    return { tipo: TIPOS_COMPROBANTES.SERVICIO, confianza: 95 }
  }
  
  // Transferencias específicas
  if ((nombreLower.includes('transferencia') && !nombreLower.includes('pago')) || 
      nombreLower.includes('envio') || nombreLower.includes('envío')) {
    return { tipo: TIPOS_COMPROBANTES.TRANSFERENCIA, confianza: 85 }
  }
  
  // Comprobantes bancarios (solo si no son de servicios)
  if (nombreLower.includes('comprobante') && 
      (nombreLower.includes('banco') || nombreLower.includes('transferencia'))) {
    return { tipo: TIPOS_COMPROBANTES.TRANSFERENCIA, confianza: 80 }
  }
  
  // Tickets de compra
  if (nombreLower.includes('ticket') || nombreLower.includes('recibo') || 
      nombreLower.includes('compra') || nombreLower.includes('super')) {
    return { tipo: TIPOS_COMPROBANTES.TICKET, confianza: 75 }
  }
  
  // Resúmenes de tarjeta
  if (nombreLower.includes('resumen') || nombreLower.includes('tarjeta') || 
      nombreLower.includes('visa') || nombreLower.includes('mastercard')) {
    return { tipo: TIPOS_COMPROBANTES.RESUMEN_TARJETA, confianza: 80 }
  }

  // Si OpenAI está disponible, usar clasificación inteligente
  if (openai) {
    try {
      console.log(`[BUZON-AI] Clasificando con IA: ${nombreArchivo} (${tipoArchivo})`)
      
      if (tipoArchivo === 'pdf') {
        // Para PDFs, extraer texto primero y usar análisis de texto
        const textoPDF = extraerTextoPDF(contenidoBase64)
        console.log(`[BUZON-AI] Texto extraído para clasificación: ${textoPDF.substring(0, 100)}...`)
        
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `Eres un clasificador especializado en documentos financieros argentinos. 
              Analiza el texto extraído y determina qué tipo de comprobante es:
              
              - servicio: Facturas y comprobantes de pago de servicios públicos (Metrogas, Edenor, Edelap, Naturgy, Telecom, Claro, Movistar, Personal, AYSA, ABA, etc.) o privados (Netflix, Spotify, etc.)
              - transferencia: Comprobantes de transferencias bancarias entre cuentas
              - ticket: Tickets de compra de supermercados, farmacias, comercios
              - resumen_tarjeta: Resúmenes mensuales de tarjetas de crédito
              - desconocido: Si no puedes determinar el tipo claramente
              
              IMPORTANTE: Si ves nombres de empresas de servicios o conceptos como "CUOTA", "VENCIMIENTO", "PAGO DE SERVICIO", clasifica como "servicio".
              
              Responde en JSON con: {"tipo": "...", "confianza": numero_0_100, "razon": "explicacion_detallada"}`
            },
            {
              role: "user",
              content: `Clasifica este documento PDF. 
              Nombre del archivo: "${nombreArchivo}"
              Texto extraído: "${textoPDF}"`
            },
          ],
          max_tokens: 300,
          temperature: 0.1,
          response_format: { type: "json_object" }
        })

        const respuesta = completion.choices[0].message.content
        if (respuesta) {
          const clasificacion = JSON.parse(respuesta)
          console.log(`[BUZON-AI] Resultado IA PDF: ${clasificacion.tipo} (${clasificacion.confianza}%) - ${clasificacion.razon}`)
          
          return {
            tipo: clasificacion.tipo as TipoComprobante,
            confianza: Math.min(100, Math.max(0, clasificacion.confianza || 50)),
            metadatos: { 
              razon: clasificacion.razon,
              clasificadoPorIA: true,
              tipoArchivo: 'pdf'
            }
          }
        }
        
      } else {
        // Para imágenes, usar Vision API como antes
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `Eres un clasificador especializado en documentos financieros argentinos. 
              Analiza la imagen y determina qué tipo de comprobante es:
              
              - servicio: Facturas y comprobantes de pago de servicios públicos (Metrogas, Edenor, Edelap, Naturgy, Telecom, Claro, Movistar, Personal, AYSA, ABA, etc.) o privados (Netflix, Spotify, etc.)
              - transferencia: Comprobantes de transferencias bancarias entre cuentas
              - ticket: Tickets de compra de supermercados, farmacias, comercios
              - resumen_tarjeta: Resúmenes mensuales de tarjetas de crédito
              - desconocido: Si no puedes determinar el tipo claramente
              
              IMPORTANTE: Si ves logos de empresas de servicios (gas, electricidad, telecomunicaciones) o conceptos como "CUOTA", "VENCIMIENTO", "PAGO DE SERVICIO", clasifica como "servicio".
              
              Responde en JSON con: {"tipo": "...", "confianza": numero_0_100, "razon": "explicacion_detallada"}`
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Clasifica este documento. El nombre del archivo es: "${nombreArchivo}"`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${contenidoBase64}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 300,
          temperature: 0.1,
          response_format: { type: "json_object" }
        })

        const respuesta = completion.choices[0].message.content
        if (respuesta) {
          const clasificacion = JSON.parse(respuesta)
          console.log(`[BUZON-AI] Resultado IA imagen: ${clasificacion.tipo} (${clasificacion.confianza}%) - ${clasificacion.razon}`)
          
          return {
            tipo: clasificacion.tipo as TipoComprobante,
            confianza: Math.min(100, Math.max(0, clasificacion.confianza || 50)),
            metadatos: { 
              razon: clasificacion.razon,
              clasificadoPorIA: true,
              tipoArchivo: 'imagen'
            }
          }
        }
      }
    } catch (error) {
      console.error("[BUZON-AI] Error en clasificación con OpenAI:", error)
    }
  }

  // Fallback: análisis más detallado del nombre
  if (nombreLower.includes('pago') || nombreLower.includes('factura')) {
    return { tipo: TIPOS_COMPROBANTES.SERVICIO, confianza: 60 }
  }
  
  if (nombreLower.includes('comprobante')) {
    return { tipo: TIPOS_COMPROBANTES.TRANSFERENCIA, confianza: 50 }
  }

  // Último fallback
  return { 
    tipo: TIPOS_COMPROBANTES.DESCONOCIDO, 
    confianza: 30,
    metadatos: { razon: 'No se pudo determinar el tipo' }
  }
}

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

// Función para extraer texto de PDF usando parsing básico
function extraerTextoPDF(contenidoBase64: string): string {
  try {
    // Remover el prefijo data:...;base64, si existe
    const base64Data = contenidoBase64.includes(',') ? contenidoBase64.split(',')[1] : contenidoBase64
    const buffer = Buffer.from(base64Data, 'base64')
    
    // Conversión básica de PDF a texto (para PDFs simples)
    const pdfString = buffer.toString('latin1')
    
    // Buscar texto entre objetos de PDF (muy básico)
    const textMatches = pdfString.match(/\(([^)]+)\)/g) || []
    const extractedText = textMatches
      .map(match => match.slice(1, -1)) // Remover paréntesis
      .filter(text => text.length > 2) // Filtrar texto muy corto
      .join(' ')
    
    // También buscar texto directo (sin paréntesis)
    const directTextMatches = pdfString.match(/[A-Za-z0-9\s$.,:-]{10,}/g) || []
    const combinedText = (extractedText + ' ' + directTextMatches.join(' '))
      .replace(/[^\w\s$.,:-]/g, ' ') // Limpiar caracteres especiales
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim()
    
    return combinedText
  } catch (error) {
    console.error('[BUZON] Error extrayendo texto de PDF:', error)
    return ''
  }
}

// Función para validar formato de archivo
function validarArchivo(archivo: any): { valido: boolean, error?: string } {
  if (!archivo.contenido) {
    return { valido: false, error: "Contenido faltante" }
  }

  if (!archivo.nombre) {
    return { valido: false, error: "Nombre faltante" }
  }

  // Validar tamaño (máximo 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (archivo.tamaño && archivo.tamaño > maxSize) {
    return { valido: false, error: "Archivo demasiado grande (máximo 10MB)" }
  }

  // Validar formato base64
  try {
    const base64Data = archivo.contenido.split(",")[1]
    if (!base64Data) {
      return { valido: false, error: "Formato base64 inválido" }
    }
  } catch {
    return { valido: false, error: "Error al procesar contenido" }
  }

  return { valido: true }
}

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

    // Obtener archivos de la solicitud
    const { archivos } = await request.json()
    
    if (!archivos || !Array.isArray(archivos) || archivos.length === 0) {
      return NextResponse.json(
        { error: "Se requiere al menos un archivo" },
        { status: 400 }
      )
    }

    // Límite de archivos por lote
    if (archivos.length > 20) {
      return NextResponse.json(
        { error: "Máximo 20 archivos por lote" },
        { status: 400 }
      )
    }

    console.log(`[BUZON] Procesando ${archivos.length} archivos para usuario ${userId}`)

    const resultado: ResultadoProcesamiento = {
      exitosos: [],
      fallidos: [],
      estadisticas: {
        total: archivos.length,
        exitosos: 0,
        fallidos: 0,
        tiposDetectados: {
          [TIPOS_COMPROBANTES.TRANSFERENCIA]: 0,
          [TIPOS_COMPROBANTES.TICKET]: 0,
          [TIPOS_COMPROBANTES.SERVICIO]: 0,
          [TIPOS_COMPROBANTES.RESUMEN_TARJETA]: 0,
          [TIPOS_COMPROBANTES.DESCONOCIDO]: 0
        }
      }
    }

    // Procesar cada archivo
    for (let i = 0; i < archivos.length; i++) {
      const archivo = archivos[i]
      
      try {
        // Validar archivo
        const validacion = validarArchivo(archivo)
        if (!validacion.valido) {
          resultado.fallidos.push({
            nombre: archivo.nombre || `Archivo ${i + 1}`,
            error: validacion.error || "Error de validación"
          })
          continue
        }

        // Extraer contenido base64
        const base64Data = archivo.contenido.split(",")[1]
        
        // Clasificar automáticamente
        const clasificacion = await clasificarComprobante(base64Data, archivo.nombre)
        
        // Crear registro en BD (ComprobantePendiente) con retry
        const comprobantePendiente = await executeWithRetry(async () => {
          return await prisma.comprobantePendiente.create({
            data: {
              userId: userId,
              nombreArchivo: archivo.nombre,
              tipoDetectado: clasificacion.tipo,
              confianzaClasificacion: clasificacion.confianza,
              contenidoBase64: base64Data,
              tamaño: archivo.tamaño,
              metadatos: {
                tipoArchivo: archivo.tipo,
                fechaClasificacion: new Date().toISOString(),
                versionClasificador: 'v1.0'
              }
            }
          })
        }, 3, 2000) // 3 intentos, 2 segundos base de delay

        const archivoClasificado: ArchivoClasificado = {
          archivoId: comprobantePendiente.id,
          nombre: archivo.nombre,
          tipo: clasificacion.tipo,
          contenidoBase64: base64Data,
          tamaño: archivo.tamaño,
          confianza: clasificacion.confianza,
          metadatos: clasificacion.metadatos
        }

        resultado.exitosos.push(archivoClasificado)
        resultado.estadisticas.tiposDetectados[clasificacion.tipo]++
        
        console.log(`[BUZON] Archivo ${archivo.nombre} clasificado como ${clasificacion.tipo} (${clasificacion.confianza}% confianza)`)

      } catch (error) {
        console.error(`[BUZON] Error procesando archivo ${archivo.nombre}:`, error)
        resultado.fallidos.push({
          nombre: archivo.nombre || `Archivo ${i + 1}`,
          error: "Error interno de procesamiento"
        })
      }
    }

    // Actualizar estadísticas
    resultado.estadisticas.exitosos = resultado.exitosos.length
    resultado.estadisticas.fallidos = resultado.fallidos.length

    console.log(`[BUZON] Procesamiento completado: ${resultado.estadisticas.exitosos} exitosos, ${resultado.estadisticas.fallidos} fallidos`)

    return NextResponse.json(resultado)

  } catch (error) {
    console.error("Error en upload del buzón:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
} 
