// Script para análisis visual de búsqueda en Precialo
const puppeteer = require('puppeteer');
const fs = require('fs').promises;

/**
 * Búsqueda visual en Precialo
 * @param {string} query Término de búsqueda completo
 * @param {string} simpleQuery Término de búsqueda simplificado (opcional)
 */
async function visualSearch(query, simpleQuery = '') {
  // Crear directorio para capturas si no existe
  const screenshotDir = './precialo-screenshots';
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
    console.log('Visitando página principal de Precialo...');
    await page.goto('https://precialo.com.ar/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await page.screenshot({ 
      path: `${screenshotDir}/1-homepage.png`,
      fullPage: true
    });
    
    // 2. Realizar búsqueda con término completo
    console.log(`Buscando término completo: "${query}"`);
    const searchUrl = `https://precialo.com.ar/buscar?q=${encodeURIComponent(query)}`;
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
      const simpleSearchUrl = `https://precialo.com.ar/buscar?q=${encodeURIComponent(simpleQuery)}`;
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
    
    // Recopilar resultados detallados, divididos por tipo de elemento
    const productsFound = {
      // 1. Búsqueda principal en contenedores de productos
      productItems: [],
      
      // 2. Búsqueda en elementos con clases comunes de producto
      otherProducts: [],
      
      // 3. Búsqueda en cualquier elemento que contenga precio
      priceElements: []
    };
    
    // 1. Primera estrategia: buscar elementos con clase product-item (más específico para Precialo)
    document.querySelectorAll('.product-item').forEach(item => {
      const text = item.textContent || '';
      const price = extractPrice(text);
      const hasSearchTerm = text.toLowerCase().includes(term.toLowerCase());
      
      // Intentar extraer más información
      const imgElement = item.querySelector('img');
      const titleElement = item.querySelector('.product-title, .title, h2, h3');
      const priceElement = item.querySelector('.product-price, .price');
      const storeElement = item.querySelector('.store-name, .merchant');
      
      if (price) {
        productsFound.productItems.push({
          text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          hasImage: !!imgElement,
          hasTitle: !!titleElement,
          hasPrice: !!priceElement,
          hasStore: !!storeElement,
          imageUrl: imgElement ? imgElement.src : null,
          title: titleElement ? titleElement.textContent.trim() : '',
          price,
          store: storeElement ? storeElement.textContent.trim() : 'Precialo',
          url: item.querySelector('a') ? item.querySelector('a').href : window.location.href,
          matchesSearch: hasSearchTerm,
          htmlPreview: item.innerHTML.substring(0, 200) + (item.innerHTML.length > 200 ? '...' : '')
        });
      }
    });
    
    // 2. Segunda estrategia: buscar elementos con clases comunes de productos
    const productSelectors = '.product, .item, .product-card, .card, [class*="product"], [class*="item"]';
    document.querySelectorAll(productSelectors).forEach(product => {
      // Evitar procesar elementos ya contabilizados en la primera estrategia
      if (product.matches('.product-item')) return;
      
      const text = product.textContent || '';
      const price = extractPrice(text);
      const hasSearchTerm = text.toLowerCase().includes(term.toLowerCase());
      
      if (price) {
        // Buscar información relevante
        const imgElement = product.querySelector('img');
        const titleElement = product.querySelector('.title, .name, h2, h3, [class*="title"], [class*="name"]');
        const priceElement = product.querySelector('.price, [class*="price"]');
        const storeElement = product.querySelector('.store, .vendor, .merchant, [class*="store"]');
        
        productsFound.otherProducts.push({
          text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          hasImage: !!imgElement,
          hasTitle: !!titleElement,
          hasPrice: !!priceElement,
          imageUrl: imgElement ? imgElement.src : null,
          title: titleElement ? titleElement.textContent.trim() : '',
          price,
          store: storeElement ? storeElement.textContent.trim() : 'Precialo',
          url: product.querySelector('a') ? product.querySelector('a').href : window.location.href,
          matchesSearch: hasSearchTerm,
          htmlPreview: product.innerHTML.substring(0, 200) + (product.innerHTML.length > 200 ? '...' : '')
        });
      }
    });
    
    // 3. Tercera estrategia: buscar elementos que contengan precios
    const priceRegex = /\$\s?[\d\.,]+/;
    Array.from(document.querySelectorAll('*')).forEach(el => {
      // Evitar procesar elementos que ya fueron incluidos en las estrategias anteriores
      if (el.matches('.product-item, .product, .item')) return;
      
      const text = el.textContent || '';
      if (priceRegex.test(text) && text.length < 50) {
        const price = extractPrice(text);
        
        // Buscar un contenedor padre que tenga más información
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
        
        if (imgContainer && price) {
          const containerText = imgContainer.textContent || '';
          const hasSearchTerm = containerText.toLowerCase().includes(term.toLowerCase());
          
          // Buscar posible título
          const candidateElements = Array.from(imgContainer.querySelectorAll('*')).filter(el => {
            const elText = el.textContent?.trim() || '';
            return elText.length > 5 && elText.length < 100 && !priceRegex.test(elText);
          });
          
          const titleElement = candidateElements.length > 0 ? candidateElements[0] : null;
          
          productsFound.priceElements.push({
            text: containerText.substring(0, 100) + (containerText.length > 100 ? '...' : ''),
            hasImage: true,
            imageUrl: imgContainer.querySelector('img').src,
            price,
            title: titleElement ? titleElement.textContent.trim() : 'No se encontró título',
            store: 'Precialo',
            url: imgContainer.querySelector('a') ? imgContainer.querySelector('a').href : window.location.href,
            matchesSearch: hasSearchTerm,
            htmlPreview: imgContainer.innerHTML.substring(0, 200) + (imgContainer.innerHTML.length > 200 ? '...' : '')
          });
        }
      }
    });
    
    // 4. Recopilar estadísticas y resumen
    const allProducts = [
      ...productsFound.productItems,
      ...productsFound.otherProducts,
      ...productsFound.priceElements
    ];
    
    // Eliminar duplicados basados en la URL de la imagen o título
    const uniqueProducts = [];
    const seenImageUrls = new Set();
    const seenTitles = new Set();
    
    allProducts.forEach(product => {
      // Primero intentamos filtrar por imagen
      if (product.imageUrl) {
        if (!seenImageUrls.has(product.imageUrl)) {
          seenImageUrls.add(product.imageUrl);
          uniqueProducts.push(product);
          if (product.title) seenTitles.add(product.title);
        }
      } 
      // Si no hay imagen, intentamos filtrar por título
      else if (product.title && !seenTitles.has(product.title)) {
        seenTitles.add(product.title);
        uniqueProducts.push(product);
      }
      // Si no hay ni imagen ni título y no hemos incluido muchos productos, lo incluimos
      else if (!product.imageUrl && !product.title && uniqueProducts.length < 20) {
        uniqueProducts.push(product);
      }
    });
    
    // 5. Obtener información de los contenedores de productos en la página
    const productContainers = {
      searchResults: document.querySelector('.search-results') ? true : false,
      productList: document.querySelector('.product-list') ? true : false,
      productGrid: document.querySelector('.product-grid') ? true : false,
      mainContent: document.querySelector('main, #main, #content, .content') ? true : false
    };
    
    // 6. Prepara el resultado final con estadísticas
    return {
      pageInfo: {
        title: document.title,
        url: window.location.href,
        searchTerm: term
      },
      stats: {
        totalProductsFound: allProducts.length,
        uniqueProductsCount: uniqueProducts.length,
        productItemsCount: productsFound.productItems.length,
        otherProductsCount: productsFound.otherProducts.length,
        priceElementsCount: productsFound.priceElements.length,
        matchesSearchTerm: allProducts.filter(p => p.matchesSearch).length,
        hasImages: allProducts.filter(p => p.hasImage).length,
        hasTitle: allProducts.filter(p => p.hasTitle).length,
        averagePrice: uniqueProducts.length > 0 
          ? uniqueProducts.reduce((acc, curr) => acc + curr.price.value, 0) / uniqueProducts.length 
          : 0
      },
      productsFound,
      uniqueProducts: uniqueProducts.slice(0, 10), // Limitar a 10 productos para no saturar el log
      productContainers
    };
  }, searchTerm);
}

