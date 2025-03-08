// Script para generar datos de prueba para la aplicación de gastos (versión final)
// Este script:
// 1. Elimina todos los datos existentes excepto los usuarios
// 2. Crea un grupo asociado al usuario principal
// 3. Genera datos completos de transacciones, gastos recurrentes, presupuestos y financiaciones

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Categorías predefinidas para ser creadas o referenciadas
const CATEGORIAS = [
  { descripcion: 'Vivienda', grupo_categoria: 'Básicos', status: true },
  { descripcion: 'Alimentación', grupo_categoria: 'Básicos', status: true },
  { descripcion: 'Transporte', grupo_categoria: 'Básicos', status: true },
  { descripcion: 'Servicios', grupo_categoria: 'Básicos', status: true },
  { descripcion: 'Salud', grupo_categoria: 'Bienestar', status: true },
  { descripcion: 'Educación', grupo_categoria: 'Bienestar', status: true },
  { descripcion: 'Entretenimiento', grupo_categoria: 'Ocio', status: true },
  { descripcion: 'Viajes', grupo_categoria: 'Ocio', status: true },
  { descripcion: 'Ropa', grupo_categoria: 'Personal', status: true },
  { descripcion: 'Restaurantes', grupo_categoria: 'Ocio', status: true },
  { descripcion: 'Ahorro', grupo_categoria: 'Financiero', status: true },
  { descripcion: 'Inversiones', grupo_categoria: 'Financiero', status: true },
  { descripcion: 'Suscripciones', grupo_categoria: 'Digital', status: true },
  { descripcion: 'Tecnología', grupo_categoria: 'Digital', status: true },
  { descripcion: 'Mascotas', grupo_categoria: 'Bienestar', status: true },
];

// Gastos recurrentes predefinidos
const GASTOS_RECURRENTES = [
  // Mensuales (80% de los gastos)
  { concepto: 'Alquiler', monto: 800, categoria: 'Vivienda', periodicidad: 'mensual' },
  { concepto: 'Netflix', monto: 15, categoria: 'Suscripciones', periodicidad: 'mensual' },
  { concepto: 'Spotify', monto: 10, categoria: 'Suscripciones', periodicidad: 'mensual' },
  { concepto: 'Internet', monto: 50, categoria: 'Servicios', periodicidad: 'mensual' },
  { concepto: 'Teléfono', monto: 40, categoria: 'Servicios', periodicidad: 'mensual' },
  { concepto: 'Electricidad', monto: 70, categoria: 'Servicios', periodicidad: 'mensual' },
  { concepto: 'Agua', monto: 30, categoria: 'Servicios', periodicidad: 'mensual' },
  { concepto: 'Gimnasio', monto: 45, categoria: 'Salud', periodicidad: 'mensual' },
  { concepto: 'Seguro de salud', monto: 120, categoria: 'Salud', periodicidad: 'mensual' },
  
  // Bimestrales (15% de los gastos)
  { concepto: 'Suscripción revista', monto: 25, categoria: 'Suscripciones', periodicidad: 'bimestral' },
  { concepto: 'Mantenimiento coche', monto: 80, categoria: 'Transporte', periodicidad: 'bimestral' },
  { concepto: 'Impuesto municipal', monto: 60, categoria: 'Servicios', periodicidad: 'bimestral' },
  
  // Semestrales (5% de los gastos)
  { concepto: 'Seguro de hogar', monto: 180, categoria: 'Vivienda', periodicidad: 'semestral' },
  { concepto: 'Seguro del coche', monto: 250, categoria: 'Transporte', periodicidad: 'semestral' },
];

// Eventos especiales aleatorios
const EVENTOS_ESPECIALES = [
  { evento: 'viaje', monto: 800, categoria: 'Viajes', descripcion: 'Viaje fin de semana' },
  { evento: 'compra-tecnologia', monto: 1200, categoria: 'Tecnología', descripcion: 'Nuevo ordenador' },
  { evento: 'reparacion', monto: 500, categoria: 'Vivienda', descripcion: 'Reparación electrodoméstico' },
  { evento: 'regalo', monto: 300, categoria: 'Personal', descripcion: 'Regalo cumpleaños' },
];

