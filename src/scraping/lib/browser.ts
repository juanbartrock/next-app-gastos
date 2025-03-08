/**
 * Utilidades para manejar navegadores headless
 */
import puppeteer, { Browser, Page } from 'puppeteer';
import { ScraperOptions } from '../types';
import defaultConfig from '../config';

/**
 * Configura y lanza un navegador para scraping
 */
export async function setupBrowser(options?: ScraperOptions): Promise<Browser> {
  const config = defaultConfig.browser;
  const timeout = options?.timeout || config.defaultTimeout;
  
  const browser = await puppeteer.launch({
    headless: true, // Usar modo headless
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080',
    ],
    timeout
  });
  
  return browser;
}

/**
 * Prepara una página para el scraping
 */
export async function setupPage(browser: Browser, url: string, options?: ScraperOptions): Promise<Page> {
  const config = defaultConfig.browser;
  const page = await browser.newPage();
  
  // Configurar timeouts
  const timeout = options?.timeout || config.defaultTimeout;
  page.setDefaultTimeout(timeout);
  page.setDefaultNavigationTimeout(timeout);
  
  // Configurar user agent
  await page.setUserAgent(config.userAgent);
  
  // Configurar viewport
  await page.setViewport({
    width: 1920,
    height: 1080
  });
  
  // Navegar a la URL
  await page.goto(url, {
    waitUntil: 'networkidle2',
  });
  
  return page;
}

/**
 * Obtiene el contenido HTML de una URL sin necesidad de renderizar JavaScript
 */
export async function getHtmlContent(url: string): Promise<string> {
  const browser = await setupBrowser();
  
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    const content = await page.content();
    return content;
  } finally {
    await browser.close();
  }
}

/**
 * Ejecuta una función con reintentos
 */
export async function withRetries<T>(
  fn: () => Promise<T>,
  maxRetries: number = defaultConfig.scrapers.maxRetries,
  retryDelay: number = defaultConfig.scrapers.retryDelay
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Intento ${attempt}/${maxRetries} falló: ${lastError.message}`);
      
      if (attempt < maxRetries) {
        // Esperar antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  throw lastError;
} 