import { NextRequest, NextResponse } from "next/server"
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

export async function POST(request: NextRequest) {
  try {
    const { imagen, nombreArchivo } = await request.json()
    
    if (!imagen) {
      return NextResponse.json({ error: 'Imagen requerida' }, { status: 400 })
    }

    console.log(`[OCR-RESUMEN] Procesando: ${nombreArchivo}`)

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
                url: `data:image/jpeg;base64,${imagen}`,
              },
            },
          ],
        },
      ],
      max_tokens: 4000, // Aumentado para resúmenes largos
      temperature: 0.1,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No se pudo extraer información del resumen')
    }

    console.log(`[OCR-RESUMEN] Respuesta: ${content}`)

    const datosExtraidos = extraerJSON(content)

    return NextResponse.json({
      nombreArchivo,
      datosExtraidos,
      respuestaCompleta: content
    })

  } catch (error) {
    console.error('[OCR-RESUMEN] Error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
} 