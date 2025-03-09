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
  console.log("Iniciando scraping de Personal...");
  
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
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
        );
        
        // Configurar viewport para simular una pantalla grande
        await page.setViewport({
          width: 1920,
          height: 1080
        });
        
        console.log(`Navegando a ${PERSONAL_PLANES_URL}...`);
        
        // Personal puede tener protecciones contra bots, aumentar el timeout
        await page.goto(PERSONAL_PLANES_URL, { 
          waitUntil: 'networkidle2',
          timeout: 90000
        });
        
        // Esperar un momento para que se carguen datos dinámicos
        console.log("Esperando carga inicial de la página...");
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Hacer scroll para cargar elementos lazy-loaded
        console.log("Haciendo scroll para cargar elementos dinámicos...");
        
        // Intenta cerrar popups o cookies si existen
        try {
          const cookieSelectors = [
            'button[aria-label="close"]', 
            '.cookie-banner button',
            'button.close',
            '[data-dismiss="modal"]',
            '.modal-close'
          ];
          
          for (const selector of cookieSelectors) {
            const cookieButton = await page.$(selector);
            if (cookieButton) {
              console.log(`Encontrado botón para cerrar popup: ${selector}`);
              await cookieButton.click();
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        } catch (e) {
          console.log("Error al intentar cerrar popups:", e);
        }
        
        // Hacer scroll más minucioso para cargar todos los elementos
        await page.evaluate(() => {
          return new Promise<void>((resolve) => {
            let totalHeight = 0;
            const distance = 300;
            const timer = setInterval(() => {
              const scrollHeight = document.body.scrollHeight;
              window.scrollBy(0, distance);
              totalHeight += distance;
              
              if(totalHeight >= scrollHeight) {
                clearInterval(timer);
                resolve();
              }
            }, 200);
          });
        });
        
        console.log("Esperando para asegurar carga completa...");
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Intentar hacer clic en botones de "Ver más" o "Mostrar más planes" si existen
        try {
          const verMasSelectors = [
            'button:contains("Ver más")', 
            'button:contains("Más planes")',
            'a:contains("Ver todos")',
            'button:contains("Mostrar")',
            '.show-more',
            '.ver-mas'
          ];
          
          for (const selector of verMasSelectors) {
            const buttons = await page.$$(selector);
            console.log(`Buscando botones de "${selector}": encontrados ${buttons.length}`);
            
            for (const button of buttons) {
              console.log(`Haciendo clic en botón "${selector}"...`);
              await button.click();
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        } catch (e) {
          console.log("Error al intentar hacer clic en botones de 'Ver más':", e);
        }
        
        // Esperar a que se carguen más elementos
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Intentar buscar elementos de planes por selectores específicos
        await page.evaluate(() => {
          // Simular algunos clics en la página
          document.querySelectorAll('button, a, [role="button"]').forEach(el => {
            if (el.textContent && 
               (el.textContent.includes("plan") || 
                el.textContent.includes("tarifa") || 
                el.textContent.includes("precios") ||
                el.textContent.includes("móvil"))) {
              try {
                (el as HTMLElement).click();
              } catch (e) {
                // Ignorar errores
              }
            }
          });
        });
        
        // Esperar a que se carguen elementos adicionales
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Obtener el HTML de la página
        console.log("Extrayendo contenido HTML de la página...");
        const html = await page.content();
        
        // Guardar capturas de pantalla para debugging (opcional)
        await page.screenshot({ path: 'personal-screenshot.png' });
        
        // Parsear los resultados
        console.log("Parseando resultados...");
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
    console.error("Error en scraping de Personal:", errorMessage);
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