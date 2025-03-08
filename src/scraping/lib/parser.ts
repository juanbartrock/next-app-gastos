/**
 * Utilidades para parsear contenido HTML y extraer información
 */
import * as cheerio from 'cheerio';
import axios from 'axios';
import { ScraperError } from '../types';

/**
 * Obtiene el contenido HTML de una URL
 */
export async function fetchHtml(url: string): Promise<string> {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      throw new ScraperError(
        `Error al obtener HTML de ${url}: ${error.message}`,
        undefined,
        error
      );
    }
    throw error;
  }
}

/**
 * Carga HTML y devuelve un objeto Cheerio para manipularlo
 */
export function loadHtml(html: string): cheerio.CheerioAPI {
  return cheerio.load(html);
}

/**
 * Parsea un string a número, eliminando caracteres no numéricos
 */
export function parsePrice(text: string | undefined): number | undefined {
  if (!text) return undefined;
  
  // Eliminar caracteres no numéricos excepto el punto decimal
  const numericText = text.replace(/[^\d.,]/g, '')
    .replace(/,/g, '.');
  
  // Buscar el último punto como separador decimal
  const lastDotIndex = numericText.lastIndexOf('.');
  
  let cleanedText = numericText;
  if (lastDotIndex !== -1) {
    // Eliminar todos los puntos excepto el último (separador decimal)
    cleanedText = numericText.replace(/\./g, (_, index) => 
      index === lastDotIndex ? '.' : ''
    );
  }
  
  const price = parseFloat(cleanedText);
  return isNaN(price) ? undefined : price;
}

/**
 * Extrae texto limpio de un elemento, eliminando espacios extra
 */
export function extractText(element: cheerio.Cheerio<any>): string {
  return element.text().trim().replace(/\s+/g, ' ');
}

/**
 * Extrae una fecha de un texto
 */
export function extractDate(text: string | undefined): Date | undefined {
  if (!text) return undefined;
  
  // Intentar diferentes formatos de fecha
  const dateFormats = [
    // DD/MM/YYYY
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    // YYYY-MM-DD
    /(\d{4})-(\d{1,2})-(\d{1,2})/,
    // DD de [mes] de YYYY
    /(\d{1,2}) de ([a-zá-úñ]+) de (\d{4})/i
  ];
  
  for (const regex of dateFormats) {
    const match = text.match(regex);
    if (match) {
      try {
        if (regex === dateFormats[0]) {
          // DD/MM/YYYY
          return new Date(`${match[3]}-${match[2]}-${match[1]}`);
        } else if (regex === dateFormats[1]) {
          // YYYY-MM-DD
          return new Date(text);
        } else {
          // DD de [mes] de YYYY
          const months: Record<string, number> = {
            'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3,
            'mayo': 4, 'junio': 5, 'julio': 6, 'agosto': 7,
            'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
          };
          
          const day = parseInt(match[1]);
          const month = months[match[2].toLowerCase()];
          const year = parseInt(match[3]);
          
          if (month !== undefined) {
            return new Date(year, month, day);
          }
        }
      } catch (e) {
        console.warn(`Error al parsear fecha "${text}":`, e);
      }
    }
  }
  
  return undefined;
}

/**
 * Calcula el porcentaje de descuento entre dos precios
 */
export function calculateDiscountPercentage(
  originalPrice: number, 
  discountedPrice: number
): number {
  if (originalPrice <= 0) return 0;
  const percentage = ((originalPrice - discountedPrice) / originalPrice) * 100;
  return Math.round(percentage * 100) / 100; // Redondear a 2 decimales
} 