import { PriceSearchOptions, PriceSearchResult, PriceSearchService } from "../../types";
import precialoService from "../precialo";
import ratoneandoService from "../ratoneando";
import preciosClarosService from "../preciosclaros";
import mercadoTrackService from "../mercadotrack";
import { detectProductCategory, ProductCategory } from "./productCategories";

/**
 * Interfaz para el registro de ejecución de servicios de búsqueda
 */
export interface ServiceExecutionLog {
  serviceName: string;
  startTime: Date;
  endTime: Date;
  durationMs: number;
  status: 'success' | 'error' | 'timeout' | 'empty';
  query: string;
  resultsCount: number;
  error?: string;
  category?: string;
}

/**
 * Interfaz para el resultado de búsqueda con metadatos
 */
export interface SearchResultWithMetadata {
  service: string;
  results: PriceSearchResult[];
  executionLog: ServiceExecutionLog;
}

/**
 * Interfaz para término de búsqueda optimizado
 */
export interface OptimizedSearchTerm {
  original: string;
  optimized: string;
  alternatives: string[];
  category: string;
}

/**
 * Servicio principal para coordinar la búsqueda de precios en múltiples fuentes
 */
class PriceSearchManager {
  private services: PriceSearchService[] = [
    precialoService,
    ratoneandoService,
    preciosClarosService,
    mercadoTrackService
  ];

  // Registro de la última ejecución de servicios
  private serviceExecutionLogs: ServiceExecutionLog[] = [];

  /**
   * Obtiene todos los servicios disponibles
   */
  getServices(): PriceSearchService[] {
    return this.services;
  }

  /**
   * Obtiene los registros de ejecución
   */
  getExecutionLogs(): ServiceExecutionLog[] {
    return [...this.serviceExecutionLogs];
  }

  /**
   * Verifica qué servicios están disponibles
   */
  async getAvailableServices(): Promise<PriceSearchService[]> {
    const availabilityChecks = await Promise.allSettled(
      this.services.map(async (service) => ({
        service,
        available: await service.isAvailable()
      }))
    );

    return availabilityChecks
      .filter(result => result.status === 'fulfilled')
      .map((result) => (result as PromiseFulfilledResult<{service: PriceSearchService, available: boolean}>).value)
      .filter(item => item.available)
      .map(item => item.service);
  }

  /**
   * Optimiza un término de búsqueda para obtener mejores resultados
   * @param query Término de búsqueda original
   * @returns Término optimizado y alternativas
   */
  optimizeSearchTerm(query: string): OptimizedSearchTerm {
    // 1. Identificar la categoría para hacer optimizaciones específicas
    const category = detectProductCategory(query);
    
    // 2. Convertir a minúsculas y eliminar espacios adicionales
    let optimized = query.trim().toLowerCase();
    
    // 3. Eliminar información que reduce las coincidencias (tamaños, pesos, etc.)
    optimized = optimized.replace(/\d+\s*(g|gr|ml|l|kg|oz|cm|mm)\b/gi, '');
    
    // 4. Eliminar caracteres especiales y códigos de producto
    optimized = optimized.replace(/[^\w\s]/gi, '');
    
    // 5. Eliminar palabras muy genéricas que no aportan a la búsqueda
    const genericWords = ['producto', 'articulo', 'item', 'marca', 'postre', 'paquete', 'unidad'];
    genericWords.forEach(word => {
      optimized = optimized.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
    });
    
    // 6. Eliminar espacios múltiples
    optimized = optimized.replace(/\s+/g, ' ').trim();
    
    // 7. Generar alternativas de búsqueda
    const alternatives: string[] = [];
    
    // Primera alternativa: la primera palabra (suele ser la marca)
    const words = query.split(/\s+/);
    if (words.length > 0 && words[0].length > 2) {
      alternatives.push(words[0].trim());
    }
    
    // Segunda alternativa: primeras 2 palabras
    if (words.length > 1 && (words[0].length + words[1].length) > 4) {
      alternatives.push(`${words[0]} ${words[1]}`.trim());
    }
    
    // Si después de la optimización queda muy corto, usar la primera alternativa
    if (optimized.length < 3 && alternatives.length > 0) {
      optimized = alternatives[0];
    }
    
    return {
      original: query,
      optimized,
      alternatives,
      category
    };
  }

