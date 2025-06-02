async function testPdfParse() {
  try {
    console.log('🧪 Probando pdf-parse...');
    
    // PDF simple en base64 que contiene "Hello World!"
    const testPdfBase64 = 'JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoxMDAgNzAwIFRkCihIZWxsbyBXb3JsZCEpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAowMDAwMDAwMjQ1IDAwMDAwIG4gCjAwMDAwMDAzMjMgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0MTYKJSVFT0Y=';
    
    // Dynamic import
    const pdfParse = (await import('pdf-parse')).default;
    
    const pdfBuffer = Buffer.from(testPdfBase64, 'base64');
    console.log(`📄 Buffer: ${pdfBuffer.length} bytes`);
    
    // Extraer texto
    const data = await pdfParse(pdfBuffer);
    
    console.log(`📖 PDF: ${data.numpages} páginas`);
    console.log(`📝 Texto extraído: "${data.text}"`);
    
    if (data.text.includes('Hello World')) {
      console.log('✅ Extracción de texto exitosa!');
      return true;
    } else {
      console.log('❌ No se encontró el texto esperado');
      console.log('Texto completo:', JSON.stringify(data.text));
      return false;
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    return false;
  }
}

// Ejecutar prueba
testPdfParse().then(success => {
  console.log(success ? '\n🎉 pdf-parse funciona correctamente!' : '\n💥 Hay problemas con pdf-parse');
  process.exit(success ? 0 : 1);
}); 