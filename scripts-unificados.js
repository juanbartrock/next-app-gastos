const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runAllScripts() {
  console.log('=== EJECUTANDO SCRIPTS DE TEST UNIFICADOS ===');
  
  try {
    // Verificar si hay un usuario para asociar los datos
    const usuario = await prisma.user.findFirst();
    if (!usuario) {
      console.error('No se encontró ningún usuario');
      return;
    }
    console.log(`Usuario principal: ${usuario.name} (${usuario.id})`);
    
    // 1. Crear grupo y añadir miembro
    console.log('\n----- CREANDO GRUPO -----');
    const grupo = await prisma.grupo.create({
      data: {
        nombre: "Grupo Test Unificado",
        descripcion: "Grupo para datos de prueba",
        admin: {
          connect: {
            id: usuario.id
          }
        }
      }
    });
    console.log(`✅ Grupo creado: ${grupo.nombre} (ID: ${grupo.id})`);
    
    const grupoMiembro = await prisma.grupoMiembro.create({
      data: {
        rol: "miembro",
        grupo: {
          connect: {
            id: grupo.id
          }
        },
        user: {
          connect: {
            id: usuario.id
          }
        }
      }
    });
    console.log(`✅ Usuario añadido como miembro al grupo`);
    
    // 2. Crear categoría
    console.log('\n----- CREANDO CATEGORÍA -----');
    const categoria = await prisma.categoria.create({
      data: {
        descripcion: "Test Unificado",
        grupo_categoria: "Test",
        status: true
      }
    });
    console.log(`✅ Categoría creada: ${categoria.descripcion} (ID: ${categoria.id})`);
    
    // 3. Crear gasto recurrente
    console.log('\n----- CREANDO GASTO RECURRENTE -----');
    const fechaProxima = new Date();
    fechaProxima.setMonth(fechaProxima.getMonth() + 1);
    
    const gastoRecurrente = await prisma.gastoRecurrente.create({
      data: {
        concepto: "Suscripción Test Unificado",
        monto: 25.99,
        periodicidad: "mensual",
        comentario: "Gasto de prueba unificado",
        estado: "activo",
        proximaFecha: fechaProxima,
        ultimoPago: new Date(),
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
      }
    });
    console.log(`✅ Gasto recurrente creado: ${gastoRecurrente.concepto} (ID: ${gastoRecurrente.id})`);
    
    // 4. Crear presupuesto
    console.log('\n----- CREANDO PRESUPUESTO -----');
    const mesActual = new Date().getMonth() + 1;
    const añoActual = new Date().getFullYear();
    
    const presupuesto = await prisma.presupuesto.create({
      data: {
        nombre: "Presupuesto Test Unificado",
        monto: 2000,
        mes: mesActual,
        año: añoActual,
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
      }
    });
    console.log(`✅ Presupuesto creado: ${presupuesto.nombre} (ID: ${presupuesto.id})`);
    
    // 5. Crear gasto
    console.log('\n----- CREANDO GASTO -----');
    const gasto = await prisma.gasto.create({
      data: {
        concepto: "Gasto Test Unificado",
        monto: 149.99,
        fecha: new Date(),
        categoria: categoria.descripcion,
        tipoTransaccion: 'gasto',
        tipoMovimiento: 'efectivo',
        categoriaRel: {
          connect: {
            id: categoria.id
          }
        },
        user: {
          connect: {
            id: usuario.id
          }
        },
        grupo: {
          connect: {
            id: grupo.id
          }
        }
      }
    });
    console.log(`✅ Gasto creado: ${gasto.concepto} (ID: ${gasto.id})`);
    
    // 6. Crear financiación
    console.log('\n----- CREANDO FINANCIACIÓN -----');
    const fechaActual = new Date();
    const fechaProximoPago = new Date();
    fechaProximoPago.setMonth(fechaProximoPago.getMonth() + 1);
    
    // Primero un gasto para financiar
    const gastoFinanciado = await prisma.gasto.create({
      data: {
        concepto: "Compra para financiar",
        monto: 1200,
        fecha: new Date(),
        categoria: categoria.descripcion,
        tipoTransaccion: 'gasto',
        tipoMovimiento: 'efectivo',
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
      }
    });
    console.log(`✅ Gasto financiado creado: ${gastoFinanciado.concepto} (ID: ${gastoFinanciado.id})`);
    
    const financiacion = await prisma.financiacion.create({
      data: {
        cantidadCuotas: 12,
        cuotasPagadas: 0,
        cuotasRestantes: 12,
        montoCuota: 100,
        fechaPrimerPago: fechaActual,
        fechaProximoPago: fechaProximoPago,
        diaPago: fechaActual.getDate(),
        gasto: {
          connect: {
            id: gastoFinanciado.id
          }
        },
        user: {
          connect: {
            id: usuario.id
          }
        }
      }
    });
    console.log(`✅ Financiación creada: 12 cuotas de $${financiacion.montoCuota} (ID: ${financiacion.id})`);
    
    console.log('\n=== SCRIPTS COMPLETADOS CON ÉXITO ===');
    console.log('Todos los datos de prueba han sido creados correctamente');
    
  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA EJECUCIÓN:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
    console.log('\n=== FINALIZADO ===');
  }
}

runAllScripts(); 