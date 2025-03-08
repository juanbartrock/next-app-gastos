import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { options } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'
import OpenAI from 'openai'

// Inicializar cliente de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Función para analizar los gastos recurrentes y servicios del usuario
async function analizarGastosRecurrentes(userId: string) {
  try {
    // Obtener gastos recurrentes
    const gastosRecurrentes = await prisma.gastoRecurrente.findMany({
      where: { userId },
      include: {
        categoria: true
      }
    })
    
    // Obtener servicios
    const servicios = await prisma.servicio.findMany({
      where: { userId }
    })
    
    // Combinar todo
    return {
      gastosRecurrentes: gastosRecurrentes.map(g => ({
        id: g.id,
        concepto: g.concepto,
        monto: Number(g.monto),
        periodicidad: g.periodicidad,
        categoria: g.categoria?.descripcion || 'Sin categoría'
      })),
      servicios: servicios.map(s => ({
        id: s.id,
        nombre: s.nombre,
        descripcion: s.descripcion,
        monto: Number(s.monto),
        medioPago: s.medioPago
      }))
    }
  } catch (error) {
    console.error('Error al analizar gastos recurrentes:', error)
    return null
  }
}

// Función para generar recomendaciones usando GPT-4
async function generarRecomendaciones(datos: any) {
  try {
    const prompt = `
    Eres un asesor financiero especializado en identificar oportunidades de ahorro. 
    Analiza los siguientes gastos recurrentes y servicios contratados del usuario:
    
    GASTOS RECURRENTES:
    ${JSON.stringify(datos.gastosRecurrentes, null, 2)}
    
    SERVICIOS:
    ${JSON.stringify(datos.servicios, null, 2)}
    
    Tu tarea:
    1. Identifica servicios o suscripciones que podrían tener alternativas más económicas.
    2. Para cada uno, sugiere una o más alternativas concretas (nombre real, precio estimado, características).
    3. Calcula el ahorro potencial.
    
    Estructura tu respuesta como un array JSON con el siguiente formato:
    [
      {
        "servicioOriginal": {
          "id": 123,
          "nombre": "Nombre del servicio existente",
          "monto": 1500
        },
        "titulo": "Ahorra en tu servicio de streaming",
        "descripcion": "Explicación detallada",
        "descuento": null,
        "porcentajeAhorro": 25,
        "urlOrigen": "https://ejemplo.com/promocion",
        "alternativas": [
          {
            "nombre": "Alternativa más económica",
            "descripcion": "Características y beneficios",
            "monto": 900,
            "urlOrigen": "https://ejemplo.com"
          }
        ]
      }
    ]
    
    Ten en cuenta:
    - Sólo incluye recomendaciones concretas con datos reales.
    - Proporciona URLs de ofertas reales cuando sea posible.
    - Sólo propón alternativas que ofrezcan un servicio similar con mejor precio.
    - Calcula el descuento o porcentaje de ahorro para cada recomendación.
    - Considera paquetes combinados o promociones actuales.
    
    IMPORTANTE: Responde ÚNICAMENTE con un array JSON válido. No incluyas texto explicativo fuera del JSON.`

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: prompt }
      ],
      temperature: 0.7
    })

    const content = response.choices[0].message.content || '[]'
    
    // Intentar parsear el JSON devuelto
    try {
      return JSON.parse(content)
    } catch (e) {
      console.error('Error al parsear respuesta JSON:', e)
      return []
    }
  } catch (error) {
    console.error('Error al generar recomendaciones:', error)
    return []
  }
}

// Función para guardar las recomendaciones en la base de datos
async function guardarRecomendaciones(recomendaciones: any[], userId: string) {
  try {
    for (const recomendacion of recomendaciones) {
      // Buscar el servicio original
      let servicioId = null
      if (recomendacion.servicioOriginal && recomendacion.servicioOriginal.id) {
        const servicio = await prisma.servicio.findUnique({
          where: { 
            id: recomendacion.servicioOriginal.id,
            userId // Verificar que pertenece al usuario
          }
        })
        
        if (servicio) {
          servicioId = servicio.id
        }
      }
      
      // Crear la promoción
      const promocion = await prisma.promocion.create({
        data: {
          titulo: recomendacion.titulo,
          descripcion: recomendacion.descripcion,
          urlOrigen: recomendacion.urlOrigen || null,
          descuento: recomendacion.descuento || null,
          porcentajeAhorro: recomendacion.porcentajeAhorro || null,
          fechaVencimiento: null, // No tenemos esta información
          servicioId: servicioId
        }
      })
      
      // Crear las alternativas
      if (recomendacion.alternativas && Array.isArray(recomendacion.alternativas)) {
        for (const alt of recomendacion.alternativas) {
          await prisma.servicioAlternativo.create({
            data: {
              nombre: alt.nombre,
              descripcion: alt.descripcion || null,
              monto: parseFloat(alt.monto.toString()),
              urlOrigen: alt.urlOrigen || null,
              promocionId: promocion.id
            }
          })
        }
      }
    }
    
    return true
  } catch (error) {
    console.error('Error al guardar recomendaciones:', error)
    return false
  }
}

// POST - Generar nuevas recomendaciones de ahorro
export async function POST() {
  try {
    const session = await getServerSession(options)
    
    // Verificar autenticación
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    
    // Obtener usuario
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }
    
    // Analizar gastos recurrentes
    const datos = await analizarGastosRecurrentes(usuario.id)
    
    if (!datos) {
      return NextResponse.json(
        { error: 'Error al analizar datos' },
        { status: 500 }
      )
    }
    
    // Generar recomendaciones
    const recomendaciones = await generarRecomendaciones(datos)
    
    // Guardar recomendaciones
    await guardarRecomendaciones(recomendaciones, usuario.id)
    
    // Retornar recomendaciones
    return NextResponse.json(recomendaciones)
  } catch (error) {
    console.error('Error al generar recomendaciones:', error)
    return NextResponse.json(
      { error: 'Error al generar recomendaciones de ahorro' },
      { status: 500 }
    )
  }
} 