const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function insertarGasto() {
  console.log('=== SCRIPT: INSERTAR GASTO/TRANSACCIÓN ===');
  
  try {
    // Obtener usuario existente
    const usuario = await prisma.user.findFirst();
    if (!usuario) {
      console.error('No se encontró ningún usuario');
      return;
    }
    console.log(`Usuario encontrado: ${usuario.name} (${usuario.id})`);
    
    // Obtener categoría existente
    const categoria = await prisma.categoria.findFirst();
    if (!categoria) {
      console.error('No se encontró ninguna categoría');
      return;
    }
    console.log(`Categoría encontrada: ${categoria.descripcion} (ID: ${categoria.id})`);
    
    // Crear gasto según el modelo exacto
    console.log('Creando gasto...');
    const gasto = await prisma.gasto.create({
      data: {
        concepto: "Gasto Test",
        monto: 79.99,
        fecha: new Date(),
        categoria: categoria.descripcion, // Campo requerido
        tipoTransaccion: 'gasto', // Valor por defecto es 'expense'
        tipoMovimiento: 'efectivo', // Valor por defecto
        // Relaciones
        categoriaRel: {
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
    
    console.log(`✅ Gasto creado exitosamente: ${gasto.concepto} - $${gasto.monto} (ID: ${gasto.id})`);
    
  } catch (error) {
    console.error('❌ Error durante la inserción:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
    console.log('=== SCRIPT FINALIZADO ===');
  }
}

insertarGasto(); 