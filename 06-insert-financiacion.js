const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function insertarFinanciacion() {
  console.log('=== SCRIPT: INSERTAR FINANCIACIÓN ===');
  
  try {
    // 1. Primero crear un gasto específico para esto
    console.log('Creando un gasto para la financiación...');
    
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
    
    // Crear un gasto específico para financiar
    const gasto = await prisma.gasto.create({
      data: {
        concepto: "Compra financiada test",
        monto: 599.99,
        fecha: new Date(),
        tipoTransaccion: 'gasto',
        tipoMovimiento: 'gasto',
        userId: usuario.id,
        categoriaId: categoria.id,
        categoria: categoria.descripcion
      }
    });
    
    console.log(`✅ Gasto creado exitosamente: ${gasto.concepto} - $${gasto.monto} (ID: ${gasto.id})`);
    
    // 2. Ahora crear la financiación exactamente según el modelo schema.prisma
    console.log('Creando financiación...');
    
    // Fechas auxiliares
    const fechaActual = new Date();
    const fechaProxima = new Date();
    fechaProxima.setMonth(fechaProxima.getMonth() + 1); // próximo mes
    
    const financiacion = await prisma.financiacion.create({
      data: {
        // Campos según el modelo exacto de schema.prisma
        cantidadCuotas: 6,
        cuotasPagadas: 0,
        cuotasRestantes: 6,
        montoCuota: 99.99,
        fechaPrimerPago: fechaActual,
        fechaProximoPago: fechaProxima,
        diaPago: fechaActual.getDate(),
        // Relaciones
        gasto: {
          connect: {
            id: gasto.id
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
    
    console.log(`✅ Financiación creada exitosamente: ID: ${financiacion.id}, ${financiacion.cantidadCuotas} cuotas de $${financiacion.montoCuota}`);
    
  } catch (error) {
    console.error('❌ Error durante la inserción:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
    console.log('=== SCRIPT FINALIZADO ===');
  }
}

insertarFinanciacion(); 