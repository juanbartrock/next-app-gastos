/**
 * Parser específico para Netflix
 */
import * as cheerio from 'cheerio';
import { PromotionResult } from '../../types';
import { parsePrice, extractText, calculateDiscountPercentage } from '../../lib/parser';

/**
 * Extrae información de planes de Netflix desde el HTML
 */
export function parseNetflixPlans(html: string): PromotionResult[] {
  const $ = cheerio.load(html);
  const results: PromotionResult[] = [];
  
  // Seleccionar tabla de planes o contenedor de planes
  const planContainers = $('.plan-card');
  
  if (planContainers.length === 0) {
    // Intentar con otros selectores comunes de Netflix
    const altPlanContainers = $('.nf-pb-plan');
    
    if (altPlanContainers.length === 0) {
      // No encontramos planes, podría ser una estructura diferente o bloqueo
      console.warn('No se encontraron contenedores de planes de Netflix');
      return results;
    }
  }
  
  // Extraer información de cada plan
  $('.plan-card, .nf-pb-plan').each((_, element) => {
    try {
      const el = $(element);
      
      // Extraer nombre del plan
      const planName = el.find('.plan-name, .nf-pb-plan-name').first().text().trim();
      
      // Extraer precio
      const priceText = el.find('.plan-price, .nf-pb-price').first().text().trim();
      const price = parsePrice(priceText);
      
      if (!planName || !price) {
        console.warn('Plan incompleto, falta nombre o precio');
        return; // Equivalente a continue en un bucle each
      }
      
      // Extraer características/descripción
      const features: string[] = [];
      el.find('.plan-feature, .nf-pb-feature').each((_, featureEl) => {
        features.push($(featureEl).text().trim());
      });
      
      // Crear resultado
      const promotion: PromotionResult = {
        serviceName: 'netflix',
        title: `Plan Netflix ${planName}`,
        description: features.join('. '),
        discountedPrice: price,
        url: 'https://www.netflix.com/ar/browse/plan-selector',
      };
      
      results.push(promotion);
    } catch (error) {
      console.error('Error al parsear plan de Netflix:', error);
    }
  });
  
  return results;
}

/**
 * Parsea promociones especiales de Netflix desde su página de ayuda
 */
export function parseNetflixPromotions(html: string): PromotionResult[] {
  const $ = cheerio.load(html);
  const results: PromotionResult[] = [];
  
  // Buscar secciones de promociones o ofertas
  const promotionSections = $('.promotion-section, .offer-section, .help-content');
  
  if (promotionSections.length === 0) {
    console.warn('No se encontraron secciones de promociones en Netflix');
    return results;
  }
  
  // Analizar contenido para encontrar posibles promociones
  promotionSections.each((_, section) => {
    const sectionEl = $(section);
    
    // Buscar encabezados que puedan indicar promociones
    sectionEl.find('h1, h2, h3').each((_, heading) => {
      const headingText = $(heading).text().trim();
      
      // Verificar si el encabezado menciona promociones, ofertas, etc.
      if (/promoci[oóò]n|oferta|descuento|especial/i.test(headingText)) {
        // Obtener el párrafo siguiente que puede contener detalles
        const description = $(heading).next('p').text().trim();
        
        if (description) {
          // Buscar precios en la descripción
          const priceMatches = description.match(/\$\s*[\d\.,]+/g);
          let originalPrice: number | undefined;
          let discountedPrice: number | undefined;
          
          if (priceMatches && priceMatches.length >= 1) {
            // Si hay al menos un precio, asumimos que es el precio promocional
            discountedPrice = parsePrice(priceMatches[0]);
            
            // Si hay dos precios, el segundo podría ser el original
            if (priceMatches.length >= 2) {
              originalPrice = parsePrice(priceMatches[1]);
              
              // Si el original es menor que el promocional, intercambiarlos
              if (originalPrice && discountedPrice && originalPrice < discountedPrice) {
                [originalPrice, discountedPrice] = [discountedPrice, originalPrice];
              }
            }
          }
          
          // Calcular porcentaje de descuento si tenemos ambos precios
          let discountPercentage: number | undefined;
          if (originalPrice && discountedPrice) {
            discountPercentage = calculateDiscountPercentage(originalPrice, discountedPrice);
          }
          
          // Crear resultado de promoción
          const promotion: PromotionResult = {
            serviceName: 'netflix',
            title: headingText,
            description: description,
            originalPrice,
            discountedPrice: discountedPrice || 0, // Si no encontramos precio, ponemos 0
            discountPercentage,
            url: 'https://help.netflix.com/es-es/node/24926'
          };
          
          results.push(promotion);
        }
      }
    });
  });
  
  return results;
}

/**
 * Función principal que combina los resultados de ambos parsers
 */
export function parseNetflixOffers(plansHtml: string, promosHtml: string): PromotionResult[] {
  const planResults = parseNetflixPlans(plansHtml);
  const promoResults = parseNetflixPromotions(promosHtml);
  
  return [...planResults, ...promoResults];
} 