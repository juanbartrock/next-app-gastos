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

// Función para calcular el total automáticamente y validar datos
function validarYCalcularTotal(datos: any) {
  try {
    // Asegurar que productos sea un array
    if (!Array.isArray(datos.productos)) {
      datos.productos = []
    }

    // Calcular el total sumando todos los productos
    let totalCalculado = 0
    const productosValidados = datos.productos.map((producto: any) => {
      // Validar y limpiar cada producto
      const productoLimpio = {
        descripcion: producto.descripcion || "Producto sin descripción",
        cantidad: Number(producto.cantidad) || 1,
        precioUnitario: producto.precioUnitario ? Number(producto.precioUnitario) : undefined,
        subtotal: Number(producto.subtotal) || 0
      }

      // Si hay precio unitario pero no subtotal, calcularlo
      if (productoLimpio.precioUnitario && !productoLimpio.subtotal) {
        productoLimpio.subtotal = productoLimpio.cantidad * productoLimpio.precioUnitario
      }

      // Si hay subtotal pero no precio unitario, calcularlo
      if (productoLimpio.subtotal && !productoLimpio.precioUnitario && productoLimpio.cantidad > 0) {
        productoLimpio.precioUnitario = productoLimpio.subtotal / productoLimpio.cantidad
      }

      // Sumar al total calculado
      totalCalculado += productoLimpio.subtotal

      return productoLimpio
    })

    // Validar el total del ticket vs el total calculado
    const totalTicket = Number(datos.total) || 0
    const diferencia = Math.abs(totalTicket - totalCalculado)
    const tolerancia = 0.01 // Tolerancia de 1 centavo

    let totalFinal = totalCalculado
    let notaValidacion = ""

    if (totalTicket > 0) {
      if (diferencia <= tolerancia) {
        // Los totales coinciden, usar el del ticket
        totalFinal = totalTicket
        notaValidacion = "Total validado correctamente"
      } else {
        // Los totales no coinciden, usar el calculado
        totalFinal = totalCalculado
        notaValidacion = `Total recalculado automáticamente. Diferencia detectada: ${diferencia.toFixed(2)}`
      }
    } else {
      // No hay total en el ticket, usar el calculado
      totalFinal = totalCalculado
      notaValidacion = "Total calculado automáticamente (no detectado en ticket)"
    }

    console.log(`[VALIDACIÓN OCR] Total ticket: ${totalTicket}, Total calculado: ${totalCalculado}, Total final: ${totalFinal}`)
    console.log(`[VALIDACIÓN OCR] ${notaValidacion}`)

    return {
      ...datos,
      productos: productosValidados,
      total: totalFinal,
      totalOriginalTicket: totalTicket > 0 ? totalTicket : undefined,
      totalCalculadoProductos: totalCalculado,
      notaValidacion: notaValidacion,
      cantidadProductos: productosValidados.length
    }
  } catch (error) {
    console.error("Error en validación de datos OCR:", error)
    
    // En caso de error, devolver datos básicos
    return {
      ...datos,
      total: datos.total || 0,
      productos: datos.productos || [],
      notaValidacion: "Error en validación, usando datos originales"
    }
  }
}

// Función para generar datos de ejemplo si falla OpenAI
function generarDatosEjemplo() {
  const productosEjemplo = [
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
  ]

  const totalEjemplo = productosEjemplo.reduce((sum, prod) => sum + prod.subtotal, 0)

  return {
    nombreComercio: "Supermercado Demo",
    fecha: new Date().toISOString(),
    total: totalEjemplo,
    productos: productosEjemplo,
    esDatoEjemplo: true,
    notaValidacion: "Datos de ejemplo - Total calculado automáticamente"
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
            content: "Eres un asistente especializado en extraer información detallada de tickets de compra. Analiza la imagen y extrae toda la información posible en un formato estructurado. Es muy importante que extraigas TODOS los productos visibles con sus precios exactos."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extrae la siguiente información de este ticket de compra y devuélvela en formato JSON con los siguientes campos: nombreComercio, fecha (en formato ISO), total (si está visible), y un array de productos con sus detalles (descripcion, cantidad, precioUnitario si está disponible, y subtotal). Es crucial que extraigas TODOS los productos listados en el ticket con sus precios exactos. Si no encuentras el total general, déjalo en 0 - será calculado automáticamente."
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
        temperature: 0.1, // Reducir temperatura para mayor precisión
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
        
        // Validar y calcular total automáticamente
        const datosValidados = validarYCalcularTotal(datos)
        
        console.log(`[OCR SUCCESS] Procesado ticket con ${datosValidados.cantidadProductos} productos. Total: ${datosValidados.total}`)
        
        return NextResponse.json(datosValidados)
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