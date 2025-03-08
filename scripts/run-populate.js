/**
 * Script para ejecutar la población de datos de prueba
 */

const { execSync } = require('child_process');
const path = require('path');

// Ruta al script principal
const scriptPath = path.join(__dirname, 'populate-test-data.js');

console.log('=== Poblando base de datos con datos de prueba ===');
console.log('Este proceso limpiará los datos existentes de los meses de enero a marzo de 2024');
console.log('y creará nuevos datos para pruebas con el asesor financiero.');
console.log('');
console.log('Ejecutando script...');

try {
  execSync(`node ${scriptPath}`, { stdio: 'inherit' });
  console.log('');
  console.log('=== Proceso completado con éxito ===');
  console.log('');
  console.log('Ahora puedes utilizar el set de pruebas para evaluar el asesor financiero.');
  console.log('El archivo set-de-prueba.md contiene preguntas de ejemplo para probar la funcionalidad.');
} catch (error) {
  console.error('Error al ejecutar el script:', error.message);
  process.exit(1);
} 