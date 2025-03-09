/**
 * Punto de entrada principal del sistema de scraping
 */
import { ScraperService, ScraperOptions, ScraperResult } from './types';
import * as netflix from './services/netflix';
import * as spotify from './services/spotify';
import * as personal from './services/personal';
import * as claro from './services/claro';
import * as movistar from './services/movistar';
import * as elmejortrato from './services/elmejortrato';
import ratoneandoService from './services/ratoneando';
import precialoService from './services/precialo';
// Aquí importaremos más servicios conforme los vayamos implementando

// Registro de todos los scrapers disponibles
export const scrapers: Record<string, ScraperService> = {
  netflix: netflix.netflix,
  spotify: spotify.spotify,
  personal: personal.personal,
  claro: claro.claro,
  movistar: movistar.movistar,
  elmejortrato: elmejortrato.elmejortrato,
  // Servicios de búsqueda de precios
  ratoneando: {
    serviceName: 'ratoneando',
    serviceUrl: 'https://ratoneando.ar',
    isAvailable: async () => await ratoneandoService.isAvailable(),
    run: async (options?: ScraperOptions) => {
      const demoResults: ScraperResult = {
        promotions: [],
        timestamp: new Date()
      };
      return demoResults;
    }
  },
  precialo: {
    serviceName: 'precialo',
    serviceUrl: 'https://precialo.com.ar',
    isAvailable: async () => await precialoService.isAvailable(),
    run: async (options?: ScraperOptions) => {
      const demoResults: ScraperResult = {
        promotions: [],
        timestamp: new Date()
      };
      return demoResults;
    }
  }
  // Añadir más servicios aquí
};

/**
 * Interfaz de resultados del scraping
 */
export interface ScrapingResults {
  results: Record<string, ScraperResult>;
  errors: Record<string, Error>;
  timestamp: Date;
}

/**
 * Ejecuta un scraper específico
 */
export async function runScraper(
  serviceName: string, 
  options?: ScraperOptions
): Promise<ScraperResult> {
  const scraper = scrapers[serviceName];
  
  if (!scraper) {
    throw new Error(`Scraper no encontrado para el servicio: ${serviceName}`);
  }
  
  return await scraper.run(options);
}

/**
 * Ejecuta todos los scrapers habilitados
 */
export async function runAllScrapers(options?: ScraperOptions): Promise<ScrapingResults> {
  const results: Record<string, ScraperResult> = {};
  const errors: Record<string, Error> = {};
  const timestamp = new Date();
  
  // Ejecutar todos los scrapers en paralelo
  const promises = Object.entries(scrapers).map(async ([name, scraper]) => {
    try {
      // Verificar primero si el servicio está disponible
      const isAvailable = await scraper.isAvailable();
      
      if (!isAvailable) {
        throw new Error(`El servicio ${name} no está disponible actualmente`);
      }
      
      const result = await scraper.run(options);
      results[name] = result;
    } catch (error) {
      console.error(`Error en scraper ${name}:`, error);
      errors[name] = error instanceof Error 
        ? error 
        : new Error(String(error));
    }
  });
  
  // Esperar a que todos los scrapers terminen
  await Promise.all(promises);
  
  return { results, errors, timestamp };
}

/**
 * Verifica la disponibilidad de un servicio específico
 */
export async function checkServiceAvailability(serviceName: string): Promise<boolean> {
  const scraper = scrapers[serviceName];
  
  if (!scraper) {
    return false;
  }
  
  return await scraper.isAvailable();
}

/**
 * Devuelve la lista de servicios disponibles
 */
export function getAvailableServices(): string[] {
  return Object.keys(scrapers);
}

// Exportar tipos principales
export * from './types';

// Exportar configuración
export { default as config } from './config'; 