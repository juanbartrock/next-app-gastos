import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { options } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'
import OpenAI from 'openai'
import { runScraper, runAllScrapers, ScraperOptions } from '@/scraping'
import fs from 'fs'
import path from 'path'

// Inicializar cliente de OpenAI solo si la API key está disponible
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== "") {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Definir el tipo de las promociones
interface PromocionAlternativa {
  nombre: string;
  descripcion?: string;
  monto: number;
  urlOrigen?: string;
}

interface Promocion {
  servicioOriginal?: {
    id: number;
    nombre: string;
    monto: number;
  } | null;
  titulo: string;
  descripcion: string;
  urlOrigen?: string;
  descuento?: number | null;
  porcentajeAhorro?: number | null;
  alternativas: PromocionAlternativa[];
}

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
      gastosRecurrentes: gastosRecurrentes.map((g: any) => ({
        id: g.id,
        concepto: g.concepto,
        monto: Number(g.monto),
        periodicidad: g.periodicidad,
        categoria: g.categoria?.descripcion || 'Sin categoría'
      })),
      servicios: servicios.map((s: any) => ({
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
    // Verificar si OpenAI está disponible
    if (!openai) {
      console.log('OpenAI no configurado, devolviendo recomendaciones vacías');
      return [];
    }

    const prompt = `
    Eres un asesor financiero especializado en identificar oportunidades de ahorro. 
    Analiza los siguientes gastos recurrentes y servicios contratados del usuario:
    
    GASTOS RECURRENTES:
    ${JSON.stringify(datos.gastosRecurrentes, null, 2)}
    
    SERVICIOS:
    ${JSON.stringify(datos.servicios, null, 2)}
    
    Tu tarea:
    1. PRIORIDAD MÁXIMA: Identifica servicios con costos EXCESIVOS o ANORMALMENTE ALTOS. Por ejemplo, si hay servicios de telefonía móvil con costos superiores a $20,000, internet superiores a $20,000, o cualquier servicio que parezca tener un costo desproporcionado.
    2. Para cada servicio identificado como excesivo, sugiere alternativas concretas y específicas con precios significativamente menores.
    3. También identifica otros servicios o suscripciones que podrían tener alternativas más económicas, aunque su costo no sea excesivo.
    4. Para cada uno, sugiere una o más alternativas concretas (nombre real, precio estimado, características).
    5. Calcula el ahorro potencial y prioriza las recomendaciones de mayor ahorro.
    
    NOTA IMPORTANTE: Presta especial atención a servicios como telefonía móvil, internet, streaming, o cualquier servicio con montos anormalmente altos. Si un servicio de telefonía móvil cuesta más de $15,000-$20,000, definitivamente es excesivo y debe ser la primera recomendación.
    
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
    - PRIORIZA servicios con costos excesivos o desproporcionados primero.
    - Sé muy específico con las alternativas, ofreciendo nombres reales de compañías y planes.
    - Para telefonía móvil, considera planes de Claro, Personal y Movistar.
    - Para internet, considera planes de Fibertel, Telecentro y Movistar.
    - Para streaming, considera planes compartidos o básicos de Netflix, Disney+, HBO Max, etc.
    - Proporciona URLs de ofertas reales cuando sea posible.
    - Sólo propón alternativas que ofrezcan un servicio similar con mejor precio.
    - Calcula el descuento o porcentaje de ahorro para cada recomendación.
    - Considera paquetes combinados o promociones actuales.
    - Asegúrate de que TODOS los servicios con costos anormalmente altos estén incluidos en tus recomendaciones.
    
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

// Función para obtener los servicios habilitados para recomendaciones
async function getEnabledForRecommendationsServices(): Promise<string[]> {
  try {
    // Leer el archivo de configuración en tiempo de ejecución
    const configFilePath = path.join(process.cwd(), 'src', 'scraping', 'config', 'services.config.ts');
    const configContent = fs.readFileSync(configFilePath, 'utf8');
    
    console.log("======= DEPURACIÓN DE RECOMENDACIONES =======");
    console.log("Leyendo configuración de scrapers para recomendaciones");
    
    // Método simplificado: buscar líneas individuales con useForRecommendations: true
    const enabledServices: string[] = [];
    const lines = configContent.split('\n');
    
    // Primero, encontrar todos los nombres de servicios
    const serviceNames: string[] = [];
    const serviceStartRegex = /(\w+):\s*{/g;
    let match;
    
    while ((match = serviceStartRegex.exec(configContent)) !== null) {
      serviceNames.push(match[1]);
    }
    
    console.log("Servicios encontrados en el archivo:", serviceNames);
    
    // Para cada servicio, verificar si tiene useForRecommendations: true
    for (const serviceName of serviceNames) {
      // Buscar la sección del servicio
      const serviceStartIndex = configContent.indexOf(`${serviceName}: {`);
      if (serviceStartIndex === -1) continue;
      
      // Buscar el final de la sección (la siguiente llave de cierre)
      const serviceEndIndex = configContent.indexOf('},', serviceStartIndex);
      if (serviceEndIndex === -1) continue;
      
      // Extraer la sección del servicio
      const serviceSection = configContent.substring(serviceStartIndex, serviceEndIndex);
      console.log(`Analizando configuración de ${serviceName}:`, serviceSection);
      
      // Verificar si tiene useForRecommendations: true
      if (serviceSection.includes('useForRecommendations: true')) {
        enabledServices.push(serviceName);
        console.log(`✅ ${serviceName} está habilitado para recomendaciones`);
      } else {
        console.log(`❌ ${serviceName} NO está habilitado para recomendaciones`);
      }
    }
    
    console.log("Servicios habilitados para recomendaciones:", enabledServices);
    console.log("============================================");
    
    return enabledServices;
  } catch (error) {
    console.error("Error al obtener servicios habilitados para recomendaciones:", error);
    return [];
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
    
    // Obtener de manera dinámica los servicios habilitados para recomendaciones
    const enabledForRecommendationsServices = await getEnabledForRecommendationsServices();
    
    // Ejecutar scrapers habilitados para recomendaciones
    console.log("Ejecutando scrapers para recomendaciones");
    console.log("Servicios habilitados para recomendaciones:", enabledForRecommendationsServices);
    
    let promocionesFromScraping: Promocion[] = [];
    
    if (enabledForRecommendationsServices.length > 0) {
      // Ejecutar los scrapers habilitados para recomendaciones
      for (const serviceName of enabledForRecommendationsServices) {
        try {
          console.log(`Ejecutando scraper para ${serviceName}...`);
          const result = await runScraper(serviceName);
          
          if (result.promotions.length > 0) {
            console.log(`Se encontraron ${result.promotions.length} promociones para ${serviceName}`);
            // Adaptar las promociones al formato esperado
            const promotionsFormatted = result.promotions.map(promo => {
              // Buscar si hay un servicio similar en los datos del usuario
              const matchingService = datos.servicios.find((s: any) => 
                s.nombre.toLowerCase().includes(serviceName.toLowerCase()) ||
                serviceName.toLowerCase().includes(s.nombre.toLowerCase())
              );
              
              return {
                servicioOriginal: matchingService ? {
                  id: matchingService.id,
                  nombre: matchingService.nombre,
                  monto: matchingService.monto
                } : null,
                titulo: promo.title,
                descripcion: promo.description,
                urlOrigen: promo.url,
                descuento: promo.originalPrice ? (promo.originalPrice - promo.discountedPrice) : null,
                porcentajeAhorro: promo.discountPercentage,
                alternativas: [
                  {
                    nombre: promo.title,
                    descripcion: promo.description,
                    monto: promo.discountedPrice,
                    urlOrigen: promo.url
                  }
                ]
              };
            });
            
            promocionesFromScraping = [...promocionesFromScraping, ...promotionsFormatted];
          }
        } catch (error) {
          console.error(`Error al ejecutar scraper para ${serviceName}:`, error);
        }
      }
    }
    
    // Generar recomendaciones mediante IA
    const recomendaciones = await generarRecomendaciones(datos)
    
    // Combinar las recomendaciones de IA con las del scraping
    const recomendacionesCombinadas = [...recomendaciones, ...promocionesFromScraping];
    
    // Guardar todas las recomendaciones
    await guardarRecomendaciones(recomendacionesCombinadas, usuario.id)
    
    // Retornar recomendaciones
    return NextResponse.json(recomendacionesCombinadas)
  } catch (error) {
    console.error('Error al generar recomendaciones:', error)
    return NextResponse.json(
      { error: 'Error al generar recomendaciones de ahorro' },
      { status: 500 }
    )
  }
} 