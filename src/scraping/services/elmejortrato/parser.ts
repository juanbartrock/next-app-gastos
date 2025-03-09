/**
 * Parser para El Mejor Trato
 * 
 * Este parser maneja la extracción de información de diferentes categorías:
 * 1. Servicios tradicionales (internet, TV, telefonía)
 * 2. Obras sociales y prepagas
 * 3. Planes de ahorro y futuras inversiones
 */
import * as cheerio from 'cheerio';
import { PromotionResult } from '../../types';
import { parsePrice, extractText, extractDate } from '../../lib/parser';

/**
 * Parser principal para servicios como internet, TV, telefonía
 */
export function parseServicios(html: string, serviceType: string): PromotionResult[] {
  const $ = cheerio.load(html);
  const results: PromotionResult[] = [];
  
  // Identificar contenedores de servicios/planes
  const servicioContainers = $('.service-card, .service-item, .plan, .promotion').length > 0 
    ? $('.service-card, .service-item, .plan, .promotion')
    : $('div, article, section').filter((_, el) => {
        const $el = $(el);
        const text = $el.text();
        // Buscar elementos que tengan precio y alguna palabra clave de servicio
        return /\$\s*[\d\.,]+/i.test(text) && 
               /plan|servicio|promo|mega|mb|gb/i.test(text);
      });
  
  // Procesar cada contenedor encontrado
  servicioContainers.each((_, element) => {
    try {
      const el = $(element);
      
      // Extraer nombre del servicio
      let serviceName = '';
      const titleEl = el.find('h1, h2, h3, h4, .title, .name, .service-name').first();
      
      if (titleEl.length > 0) {
        serviceName = titleEl.text().trim();
      } else {
        // Intentar extraer nombres de proveedores comunes
        const text = el.text().toLowerCase();
        const providers = ['movistar', 'personal', 'claro', 'telecentro', 'fibertel', 'flow', 'directv', 'telecom'];
        
        for (const provider of providers) {
          if (text.includes(provider)) {
            serviceName = provider.charAt(0).toUpperCase() + provider.slice(1);
            break;
          }
        }
        
        // Si no se encontró un proveedor, usar el tipo de servicio
        if (!serviceName) {
          if (serviceType.includes('internet')) {
            serviceName = 'Internet';
          } else if (serviceType.includes('tv')) {
            serviceName = 'TV';
          } else if (serviceType.includes('telefonia')) {
            serviceName = 'Telefonía';
          } else {
            serviceName = 'Servicio';
          }
        }
      }
      
      // Extraer información del plan
      let planName = '';
      const planEl = el.find('.plan-name, .plan-type, .plan-title').first();
      
      if (planEl.length > 0) {
        planName = planEl.text().trim();
      } else {
        // Buscar información de velocidad de internet
        const mbMatch = el.text().match(/(\d+)\s*(?:mb|mbps|megas)/i);
        if (mbMatch) {
          planName = `${mbMatch[1]}Mbps`;
        } else {
          planName = 'Plan';
        }
      }
      
      // Extraer precio
      let price: number | undefined;
      const priceEl = el.find('.price, .cost, .monto, .valor').first();
      
      if (priceEl.length > 0) {
        price = parsePrice(priceEl.text());
      } else {
        // Buscar patrones de precio en todo el texto
        const text = el.text();
        const priceMatches = text.match(/\$\s*([\d\.,]+)/i);
        
        if (priceMatches && priceMatches[1]) {
          price = parsePrice(priceMatches[0]);
        }
      }
      
      if (!price) {
        console.warn('No se pudo extraer precio para el servicio:', serviceName, planName);
        return; // Omitir este servicio
      }
      
      // Extraer características/beneficios
      const features: string[] = [];
      el.find('li, .feature, .benefit, .caracteristica').each((_, featureEl) => {
        const featureText = $(featureEl).text().trim();
        if (featureText && !featureText.includes('$')) {
          features.push(featureText);
        }
      });
      
      // Si no se encontraron características estructuradas, extraer información del texto
      if (features.length === 0) {
        const text = el.text();
        
        // Velocidad de internet
        const mbMatch = text.match(/(\d+)\s*(?:mb|mbps|megas)/i);
        if (mbMatch) {
          features.push(`Velocidad de ${mbMatch[1]} Mbps`);
        }
        
        // Canales de TV
        const canalesMatch = text.match(/(\d+)\s*canales/i);
        if (canalesMatch) {
          features.push(`${canalesMatch[1]} canales`);
        }
        
        // HD
        if (/hd|alta definición/i.test(text)) {
          features.push('Incluye HD');
        }
        
        // WiFi
        if (/wifi|wi-fi/i.test(text)) {
          features.push('Incluye WiFi');
        }
      }
      
      // Extraer URL de detalle si existe
      let detailUrl = '';
      const linkEl = el.find('a').first();
      if (linkEl.length > 0) {
        const href = linkEl.attr('href');
        if (href) {
          detailUrl = href.startsWith('http') ? href : `https://www.elmejortrato.com.ar${href.startsWith('/') ? '' : '/'}${href}`;
        }
      }
      
      // Crear la promoción
      const promotion: PromotionResult = {
        serviceName: 'elmejortrato',
        title: `${serviceName} - ${planName}`,
        description: features.join('. '),
        discountedPrice: price,
        url: detailUrl || `https://www.elmejortrato.com.ar/${serviceType}`,
        originalPrice: undefined,
        discountPercentage: undefined
      };
      
      results.push(promotion);
    } catch (error) {
      console.error('Error al parsear servicio de El Mejor Trato:', error);
    }
  });
  
  return results;
}