// Función para generar una fecha aleatoria en un mes específico
function randomDateInMonth(año, mes) {
  // El mes en JavaScript es 0-indexed (0 = enero, 11 = diciembre)
  const mesJS = mes - 1;
  
  // Determinar el último día del mes
  const ultimoDia = new Date(año, mesJS + 1, 0).getDate();
  
  // Generar un día aleatorio entre 1 y el último día del mes
  const dia = Math.floor(Math.random() * ultimoDia) + 1;
  
  // Crear la fecha
  return new Date(año, mesJS, dia);
}

// Distribución de gastos por categoría (porcentajes aproximados)
const DISTRIBUCION_GASTOS = {
  'Vivienda': 25,
  'Alimentación': 20,
  'Transporte': 10,
  'Servicios': 8,
  'Salud': 5,
  'Educación': 3,
  'Entretenimiento': 7,
  'Viajes': 5,
  'Ropa': 4,
  'Restaurantes': 6,
  'Suscripciones': 3,
  'Tecnología': 2,
  'Mascotas': 2,
};

// Función para generar presupuestos mensuales
function generarPresupuestosMensuales(meses, ingresoBase) {
  const presupuestos = [];
  
  meses.forEach(({ año, mes }) => {
    // Variación aleatoria para simular cambios mensuales en presupuestos
    const variacion = 0.95 + Math.random() * 0.1; // Entre 0.95 y 1.05
    const ingresoMensual = ingresoBase * variacion;
    
    // Categorías de presupuesto agrupadas
    const gruposCategoria = {
      'Básicos': ['Vivienda', 'Alimentación', 'Transporte', 'Servicios'],
      'Bienestar': ['Salud', 'Educación', 'Mascotas'],
      'Ocio': ['Entretenimiento', 'Viajes', 'Restaurantes'],
      'Personal': ['Ropa'],
      'Digital': ['Suscripciones', 'Tecnología'],
    };
    
    // Porcentajes aproximados para cada grupo de presupuesto
    const porcentajesGrupo = {
      'Básicos': 60,
      'Bienestar': 8,
      'Ocio': 18,
      'Personal': 6,
      'Digital': 5,
    };
    
    // Generar presupuestos por grupo
    Object.entries(porcentajesGrupo).forEach(([grupo, porcentaje]) => {
      const montoBruto = ingresoMensual * (porcentaje / 100);
      // Añadir variación aleatoria al monto (±3%)
      const variacionMonto = 0.97 + Math.random() * 0.06;
      const monto = parseFloat((montoBruto * variacionMonto).toFixed(2));
      
      presupuestos.push({
        nombre: grupo,
        monto,
        mes,
        año,
        grupo_categoria: grupo
      });
    });
  });
  
  return presupuestos;
}