/**
 * Muestra un resumen de los resultados en la consola
 */
function logResults(results, searchType) {
  const { stats, pageInfo, uniqueProducts, productContainers } = results;
  
  console.log(`\n----- RESULTADOS DE BÚSQUEDA ${searchType.toUpperCase()} EN PRECIALO -----`);
  console.log(`Página: "${pageInfo.title}" - ${pageInfo.url}`);
  console.log(`Término de búsqueda: "${pageInfo.searchTerm}"`);
  
  console.log('\nCONTENEDORES DETECTADOS:');
  Object.entries(productContainers).forEach(([container, exists]) => {
    console.log(`- ${container}: ${exists ? '✅' : '❌'}`);
  });
  
  console.log('\nESTADÍSTICAS:');
  console.log(`- Total de productos encontrados: ${stats.totalProductsFound}`);
  console.log(`- Productos únicos: ${stats.uniqueProductsCount}`);
  console.log(`- Product-items: ${stats.productItemsCount}`);
  console.log(`- Otros productos: ${stats.otherProductsCount}`);
  console.log(`- Elementos con precio: ${stats.priceElementsCount}`);
  console.log(`- Coinciden con término de búsqueda: ${stats.matchesSearchTerm}`);
  console.log(`- Tienen imágenes: ${stats.hasImages}`);
  console.log(`- Tienen título: ${stats.hasTitle}`);
  console.log(`- Precio promedio: ${stats.averagePrice.toFixed(2)}`);
  
  if (uniqueProducts.length > 0) {
    console.log('\nDETALLE DE PRODUCTOS ENCONTRADOS:');
    uniqueProducts.forEach((product, index) => {
      console.log(`\n[${index + 1}] ${product.title || 'Sin título'}`);
      console.log(`  Precio: ${product.price.formatted} (valor: ${product.price.value})`);
      console.log(`  Tienda: ${product.store}`);
      console.log(`  Imagen: ${product.hasImage ? '✅ ' + product.imageUrl.substring(0, 50) + '...' : '❌'}`);
      console.log(`  Coincide con búsqueda: ${product.matchesSearch ? '✅' : '❌'}`);
      console.log(`  URL: ${product.url.substring(0, 70)}...`);
    });
  } else {
    console.log('\n❌ NO SE ENCONTRARON PRODUCTOS');
  }
  
  console.log('-'.repeat(50));
}

/**
 * Comprueba si el sitio Precialo está disponible
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
    const response = await page.goto('https://precialo.com.ar/', {
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