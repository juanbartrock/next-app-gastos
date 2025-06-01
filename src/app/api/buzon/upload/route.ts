import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"
import OpenAI from "openai"
import prisma from "@/lib/prisma"

// Configurar cliente de OpenAI
let openai: OpenAI | null = null
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== "") {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
}

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
  
  // Clasificación inicial por nombre de archivo
  const nombreLower = nombreArchivo.toLowerCase()
  
  // Patrones para identificación rápida
  if (nombreLower.includes('transferencia') || nombreLower.includes('comprobante')) {
    return { tipo: TIPOS_COMPROBANTES.TRANSFERENCIA, confianza: 80 }
  }
  
  if (nombreLower.includes('ticket') || nombreLower.includes('recibo') || nombreLower.includes('compra')) {
    return { tipo: TIPOS_COMPROBANTES.TICKET, confianza: 70 }
  }
  
  if (nombreLower.includes('servicio') || nombreLower.includes('factura')) {
    return { tipo: TIPOS_COMPROBANTES.SERVICIO, confianza: 75 }
  }
  
  if (nombreLower.includes('resumen') || nombreLower.includes('tarjeta')) {
    return { tipo: TIPOS_COMPROBANTES.RESUMEN_TARJETA, confianza: 80 }
  }

  // Si OpenAI está disponible, usar clasificación inteligente
  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Modelo más rápido para clasificación
        messages: [
          {
            role: "system",
            content: `Eres un clasificador especializado en documentos financieros argentinos. 
            Analiza la imagen y determina qué tipo de comprobante es:
            - transferencia: Comprobantes de transferencias bancarias (Banco Ciudad, Macro, etc.)
            - ticket: Tickets de compra de supermercados/comercios
            - servicio: Facturas de servicios (luz, gas, agua, internet, etc.)
            - resumen_tarjeta: Resúmenes de tarjetas de crédito
            - desconocido: Si no puedes determinar el tipo
            
            Responde en JSON con: {"tipo": "...", "confianza": numero_0_100, "razon": "explicacion"}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Clasifica este documento financiero:"
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
        max_tokens: 200,
        temperature: 0.1,
        response_format: { type: "json_object" }
      })

      const respuesta = completion.choices[0].message.content
      if (respuesta) {
        const clasificacion = JSON.parse(respuesta)
        return {
          tipo: clasificacion.tipo as TipoComprobante,
          confianza: Math.min(100, Math.max(0, clasificacion.confianza || 50)),
          metadatos: { razon: clasificacion.razon }
        }
      }
    } catch (error) {
      console.error("Error en clasificación con OpenAI:", error)
    }
  }

  // Fallback: clasificación por defecto
  return { tipo: TIPOS_COMPROBANTES.DESCONOCIDO, confianza: 30 }
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
        
        // Crear registro en BD (ComprobantePendiente)
        const comprobantePendiente = await prisma.comprobantePendiente.create({
          data: {
            userId: userId,
            nombreArchivo: archivo.nombre,
            tipoDetectado: clasificacion.tipo,
            confianzaClasificacion: clasificacion.confianza,
            contenidoBase64: base64Data,
            tamaño: archivo.tamaño || 0,
            metadatos: clasificacion.metadatos || {},
            estado: 'pendiente',
            fechaSubida: new Date()
          }
        })

        const archivoClasificado: ArchivoClasificado = {
          archivoId: comprobantePendiente.id,
          nombre: archivo.nombre,
          tipo: clasificacion.tipo,
          contenidoBase64: base64Data,
          tamaño: archivo.tamaño || 0,
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