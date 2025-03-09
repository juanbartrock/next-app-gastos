/**
 * Parser específico para Movistar (operador móvil argentino)
 */
import * as cheerio from 'cheerio';
import { PromotionResult } from '../../types';
import { parsePrice, calculateDiscountPercentage } from '../../lib/parser';

/**
 * Extrae información de planes móviles de Movistar
 */
export function movistarParsePlans(html: string): PromotionResult[] {
  const $ = cheerio.load(html);
  const results: PromotionResult[] = [];
  
  // Movistar suele tener los planes en tarjetas o contenedores específicos
  const planContainers = $('.tarjeta-plan, .card-plan, .plan-item, .plan, .tarifa, [data-plan], .card');
  
  if (planContainers.length === 0) {
    // Si no encontramos contenedores específicos, buscar elementos que contengan precios
    console.warn('No se encontraron contenedores de planes específicos de Movistar, intentando con selectores generales');
    
    // Buscar elementos que puedan contener precios
    $('div, section, article').each((_, element) => {
      const el = $(element);
      const text = el.text();
      
      // Buscar patrones como "$XXXX" o "$ XX.XXX" (patrones de precio)
      if (/\$\s*[\d\.,]+/i.test(text)) {
        try {
          // Extraer nombre del plan
          let planName = '';
          
          // Buscar un encabezado cercano
          const heading = el.find('h1, h2, h3, h4, .plan-title, .title, .nombre-plan').first();
          if (heading.length > 0) {
            planName = heading.text().trim();
          }
          
          // Si no hay encabezado, intentar extraer información del texto
          if (!planName) {
            // Buscar textos como "Plan XXX" o "Hasta XX GB" o "XXX GB"
            const planMatch = text.match(/plan\s+([^\$]+?)(\s+con|\s*\$|$)/i);
            const gbMatch = text.match(/(\d+)\s*GB/i);
            
            if (planMatch) {
              planName = planMatch[1].trim();
            } else if (gbMatch) {
              planName = `${gbMatch[1]}GB`;
            } else if (text.toLowerCase().includes('prepago')) {
              planName = 'Prepago';
            } else {
              planName = 'Plan móvil';
            }
          }
          
          // Extraer precio
          const priceMatches = text.match(/\$\s*([\d\.,]+)/i);
          if (priceMatches && priceMatches[1]) {
            const price = parsePrice(priceMatches[0]);
            
            if (price) {
              // Extraer características principales
              const features: string[] = [];
              
              // Buscar cantidad de datos
              const gbMatch = text.match(/(\d+)\s*GB/i);
              if (gbMatch) {
                features.push(`${gbMatch[1]} GB de datos`);
              }
              
              // Buscar minutos/llamadas
              if (text.toLowerCase().includes('llamadas ilimitadas') || 
                  text.toLowerCase().includes('minutos ilimitados')) {
                features.push('Llamadas ilimitadas');
              }
              
              // Buscar SMS
              if (text.toLowerCase().includes('sms ilimitados')) {
                features.push('SMS ilimitados');
              }
              
              // Buscar redes sociales ilimitadas
              if (text.toLowerCase().includes('redes sociales') || 
                  text.toLowerCase().includes('redes ilimitadas')) {
                features.push('Redes sociales ilimitadas');
              }
              
              // Buscar aplicaciones específicas
              const apps = ['whatsapp', 'facebook', 'instagram', 'twitter', 'tiktok', 'youtube'];
              for (const app of apps) {
                if (text.toLowerCase().includes(app)) {
                  features.push(`${app.charAt(0).toUpperCase() + app.slice(1)} incluido`);
                }
              }
              
              // Si no encontramos características, usar un texto genérico
              const description = features.length > 0 
                ? features.join('. ')
                : `Plan móvil de Movistar por ${price} pesos mensuales`;
              
              // Crear resultado
              const promotion: PromotionResult = {
                serviceName: 'movistar',
                title: `Plan Movistar ${planName}`,
                description,
                discountedPrice: price,
                url: 'https://www.movistar.com.ar/productos-y-servicios/movil/planes',
              };
              
              results.push(promotion);
            }
          }
        } catch (error) {
          console.error('Error al parsear posible plan de Movistar:', error);
        }
      }
    });
  } else {
    // Procesar los contenedores de planes encontrados
    planContainers.each((_, element) => {
      try {
        const el = $(element);
        
        // Extraer nombre del plan
        let planName = '';
        const titleEl = el.find('.nombre-plan, .plan-name, .title, h1, h2, h3, h4, [data-plan-name]').first();
        
        if (titleEl.length > 0) {
          planName = titleEl.text().trim();
        } else {
          // Buscar GB como identificador del plan
          const gbMatch = el.text().match(/(\d+)\s*GB/i);
          if (gbMatch) {
            planName = `${gbMatch[1]}GB`;
          } else if (el.text().toLowerCase().includes('prepago')) {
            planName = 'Prepago';
          } else {
            planName = 'Móvil';
          }
        }
        
        // Extraer precio
        const priceEl = el.find('.precio, .price, .plan-price, [data-price]').first();
        let price: number | undefined;
        
        if (priceEl.length > 0) {
          price = parsePrice(priceEl.text());
        } else {
          // Si no hay elemento específico, buscar en todo el texto
          const text = el.text();
          const priceMatches = text.match(/\$\s*([\d\.,]+)/i);
          
          if (priceMatches && priceMatches[0]) {
            price = parsePrice(priceMatches[0]);
          }
        }
        
        if (!price) {
          console.warn('No se pudo extraer precio para el plan:', planName);
          return; // Skip this plan
        }
        
        // Extraer características
        const features: string[] = [];
        el.find('li, .feature, .caracteristica, .beneficio, .detail').each((_, featureEl) => {
          const featureText = $(featureEl).text().trim();
          if (featureText && !featureText.includes('$')) {
            features.push(featureText);
          }
        });
        
        // Si no hay características, extraer información del texto completo
        if (features.length === 0) {
          const text = el.text();
          
          // Extraer GB
          const gbMatch = text.match(/(\d+)\s*GB/i);
          if (gbMatch) {
            features.push(`${gbMatch[1]} GB de datos`);
          }
          
          // Extraer llamadas ilimitadas
          if (text.toLowerCase().includes('llamadas ilimitadas') || 
              text.toLowerCase().includes('minutos ilimitados')) {
            features.push('Llamadas ilimitadas');
          }
          
          // Extraer SMS
          if (text.toLowerCase().includes('sms ilimitados')) {
            features.push('SMS ilimitados');
          }
          
          // Extraer redes sociales
          if (text.toLowerCase().includes('redes sociales') || 
              text.toLowerCase().includes('redes ilimitadas')) {
            features.push('Redes sociales ilimitadas');
          }
          
          // Buscar aplicaciones específicas
          const apps = ['whatsapp', 'facebook', 'instagram', 'twitter', 'tiktok', 'youtube'];
          for (const app of apps) {
            if (text.toLowerCase().includes(app)) {
              features.push(`${app.charAt(0).toUpperCase() + app.slice(1)} incluido`);
            }
          }
        }
        
        // Crear resultado
        const promotion: PromotionResult = {
          serviceName: 'movistar',
          title: `Plan Movistar ${planName}`,
          description: features.join('. '),
          discountedPrice: price,
          url: 'https://www.movistar.com.ar/productos-y-servicios/movil/planes',
        };
        
        results.push(promotion);
      } catch (error) {
        console.error('Error al parsear plan de Movistar:', error);
      }
    });
  }
  
  // Buscar promociones especiales
  $('.promocion, .promo, .oferta, .banner, .descuento, .discount').each((_, element) => {
    try {
      const el = $(element);
      const text = el.text();
      
      // Buscar descuentos o promociones
      const descuentoMatch = text.match(/(\d+)%\s*(?:de\s*)?(?:descuento|ahorro|off)/i);
      if (descuentoMatch) {
        const porcentaje = parseInt(descuentoMatch[1]);
        
        // Extraer posible precio con descuento
        let precioDescuento: number | undefined;
        const precioMatch = text.match(/\$\s*([\d\.,]+)/i);
        if (precioMatch) {
          precioDescuento = parsePrice(precioMatch[0]);
        }
        
        // Calcular precio original basado en el descuento
        let precioOriginal: number | undefined;
        if (precioDescuento && porcentaje > 0) {
          precioOriginal = precioDescuento / (1 - porcentaje/100);
        }
        
        // Determinar tipo de promoción
        let title = '';
        if (text.match(/port\w+/i)) {
          title = `Promoción Movistar: ${porcentaje}% para portabilidad`;
        } else if (text.match(/online|web|digital/i)) {
          title = `Promoción Movistar: ${porcentaje}% comprando online`;
        } else {
          title = `Promoción Movistar: ${porcentaje}% de descuento`;
        }
        
        const promotion: PromotionResult = {
          serviceName: 'movistar',
          title,
          description: text.replace(/\s+/g, ' ').trim().substr(0, 200) + '...',
          discountedPrice: precioDescuento || 0,
          originalPrice: precioOriginal,
          discountPercentage: porcentaje,
          url: 'https://www.movistar.com.ar/productos-y-servicios/movil/planes',
        };
        
        results.push(promotion);
      }
    } catch (error) {
      console.error('Error al parsear promoción de Movistar:', error);
    }
  });
  
  // Eliminar duplicados basados en título y precio
  const uniqueResults: PromotionResult[] = [];
  const titlePriceSet = new Set<string>();
  
  for (const result of results) {
    const key = `${result.title}-${result.discountedPrice}`;
    if (!titlePriceSet.has(key)) {
      titlePriceSet.add(key);
      uniqueResults.push(result);
    }
  }
  
  return uniqueResults;
}

/**
 * Función principal que combina los resultados
 */
export function parseOffers(html: string): PromotionResult[] {
  return movistarParsePlans(html);
} 