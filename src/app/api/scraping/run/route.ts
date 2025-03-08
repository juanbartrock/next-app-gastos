import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { options } from '@/app/api/auth/[...nextauth]/options';
import prisma from '@/lib/prisma';
import { runScraper, runAllScrapers, ScraperOptions } from '@/scraping';

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
    const { serviceName, options: scraperOptions } = data as {
      serviceName?: string;
      options?: ScraperOptions;
    };
    
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