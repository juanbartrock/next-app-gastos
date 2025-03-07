import prisma from './prisma';

/**
 * Inicializa las tablas y datos básicos de la aplicación
 */
export async function initializeDatabase() {
  try {
    console.log('Iniciando configuración de base de datos...');
    
    // Verificar si existen categorías
    let hasCategories = false;
    try {
      const count = await prisma.categoria.count();
      hasCategories = count > 0;
      console.log(`Verificación de categorías: ${count} encontradas`);
    } catch (e) {
      console.error('Error al contar categorías:', e);
    }
    
    if (!hasCategories) {
      await createInitialCategories();
    }
    
    console.log('Configuración de base de datos completada');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
  }
}

/**
 * Crea las categorías iniciales
 */
export async function createInitialCategories() {
  const initialCategories = [
    { descripcion: "Alimentación", grupo_categoria: "Necesidades básicas" },
    { descripcion: "Transporte", grupo_categoria: "Necesidades básicas" },
    { descripcion: "Servicios", grupo_categoria: "Hogar" },
    { descripcion: "Ocio", grupo_categoria: "Personal" },
    { descripcion: "Otros", grupo_categoria: null }
  ];
  
  console.log('Creando categorías iniciales...');
  
  try {
    // Intentar usar Prisma Client primero
    for (const cat of initialCategories) {
      try {
        await prisma.categoria.create({
          data: {
            descripcion: cat.descripcion,
            grupo_categoria: cat.grupo_categoria,
            status: true
          }
        });
        console.log(`Categoría creada: ${cat.descripcion}`);
      } catch (error) {
        console.error(`Error al crear categoría ${cat.descripcion}:`, error);
      }
    }
  } catch (error) {
    console.error('Error al crear categorías iniciales:', error);
  }
} 