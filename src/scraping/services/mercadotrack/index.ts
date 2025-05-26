import { PriceSearchOptions, PriceSearchResult, PriceSearchService } from "../../types";

/**
 * Servicio para buscar precios en MercadoTrack
 */
class MercadoTrackService implements PriceSearchService {
  serviceName = "mercadotrack";
  serviceUrl = "https://beta.mercadotrack.com/MLA";

  /**
   * Verifica si el servicio está disponible
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(this.serviceUrl, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error(`Error verificando disponibilidad de ${this.serviceName}:`, error);
      return false;
    }
  }

  /**
   * Busca precios para un producto
   * @param query Término de búsqueda
   * @param options Opciones de búsqueda
   */
  async search(query: string, options?: PriceSearchOptions): Promise<PriceSearchResult[]> {
    try {
      // TODO: Implementar scraping real de Mercado Libre
      // URL de búsqueda (para referencia)
      const searchUrl = `${this.serviceUrl}/search?q=${encodeURIComponent(query)}`;
      
      // Por ahora, retornar array vacío hasta implementar scraping real
      const results: PriceSearchResult[] = [];
      
      // Aplicamos filtros según las opciones
      let filteredResults = [...results];
      
      if (options?.exactMatch) {
        filteredResults = filteredResults.filter(r => 
          r.productName.toLowerCase() === query.toLowerCase()
        );
      }
      
      if (options?.maxResults) {
        filteredResults = filteredResults.slice(0, options.maxResults);
      }
      
      return filteredResults;
    } catch (error) {
      console.error(`Error buscando en ${this.serviceName}:`, error);
      return [];
    }
  }
}

export default new MercadoTrackService(); 