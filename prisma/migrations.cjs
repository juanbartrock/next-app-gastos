// Script para ejecutar migraciones en entorno de producción
const { execSync } = require('child_process');

// Determinar si estamos en producción
const isProduction = process.env.NODE_ENV === 'production';

async function main() {
  try {
    if (isProduction) {
      // En producción, aplicamos directamente el esquema en lugar de usar migraciones
      console.log('🔄 Aplicando esquema a la base de datos de producción...');
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    } else {
      // En desarrollo usamos migraciones normales
      console.log('🔄 Ejecutando migraciones en desarrollo...');
      execSync('npx prisma migrate dev', { stdio: 'inherit' });
    }
    console.log('✅ Base de datos sincronizada correctamente');
  } catch (error) {
    console.error('❌ Error al sincronizar la base de datos:', error);
    process.exit(1);
  }
}

main(); 