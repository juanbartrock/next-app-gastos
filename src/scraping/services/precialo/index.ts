import { PriceSearchOptions, PriceSearchResult, PriceSearchService } from "../../types";
import { 
  detectProductCategory, 
  ProductCategory
} from "../price-search/productCategories";
import { setupBrowser, setupPage, withRetries } from "../../lib/browser";

/**
 * Servicio para buscar precios en Precialo.com.ar
 */
class PrecialoService implements PriceSearchService {
  serviceName = "precialo";
  serviceUrl = "https://precialo.com.ar";

  /**
   * Verifica si el servicio está disponible
   * Mejorado con reintentos y verificación más robusta
   */
  async isAvailable(): Promise<boolean> {
    const maxRetries = 3;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Intentar con un método HEAD primero (más rápido)
        const response = await fetch(this.serviceUrl, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(5000) // 5 segundos de timeout
        });
        
        if (response.ok) {
          return true;
        }
        
        // Si HEAD no funciona, intentar con GET
        if (attempt === maxRetries - 1) {
          const getResponse = await fetch(this.serviceUrl, { 
            method: 'GET',
            signal: AbortSignal.timeout(5000)
          });
          return getResponse.ok;
        }
        
      } catch (error) {
        console.error(`Error verificando disponibilidad de ${this.serviceName} (intento ${attempt + 1}/${maxRetries}):`, error);
        
        // Si es el último intento, reportamos como no disponible
        if (attempt === maxRetries - 1) {
          return false;
        }
        
        // Esperar un poco antes de reintentar
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return false;
  }

  /**
   * Optimiza el término de búsqueda para obtener mejores resultados
   * @param query Término de búsqueda original
   */
  optimizeSearchTerm(query: string): string {
    // 1. Convertir a minúsculas y eliminar espacios adicionales
    let optimized = query.trim().toLowerCase();
    
    // 2. Eliminar información que reduce las coincidencias (tamaños, pesos, etc.)
    optimized = optimized.replace(/\d+\s*(g|gr|ml|l|kg|oz|cm|mm)\b/gi, '');
    
    // 3. Eliminar caracteres especiales y códigos de producto
    optimized = optimized.replace(/[^\w\s]/gi, '');
    
    // 4. Eliminar palabras muy genéricas que no aportan a la búsqueda
    const genericWords = ['producto', 'articulo', 'item', 'marca', 'postre', 'paquete', 'unidad'];
    genericWords.forEach(word => {
      optimized = optimized.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
    });
    
    // 5. Eliminar espacios múltiples
    optimized = optimized.replace(/\s+/g, ' ').trim();
    
    // 6. Si después de la optimización queda muy corto, volver al original
    if (optimized.length < 3 && query.length > 3) {
      // Extraer la primera palabra del original como fallback
      const firstWord = query.split(/\s+/)[0].trim();
      return firstWord;
    }
    
    return optimized;
  }

  /**
   * Busca precios para un producto
   * @param query Término de búsqueda
   * @param options Opciones de búsqueda
   */
  async search(query: string, options?: PriceSearchOptions): Promise<PriceSearchResult[]> {
    try {
      console.log(`[Precialo] Buscando "${query}"...`);
      
      // Optimizar el término de búsqueda
      const optimizedQuery = this.optimizeSearchTerm(query);
      if (optimizedQuery !== query) {
        console.log(`[Precialo] Término optimizado: "${optimizedQuery}"`);
      }
      
      // Detectar la categoría del producto para mejorar la búsqueda
      const category = detectProductCategory(query);
      console.log(`[Precialo] Categoría detectada para "${query}": ${category}`);
      
      // URL de búsqueda
      const searchUrl = `${this.serviceUrl}/buscar?q=${encodeURIComponent(optimizedQuery)}`;
      console.log(`[Precialo] URL de búsqueda: ${searchUrl}`);
      
      // Iniciar el scraping con Puppeteer
      return await withRetries(async () => {
        const browser = await setupBrowser();
        
        try {
          const page = await setupPage(browser, searchUrl);
          
          // Aumentar el timeout para que la página cargue completamente
          await page.waitForSelector('body', { timeout: 15000 });
          
          // Dar tiempo para que se carguen los elementos dinámicos
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Captura del estado de la página para depuración
          console.log(`[Precialo] Página cargada. URL actual: ${page.url()}`);
          
          // Capturar captura de pantalla para debugging (solo en desarrollo)
          if (process.env.NODE_ENV === 'development') {
            await page.screenshot({ path: 'precialo-debug.png' });
            console.log('[Precialo] Capturada captura de pantalla para debugging');
          }
          
          // Verificar si hay resultados (estrategia general)
          const hasResults = await page.evaluate(() => {
            // Busca contenedores comunes de resultados
            return !!(
              document.querySelector('.product-list') || 
              document.querySelector('.search-results') || 
              document.querySelector('.products') ||
              document.querySelectorAll('[class*="product"]').length > 0
            );
          });
          
          if (!hasResults) {
            console.log(`[Precialo] No se encontraron resultados para "${optimizedQuery}"`);
            
            // Si no hubo resultados con la consulta optimizada, intentar con la primera palabra
            // de la consulta original (si son diferentes)
            const firstWord = query.split(/\s+/)[0].trim();
            if (firstWord !== optimizedQuery && firstWord.length > 2) {
              console.log(`[Precialo] Intentando con término alternativo: "${firstWord}"`);
              
              // Navegar a la búsqueda con la primera palabra
              const altSearchUrl = `${this.serviceUrl}/buscar?q=${encodeURIComponent(firstWord)}`;
              await page.goto(altSearchUrl, { waitUntil: 'networkidle2' });
              
              // Esperar a que cargue la página
              await new Promise(resolve => setTimeout(resolve, 3000));
              console.log(`[Precialo] Cargada búsqueda alternativa. URL actual: ${page.url()}`);
            } else {
              // No hay más intentos, retornar vacío
              return [];
            }
          }
          
          // Extraer datos de los productos encontrados
          const products = await page.evaluate((searchTerms: { originalTerm: string, optimizedTerm: string }) => {
            const { originalTerm, optimizedTerm } = searchTerms;
            
            // Función para extraer precio de un string
            const extractPrice = (text: string | null): { raw: string, value: number, formatted: string } | null => {
              if (!text) return null;
              const match = text.match(/\$\s*([\d.,]+)/);
              if (!match) return null;
              
              // Limpiar y convertir a número
              const priceStr = match[1]
                .replace(/\./g, '')   // Quitar puntos de miles
                .replace(',', '.');   // Cambiar coma decimal por punto
                
              const value = parseFloat(priceStr);
              if (isNaN(value)) return null;
              
              // Formatear con Intl si está disponible
              let formatted = '';
              try {
                formatted = new Intl.NumberFormat('es-AR', { 
                  style: 'currency', 
                  currency: 'ARS' 
                }).format(value);
              } catch(e) {
                formatted = `$${value.toFixed(2)}`;
              }
              
              return {
                raw: match[0],
                value,
                formatted
              };
            };
            
            // Función para verificar si el título coincide con los términos de búsqueda
            const matchesSearchTerms = (title: string | null): boolean => {
              if (!title) return false;
              const titleLower = title.toLowerCase();
              
              // Verificar coincidencia con término original o optimizado
              return (
                titleLower.includes(originalTerm.toLowerCase()) || 
                titleLower.includes(optimizedTerm.toLowerCase()) ||
                // También verificar palabras individuales (para términos de múltiples palabras)
                originalTerm.toLowerCase().split(/\s+/).some(word => 
                  word.length > 2 && titleLower.includes(word.toLowerCase())
                )
              );
            };
            
            // Interface para los resultados
            interface ProductResult {
              productName: string;
              price: number;
              store: string;
              url: string;
              imageUrl: string;
              availability: boolean;
              matchesSearch: boolean;
              timestamp: Date;
            }
            
            // Lista para almacenar los productos encontrados
            const results: ProductResult[] = [];
            
            // 1. Primera estrategia: buscar elementos con clase product-item
            document.querySelectorAll('.product-item, .product').forEach(item => {
              // Extraer información del producto
              const titleEl = item.querySelector('.product-title, .title, h2, h3, [class*="title"]');
              const title = titleEl && titleEl.textContent ? titleEl.textContent.trim() : '';
              
              const priceEl = item.querySelector('.product-price, .price, [class*="price"]');
              const priceText = priceEl && priceEl.textContent ? priceEl.textContent.trim() : '';
              const priceInfo = extractPrice(priceText);
              
              const img = item.querySelector('img');
              const link = item.querySelector('a');
              
              const storeEl = item.querySelector('.store-name, .merchant, .vendor');
              const store = storeEl && storeEl.textContent ? storeEl.textContent.trim() : 'Precialo';
              
              // Solo incluir si tiene título y precio
              if (title && priceInfo) {
                results.push({
                  productName: title,
                  price: priceInfo.value,
                  store,
                  url: link && 'href' in link ? link.href : window.location.href,
                  imageUrl: img && 'src' in img ? img.src : '',
                  availability: true,
                  matchesSearch: matchesSearchTerms(title),
                  timestamp: new Date()
                });
              }
            });
            
            // 2. Segunda estrategia: buscar divs que contengan precio
            if (results.length === 0) {
              // Buscar elementos que contengan precio
              Array.from(document.querySelectorAll('div, article, section'))
                .filter(el => {
                  const text = el.textContent || '';
                  return text.includes('$') && text.length < 500; // Textos no muy largos
                })
                .forEach(el => {
                  // Verificar si es probable que sea un producto
                  const text = el.textContent || '';
                  const priceInfo = extractPrice(text);
                  const img = el.querySelector('img');
                  
                  // Buscar un posible título
                  let title = '';
                  
                  // Primera opción: buscar en elementos hijos
                  const headings = el.querySelectorAll('h1, h2, h3, h4, h5, h6, .title, [class*="title"]');
                  if (headings.length > 0 && headings[0].textContent) {
                    title = headings[0].textContent.trim();
                  }
                  
                  // Segunda opción: buscar el primer texto que no sea el precio
                  if (!title) {
                    // Obtener todos los nodos de texto
                    const walker = document.createTreeWalker(
                      el, NodeFilter.SHOW_TEXT, null
                    );
                    
                    let node: Node | null;
                    while ((node = walker.nextNode())) {
                      const nodeText = node.textContent ? node.textContent.trim() : '';
                      if (nodeText && !nodeText.includes('$') && nodeText.length > 3) {
                        title = nodeText;
                        break;
                      }
                    }
                  }
                  
                  // Solo incluir si tiene título, precio e imagen
                  if (title && priceInfo && img) {
                    results.push({
                      productName: title,
                      price: priceInfo.value,
                      store: 'Precialo',
                      url: el.querySelector('a') && 'href' in el.querySelector('a')! ? 
                           (el.querySelector('a') as HTMLAnchorElement).href : window.location.href,
                      imageUrl: img && 'src' in img ? img.src : '',
                      availability: true,
                      matchesSearch: matchesSearchTerms(title),
                      timestamp: new Date()
                    });
                  }
                });
            }
            
            return results;
          }, { originalTerm: query, optimizedTerm: optimizedQuery });
          
          console.log(`[Precialo] Productos encontrados: ${products.length}`);
          
          // Procesar URLs relativas
          const processedProducts = products.map(product => ({
            ...product,
            url: product.url.startsWith('http') ? product.url : `${this.serviceUrl}${product.url.startsWith('/') ? '' : '/'}${product.url}`,
            imageUrl: product.imageUrl.startsWith('http') ? product.imageUrl : `${this.serviceUrl}${product.imageUrl.startsWith('/') ? '' : '/'}${product.imageUrl}`
          }));
          
          // Filtrar duplicados basados en el nombre del producto
          const uniqueProducts = processedProducts.filter((product, index, self) => 
            index === self.findIndex(p => p.productName === product.productName)
          );
          
          // Ordenar productos poniendo primero los que coinciden con la búsqueda
          const sortedProducts = uniqueProducts.sort((a, b) => {
            // Primero por coincidencia con la búsqueda
            if (a.matchesSearch && !b.matchesSearch) return -1;
            if (!a.matchesSearch && b.matchesSearch) return 1;
            // Luego por precio (menor primero)
            return a.price - b.price;
          });
          
          // Aplicar filtros según las opciones
          let filteredResults = sortedProducts;
          
          if (options?.exactMatch) {
            const queryLower = query.toLowerCase();
            filteredResults = filteredResults.filter(r => 
              r.productName.toLowerCase().includes(queryLower)
            );
          }
          
          if (options?.maxResults) {
            filteredResults = filteredResults.slice(0, options.maxResults);
          }
          
          // Loguear para debugging
          if (filteredResults.length > 0) {
            console.log(`[Precialo] Primer resultado: "${filteredResults[0].productName}" - ${filteredResults[0].price}`);
            console.log(`[Precialo] Último resultado: "${filteredResults[filteredResults.length-1].productName}" - ${filteredResults[filteredResults.length-1].price}`);
          }
          
          return filteredResults;
        } catch (error) {
          console.error(`[Precialo] Error durante el scraping: ${error}`);
          throw error;
        } finally {
          await browser.close();
        }
      });
    } catch (error) {
      console.error(`Error buscando en ${this.serviceName}:`, error);
      return [];
    }
  }
}

export default new PrecialoService(); 