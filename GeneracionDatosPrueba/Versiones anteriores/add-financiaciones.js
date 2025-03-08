const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script simple para añadir más financiaciones a la base de datos existente.
 * No modifica ni elimina ningún dato, solo añade nuevas financiaciones.
 */

// Lista de financiaciones para crear
const FINANCIACIONES_A_CREAR = [
  { concepto: 'iPhone 14 Pro', monto: 1299, categoria: 'Tecnología', cuotas: 12 },
  { concepto: 'Smart TV 55"', monto: 799, categoria: 'Tecnología', cuotas: 6 },
  { concepto: 'Muebles de cocina', monto: 2500, categoria: 'Vivienda', cuotas: 18 },
  { concepto: 'Lavadora', monto: 699, categoria: 'Vivienda', cuotas: 9 },
  { concepto: 'Viaje a Europa', monto: 3000, categoria: 'Viajes', cuotas: 24 },
  { concepto: 'Bicicleta eléctrica', monto: 899, categoria: 'Transporte', cuotas: 8 },
  { concepto: 'Curso de programación', monto: 1200, categoria: 'Educación', cuotas: 12 },
  { concepto: 'Consola PS5', monto: 599, categoria: 'Entretenimiento', cuotas: 6 }
];

async function addMoreFinanciaciones() {
  console.log('=== AÑADIENDO MÁS FINANCIACIONES A LA BASE DE DATOS ===');

  try {
    // 1. Obtener usuarios existentes
    const usuarios = await prisma.user.findMany({
      take: 2
    });

    if (usuarios.length === 0) {
      console.error('No se encontraron usuarios en la base de datos');
      return;
    }

    // Si solo hay un usuario, usarlo para todas las financiaciones
    const usuario1 = usuarios[0];
    const usuario2 = usuarios.length > 1 ? usuarios[1] : usuarios[0];

    console.log(`Usuario principal: ${usuario1.name}`);
    if (usuarios.length > 1) {
      console.log(`Usuario secundario: ${usuario2.name}`);
    }

    // 2. Obtener categorías existentes o crear las necesarias
    const categoriasMap = {};
    for (const financiacion of FINANCIACIONES_A_CREAR) {
      if (!categoriasMap[financiacion.categoria]) {
        // Verificar si la categoría ya existe
        let categoria = await prisma.categoria.findFirst({
          where: { descripcion: financiacion.categoria }
        });

        if (!categoria) {
          // Si no existe, crearla
          categoria = await prisma.categoria.create({
            data: {
              descripcion: financiacion.categoria,
              grupo_categoria: 'Financiaciones',
              status: true
            }
          });
          console.log(`Categoría creada: ${categoria.descripcion}`);
        } else {
          console.log(`Categoría existente: ${categoria.descripcion}`);
        }

        categoriasMap[financiacion.categoria] = categoria.id;
      }
    }

    // 3. Crear las financiaciones
    let financiacionesCreadas = 0;

    for (let i = 0; i < FINANCIACIONES_A_CREAR.length; i++) {
      const financiacion = FINANCIACIONES_A_CREAR[i];
      // Alternar usuarios si hay dos
      const usuario = i % 2 === 0 ? usuario1 : usuario2;

      // Obtener categoría
      const categoriaId = categoriasMap[financiacion.categoria];
      
      // Crear fechas para el gasto, repartidas en los últimos meses
      const fechaHoy = new Date();
      const mesesAtras = i % 6; // Distribuir en los últimos 6 meses
      const fechaGasto = new Date(fechaHoy);
      fechaGasto.setMonth(fechaGasto.getMonth() - mesesAtras);
      
      // Crear el gasto
      const gasto = await prisma.gasto.create({
        data: {
          concepto: financiacion.concepto,
          monto: financiacion.monto,
          fecha: fechaGasto,
          categoria: financiacion.categoria,
          tipoTransaccion: 'gasto',
          tipoMovimiento: 'tarjeta', // Compras grandes suelen ser con tarjeta
          categoriaRel: {
            connect: { id: categoriaId }
          },
          user: {
            connect: { id: usuario.id }
          }
        }
      });

      // Crear la financiación
      const fechaPrimerPago = new Date(fechaGasto);
      fechaPrimerPago.setMonth(fechaPrimerPago.getMonth() + 1);
      
      const fechaProximoPago = new Date(fechaPrimerPago);
      fechaProximoPago.setMonth(fechaProximoPago.getMonth() + 1);
      
      // Asegurarse de tener un número para diaPago
      const diaPago = Math.min(fechaPrimerPago.getDate(), 28); // Para evitar problemas en febrero
      
      await prisma.financiacion.create({
        data: {
          cantidadCuotas: financiacion.cuotas,
          cuotasPagadas: 0,
          cuotasRestantes: financiacion.cuotas,
          montoCuota: Math.round((financiacion.monto / financiacion.cuotas) * 100) / 100,
          fechaPrimerPago: fechaPrimerPago,
          fechaProximoPago: fechaProximoPago,
          diaPago: diaPago,
          gasto: {
            connect: { id: gasto.id }
          },
          user: {
            connect: { id: usuario.id }
          }
        }
      });
      
      financiacionesCreadas++;
      console.log(`✅ Financiación ${financiacionesCreadas} creada: ${financiacion.concepto} - ${financiacion.cuotas} cuotas para ${usuario.name}`);
    }

    console.log('\n=== RESUMEN ===');
    console.log(`Total de financiaciones añadidas: ${financiacionesCreadas}`);
    console.log('Financiaciones añadidas exitosamente a la base de datos');
    
  } catch (error) {
    console.error('\n❌ ERROR AL AÑADIR FINANCIACIONES:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
    console.log('\n=== SCRIPT FINALIZADO ===');
  }
}

// Ejecutar la función principal
addMoreFinanciaciones(); 