// Script para ejecutar migraciones en entorno de producción
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Determinar si estamos en producción
const isProduction = process.env.NODE_ENV === 'production';
// Determinar si estamos en Vercel
const isVercel = process.env.VERCEL === '1';

// Verificar la presencia de la variable DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.log('⚠️ Advertencia: La variable DATABASE_URL no está definida');
  
  // Si estamos en el proceso de build de Vercel, continuamos sin error
  // Las variables de entorno de producción estarán disponibles durante el runtime
  if (isVercel && process.env.VERCEL_ENV === 'preview') {
    console.log('🔄 Ejecutando en entorno de preview de Vercel. Continuando sin base de datos.');
    process.exit(0);
  } else if (process.env.NODE_ENV === 'production' && !isVercel) {
    // En producción fuera de Vercel, es un error crítico
    console.error('❌ Error: DATABASE_URL es requerida en producción');
    process.exit(1);
  } else {
    // En desarrollo local, solo advertimos pero no fallamos
    console.log('ℹ️ Continuando sin migraciones. Define DATABASE_URL para ejecutar migraciones.');
    process.exit(0);
  }
}

async function main() {
  try {
    console.log('🔄 Entorno detectado:', isProduction ? 'Producción' : 'Desarrollo');
    console.log('🔄 Verificando conexión a la base de datos...');
    
    try {
      // Verificar conexión a la base de datos primero
      execSync('node prisma/db-check.js', { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️ No se pudo verificar la conexión a la base de datos:', error.message);
      
      // En desarrollo o durante el build, continuamos sin error fatal
      if (!isProduction || isVercel) {
        console.log('ℹ️ Continuando sin verificación de conexión.');
        
        // Generamos el cliente Prisma de todos modos para que la aplicación pueda construirse
        console.log('🔄 Generando cliente Prisma...');
        execSync('npx prisma generate', { stdio: 'inherit' });
        
        process.exit(0);
      } else {
        // En producción real, es un error crítico
        throw error;
      }
    }
    
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