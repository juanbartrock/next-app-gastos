const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

// Datos de los usuarios básicos (ajusta según necesites)
const basicUsers = [
  {
    name: 'Juan Pautasso',
    email: 'jpautasso@gmail.com', // Ajusta al email correcto
    password: 'password123', // Ajusta a la contraseña deseada
    phoneNumber: null
  },
  {
    name: 'Hijo',
    email: 'hijo@example.com', // Ajusta al email correcto
    password: 'password123', // Ajusta a la contraseña deseada
    phoneNumber: null
  }
];

// Función para crear usuarios básicos
async function createBasicUsers() {
  console.log('CREANDO USUARIOS BÁSICOS...');
  console.log('==============================================');

  try {
    for (const userData of basicUsers) {
      // Verificar si el usuario ya existe
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`Usuario ${userData.name} (${userData.email}) ya existe, no se creará nuevamente.`);
        continue;
      }

      // Hashear la contraseña
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Crear el usuario
      const newUser = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          phoneNumber: userData.phoneNumber
        }
      });

      console.log(`✅ Usuario creado: ${newUser.name} (${newUser.email}) - ID: ${newUser.id}`);

      // Crear grupo personal para el usuario
      const grupo = await prisma.grupo.create({
        data: {
          nombre: 'Personal',
          descripcion: 'Grupo personal',
          adminId: newUser.id
        }
      });

      console.log(`✅ Grupo personal creado para ${newUser.name} - ID: ${grupo.id}`);

      // Añadir el usuario como miembro del grupo
      await prisma.grupoMiembro.create({
        data: {
          grupoId: grupo.id,
          userId: newUser.id,
          rol: 'admin'
        }
      });

      console.log(`✅ Usuario añadido como miembro de su grupo personal`);
    }

    console.log('==============================================');
    console.log('✅ USUARIOS BÁSICOS CREADOS CORRECTAMENTE');
  } catch (error) {
    console.error('❌ ERROR AL CREAR USUARIOS BÁSICOS:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
createBasicUsers()
  .then(() => console.log('Proceso completado.'))
  .catch(error => console.error('Error en el proceso:', error)); 