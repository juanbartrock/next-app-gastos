/**
 * Servicio de scraping para Netflix
 */
import { ScraperService, ScraperResult, ScraperOptions, ScraperError } from '../../types';
import { parseNetflixOffers } from './parser';
import { setupBrowser, withRetries } from '../../lib/browser';
import { serviceConfig } from '../../config/services.config';
import axios from 'axios';

// Configuración específica para Netflix
const serviceName = 'netflix';
const config = serviceConfig[serviceName];
const serviceUrl = config.url;

// URLs específicas para el scraping
const NETFLIX_PLANS_URL = config.scrapingUrls[0];
const NETFLIX_PROMO_URL = config.scrapingUrls[1];

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
        const planPage = await browser.newPage();
        await planPage.goto(NETFLIX_PLANS_URL, { waitUntil: 'networkidle2' });
        const plansHtml = await planPage.content();
        
        // Obtener datos de promociones
        const promoPage = await browser.newPage();
        await promoPage.goto(NETFLIX_PROMO_URL, { waitUntil: 'networkidle2' });
        const promosHtml = await promoPage.content();
        
        // Parsear los resultados
        const promotions = parseNetflixOffers(plansHtml, promosHtml);
        
        // Añadir alguna información adicional al resultado
        return {
          promotions,
          timestamp,
          metadata: {
            urls: [NETFLIX_PLANS_URL, NETFLIX_PROMO_URL],
            planCount: promotions.filter(p => p.title.includes('Plan Netflix')).length,
            promotionCount: promotions.filter(p => !p.title.includes('Plan Netflix')).length
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
    throw new ScraperError(`Error en scraping de Netflix: ${errorMessage}`, serviceName, error instanceof Error ? error : undefined);
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
    console.warn(`Error al verificar disponibilidad de Netflix:`, error);
    return false;
  }
}

// Exportar el servicio de scraping
export const netflix: ScraperService = {
  serviceName,
  serviceUrl,
  run,
  isAvailable
}; 