// Función principal para poblar la base de datos
async function populateDatabase() {
  console.log('Iniciando script de generación de datos...');
  console.log('=== Iniciando generación de datos de prueba ===');
  
  // Determinar los meses para los que se generarán datos (últimos 6 meses)
  const fechaActual = new Date();
  const meses = [];
  
  // Generar array de los últimos 6 meses
  for (let i = 0; i < 6; i++) {
    const fecha = new Date(fechaActual);
    fecha.setMonth(fechaActual.getMonth() - 5 + i);
    meses.push({
      mes: fecha.getMonth() + 1, // Mes en formato 1-12
      año: fecha.getFullYear(),
      nombre: fecha.toLocaleDateString('es-ES', { month: 'long' })
    });
  }
  
  console.log(`Generando datos para ${meses.length} meses (${meses.map(m => `${m.mes}/${m.año}`).join(', ')})\n`);
  
  // Obtener el primer usuario para asociarle los datos
  const usuario = await prisma.user.findFirst();
  if (!usuario) {
    console.error('No se encontró ningún usuario. Crea al menos un usuario antes de ejecutar este script.');
    return;
  }
  
  console.log(`Utilizando el usuario: ${usuario.name} (${usuario.id})\n`);
  
  // 1. LIMPIAR DATOS EXISTENTES EXCEPTO USUARIOS
  console.log('=== Limpiando datos existentes... ===');
  
  try {
    // Eliminar financiaciones
    const financiacionesEliminadas = await prisma.financiacion.deleteMany();
    console.log(`✓ Eliminadas ${financiacionesEliminadas.count} financiaciones`);
    
    // Eliminar presupuestos
    const presupuestosEliminados = await prisma.presupuesto.deleteMany();
    console.log(`✓ Eliminados ${presupuestosEliminados.count} presupuestos`);
    
    // Eliminar gastos
    const gastosEliminados = await prisma.gasto.deleteMany();
    console.log(`✓ Eliminados ${gastosEliminados.count} gastos`);
    
    // Eliminar gastos recurrentes
    const gastosRecurrentesEliminados = await prisma.gastoRecurrente.deleteMany();
    console.log(`✓ Eliminados ${gastosRecurrentesEliminados.count} gastos recurrentes`);
    
    // Eliminar grupos (conservando relaciones con usuarios)
    const gruposEliminados = await prisma.grupo.deleteMany();
    console.log(`✓ Eliminados ${gruposEliminados.count} grupos`);
    
    // No eliminamos categorías para mantener las existentes
    console.log('✓ Categorías mantenidas para conservar relaciones existentes');
  } catch (error) {
    console.error('Error limpiando datos:', error);
    return;
  }
  
  // 2. CREAR UN GRUPO ASOCIADO AL USUARIO
  console.log('\n=== Creando grupo para el usuario... ===');
  try {
    const grupo = await prisma.grupo.create({
      data: {
        nombre: 'Grupo Personal',
        descripcion: 'Grupo personal para gestión de finanzas',
        usuarios: {
          connect: { id: usuario.id }
        }
      }
    });
    console.log(`✓ Creado grupo: ${grupo.nombre} (ID: ${grupo.id})`);
  } catch (error) {
    console.error('Error creando grupo:', error);
  }
  
  // 3. COMPROBAR Y CREAR CATEGORÍAS NECESARIAS
  console.log('\n=== Comprobando categorías... ===');
  
  // Mapeo para guardar los IDs de categorías
  const categoriaMap = new Map();
  
  // Comprobar cada categoría y crearla si no existe
  for (const categoria of CATEGORIAS) {
    try {
      // Buscar si ya existe la categoría por descripción
      const categoriaExistente = await prisma.categoria.findFirst({
        where: { descripcion: categoria.descripcion }
      });
      
      if (categoriaExistente) {
        console.log(`✓ La categoría ${categoria.descripcion} ya existe (ID: ${categoriaExistente.id})`);
        categoriaMap.set(categoria.descripcion, categoriaExistente.id);
      } else {
        // Crear la categoría sin especificar ID
        const nuevaCategoria = await prisma.categoria.create({
          data: {
            descripcion: categoria.descripcion,
            grupo_categoria: categoria.grupo_categoria,
            status: categoria.status
          }
        });
        console.log(`✓ Creada categoría: ${nuevaCategoria.descripcion} (ID: ${nuevaCategoria.id})`);
        categoriaMap.set(categoria.descripcion, nuevaCategoria.id);
      }
    } catch (error) {
      console.error(`Error con la categoría ${categoria.descripcion}:`, error);
    }
  }
  
  // 4. CREAR GASTOS RECURRENTES
  console.log('\n=== Creando gastos recurrentes... ===');
  
  // Primero eliminamos los gastos recurrentes existentes del usuario
  try {
    const gastosRecurrentesEliminados = await prisma.gastoRecurrente.deleteMany({
      where: { userId: usuario.id }
    });
    console.log(`✓ Se eliminaron ${gastosRecurrentesEliminados.count} gastos recurrentes existentes`);
  } catch (error) {
    console.error('Error eliminando gastos recurrentes:', error);
  }
  
  // Ahora creamos los nuevos gastos recurrentes
  for (const gastoRecurrente of GASTOS_RECURRENTES) {
    try {
      // Obtener el ID de la categoría
      const categoriaId = categoriaMap.get(gastoRecurrente.categoria);
      
      if (!categoriaId) {
        console.warn(`⚠ No se encontró la categoría ${gastoRecurrente.categoria} para el gasto recurrente ${gastoRecurrente.concepto}`);
        continue;
      }
      
      // Crear el gasto recurrente
      await prisma.gastoRecurrente.create({
        data: {
          concepto: gastoRecurrente.concepto,
          monto: gastoRecurrente.monto,
          categoriaId: categoriaId,
          periodicidad: gastoRecurrente.periodicidad,
          userId: usuario.id,
          fechaInicio: new Date(),
          fechaFin: null,
          estado: 'activo',
          categoria: gastoRecurrente.categoria  // Añadido el campo categoria
        }
      });
      
      console.log(`✓ Creado gasto recurrente: ${gastoRecurrente.concepto} (${gastoRecurrente.periodicidad})`);
    } catch (error) {
      console.error(`Error creando gasto recurrente ${gastoRecurrente.concepto}:`, error);
    }
  }
  
  // 5. CREAR PRESUPUESTOS
  console.log('\n=== Creando presupuestos... ===');
  
  // Base de ingresos mensuales estimados
  const ingresoBaseMensual = 3000;
  
  // Generar presupuestos para cada mes
  const presupuestos = generarPresupuestosMensuales(meses, ingresoBaseMensual);
  
  // Crear los presupuestos en la base de datos
  for (const presupuesto of presupuestos) {
    try {
      // Encontrar categoría por grupo_categoria
      const categoria = await prisma.categoria.findFirst({
        where: { 
          grupo_categoria: presupuesto.grupo_categoria,
          // Seleccionar una de las categorías que pertenecen a este grupo
          descripcion: {
            in: CATEGORIAS
              .filter(cat => cat.grupo_categoria === presupuesto.grupo_categoria)
              .map(cat => cat.descripcion)
          }
        }
      });
      
      if (categoria) {
        await prisma.presupuesto.create({
          data: {
            nombre: presupuesto.nombre,
            monto: presupuesto.monto,
            mes: presupuesto.mes,
            año: presupuesto.año,
            categoriaId: categoria.id,
            userId: usuario.id
          }
        });
        console.log(`✓ Creado presupuesto para ${presupuesto.nombre}: $${presupuesto.monto.toFixed(2)} (${presupuesto.mes}/${presupuesto.año})`);
      } else {
        console.error(`Error creando presupuesto para ${presupuesto.nombre}: No se encontró una categoría válida`);
      }
    } catch (error) {
      console.error(`Error creando presupuesto para ${presupuesto.nombre}:\n${error}`);
    }
  }
  
  // 6. CREAR TRANSACCIONES (GASTOS E INGRESOS)
  console.log('\n=== Creando transacciones... ===');
  
  // Para cada mes, eliminar transacciones existentes y crear nuevas
  for (const { mes, año } of meses) {
    try {
      // Eliminar transacciones existentes para este mes
      const transaccionesEliminadas = await prisma.gasto.deleteMany({
        where: {
          userId: usuario.id,
          fecha: {
            gte: new Date(año, mes - 1, 1),
            lt: new Date(año, mes, 1)
          }
        }
      });
      console.log(`✓ Eliminadas ${transaccionesEliminadas.count} transacciones de ${mes}/${año}`);
    } catch (error) {
      console.error(`Error eliminando transacciones de ${mes}/${año}:`, error);
    }
  }
  
  // Crear transacciones para cada mes
  for (const { mes, año } of meses) {
    console.log(`\n>> Generando datos para ${mes}/${año}...`);
    
    // Variación aleatoria para ingresos (±5%)
    const ingresoVariacion = 0.95 + Math.random() * 0.1;
    const ingresoMensual = Math.round(ingresoBaseMensual * ingresoVariacion);
    
    // Añadir ingreso principal (salario)
    try {
      await prisma.gasto.create({
        data: {
          concepto: 'Salario',
          monto: ingresoMensual,
          fecha: randomDateInMonth(año, mes),
          tipoTransaccion: 'ingreso',
          tipoMovimiento: 'ingreso',
          userId: usuario.id,
          categoria: 'Ingreso'  // Añadido el campo categoria requerido
        }
      });
      console.log(`✓ Creado ingreso: Salario - $${ingresoMensual}`);
    } catch (error) {
      console.error('Error creando ingreso:', error);
    }
    
    // Calcular gastos aproximados por categoría (con ligeras variaciones)
    for (const [categoria, porcentaje] of Object.entries(DISTRIBUCION_GASTOS)) {
      const categoriaId = categoriaMap.get(categoria);
      if (!categoriaId) {
        console.warn(`⚠ No se encontró la categoría ${categoria} para crear gastos`);
        continue;
      }
      
      // Monto base para esta categoría (% del ingreso mensual)
      const montoBaseCategoria = ingresoMensual * (porcentaje / 100);
      
      // Número de transacciones para esta categoría (entre 1 y 5)
      const numTransacciones = Math.max(1, Math.floor(porcentaje / 5));
      
      let totalCategoriaGastado = 0;
      
      // Crear múltiples transacciones para simular patrones reales
      for (let i = 0; i < numTransacciones; i++) {
        // Distribución aleatoria del monto entre transacciones
        const proporcion = 1 / numTransacciones;
        // Variación de ±25% para cada transacción
        const variacion = 0.75 + Math.random() * 0.5;
        const montoTransaccion = Math.round(montoBaseCategoria * proporcion * variacion);
        
        totalCategoriaGastado += montoTransaccion;
        
        // Conceptos por defecto según categoría
        const conceptos = {
          'Vivienda': ['Alquiler', 'Hipoteca', 'Mantenimiento', 'Reparaciones'],
          'Alimentación': ['Supermercado', 'Mercado', 'Compra semanal', 'Alimentos'],
          'Transporte': ['Gasolina', 'Transporte público', 'Taxi', 'Parking'],
          'Servicios': ['Electricidad', 'Agua', 'Gas', 'Internet', 'Teléfono'],
          'Salud': ['Farmacia', 'Médico', 'Dentista', 'Análisis'],
          'Educación': ['Libros', 'Curso', 'Materiales', 'Clases'],
          'Entretenimiento': ['Cine', 'Concierto', 'Eventos', 'Actividades'],
          'Viajes': ['Vuelos', 'Hotel', 'Excursiones', 'Vacaciones'],
          'Ropa': ['Ropa', 'Calzado', 'Accesorios', 'Tienda'],
          'Restaurantes': ['Restaurante', 'Cafetería', 'Bar', 'Comida rápida'],
          'Suscripciones': ['Netflix', 'Spotify', 'Amazon Prime', 'Suscripción'],
          'Tecnología': ['Gadgets', 'Teléfono', 'Ordenador', 'Accesorios'],
          'Mascotas': ['Comida mascota', 'Veterinario', 'Accesorios mascota', 'Cuidados'],
        };
        
        // Elegir concepto aleatorio de la lista correspondiente a la categoría
        const conceptosDisponibles = conceptos[categoria] || ['Gasto genérico'];
        const conceptoElegido = conceptosDisponibles[Math.floor(Math.random() * conceptosDisponibles.length)];
        
        try {
          await prisma.gasto.create({
            data: {
              concepto: conceptoElegido,
              monto: montoTransaccion,
              fecha: randomDateInMonth(año, mes),
              tipoTransaccion: 'gasto',
              tipoMovimiento: 'gasto',
              userId: usuario.id,
              categoriaId: categoriaId,
              categoria: categoria  // Añadido el campo categoria requerido
            }
          });
        } catch (error) {
          console.error(`Error creando gasto de ${categoria}:`, error);
        }
      }
      
      console.log(`✓ Creados gastos para: ${categoria} - Aprox. $${totalCategoriaGastado}`);
    }
    
    // Añadir algunos gastos de tarjeta de crédito específicos
    try {
      // Buscamos la categoría para restaurantes
      const categoriaId = categoriaMap.get('Restaurantes');
      
      if (categoriaId) {
        // Entre 3-5 gastos de tarjeta para restaurantes
        const numGastosTarjeta = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < numGastosTarjeta; i++) {
          // Montos entre 20 y 60 euros
          const monto = 20 + Math.floor(Math.random() * 40);
          
          await prisma.gasto.create({
            data: {
              concepto: ['Restaurante', 'Cafetería', 'Bar', 'Cena fuera'][Math.floor(Math.random() * 4)],
              monto: monto,
              fecha: randomDateInMonth(año, mes),
              tipoTransaccion: 'gasto',
              tipoMovimiento: 'gasto',
              userId: usuario.id,
              categoriaId: categoriaId,
              categoria: 'Restaurantes'  // Añadido el campo categoria requerido
            }
          });
        }
        
        console.log('✓ Creados gastos de tarjeta');
      }
    } catch (error) {
      console.error('Error creando gastos de tarjeta:', error);
    }
    
    // 7. EVENTOS ESPECIALES (solo algunos meses)
    // Probabilidad del 40% de que ocurra un evento especial en un mes
    if (Math.random() < 0.4) {
      // Elegir un evento aleatorio
      const eventoAleatorio = EVENTOS_ESPECIALES[Math.floor(Math.random() * EVENTOS_ESPECIALES.length)];
      
      try {
        // Buscar la categoría correspondiente
        const categoriaId = categoriaMap.get(eventoAleatorio.categoria);
        
        if (!categoriaId) {
          console.warn(`⚠ No se encontró la categoría ${eventoAleatorio.categoria} para el evento especial ${eventoAleatorio.evento}`);
          continue;
        }
        
        // Crear el gasto del evento especial
        const gastoEvento = await prisma.gasto.create({
          data: {
            concepto: eventoAleatorio.descripcion,
            monto: eventoAleatorio.monto,
            fecha: randomDateInMonth(año, mes),
            tipoTransaccion: 'gasto',
            tipoMovimiento: 'gasto',
            userId: usuario.id,
            categoriaId: categoriaId,
            categoria: eventoAleatorio.categoria  // Añadido el campo categoria requerido
          }
        });
        
        console.log(`✓ Creado evento especial: ${eventoAleatorio.evento} - $${eventoAleatorio.monto}`);
        
        // Si el evento es la compra de tecnología, crear financiación
        if (eventoAleatorio.evento === 'compra-tecnologia') {
          const fechaInicio = randomDateInMonth(año, mes);
          const fechaFin = new Date(fechaInicio);
          fechaFin.setMonth(fechaFin.getMonth() + 6);
          
          await prisma.financiacion.create({
            data: {
              gastoId: gastoEvento.id,
              montoTotal: eventoAleatorio.monto,
              cantidadCuotas: 6,
              montoCuota: Math.round(eventoAleatorio.monto / 6),
              fechaInicio: fechaInicio,
              fechaFin: fechaFin,
              estado: "activo",
              descripcion: `Financiación ${eventoAleatorio.evento}`,
              cuotasRestantes: 6  // Añadido el campo cuotasRestantes
            }
          });
          
          console.log(`✓ Creada financiación para ${eventoAleatorio.evento}: 6 cuotas de $${Math.round(eventoAleatorio.monto / 6)}`);
        }
      } catch (error) {
        console.error(`Error creando evento especial ${eventoAleatorio.evento}:`, error);
      }
    }
  }
  
  // 8. CREAR USUARIO FICTICIO CON ALGUNAS TRANSACCIONES (CORREGIDO SIN CAMPO STATUS)
  console.log('\n=== Creando usuario ficticio con transacciones... ===');
  
  try {
    // Crear un usuario ficticio (sin el campo status que no existe en el modelo)
    const usuarioFicticio = await prisma.user.upsert({
      where: { email: 'usuario.ficticio@example.com' },
      update: {},
      create: {
        name: 'Usuario Ficticio',
        email: 'usuario.ficticio@example.com'
      }
    });
    
    console.log(`✓ Usuario ficticio: ${usuarioFicticio.name} (${usuarioFicticio.id})`);
    
    // Crear algunas transacciones para este usuario
    for (let i = 0; i < 5; i++) {
      // Elegir una categoría aleatoria
      const categoriaAleatoria = CATEGORIAS[Math.floor(Math.random() * CATEGORIAS.length)];
      const categoriaId = categoriaMap.get(categoriaAleatoria.descripcion);
      
      if (!categoriaId) continue;
      
      // Fecha en el último mes
      const fechaActual = new Date();
      const fechaTransaccion = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), Math.floor(Math.random() * 28) + 1);
      
      await prisma.gasto.create({
        data: {
          concepto: `Gasto de prueba ${i+1}`,
          monto: 50 + Math.floor(Math.random() * 150),
          fecha: fechaTransaccion,
          tipoTransaccion: 'gasto',
          tipoMovimiento: 'gasto',
          userId: usuarioFicticio.id,
          categoriaId: categoriaId,
          categoria: categoriaAleatoria.descripcion  // Añadido el campo categoria requerido
        }
      });
    }
    
    console.log(`✓ Creadas 5 transacciones para usuario ficticio`);
  } catch (error) {
    console.error('Error creando usuario ficticio:', error);
  }
  
  console.log('\n=== Base de datos poblada con éxito ===');
  console.log(`Se han generado datos para ${meses.length} meses: ${meses.map(m => `${m.mes}/${m.año}`).join(', ')}`);
  console.log('Ahora puedes probar el asesor financiero con estos datos.');
}

// Ejecutar la función principal
populateDatabase()
  .catch(e => {
    console.error('Error en el script:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Script finalizado');
  }); 