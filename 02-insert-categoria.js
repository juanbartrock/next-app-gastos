const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function insertarCategoria() {
  console.log('=== SCRIPT: INSERTAR CATEGORÍA ===');
  
  try {
    // Verificar si ya existe la categoría
    const categoriaExistente = await prisma.categoria.findFirst({
      where: {
        descripcion: "Test Simple"
      }
    });
    
    if (categoriaExistente) {
      console.log(`La categoría ya existe: ${categoriaExistente.descripcion} (ID: ${categoriaExistente.id})`);
      return;
    }
    
    // Crear la categoría según el modelo exacto
    console.log('Creando categoría...');
    const categoria = await prisma.categoria.create({
      data: {
        descripcion: "Test Simple",
        grupo_categoria: "Test",
        status: true, // Por defecto es true, pero lo explicitamos
        // Los campos id, createdAt y updatedAt se generan automáticamente
      }
    });
    
    console.log(`✅ Categoría creada exitosamente: ${categoria.descripcion} (ID: ${categoria.id})`);
    
  } catch (error) {
    console.error('❌ Error durante la inserción:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
    console.log('=== SCRIPT FINALIZADO ===');
  }
}

insertarCategoria(); 