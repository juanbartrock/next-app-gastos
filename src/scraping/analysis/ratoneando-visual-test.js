// Script para análisis visual de búsqueda en Ratoneando
const puppeteer = require('puppeteer');
const fs = require('fs').promises;

/**
 * Búsqueda visual en Ratoneando
 * @param {string} query Término de búsqueda completo
 * @param {string} simpleQuery Término de búsqueda simplificado (opcional)
 */
async function visualSearch(query, simpleQuery = '') {
  // Crear directorio para capturas si no existe
  const screenshotDir = './ratoneando-screenshots';
  try {
    await fs.mkdir(screenshotDir, { recursive: true });
  } catch (error) {
    console.log('El directorio ya existe o hubo un error al crearlo:', error.message);
  }

  // Lanzar el navegador
  const browser = await puppeteer.launch({
    headless: false, // Modo visual para poder observar
    defaultViewport: null, // Usar tamaño de ventana predeterminado
    args: ['--start-maximized'] // Maximizar ventana
  });

  try {
    const page = await browser.newPage();
    
    // 1. Visitar página principal y capturar
    console.log('Visitando página principal de Ratoneando...');
    await page.goto('https://ratoneando.ar/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await page.screenshot({ 
      path: `${screenshotDir}/1-homepage.png`,
      fullPage: true
    });
    
    // 2. Realizar búsqueda con término completo
    console.log(`Buscando término completo: "${query}"`);
    const searchUrl = `https://ratoneando.ar/?q=${encodeURIComponent(query)}`;
    await page.goto(searchUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Esperar a que la página cargue completamente
    await page.waitForTimeout(3000);
    
    // Capturar URL final (puede haber redirecciones)
    const finalUrlComplete = page.url();
    console.log(`URL final para búsqueda completa: ${finalUrlComplete}`);
    
    // Analizar resultados de término completo
    console.log(`Analizando resultados para búsqueda completa: "${query}"...`);
    const completeResults = await analyzeResults(page, query);
    logResults(completeResults, 'completa');
    
    // Guardar resultados a archivo para análisis posterior
    await fs.writeFile(
      `${screenshotDir}/results-complete.json`, 
      JSON.stringify(completeResults, null, 2)
    );
    
    // Capturar pantalla de resultados con término completo
    await page.screenshot({ 
      path: `${screenshotDir}/2-search-complete-term.png`,
      fullPage: true
    });
    
    // 3. Si se proporcionó un término simplificado, realizar esa búsqueda
    if (simpleQuery) {
      console.log(`\nBuscando término simplificado: "${simpleQuery}"`);
      const simpleSearchUrl = `https://ratoneando.ar/?q=${encodeURIComponent(simpleQuery)}`;
      await page.goto(simpleSearchUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      // Esperar a que la página cargue completamente
      await page.waitForTimeout(3000);
      
      // Capturar URL final
      const finalUrlSimple = page.url();
      console.log(`URL final para búsqueda simplificada: ${finalUrlSimple}`);
      
      // Analizar resultados de término simplificado
      console.log(`Analizando resultados para búsqueda simplificada: "${simpleQuery}"...`);
      const simpleResults = await analyzeResults(page, simpleQuery);
      logResults(simpleResults, 'simplificada');
      
      // Guardar resultados a archivo para análisis posterior
      await fs.writeFile(
        `${screenshotDir}/results-simple.json`, 
        JSON.stringify(simpleResults, null, 2)
      );
      
      // Capturar pantalla de resultados con término simplificado
      await page.screenshot({ 
        path: `${screenshotDir}/3-search-simple-term.png`,
        fullPage: true
      });
    }
    
    // 5. Análisis de disponibilidad del sitio
    console.log('\nVerificando disponibilidad del sitio...');
    const isAvailable = await checkAvailability();
    console.log(`Comprobación de disponibilidad: ${isAvailable ? 'DISPONIBLE ✅' : 'NO DISPONIBLE ❌'}`);
    
    // 6. Probar específicamente el método isAvailable() del servicio
    console.log('\nProbando método isAvailable() del servicio (10 intentos)...');
    const availabilityResults = [];
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      const isAvail = await checkAvailability();
      const duration = Date.now() - start;
      availabilityResults.push({ attempt: i+1, available: isAvail, durationMs: duration });
      console.log(`  Intento ${i+1}: ${isAvail ? 'DISPONIBLE ✅' : 'NO DISPONIBLE ❌'} (${duration}ms)`);
      await new Promise(resolve => setTimeout(resolve, 500)); // Breve pausa entre intentos
    }
    
    // Estadísticas de disponibilidad
    const successCount = availabilityResults.filter(r => r.available).length;
    const avgDuration = availabilityResults.reduce((acc, curr) => acc + curr.durationMs, 0) / availabilityResults.length;
    console.log(`\nDisponibilidad: ${successCount}/${availabilityResults.length} intentos exitosos (${Math.round(successCount/availabilityResults.length*100)}%)`);
    console.log(`Tiempo promedio de verificación: ${Math.round(avgDuration)}ms`);
    
    // Guardar resultados de disponibilidad
    await fs.writeFile(
      `${screenshotDir}/availability-results.json`, 
      JSON.stringify(availabilityResults, null, 2)
    );
    
    // Mantener el navegador abierto por un tiempo para inspección manual
    console.log('\nNavegador abierto para inspección manual (se cerrará en 30 segundos)');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('Error durante el análisis visual:', error);
  } finally {
    await browser.close();
  }
}

