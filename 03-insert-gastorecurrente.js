const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function insertarGastoRecurrente() {
  console.log('=== SCRIPT: INSERTAR GASTO RECURRENTE ===');
  
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
    
    // Crear gasto recurrente según el modelo exacto
    console.log('Creando gasto recurrente...');
    const fechaProxima = new Date();
    fechaProxima.setMonth(fechaProxima.getMonth() + 1); // Próximo mes
    
    const gastoRecurrente = await prisma.gastoRecurrente.create({
      data: {
        concepto: "Suscripción Test",
        monto: 12.99,
        periodicidad: "mensual",
        comentario: "Gasto de prueba para test",
        estado: "activo", // Por defecto es "pendiente", lo cambiamos a "activo"
        proximaFecha: fechaProxima,
        ultimoPago: new Date(), // Fecha actual
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
    
    console.log(`✅ Gasto recurrente creado exitosamente: ${gastoRecurrente.concepto} (ID: ${gastoRecurrente.id})`);
    
  } catch (error) {
    console.error('❌ Error durante la inserción:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
    console.log('=== SCRIPT FINALIZADO ===');
  }
}

insertarGastoRecurrente(); 