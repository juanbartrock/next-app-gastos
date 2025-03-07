import prisma from './prisma';
import { hash } from 'bcryptjs';

/**
 * Función para inicializar datos de prueba en la base de datos
 */
export async function seedDatabase() {
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
    const usuarioExistente = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });

    if (!usuarioExistente) {
      console.log('Creando usuario de prueba...');
      const hashedPassword = await hash('password123', 12);
      
      await prisma.user.create({
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

    console.log('Carga de datos de prueba completada con éxito');
    return { success: true };
  } catch (error) {
    console.error('Error al cargar datos de prueba:', error);
    return { success: false, error };
  }
}

// Exportar una función que se puede ejecutar directamente
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Proceso de seeding completado');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error durante el proceso de seeding:', error);
      process.exit(1);
    });
} 