/**
 * Analiza los resultados de búsqueda en la página
 */
async function analyzeResults(page, searchTerm) {
  return await page.evaluate((term) => {
    // Función para extraer precios
    const extractPrice = (text) => {
      const priceMatch = text.match(/\$[\d\., ]+/);
      if (!priceMatch) return null;
      
      // Limpiar el formato y convertir a número
      const priceStr = priceMatch[0]
        .replace('$', '')
        .replace(/\./g, '')
        .replace(',', '.')
        .trim();
      
      const price = parseFloat(priceStr);
      return isNaN(price) ? null : {
        raw: priceMatch[0],
        value: price,
        formatted: new Intl.NumberFormat('es-AR', { 
          style: 'currency', 
          currency: 'ARS' 
        }).format(price)
      };
    };
    
    // Recopilar resultados detallados, divididos por tipo de elemento para mejor análisis
    const productsFound = {
      // 1. Búsqueda principal en divs de primer nivel (como vimos en la captura)
      primarySearch: [],
      
      // 2. Búsqueda en artículos y clases comunes de producto
      articles: [],
      
      // 3. Búsqueda en cualquier elemento que contenga precio
      priceElements: []
    };
    
    // 1. Primera estrategia: buscar en los divs hijos directos de body (como vimos en la imagen)
    document.querySelectorAll('body > div').forEach(div => {
      const text = div.textContent || '';
      
      // Verificar si tiene precio y contiene el término de búsqueda
      const price = extractPrice(text);
      const hasSearchTerm = text.toLowerCase().includes(term.toLowerCase());
      const imgElement = div.querySelector('img');
      
      if (price && (hasSearchTerm || term.length < 4)) {
        // Buscar un elemento que pueda ser el título
        let titleElement = null;
        let titleText = '';
        
        // Buscar elementos que puedan contener el título
        const possibleTitleElements = Array.from(div.querySelectorAll('div, span, p, h1, h2, h3, h4, h5, h6'));
        for (const el of possibleTitleElements) {
          const elText = el.textContent || '';
          // El título suele ser un texto que no es el precio y tiene longitud razonable
          if (elText.length > 5 && elText.length < 100 && !elText.includes('$')) {
            titleElement = el;
            titleText = elText.trim();
            break;
          }
        }
        
        productsFound.primarySearch.push({
          text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          hasImage: !!imgElement,
          imageUrl: imgElement ? imgElement.src : null,
          price,
          title: titleText,
          matchesSearch: hasSearchTerm,
          htmlPreview: div.innerHTML.substring(0, 200) + (div.innerHTML.length > 200 ? '...' : '')
        });
      }
    });
    
    // 2. Segunda estrategia: buscar en artículos y elementos con clases comunes de producto
    document.querySelectorAll('article, .product, .item, .card, [class*="product"], [class*="item"]').forEach(article => {
      const text = article.textContent || '';
      const price = extractPrice(text);
      const imgElement = article.querySelector('img');
      const titleElement = article.querySelector('h1, h2, h3, .title, .name, [class*="title"], [class*="name"]');
      const titleText = titleElement ? titleElement.textContent.trim() : '';
      
      if (price) {
        productsFound.articles.push({
          text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          hasImage: !!imgElement,
          imageUrl: imgElement ? imgElement.src : null,
          price,
          title: titleText,
          matchesSearch: text.toLowerCase().includes(term.toLowerCase()),
          htmlPreview: article.innerHTML.substring(0, 200) + (article.innerHTML.length > 200 ? '...' : '')
        });
      }
    });
    
    // 3. Tercera estrategia: buscar elementos que contengan precios y analizar sus contenedores
    Array.from(document.querySelectorAll('*')).forEach(el => {
      const text = el.textContent || '';
      const price = extractPrice(text);
      
      // Si el elemento tiene un precio y el texto no es demasiado largo (para evitar contenedores muy grandes)
      if (price && text.length < 50) {
        // Buscar ancestro que contenga imagen (máximo 3 niveles hacia arriba)
        let container = el;
        let imgContainer = null;
        let depth = 0;
        
        while (container && depth < 3) {
          const img = container.querySelector('img');
          if (img) {
            imgContainer = container;
            break;
          }
          container = container.parentElement;
          depth++;
        }
        
        // Solo considerar si encontramos un contenedor con imagen
        if (imgContainer) {
          const containerText = imgContainer.textContent || '';
          const titleElement = imgContainer.querySelector('h1, h2, h3, .title, .name, [class*="title"], [class*="name"]');
          const titleText = titleElement ? titleElement.textContent.trim() : '';
          
          productsFound.priceElements.push({
            text: containerText.substring(0, 100) + (containerText.length > 100 ? '...' : ''),
            hasImage: true,
            imageUrl: imgContainer.querySelector('img').src,
            price,
            title: titleText || 'No se encontró título',
            matchesSearch: containerText.toLowerCase().includes(term.toLowerCase()),
            htmlPreview: imgContainer.innerHTML.substring(0, 200) + (imgContainer.innerHTML.length > 200 ? '...' : '')
          });
        }
      }
    });
    
    // 4. Recopilar estadísticas y resumen
    const allProducts = [
      ...productsFound.primarySearch,
      ...productsFound.articles,
      ...productsFound.priceElements
    ];
    
    // Eliminar duplicados basados en la URL de la imagen (si existe)
    const uniqueProducts = [];
    const seenImageUrls = new Set();
    
    allProducts.forEach(product => {
      if (product.imageUrl) {
        if (!seenImageUrls.has(product.imageUrl)) {
          seenImageUrls.add(product.imageUrl);
          uniqueProducts.push(product);
        }
      } else {
        uniqueProducts.push(product);
      }
    });
    
    // 5. Prepara el resultado final con estadísticas
    return {
      pageInfo: {
        title: document.title,
        url: window.location.href,
        searchTerm: term
      },
      stats: {
        totalProductsFound: allProducts.length,
        uniqueProductsCount: uniqueProducts.length,
        primarySearchCount: productsFound.primarySearch.length,
        articlesCount: productsFound.articles.length,
        priceElementsCount: productsFound.priceElements.length,
        matchesSearchTerm: allProducts.filter(p => p.matchesSearch).length,
        hasImages: allProducts.filter(p => p.hasImage).length,
        averagePrice: uniqueProducts.length > 0 
          ? uniqueProducts.reduce((acc, curr) => acc + curr.price.value, 0) / uniqueProducts.length 
          : 0
      },
      productsFound,
      uniqueProducts: uniqueProducts.slice(0, 10) // Limitar a 10 productos para no saturar el log
    };
  }, searchTerm);
}

