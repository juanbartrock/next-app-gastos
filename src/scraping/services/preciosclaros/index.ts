import { PriceSearchOptions, PriceSearchResult, PriceSearchService } from "../../types";

/**
 * Servicio para buscar precios en PreciosClaros.gob.ar
 */
class PreciosClarosService implements PriceSearchService {
  serviceName = "preciosclaros";
  serviceUrl = "https://www.preciosclaros.gob.ar";

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
      // En un entorno real, aquí implementaríamos el scraping del sitio o uso de API
      // Por ahora, simulamos una respuesta para demostración
      
      // URL de búsqueda (para referencia)
      const searchUrl = `${this.serviceUrl}/#!/buscar-productos/${encodeURIComponent(query)}`;
      
      // Simulamos una pequeña demora para simular la petición
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Generamos resultados simulados basados en la consulta
      const results: PriceSearchResult[] = [
        {
          productName: query,
          price: Math.floor(Math.random() * 8500) + 850,
          store: "Carrefour",
          url: `${this.serviceUrl}/producto/123`,
          imageUrl: "https://via.placeholder.com/150",
          availability: true,
          timestamp: new Date()
        },
        {
          productName: query,
          price: Math.floor(Math.random() * 8200) + 820,
          store: "Coto",
          url: `${this.serviceUrl}/producto/456`,
          imageUrl: "https://via.placeholder.com/150",
          availability: true,
          timestamp: new Date()
        },
        {
          productName: query,
          price: Math.floor(Math.random() * 7800) + 780,
          store: "Día",
          url: `${this.serviceUrl}/producto/789`,
          imageUrl: "https://via.placeholder.com/150",
          availability: true,
          timestamp: new Date()
        },
        {
          productName: query,
          price: Math.floor(Math.random() * 8800) + 880,
          store: "Disco",
          url: `${this.serviceUrl}/producto/101`,
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

export default new PreciosClarosService(); 