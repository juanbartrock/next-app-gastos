/**
 * Script para generar datos financieros de prueba para los últimos 6 meses
 * Este script crea registros realistas de ingresos, gastos, gastos recurrentes,
 * presupuestos y financiaciones para simular uso continuo de la aplicación.
 * 
 * EJECUTAR: node generate-test-data.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Configuración principal
const MESES = 6; // Últimos 6 meses
const INGRESO_BASE = 3000; // Ingreso mensual base
const USUARIO_EMAIL = null; // Si es null, usará el primer usuario encontrado

// Obtener el mes actual y calcular fechas hacia atrás
const FECHA_ACTUAL = new Date();
const MES_ACTUAL = FECHA_ACTUAL.getMonth();
const AÑO_ACTUAL = FECHA_ACTUAL.getFullYear();

// Generar array de meses para los datos históricos (desde 6 meses atrás hasta el actual)
const MESES_HISTORICOS = [];
for (let i = MESES - 1; i >= 0; i--) {
  let mes = MES_ACTUAL - i;
  let año = AÑO_ACTUAL;
  
  // Ajustar si el mes es negativo (año anterior)
  if (mes < 0) {
    mes = 12 + mes;
    año--;
  }
  
  MESES_HISTORICOS.push({ mes, año });
}

// Categorías para organizar los gastos (sin IDs específicos)
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
  { descripcion: 'Mascotas', grupo_categoria: 'Personal', status: true },
];

// Función para generar una fecha aleatoria dentro de un mes específico
function randomDateInMonth(año, mes) {
  const daysInMonth = new Date(año, mes + 1, 0).getDate();
  const day = Math.floor(Math.random() * daysInMonth) + 1;
  return new Date(año, mes, day);
}

// Distribución de gastos por categoría (en porcentaje del ingreso)
const GASTOS_DISTRIBUCION = {
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

// Gastos recurrentes predefinidos (usando nombres de categorías)
const GASTOS_RECURRENTES = [
  { concepto: 'Alquiler', monto: 1200, categoria: 'Vivienda', periodicidad: 'mensual' },
  { concepto: 'Netflix', monto: 15, categoria: 'Suscripciones', periodicidad: 'mensual' },
  { concepto: 'Spotify', monto: 10, categoria: 'Suscripciones', periodicidad: 'mensual' },
  { concepto: 'Internet', monto: 50, categoria: 'Servicios', periodicidad: 'mensual' },
  { concepto: 'Teléfono', monto: 30, categoria: 'Servicios', periodicidad: 'mensual' },
  { concepto: 'Electricidad', monto: 80, categoria: 'Servicios', periodicidad: 'mensual' },
  { concepto: 'Agua', monto: 25, categoria: 'Servicios', periodicidad: 'mensual' },
  { concepto: 'Gimnasio', monto: 40, categoria: 'Salud', periodicidad: 'mensual' },
  { concepto: 'Seguro de salud', monto: 150, categoria: 'Salud', periodicidad: 'mensual' },
  { concepto: 'Suscripción revista', monto: 20, categoria: 'Suscripciones', periodicidad: 'bimestral' },
  { concepto: 'Mantenimiento coche', monto: 200, categoria: 'Transporte', periodicidad: 'bimestral' },
  { concepto: 'Impuesto municipal', monto: 120, categoria: 'Vivienda', periodicidad: 'bimestral' },
  { concepto: 'Seguro de hogar', monto: 300, categoria: 'Vivienda', periodicidad: 'semestral' },
  { concepto: 'Seguro del coche', monto: 400, categoria: 'Transporte', periodicidad: 'semestral' },
];

// Calculadora de presupuestos basados en porcentajes de gastos
function generarPresupuestosMensuales(meses, ingresoBase) {
  const presupuestos = [];
  
  // Agrupar gastos por grupos de categoría
  const gruposCategorias = {};
  let totalPorcentaje = 0;
  
  for (const [categoria, porcentaje] of Object.entries(GASTOS_DISTRIBUCION)) {
    const categoriaObj = CATEGORIAS.find(c => c.descripcion === categoria);
    if (categoriaObj) {
      const grupo = categoriaObj.grupo_categoria;
      if (!gruposCategorias[grupo]) {
        gruposCategorias[grupo] = 0;
      }
      gruposCategorias[grupo] += porcentaje;
      totalPorcentaje += porcentaje;
    }
  }
  
  // Crear presupuestos para cada mes y grupo
  for (const { mes, año } of meses) {
    // Aplicar variación mensual
    const variacionMensual = 0.9 + (Math.random() * 0.2); // Entre 90% y 110%
    
    for (const [grupo, porcentaje] of Object.entries(gruposCategorias)) {
      const monto = Math.round((ingresoBase * (porcentaje / 100) * variacionMensual) * 100) / 100;
      
      presupuestos.push({
        categoria: grupo,
        monto: monto,
        mes: mes + 1, // Ajuste para 1-indexado
        año: año
      });
    }
  }
  
  return presupuestos;
}

// Función principal para poblar la base de datos
async function populateDatabase() {
  try {
    console.log('=== Iniciando generación de datos de prueba ===');
    console.log(`Generando datos para ${MESES} meses (${MESES_HISTORICOS.map(m => `${m.mes+1}/${m.año}`).join(', ')})`);
    
    // Obtener el usuario
    let user;
    
    if (USUARIO_EMAIL) {
      user = await prisma.user.findUnique({
        where: { email: USUARIO_EMAIL },
      });
      
      if (!user) {
        throw new Error(`No se encontró un usuario con el email ${USUARIO_EMAIL}`);
      }
    } else {
      user = await prisma.user.findFirst();
      
      if (!user) {
        throw new Error('No se encontró ningún usuario en la base de datos');
      }
    }
    
    console.log(`\nUtilizando el usuario: ${user.name} (${user.id})`);
    
    // 1. Crear o verificar categorías
    console.log('\n=== Comprobando categorías... ===');
    
    // Mapa para almacenar categorías encontradas por descripción
    const categoriasMap = {};
    
    for (const categoria of CATEGORIAS) {
      const existingCategoria = await prisma.categoria.findFirst({
        where: { descripcion: categoria.descripcion }
      });
      
      if (!existingCategoria) {
        // Crear la categoría sin especificar ID
        const newCategoria = await prisma.categoria.create({
          data: {
            descripcion: categoria.descripcion,
            grupo_categoria: categoria.grupo_categoria,
            status: categoria.status
          }
        });
        categoriasMap[categoria.descripcion] = newCategoria.id;
        console.log(`✓ Creada categoría: ${categoria.descripcion} (ID: ${newCategoria.id})`);
      } else {
        categoriasMap[categoria.descripcion] = existingCategoria.id;
        console.log(`✓ La categoría ${categoria.descripcion} ya existe (ID: ${existingCategoria.id})`);
      }
    }
    
    // 2. Crear gastos recurrentes
    console.log('\n=== Creando gastos recurrentes... ===');
    
    // Limpiar gastos recurrentes existentes del usuario
    const deletedRecurrentes = await prisma.gastoRecurrente.deleteMany({
      where: { userId: user.id }
    });
    console.log(`✓ Se eliminaron ${deletedRecurrentes.count} gastos recurrentes existentes`);
    
    // Función para calcular la próxima fecha de pago
    const calcularProximaFecha = (periodicidad) => {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15);
      
      if (periodicidad === 'mensual') return nextMonth;
      if (periodicidad === 'bimestral') return new Date(now.getFullYear(), now.getMonth() + 2, 15);
      if (periodicidad === 'semestral') return new Date(now.getFullYear(), now.getMonth() + 6, 15);
      
      return nextMonth;
    };
    
    // Crear gastos recurrentes
    for (const gasto of GASTOS_RECURRENTES) {
      try {
        // Buscar el ID de la categoría por su descripción
        const categoriaId = categoriasMap[gasto.categoria];
        
        if (!categoriaId) {
          console.log(`⚠️ No se encontró la categoría ${gasto.categoria} para el gasto recurrente ${gasto.concepto}`);
          continue;
        }
        
        await prisma.gastoRecurrente.create({
          data: {
            concepto: gasto.concepto,
            monto: gasto.monto,
            periodicidad: gasto.periodicidad,
            estado: 'pendiente',
            userId: user.id,
            categoriaId: categoriaId,
            proximaFecha: calcularProximaFecha(gasto.periodicidad),
            ultimoPago: new Date(MESES_HISTORICOS[MESES_HISTORICOS.length - 1].año, 
                               MESES_HISTORICOS[MESES_HISTORICOS.length - 1].mes, 15),
            comentario: `Gasto recurrente de prueba (${gasto.periodicidad})`
          }
        });
        console.log(`✓ Creado gasto recurrente: ${gasto.concepto} (${gasto.periodicidad})`);
      } catch (err) {
        console.error(`Error creando gasto recurrente ${gasto.concepto}:`, err.message);
      }
    }
    
    // 3. Crear presupuestos
    console.log('\n=== Creando presupuestos... ===');
    
    // Generar presupuestos para los meses históricos
    const presupuestos = generarPresupuestosMensuales(MESES_HISTORICOS, INGRESO_BASE);
    
    // Limpiar presupuestos existentes del usuario para los meses seleccionados
    for (const { mes, año } of MESES_HISTORICOS) {
      await prisma.presupuesto.deleteMany({
        where: { 
          userId: user.id,
          año: año,
          mes: mes + 1 // Ajuste para 1-indexado
        }
      });
    }
    
    // Crear presupuestos
    for (const presupuesto of presupuestos) {
      try {
        // Encontrar la categoría correspondiente
        const categoria = await prisma.categoria.findFirst({
          where: { grupo_categoria: presupuesto.categoria }
        });
        
        if (categoria) {
          await prisma.presupuesto.create({
            data: {
              monto: presupuesto.monto,
              mes: presupuesto.mes,
              año: presupuesto.año,
              categoriaId: categoria.id,
              userId: user.id
            }
          });
          console.log(`✓ Creado presupuesto: ${presupuesto.categoria} - Mes ${presupuesto.mes}/${presupuesto.año} - $${presupuesto.monto}`);
        }
      } catch (err) {
        console.error(`Error creando presupuesto para ${presupuesto.categoria}:`, err.message);
      }
    }
    
    // 4. Crear transacciones para cada mes histórico
    console.log('\n=== Creando transacciones... ===');
    
    // Limpiar transacciones existentes para los meses seleccionados
    for (const { mes, año } of MESES_HISTORICOS) {
      const primerDiaMes = new Date(año, mes, 1);
      const primerDiaSiguienteMes = new Date(año, mes + 1, 1);
      
      const deletedCount = await prisma.gasto.deleteMany({
        where: { 
          userId: user.id,
          fecha: {
            gte: primerDiaMes,
            lt: primerDiaSiguienteMes
          }
        }
      });
      
      console.log(`✓ Eliminadas ${deletedCount.count} transacciones de ${mes+1}/${año}`);
    }
    
    // Variables para simular tendencias
    let tendenciaIngresos = 1.0; // Factor multiplicador de ingresos
    let tendenciaGastos = 1.0;   // Factor multiplicador de gastos
    
    // Eventos aleatorios para hacer los datos más interesantes
    const EVENTOS_ESPECIALES = [
      { mes: MESES_HISTORICOS[Math.floor(Math.random() * MESES_HISTORICOS.length)], 
        evento: 'viaje', gasto: 800, categoria: 'Viajes' },
      { mes: MESES_HISTORICOS[Math.floor(Math.random() * MESES_HISTORICOS.length)], 
        evento: 'compra-tecnologia', gasto: 1200, categoria: 'Tecnología' },
      { mes: MESES_HISTORICOS[Math.floor(Math.random() * MESES_HISTORICOS.length)], 
        evento: 'regalo', gasto: 300, categoria: 'Ropa' },
      { mes: MESES_HISTORICOS[Math.floor(Math.random() * MESES_HISTORICOS.length)], 
        evento: 'reparacion', gasto: 500, categoria: 'Vivienda' },
    ];
    
    // Crear datos para cada mes histórico
    for (let i = 0; i < MESES_HISTORICOS.length; i++) {
      const { mes, año } = MESES_HISTORICOS[i];
      
      console.log(`\n>> Generando datos para ${mes+1}/${año}...`);
      
      // Ajustar tendencias (pequeñas variaciones mensuales)
      tendenciaIngresos *= (0.98 + Math.random() * 0.04); // Entre -2% y +2%
      tendenciaGastos *= (0.97 + Math.random() * 0.06);   // Entre -3% y +3%
      
      // Crear ingreso mensual (salario)
      const ingresoMensual = Math.round(INGRESO_BASE * tendenciaIngresos);
      
      await prisma.gasto.create({
        data: {
          concepto: 'Salario',
          monto: ingresoMensual,
          fecha: new Date(año, mes, 5), // Día 5 de cada mes
          categoria: 'Ingreso',
          tipoTransaccion: 'ingreso',
          tipoMovimiento: 'digital',
          userId: user.id
        }
      });
      console.log(`✓ Creado ingreso: Salario - $${ingresoMensual}`);
      
      // Bono semestral (cada 6 meses)
      if (i % 6 === 0 && i > 0) {
        const bonoMonto = Math.round(INGRESO_BASE * 0.5); // 50% del sueldo
        await prisma.gasto.create({
          data: {
            concepto: 'Bono Semestral',
            monto: bonoMonto,
            fecha: new Date(año, mes, 15),
            categoria: 'Ingreso',
            tipoTransaccion: 'ingreso',
            tipoMovimiento: 'digital',
            userId: user.id
          }
        });
        console.log(`✓ Creado ingreso extra: Bono Semestral - $${bonoMonto}`);
      }
      
      // Variación para hacer los datos más realistas
      const variacionMes = tendenciaGastos * (0.95 + Math.random() * 0.1); // ±5% de variación
      
      // Crear gastos por categoría
      for (const [categoria, porcentaje] of Object.entries(GASTOS_DISTRIBUCION)) {
        // Buscar el ID de la categoría por su descripción
        const categoriaId = categoriasMap[categoria];
        
        if (!categoriaId) {
          console.log(`⚠️ No se encontró la categoría ${categoria}`);
          continue;
        }
        
        // Calcular monto basado en el porcentaje del ingreso y aplicar variación
        const montoBase = ingresoMensual * (porcentaje / 100) * variacionMes;
        
        // Dividir en 2-4 transacciones para categorías grandes
        const numTransacciones = porcentaje > 10 ? 4 : porcentaje > 5 ? 2 : 1;
        
        for (let j = 0; j < numTransacciones; j++) {
          // Calcular monto de esta transacción
          const monto = montoBase / numTransacciones;
          // Mover un poco los montos para hacerlo más realista
          const montoFinal = monto * (0.9 + Math.random() * 0.2);
          
          // Determinar el tipo de movimiento
          let tipoMovimiento;
          
          if (categoria === 'Vivienda') {
            tipoMovimiento = 'digital';
          } else if (categoria === 'Ahorro' || categoria === 'Inversiones') {
            tipoMovimiento = 'ahorro';
          } else {
            // Distribuir entre efectivo (30%) y digital (70%)
            tipoMovimiento = Math.random() < 0.3 ? 'efectivo' : 'digital';
          }
          
          // Conceptos específicos para hacer más realistas los datos
          const conceptos = {
            'Vivienda': ['Alquiler', 'Hipoteca', 'Mantenimiento hogar', 'Productos limpieza'],
            'Alimentación': ['Supermercado', 'Verdulería', 'Carnicería', 'Mercado local'],
            'Transporte': ['Gasolina', 'Transporte público', 'Taxi', 'Mantenimiento coche'],
            'Servicios': ['Electricidad', 'Agua', 'Gas', 'Internet'],
            'Salud': ['Farmacia', 'Consulta médica', 'Dentista', 'Análisis'],
            'Educación': ['Libros', 'Curso online', 'Material escolar', 'Clases'],
            'Entretenimiento': ['Cine', 'Concierto', 'Videojuegos', 'Streaming'],
            'Viajes': ['Hotel', 'Vuelos', 'Excursión', 'Souvenirs'],
            'Ropa': ['Ropa casual', 'Calzado', 'Ropa deportiva', 'Accesorios'],
            'Restaurantes': ['Restaurante', 'Café', 'Comida rápida', 'Bar'],
            'Suscripciones': ['Suscripción digital', 'Membresía', 'App premium', 'Revista'],
            'Tecnología': ['Electrónica', 'Accesorios tech', 'Software', 'Gadgets'],
            'Mascotas': ['Alimentación mascota', 'Veterinario', 'Accesorios mascota', 'Juguetes mascota']
          };
          
          const concepto = conceptos[categoria] 
            ? conceptos[categoria][Math.floor(Math.random() * conceptos[categoria].length)]
            : `Gasto en ${categoria}`;
          
          // Crear la transacción
          try {
            await prisma.gasto.create({
              data: {
                concepto: `${concepto}`,
                monto: Math.round(montoFinal * 100) / 100,
                fecha: randomDateInMonth(año, mes),
                categoria: categoria,
                tipoTransaccion: 'gasto',
                tipoMovimiento: tipoMovimiento,
                userId: user.id,
                categoriaId: categoriaId
              }
            });
          } catch (err) {
            console.error(`Error creando gasto ${concepto}:`, err.message);
          }
        }
        console.log(`✓ Creados gastos para: ${categoria} - Aprox. $${Math.round(montoBase)}`);
      }
      
      // Añadir algunos gastos en tarjeta
      const gastosTarjeta = [
        { concepto: 'Compra en Amazon', monto: 120 * variacionMes, categoria: 'Tecnología' },
        { concepto: 'Supermercado', monto: 200 * variacionMes, categoria: 'Alimentación' },
        { concepto: 'Ropa', monto: 150 * variacionMes, categoria: 'Ropa' }
      ];
      
      for (const gasto of gastosTarjeta) {
        const categoriaId = categoriasMap[gasto.categoria];
        
        if (!categoriaId) {
          console.log(`⚠️ No se encontró la categoría ${gasto.categoria} para gasto de tarjeta`);
          continue;
        }
        
        try {
          await prisma.gasto.create({
            data: {
              concepto: gasto.concepto,
              monto: Math.round(gasto.monto * 100) / 100,
              fecha: randomDateInMonth(año, mes),
              categoria: gasto.categoria,
              tipoTransaccion: 'gasto',
              tipoMovimiento: 'tarjeta',
              userId: user.id,
              categoriaId: categoriaId
            }
          });
        } catch (err) {
          console.error(`Error creando gasto tarjeta ${gasto.concepto}:`, err.message);
        }
      }
      console.log(`✓ Creados gastos de tarjeta`);
      
      // Añadir eventos especiales si corresponden a este mes
      for (const evento of EVENTOS_ESPECIALES) {
        if (evento.mes.mes === mes && evento.mes.año === año) {
          const categoriaId = categoriasMap[evento.categoria];
          
          if (!categoriaId) {
            console.log(`⚠️ No se encontró la categoría ${evento.categoria} para evento especial`);
            continue;
          }
          
          try {
            // Crear el gasto especial
            const gastoEspecial = await prisma.gasto.create({
              data: {
                concepto: `Evento especial: ${evento.evento}`,
                monto: evento.gasto,
                fecha: randomDateInMonth(año, mes),
                categoria: evento.categoria,
                tipoTransaccion: 'gasto',
                tipoMovimiento: 'tarjeta',
                userId: user.id,
                categoriaId: categoriaId
              }
            });
            
            console.log(`✓ Creado evento especial: ${evento.evento} - $${evento.gasto}`);
            
            // Si el evento es la compra de tecnología, crear financiación
            if (evento.evento === 'compra-tecnologia') {
              await prisma.financiacion.create({
                data: {
                  gastoId: gastoEspecial.id,
                  montoTotal: evento.gasto,
                  cantidadCuotas: 6,
                  montoCuota: Math.round((evento.gasto / 6) * 100) / 100,
                  fechaInicio: new Date(año, mes, 15),
                  fechaFin: new Date(año + (mes + 6 >= 12 ? 1 : 0), (mes + 6) % 12, 15),
                  estado: 'activo',
                  descripcion: `Financiación ${evento.evento}`
                }
              });
              console.log(`✓ Creada financiación para: ${evento.evento} - 6 cuotas`);
            }
          } catch (err) {
            console.error(`Error creando evento especial ${evento.evento}:`, err.message);
          }
        }
      }
    }
    
    console.log('\n=== Base de datos poblada con éxito ===');
    console.log(`Se han generado datos para ${MESES} meses: ${MESES_HISTORICOS.map(m => `${m.mes+1}/${m.año}`).join(', ')}`);
    console.log('Ahora puedes probar el asesor financiero con estos datos.');
    
  } catch (error) {
    console.error('\n❌ Error al poblar la base de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar función principal
console.log('Iniciando script de generación de datos...');
populateDatabase()
  .then(() => console.log('Script finalizado'))
  .catch(e => {
    console.error('Error fatal:', e);
    process.exit(1);
  }); 