import { PriceSearchOptions, PriceSearchResult, PriceSearchService } from "../../types";
import { 
  detectProductCategory, 
  getStoresForCategory, 
  generateProductUrl,
  simulatePrice
} from "../price-search/productCategories";

/**
 * Servicio para buscar precios en Ratoneando.ar
 */
class RatoneandoService implements PriceSearchService {
  serviceName = "ratoneando";
  serviceUrl = "https://ratoneando.ar";

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
      console.log(`[Ratoneando] Buscando "${query}"...`);
      
      // Simulamos una pequeña demora para simular la petición
      await new Promise(resolve => setTimeout(resolve, 800));

      // Detectar la categoría del producto
      const category = detectProductCategory(query);
      console.log(`[Ratoneando] Categoría detectada para "${query}": ${category}`);
      
      // Obtener tiendas compatibles con esta categoría
      // Ratoneando tiende a enfocarse más en productos electrónicos y de tecnología
      let compatibleStores = getStoresForCategory(category);
      
      // Si la categoría no es tecnología o electrodomésticos, priorizamos tiendas que tengan ofertas en esos productos
      if (category !== 'tecnologia' && category !== 'electrodomesticos') {
        compatibleStores = compatibleStores.filter(store => 
          store.name === 'Mercado Libre' || 
          store.name === 'Frávega' || 
          store.name === 'Garbarino' || 
          store.name === 'Musimundo'
        );
      }
      
      console.log(`[Ratoneando] Encontradas ${compatibleStores.length} tiendas compatibles`);
      
      if (compatibleStores.length === 0) {
        console.log(`[Ratoneando] No se encontraron tiendas compatibles para la categoría ${category}`);
        return [];
      }
      
      // Generar un precio base para este producto
      // Los precios en Ratoneando suelen ser algo menores por ser ofertas
      let basePrice = 0;
      switch (category) {
        case 'alimentos':
          basePrice = Math.floor(Math.random() * 450) + 100; // 100-550
          break;
        case 'bebidas':
          basePrice = Math.floor(Math.random() * 750) + 200; // 200-950
          break;
        case 'limpieza':
          basePrice = Math.floor(Math.random() * 900) + 300; // 300-1200
          break;
        case 'electrodomesticos':
          basePrice = Math.floor(Math.random() * 90000) + 20000; // 20000-110000
          break;
        case 'tecnologia':
          basePrice = Math.floor(Math.random() * 140000) + 30000; // 30000-170000
          break;
        case 'hogar':
          basePrice = Math.floor(Math.random() * 18000) + 5000; // 5000-23000
          break;
        case 'cuidado_personal':
          basePrice = Math.floor(Math.random() * 1800) + 500; // 500-2300
          break;
        case 'ropa':
          basePrice = Math.floor(Math.random() * 13000) + 3000; // 3000-16000
          break;
        default:
          basePrice = Math.floor(Math.random() * 2800) + 1000; // 1000-3800
      }
      
      // Límite la cantidad de tiendas (aleatoriamente) para no sobrecargar
      const storesToShow = compatibleStores
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(3, compatibleStores.length));
      
      // Generar resultados basados en las tiendas compatibles
      const results: PriceSearchResult[] = storesToShow.map(store => {
        // En Ratoneando los precios suelen ser un 5% más bajos (descuentos)
        const discountFactor = 0.95;
        const price = simulatePrice(basePrice, store) * discountFactor;
        
        return {
          productName: query,
          price: price,
          store: store.name,
          url: generateProductUrl(query, store),
          imageUrl: "https://via.placeholder.com/150",
          availability: Math.random() > 0.15, // 85% probabilidad de disponibilidad
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

export default new RatoneandoService(); 