/**
 * Servicio de scraping para El Mejor Trato
 * 
 * Este servicio maneja la extracción de diferentes tipos de productos:
 * - Servicios tradicionales (internet, TV, telefonía)
 * - Obras sociales y prepagas
 * - Planes de ahorro (y preparado para futuras inversiones)
 */
import { ScraperService, ScraperResult, ScraperOptions, ScraperError } from '../../types';
import { parseElMejorTrato } from './parser';
import { setupBrowser, withRetries } from '../../lib/browser';
import { serviceConfig } from '../../config/services.config';

// Configuración específica para El Mejor Trato
const serviceName = 'elmejortrato';
const config = serviceConfig[serviceName];
const serviceUrl = config.url;

// URLs específicas para el scraping (definidas en la configuración)
const scrapingUrls = config.scrapingUrls;

/**
 * Función principal que ejecuta el scraping
 */
async function run(options?: ScraperOptions): Promise<ScraperResult> {
  const timestamp = new Date();
  
  try {
    // Usar función de reintentos para mejorar la robustez
    return await withRetries(async () => {
      // Configurar navegador headless
      const browser = await setupBrowser(options);
      
      try {
        const allPromotions: any[] = [];
        const metadata: Record<string, any> = {
          urls: scrapingUrls,
          sectionCounts: {}
        };
        
        // Visitar cada URL y ejecutar el scraping
        for (const url of scrapingUrls) {
          // Navegar a la URL
          const page = await browser.newPage();
          await page.goto(url, { waitUntil: 'networkidle2' });
          
          // Esperar a que cargue el contenido y hacer scroll para cargar lazy content
          await page.evaluate(() => {
            return new Promise<void>((resolve) => {
              let totalHeight = 0;
              const distance = 100;
              const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                
                if (totalHeight >= scrollHeight) {
                  clearInterval(timer);
                  resolve();
                }
              }, 100);
            });
          });
          
          // Esperar un poco más para cargar contenido dinámico
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Obtener el contenido HTML
          const content = await page.content();
          
          // Identificar el tipo de sección para los metadatos
          let sectionType = 'general';
          if (url.includes('/servicios/')) {
            sectionType = url.split('/servicios/')[1];
          } else if (url.includes('/salud/')) {
            sectionType = `salud-${url.split('/salud/')[1]}`;
          }
          
          // Parsear las promociones del HTML
          const promotions = parseElMejorTrato(content, url);
          
          // Añadir a los resultados
          allPromotions.push(...promotions);
          
          // Actualizar metadatos
          metadata.sectionCounts[sectionType] = promotions.length;
          
          // Cerrar la página
          await page.close();
        }
        
        // Añadir totales a los metadatos
        metadata.totalPromotions = allPromotions.length;
        
        // Retornar resultado completo
        return {
          promotions: allPromotions,
          timestamp,
          metadata
        };
      } finally {
        // Cerrar el navegador en cualquier caso
        await browser.close();
      }
    }, options?.retries || 3);
  } catch (error) {
    // Capturar y reportar errores
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new ScraperError(
      `Error en scraping de El Mejor Trato: ${errorMessage}`, 
      serviceName, 
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Verificación de disponibilidad del servicio
 */
async function isAvailable(): Promise<boolean> {
  try {
    const browser = await setupBrowser();
    try {
      const page = await browser.newPage();
      await page.goto(serviceUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Verificar si la página respondió correctamente
      const content = await page.content();
      const isUp = content.length > 0 && 
              (content.includes('El Mejor Trato') || 
               content.includes('elmejortrato'));
      
      return isUp;
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error(`Error al verificar disponibilidad de ${serviceName}:`, error);
    return false;
  }
}

// Exportar el servicio
export const elmejortrato: ScraperService = {
  serviceName,
  serviceUrl,
  run,
  isAvailable
}; 