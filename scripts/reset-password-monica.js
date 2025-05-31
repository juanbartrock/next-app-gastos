const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Datos del usuario Monica Alvarez
const targetUser = {
  name: 'Monica Alvarez',
  newPassword: 'monica123' // Nueva contraseña temporal
};

async function resetPasswordMonica() {
  console.log('==============================================');
  console.log('🔄 RESETEO DE CONTRASEÑA MONICA ALVAREZ');
  console.log('==============================================');

  try {
    // 1. Buscar el usuario por nombre (case insensitive)
    console.log('🔍 Buscando usuario Monica Alvarez...');
    
    // Buscar por nombre exacto o similares
    const possibleUsers = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: 'Monica', mode: 'insensitive' } },
          { name: { contains: 'Alvarez', mode: 'insensitive' } },
          { email: { contains: 'monica', mode: 'insensitive' } }
        ]
      }
    });

    if (possibleUsers.length === 0) {
      console.log('❌ No se encontró ningún usuario con nombre Monica Alvarez');
      console.log('🔍 Buscando todos los usuarios disponibles...');
      
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true
        }
      });

      console.log('👥 Usuarios disponibles:');
      allUsers.forEach(user => {
        console.log(`   - ${user.name} (${user.email}) - ID: ${user.id}`);
      });
      
      return;
    }

    // Mostrar usuarios encontrados
    console.log(`✅ Se encontraron ${possibleUsers.length} usuario(s) relacionado(s):`);
    possibleUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ID: ${user.id}`);
    });

    // Si hay más de un usuario, tomar el que más se parezca
    let targetUserFound;
    if (possibleUsers.length === 1) {
      targetUserFound = possibleUsers[0];
    } else {
      // Buscar el que contenga ambos nombres
      targetUserFound = possibleUsers.find(user => 
        user.name.toLowerCase().includes('monica') && 
        user.name.toLowerCase().includes('alvarez')
      ) || possibleUsers[0]; // Si no encuentra uno exacto, toma el primero
    }

    console.log(`🎯 Usuario seleccionado: ${targetUserFound.name} (${targetUserFound.email})`);

    // 2. Generar nueva contraseña hasheada
    console.log('🔐 Generando nueva contraseña...');
    const hashedPassword = await bcrypt.hash(targetUser.newPassword, 12);

    // 3. Actualizar la contraseña en la base de datos
    console.log('💾 Actualizando contraseña en la base de datos...');
    const updatedUser = await prisma.user.update({
      where: { id: targetUserFound.id },
      data: { password: hashedPassword }
    });

    console.log('✅ Contraseña actualizada exitosamente');

    console.log('==============================================');
    console.log('🎉 RESETEO COMPLETADO EXITOSAMENTE');
    console.log('==============================================');
    console.log('📝 NUEVAS CREDENCIALES:');
    console.log(`   Usuario: ${updatedUser.name}`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Nueva contraseña: ${targetUser.newPassword}`);
    console.log('⚠️  IMPORTANTE: La contraseña debe cambiarse en el primer login');
    console.log('==============================================');

  } catch (error) {
    console.error('❌ ERROR AL RESETEAR CONTRASEÑA:', error);
    throw error;
  }
}

async function main() {
  try {
    await resetPasswordMonica();
  } catch (error) {
    console.error('💥 PROCESO FALLIDO:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
main(); 