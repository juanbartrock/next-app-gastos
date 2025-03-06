// Script para verificar la conexión a la base de datos PostgreSQL
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function checkDatabaseConnection() {
  try {
    console.log('🔍 Verificando conexión a la base de datos...');
    console.log(`📊 URL de conexión: ${process.env.DATABASE_URL.replace(/\/\/([^:]+):[^@]+@/, '//************@')}`);
    
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
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Error inesperado:', error);
    process.exit(1);
  }); 