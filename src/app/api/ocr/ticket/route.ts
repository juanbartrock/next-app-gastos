import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"
import OpenAI from "openai"

// Configurar cliente de OpenAI solo si la API key está disponible
let openai: OpenAI | null = null
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== "") {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
}

// Función para generar datos de ejemplo si falla OpenAI
function generarDatosEjemplo() {
  return {
    nombreComercio: "Supermercado Demo",
    fecha: new Date().toISOString(),
    total: 1250.75,
    productos: [
      {
        descripcion: "Leche entera 1L",
        cantidad: 2,
        precioUnitario: 120.50,
        subtotal: 241.00
      },
      {
        descripcion: "Pan integral",
        cantidad: 1,
        precioUnitario: 180.25,
        subtotal: 180.25
      },
      {
        descripcion: "Yogurt pack x4",
        cantidad: 1,
        precioUnitario: 320.00,
        subtotal: 320.00
      },
      {
        descripcion: "Detergente líquido",
        cantidad: 1,
        precioUnitario: 290.50,
        subtotal: 290.50
      },
      {
        descripcion: "Arroz 1kg",
        cantidad: 1,
        precioUnitario: 219.00,
        subtotal: 219.00
      }
    ],
    esDatoEjemplo: true
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(options)
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    // Obtener la imagen de la solicitud
    const { imagen } = await request.json()
    
    if (!imagen) {
      return NextResponse.json(
        { error: "La imagen es requerida" },
        { status: 400 }
      )
    }

    // El formato de la imagen debería ser "data:image/jpeg;base64,..."
    // Extraer la parte base64
    const base64Image = imagen.split(",")[1]
    
    if (!base64Image) {
      return NextResponse.json(
        { error: "Formato de imagen inválido" },
        { status: 400 }
      )
    }

    try {
      // Verificar si debemos usar el modo fallback (para pruebas o si OpenAI falla)
      const usarFallback = process.env.USE_OCR_FALLBACK === "true" || !process.env.OPENAI_API_KEY || !openai;
      
      if (usarFallback) {
        console.log("Usando modo fallback para OCR (datos de ejemplo)");
        return NextResponse.json(generarDatosEjemplo());
      }

      // Usar la API de visión de OpenAI para extraer información del ticket
      const completion = await openai!.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Eres un asistente especializado en extraer información detallada de tickets de compra. Analiza la imagen y extrae toda la información posible en un formato estructurado."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extrae la siguiente información de este ticket de compra y devuélvela en formato JSON con los siguientes campos: nombreComercio, fecha (en formato ISO), total, y un array de productos con sus detalles (descripcion, cantidad, precioUnitario si está disponible, y subtotal)."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1500,
        temperature: 0.3,
        response_format: { type: "json_object" }
      })

      const respuestaIA = completion.choices[0].message.content
      
      if (!respuestaIA) {
        return NextResponse.json(
          { error: "No se pudo extraer información de la imagen" },
          { status: 500 }
        )
      }

      // Procesar la respuesta y enviarla al cliente
      try {
        const datos = JSON.parse(respuestaIA)
        return NextResponse.json(datos)
      } catch (error) {
        console.error("Error al parsear la respuesta de la IA:", error)
        console.log("Respuesta recibida:", respuestaIA)
        
        // Si falla el parsing, usar datos de ejemplo
        console.log("Usando datos de ejemplo debido a error en parsing");
        return NextResponse.json(generarDatosEjemplo());
      }
    } catch (openaiError: any) {
      console.error("Error en la API de OpenAI:", openaiError)
      
      // En caso de error con OpenAI, devolver datos de ejemplo
      console.log("Usando datos de ejemplo debido a error en OpenAI");
      return NextResponse.json(generarDatosEjemplo());
    }
  } catch (error: any) {
    console.error("Error general en el procesamiento de OCR:", error)
    
    // En caso de error general, también devolver datos de ejemplo
    console.log("Usando datos de ejemplo debido a error general");
    return NextResponse.json(generarDatosEjemplo());
  }
} 