import { PriceSearchOptions, PriceSearchResult, PriceSearchService } from "../../types";
import precialoService from "../precialo";
import ratoneandoService from "../ratoneando";
import preciosClarosService from "../preciosclaros";
import mercadoTrackService from "../mercadotrack";
import { detectProductCategory } from "./productCategories";

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

  /**
   * Obtiene todos los servicios disponibles
   */
  getServices(): PriceSearchService[] {
    return this.services;
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
   * Busca un producto en todos los servicios disponibles
   * @param query Término de búsqueda
   * @param options Opciones de búsqueda
   */
  async searchAll(query: string, options?: PriceSearchOptions): Promise<{
    service: string;
    results: PriceSearchResult[];
  }[]> {
    try {
      console.log(`[PriceSearchManager] Iniciando búsqueda para "${query}"`);
      console.log(`[PriceSearchManager] Categoría detectada: ${detectProductCategory(query)}`);
      
      const availableServices = await this.getAvailableServices();
      
      if (availableServices.length === 0) {
        console.warn("[PriceSearchManager] No hay servicios disponibles para la búsqueda");
        return [];
      }
      
      console.log(`[PriceSearchManager] Servicios disponibles: ${availableServices.map(s => s.serviceName).join(', ')}`);
      
      const searchPromises = availableServices.map(async (service) => {
        try {
          console.log(`[PriceSearchManager] Consultando servicio: ${service.serviceName}`);
          const results = await service.search(query, options);
          console.log(`[PriceSearchManager] ${service.serviceName} encontró ${results.length} resultados`);
          
          return {
            service: service.serviceName,
            results
          };
        } catch (error) {
          console.error(`[PriceSearchManager] Error en servicio ${service.serviceName}:`, error);
          return {
            service: service.serviceName,
            results: []
          };
        }
      });

      const results = await Promise.all(searchPromises);
      
      // Filtrar servicios que no devolvieron resultados
      const filteredResults = results.filter(result => result.results.length > 0);
      
      console.log(`[PriceSearchManager] Total servicios con resultados: ${filteredResults.length}`);
      console.log(`[PriceSearchManager] Total resultados encontrados: ${filteredResults.reduce((acc, curr) => acc + curr.results.length, 0)}`);
      
      return filteredResults;
    } catch (error) {
      console.error("[PriceSearchManager] Error general en búsqueda:", error);
      return [];
    }
  }

  /**
   * Busca el mejor precio para un producto en todos los servicios
   * @param query Término de búsqueda
   * @param currentPrice Precio actual del producto para comparar
   * @param options Opciones de búsqueda
   */
  async findBestPrice(
    query: string, 
    currentPrice: number,
    options?: PriceSearchOptions
  ): Promise<{
    foundBetterPrice: boolean;
    bestPrice?: number;
    saving?: number;
    savingPercentage?: number;
    store?: string;
    url?: string;
    simulation: boolean; // Indica que los resultados son simulados
    productCategory: string;
    allResults: {
      service: string;
      results: PriceSearchResult[];
    }[];
  }> {
    console.log(`[PriceSearchManager] Buscando mejor precio para "${query}" (precio actual: ${currentPrice})`);
    
    const allResults = await this.searchAll(query, options);
    const productCategory = detectProductCategory(query);
    
    // Aplanar todos los resultados
    const flatResults = allResults.flatMap(serviceResult => 
      serviceResult.results.map(result => ({
        ...result,
        service: serviceResult.service
      }))
    );
    
    // Ordenar por precio (menor a mayor)
    const sortedResults = flatResults.sort((a, b) => a.price - b.price);
    
    // Verificar si encontramos un mejor precio
    const bestResult = sortedResults.length > 0 ? sortedResults[0] : undefined;
    const foundBetterPrice = bestResult ? bestResult.price < currentPrice : false;
    
    if (foundBetterPrice) {
      console.log(`[PriceSearchManager] ¡Encontrado mejor precio! ${bestResult!.price} en ${bestResult!.store} (ahorro: ${currentPrice - bestResult!.price})`);
    } else {
      console.log(`[PriceSearchManager] No se encontró un mejor precio que ${currentPrice}`);
    }
    
    return {
      foundBetterPrice,
      bestPrice: bestResult?.price,
      saving: foundBetterPrice ? currentPrice - bestResult!.price : undefined,
      savingPercentage: foundBetterPrice 
        ? Math.round(((currentPrice - bestResult!.price) / currentPrice) * 100) 
        : undefined,
      store: bestResult?.store,
      url: bestResult?.url,
      simulation: true, // Indicar que estos resultados son simulados
      productCategory: productCategory,
      allResults
    };
  }
}

export default new PriceSearchManager(); 