  /**
   * Busca un producto en todos los servicios disponibles
   * @param query Término de búsqueda
   * @param options Opciones de búsqueda
   */
  async searchAll(query: string, options?: PriceSearchOptions): Promise<SearchResultWithMetadata[]> {
    try {
      console.log(`[PriceSearchManager] Iniciando búsqueda para "${query}"`);
      const searchTermInfo = this.optimizeSearchTerm(query);
      
      if (searchTermInfo.optimized !== query) {
        console.log(`[PriceSearchManager] Término optimizado: "${searchTermInfo.optimized}"`);
        if (searchTermInfo.alternatives.length > 0) {
          console.log(`[PriceSearchManager] Alternativas: ${searchTermInfo.alternatives.join(', ')}`);
        }
      }
      
      console.log(`[PriceSearchManager] Categoría detectada: ${searchTermInfo.category}`);
      
      // Limpiar logs antiguos si hay demasiados (mantener historial razonable)
      if (this.serviceExecutionLogs.length > 100) {
        this.serviceExecutionLogs = this.serviceExecutionLogs.slice(-50);
      }
      
      const availableServices = await this.getAvailableServices();
      
      if (availableServices.length === 0) {
        console.warn("[PriceSearchManager] No hay servicios disponibles para la búsqueda");
        return [];
      }
      
      console.log(`[PriceSearchManager] Servicios disponibles: ${availableServices.map(s => s.serviceName).join(', ')}`);
      
      // Crear opciones de búsqueda con el término optimizado
      const enhancedOptions = {
        ...options,
        optimizedTerm: searchTermInfo.optimized,
        alternatives: searchTermInfo.alternatives
      };
      
      const searchPromises = availableServices.map(async (service) => {
        // Registrar inicio de ejecución
        const startTime = new Date();
        const executionLog: ServiceExecutionLog = {
          serviceName: service.serviceName,
          startTime,
          endTime: new Date(), // Se actualizará al finalizar
          durationMs: 0,
          status: 'success',
          query,
          resultsCount: 0,
          category: searchTermInfo.category
        };
        
        try {
          console.log(`[PriceSearchManager] Consultando servicio: ${service.serviceName}`);
          // Primero intentar con el término optimizado si es diferente
          let results: PriceSearchResult[] = [];
          
          if (searchTermInfo.optimized !== query) {
            // Usar el término optimizado
            results = await service.search(searchTermInfo.optimized, options);
            console.log(`[PriceSearchManager] ${service.serviceName} con término optimizado "${searchTermInfo.optimized}" encontró ${results.length} resultados`);
            
            // Si no se encontraron resultados, intentar con alternativas
            if (results.length === 0 && searchTermInfo.alternatives.length > 0) {
              for (const altTerm of searchTermInfo.alternatives) {
                console.log(`[PriceSearchManager] Intentando ${service.serviceName} con alternativa: "${altTerm}"`);
                const altResults = await service.search(altTerm, options);
                if (altResults.length > 0) {
                  console.log(`[PriceSearchManager] ${service.serviceName} con alternativa "${altTerm}" encontró ${altResults.length} resultados`);
                  results = altResults;
                  break;
                }
              }
            }
            
            // Si todavía no hay resultados, intentar con el término original
            if (results.length === 0) {
              console.log(`[PriceSearchManager] Intentando ${service.serviceName} con término original: "${query}"`);
              results = await service.search(query, options);
            }
          } else {
            // Usar el término original directamente
            results = await service.search(query, options);
          }
          
          // Actualizar registro de ejecución
          const endTime = new Date();
          executionLog.endTime = endTime;
          executionLog.durationMs = endTime.getTime() - startTime.getTime();
          executionLog.resultsCount = results.length;
          executionLog.status = results.length > 0 ? 'success' : 'empty';
          
          console.log(`[PriceSearchManager] ${service.serviceName} encontró ${results.length} resultados en ${executionLog.durationMs}ms`);
          
          // Guardar el log de ejecución
          this.serviceExecutionLogs.push(executionLog);
          
          return {
            service: service.serviceName,
            results,
            executionLog
          };
        } catch (error) {
          // Actualizar registro de ejecución en caso de error
          const endTime = new Date();
          executionLog.endTime = endTime;
          executionLog.durationMs = endTime.getTime() - startTime.getTime();
          executionLog.status = 'error';
          executionLog.error = error instanceof Error ? error.message : String(error);
          
          console.error(`[PriceSearchManager] Error en servicio ${service.serviceName}:`, error);
          
          // Guardar el log de ejecución
          this.serviceExecutionLogs.push(executionLog);
          
          return {
            service: service.serviceName,
            results: [],
            executionLog
          };
        }
      });

      const results = await Promise.all(searchPromises);
      
      // Resumen de la ejecución
      const successfulServices = results.filter(r => r.executionLog.status === 'success').length;
      const errorServices = results.filter(r => r.executionLog.status === 'error').length;
      const emptyServices = results.filter(r => r.executionLog.status === 'empty').length;
      const totalResults = results.reduce((acc, curr) => acc + curr.results.length, 0);
      const avgDuration = results.reduce((acc, curr) => acc + curr.executionLog.durationMs, 0) / results.length;
      
      console.log(`[PriceSearchManager] Resumen de búsqueda para "${query}":`);
      console.log(`  - Servicios exitosos: ${successfulServices}`);
      console.log(`  - Servicios con error: ${errorServices}`);
      console.log(`  - Servicios sin resultados: ${emptyServices}`);
      console.log(`  - Total resultados: ${totalResults}`);
      console.log(`  - Duración promedio: ${avgDuration.toFixed(0)}ms`);
      
      return results;
    } catch (error) {
      console.error("[PriceSearchManager] Error general en búsqueda:", error);
      return [];
    }
  }

  /**
   * Busca el mejor precio para un producto entre todos los servicios disponibles
   */
  async findBestPrice(query: string, options?: PriceSearchOptions): Promise<PriceSearchResult | null> {
    try {
      const allResults = await this.searchAll(query, options);
      const allProducts = allResults.flatMap(result => result.results);
      
      if (allProducts.length === 0) {
        return null;
      }
      
      // Ordenar por precio y retornar el más económico
      return allProducts.sort((a, b) => a.price - b.price)[0];
    } catch (error) {
      console.error("[PriceSearchManager] Error al buscar mejor precio:", error);
      return null;
    }
  }
}

export default new PriceSearchManager();
export { ProductCategory }; 