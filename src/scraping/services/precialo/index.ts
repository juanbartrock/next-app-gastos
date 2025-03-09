import { PriceSearchOptions, PriceSearchResult, PriceSearchService } from "../../types";
import { 
  detectProductCategory, 
  getStoresForCategory, 
  generateProductUrl,
  simulatePrice
} from "../price-search/productCategories";

/**
 * Servicio para buscar precios en Precialo.com.ar
 */
class PrecialoService implements PriceSearchService {
  serviceName = "precialo";
  serviceUrl = "https://precialo.com.ar";

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
      console.log(`[Precialo] Buscando "${query}"...`);
      
      // Simulamos una pequeña demora para simular la petición
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Detectar la categoría del producto
      const category = detectProductCategory(query);
      console.log(`[Precialo] Categoría detectada para "${query}": ${category}`);
      
      // Obtener tiendas compatibles con esta categoría
      const compatibleStores = getStoresForCategory(category);
      console.log(`[Precialo] Encontradas ${compatibleStores.length} tiendas compatibles`);
      
      if (compatibleStores.length === 0) {
        console.log(`[Precialo] No se encontraron tiendas compatibles para la categoría ${category}`);
        return [];
      }
      
      // Generar un precio base para este producto
      // Los precios base son diferentes según la categoría
      let basePrice = 0;
      switch (category) {
        case 'alimentos':
          basePrice = Math.floor(Math.random() * 500) + 100; // 100-600
          break;
        case 'bebidas':
          basePrice = Math.floor(Math.random() * 800) + 200; // 200-1000
          break;
        case 'limpieza':
          basePrice = Math.floor(Math.random() * 1000) + 300; // 300-1300
          break;
        case 'electrodomesticos':
          basePrice = Math.floor(Math.random() * 100000) + 20000; // 20000-120000
          break;
        case 'tecnologia':
          basePrice = Math.floor(Math.random() * 150000) + 30000; // 30000-180000
          break;
        case 'hogar':
          basePrice = Math.floor(Math.random() * 20000) + 5000; // 5000-25000
          break;
        case 'cuidado_personal':
          basePrice = Math.floor(Math.random() * 2000) + 500; // 500-2500
          break;
        case 'ropa':
          basePrice = Math.floor(Math.random() * 15000) + 3000; // 3000-18000
          break;
        default:
          basePrice = Math.floor(Math.random() * 3000) + 1000; // 1000-4000
      }
      
      // Límite la cantidad de tiendas a 3 (aleatoriamente) para no sobrecargar los resultados
      const storesToShow = compatibleStores
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(3, compatibleStores.length));
      
      // Generar resultados basados en las tiendas compatibles
      const results: PriceSearchResult[] = storesToShow.map(store => {
        const price = simulatePrice(basePrice, store);
        return {
          productName: query,
          price: price,
          store: store.name,
          url: generateProductUrl(query, store),
          imageUrl: "https://via.placeholder.com/150",
          availability: Math.random() > 0.1, // 90% probabilidad de disponibilidad
          timestamp: new Date()
        };
      });
      
      // Ordenar por precio (menor a mayor)
      const sortedResults = results.sort((a, b) => a.price - b.price);
      
      // Aplicamos filtros según las opciones
      let filteredResults = [...sortedResults];
      
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

export default new PrecialoService(); 