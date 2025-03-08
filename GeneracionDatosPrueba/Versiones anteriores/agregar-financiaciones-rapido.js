const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * SCRIPT DIRECTO DE EMERGENCIA
 * Solo añade financiaciones sin modificar NADA más en la base de datos.
 * NO elimina datos, NO limpia nada, solo AÑADE financiaciones.
 */

async function agregarFinanciacionesRapido() {
  console.log('=== SCRIPT DE EMERGENCIA: SOLO AGREGAR FINANCIACIONES ===');
  console.log('Este script no eliminará ni modificará ningún dato existente');
  
  try {
    // Obtener el usuario principal (sin eliminar nada)
    const usuario = await prisma.user.findFirst();
    if (!usuario) {
      console.error('ERROR: No se encontró ningún usuario');
      return;
    }
    console.log(`Usuario encontrado: ${usuario.name} (${usuario.id})`);
    
    // Verificar categorías necesarias
    const categorias = ['Tecnología', 'Vivienda', 'Viajes', 'Transporte', 'Educación', 'Entretenimiento'];
    const categoriasMap = {};
    
    // Comprobar si existen las categorías
    for (const nombreCategoria of categorias) {
      let categoria = await prisma.categoria.findFirst({
        where: { descripcion: nombreCategoria }
      });
      
      if (!categoria) {
        // Crear la categoría si no existe
        categoria = await prisma.categoria.create({
          data: {
            descripcion: nombreCategoria,
            grupo_categoria: 'Financiaciones',
            status: true
          }
        });
        console.log(`Categoría creada: ${categoria.descripcion}`);
      } else {
        console.log(`Categoría existente: ${categoria.descripcion}`);
      }
      
      categoriasMap[nombreCategoria] = categoria.id;
    }
    
    // Lista de financiaciones para crear
    const financiaciones = [
      { concepto: 'iPhone 14 Pro', monto: 1299, categoria: 'Tecnología', cuotas: 12 },
      { concepto: 'Smart TV 55"', monto: 799, categoria: 'Tecnología', cuotas: 6 },
      { concepto: 'Muebles de cocina', monto: 2500, categoria: 'Vivienda', cuotas: 18 },
      { concepto: 'Lavadora', monto: 699, categoria: 'Vivienda', cuotas: 9 },
      { concepto: 'Viaje a Europa', monto: 3000, categoria: 'Viajes', cuotas: 24 },
      { concepto: 'Bicicleta eléctrica', monto: 899, categoria: 'Transporte', cuotas: 8 },
      { concepto: 'Curso de programación', monto: 1200, categoria: 'Educación', cuotas: 12 },
      { concepto: 'Consola PS5', monto: 599, categoria: 'Entretenimiento', cuotas: 6 }
    ];
    
    // Crear cada financiación
    let contadorFinanciaciones = 0;
    for (let i = 0; i < financiaciones.length; i++) {
      const f = financiaciones[i];
      
      // 1. Crear el gasto asociado
      console.log(`Creando gasto para ${f.concepto}...`);
      const fechaGasto = new Date();
      fechaGasto.setMonth(fechaGasto.getMonth() - (i % 6)); // Distribuir en los últimos 6 meses
      
      // Obtener ID de categoría
      const categoriaId = categoriasMap[f.categoria];
      if (!categoriaId) {
        console.warn(`⚠️ No se pudo encontrar la categoría ${f.categoria}, saltando...`);
        continue;
      }
      
      // Crear gasto
      const gasto = await prisma.gasto.create({
        data: {
          concepto: f.concepto,
          monto: f.monto,
          fecha: fechaGasto,
          categoria: f.categoria,
          tipoTransaccion: 'gasto',
          tipoMovimiento: 'tarjeta',
          categoriaRel: {
            connect: { id: categoriaId }
          },
          user: {
            connect: { id: usuario.id }
          }
        }
      });
      console.log(`✓ Gasto creado: ${gasto.id}`);
      
      // 2. Crear la financiación
      console.log(`Creando financiación para ${f.concepto}...`);
      const fechaPrimerPago = new Date(fechaGasto);
      fechaPrimerPago.setMonth(fechaPrimerPago.getMonth() + 1);
      
      const fechaProximoPago = new Date(fechaPrimerPago);
      fechaProximoPago.setMonth(fechaProximoPago.getMonth() + 1);
      
      // Crear financiación
      await prisma.financiacion.create({
        data: {
          cantidadCuotas: f.cuotas,
          cuotasPagadas: 0,
          cuotasRestantes: f.cuotas,
          montoCuota: Math.round((f.monto / f.cuotas) * 100) / 100,
          fechaPrimerPago: fechaPrimerPago,
          fechaProximoPago: fechaProximoPago,
          diaPago: fechaPrimerPago.getDate() > 28 ? 28 : fechaPrimerPago.getDate(),
          gasto: {
            connect: { id: gasto.id }
          },
          user: {
            connect: { id: usuario.id }
          }
        }
      });
      
      contadorFinanciaciones++;
      console.log(`✅ Financiación creada: ${f.concepto} - ${f.cuotas} cuotas`);
    }
    
    console.log(`\n===== RESUMEN =====`);
    console.log(`Se han agregado ${contadorFinanciaciones} financiaciones a la base de datos.`);
    console.log(`Financiaciones disponibles ahora para pruebas y evaluación.`);
    
  } catch (error) {
    console.error('\n❌ ERROR AL AGREGAR FINANCIACIONES:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
    console.log('\n=== SCRIPT FINALIZADO ===');
  }
}

// Ejecutar inmediatamente
agregarFinanciacionesRapido(); 