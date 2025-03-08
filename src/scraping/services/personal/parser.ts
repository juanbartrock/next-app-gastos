/**
 * Parser específico para Personal (operador móvil argentino)
 */
import * as cheerio from 'cheerio';
import { PromotionResult } from '../../types';
import { parsePrice, calculateDiscountPercentage } from '../../lib/parser';

/**
 * Extrae información de planes móviles de Personal
 */
export function parsePersonalPlans(html: string): PromotionResult[] {
  const $ = cheerio.load(html);
  const results: PromotionResult[] = [];
  
  // Personal suele tener los planes en contenedores o tarjetas
  const planContainers = $('.plan-card, .plan-container, .plan, .card, .tarjeta-plan, [data-plan]');
  
  if (planContainers.length === 0) {
    // Si no encontramos contenedores específicos, buscar elementos que contengan precios
    console.warn('No se encontraron contenedores de planes específicos de Personal, intentando con selectores generales');
    
    // Buscar elementos que puedan contener precios
    $('div, section').each((_, element) => {
      const el = $(element);
      const text = el.text();
      
      // Buscar patrones como "$XXXX" o "$XX.XXX"
      if (/\$\s*[\d\.]+/.test(text)) {
        try {
          // Extraer nombre del plan
          let planName = '';
          
          // Buscar un encabezado cercano
          const heading = el.find('h1, h2, h3, h4, .plan-title, .title').first();
          if (heading.length > 0) {
            planName = heading.text().trim();
          }
          
          // Si no hay encabezado, intentar extraer información del texto
          if (!planName) {
            // Buscar textos como "Plan XXX" o "Plan con XXX GB"
            const planMatch = text.match(/plan\s+([^\$]+?)(\s+con|\s*\$|$)/i);
            if (planMatch) {
              planName = planMatch[1].trim();
            } else {
              // Intentar identificar si tiene GB o datos
              const gbMatch = text.match(/(\d+)\s*GB/i);
              if (gbMatch) {
                planName = `Plan ${gbMatch[1]}GB`;
              } else {
                planName = 'Plan móvil';
              }
            }
          }
          
          // Extraer precio
          const priceMatches = text.match(/\$\s*([\d\.]+)/);
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
              const minutesMatch = text.match(/(ilimitad[oa]s|sin límite|(\d+)\s*min)/i);
              if (minutesMatch) {
                if (minutesMatch[1].toLowerCase().includes('ilimitad') || 
                    minutesMatch[1].toLowerCase().includes('sin límite')) {
                  features.push('Llamadas ilimitadas');
                } else if (minutesMatch[2]) {
                  features.push(`${minutesMatch[2]} minutos en llamadas`);
                }
              }
              
              // Buscar SMS
              const smsMatch = text.match(/(SMS ilimitados|(\d+)\s*SMS)/i);
              if (smsMatch) {
                if (smsMatch[1].toLowerCase().includes('ilimitados')) {
                  features.push('SMS ilimitados');
                } else if (smsMatch[2]) {
                  features.push(`${smsMatch[2]} SMS incluidos`);
                }
              }
              
              // Buscar redes sociales
              if (/whatsapp|instagram|facebook|twitter|tiktok/i.test(text)) {
                features.push('Incluye redes sociales');
              }
              
              // Si no encontramos características, usar un texto genérico
              const description = features.length > 0 
                ? features.join('. ')
                : `Plan móvil de Personal por ${price} pesos mensuales`;
              
              // Crear resultado
              const promotion: PromotionResult = {
                serviceName: 'personal',
                title: `Plan Personal ${planName}`,
                description,
                discountedPrice: price,
                url: 'https://www.personal.com.ar/planes/movil',
              };
              
              results.push(promotion);
            }
          }
        } catch (error) {
          console.error('Error al parsear posible plan de Personal:', error);
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
        const titleEl = el.find('.plan-title, .title, h1, h2, h3, h4, [data-plan-name]').first();
        
        if (titleEl.length > 0) {
          planName = titleEl.text().trim();
        } else {
          // Buscar GB como identificador del plan
          const gbMatch = el.text().match(/(\d+)\s*GB/i);
          if (gbMatch) {
            planName = `${gbMatch[1]}GB`;
          } else {
            planName = 'Móvil';
          }
        }
        
        // Extraer precio
        const priceEl = el.find('.price, .precio, [data-price]').first();
        let price: number | undefined;
        
        if (priceEl.length > 0) {
          price = parsePrice(priceEl.text());
        } else {
          // Si no hay elemento específico, buscar en todo el texto
          const text = el.text();
          const priceMatches = text.match(/\$\s*([\d\.]+)/);
          
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
        el.find('li, .feature, .caracteristica, .beneficio').each((_, featureEl) => {
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
          
          // Extraer minutos
          if (text.match(/minutos ilimitados|llamadas ilimitadas/i)) {
            features.push('Llamadas ilimitadas');
          }
          
          // Extraer SMS
          if (text.match(/SMS ilimitados/i)) {
            features.push('SMS ilimitados');
          }
          
          // Extraer redes sociales
          if (text.match(/redes sociales|apps incluidas/i)) {
            features.push('Incluye redes sociales');
          }
        }
        
        // Crear resultado
        const promotion: PromotionResult = {
          serviceName: 'personal',
          title: `Plan Personal ${planName}`,
          description: features.join('. '),
          discountedPrice: price,
          url: 'https://www.personal.com.ar/planes/movil',
        };
        
        results.push(promotion);
      } catch (error) {
        console.error('Error al parsear plan de Personal:', error);
      }
    });
  }
  
  // Buscar promociones especiales
  $('.promocion, .oferta, .banner, .promo').each((_, element) => {
    try {
      const el = $(element);
      const text = el.text();
      
      // Buscar descuentos o promociones
      const descuentoMatch = text.match(/(\d+)%\s*(?:de\s*)?(?:descuento|ahorro|off)/i);
      if (descuentoMatch) {
        const porcentaje = parseInt(descuentoMatch[1]);
        
        // Extraer posible precio con descuento
        let precioDescuento: number | undefined;
        const precioMatch = text.match(/\$\s*([\d\.]+)/);
        if (precioMatch) {
          precioDescuento = parsePrice(precioMatch[0]);
        }
        
        // Calcular precio original basado en el descuento
        let precioOriginal: number | undefined;
        if (precioDescuento && porcentaje > 0) {
          precioOriginal = precioDescuento / (1 - porcentaje/100);
        }
        
        const titleMatch = text.match(/(?:promo|oferta|descuento)\s+([^$.\n]+)/i);
        const title = titleMatch 
          ? `Promoción Personal: ${titleMatch[1].trim()}` 
          : `Promoción Personal: ${porcentaje}% de descuento`;
        
        const promotion: PromotionResult = {
          serviceName: 'personal',
          title,
          description: text.replace(/\s+/g, ' ').trim().substr(0, 200) + '...',
          discountedPrice: precioDescuento || 0,
          originalPrice: precioOriginal,
          discountPercentage: porcentaje,
          url: 'https://www.personal.com.ar/planes/movil',
        };
        
        results.push(promotion);
      }
    } catch (error) {
      console.error('Error al parsear promoción de Personal:', error);
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
export function parsePersonalOffers(html: string): PromotionResult[] {
  return parsePersonalPlans(html);
} 