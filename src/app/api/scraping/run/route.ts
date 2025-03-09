import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { options } from '@/app/api/auth/[...nextauth]/options';
import prisma from '@/lib/prisma';
import { runScraper, runAllScrapers, ScraperOptions } from '@/scraping';
import fs from 'fs';
import path from 'path';

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

/**
 * API para ejecutar scrapers y guardar los resultados
 * POST /api/scraping/run
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(options);
    
    // Verificar autenticación
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    // Obtener usuario
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    // Obtener datos del request
    const data = await request.json();
    const { serviceName, options: scraperOptions, forRecommendations } = data as {
      serviceName?: string;
      options?: ScraperOptions;
      forRecommendations?: boolean;
    };
    
    // Si es para recomendaciones, solo usar los servicios habilitados para recomendaciones
    if (forRecommendations && !serviceName) {
      console.log("Ejecutando scrapers específicamente para recomendaciones");
      console.log("Parámetros recibidos:", data);
      
      const enabledForRecommendationsServices = await getEnabledForRecommendationsServices();
      console.log("Servicios habilitados encontrados:", enabledForRecommendationsServices);
      
      if (enabledForRecommendationsServices.length === 0) {
        console.log("⚠️ No se encontraron servicios habilitados para recomendaciones");
        return NextResponse.json({
          success: false,
          message: "No hay servicios habilitados para recomendaciones",
          totalPromotions: 0
        });
      }
      
      // Ejecutar solo los scrapers habilitados para recomendaciones
      const startTime = Date.now();
      const results: Record<string, any> = {};
      const errors: Record<string, any> = {};
      const allPromotions: any[] = [];
      
      for (const service of enabledForRecommendationsServices) {
        try {
          console.log(`Ejecutando scraper para recomendaciones: ${service}`);
          const result = await runScraper(service, scraperOptions);
          results[service] = result;
          allPromotions.push(...result.promotions);
        } catch (error) {
          console.error(`Error al ejecutar scraper ${service}:`, error);
          errors[service] = error instanceof Error ? error.message : String(error);
        }
      }
      
      // Guardar las promociones encontradas
      await guardarPromociones(allPromotions, usuario.id);
      
      // Preparar resumen de resultados
      const summary = Object.entries(results).map(([service, result]) => ({
        service,
        promotionsFound: result.promotions.length,
        timestamp: result.timestamp
      }));
      
      return NextResponse.json({
        success: true,
        summary,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
        totalPromotions: allPromotions.length,
        timeElapsed: Date.now() - startTime
      });
    }
    
    // Ejecución normal (sin filtro de recomendaciones)
    // Ejecutar scraper específico o todos
    const startTime = Date.now();
    let result;
    
    if (serviceName) {
      // Ejecutar un scraper específico
      result = await runScraper(serviceName, scraperOptions);
      
      // Guardar resultados en la base de datos
      await guardarPromociones(result.promotions, usuario.id);
      
      return NextResponse.json({
        success: true,
        service: serviceName,
        promotionsFound: result.promotions.length,
        timeElapsed: Date.now() - startTime
      });
    } else {
      // Ejecutar todos los scrapers
      const { results, errors, timestamp } = await runAllScrapers(scraperOptions);
      
      // Procesar y guardar resultados de todos los servicios
      const allPromotions = Object.values(results).flatMap(r => r.promotions);
      await guardarPromociones(allPromotions, usuario.id);
      
      // Preparar resumen de resultados
      const summary = Object.entries(results).map(([service, result]) => ({
        service,
        promotionsFound: result.promotions.length,
        timestamp: result.timestamp
      }));
      
      return NextResponse.json({
        success: true,
        summary,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
        totalPromotions: allPromotions.length,
        timeElapsed: Date.now() - startTime
      });
    }
  } catch (error) {
    console.error('Error al ejecutar scraper:', error);
    
    return NextResponse.json(
      { 
        error: 'Error al ejecutar scraping',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * Función auxiliar para guardar promociones en la base de datos
 */
async function guardarPromociones(promotions: any[], userId: string) {
  interface DbServicio {
    id: number;
    nombre: string;
    [key: string]: any;
  }
  
  interface DbPromocion {
    id: number;
    titulo: string;
    [key: string]: any;
  }
  
  for (const promotion of promotions) {
    try {
      // Buscar servicio asociado - usando la notación de modelo con "model"
      const servicios = await prisma.$queryRaw<DbServicio[]>`
        SELECT * FROM "Servicio" 
        WHERE "userId" = ${userId} 
        AND "nombre" ILIKE ${`%${promotion.serviceName}%`}
      `;
      
      // Usar el primer servicio encontrado, si existe
      const servicioId = servicios.length > 0 ? servicios[0].id : null;
      
      try {
        // Crear la promoción usando insertado raw
        if (servicioId) {
          // Crear la promoción
          const nuevaPromocion = await prisma.$queryRaw<DbPromocion[]>`
            INSERT INTO "Promocion" (
              "titulo", "descripcion", "urlOrigen", "descuento", 
              "porcentajeAhorro", "servicioId", "estado", 
              "fechaCreacion", "fechaActualizacion"
            ) 
            VALUES (
              ${promotion.title}, 
              ${promotion.description}, 
              ${promotion.url}, 
              ${promotion.originalPrice ? (Number(promotion.originalPrice) - Number(promotion.discountedPrice)) : null}, 
              ${promotion.discountPercentage ? Number(promotion.discountPercentage) : null},
              ${servicioId},
              'active',
              NOW(),
              NOW()
            )
            RETURNING *
          `;
          
          // Si se creó la promoción, crear la alternativa
          if (nuevaPromocion && nuevaPromocion.length > 0) {
            await prisma.$queryRaw`
              INSERT INTO "ServicioAlternativo" (
                "nombre", "descripcion", "monto", "urlOrigen", 
                "promocionId", "fechaCreacion", "fechaActualizacion"
              )
              VALUES (
                ${promotion.title},
                ${promotion.description},
                ${Number(promotion.discountedPrice)},
                ${promotion.url},
                ${nuevaPromocion[0].id},
                NOW(),
                NOW()
              )
            `;
          }
        }
      } catch (error) {
        console.error('Error al crear promoción:', error);
        // Continuar con la siguiente promoción
      }
    } catch (error) {
      console.error('Error al buscar servicio:', error);
      // Continuar con la siguiente promoción
    }
  }
} 