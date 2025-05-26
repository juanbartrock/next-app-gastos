// Configurar variables de entorno directamente
process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_0vBJYCp8lIbq@ep-holy-brook-acnscqwx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

console.log('🔗 DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'NO ENCONTRADA');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔍 Verificando conexión a la base de datos...');
    
    // Verificar conexión
    await prisma.$connect();
    console.log('✅ Conexión exitosa a la base de datos');
    
    // Verificar si ya existe un usuario de prueba
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test@test.com' }
    });
    
    if (existingUser) {
      console.log('👤 Usuario de prueba ya existe:', existingUser.email);
      return;
    }
    
    console.log('🆕 Creando usuario de prueba...');
    
    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash('123456', 12);
    
    // Crear el usuario
    const user = await prisma.user.create({
      data: {
        email: 'test@test.com',
        name: 'Usuario de Prueba',
        password: hashedPassword,
      }
    });
    
    console.log('🎉 Usuario de prueba creado exitosamente:');
    console.log('📧 Email: test@test.com');
    console.log('🔑 Contraseña: 123456');
    console.log('🆔 ID:', user.id);
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser(); 