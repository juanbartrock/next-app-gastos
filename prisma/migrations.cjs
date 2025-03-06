// Script para ejecutar migraciones en entorno de producción
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Determinar si estamos en producción
const isProduction = process.env.NODE_ENV === 'production';

// Verificar la presencia de la variable DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: La variable DATABASE_URL no está definida');
  process.exit(1);
}

async function main() {
  try {
    console.log('🔄 Entorno detectado:', isProduction ? 'Producción' : 'Desarrollo');
    console.log('🔄 Verificando conexión a la base de datos...');
    
    // Verificar conexión a la base de datos primero
    execSync('node prisma/db-check.js', { stdio: 'inherit' });
    
    if (isProduction) {
      // En producción, aplicamos directamente el esquema en lugar de usar migraciones
      console.log('🔄 Aplicando esquema a la base de datos de producción...');
      
      // Generar el cliente Prisma
      execSync('npx prisma generate', { stdio: 'inherit' });
      
      // Aplicar el esquema (con --skip-generate para evitar generarlo dos veces)
      execSync('npx prisma db push --accept-data-loss --skip-generate', { stdio: 'inherit' });
      
      // Verificar la estructura de la base de datos
      console.log('🔄 Verificando estructura de la base de datos...');
      execSync('npx prisma db pull --print', { stdio: 'inherit' });
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