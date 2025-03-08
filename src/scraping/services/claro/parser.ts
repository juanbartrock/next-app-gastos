/**
 * Parser específico para Claro (operador móvil argentino)
 */
import * as cheerio from 'cheerio';
import { PromotionResult } from '../../types';
import { parsePrice, calculateDiscountPercentage } from '../../lib/parser';

/**
 * Extrae información de planes móviles de Claro
 */
export function claroParsePlans(html: string): PromotionResult[] {
  const $ = cheerio.load(html);
  const results: PromotionResult[] = [];
  
  // Claro suele tener los planes en contenedores o tarjetas
  const planContainers = $('.plan-card, .card-plan, .plan, .card, .oferta, [data-plan], .product-card');
  
  if (planContainers.length === 0) {
    // Si no encontramos contenedores específicos, buscar elementos que contengan precios
    console.warn('No se encontraron contenedores de planes específicos de Claro, intentando con selectores generales');
    
    // Buscar elementos que puedan contener precios
    $('div, section, article').each((_, element) => {
      const el = $(element);
      const text = el.text();
      
      // Buscar patrones como "$XXXX" o "$ XX.XXX"
      if (/\$\s*[\d\.,]+/i.test(text)) {
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
            // Buscar textos como "XX GB" o "Prepago XX GB"
            const gbMatch = text.match(/(\d+)\s*GB/i);
            if (gbMatch) {
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
              if (text.toLowerCase().includes('ilimitad') && 
                  (text.toLowerCase().includes('llamad') || text.toLowerCase().includes('minut'))) {
                features.push('Llamadas ilimitadas');
              }
              
              // Buscar SMS
              if (text.toLowerCase().includes('sms ilimitados')) {
                features.push('SMS ilimitados');
              }
              
              // Buscar aplicaciones incluidas
              ['whatsapp', 'instagram', 'facebook', 'twitter', 'tiktok'].forEach(app => {
                if (text.toLowerCase().includes(app)) {
                  features.push(`Incluye ${app}`);
                }
              });
              
              // Si es un plan con abono, mencionarlo
              if (text.toLowerCase().includes('abono')) {
                features.push('Plan con abono');
              }
              
              // Si no encontramos características, usar un texto genérico
              const description = features.length > 0 
                ? features.join('. ')
                : `Plan móvil de Claro por ${price} pesos mensuales`;
              
              // Crear resultado
              const promotion: PromotionResult = {
                serviceName: 'claro',
                title: `Plan Claro ${planName}`,
                description,
                discountedPrice: price,
                url: 'https://tienda.claro.com.ar/planes/planes-moviles',
              };
              
              results.push(promotion);
            }
          }
        } catch (error) {
          console.error('Error al parsear posible plan de Claro:', error);
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
        const titleEl = el.find('.plan-name, .name, .title, h1, h2, h3, h4, [data-plan-name]').first();
        
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
        const priceEl = el.find('.price, .precio, [data-price], .monto').first();
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
          
          // Extraer minutos
          if (text.toLowerCase().includes('ilimitad') && 
              (text.toLowerCase().includes('llamad') || text.toLowerCase().includes('minut'))) {
            features.push('Llamadas ilimitadas');
          }
          
          // Extraer SMS
          if (text.toLowerCase().includes('sms ilimitados')) {
            features.push('SMS ilimitados');
          }
          
          // Buscar aplicaciones incluidas
          ['whatsapp', 'instagram', 'facebook', 'twitter', 'tiktok'].forEach(app => {
            if (text.toLowerCase().includes(app)) {
              features.push(`Incluye ${app}`);
            }
          });
        }
        
        // Crear resultado
        const promotion: PromotionResult = {
          serviceName: 'claro',
          title: `Plan Claro ${planName}`,
          description: features.join('. '),
          discountedPrice: price,
          url: 'https://tienda.claro.com.ar/planes/planes-moviles',
        };
        
        results.push(promotion);
      } catch (error) {
        console.error('Error al parsear plan de Claro:', error);
      }
    });
  }
  
  // Buscar promociones especiales
  $('.promocion, .oferta, .offer, .banner, .promo, .discount').each((_, element) => {
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
        
        let title = '';
        if (text.match(/port\w+/i)) {
          title = `Promoción Claro: ${porcentaje}% para portabilidad`;
        } else {
          title = `Promoción Claro: ${porcentaje}% de descuento`;
        }
        
        const promotion: PromotionResult = {
          serviceName: 'claro',
          title,
          description: text.replace(/\s+/g, ' ').trim().substr(0, 200) + '...',
          discountedPrice: precioDescuento || 0,
          originalPrice: precioOriginal,
          discountPercentage: porcentaje,
          url: 'https://tienda.claro.com.ar/planes/planes-moviles',
        };
        
        results.push(promotion);
      }
    } catch (error) {
      console.error('Error al parsear promoción de Claro:', error);
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
  return claroParsePlans(html);
} 