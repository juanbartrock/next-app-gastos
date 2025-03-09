// Script para analizar la estructura del sitio de Ratoneando
const puppeteer = require('puppeteer');

(async () => {
  // Lanzar el navegador
  const browser = await puppeteer.launch({
    headless: false, // Modo con interfaz visual para poder ver lo que ocurre
  });
  
  try {
    // Abrir una nueva página
    const page = await browser.newPage();
    
    // Configurar viewport
    await page.setViewport({ width: 1366, height: 768 });
    
    // Navegar a la página principal de Ratoneando
    console.log('Navegando a Ratoneando...');
    await page.goto('https://ratoneando.ar/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Analizar la estructura del formulario de búsqueda
    console.log('Analizando formulario de búsqueda...');
    const searchFormInfo = await page.evaluate(() => {
      const searchForm = document.querySelector('form[role="search"]');
      if (!searchForm) return { error: 'No se encontró formulario de búsqueda' };
      
      const method = searchForm.getAttribute('method') || 'GET';
      const action = searchForm.getAttribute('action') || '';
      const inputElement = searchForm.querySelector('input[type="search"]');
      const inputName = inputElement ? inputElement.getAttribute('name') : null;
      
      return {
        method,
        action,
        inputName,
        formHTML: searchForm.outerHTML
      };
    });
    
    console.log('Información del formulario de búsqueda:');
    console.log(JSON.stringify(searchFormInfo, null, 2));
    
    // Realizar una búsqueda de prueba
    console.log('Realizando búsqueda de prueba con "SERENITO"...');
    
    // Buscar el campo de búsqueda
    const searchInput = await page.$('input[type="search"]');
    if (!searchInput) {
      console.log('No se encontró el campo de búsqueda, buscando alternativas...');
      // Buscar cualquier campo de entrada que parezca ser de búsqueda
      const possibleSearchInputs = await page.$$('input');
      
      if (possibleSearchInputs.length > 0) {
        // Usar el primer input encontrado
        await possibleSearchInputs[0].type('SERENITO');
        await page.keyboard.press('Enter');
      } else {
        throw new Error('No se encontraron campos de entrada para realizar la búsqueda');
      }
    } else {
      await searchInput.type('SERENITO');
      await page.keyboard.press('Enter');
    }
    
    // Esperar a que se cargue la página de resultados (sin waitForNavigation que estaba causando timeout)
    console.log('Esperando a que se carguen los resultados...');
    await page.waitForTimeout(5000); // Esperar 5 segundos para que cargue la página
    
    // Analizar la URL después de la búsqueda
    const searchResultUrl = page.url();
    console.log('URL de resultados de búsqueda:', searchResultUrl);
    
    // Hacer una captura de pantalla de los resultados
    await page.screenshot({ path: 'ratoneando-search-results.png' });
    console.log('Se guardó captura de pantalla en ratoneando-search-results.png');
    
    // Analizar la estructura de la página de resultados
    console.log('Analizando estructura de la página...');
    const pageStructure = await page.evaluate(() => {
      // Analizar el DOM principal
      return {
        title: document.title,
        url: window.location.href,
        bodyClasses: document.body.className,
        mainTags: {
          articles: document.querySelectorAll('article').length,
          divs: document.querySelectorAll('div').length,
          sections: document.querySelectorAll('section').length,
          products: document.querySelectorAll('.product').length,
          posts: document.querySelectorAll('.post').length
        },
        // Intentar encontrar el contenedor de resultados
        possibleResultContainers: [
          { selector: 'main', found: !!document.querySelector('main') },
          { selector: '#main', found: !!document.querySelector('#main') },
          { selector: '.content', found: !!document.querySelector('.content') },
          { selector: '.search-results', found: !!document.querySelector('.search-results') },
          { selector: '.products', found: !!document.querySelector('.products') },
          { selector: '.articles', found: !!document.querySelector('.articles') }
        ]
      };
    });
    
    console.log('Estructura de la página:');
    console.log(JSON.stringify(pageStructure, null, 2));
    
    // Inspeccionar el contenido HTML para analizar manualmente
    const pageContent = await page.content();
    // No imprimir todo el HTML, solo mencionar que está disponible
    console.log(`HTML de la página capturado (${pageContent.length} caracteres)`);
    
  } catch (error) {
    console.error('Error durante el análisis:', error);
  } finally {
    // Mantener el navegador abierto por 10 segundos para ver los resultados
    console.log('Esperando 10 segundos antes de cerrar...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();
  }
})(); 