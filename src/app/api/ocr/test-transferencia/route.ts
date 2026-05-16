import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Función auxiliar para detectar el tipo de archivo desde base64
function detectarTipoArchivo(contenidoBase64: string): 'pdf' | 'imagen' {
  try {
    // Convertir base64 a buffer para leer los primeros bytes
    const buffer = Buffer.from(contenidoBase64, 'base64')
    
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
    console.error('[OCR] Error detectando tipo de archivo:', error)
    return 'imagen' // Fallback seguro
  }
}

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
  const session = await getServerSession(options)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const { imagen, nombreArchivo } = await request.json()

    if (!imagen) {
      return NextResponse.json({ error: 'Imagen requerida' }, { status: 400 })
    }

    console.log(`[OCR-TRANSFERENCIA] Procesando: ${nombreArchivo}`)

    // Detectar tipo de archivo
    const tipoArchivo = detectarTipoArchivo(imagen)
    console.log(`[OCR-TRANSFERENCIA] Tipo detectado: ${tipoArchivo}`)

    const prompt = `
Analiza este comprobante de transferencia bancaria argentina y extrae TODOS los datos que puedas identificar:

DATOS A EXTRAER:
- monto: Importe transferido (solo número decimal)
- bancoEmisor: Banco que realiza la transferencia  
- bancoReceptor: Banco que recibe la transferencia
- cbuEmisor: CBU del emisor (22 dígitos)
- cbuReceptor: CBU del receptor (22 dígitos)
- concepto: Concepto de la transferencia (ej: "Varios", "Pago", etc.)
- fecha: Fecha de la operación (formato DD/MM/YYYY)
- destinatarioNombre: Nombre completo del destinatario
- numeroOperacion: Número de operación o transacción
- hora: Hora de la operación si está disponible
- cuentaOrigen: Número de cuenta origen
- alias: Alias del destinatario si está disponible

BANCOS ARGENTINOS COMUNES:
- Banco Ciudad, Banco Macro, Banco Nación, Banco Santander, BBVA, Banco Galicia

INSTRUCCIONES:
1. Extrae TODOS los datos que veas, aunque no estén en la lista
2. Si no encuentras algún dato, ponlo como null
3. Busca montos con formato argentino: $140.352,00
4. Identifica CBUs completos (22 dígitos)
5. Extrae nombres y apellidos completos

Responde SOLO con JSON válido sin markdown:
{
  "monto": number,
  "bancoEmisor": "string",
  "bancoReceptor": "string", 
  "cbuEmisor": "string",
  "cbuReceptor": "string",
  "concepto": "string",
  "fecha": "string",
  "destinatarioNombre": "string",
  "numeroOperacion": "string",
  "hora": "string",
  "cuentaOrigen": "string",
  "alias": "string"
}
    `

    let response
    
    if (tipoArchivo === 'pdf') {
      console.log('[OCR-TRANSFERENCIA] 🔄 Procesando PDF con GPT-4o...')
      
      // Para PDFs, usar GPT-4o base (no Vision)
      response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${imagen}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      })
    } else {
      console.log('[OCR-TRANSFERENCIA] 🔄 Procesando imagen con GPT-4o Vision...')
      
      // Para imágenes, usar GPT-4o Vision
      response = await openai.chat.completions.create({
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
        max_tokens: 1000,
        temperature: 0.1,
      })
    }

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No se pudo extraer información de la transferencia')
    }

    console.log(`[OCR-TRANSFERENCIA] Respuesta: ${content}`)

    const datosExtraidos = extraerJSON(content)

    return NextResponse.json({
      nombreArchivo,
      datosExtraidos,
      respuestaCompleta: content,
      tipoArchivo
    })

  } catch (error) {
    console.error('[OCR-TRANSFERENCIA] Error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
} 