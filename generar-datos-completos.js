const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * SCRIPT DE GENERACIÓN MASIVA DE DATOS
 * Basado en el esquema Prisma proporcionado
 * 
 * Este script NO elimina datos existentes.
 * Añade:
 * - Cientos de gastos distribuidos en los últimos 6 meses
 * - Gastos recurrentes para el usuario
 * - Presupuestos mensuales por categoría y grupo
 * - Grupos y miembros si no existen
 * - Conserva financiaciones existentes
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

// Definición de categorías por grupo
const categoriasPorGrupo = {
  'Gastos Básicos': ['Alimentación', 'Transporte', 'Vivienda', 'Servicios'],
  'Entretenimiento': ['Ocio', 'Restaurantes', 'Viajes'],
  'Salud y Bienestar': ['Salud', 'Medicamentos', 'Deporte'],
  'Compras': ['Ropa', 'Tecnología'],
  'Desarrollo Personal': ['Educación', 'Libros'],
  'Otros': ['Regalos', 'Mascotas', 'Donaciones'],
  'Recurrentes': ['Suscripciones'],
  'Ingresos': ['Salario', 'Bonificaciones', 'Ingresos Adicionales']
};

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
  'Salario': ['Nómina mensual', 'Paga extra', 'Devolución de impuestos'],
  'Bonificaciones': ['Bonus anual', 'Comisión', 'Incentivo'],
  'Ingresos Adicionales': ['Venta de artículos', 'Alquiler', 'Freelance', 'Dividendos', 'Reembolso']
};

// Gastos recurrentes predefinidos
const gastosRecurrentesPredefinidos = [
  { descripcion: 'Netflix', monto: 14.99, frecuencia: 'mensual', categoria: 'Suscripciones' },
  { descripcion: 'Spotify', monto: 9.99, frecuencia: 'mensual', categoria: 'Suscripciones' },
  { descripcion: 'Internet Fibra', monto: 49.99, frecuencia: 'mensual', categoria: 'Servicios' },
  { descripcion: 'Telefonía Móvil', monto: 29.99, frecuencia: 'mensual', categoria: 'Servicios' },
  { descripcion: 'Alquiler', monto: 850.00, frecuencia: 'mensual', categoria: 'Vivienda' },
  { descripcion: 'Seguro Hogar', monto: 120.00, frecuencia: 'trimestral', categoria: 'Vivienda' },
  { descripcion: 'Seguro Médico', monto: 80.00, frecuencia: 'mensual', categoria: 'Salud' },
  { descripcion: 'Gimnasio', monto: 45.00, frecuencia: 'mensual', categoria: 'Deporte' },
  { descripcion: 'Bono Transporte', monto: 40.00, frecuencia: 'mensual', categoria: 'Transporte' },
  { descripcion: 'Seguro Coche', monto: 180.00, frecuencia: 'trimestral', categoria: 'Transporte' },
  { descripcion: 'Curso Online', monto: 25.00, frecuencia: 'mensual', categoria: 'Educación' },
  { descripcion: 'Amazon Prime', monto: 49.99, frecuencia: 'anual', categoria: 'Suscripciones' },
  { descripcion: 'PlayStation Plus', monto: 9.99, frecuencia: 'mensual', categoria: 'Suscripciones' },
  { descripcion: 'Mantenimiento Coche', monto: 120.00, frecuencia: 'semestral', categoria: 'Transporte' },
  { descripcion: 'Donación ONG', monto: 15.00, frecuencia: 'mensual', categoria: 'Donaciones' }
];

