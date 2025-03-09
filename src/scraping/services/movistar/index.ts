/**
 * Servicio de scraping para Movistar (operador móvil argentino)
 */
import { ScraperService, ScraperResult, ScraperOptions, ScraperError } from '../../types';
import { parseOffers } from './parser';
import { setupBrowser, withRetries } from '../../lib/browser';
import { serviceConfig } from '../../config/services.config';

// Configuración específica para Movistar
const serviceName = 'movistar';
const config = serviceConfig[serviceName];
const serviceUrl = config.url;

// URLs específicas para el scraping
const MOVISTAR_PLANS_URL = config.scrapingUrls[0];

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
        // Obtener datos de planes
        const page = await browser.newPage();
        
        // Configurar user agent como un navegador normal
        await page.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
        );
        
        // Movistar puede tener protecciones contra bots, aumentar el timeout
        await page.goto(MOVISTAR_PLANS_URL, { 
          waitUntil: 'networkidle2',
          timeout: 60000
        });
        
        // Esperar a que cargue el contenido relevante
        await page.waitForSelector('.plan, .card, .tarjeta-plan, h2, [data-plan]', { 
          timeout: 15000
        }).catch(() => {
          console.warn('No se encontraron selectores específicos, continuando con el contenido disponible');
        });
        
        // Extraer el HTML para parsearlo con cheerio
        const content = await page.content();
        
        // Hacer scroll para cargar contenido dinámico
        await page.evaluate(() => {
          // Scroll a 1/3 de la página
          window.scrollTo(0, document.body.scrollHeight / 3);
          return new Promise(resolve => setTimeout(resolve, 1000));
        });
        
        await page.evaluate(() => {
          // Scroll a 2/3 de la página
          window.scrollTo(0, document.body.scrollHeight * 2/3);
          return new Promise(resolve => setTimeout(resolve, 1000));
        });
        
        await page.evaluate(() => {
          // Scroll al final de la página
          window.scrollTo(0, document.body.scrollHeight);
          return new Promise(resolve => setTimeout(resolve, 1000));
        });
        
        // Extraer el HTML actualizado
        const contentAfterScroll = await page.content();
        
        // Usar el contenido con más información
        const htmlToUse = contentAfterScroll.length > content.length ? contentAfterScroll : content;
        
        // Parsear las ofertas del HTML
        const promotions = parseOffers(htmlToUse);
        
        // Añadir información adicional
        return {
          promotions,
          timestamp,
          metadata: {
            url: MOVISTAR_PLANS_URL,
            planCount: promotions.length
          }
        };
      } finally {
        // Cerrar el navegador en cualquier caso
        await browser.close();
      }
    });
  } catch (error) {
    // Capturar y reportar errores
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new ScraperError(`Error en scraping de Movistar: ${errorMessage}`, serviceName, error instanceof Error ? error : undefined);
  }
}

/**
 * Verifica si el servicio de Movistar está disponible
 */
async function isAvailable(): Promise<boolean> {
  try {
    const browser = await setupBrowser();
    const page = await browser.newPage();
    
    // Configurar timeout más corto para la verificación
    page.setDefaultNavigationTimeout(15000);
    
    // Intentar navegar a la página principal de Movistar
    await page.goto(serviceUrl, { 
      waitUntil: 'networkidle2'
    });
    
    // Verificar si la página cargó correctamente
    const title = await page.title();
    const content = await page.content();
    
    await browser.close();
    
    // Verificar si el contenido parece ser de Movistar
    return title.toLowerCase().includes('movistar') || 
           content.toLowerCase().includes('movistar argentina') || 
           content.toLowerCase().includes('telefónica') ||
           content.includes('movistar-logo');
  } catch (error) {
    console.error(`Error verificando disponibilidad de Movistar: ${error}`);
    return false;
  }
}

// Exportar el servicio completo
export const movistar: ScraperService = {
  serviceName,
  serviceUrl,
  run,
  isAvailable
}; 