import serviceConfig, { enabledServices, ServiceConfig } from './services.config';

/**
 * Configuración global del sistema de scraping
 */
export interface ScrapingConfig {
  // Configuración del navegador por defecto
  browser: {
    headless: boolean;          // Modo sin ventana
    defaultTimeout: number;     // Timeout por defecto en ms
    userAgent: string;          // User agent personalizado
  };
  
  // Comportamiento de los scrapers
  scrapers: {
    maxRetries: number;         // Máximo número de reintentos
    retryDelay: number;         // Tiempo entre reintentos en ms
    concurrentScrapers: number; // Número máximo de scrapers concurrentes
  };
  
  // Configuración de almacenamiento
  storage: {
    promotionRetentionDays: number;  // Días que se guardan las promociones
  };
  
  // URLs de base para los servicios
  services: Record<string, ServiceConfig>;
  
  // Lista de servicios habilitados
  enabledServices: string[];
}

// Configuración por defecto
export const defaultConfig: ScrapingConfig = {
  browser: {
    headless: true,
    defaultTimeout: 30000,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
  },
  scrapers: {
    maxRetries: 3,
    retryDelay: 1000,
    concurrentScrapers: 2
  },
  storage: {
    promotionRetentionDays: 30
  },
  services: serviceConfig,
  enabledServices
};

// Exportar la configuración
export { serviceConfig, enabledServices };
export type { ServiceConfig };
export default defaultConfig; 