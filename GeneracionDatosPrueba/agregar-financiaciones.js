const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * SCRIPT PARA AÑADIR FINANCIACIONES
 * 
 * Este script añade varias financiaciones con sus gastos asociados
 * NO elimina ni modifica ningún dato existente
 */

async function agregarFinanciaciones() {
  console.log('=== AÑADIENDO FINANCIACIONES ===');
  
  try {
    // Buscar al usuario principal
    let usuario = await prisma.user.findFirst({
      where: {
        email: {
          contains: 'jpautasso'
        }
      }
    });
    
    if (!usuario) {
      // Si no existe, buscar cualquier usuario
      usuario = await prisma.user.findFirst();
      console.log('⚠️ No se encontró el usuario jpautasso, usando usuario alternativo');
    } else {
      console.log(`✅ Usuario encontrado: ${usuario.name} (${usuario.id})`);
    }
    
    if (!usuario) {
      console.error('❌ No se encontró ningún usuario en la base de datos. Abortando.');
      return;
    }
    
    // Verificar categorías necesarias
    const categoriasNecesarias = ['Tecnología', 'Vivienda', 'Viajes', 'Transporte', 'Educación', 'Entretenimiento'];
    const categoriasMap = {};
    
    for (const nombreCategoria of categoriasNecesarias) {
      let categoria = await prisma.categoria.findFirst({
        where: { descripcion: nombreCategoria }
      });
      
      if (!categoria) {
        // Crear categoría si no existe
        categoria = await prisma.categoria.create({
          data: {
            descripcion: nombreCategoria,
            grupo_categoria: nombreCategoria === 'Tecnología' ? 'Compras' : 
                             nombreCategoria === 'Viaje' ? 'Entretenimiento' : 
                             nombreCategoria === 'Educación' ? 'Desarrollo Personal' : 
                             'Otros',
            status: true
          }
        });
        console.log(`✓ Categoría creada: ${categoria.descripcion}`);
      } else {
        console.log(`✓ Categoría existente: ${categoria.descripcion}`);
      }
      
      categoriasMap[nombreCategoria] = categoria.id;
    }
    
    // Definir financiaciones a crear
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
    
    // Crear financiaciones
    let contadorFinanciaciones = 0;
    
    for (let i = 0; i < financiaciones.length; i++) {
      const f = financiaciones[i];
      
      // Establecer fecha del gasto (distribuidos en los últimos 6 meses)
      const fechaGasto = new Date();
      fechaGasto.setMonth(fechaGasto.getMonth() - (i % 6));
      fechaGasto.setDate(Math.floor(Math.random() * 28) + 1);
      
      // Crear el gasto asociado
      console.log(`Creando gasto para ${f.concepto}...`);
      
      const gasto = await prisma.gasto.create({
        data: {
          concepto: f.concepto,
          monto: f.monto,
          fecha: fechaGasto,
          tipoTransaccion: 'gasto',
          tipoMovimiento: 'tarjeta',
          categoria: f.categoria,
          categoriaRel: {
            connect: { id: categoriasMap[f.categoria] }
          },
          user: {
            connect: { id: usuario.id }
          }
        }
      });
      console.log(`✓ Gasto creado: ${gasto.id}`);
      
      // Definir fechas para la financiación
      const fechaPrimerPago = new Date(fechaGasto);
      fechaPrimerPago.setMonth(fechaPrimerPago.getMonth() + 1);
      
      const fechaProximoPago = new Date(fechaPrimerPago);
      fechaProximoPago.setMonth(fechaProximoPago.getMonth() + 1);
      
      // Crear la financiación
      console.log(`Creando financiación para ${f.concepto}...`);
      
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
    
    // Resumen final
    console.log('\n===== RESUMEN =====');
    console.log(`✅ Se han añadido ${contadorFinanciaciones} financiaciones a la base de datos`);
    console.log('⭐ Todas las financiaciones se añadieron correctamente');
    
  } catch (error) {
    console.error('\n❌ ERROR AL AÑADIR FINANCIACIONES:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
    console.log('\n=== SCRIPT FINALIZADO ===');
  }
}

// Ejecutar inmediatamente
agregarFinanciaciones(); 