/**
 * Muestra un resumen de los resultados en la consola
 */
function logResults(results, searchType) {
  const { stats, pageInfo, uniqueProducts } = results;
  
  console.log(`\n----- RESULTADOS DE BÚSQUEDA ${searchType.toUpperCase()} -----`);
  console.log(`Página: "${pageInfo.title}" - ${pageInfo.url}`);
  console.log(`Término de búsqueda: "${pageInfo.searchTerm}"`);
  console.log('\nESTADÍSTICAS:');
  console.log(`- Total de productos encontrados: ${stats.totalProductsFound}`);
  console.log(`- Productos únicos: ${stats.uniqueProductsCount}`);
  console.log(`- Coinciden con término de búsqueda: ${stats.matchesSearchTerm}`);
  console.log(`- Tienen imágenes: ${stats.hasImages}`);
  console.log(`- Precio promedio: ${stats.averagePrice.toFixed(2)}`);
  
  if (uniqueProducts.length > 0) {
    console.log('\nDETALLE DE PRODUCTOS ENCONTRADOS:');
    uniqueProducts.forEach((product, index) => {
      console.log(`\n[${index + 1}] ${product.title || 'Sin título'}`);
      console.log(`  Precio: ${product.price.formatted} (valor: ${product.price.value})`);
      console.log(`  Imagen: ${product.hasImage ? '✅ ' + product.imageUrl.substring(0, 50) + '...' : '❌'}`);
      console.log(`  Coincide con búsqueda: ${product.matchesSearch ? '✅' : '❌'}`);
    });
  } else {
    console.log('\n❌ NO SE ENCONTRARON PRODUCTOS');
  }
  
  console.log('-'.repeat(50));
}

/**
 * Comprueba si el sitio Ratoneando está disponible
 */
async function checkAvailability() {
  try {
    const browser = await puppeteer.launch({ 
      headless: true,
      timeout: 15000
    });
    
    const page = await browser.newPage();
    
    // Configurar timeout más estricto
    page.setDefaultTimeout(10000);
    page.setDefaultNavigationTimeout(10000);
    
    // Intentar conectarse al sitio principal
    const response = await page.goto('https://ratoneando.ar/', {
      timeout: 10000,
      waitUntil: 'domcontentloaded'
    });
    
    const status = response.status();
    const isOk = status >= 200 && status < 400;
    
    await browser.close();
    return isOk;
  } catch (error) {
    console.error('Error al verificar disponibilidad:', error.message);
    return false;
  }
}

// Ejecutar búsqueda visual con término completo y simplificado
const complexTerm = 'SERENITO POSTRE 210g';
const simpleTerm = 'SERENITO';

// Iniciar el script
console.log(`Iniciando análisis visual para "${complexTerm}" y "${simpleTerm}"`);
visualSearch(complexTerm, simpleTerm); 