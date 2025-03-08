const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function insertarPresupuesto() {
  console.log('=== SCRIPT: INSERTAR PRESUPUESTO ===');
  
  try {
    // Obtener usuario existente
    const usuario = await prisma.user.findFirst();
    if (!usuario) {
      console.error('No se encontró ningún usuario');
      return;
    }
    console.log(`Usuario encontrado: ${usuario.name} (${usuario.id})`);
    
    // Obtener una categoría existente para asociarla al presupuesto
    const categoria = await prisma.categoria.findFirst();
    if (!categoria) {
      console.error('No se encontró ninguna categoría');
      return;
    }
    console.log(`Categoría encontrada: ${categoria.descripcion} (ID: ${categoria.id})`);
    
    // Crear presupuesto según el modelo exacto
    console.log('Creando presupuesto...');
    const mesActual = new Date().getMonth() + 1; // 1-12
    const añoActual = new Date().getFullYear();
    
    const presupuesto = await prisma.presupuesto.create({
      data: {
        nombre: "Presupuesto Test",
        monto: 1000,
        mes: mesActual,
        año: añoActual,
        // Relaciones
        categoria: {
          connect: {
            id: categoria.id
          }
        },
        user: {
          connect: {
            id: usuario.id
          }
        }
        // Los campos id, createdAt y updatedAt se generan automáticamente
      }
    });
    
    console.log(`✅ Presupuesto creado exitosamente: ${presupuesto.nombre} - $${presupuesto.monto} (ID: ${presupuesto.id})`);
    
  } catch (error) {
    console.error('❌ Error durante la inserción:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
    console.log('=== SCRIPT FINALIZADO ===');
  }
}

insertarPresupuesto(); 