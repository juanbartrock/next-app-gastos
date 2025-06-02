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

    console.log(`[OCR-SERVICIO] Procesando: ${nombreArchivo}`)

    const prompt = `
Analiza este comprobante de pago de servicio argentino y extrae TODOS los datos que puedas identificar:

DATOS A EXTRAER:
- importe: Monto a pagar (solo número, sin símbolos)
- entidad: Empresa del servicio (Edenor, Metrogas, etc.)
- concepto: Tipo de servicio (Electricidad, Gas Natural, etc.)
- fechaPago: Fecha de pago o vencimiento
- fechaVencimiento: Fecha límite de pago
- codigoLinkPagos: Código de pago Link Pagos si existe
- numeroReferencia: Número de referencia o comprobante
- numeroCliente: Número de cliente
- numeroMedidor: Número de medidor
- consumo: Consumo registrado (kWh, m3, etc.)
- periodo: Período facturado
- proximoVencimiento: Próxima fecha de vencimiento

CONTEXTO ESPECÍFICO ARGENTINO:
- EDENOR: empresa de electricidad, busca "CUOTA", "ELECTRICIDAD", "kWh"
- METROGAS: empresa de gas, busca "GAS NATURAL", "m3"
- Telecom, Claro, Personal, Movistar: servicios de telefonía
- Montos argentinos: formato $15.259,07 (punto para miles, coma para decimales)
- Fechas argentinas: DD/MM/YYYY
- Códigos de pago: números largos para Link Pagos o PagoMisCuentas

INSTRUCCIONES:
1. Si ves "EDENOR" → entidad: "Edenor", concepto: "Electricidad"
2. Si ves "METROGAS" → entidad: "Metrogas", concepto: "Gas Natural"  
3. Busca el importe más grande que aparezca (puede estar como CUOTA, TOTAL, IMPORTE)
4. Extrae fechas en formato DD/MM/YYYY
5. Extrae TODOS los números y códigos que veas
6. Si no encuentras algún dato, ponlo como null

Responde SOLO con JSON válido sin markdown:
{
  "importe": number,
  "entidad": "string",
  "concepto": "string", 
  "fechaPago": "string",
  "fechaVencimiento": "string",
  "codigoLinkPagos": "string",
  "numeroReferencia": "string",
  "numeroCliente": "string",
  "numeroMedidor": "string",
  "consumo": "string",
  "periodo": "string",
  "proximoVencimiento": "string"
}
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
      max_tokens: 1000,
      temperature: 0.1,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No se pudo extraer información del servicio')
    }

    console.log(`[OCR-SERVICIO] Respuesta: ${content}`)

    const datosExtraidos = extraerJSON(content)

    return NextResponse.json({
      nombreArchivo,
      datosExtraidos,
      respuestaCompleta: content
    })

  } catch (error) {
    console.error('[OCR-SERVICIO] Error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
} 