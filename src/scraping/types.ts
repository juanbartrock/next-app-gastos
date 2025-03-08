/**
 * Tipos básicos para el sistema de scraping de promociones
 */

// Resultado de una promoción encontrada
export interface PromotionResult {
  serviceName: string;           // Nombre del servicio (ej. "netflix", "spotify")
  title: string;                 // Título de la promoción
  description: string;           // Descripción detallada
  originalPrice?: number;        // Precio original (opcional)
  discountedPrice: number;       // Precio con descuento
  discountPercentage?: number;   // Porcentaje de descuento (opcional)
  url: string;                   // URL donde se puede acceder a la promoción
  validUntil?: Date;             // Fecha de validez (opcional)
  imageUrl?: string;             // URL de imagen (opcional)
  terms?: string;                // Términos y condiciones (opcional)
}

// Opciones para configurar un scraper
export interface ScraperOptions {
  browser?: 'puppeteer' | 'playwright' | 'none';  // Tipo de navegador a usar
  timeout?: number;                               // Tiempo máximo de espera en ms
  retries?: number;                               // Número de reintentos en caso de error
  proxy?: string;                                 // Proxy para las peticiones (opcional)
}

// Resultado de un scraper
export interface ScraperResult {
  promotions: PromotionResult[];         // Lista de promociones encontradas
  timestamp: Date;                        // Fecha y hora de la ejecución
  metadata?: Record<string, any>;         // Metadatos adicionales (opcional)
}

// Interfaz que debe implementar cada servicio de scraping
export interface ScraperService {
  serviceName: string;                                         // Nombre del servicio
  serviceUrl: string;                                          // URL base del servicio
  run: (options?: ScraperOptions) => Promise<ScraperResult>;   // Método principal
  isAvailable: () => Promise<boolean>;                         // Verificar disponibilidad
}

// Errores específicos del sistema de scraping
export class ScraperError extends Error {
  constructor(
    message: string,
    public serviceName?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ScraperError';
  }
} 