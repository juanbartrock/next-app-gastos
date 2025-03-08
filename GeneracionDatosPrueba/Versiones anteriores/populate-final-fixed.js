const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Constantes para categorías predefinidas
const CATEGORIAS = [
  { descripcion: "Vivienda", grupo: "Básicos" },
  { descripcion: "Alimentación", grupo: "Básicos" },
  { descripcion: "Transporte", grupo: "Básicos" },
  { descripcion: "Servicios", grupo: "Básicos" },
  { descripcion: "Salud", grupo: "Bienestar" },
  { descripcion: "Educación", grupo: "Bienestar" },
  { descripcion: "Entretenimiento", grupo: "Ocio" },
  { descripcion: "Viajes", grupo: "Ocio" },
  { descripcion: "Ropa", grupo: "Personal" },
  { descripcion: "Restaurantes", grupo: "Ocio" },
  { descripcion: "Ahorro", grupo: "Inversión" },
  { descripcion: "Inversiones", grupo: "Inversión" },
  { descripcion: "Suscripciones", grupo: "Digital" },
  { descripcion: "Tecnología", grupo: "Digital" },
  { descripcion: "Mascotas", grupo: "Personal" }
];

// Constantes para gastos recurrentes predefinidos
const GASTOS_RECURRENTES = [
  { concepto: "Alquiler", monto: 800, categoria: "Vivienda", periodicidad: "mensual" },
  { concepto: "Netflix", monto: 15, categoria: "Suscripciones", periodicidad: "mensual" },
  { concepto: "Spotify", monto: 10, categoria: "Suscripciones", periodicidad: "mensual" },
  { concepto: "Internet", monto: 50, categoria: "Servicios", periodicidad: "mensual" },
  { concepto: "Teléfono", monto: 40, categoria: "Servicios", periodicidad: "mensual" },
  { concepto: "Electricidad", monto: 70, categoria: "Servicios", periodicidad: "mensual" },
  { concepto: "Agua", monto: 30, categoria: "Servicios", periodicidad: "mensual" },
  { concepto: "Gimnasio", monto: 45, categoria: "Salud", periodicidad: "mensual" },
  { concepto: "Seguro de salud", monto: 120, categoria: "Salud", periodicidad: "mensual" },
  { concepto: "Suscripción revista", monto: 25, categoria: "Suscripciones", periodicidad: "bimestral" },
  { concepto: "Mantenimiento coche", monto: 80, categoria: "Transporte", periodicidad: "bimestral" },
  { concepto: "Impuesto municipal", monto: 60, categoria: "Servicios", periodicidad: "bimestral" },
  { concepto: "Seguro de hogar", monto: 180, categoria: "Vivienda", periodicidad: "semestral" },
  { concepto: "Seguro del coche", monto: 250, categoria: "Transporte", periodicidad: "semestral" }
];

// Eventos especiales para simular gastos extraordinarios
const EVENTOS_ESPECIALES = [
  { tipo: "viaje", monto: 800, concepto: "Viaje de fin de semana", categoria: "Viajes" },
  { tipo: "reparacion", monto: 500, concepto: "Reparación electrodoméstico", categoria: "Vivienda" },
  { tipo: "compra-tecnologia", monto: 1200, concepto: "Compra de nuevo ordenador", categoria: "Tecnología", financiado: true }
];

// Función para generar una fecha aleatoria dentro de un mes específico
function randomDateInMonth(año, mes) {
  const diasEnMes = new Date(año, mes, 0).getDate();
  const dia = Math.floor(Math.random() * diasEnMes) + 1;
  return new Date(año, mes - 1, dia);
}

// Función para generar un valor aleatorio dentro de un rango
function randomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Función para seleccionar un elemento aleatorio de un array
function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Función para generar presupuestos mensuales basados en un ingreso base
function generarPresupuestosMensuales(meses, ingresoBase) {
  const presupuestos = [];
  const grupos = ["Básicos", "Bienestar", "Ocio", "Personal", "Digital"];
  
  // Distribución aproximada del presupuesto
  const distribucion = {
    "Básicos": 0.60, // 60% para gastos básicos
    "Bienestar": 0.08, // 8% para bienestar
    "Ocio": 0.18, // 18% para ocio
    "Personal": 0.06, // 6% para personal
    "Digital": 0.05 // 5% para digital
  };
  
  for (const mes of meses) {
    // Variar el ingreso base ligeramente cada mes (±5%)
    const variaciónPorcentual = 1 + (Math.random() * 0.1 - 0.05);
    const ingresoMensual = Math.round(ingresoBase * variaciónPorcentual);
    
    for (const grupo of grupos) {
      // Calcular el presupuesto para este grupo con una pequeña variación
      const variación = 1 + (Math.random() * 0.06 - 0.03); // ±3%
      const monto = Math.round(ingresoMensual * distribucion[grupo] * variación);
      
      presupuestos.push({
        grupo,
        mes: mes.mes,
        año: mes.año,
        monto
      });
    }
  }
  
  return presupuestos;
}

