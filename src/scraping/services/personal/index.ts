/**
 * Servicio de scraping para Personal (operador móvil argentino)
 */
import { ScraperService, ScraperResult, ScraperOptions, ScraperError } from '../../types';
import { parsePersonalOffers } from './parser';
import { setupBrowser, withRetries } from '../../lib/browser';
import { serviceConfig } from '../../config/services.config';
import axios from 'axios';

// Configuración específica para Personal
const serviceName = 'personal';
const config = serviceConfig[serviceName];
const serviceUrl = config.url;

// URLs específicas para el scraping
const PERSONAL_PLANES_URL = config.scrapingUrls[0];

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
        // Obtener datos de la página de planes móviles
        const page = await browser.newPage();
        
        // Configurar user agent como un navegador normal
        await page.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
        );
        
        // Personal puede tener protecciones contra bots, aumentar el timeout
        await page.goto(PERSONAL_PLANES_URL, { 
          waitUntil: 'networkidle2',
          timeout: 60000
        });
        
        // Esperar un momento para que se carguen datos dinámicos
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Hacer scroll para cargar elementos lazy-loaded
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight / 3);
          return new Promise(resolve => setTimeout(resolve, 1000));
        });
        
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight * 2/3);
          return new Promise(resolve => setTimeout(resolve, 1000));
        });
        
        // Obtener el HTML de la página
        const html = await page.content();
        
        // Parsear los resultados
        const promotions = parsePersonalOffers(html);
        
        // Añadir información adicional
        return {
          promotions,
          timestamp,
          metadata: {
            url: PERSONAL_PLANES_URL,
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
    throw new ScraperError(`Error en scraping de Personal: ${errorMessage}`, serviceName, error instanceof Error ? error : undefined);
  }
}

/**
 * Verifica si el servicio está disponible
 */
async function isAvailable(): Promise<boolean> {
  try {
    const response = await axios.head(serviceUrl, {
      timeout: 5000,
      validateStatus: () => true // No lanzar excepciones por códigos de estado
    });
    
    // Considerar disponible si devuelve código 2xx o 3xx
    return response.status >= 200 && response.status < 400;
  } catch (error) {
    console.warn(`Error al verificar disponibilidad de Personal:`, error);
    return false;
  }
}

// Exportar el servicio de scraping
export const personal: ScraperService = {
  serviceName,
  serviceUrl,
  run,
  isAvailable
}; 