// Función principal
async function generarDatosCompletos() {
  console.log('=== GENERANDO DATOS COMPLETOS SIN ELIMINAR EXISTENTES ===');
  
  try {
    // 1. ENCONTRAR USUARIO PRINCIPAL
    console.log('\n--- Buscando usuario principal ---');
    let usuario = await prisma.user.findFirst({
      where: {
        email: {
          contains: 'jpautasso'
        }
      }
    });
    
    if (!usuario) {
      usuario = await prisma.user.findFirst();
      console.log('⚠️ No se encontró el usuario jpautasso, usando usuario alternativo');
    } else {
      console.log(`✅ Usuario encontrado: ${usuario.name} (${usuario.id})`);
    }
    
    if (!usuario) {
      console.error('❌ No se encontró ningún usuario en la base de datos. Abortando.');
      return;
    }
    
    // 2. VERIFICAR Y CREAR CATEGORÍAS
    console.log('\n--- Verificando categorías ---');
    const categoriasMap = {};
    
    for (const [grupoCategoria, categorias] of Object.entries(categoriasPorGrupo)) {
      for (const nombreCategoria of categorias) {
        let categoria = await prisma.categoria.findFirst({
          where: { 
            descripcion: nombreCategoria
          }
        });
        
        if (!categoria) {
          categoria = await prisma.categoria.create({
            data: {
              descripcion: nombreCategoria,
              grupo_categoria: grupoCategoria,
              status: true
            }
          });
          console.log(`✓ Categoría creada: ${nombreCategoria} (${grupoCategoria})`);
        } else {
          console.log(`✓ Categoría existente: ${nombreCategoria}`);
        }
        
        categoriasMap[nombreCategoria] = categoria.id;
      }
    }
    
    // 3. VERIFICAR Y CREAR GRUPO PRINCIPAL
    console.log('\n--- Verificando grupo personal ---');
    let grupoPrincipal = await prisma.grupo.findFirst({
      where: {
        adminId: usuario.id,
        nombre: 'Personal'
      }
    });
    
    if (!grupoPrincipal) {
      grupoPrincipal = await prisma.grupo.create({
        data: {
          nombre: 'Personal',
          descripcion: 'Mi grupo personal de gastos',
          admin: {
            connect: { id: usuario.id }
          }
        }
      });
      console.log(`✓ Grupo personal creado: ${grupoPrincipal.nombre}`);
      
      // Crear relación GrupoMiembro para el administrador
      await prisma.grupoMiembro.create({
        data: {
          rol: 'admin',
          grupo: {
            connect: { id: grupoPrincipal.id }
          },
          user: {
            connect: { id: usuario.id }
          }
        }
      });
      console.log(`✓ Usuario añadido como administrador del grupo`);
    } else {
      console.log(`✓ Grupo existente: ${grupoPrincipal.nombre}`);
    }
    
    // 4. GENERAR INGRESOS MENSUALES
    console.log('\n--- Generando ingresos mensuales ---');
    let contadorIngresos = 0;
    
    for (let mes = 0; mes < 6; mes++) {
      const fechaMes = new Date();
      fechaMes.setMonth(fechaMes.getMonth() - mes);
      
      // Día fijo para los ingresos principales (por ejemplo, día 28)
      fechaMes.setDate(28);
      
      // Ingreso principal (salario)
      await prisma.gasto.create({
        data: {
          concepto: 'Nómina mensual',
          monto: montoAleatorio(2800, 3200),
          fecha: fechaMes,
          tipoTransaccion: 'ingreso',
          tipoMovimiento: 'transferencia',
          categoria: 'Salario',
          categoriaRel: {
            connect: { id: categoriasMap['Salario'] || categoriasMap['Ingresos Adicionales'] }
          },
          user: {
            connect: { id: usuario.id }
          }
        }
      });
      contadorIngresos++;
      
      // Ingresos adicionales aleatorios
      const numIngresosExtra = Math.floor(Math.random() * 3); // 0-2 ingresos extra por mes
      
      for (let i = 0; i < numIngresosExtra; i++) {
        const categoriaIngreso = elementoAleatorio(['Bonificaciones', 'Ingresos Adicionales']);
        const conceptoIngreso = elementoAleatorio(
          conceptosPorCategoria[categoriaIngreso] || ['Ingreso adicional']
        );
        
        // Fecha aleatoria en el mes
        const fechaIngreso = new Date(fechaMes);
        fechaIngreso.setDate(Math.floor(Math.random() * 28) + 1);
        
        await prisma.gasto.create({
          data: {
            concepto: conceptoIngreso,
            monto: montoAleatorio(100, 500),
            fecha: fechaIngreso,
            tipoTransaccion: 'ingreso',
            tipoMovimiento: elementoAleatorio(['efectivo', 'transferencia']),
            categoria: categoriaIngreso,
            categoriaRel: {
              connect: { id: categoriasMap[categoriaIngreso] || categoriasMap['Ingresos Adicionales'] }
            },
            user: {
              connect: { id: usuario.id }
            }
          }
        });
        contadorIngresos++;
      }
    }
    console.log(`✅ Generados ${contadorIngresos} ingresos en total`);
    
    // 5. GENERAR MUCHOS GASTOS DISTRIBUIDOS EN EL TIEMPO
    console.log('\n--- Generando gastos diarios ---');
    let contadorGastos = 0;
    
    // Cantidad de gastos a generar (aproximadamente 300 - unos 50 por mes)
    const TOTAL_GASTOS = 300;
    
    for (let i = 0; i < TOTAL_GASTOS; i++) {
      // Seleccionar un grupo de categoría al azar (excepto Ingresos)
      const gruposCategoria = Object.keys(categoriasPorGrupo).filter(g => g !== 'Ingresos');
      const grupoCategoria = elementoAleatorio(gruposCategoria);
      
      // Seleccionar una categoría de ese grupo
      const categoriaAleatoria = elementoAleatorio(categoriasPorGrupo[grupoCategoria]);
      
      // Seleccionar un concepto para esa categoría
      const conceptoAleatorio = elementoAleatorio(
        conceptosPorCategoria[categoriaAleatoria] || ['Gasto general']
      );
      
      // Crear el gasto
      await prisma.gasto.create({
        data: {
          concepto: conceptoAleatorio,
          monto: montoAleatorio(5, 200),
          fecha: fechaAleatoria(6), // Últimos 6 meses
          tipoTransaccion: 'gasto',
          tipoMovimiento: elementoAleatorio(['efectivo', 'tarjeta', 'transferencia']),
          categoria: categoriaAleatoria,
          categoriaRel: {
            connect: { id: categoriasMap[categoriaAleatoria] }
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
    
    // 6. GENERAR GASTOS RECURRENTES
    console.log('\n--- Generando gastos recurrentes ---');
    let contadorRecurrentes = 0;
    
    for (const recurrente of gastosRecurrentesPredefinidos) {
      // Verificar que la categoría existe
      if (!categoriasMap[recurrente.categoria]) {
        console.log(`⚠️ Categoría ${recurrente.categoria} no encontrada para ${recurrente.descripcion}. Saltando...`);
        continue;
      }
      
      await prisma.gastoRecurrente.create({
        data: {
          descripcion: recurrente.descripcion,
          monto: recurrente.monto,
          frecuencia: recurrente.frecuencia,
          fechaInicio: new Date(2024, 0, 1), // Desde enero 2024
          diaPago: Math.floor(Math.random() * 28) + 1,
          categoria: recurrente.categoria,
          activo: true,
          usuario: {
            connect: { id: usuario.id }
          },
          categoriaRel: {
            connect: { id: categoriasMap[recurrente.categoria] }
          }
        }
      });
      contadorRecurrentes++;
    }
    console.log(`✅ Generados ${contadorRecurrentes} gastos recurrentes`);
    
    // 7. GENERAR PRESUPUESTOS
    console.log('\n--- Generando presupuestos mensuales ---');
    let contadorPresupuestos = 0;
    
    // Categorías para presupuestos
    const categoriasPrioritarias = [
      'Alimentación', 'Transporte', 'Vivienda', 'Servicios', 
      'Ocio', 'Restaurantes', 'Salud', 'Ropa'
    ];
    
    const mesActual = new Date();
    
    // Presupuestos por categoría
    for (const nombreCategoria of categoriasPrioritarias) {
      if (!categoriasMap[nombreCategoria]) continue;
      
      let montoPrespuesto;
      
      switch (nombreCategoria) {
        case 'Alimentación':
          montoPrespuesto = montoAleatorio(400, 500);
          break;
        case 'Vivienda':
          montoPrespuesto = montoAleatorio(800, 1000);
          break;
        case 'Transporte':
          montoPrespuesto = montoAleatorio(150, 200);
          break;
        case 'Servicios':
          montoPrespuesto = montoAleatorio(200, 300);
          break;
        case 'Ocio':
        case 'Restaurantes':
          montoPrespuesto = montoAleatorio(200, 250);
          break;
        default:
          montoPrespuesto = montoAleatorio(100, 200);
      }
      
      await prisma.presupuesto.create({
        data: {
          monto: montoPrespuesto,
          fechaInicio: new Date(mesActual.getFullYear(), mesActual.getMonth(), 1),
          fechaFin: new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0),
          categoria: {
            connect: { id: categoriasMap[nombreCategoria] }
          },
          user: {
            connect: { id: usuario.id }
          }
        }
      });
      contadorPresupuestos++;
    }
    
    // Presupuesto para el grupo
    await prisma.presupuesto.create({
      data: {
        monto: 1000,
        fechaInicio: new Date(mesActual.getFullYear(), mesActual.getMonth(), 1),
        fechaFin: new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0),
        grupo: {
          connect: { id: grupoPrincipal.id }
        },
        user: {
          connect: { id: usuario.id }
        }
      }
    });
    contadorPresupuestos++;
    
    console.log(`✅ Generados ${contadorPresupuestos} presupuestos`);
    
    // RESUMEN FINAL
    console.log('\n===== RESUMEN DE DATOS GENERADOS =====');
    console.log(`✅ Gastos: ${contadorGastos}`);
    console.log(`✅ Ingresos: ${contadorIngresos}`);
    console.log(`✅ Recurrentes: ${contadorRecurrentes}`);
    console.log(`✅ Presupuestos: ${contadorPresupuestos}`);
    console.log(`✅ Total registros añadidos: ${contadorGastos + contadorIngresos + contadorRecurrentes + contadorPresupuestos}`);
    console.log('\n⭐ Todos los datos fueron AÑADIDOS, no se eliminó ningún dato existente.');
    
  } catch (error) {
    console.error('\n❌ ERROR AL GENERAR DATOS:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
    console.log('\n=== SCRIPT FINALIZADO ===');
  }
}

// Ejecutar inmediatamente
generarDatosCompletos(); 