// Función principal para poblar la base de datos
async function populateDatabase() {
  console.log('Iniciando script de generación de datos...');
  console.log('=== Iniciando generación de datos de prueba ===');
  
  // Definir período de tiempo para generar datos (últimos 6 meses)
  const fechaActual = new Date();
  const meses = [];
  
  for (let i = 0; i < 6; i++) {
    const fecha = new Date(fechaActual);
    fecha.setMonth(fechaActual.getMonth() - 5 + i);
    meses.push({
      mes: fecha.getMonth() + 1,
      año: fecha.getFullYear()
    });
  }
  
  const mesesStr = meses.map(m => `${m.mes}/${m.año}`).join(', ');
  console.log(`Generando datos para 6 meses (${mesesStr})\n`);
  
  // 1. OBTENER USUARIO EXISTENTE
  const usuario = await prisma.user.findFirst();
  
  if (!usuario) {
    console.error('No se encontró ningún usuario en la base de datos.');
    return;
  }
  
  console.log(`Utilizando el usuario: ${usuario.name} (${usuario.id})\n`);
  
  // LIMPIAR DATOS EXISTENTES
  console.log('=== Limpiando datos existentes... ===');
  
  try {
    // Eliminar financiaciones primero
    const deletedFinanciaciones = await prisma.financiacion.deleteMany();
    console.log(`✓ Eliminadas ${deletedFinanciaciones.count} financiaciones`);
    
    // Eliminar presupuestos
    const deletedPresupuestos = await prisma.presupuesto.deleteMany();
    console.log(`✓ Eliminados ${deletedPresupuestos.count} presupuestos`);
    
    // Eliminar gastos
    const deletedGastos = await prisma.gasto.deleteMany();
    console.log(`✓ Eliminados ${deletedGastos.count} gastos`);
    
    // Eliminar gastos recurrentes
    const deletedGastosRecurrentes = await prisma.gastoRecurrente.deleteMany();
    console.log(`✓ Eliminados ${deletedGastosRecurrentes.count} gastos recurrentes`);
    
    // Eliminar grupos
    const deletedGrupos = await prisma.grupo.deleteMany();
    console.log(`✓ Eliminados ${deletedGrupos.count} grupos`);
    
    // No eliminamos categorías para mantener relaciones existentes
    console.log(`✓ Categorías mantenidas para conservar relaciones existentes`);
  } catch (error) {
    console.error('Error al limpiar datos:', error);
  }
  
  // 2. CREAR UN GRUPO ASOCIADO AL USUARIO
  console.log('\n=== Creando grupo para el usuario... ===');
  try {
    const grupo = await prisma.grupo.create({
      data: {
        nombre: "Grupo Personal",
        descripcion: "Grupo personal para gestión de finanzas",
        usuarios: {
          connect: {
            id: usuario.id
          }
        },
        admin: {  // Campo obligatorio según el error
          connect: {
            id: usuario.id
          }
        }
      }
    });
    console.log(`✓ Grupo creado: ${grupo.nombre} (${grupo.id})`);
  } catch (error) {
    console.error('Error creando grupo:', error);
  }
  
  // 3. COMPROBAR CATEGORÍAS EXISTENTES
  console.log('\n=== Comprobando categorías... ===');
  
  // Mapa para almacenar los IDs de categorías por descripción
  const categoriasMap = {};
  
  // Comprobar y/o crear cada categoría
  for (const cat of CATEGORIAS) {
    try {
      // Buscar si ya existe la categoría
      const categoriaExistente = await prisma.categoria.findFirst({
        where: { descripcion: cat.descripcion }
      });
      
      if (categoriaExistente) {
        console.log(`✓ La categoría ${cat.descripcion} ya existe (ID: ${categoriaExistente.id})`);
        categoriasMap[cat.descripcion] = categoriaExistente.id;
      } else {
        // Crear la categoría si no existe
        const nuevaCategoria = await prisma.categoria.create({
          data: {
            descripcion: cat.descripcion,
            grupo: cat.grupo
          }
        });
        console.log(`✓ Creada nueva categoría: ${nuevaCategoria.descripcion} (ID: ${nuevaCategoria.id})`);
        categoriasMap[cat.descripcion] = nuevaCategoria.id;
      }
    } catch (error) {
      console.error(`Error comprobando/creando categoría ${cat.descripcion}:`, error);
    }
  }
  
  // 4. CREAR GASTOS RECURRENTES
  console.log('\n=== Creando gastos recurrentes... ===');
  
  try {
    // Eliminar gastos recurrentes existentes
    const deletedRecurrentes = await prisma.gastoRecurrente.deleteMany({
      where: { userId: usuario.id }
    });
    console.log(`✓ Se eliminaron ${deletedRecurrentes.count} gastos recurrentes existentes`);
    
    // Crear nuevos gastos recurrentes
    for (const gr of GASTOS_RECURRENTES) {
      try {
        // Obtener el ID de la categoría
        const categoriaId = categoriasMap[gr.categoria];
        
        if (!categoriaId) {
          console.warn(`⚠ No se encontró la categoría ${gr.categoria} para el gasto recurrente ${gr.concepto}`);
          continue;
        }
        
        // Crear el gasto recurrente
        await prisma.gastoRecurrente.create({
          data: {
            concepto: gr.concepto,
            monto: gr.monto,
            categoriaId: categoriaId,
            periodicidad: gr.periodicidad,
            userId: usuario.id,
            // Eliminado el campo fechaInicio que causa errores
            estado: "activo",
            categoria: gr.categoria
          }
        });
        console.log(`✓ Creado gasto recurrente: ${gr.concepto} - $${gr.monto} (${gr.periodicidad})`);
      } catch (error) {
        console.error(`Error creando gasto recurrente ${gr.concepto}:`, error);
      }
    }
  } catch (error) {
    console.error('Error general con gastos recurrentes:', error);
  }
  
  // 5. CREAR PRESUPUESTOS MENSUALES
  console.log('\n=== Creando presupuestos... ===');
  
  const ingresoBase = 3000; // Ingreso base mensual
  const presupuestos = generarPresupuestosMensuales(meses, ingresoBase);
  
  for (const presupuesto of presupuestos) {
    try {
      await prisma.presupuesto.create({
        data: {
          nombre: presupuesto.grupo, // Añadido el campo nombre obligatorio
          grupo: presupuesto.grupo,
          monto: presupuesto.monto,
          mes: presupuesto.mes,
          año: presupuesto.año,
          userId: usuario.id
        }
      });
      console.log(`✓ Creado presupuesto para ${presupuesto.grupo}: $${presupuesto.monto} (${presupuesto.mes}/${presupuesto.año})`);
    } catch (error) {
      console.error(`Error creando presupuesto para ${presupuesto.grupo}:`, error);
    }
  }
  
  // 6. CREAR TRANSACCIONES PARA CADA MES
  console.log('\n=== Creando transacciones... ===');
  
  // Eliminar transacciones existentes
  for (const periodo of meses) {
    const startDate = new Date(periodo.año, periodo.mes - 1, 1);
    const endDate = new Date(periodo.año, periodo.mes, 0);
    
    try {
      const deletedTransactions = await prisma.gasto.deleteMany({
        where: {
          fecha: {
            gte: startDate,
            lte: endDate
          },
          userId: usuario.id
        }
      });
      console.log(`✓ Eliminadas ${deletedTransactions.count} transacciones de ${periodo.mes}/${periodo.año}`);
    } catch (error) {
      console.error(`Error eliminando transacciones de ${periodo.mes}/${periodo.año}:`, error);
    }
  }
  
  // Proporciones aproximadas de gastos por categoría
  const proporcionesGasto = {
    "Vivienda": 0.25,
    "Alimentación": 0.2,
    "Transporte": 0.10,
    "Servicios": 0.08,
    "Salud": 0.05,
    "Educación": 0.03,
    "Entretenimiento": 0.06,
    "Viajes": 0.05,
    "Ropa": 0.04,
    "Restaurantes": 0.06,
    "Suscripciones": 0.03,
    "Tecnología": 0.02,
    "Mascotas": 0.02
  };
  
  // Conceptos posibles por categoría
  const conceptosPorCategoria = {
    "Vivienda": ["Alquiler", "Hipoteca", "Mantenimiento", "Muebles", "Decoración", "Productos de limpieza"],
    "Alimentación": ["Supermercado", "Frutas y verduras", "Carnicería", "Panadería", "Bebidas"],
    "Transporte": ["Gasolina", "Transporte público", "Taxi", "Mantenimiento coche", "Estacionamiento"],
    "Servicios": ["Electricidad", "Agua", "Gas", "Internet", "Teléfono"],
    "Salud": ["Médico", "Farmacia", "Dentista", "Gafas", "Análisis"],
    "Educación": ["Libros", "Cursos", "Material escolar", "Clases particulares"],
    "Entretenimiento": ["Cine", "Conciertos", "Videojuegos", "Parque de atracciones", "Eventos"],
    "Viajes": ["Hotel", "Vuelos", "Tren", "Actividades turísticas", "Souvenirs"],
    "Ropa": ["Ropa", "Zapatos", "Accesorios", "Arreglos"],
    "Restaurantes": ["Restaurante", "Bar", "Café", "Comida para llevar", "Comida rápida"],
    "Suscripciones": ["Netflix", "Spotify", "HBO", "Disney+", "Revistas"],
    "Tecnología": ["Smartphone", "Ordenador", "Accesorios", "Software", "Gadgets"],
    "Mascotas": ["Comida mascota", "Veterinario", "Accesorios mascota", "Peluquería mascota"]
  };
  
  for (const periodo of meses) {
    console.log(`\n>> Generando datos para ${periodo.mes}/${periodo.año}...`);
    
    // Crear ingreso mensual con variación
    const variaciónSalario = 1 + (Math.random() * 0.1 - 0.05); // ±5%
    const salarioMensual = Math.round(ingresoBase * variaciónSalario);
    
    try {
      await prisma.gasto.create({
        data: {
          concepto: "Salario",
          monto: salarioMensual,
          fecha: randomDateInMonth(periodo.año, periodo.mes),
          tipoTransaccion: 'ingreso',
          tipoMovimiento: 'ingreso',
          userId: usuario.id,
          categoria: "Ingresos"
        }
      });
      console.log(`✓ Creado ingreso: Salario - $${salarioMensual}`);
    } catch (error) {
      console.error('Error creando ingreso:', error);
    }
    
    // Crear gastos para cada categoría
    for (const categoria in proporcionesGasto) {
      if (!categoriasMap[categoria]) {
        console.warn(`⚠ No se encontró la categoría ${categoria} en el mapa de categorías`);
        continue;
      }
      
      // Calcular gasto aproximado para esta categoría
      const proporcion = proporcionesGasto[categoria];
      const gastoBase = Math.round(salarioMensual * proporcion);
      
      // Determinar cuántas transacciones crear para esta categoría
      const numTransacciones = randomInRange(1, 5);
      let gastoTotal = 0;
      
      for (let i = 0; i < numTransacciones; i++) {
        // Último gasto toma el resto para llegar al gasto base
        const esUltimo = i === numTransacciones - 1;
        let montoTransaccion;
        
        if (esUltimo) {
          montoTransaccion = gastoBase - gastoTotal;
          if (montoTransaccion <= 0) montoTransaccion = randomInRange(10, 30);
        } else {
          const porcentajeGasto = randomInRange(30, 70) / 100;
          montoTransaccion = Math.round(gastoBase * porcentajeGasto);
          gastoTotal += montoTransaccion;
        }
        
        // Seleccionar un concepto aleatorio para esta categoría
        const conceptosDisponibles = conceptosPorCategoria[categoria] || [`Gasto de ${categoria}`];
        const conceptoElegido = randomElement(conceptosDisponibles);
        
        // Asegurarnos de que tenemos el ID de categoría correcto
        const categoriaId = categoriasMap[categoria];
        
        try {
          await prisma.gasto.create({
            data: {
              concepto: conceptoElegido,
              monto: montoTransaccion,
              fecha: randomDateInMonth(periodo.año, periodo.mes),
              tipoTransaccion: 'gasto',
              tipoMovimiento: 'gasto',
              userId: usuario.id,
              categoriaId: categoriaId,
              categoria: categoria
            }
          });
        } catch (error) {
          console.error(`Error creando gasto para ${categoria}:`, error);
        }
      }
      
      console.log(`✓ Creados gastos para: ${categoria} - Aprox. $${gastoBase}`);
    }
    
    // Crear algunos gastos de tarjeta de crédito (para simular método de pago)
    try {
      const numGastosTarjeta = randomInRange(3, 8);
      let totalGastosTarjeta = 0;
      
      for (let i = 0; i < numGastosTarjeta; i++) {
        const categoriaAleatoria = randomElement(Object.keys(proporcionesGasto));
        const categoriaId = categoriasMap[categoriaAleatoria];
        const conceptosDisponibles = conceptosPorCategoria[categoriaAleatoria] || [`Gasto de ${categoriaAleatoria}`];
        const concepto = randomElement(conceptosDisponibles);
        const monto = randomInRange(10, 150);
        
        await prisma.gasto.create({
          data: {
            concepto: concepto,
            monto: monto,
            fecha: randomDateInMonth(periodo.año, periodo.mes),
            tipoTransaccion: 'gasto',
            tipoMovimiento: 'gasto',
            userId: usuario.id,
            categoriaId: categoriaId,
            categoria: categoriaAleatoria
          }
        });
        
        totalGastosTarjeta += monto;
      }
      
      console.log(`✓ Creados gastos de tarjeta`);
    } catch (error) {
      console.error('Error creando gastos de tarjeta:', error);
    }
    
    // Posibilidad de crear evento especial (20% de probabilidad cada mes)
    if (Math.random() < 0.2) {
      const eventoAleatorio = randomElement(EVENTOS_ESPECIALES);
      
      try {
        // Obtener el ID de la categoría para este evento
        const categoriaId = categoriasMap[eventoAleatorio.categoria];
        
        // Crear el gasto para el evento especial
        const gastoEvento = await prisma.gasto.create({
          data: {
            concepto: eventoAleatorio.concepto,
            monto: eventoAleatorio.monto,
            fecha: randomDateInMonth(periodo.año, periodo.mes),
            tipoTransaccion: 'gasto',
            tipoMovimiento: 'gasto',
            userId: usuario.id,
            categoriaId: categoriaId,
            categoria: eventoAleatorio.categoria
          }
        });
        
        console.log(`✓ Creado evento especial: ${eventoAleatorio.tipo} - $${eventoAleatorio.monto}`);
        
        // Si el evento está financiado, crear la financiación
        if (eventoAleatorio.financiado) {
          const fechaInicio = new Date(gastoEvento.fecha);
          const fechaFin = new Date(fechaInicio);
          fechaFin.setMonth(fechaFin.getMonth() + 6);
          
          // Crear la financiación con la relación gasto requerida
          await prisma.financiacion.create({
            data: {
              montoTotal: eventoAleatorio.monto,
              cantidadCuotas: 6,
              montoCuota: Math.round(eventoAleatorio.monto / 6),
              fechaInicio: fechaInicio,
              fechaFin: fechaFin,
              estado: "activo",
              descripcion: `Financiación ${eventoAleatorio.tipo}`,
              cuotasRestantes: 6,
              gasto: {
                connect: {
                  id: gastoEvento.id
                }
              }
            }
          });
          console.log(`✓ Creada financiación para ${eventoAleatorio.tipo} (6 cuotas)`);
        }
      } catch (error) {
        console.error(`Error creando evento especial ${eventoAleatorio.tipo}:`, error);
      }
    }
  }
  
  // 7. CREAR USUARIO FICTICIO CON ALGUNAS TRANSACCIONES
  console.log('\n=== Creando usuario ficticio con transacciones... ===');
  
  try {
    // Crear usuario ficticio
    const usuarioFicticio = await prisma.user.create({
      data: {
        name: "Usuario Ficticio",
        email: `usuario.ficticio.${Date.now()}@example.com`,
        password: "passwordSeguro123"
      }
    });
    
    console.log(`✓ Usuario ficticio: ${usuarioFicticio.name} (${usuarioFicticio.id})`);
    
    // Crear algunas transacciones para el usuario ficticio
    const numTransacciones = 5;
    for (let i = 0; i < numTransacciones; i++) {
      const categoria = randomElement(CATEGORIAS);
      const concepto = randomElement(conceptosPorCategoria[categoria.descripcion] || [`Gasto de ${categoria.descripcion}`]);
      const monto = randomInRange(10, 200);
      const mes = randomInRange(1, 12);
      const año = 2024;
      
      await prisma.gasto.create({
        data: {
          concepto: concepto,
          monto: monto,
          fecha: randomDateInMonth(año, mes),
          tipoTransaccion: 'gasto',
          tipoMovimiento: 'gasto',
          userId: usuarioFicticio.id,
          categoria: categoria.descripcion
        }
      });
    }
    
    console.log(`✓ Creadas ${numTransacciones} transacciones para usuario ficticio`);
  } catch (error) {
    console.error('Error creando usuario ficticio:', error);
  }
  
  console.log('\n=== Base de datos poblada con éxito ===');
  console.log(`Se han generado datos para ${meses.length} meses: ${mesesStr}`);
  console.log('Ahora puedes probar el asesor financiero con estos datos.');
}

// Ejecutar la función principal y manejar errores
populateDatabase()
  .catch(e => {
    console.error('Error en el script de población:', e);
  })
  .finally(async () => {
    console.log('Script finalizado');
    await prisma.$disconnect();
  }); 