/**
 * Parser para obras sociales y prepagas
 */
export function parseSalud(html: string, healthType: string): PromotionResult[] {
  const $ = cheerio.load(html);
  const results: PromotionResult[] = [];
  
  // Identificar contenedores de planes de salud
  const saludContainers = $('.health-plan, .prepaga-item, .obra-social').length > 0
    ? $('.health-plan, .prepaga-item, .obra-social')
    : $('div, article, section').filter((_, el) => {
        const $el = $(el);
        const text = $el.text();
        // Buscar elementos relacionados con salud que tengan precio
        return /\$\s*[\d\.,]+/i.test(text) && 
               /plan|cobertura|prepaga|obra social|salud/i.test(text);
      });
  
  saludContainers.each((_, element) => {
    try {
      const el = $(element);
      
      // Extraer nombre del proveedor de salud
      let providerName = '';
      const providerEl = el.find('h1, h2, h3, h4, .title, .name, .provider').first();
      
      if (providerEl.length > 0) {
        providerName = providerEl.text().trim();
      } else {
        // Intentar extraer nombres de proveedores comunes de salud
        const text = el.text().toLowerCase();
        const providers = ['osde', 'swiss medical', 'galeno', 'medifé', 'omint', 'accord', 'sancor'];
        
        for (const provider of providers) {
          if (text.includes(provider)) {
            providerName = provider.toUpperCase();
            break;
          }
        }
        
        if (!providerName) {
          providerName = healthType.includes('prepagas') ? 'Prepaga' : 'Obra Social';
        }
      }
      
      // Extraer nombre del plan
      let planName = '';
      const planEl = el.find('.plan-name, .plan-type, .plan').first();
      
      if (planEl.length > 0) {
        planName = planEl.text().trim();
      } else {
        // Buscar patrones comunes de planes
        const text = el.text();
        const planMatch = text.match(/plan\s+(\d+)/i) || text.match(/(\d+)\s*(?:beneficios|servicios)/i);
        
        if (planMatch) {
          planName = `Plan ${planMatch[1]}`;
        } else {
          planName = 'Plan Básico';
        }
      }
      
      // Extraer precio
      let price: number | undefined;
      const priceEl = el.find('.price, .cost, .monto, .valor').first();
      
      if (priceEl.length > 0) {
        price = parsePrice(priceEl.text());
      } else {
        // Buscar patrones de precio en todo el texto
        const text = el.text();
        const priceMatches = text.match(/\$\s*([\d\.,]+)/i);
        
        if (priceMatches && priceMatches[1]) {
          price = parsePrice(priceMatches[0]);
        }
      }
      
      if (!price) {
        console.warn('No se pudo extraer precio para el plan de salud:', providerName, planName);
        return; // Omitir este plan
      }
      
      // Extraer beneficios/coberturas
      const features: string[] = [];
      el.find('li, .feature, .benefit, .coverage, .cobertura').each((_, featureEl) => {
        const featureText = $(featureEl).text().trim();
        if (featureText && !featureText.includes('$')) {
          features.push(featureText);
        }
      });
      
      // Extraer URL de detalle si existe
      let detailUrl = '';
      const linkEl = el.find('a').first();
      if (linkEl.length > 0) {
        const href = linkEl.attr('href');
        if (href) {
          detailUrl = href.startsWith('http') ? href : `https://www.elmejortrato.com.ar${href.startsWith('/') ? '' : '/'}${href}`;
        }
      }
      
      // Crear la promoción
      const promotion: PromotionResult = {
        serviceName: 'elmejortrato',
        title: `${providerName} - ${planName}`,
        description: features.join('. '),
        discountedPrice: price,
        url: detailUrl || `https://www.elmejortrato.com.ar/salud/${healthType}`,
        originalPrice: undefined,
        discountPercentage: undefined
      };
      
      results.push(promotion);
    } catch (error) {
      console.error('Error al parsear plan de salud de El Mejor Trato:', error);
    }
  });
  
  return results;
}

/**
 * Parser principal que determina qué tipo de contenido procesar
 */
export function parseElMejorTrato(html: string, url: string): PromotionResult[] {
  // Determinar qué tipo de contenido estamos procesando según la URL
  if (url.includes('/servicios/')) {
    const serviceType = url.split('/servicios/')[1];
    return parseServicios(html, serviceType);
  } else if (url.includes('/salud/')) {
    const healthType = url.split('/salud/')[1];
    return parseSalud(html, healthType);
  } else {
    // Por defecto intentar como servicio genérico
    return parseServicios(html, 'general');
  }
} 