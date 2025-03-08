const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Función principal minimalista - un solo registro por tabla
async function populateMinimalData() {
  console.log('=== INICIANDO SCRIPT MINIMALISTA ===');
  console.log('Insertando un solo registro en cada tabla para verificar estructura');
  
  try {
    // 1. Obtener el primer usuario existente en la base de datos
    const usuario = await prisma.user.findFirst();
    if (!usuario) {
      console.error('No se encontró ningún usuario en la base de datos. El script no puede continuar.');
      return;
    }
    console.log(`\n[USUARIO ENCONTRADO] ID: ${usuario.id}, Nombre: ${usuario.name}`);
    
    // 2. Limpiar datos existentes
    console.log('\n[LIMPIANDO DATOS EXISTENTES]');
    await prisma.financiacion.deleteMany();
    await prisma.presupuesto.deleteMany();
    await prisma.gasto.deleteMany();
    await prisma.gastoRecurrente.deleteMany();
    await prisma.grupo.deleteMany();
    console.log('✓ Datos eliminados con éxito');
    
    // 3. Crear un grupo
    console.log('\n[INSERTANDO GRUPO]');
    const grupo = await prisma.grupo.create({
      data: {
        nombre: "Grupo Básico",
        descripcion: "Grupo para pruebas básicas",
        miembros: {
          connect: { id: usuario.id }
        },
        admin: {
          connect: { id: usuario.id }
        }
      }
    });
    console.log(`✓ Grupo creado: ${grupo.nombre} (ID: ${grupo.id})`);
    
    // 4. Crear o verificar una categoría
    console.log('\n[VERIFICANDO/CREANDO CATEGORÍA]');
    let categoria = await prisma.categoria.findFirst({
      where: { descripcion: "Prueba" }
    });
    
    if (!categoria) {
      categoria = await prisma.categoria.create({
        data: {
          descripcion: "Prueba",
          grupo: "Básicos"
        }
      });
      console.log(`✓ Categoría creada: ${categoria.descripcion} (ID: ${categoria.id})`);
    } else {
      console.log(`✓ Categoría existente: ${categoria.descripcion} (ID: ${categoria.id})`);
    }
    
    // 5. Crear un gasto recurrente
    console.log('\n[INSERTANDO GASTO RECURRENTE]');
    const gastoRecurrente = await prisma.gastoRecurrente.create({
      data: {
        concepto: "Suscripción Básica",
        monto: 15.99,
        categoriaId: categoria.id,
        periodicidad: "mensual",
        userId: usuario.id,
        estado: "activo",
        categoria: categoria.descripcion
      }
    });
    console.log(`✓ Gasto recurrente creado: ${gastoRecurrente.concepto} (ID: ${gastoRecurrente.id})`);
    
    // 6. Crear un presupuesto
    console.log('\n[INSERTANDO PRESUPUESTO]');
    const presupuesto = await prisma.presupuesto.create({
      data: {
        nombre: "Presupuesto Básico", // Campo obligatorio
        grupo: "Básicos",
        monto: 500,
        mes: new Date().getMonth() + 1,
        año: new Date().getFullYear(),
        userId: usuario.id
      }
    });
    console.log(`✓ Presupuesto creado: ${presupuesto.nombre} (ID: ${presupuesto.id})`);
    
    // 7. Crear un gasto/transacción
    console.log('\n[INSERTANDO GASTO/TRANSACCIÓN]');
    const gasto = await prisma.gasto.create({
      data: {
        concepto: "Compra de prueba",
        monto: 99.99,
        fecha: new Date(),
        tipoTransaccion: 'gasto',
        tipoMovimiento: 'gasto',
        userId: usuario.id,
        categoriaId: categoria.id,
        categoria: categoria.descripcion
      }
    });
    console.log(`✓ Gasto creado: ${gasto.concepto} (ID: ${gasto.id})`);
    
    // 8. Crear una financiación
    console.log('\n[INSERTANDO FINANCIACIÓN]');
    const fechaInicio = new Date();
    const fechaFin = new Date();
    fechaFin.setMonth(fechaFin.getMonth() + 6);
    
    const financiacion = await prisma.financiacion.create({
      data: {
        montoTotal: 599.94,
        cantidadCuotas: 6,
        montoCuota: 99.99,
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
        estado: "activo",
        descripcion: "Financiación de prueba",
        cuotasRestantes: 6,
        gasto: {
          connect: { id: gasto.id }
        }
      }
    });
    console.log(`✓ Financiación creada: ${financiacion.descripcion} (ID: ${financiacion.id})`);
    
    console.log('\n=== SCRIPT FINALIZADO CON ÉXITO ===');
    console.log('Se ha insertado un registro en cada tabla de la base de datos');
    console.log('Ahora puedes comprobar que todo funciona correctamente');
    
  } catch (error) {
    console.error('\n[ERROR] Se produjo un error durante la ejecución:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función principal
populateMinimalData(); 