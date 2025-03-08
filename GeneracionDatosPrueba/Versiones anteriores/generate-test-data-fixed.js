const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script CORREGIDO para generar datos de prueba
 * Solución al problema: Verificar si el usuario secundario ya existe
 */

// Utilidades para generar datos aleatorios
function randomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDate(startDate, endDate) {
  const minTime = startDate.getTime();
  const maxTime = endDate.getTime();
  const randomTime = minTime + Math.random() * (maxTime - minTime);
  return new Date(randomTime);
}

async function generateTestData() {
  console.log('=== INICIANDO GENERACIÓN DE DATOS (VERSIÓN CORREGIDA) ===');
  
  try {
    // ===== LIMPIEZA INICIAL =====
    console.log('\n----- LIMPIANDO DATOS PREVIOS -----');
    
    await prisma.financiacion.deleteMany();
    console.log('✓ Financiaciones eliminadas');
    
    await prisma.presupuesto.deleteMany();
    console.log('✓ Presupuestos eliminados');
    
    await prisma.gasto.deleteMany();
    console.log('✓ Gastos eliminados');
    
    await prisma.gastoRecurrente.deleteMany();
    console.log('✓ Gastos recurrentes eliminados');
    
    await prisma.grupoMiembro.deleteMany();
    console.log('✓ Miembros de grupos eliminados');
    
    await prisma.grupo.deleteMany();
    console.log('✓ Grupos eliminados');
    
    // ===== CONFIGURAR USUARIOS =====
    console.log('\n----- CONFIGURANDO USUARIOS -----');
    
    // Buscar o crear usuario principal
    let usuarioPrincipal = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'jpautasso@example.com' },
          { email: { contains: 'jpaut' } }
        ]
      }
    });
    
    if (!usuarioPrincipal) {
      usuarioPrincipal = await prisma.user.create({
        data: {
          name: 'Juan Pautasso',
          email: 'jpautasso@example.com',
          password: '$2a$10$aBcDeFgHiJkLmNoPqRsTuVwXyZ123456789AbCdEfGh',
          image: 'https://i.pravatar.cc/150?u=jpautasso'
        }
      });
      console.log(`✓ Usuario principal creado: ${usuarioPrincipal.name}`);
    } else {
      console.log(`✓ Usuario principal encontrado: ${usuarioPrincipal.name}`);
    }
    
    // Buscar o crear usuario secundario (CORREGIDO)
    let usuarioSecundario = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'ana.garcia@example.com' },
          { name: 'Ana García' }
        ]
      }
    });
    
    if (!usuarioSecundario) {
      // Generar email único
      const emailUnico = `ana.garcia.${Date.now()}@example.com`;
      
      usuarioSecundario = await prisma.user.create({
        data: {
          name: 'Ana García',
          email: emailUnico,
          password: '$2a$10$aBcDeFgHiJkLmNoPqRsTuVwXyZ987654321AbCdEfGh',
          image: 'https://i.pravatar.cc/150?u=anagarcia'
        }
      });
      console.log(`✓ Usuario secundario creado: ${usuarioSecundario.name}`);
    } else {
      console.log(`✓ Usuario secundario encontrado: ${usuarioSecundario.name}`);
    }
    
    // ===== CREAR GRUPO COMPARTIDO =====
    console.log('\n----- CREANDO GRUPO COMPARTIDO -----');
    
    const grupo = await prisma.grupo.create({
      data: {
        nombre: 'Gastos Compartidos',
        descripcion: 'Grupo para compartir gastos entre amigos',
        admin: {
          connect: {
            id: usuarioPrincipal.id
          }
        }
      }
    });
    console.log(`✓ Grupo creado: ${grupo.nombre} (ID: ${grupo.id})`);
    
    // Añadir ambos usuarios como miembros
    await prisma.grupoMiembro.create({
      data: {
        rol: 'admin',
        grupo: { connect: { id: grupo.id } },
        user: { connect: { id: usuarioPrincipal.id } }
      }
    });
    
    await prisma.grupoMiembro.create({
      data: {
        rol: 'miembro',
        grupo: { connect: { id: grupo.id } },
        user: { connect: { id: usuarioSecundario.id } }
      }
    });
    console.log('✓ Ambos usuarios añadidos al grupo');
    
    // ===== VERIFICAR CATEGORÍAS =====
    console.log('\n----- VERIFICANDO CATEGORÍAS -----');
    
    // Categorías estándar
    const categorias = [
      { descripcion: 'Vivienda', grupo_categoria: 'Básicos' },
      { descripcion: 'Alimentación', grupo_categoria: 'Básicos' },
      { descripcion: 'Transporte', grupo_categoria: 'Básicos' },
      { descripcion: 'Servicios', grupo_categoria: 'Básicos' },
      { descripcion: 'Salud', grupo_categoria: 'Bienestar' },
      { descripcion: 'Educación', grupo_categoria: 'Bienestar' },
      { descripcion: 'Entretenimiento', grupo_categoria: 'Ocio' },
      { descripcion: 'Viajes', grupo_categoria: 'Ocio' },
      { descripcion: 'Tecnología', grupo_categoria: 'Digital' }
    ];
    
    // Mapa para almacenar IDs de categorías
    const categoriasMap = {};
    
    // Verificar cada categoría
    for (const cat of categorias) {
      let categoria = await prisma.categoria.findFirst({
        where: { descripcion: cat.descripcion }
      });
      
      if (!categoria) {
        categoria = await prisma.categoria.create({
          data: {
            descripcion: cat.descripcion,
            grupo_categoria: cat.grupo_categoria,
            status: true
          }
        });
        console.log(`✓ Categoría creada: ${categoria.descripcion}`);
      } else {
        console.log(`✓ Categoría existente: ${categoria.descripcion}`);
      }
      
      categoriasMap[cat.descripcion] = categoria.id;
    }
    
    // ===== CREAR TRANSACCIONES =====
    console.log('\n----- CREANDO TRANSACCIONES DE EJEMPLO -----');
    
    // Crear algunas transacciones básicas
    const transacciones = [
      { concepto: 'Alquiler', monto: 800, categoria: 'Vivienda', usuario: usuarioPrincipal.id },
      { concepto: 'Compra supermercado', monto: 120, categoria: 'Alimentación', usuario: usuarioPrincipal.id },
      { concepto: 'Cena restaurante', monto: 45, categoria: 'Alimentación', usuario: usuarioSecundario.id },
      { concepto: 'Taxi', monto: 15, categoria: 'Transporte', usuario: usuarioSecundario.id },
      { concepto: 'Cine', monto: 30, categoria: 'Entretenimiento', usuario: usuarioPrincipal.id, grupo: grupo.id },
      { concepto: 'Viaje fin de semana', monto: 350, categoria: 'Viajes', usuario: usuarioPrincipal.id, grupo: grupo.id }
    ];
    
    for (const t of transacciones) {
      const categoriaId = categoriasMap[t.categoria];
      
      if (!categoriaId) {
        console.warn(`⚠ No se encontró la categoría ${t.categoria}`);
        continue;
      }
      
      const data = {
        concepto: t.concepto,
        monto: t.monto,
        fecha: new Date(),
        categoria: t.categoria,
        tipoTransaccion: 'gasto',
        tipoMovimiento: randomElement(['efectivo', 'tarjeta', 'transferencia']),
        categoriaRel: {
          connect: { id: categoriaId }
        },
        user: {
          connect: { id: t.usuario }
        }
      };
      
      // Si hay grupo, agregarlo
      if (t.grupo) {
        data.grupo = { connect: { id: t.grupo } };
      }
      
      await prisma.gasto.create({ data });
    }
    
    console.log(`✓ Creadas ${transacciones.length} transacciones básicas`);
    
    // ===== CREAR FINANCIACIÓN =====
    console.log('\n----- CREANDO FINANCIACIÓN DE EJEMPLO -----');
    
    // Crear un gasto grande para financiar
    const gastoGrande = await prisma.gasto.create({
      data: {
        concepto: 'MacBook Pro',
        monto: 1500,
        fecha: new Date(),
        categoria: 'Tecnología',
        tipoTransaccion: 'gasto',
        tipoMovimiento: 'tarjeta',
        categoriaRel: {
          connect: { id: categoriasMap['Tecnología'] }
        },
        user: {
          connect: { id: usuarioPrincipal.id }
        }
      }
    });
    
    // Crear la financiación
    const fechaPrimerPago = new Date();
    fechaPrimerPago.setMonth(fechaPrimerPago.getMonth() + 1);
    
    const fechaProximoPago = new Date(fechaPrimerPago);
    fechaProximoPago.setMonth(fechaProximoPago.getMonth() + 1);
    
    await prisma.financiacion.create({
      data: {
        cantidadCuotas: 12,
        cuotasPagadas: 0,
        cuotasRestantes: 12,
        montoCuota: 125,
        fechaPrimerPago: fechaPrimerPago,
        fechaProximoPago: fechaProximoPago,
        diaPago: fechaPrimerPago.getDate(),
        gasto: {
          connect: { id: gastoGrande.id }
        },
        user: {
          connect: { id: usuarioPrincipal.id }
        }
      }
    });
    
    console.log('✓ Financiación creada para MacBook Pro (12 cuotas)');
    
    console.log('\n=== GENERACIÓN DE DATOS COMPLETADA CON ÉXITO ===');
    console.log('Ahora puedes ejecutar add-more-financiaciones.js para añadir más financiaciones');
    
  } catch (error) {
    console.error('\n❌ ERROR EN LA GENERACIÓN DE DATOS:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
    console.log('\n=== SCRIPT FINALIZADO ===');
  }
}

// Ejecutar el script
generateTestData(); 