// Script simplificado para resetear contraseña de Monica Alvarez
// Configurar DATABASE_URL antes de ejecutar:
// $env:DATABASE_URL="postgresql://neondb_owner:npg_0vBJYCp8lIbq@ep-holy-brook-acnscqwx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

console.log('🔄 RESETEO RÁPIDO DE CONTRASEÑA MONICA ALVAREZ');
console.log('==============================================');

const prisma = new PrismaClient();

async function quickReset() {
  try {
    // Buscar usuarios con Monica
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: 'Monica', mode: 'insensitive' } },
          { name: { contains: 'Alvarez', mode: 'insensitive' } },
          { email: { contains: 'monica', mode: 'insensitive' } }
        ]
      }
    });

    console.log(`Usuarios encontrados: ${users.length}`);
    
    if (users.length === 0) {
      console.log('❌ No se encontró Monica Alvarez');
      
      // Mostrar todos los usuarios
      const allUsers = await prisma.user.findMany({
        select: { id: true, name: true, email: true }
      });
      console.log('👥 Usuarios disponibles:');
      allUsers.forEach(u => console.log(`   - ${u.name} (${u.email})`));
      return;
    }

    // Tomar el primer usuario encontrado
    const user = users[0];
    console.log(`🎯 Usuario: ${user.name} (${user.email})`);

    // Nueva contraseña
    const newPassword = 'monica123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Actualizar
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    console.log('✅ CONTRASEÑA ACTUALIZADA');
    console.log('==============================================');
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔑 Nueva contraseña: ${newPassword}`);
    console.log('⚠️ Cambiar en primer login');
    console.log('==============================================');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

quickReset(); 