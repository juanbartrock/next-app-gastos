// Script para inicializar la base de datos con datos de prueba
// Nota: Necesitamos compilar el archivo TS a JS antes de usarlo o usar esm o ts-node
// Alternativa: Implementar la funcionalidad directamente en este archivo

const { PrismaClient } = require('@prisma/client');
const bcryptjs = require('bcryptjs');

const prisma = new PrismaClient();

async function seedDatabase() {
  console.log('Iniciando carga de datos de prueba...');

  try {
    // 1. Crear categorías básicas
    const categoriasData = [
      { descripcion: "Alimentación", grupo_categoria: "Necesidades básicas" },
      { descripcion: "Transporte", grupo_categoria: "Necesidades básicas" },
      { descripcion: "Servicios", grupo_categoria: "Hogar" },
      { descripcion: "Ocio", grupo_categoria: "Personal" },
      { descripcion: "Otros", grupo_categoria: null }
    ];

    console.log('Verificando categorías existentes...');
    const categoriasCount = await prisma.categoria.count();

    if (categoriasCount === 0) {
      console.log('Creando categorías...');
      for (const cat of categoriasData) {
        await prisma.categoria.create({
          data: {
            descripcion: cat.descripcion,
            grupo_categoria: cat.grupo_categoria,
            status: true
          }
        });
      }
      console.log('Categorías creadas con éxito');
    } else {
      console.log(`Ya existen ${categoriasCount} categorías en la base de datos`);
    }

    // 2. Crear usuario de prueba si no existe
    console.log('Verificando usuarios existentes...');
    let usuarioExistente = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });

    if (!usuarioExistente) {
      console.log('Creando usuario de prueba...');
      const hashedPassword = await bcryptjs.hash('password123', 12);
      
      usuarioExistente = await prisma.user.create({
        data: {
          name: 'Usuario Test',
          email: 'test@example.com',
          password: hashedPassword,
          phoneNumber: '+5491112345678'
        }
      });
      console.log('Usuario de prueba creado con éxito');
    } else {
      console.log('El usuario de prueba ya existe');
    }

    // 3. Crear un grupo de prueba si no existe
    console.log('Verificando grupos existentes...');
    const gruposCount = await prisma.grupo.count();

    if (gruposCount === 0) {
      console.log('Creando grupo de prueba...');
      const grupoPrueba = await prisma.grupo.create({
        data: {
          nombre: 'Grupo de Prueba',
          descripcion: 'Grupo para probar la funcionalidad',
          adminId: usuarioExistente.id
        }
      });

      // Añadir al usuario como miembro
      await prisma.grupoMiembro.create({
        data: {
          grupoId: grupoPrueba.id,
          userId: usuarioExistente.id,
          rol: 'ADMIN'
        }
      });
      
      console.log('Grupo de prueba creado con éxito');
    } else {
      console.log(`Ya existen ${gruposCount} grupos en la base de datos`);
    }

    console.log('Carga de datos de prueba completada con éxito');
    return { success: true };
  } catch (error) {
    console.error('Error al cargar datos de prueba:', error);
    return { success: false, error };
  } finally {
    // Cerrar la conexión de Prisma
    await prisma.$disconnect();
  }
}

// Ejecutar la función
console.log('Iniciando script de seeding...');

seedDatabase()
  .then(result => {
    if (result.success) {
      console.log('✅ Base de datos inicializada correctamente');
    } else {
      console.error('❌ Error al inicializar la base de datos:', result.error);
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error fatal durante el seeding:', error);
    process.exit(1);
  }); 