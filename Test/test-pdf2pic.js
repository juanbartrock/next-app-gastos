const fs = require('fs');

async function testPdf2pic() {
  try {
    console.log('🧪 Probando pdf2pic...');
    
    // PDF simple en base64
    const testPdfBase64 = 'JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoxMDAgNzAwIFRkCihIZWxsbyBXb3JsZCEpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAowMDAwMDAwMjQ1IDAwMDAwIG4gCjAwMDAwMDAzMjMgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0MTYKJSVFT0Y=';
    
    // Dynamic import
    const { default: pdf2pic } = await import('pdf2pic');
    
    const pdfBuffer = Buffer.from(testPdfBase64, 'base64');
    console.log(`📄 Buffer: ${pdfBuffer.length} bytes`);
    
    // Configurar pdf2pic
    const convert = pdf2pic.fromBuffer(pdfBuffer, {
      density: 300,
      saveFilename: "test-page",
      savePath: "./temp",
      format: "png",
      width: 2480,
      height: 3508
    });
    
    console.log('🔄 Convirtiendo...');
    
    // Convertir página 1
    const result = await convert(1, { responseType: "base64" });
    
    if (result && result.base64) {
      console.log(`✅ Conversión exitosa! Base64: ${result.base64.length} chars`);
      
      // Guardar imagen de prueba
      fs.writeFileSync('test-output.png', Buffer.from(result.base64, 'base64'));
      console.log('💾 Imagen guardada como test-output.png');
      
      return true;
    } else {
      console.log('❌ No se obtuvo resultado');
      return false;
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    
    if (error.message.includes('GraphicsMagick') || error.message.includes('ImageMagick')) {
      console.log('');
      console.log('ℹ️  NOTA: pdf2pic requiere GraphicsMagick o ImageMagick instalado:');
      console.log('   - Descarga: http://www.graphicsmagick.org/download.html');
      console.log('   - O usar alternativa sin dependencias externas');
    }
    
    return false;
  }
}

// Ejecutar prueba
testPdf2pic().then(success => {
  console.log(success ? '\n🎉 pdf2pic funciona correctamente!' : '\n💥 Hay problemas con pdf2pic');
  process.exit(success ? 0 : 1);
}); 