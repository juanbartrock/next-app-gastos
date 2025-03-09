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
      // En un entorno real, aquí implementaríamos el scraping del sitio
      // Por ahora, simulamos una respuesta para demostración
      
      // URL de búsqueda (para referencia)
      const searchUrl = `${this.serviceUrl}/search?q=${encodeURIComponent(query)}`;
      
      // Simulamos una pequeña demora para simular la petición
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generamos resultados simulados basados en la consulta
      const results: PriceSearchResult[] = [
        {
          productName: query,
          price: Math.floor(Math.random() * 9500) + 950,
          store: "Mercado Libre - Vendedor Premium",
          url: `https://articulo.mercadolibre.com.ar/123`,
          imageUrl: "https://via.placeholder.com/150",
          availability: true,
          timestamp: new Date()
        },
        {
          productName: query,
          price: Math.floor(Math.random() * 9000) + 900,
          store: "Mercado Libre - Tienda Oficial",
          url: `https://articulo.mercadolibre.com.ar/456`,
          imageUrl: "https://via.placeholder.com/150",
          availability: true,
          timestamp: new Date()
        },
        {
          productName: query,
          price: Math.floor(Math.random() * 8500) + 850,
          store: "Mercado Libre",
          url: `https://articulo.mercadolibre.com.ar/789`,
          imageUrl: "https://via.placeholder.com/150",
          availability: true,
          timestamp: new Date()
        }
      ];
      
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