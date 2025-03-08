const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * SCRIPT PARA GENERAR CIENTOS DE GASTOS
 * 
 * Este script añade muchos gastos distribuidos en los últimos 6 meses
 * NO elimina ni modifica ningún dato existente
 * Para poder realizar pruebas con datos abundantes
 */

// Funciones auxiliares
function fechaAleatoria(mesesAtras = 6) {
  const hoy = new Date();
  const fechaMinima = new Date();
  fechaMinima.setMonth(hoy.getMonth() - mesesAtras);
  
  return new Date(
    fechaMinima.getTime() + Math.random() * (hoy.getTime() - fechaMinima.getTime())
  );
}

function montoAleatorio(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function elementoAleatorio(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function generarGastosMasivos() {
  console.log('=== GENERANDO CIENTOS DE GASTOS ===');
  
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
    
    // Obtener todas las categorías existentes
    const categorias = await prisma.categoria.findMany();
    console.log(`✓ Se encontraron ${categorias.length} categorías para usar`);
    
    if (categorias.length === 0) {
      console.error('❌ No se encontraron categorías en la base de datos. Abortando.');
      return;
    }
    
    // Conceptos por categoría
    const conceptosPorCategoria = {
      'Alimentación': ['Supermercado', 'Verdulería', 'Carnicería', 'Panadería', 'Almacén', 'Compra semanal'],
      'Transporte': ['Gasolina', 'Estacionamiento', 'Peaje', 'Transporte público', 'Taxi', 'Uber', 'Reparación coche'],
      'Vivienda': ['Alquiler', 'Hipoteca', 'Seguro hogar', 'Mantenimiento', 'Muebles', 'Decoración'],
      'Servicios': ['Electricidad', 'Agua', 'Gas', 'Internet', 'Telefonía móvil'],
      'Ocio': ['Cine', 'Teatro', 'Concierto', 'Parque de atracciones', 'Museo', 'Evento deportivo'],
      'Restaurantes': ['Desayuno', 'Almuerzo', 'Cena', 'Café', 'Bar', 'Comida rápida', 'Restaurante italiano'],
      'Viajes': ['Vuelos', 'Hotel', 'Alquiler coche', 'Excursión', 'Seguro viaje', 'Souvenirs'],
      'Salud': ['Consulta médica', 'Seguro médico', 'Dentista', 'Oftalmólogo', 'Fisioterapia'],
      'Medicamentos': ['Farmacia', 'Parafarmacia', 'Vitaminas', 'Suplementos'],
      'Deporte': ['Gimnasio', 'Equipamiento deportivo', 'Ropa deportiva', 'Clases deportivas'],
      'Ropa': ['Zapatos', 'Ropa casual', 'Ropa formal', 'Accesorios', 'Centro comercial'],
      'Tecnología': ['Teléfono', 'Ordenador', 'Tablet', 'Accesorios informáticos', 'Software', 'Videojuegos'],
      'Educación': ['Matrícula', 'Material escolar', 'Curso online', 'Clases particulares', 'Máster', 'Certificaciones'],
      'Libros': ['Librería', 'Ebooks', 'Audiolibros', 'Revistas', 'Suscripción editorial'],
      'Regalos': ['Cumpleaños', 'Aniversario', 'Navidad', 'Boda', 'Regalo para amigo'],
      'Mascotas': ['Comida para mascota', 'Veterinario', 'Accesorios mascotas', 'Peluquería mascota'],
      'Suscripciones': ['Netflix', 'Spotify', 'HBO', 'Amazon Prime', 'Disney+', 'Dropbox', 'Adobe CC'],
      'Ingresos': ['Salario', 'Bonus', 'Devolución', 'Venta', 'Alquiler', 'Dividendos', 'Freelance']
    };
    
    // Generar conceptos para las categorías que no están en el mapa
    for (const categoria of categorias) {
      if (!conceptosPorCategoria[categoria.descripcion]) {
        conceptosPorCategoria[categoria.descripcion] = [`Gasto de ${categoria.descripcion}`];
      }
    }
    
    // Configurar número total de gastos a crear (300 = 50 por mes durante 6 meses)
    const TOTAL_GASTOS = 300;
    const TOTAL_INGRESOS = 30; // 5 por mes durante 6 meses
    
    console.log(`Generando ${TOTAL_GASTOS} gastos y ${TOTAL_INGRESOS} ingresos...`);
    
    // 1. Generar ingresos mensuales
    let contadorIngresos = 0;
    
    for (let mes = 0; mes < 6; mes++) {
      const fechaMes = new Date();
      fechaMes.setMonth(fechaMes.getMonth() - mes);
      
      // Salario fijo del día 28
      fechaMes.setDate(28);
      
      // Buscar categoría de ingresos
      const categoriaIngresos = categorias.find(c => 
        c.descripcion.toLowerCase().includes('ingreso') || 
        c.descripcion.toLowerCase().includes('salario')
      );
      
      if (categoriaIngresos) {
        // Ingreso principal mensual
        await prisma.gasto.create({
          data: {
            concepto: 'Nómina mensual',
            monto: montoAleatorio(2800, 3200),
            fecha: fechaMes,
            tipoTransaccion: 'ingreso',
            tipoMovimiento: 'transferencia',
            categoria: categoriaIngresos.descripcion,
            categoriaRel: {
              connect: { id: categoriaIngresos.id }
            },
            user: {
              connect: { id: usuario.id }
            }
          }
        });
        contadorIngresos++;
        
        // Ingresos extra aleatorios
        const ingresosExtraMes = Math.floor(TOTAL_INGRESOS / 6) - 1;
        for (let i = 0; i < ingresosExtraMes; i++) {
          const fechaAleatoriaMes = new Date(fechaMes);
          fechaAleatoriaMes.setDate(Math.floor(Math.random() * 28) + 1);
          
          await prisma.gasto.create({
            data: {
              concepto: elementoAleatorio(conceptosPorCategoria['Ingresos'] || ['Ingreso adicional']),
              monto: montoAleatorio(100, 600),
              fecha: fechaAleatoriaMes,
              tipoTransaccion: 'ingreso',
              tipoMovimiento: elementoAleatorio(['efectivo', 'transferencia']),
              categoria: categoriaIngresos.descripcion,
              categoriaRel: {
                connect: { id: categoriaIngresos.id }
              },
              user: {
                connect: { id: usuario.id }
              }
            }
          });
          contadorIngresos++;
        }
      }
    }
    
    console.log(`✅ Generados ${contadorIngresos} ingresos`);
    
    // 2. Generar gastos
    let contadorGastos = 0;
    
    // Filtrar categorías que no son de ingresos
    const categoriasGastos = categorias.filter(c => 
      !c.descripcion.toLowerCase().includes('ingreso') && 
      !c.descripcion.toLowerCase().includes('salario')
    );
    
    for (let i = 0; i < TOTAL_GASTOS; i++) {
      // Seleccionar categoría aleatoria para el gasto
      const categoriaAleatoria = elementoAleatorio(categoriasGastos);
      
      // Obtener concepto para esa categoría o usar uno genérico
      const conceptosDisponibles = conceptosPorCategoria[categoriaAleatoria.descripcion] || 
                                  [`Gasto de ${categoriaAleatoria.descripcion}`];
      
      const conceptoAleatorio = elementoAleatorio(conceptosDisponibles);
      
      // Generar fecha aleatoria en los últimos 6 meses
      const fecha = fechaAleatoria(6);
      
      // Determinar monto según tipo de categoría
      let monto;
      const descripcionLower = categoriaAleatoria.descripcion.toLowerCase();
      
      if (descripcionLower.includes('vivienda') || descripcionLower.includes('hipoteca')) {
        monto = montoAleatorio(500, 1000);
      } else if (descripcionLower.includes('transporte') || descripcionLower.includes('servicios')) {
        monto = montoAleatorio(50, 200);
      } else if (descripcionLower.includes('alimentación') || descripcionLower.includes('supermercado')) {
        monto = montoAleatorio(30, 150);
      } else if (descripcionLower.includes('ocio') || descripcionLower.includes('restaurante')) {
        monto = montoAleatorio(20, 100);
      } else {
        monto = montoAleatorio(10, 200);
      }
      
      // Crear el gasto
      await prisma.gasto.create({
        data: {
          concepto: conceptoAleatorio,
          monto: monto,
          fecha: fecha,
          tipoTransaccion: 'gasto',
          tipoMovimiento: elementoAleatorio(['efectivo', 'tarjeta', 'transferencia']),
          categoria: categoriaAleatoria.descripcion,
          categoriaRel: {
            connect: { id: categoriaAleatoria.id }
          },
          user: {
            connect: { id: usuario.id }
          }
        }
      });
      
      contadorGastos++;
      
      // Mostrar progreso cada 50 gastos
      if (contadorGastos % 50 === 0) {
        console.log(`✓ Generados ${contadorGastos} gastos hasta ahora...`);
      }
    }
    
    console.log(`✅ Generados ${contadorGastos} gastos en total`);
    
    // Resumen final
    console.log('\n===== RESUMEN =====');
    console.log(`✅ Total Gastos: ${contadorGastos}`);
    console.log(`✅ Total Ingresos: ${contadorIngresos}`);
    console.log(`✅ Total registros añadidos: ${contadorGastos + contadorIngresos}`);
    console.log('⭐ Todos los datos fueron AÑADIDOS, no se eliminó ningún dato existente.');
    
  } catch (error) {
    console.error('\n❌ ERROR AL GENERAR GASTOS MASIVOS:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
    console.log('\n=== SCRIPT FINALIZADO ===');
  }
}

// Ejecutar inmediatamente
generarGastosMasivos(); 