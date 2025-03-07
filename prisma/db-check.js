// Script para verificar la conexión a la base de datos PostgreSQL
const { PrismaClient } = require('@prisma/client');

// Verificar si DATABASE_URL está definida
if (!process.env.DATABASE_URL) {
  console.log('⚠️ No se ha definido DATABASE_URL. No se puede verificar la conexión a la base de datos.');
  
  // Si estamos en Vercel, continuamos sin error
  if (process.env.VERCEL === '1') {
    console.log('ℹ️ Ejecutando en Vercel. Continuando sin verificación de base de datos.');
    process.exit(0);
  } else if (process.env.NODE_ENV === 'production') {
    // En producción, esto es un error crítico
    console.error('❌ Error: DATABASE_URL es requerida en producción');
    process.exit(1);
  } else {
    // En desarrollo, advertimos pero no fallamos
    console.log('ℹ️ Continuando sin verificación. Define DATABASE_URL para verificar la conexión.');
    process.exit(0);
  }
}

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function checkDatabaseConnection() {
  try {
    console.log('🔍 Verificando conexión a la base de datos...');
    
    // Ocultar la contraseña en los logs
    const safeUrl = process.env.DATABASE_URL
      ? process.env.DATABASE_URL.replace(/\/\/([^:]+):[^@]+@/, '//************@')
      : 'URL no disponible';
    
    console.log(`📊 URL de conexión: ${safeUrl}`);
    
    // Ejecutar una consulta simple para verificar la conexión
    const result = await prisma.$queryRaw`SELECT 1 as check`;
    console.log('✅ Conexión exitosa a la base de datos:', result);
    
    // Verificar si existen las tablas necesarias
    console.log('🔍 Verificando tablas en la base de datos...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('📋 Tablas encontradas:', tables);
    
    return { success: true, message: 'Conexión exitosa', tables };
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error);
    return { success: false, message: error.message, error };
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la verificación
checkDatabaseConnection()
  .then((result) => {
    if (!result.success) {
      // En Vercel build o desarrollo, no fallamos por problemas de conexión
      if (process.env.VERCEL === '1' || process.env.NODE_ENV !== 'production') {
        console.log('⚠️ La verificación de la base de datos falló, pero continuamos el proceso.');
        process.exit(0);
      } else {
        process.exit(1);
      }
    }
  })
  .catch((error) => {
    console.error('Error inesperado:', error);
    
    // En Vercel build o desarrollo, no fallamos por problemas de conexión
    if (process.env.VERCEL === '1' || process.env.NODE_ENV !== 'production') {
      console.log('⚠️ Error en la verificación, pero continuamos el proceso.');
      process.exit(0);
    } else {
      process.exit(1);
    }
  }); 