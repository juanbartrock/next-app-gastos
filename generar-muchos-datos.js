const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * SCRIPT DE RECUPERACIÓN MASIVA DE DATOS
 * 
 * Este script NO elimina datos existentes.
 * Añade:
 * - Cientos de gastos distribuidos en los últimos 6 meses
 * - Gastos recurrentes para el usuario jpautasso
 * - Presupuestos mensuales
 * - Conserva financiaciones existentes
 */

// Función para generar fecha aleatoria en los últimos 6 meses
function fechaAleatoria(mesesAtras = 6) {
  const hoy = new Date();
  const fechaMinima = new Date();
  fechaMinima.setMonth(hoy.getMonth() - mesesAtras);
  
  return new Date(
    fechaMinima.getTime() + Math.random() * (hoy.getTime() - fechaMinima.getTime())
  );
}

// Función para generar monto aleatorio entre min y max
function montoAleatorio(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

// Función para seleccionar elemento aleatorio de un array
function elementoAleatorio(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Definición de categorías
const categoriasComunes = [
  { descripcion: 'Alimentación', grupo_categoria: 'Gastos Básicos' },
  { descripcion: 'Transporte', grupo_categoria: 'Gastos Básicos' },
  { descripcion: 'Vivienda', grupo_categoria: 'Gastos Básicos' },
  { descripcion: 'Servicios', grupo_categoria: 'Gastos Básicos' },
  { descripcion: 'Ocio', grupo_categoria: 'Entretenimiento' },
  { descripcion: 'Restaurantes', grupo_categoria: 'Entretenimiento' },
  { descripcion: 'Viajes', grupo_categoria: 'Entretenimiento' },
  { descripcion: 'Salud', grupo_categoria: 'Salud y Bienestar' },
  { descripcion: 'Medicamentos', grupo_categoria: 'Salud y Bienestar' },
  { descripcion: 'Deporte', grupo_categoria: 'Salud y Bienestar' },
  { descripcion: 'Ropa', grupo_categoria: 'Compras' },
  { descripcion: 'Tecnología', grupo_categoria: 'Compras' },
  { descripcion: 'Educación', grupo_categoria: 'Desarrollo Personal' },
  { descripcion: 'Libros', grupo_categoria: 'Desarrollo Personal' },
  { descripcion: 'Regalos', grupo_categoria: 'Otros' },
  { descripcion: 'Mascotas', grupo_categoria: 'Otros' },
  { descripcion: 'Suscripciones', grupo_categoria: 'Recurrentes' },
  { descripcion: 'Ingresos', grupo_categoria: 'Ingresos' }
];

// Conceptos por categoría para generar datos más realistas
const conceptosPorCategoria = {
  'Alimentación': ['Supermercado', 'Verdulería', 'Carnicería', 'Panadería', 'Almacén', 'Compra semanal'],
  'Transporte': ['Gasolina', 'Estacionamiento', 'Peaje', 'Transporte público', 'Taxi', 'Uber', 'Reparación coche'],
  'Vivienda': ['Alquiler', 'Hipoteca', 'Seguro hogar', 'Mantenimiento', 'Muebles', 'Decoración'],
  'Servicios': ['Electricidad', 'Agua', 'Gas', 'Internet', 'Telefonía móvil', 'Netflix', 'Spotify'],
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
  'Suscripciones': ['Streaming', 'Gimnasio', 'Revistas', 'Software', 'Cloud storage'],
  'Ingresos': ['Salario', 'Bonificación', 'Devolución', 'Venta', 'Alquiler', 'Dividendos', 'Freelance']
};

// Recurrentes comunes por categoría
const recurrentesPorCategoria = {
  'Servicios': [
    { concepto: 'Netflix', monto: 14.99, frecuencia: 'mensual' },
    { concepto: 'Spotify', monto: 9.99, frecuencia: 'mensual' },
    { concepto: 'Internet Fibra', monto: 49.99, frecuencia: 'mensual' },
    { concepto: 'Telefonía Móvil', monto: 29.99, frecuencia: 'mensual' }
  ],
  'Vivienda': [
    { concepto: 'Alquiler', monto: 850.00, frecuencia: 'mensual' },
    { concepto: 'Seguro Hogar', monto: 120.00, frecuencia: 'trimestral' }
  ],
  'Salud': [
    { concepto: 'Seguro Médico', monto: 80.00, frecuencia: 'mensual' },
    { concepto: 'Gimnasio', monto: 45.00, frecuencia: 'mensual' }
  ],
  'Transporte': [
    { concepto: 'Bono Transporte', monto: 40.00, frecuencia: 'mensual' },
    { concepto: 'Seguro Coche', monto: 180.00, frecuencia: 'trimestral' }
  ],
  'Educación': [
    { concepto: 'Curso Online', monto: 25.00, frecuencia: 'mensual' },
    { concepto: 'Plataforma Aprendizaje', monto: 19.99, frecuencia: 'mensual' }
  ]
};

// Función principal de generación de datos
async function generarMuchosDatos() {
  console.log('=== GENERANDO GRANDES CANTIDADES DE DATOS SIN ELIMINAR NADA ===');
  
  try {
    // Buscar al usuario jpautasso
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
    
    // Asegurar que existan todas las categorías necesarias
    const categoriasMap = {};
    
    for (const cat of categoriasComunes) {
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
    
    // Verificar si existe un grupo para el usuario
    let grupo = await prisma.grupo.findFirst({
      where: {
        usuarioId: usuario.id
      }
    });
    
    if (!grupo) {
      grupo = await prisma.grupo.create({
        data: {
          nombre: 'Grupo Personal',
          descripcion: 'Mi grupo personal de gastos',
          usuario: {
            connect: { id: usuario.id }
          }
        }
      });
      console.log(`✓ Grupo personal creado para ${usuario.name}`);
    } else {
      console.log(`✓ Grupo existente: ${grupo.nombre}`);
    }
    
    // 1. GENERAR GASTOS E INGRESOS (MUCHOS)
    console.log('\n=== GENERANDO CIENTOS DE GASTOS E INGRESOS ===');
    
    // Cantidad de gastos por mes (multiplicado por 6 meses)
    const gastosPorMes = 50; // 50 gastos por mes × 6 meses = 300 gastos
    const ingresosPorMes = 5; // 5 ingresos por mes × 6 meses = 30 ingresos
    let contadorGastos = 0;
    let contadorIngresos = 0;
    
    // Generar ingresos mensuales para los últimos 6 meses
    for (let mes = 0; mes < 6; mes++) {
      const fechaMes = new Date();
      fechaMes.setMonth(fechaMes.getMonth() - mes);
      fechaMes.setDate(Math.floor(Math.random() * 28) + 1); // Día aleatorio del mes
      
      // Ingreso principal (salario)
      await prisma.gasto.create({
        data: {
          concepto: 'Salario',
          monto: montoAleatorio(2800, 3200),
          fecha: fechaMes,
          tipoTransaccion: 'ingreso',
          tipoMovimiento: 'transferencia',
          categoria: 'Ingresos',
          categoriaRel: {
            connect: { id: categoriasMap['Ingresos'] }
          },
          user: {
            connect: { id: usuario.id }
          }
        }
      });
      contadorIngresos++;
      
      // Otros ingresos aleatorios
      for (let i = 0; i < ingresosPorMes - 1; i++) {
        const conceptoIngreso = elementoAleatorio(conceptosPorCategoria['Ingresos']);
        const fechaIngreso = new Date(fechaMes);
        fechaIngreso.setDate(Math.floor(Math.random() * 28) + 1);
        
        await prisma.gasto.create({
          data: {
            concepto: conceptoIngreso,
            monto: montoAleatorio(100, 500),
            fecha: fechaIngreso,
            tipoTransaccion: 'ingreso',
            tipoMovimiento: elementoAleatorio(['efectivo', 'transferencia']),
            categoria: 'Ingresos',
            categoriaRel: {
              connect: { id: categoriasMap['Ingresos'] }
            },
            user: {
              connect: { id: usuario.id }
            }
          }
        });
        contadorIngresos++;
      }
    }
    console.log(`✅ Generados ${contadorIngresos} ingresos`);
    
    // Generar gastos para los últimos 6 meses (distribuidos diariamente)
    for (let i = 0; i < gastosPorMes * 6; i++) {
      // Seleccionar categoría aleatoria (excepto Ingresos)
      const categoriasPosibles = categoriasComunes.filter(c => c.descripcion !== 'Ingresos');
      const categoriaAleatoria = elementoAleatorio(categoriasPosibles).descripcion;
      
      // Seleccionar concepto aleatorio para esa categoría
      const conceptoAleatorio = elementoAleatorio(conceptosPorCategoria[categoriaAleatoria] || ['Gasto general']);
      
      // Crear el gasto
      await prisma.gasto.create({
        data: {
          concepto: conceptoAleatorio,
          monto: montoAleatorio(5, 200),
          fecha: fechaAleatoria(),
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
    console.log(`✅ Generados ${contadorGastos} gastos totales`);
    
    // 2. GENERAR GASTOS RECURRENTES
    console.log('\n=== GENERANDO GASTOS RECURRENTES ===');
    let contadorRecurrentes = 0;
    
    // Recorrer categorías con recurrentes típicos
    for (const [categoria, recurrentes] of Object.entries(recurrentesPorCategoria)) {
      for (const recurrente of recurrentes) {
        await prisma.recurringExpense.create({
          data: {
            descripcion: recurrente.concepto,
            monto: recurrente.monto,
            frecuencia: recurrente.frecuencia,
            fechaInicio: new Date(2024, 0, 1), // Desde enero 2024
            diaPago: Math.floor(Math.random() * 28) + 1,
            categoria: categoria,
            activo: true,
            usuario: {
              connect: { id: usuario.id }
            },
            categoriaRel: {
              connect: { id: categoriasMap[categoria] }
            }
          }
        });
        contadorRecurrentes++;
      }
    }
    
    // Añadir algunos recurrentes personalizados
    const recurrentesPersonalizados = [
      { concepto: 'Suscripción Amazon Prime', categoria: 'Suscripciones', monto: 49.99, frecuencia: 'anual' },
      { concepto: 'Suscripción PlayStation Plus', categoria: 'Suscripciones', monto: 9.99, frecuencia: 'mensual' },
      { concepto: 'Mantenimiento Coche', categoria: 'Transporte', monto: 120, frecuencia: 'semestral' },
      { concepto: 'Donación ONG', categoria: 'Otros', monto: 15, frecuencia: 'mensual' }
    ];
    
    for (const rec of recurrentesPersonalizados) {
      await prisma.recurringExpense.create({
        data: {
          descripcion: rec.concepto,
          monto: rec.monto,
          frecuencia: rec.frecuencia,
          fechaInicio: new Date(2024, 0, 1),
          diaPago: Math.floor(Math.random() * 28) + 1,
          categoria: rec.categoria,
          activo: true,
          usuario: {
            connect: { id: usuario.id }
          },
          categoriaRel: {
            connect: { id: categoriasMap[rec.categoria] }
          }
        }
      });
      contadorRecurrentes++;
    }
    
    console.log(`✅ Generados ${contadorRecurrentes} gastos recurrentes`);
    
    // 3. GENERAR PRESUPUESTOS
    console.log('\n=== GENERANDO PRESUPUESTOS MENSUALES ===');
    const presupuestosPorCategoria = {
      'Alimentación': montoAleatorio(400, 500),
      'Transporte': montoAleatorio(150, 200),
      'Ocio': montoAleatorio(200, 300),
      'Restaurantes': montoAleatorio(200, 250),
      'Salud': montoAleatorio(100, 150),
      'Ropa': montoAleatorio(150, 200)
    };
    
    let contadorPresupuestos = 0;
    const mesActual = new Date();
    
    for (const [categoria, monto] of Object.entries(presupuestosPorCategoria)) {
      await prisma.presupuesto.create({
        data: {
          monto: monto,
          fechaInicio: new Date(mesActual.getFullYear(), mesActual.getMonth(), 1),
          fechaFin: new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0),
          categoria: {
            connect: { id: categoriasMap[categoria] }
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
          connect: { id: grupo.id }
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
    console.log('\nTodos los datos fueron AÑADIDOS, no se eliminó ningún dato existente.');
    
  } catch (error) {
    console.error('\n❌ ERROR AL GENERAR DATOS:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
    console.log('\n=== SCRIPT FINALIZADO ===');
  }
}

// Ejecutar inmediatamente
generarMuchosDatos(); 