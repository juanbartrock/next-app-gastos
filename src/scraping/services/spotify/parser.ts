/**
 * Parser específico para Spotify
 */
import * as cheerio from 'cheerio';
import { PromotionResult } from '../../types';
import { parsePrice, calculateDiscountPercentage } from '../../lib/parser';

/**
 * Extrae información de planes de Spotify Premium desde el HTML
 */
export function parseSpotifyPlans(html: string): PromotionResult[] {
  const $ = cheerio.load(html);
  const results: PromotionResult[] = [];
  
  // Spotify suele tener los planes en contenedores con clase plan o card
  const planContainers = $('.plan-card, .premium-plan, .plan, .card, [data-qa="plan"]');
  
  if (planContainers.length === 0) {
    // Intentar con selectores más generales si no encontramos planes específicos
    console.warn('No se encontraron contenedores de planes específicos de Spotify, intentando con selectores generales');
    
    // Buscar elementos que puedan contener precios
    $('div, section').each((_, element) => {
      const el = $(element);
      const text = el.text();
      
      // Buscar patrones como "$ XX,XX por mes" o "$ XX.XX/mes"
      if (/\$\s*[\d\.,]+(?:\s*(?:por|\/)\s*mes)?/i.test(text)) {
        try {
          // Extraer nombre del plan
          let planName = '';
          
          // Buscar un encabezado cercano que podría ser el nombre del plan
          const heading = el.find('h1, h2, h3, h4, .plan-title, .title').first();
          if (heading.length > 0) {
            planName = heading.text().trim();
          }
          
          // Si no encontramos un nombre, intentar extraer de clases o IDs
          if (!planName) {
            const classAttr = el.attr('class') || '';
            const idAttr = el.attr('id') || '';
            
            if (classAttr.includes('individual') || idAttr.includes('individual')) {
              planName = 'Individual';
            } else if (classAttr.includes('duo') || idAttr.includes('duo')) {
              planName = 'Duo';
            } else if (classAttr.includes('familiar') || classAttr.includes('family') || 
                      idAttr.includes('familiar') || idAttr.includes('family')) {
              planName = 'Familiar';
            } else if (classAttr.includes('student') || classAttr.includes('estudiante') || 
                      idAttr.includes('student') || idAttr.includes('estudiante')) {
              planName = 'Estudiante';
            }
          }
          
          // Extraer precio
          const priceMatches = text.match(/\$\s*([\d\.,]+)/);
          if (priceMatches && priceMatches[1]) {
            const price = parsePrice(priceMatches[0]);
            
            if (price && planName) {
              // Extraer características/descripción
              const features: string[] = [];
              
              // Buscar elementos que podrían ser características
              el.find('li, .feature, .benefit').each((_, featureEl) => {
                const featureText = $(featureEl).text().trim();
                if (featureText && !featureText.includes('$')) {
                  features.push(featureText);
                }
              });
              
              // Si no encontramos características, usar el texto completo como descripción
              const description = features.length > 0 
                ? features.join('. ')
                : text.replace(/\s+/g, ' ').trim();
              
              // Crear resultado
              const promotion: PromotionResult = {
                serviceName: 'spotify',
                title: `Plan Spotify Premium ${planName}`,
                description,
                discountedPrice: price,
                url: 'https://www.spotify.com/ar/premium/',
              };
              
              results.push(promotion);
            }
          }
        } catch (error) {
          console.error('Error al parsear posible plan de Spotify:', error);
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
        const titleEl = el.find('.plan-title, .title, h1, h2, h3, h4').first();
        
        if (titleEl.length > 0) {
          planName = titleEl.text().trim();
        } else {
          // Si no hay título, intentar extraer del contenedor
          planName = el.attr('data-plan-name') || 
                    el.attr('data-qa') || 
                    el.attr('class') || 
                    'Premium';
          
          // Limpiar el nombre
          planName = planName
            .replace(/-/g, ' ')
            .replace(/(plan|card|spotify|premium)/gi, '')
            .trim() || 'Premium';
        }
        
        // Extraer precio
        const priceEl = el.find('.price, .plan-price, [data-qa="price"]').first();
        let price: number | undefined;
        
        if (priceEl.length > 0) {
          price = parsePrice(priceEl.text());
        } else {
          // Si no hay elemento de precio específico, buscar en todo el texto
          const text = el.text();
          const priceMatches = text.match(/\$\s*([\d\.,]+)/);
          
          if (priceMatches && priceMatches[0]) {
            price = parsePrice(priceMatches[0]);
          }
        }
        
        if (!price) {
          console.warn('No se pudo extraer precio para el plan:', planName);
          return; // Equivalente a continue
        }
        
        // Extraer características/descripción
        const features: string[] = [];
        el.find('li, .feature, .benefit, .plan-feature').each((_, featureEl) => {
          const featureText = $(featureEl).text().trim();
          if (featureText && !featureText.includes('$')) {
            features.push(featureText);
          }
        });
        
        // Crear resultado
        const promotion: PromotionResult = {
          serviceName: 'spotify',
          title: `Plan Spotify Premium ${planName}`,
          description: features.join('. '),
          discountedPrice: price,
          url: 'https://www.spotify.com/ar/premium/',
        };
        
        results.push(promotion);
      } catch (error) {
        console.error('Error al parsear plan de Spotify:', error);
      }
    });
  }
  
  // Si aún no hay resultados, intentar buscar promociones específicas
  if (results.length === 0) {
    // Buscar promociones como "3 meses gratis"
    $('div, section').each((_, element) => {
      const el = $(element);
      const text = el.text();
      
      // Buscar patrones como "X meses gratis" o "Prueba gratuita"
      if (/((\d+)\s+mes(?:es)?\s+gr[aá]tis|prueba\s+gratuita)/i.test(text)) {
        try {
          const match = text.match(/(\d+)\s+mes(?:es)?\s+gr[aá]tis/i);
          const months = match ? parseInt(match[1]) : 1;
          
          const promotion: PromotionResult = {
            serviceName: 'spotify',
            title: `Promoción Spotify Premium - ${months} ${months === 1 ? 'mes' : 'meses'} gratis`,
            description: `Prueba Spotify Premium durante ${months} ${months === 1 ? 'mes' : 'meses'} sin costo y luego paga el precio regular.`,
            discountedPrice: 0, // Gratis durante el período promocional
            url: 'https://www.spotify.com/ar/premium/',
          };
          
          results.push(promotion);
        } catch (error) {
          console.error('Error al parsear promoción gratuita de Spotify:', error);
        }
      }
    });
  }
  
  // Eliminar duplicados basados en el título
  const uniqueResults: PromotionResult[] = [];
  const titles = new Set<string>();
  
  for (const result of results) {
    if (!titles.has(result.title)) {
      titles.add(result.title);
      uniqueResults.push(result);
    }
  }
  
  return uniqueResults;
}

/**
 * Función principal que combina los resultados de todos los parsers
 */
export function parseSpotifyOffers(html: string): PromotionResult[] {
  return parseSpotifyPlans(html);
} 