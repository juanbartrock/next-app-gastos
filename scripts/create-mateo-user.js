const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Datos del usuario Mateo Pautasso
const userData = {
  name: 'Mateo Pautasso',
  email: 'mateo.pautasso@gmail.com',
  password: 'password123', // Contraseña temporal - cambiar en primer login
  phoneNumber: '+54 9 11 2560-2009'
};

const grupoFamilia = {
  nombre: 'Familia',
  descripcion: 'Grupo familiar para gestión de gastos compartidos'
};

async function createMateoUser() {
  console.log('==============================================');
  console.log('🚀 CREANDO USUARIO MATEO PAUTASSO');
  console.log('==============================================');

  try {
    // 1. Verificar si el usuario ya existe
    console.log('🔍 Verificando si el usuario ya existe...');
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      console.log(`⚠️  Usuario ${userData.name} (${userData.email}) ya existe.`);
      console.log(`   ID: ${existingUser.id}`);
      
      // Verificar si tiene grupo Familia
      const gruposFamilia = await prisma.grupoMiembro.findMany({
        where: { 
          userId: existingUser.id,
        },
        include: {
          grupo: true
        }
      });
      
      const tieneGrupoFamilia = gruposFamilia.some(g => g.grupo.nombre === 'Familia');
      
      if (tieneGrupoFamilia) {
        console.log('✅ El usuario ya pertenece al grupo Familia');
        return;
      } else {
        console.log('📝 Verificando si existe grupo Familia...');
        await asignarAGrupoFamilia(existingUser.id);
        return;
      }
    }

    // 2. Hashear la contraseña
    console.log('🔐 Generando hash de contraseña...');
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // 3. Crear el usuario
    console.log('👤 Creando usuario...');
    const newUser = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        phoneNumber: userData.phoneNumber,
        isAdmin: false
      }
    });

    console.log(`✅ Usuario creado exitosamente:`);
    console.log(`   Nombre: ${newUser.name}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Teléfono: ${newUser.phoneNumber}`);
    console.log(`   ID: ${newUser.id}`);

    // 4. Crear o buscar grupo Familia
    await asignarAGrupoFamilia(newUser.id);

  } catch (error) {
    console.error('❌ ERROR AL CREAR USUARIO:', error);
    throw error;
  }
}

async function asignarAGrupoFamilia(userId) {
  try {
    // Buscar si ya existe un grupo llamado "Familia"
    console.log('🔍 Buscando grupo Familia existente...');
    let grupoFamiliaExistente = await prisma.grupo.findFirst({
      where: { nombre: 'Familia' }
    });

    if (grupoFamiliaExistente) {
      console.log(`📁 Grupo Familia encontrado (ID: ${grupoFamiliaExistente.id})`);
      
      // Verificar si el usuario ya es miembro
      const yaMiembro = await prisma.grupoMiembro.findUnique({
        where: {
          grupoId_userId: {
            grupoId: grupoFamiliaExistente.id,
            userId: userId
          }
        }
      });

      if (yaMiembro) {
        console.log('✅ El usuario ya es miembro del grupo Familia');
        return;
      }

      // Añadir al usuario al grupo existente
      await prisma.grupoMiembro.create({
        data: {
          grupoId: grupoFamiliaExistente.id,
          userId: userId,
          rol: 'miembro'
        }
      });

      console.log('✅ Usuario añadido al grupo Familia existente');

    } else {
      // Crear nuevo grupo Familia
      console.log('📁 Creando nuevo grupo Familia...');
      const nuevoGrupoFamilia = await prisma.grupo.create({
        data: {
          nombre: grupoFamilia.nombre,
          descripcion: grupoFamilia.descripcion,
          adminId: userId
        }
      });

      console.log(`✅ Grupo Familia creado (ID: ${nuevoGrupoFamilia.id})`);

      // Añadir al usuario como administrador del grupo
      await prisma.grupoMiembro.create({
        data: {
          grupoId: nuevoGrupoFamilia.id,
          userId: userId,
          rol: 'admin'
        }
      });

      console.log('✅ Usuario añadido como administrador del grupo Familia');
    }

  } catch (error) {
    console.error('❌ ERROR AL GESTIONAR GRUPO FAMILIA:', error);
    throw error;
  }
}

async function main() {
  try {
    await createMateoUser();
    
    console.log('==============================================');
    console.log('🎉 PROCESO COMPLETADO EXITOSAMENTE');
    console.log('==============================================');
    console.log('📝 DATOS DE ACCESO:');
    console.log(`   Email: ${userData.email}`);
    console.log(`   Contraseña temporal: ${userData.password}`);
    console.log('⚠️  IMPORTANTE: Cambiar contraseña en el primer login');
    console.log('==============================================');
    
  } catch (error) {
    console.error('💥 PROCESO FALLIDO:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
main(); 