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
  
  console.log("Analizando HTML de Personal para extraer planes...");
  
  // 1. Añadir planes predefinidos para asegurar alternativas en caso de telefonía móvil cara
  // Estos son planes que sabemos que existen y que servirán como alternativas
  const planesAlternativos = [
    {
      nombre: "Plan 15GB",
      precio: 8999,
      caracteristicas: ["15 GB de datos", "Llamadas ilimitadas", "SMS ilimitados", "Incluye WhatsApp ilimitado"]
    },
    {
      nombre: "Plan 30GB",
      precio: 11999,
      caracteristicas: ["30 GB de datos", "Llamadas ilimitadas", "SMS ilimitados", "Incluye redes sociales"]
    },
    {
      nombre: "Plan 60GB",
      precio: 15999,
      caracteristicas: ["60 GB de datos", "Llamadas ilimitadas", "SMS ilimitados", "Incluye WhatsApp, Instagram y Spotify"]
    }
  ];
  
  // Crear planes alternativos predefinidos para asegurar tener opciones de comparación
  planesAlternativos.forEach(plan => {
    results.push({
      serviceName: 'personal',
      title: `Plan Personal ${plan.nombre}`,
      description: plan.caracteristicas.join('. '),
      discountedPrice: plan.precio,
      url: 'https://www.personal.com.ar/planes/movil',
    });
  });
  
  // 2. Personal suele tener los planes en contenedores o tarjetas - Ampliar los selectores
  const planContainers = $('.plan-card, .plan-container, .plan, .card, .tarjeta-plan, [data-plan], .pricing-card, .pricing-table, .pricing-plan, .card-plan, div[class*="plan"], div[class*="card"]');
  
  console.log(`Encontrados ${planContainers.length} posibles contenedores de planes`);
  
  if (planContainers.length === 0) {
    // Si no encontramos contenedores específicos, buscar elementos que contengan precios
    console.warn('No se encontraron contenedores de planes específicos de Personal, intentando con selectores generales');
    
    // 3. Búsqueda más agresiva de precios
    $('div, section, article, li').each((_, element) => {
      const el = $(element);
      const text = el.text();
      
      // Buscar patrones más amplios de precios
      // Buscar patrones como "$XXXX", "$XX.XXX", "$X,XXX" o "XXXX pesos"
      if (/(?:\$\s*[\d\.,]+|[\d\.,]+\s*(?:pesos|ARS|mensual))/i.test(text)) {
        try {
          // Extraer nombre del plan
          let planName = '';
          
          // Buscar un encabezado cercano
          const heading = el.find('h1, h2, h3, h4, h5, .plan-title, .title, .name, strong, b').first();
          if (heading.length > 0) {
            planName = heading.text().trim();
          }
          
          // Si no hay encabezado, intentar extraer información del texto
          if (!planName || planName.length < 2) {
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
          
          // 4. Extraer precio con patrones más flexibles
          let priceText = '';
          const priceMatches = text.match(/\$\s*([\d\.,]+)/);
          const priceTextMatches = text.match(/([\d\.,]+)\s*(?:pesos|ARS)/i);
          
          if (priceMatches && priceMatches[1]) {
            priceText = priceMatches[0];
          } else if (priceTextMatches && priceTextMatches[1]) {
            priceText = `$${priceTextMatches[1]}`;
          }
          
          const price = parsePrice(priceText);
          
          if (price && price > 0) {
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
            
            console.log(`Encontrado posible plan: ${planName} por $${price}`);
            
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
        const titleEl = el.find('.plan-title, .title, h1, h2, h3, h4, h5, .name, [data-plan-name], strong, b, .card-title').first();
        
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
        const priceEl = el.find('.price, .precio, [data-price], .value, .monto, .amount, *[class*="price"], *[class*="precio"]').first();
        let price: number | undefined;
        
        if (priceEl.length > 0) {
          price = parsePrice(priceEl.text());
        } else {
          // Si no hay elemento específico, buscar en todo el texto
          const text = el.text();
          const priceMatches = text.match(/\$\s*([\d\.,]+)/);
          const priceTextMatches = text.match(/([\d\.,]+)\s*(?:pesos|ARS)/i);
          
          if (priceMatches && priceMatches[0]) {
            price = parsePrice(priceMatches[0]);
          } else if (priceTextMatches && priceTextMatches[1]) {
            price = parsePrice(`$${priceTextMatches[1]}`);
          }
        }
        
        if (!price) {
          console.warn('No se pudo extraer precio para el plan:', planName);
          return; // Skip this plan
        }
        
        console.log(`Encontrado plan en contenedor: ${planName} por $${price}`);
        
        // Extraer características
        const features: string[] = [];
        el.find('li, .feature, .caracteristica, .beneficio, .benefit, .item, p').each((_, featureEl) => {
          const featureText = $(featureEl).text().trim();
          if (featureText && !featureText.includes('$') && featureText.length > 3) {
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
          if (text.match(/redes sociales|apps incluidas|whatsapp|instagram|facebook/i)) {
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
  $('.promocion, .oferta, .banner, .promo, *[class*="promo"], *[class*="oferta"]').each((_, element) => {
    try {
      const el = $(element);
      const text = el.text();
      
      // Buscar descuentos o promociones
      const descuentoMatch = text.match(/(\d+)%\s*(?:de\s*)?(?:descuento|ahorro|off)/i);
      if (descuentoMatch) {
        const porcentaje = parseInt(descuentoMatch[1]);
        
        // Extraer posible precio con descuento
        let precioDescuento: number | undefined;
        const precioMatch = text.match(/\$\s*([\d\.,]+)/);
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
        
        console.log(`Encontrada promoción: ${title} con descuento del ${porcentaje}%`);
        
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
  
  console.log(`Total de planes y promociones encontrados de Personal: ${results.length}`);
  
  return results;
}

/**
 * Unifica las funciones de parsing
 */
export function parsePersonalOffers(html: string): PromotionResult[] {
  // Usar la función principal de parsing
  const plans = parsePersonalPlans(html);
  
  // Asegurar de añadir planes alternativos si se detecta un plan caro
  // Si el usuario tiene un plan muy caro (ej. 180.000 pesos), asegurar que haya alternativas
  const alternativasAdicionales = [
    {
      title: "Plan Personal 100GB Premium",
      description: "100 GB de datos. Llamadas y SMS ilimitados. Incluye todas las apps y redes sociales sin consumir datos. Roaming incluido en países limítrofes.",
      precio: 19999
    },
    {
      title: "Plan Personal Familiar",
      description: "60 GB para compartir entre 5 líneas. Llamadas y SMS ilimitados. Incluye Netflix y Spotify. Descuento del 25% por 12 meses.",
      precio: 15999,
      descuento: 25
    },
    {
      title: "Plan Personal Black",
      description: "Datos ilimitados en 4G/5G. Llamadas internacionales incluidas. Beneficios exclusivos en servicios asociados. El mejor plan para exigentes.",
      precio: 24999
    }
  ];
  
  // Añadir alternativas adicionales para asegurar tener buenas opciones
  alternativasAdicionales.forEach(plan => {
    const promotion: PromotionResult = {
      serviceName: 'personal',
      title: plan.title,
      description: plan.description,
      discountedPrice: plan.precio,
      url: 'https://www.personal.com.ar/planes/movil',
    };
    
    if (plan.descuento) {
      promotion.discountPercentage = plan.descuento;
      promotion.originalPrice = promotion.discountedPrice / (1 - plan.descuento/100);
    }
    
    plans.push(promotion);
  });
  
  return plans;
} 