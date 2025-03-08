/**
 * Script para poblar la base de datos con datos financieros de prueba
 * para evaluar el asesor financiero personalizado
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Categorías para organizar los gastos
const CATEGORIAS = [
  { id: 1, descripcion: 'Vivienda', grupo_categoria: 'Básicos', status: true },
  { id: 2, descripcion: 'Alimentación', grupo_categoria: 'Básicos', status: true },
  { id: 3, descripcion: 'Transporte', grupo_categoria: 'Básicos', status: true },
  { id: 4, descripcion: 'Servicios', grupo_categoria: 'Básicos', status: true },
  { id: 5, descripcion: 'Salud', grupo_categoria: 'Bienestar', status: true },
  { id: 6, descripcion: 'Educación', grupo_categoria: 'Bienestar', status: true },
  { id: 7, descripcion: 'Entretenimiento', grupo_categoria: 'Ocio', status: true },
  { id: 8, descripcion: 'Viajes', grupo_categoria: 'Ocio', status: true },
  { id: 9, descripcion: 'Ropa', grupo_categoria: 'Personal', status: true },
  { id: 10, descripcion: 'Restaurantes', grupo_categoria: 'Ocio', status: true },
  { id: 11, descripcion: 'Ahorro', grupo_categoria: 'Financiero', status: true },
  { id: 12, descripcion: 'Inversiones', grupo_categoria: 'Financiero', status: true },
  { id: 13, descripcion: 'Suscripciones', grupo_categoria: 'Digital', status: true },
  { id: 14, descripcion: 'Tecnología', grupo_categoria: 'Digital', status: true },
  { id: 15, descripcion: 'Mascotas', grupo_categoria: 'Personal', status: true },
];

// Función para generar una fecha aleatoria dentro de un mes específico
function randomDateInMonth(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const day = Math.floor(Math.random() * daysInMonth) + 1;
  return new Date(year, month, day);
}

// Distribución de gastos por categoría (en porcentaje)
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

// Gastos recurrentes predefinidos
const GASTOS_RECURRENTES = [
  { concepto: 'Alquiler', monto: 1200, categoriaId: 1, periodicidad: 'mensual' },
  { concepto: 'Netflix', monto: 15, categoriaId: 13, periodicidad: 'mensual' },
  { concepto: 'Spotify', monto: 10, categoriaId: 13, periodicidad: 'mensual' },
  { concepto: 'Internet', monto: 50, categoriaId: 4, periodicidad: 'mensual' },
  { concepto: 'Teléfono', monto: 30, categoriaId: 4, periodicidad: 'mensual' },
  { concepto: 'Electricidad', monto: 80, categoriaId: 4, periodicidad: 'mensual' },
  { concepto: 'Agua', monto: 25, categoriaId: 4, periodicidad: 'mensual' },
  { concepto: 'Gimnasio', monto: 40, categoriaId: 5, periodicidad: 'mensual' },
  { concepto: 'Seguro de salud', monto: 150, categoriaId: 5, periodicidad: 'mensual' },
  { concepto: 'Suscripción revista', monto: 20, categoriaId: 13, periodicidad: 'bimestral' },
  { concepto: 'Mantenimiento coche', monto: 200, categoriaId: 3, periodicidad: 'bimestral' },
  { concepto: 'Impuesto municipal', monto: 120, categoriaId: 1, periodicidad: 'bimestral' },
  { concepto: 'Seguro de hogar', monto: 300, categoriaId: 1, periodicidad: 'semestral' },
  { concepto: 'Seguro del coche', monto: 400, categoriaId: 3, periodicidad: 'semestral' },
];

// Datos para presupuestos
const PRESUPUESTOS = [
  { categoria: 'Vivienda', monto: 1300, mes: 1, año: 2024 },
  { categoria: 'Alimentación', monto: 600, mes: 1, año: 2024 },
  { categoria: 'Transporte', monto: 300, mes: 1, año: 2024 },
  { categoria: 'Servicios', monto: 200, mes: 1, año: 2024 },
  { categoria: 'Ocio', monto: 350, mes: 1, año: 2024 },
  { categoria: 'Vivienda', monto: 1300, mes: 2, año: 2024 },
  { categoria: 'Alimentación', monto: 600, mes: 2, año: 2024 },
  { categoria: 'Transporte', monto: 300, mes: 2, año: 2024 },
  { categoria: 'Servicios', monto: 200, mes: 2, año: 2024 },
  { categoria: 'Ocio', monto: 350, mes: 2, año: 2024 },
  { categoria: 'Vivienda', monto: 1300, mes: 3, año: 2024 },
  { categoria: 'Alimentación', monto: 600, mes: 3, año: 2024 },
  { categoria: 'Transporte', monto: 300, mes: 3, año: 2024 },
  { categoria: 'Servicios', monto: 200, mes: 3, año: 2024 },
  { categoria: 'Ocio', monto: 350, mes: 3, año: 2024 },
  { categoria: 'Vivienda', monto: 1300, mes: 4, año: 2024 },
  { categoria: 'Alimentación', monto: 600, mes: 4, año: 2024 },
  { categoria: 'Transporte', monto: 300, mes: 4, año: 2024 },
  { categoria: 'Servicios', monto: 200, mes: 4, año: 2024 },
  { categoria: 'Ocio', monto: 350, mes: 4, año: 2024 },
  { categoria: 'Vivienda', monto: 1300, mes: 5, año: 2024 },
  { categoria: 'Alimentación', monto: 600, mes: 5, año: 2024 },
  { categoria: 'Transporte', monto: 300, mes: 5, año: 2024 },
  { categoria: 'Servicios', monto: 200, mes: 5, año: 2024 },
  { categoria: 'Ocio', monto: 350, mes: 5, año: 2024 },
  { categoria: 'Vivienda', monto: 1300, mes: 6, año: 2024 },
  { categoria: 'Alimentación', monto: 600, mes: 6, año: 2024 },
  { categoria: 'Transporte', monto: 300, mes: 6, año: 2024 },
  { categoria: 'Servicios', monto: 200, mes: 6, año: 2024 },
  { categoria: 'Ocio', monto: 350, mes: 6, año: 2024 },
];

// Función principal para poblar la base de datos
async function populateDatabase() {
  // Obtener el ID de usuario (asumiendo que ya existe)
  const user = await prisma.user.findFirst();
  
  if (!user) {
    console.error('No se encontró ningún usuario en la base de datos');
    return;
  }
  
  console.log(`Utilizando el usuario: ${user.name} (${user.id})`);

  try {
    // 1. Crear o verificar categorías
    console.log('Comprobando categorías...');
    for (const categoria of CATEGORIAS) {
      const existingCategoria = await prisma.categoria.findFirst({
        where: { descripcion: categoria.descripcion }
      });
      
      if (!existingCategoria) {
        await prisma.categoria.create({
          data: categoria
        });
        console.log(`Creada categoría: ${categoria.descripcion}`);
      } else {
        console.log(`La categoría ${categoria.descripcion} ya existe`);
      }
    }

    // 2. Crear gastos recurrentes
    console.log('Creando gastos recurrentes...');
    
    // Limpiar gastos recurrentes existentes
    await prisma.gastoRecurrente.deleteMany({
      where: { userId: user.id }
    });
    
    // Distribuir según porcentajes: 80% mensual, 15% bimestral, 5% semestral
    const mensuales = GASTOS_RECURRENTES.filter(g => g.periodicidad === 'mensual');
    const bimestrales = GASTOS_RECURRENTES.filter(g => g.periodicidad === 'bimestral');
    const semestrales = GASTOS_RECURRENTES.filter(g => g.periodicidad === 'semestral');
    
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
      await prisma.gastoRecurrente.create({
        data: {
          concepto: gasto.concepto,
          monto: gasto.monto,
          periodicidad: gasto.periodicidad,
          estado: 'pendiente',
          userId: user.id,
          categoriaId: gasto.categoriaId,
          proximaFecha: calcularProximaFecha(gasto.periodicidad),
          ultimoPago: new Date(2024, 0, 15), // 15 de enero como último pago
          comentario: `Gasto recurrente de prueba (${gasto.periodicidad})`
        }
      });
      console.log(`Creado gasto recurrente: ${gasto.concepto} (${gasto.periodicidad})`);
    }

    // 3. Crear presupuestos hasta junio
    console.log('Creando presupuestos...');
    
    // Limpiar presupuestos existentes de 2024
    await prisma.presupuesto.deleteMany({
      where: { 
        userId: user.id,
        año: 2024,
        mes: { in: [1, 2, 3, 4, 5, 6] }
      }
    });
    
    for (const presupuesto of PRESUPUESTOS) {
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
        console.log(`Creado presupuesto: ${presupuesto.categoria} - Mes ${presupuesto.mes} - ${presupuesto.monto}`);
      }
    }

    // 4. Crear transacciones para enero, febrero y marzo
    console.log('Creando transacciones...');
    
    // Limpiar transacciones existentes de 2024
    await prisma.gasto.deleteMany({
      where: { 
        userId: user.id,
        fecha: {
          gte: new Date(2024, 0, 1),
          lt: new Date(2024, 3, 1)
        }
      }
    });
    
    // Definir ingresos fijos por mes
    const ingresoMensual = 3000;
    
    // Crear datos para cada mes
    for (let mes = 0; mes < 3; mes++) {
      // Crear ingreso mensual (salario)
      await prisma.gasto.create({
        data: {
          concepto: 'Salario',
          monto: ingresoMensual,
          fecha: new Date(2024, mes, 5), // Día 5 de cada mes
          categoria: 'Ingreso',
          tipoTransaccion: 'ingreso',
          tipoMovimiento: 'digital',
          userId: user.id
        }
      });
      console.log(`Creado ingreso: Salario - Mes ${mes + 1} - ${ingresoMensual}`);
      
      // Variación para hacer los datos más realistas
      const variacion = (mes === 0) ? 1 : (mes === 1) ? 0.9 : 1.1;
      
      // Crear gastos por categoría
      for (const [categoria, porcentaje] of Object.entries(GASTOS_DISTRIBUCION)) {
        // Encontrar la categoría en la base de datos
        const categoriaObj = CATEGORIAS.find(c => c.descripcion === categoria);
        
        if (categoriaObj) {
          // Calcular monto basado en el porcentaje del ingreso y aplicar variación
          const montoBase = ingresoMensual * (porcentaje / 100) * variacion;
          
          // Dividir en 2-4 transacciones para categorías grandes
          const numTransacciones = porcentaje > 10 ? 4 : porcentaje > 5 ? 2 : 1;
          
          for (let i = 0; i < numTransacciones; i++) {
            // Calcular monto de esta transacción
            const monto = montoBase / numTransacciones;
            // Mover un poco los montos para hacerlo más realista
            const montoFinal = monto * (0.9 + Math.random() * 0.2);
            
            // Determinar el tipo de movimiento
            const tiposMovimiento = ['efectivo', 'digital', 'ahorro'];
            let tipoMovimiento;
            
            if (categoria === 'Vivienda') {
              tipoMovimiento = 'digital';
            } else if (categoria === 'Ahorro' || categoria === 'Inversiones') {
              tipoMovimiento = 'ahorro';
            } else {
              // Distribuir entre efectivo (30%) y digital (70%)
              tipoMovimiento = Math.random() < 0.3 ? 'efectivo' : 'digital';
            }
            
            // Crear la transacción
            await prisma.gasto.create({
              data: {
                concepto: `Gasto en ${categoria} ${i + 1}`,
                monto: Math.round(montoFinal * 100) / 100,
                fecha: randomDateInMonth(2024, mes),
                categoria: categoria,
                tipoTransaccion: 'gasto',
                tipoMovimiento: tipoMovimiento,
                userId: user.id,
                categoriaId: categoriaObj.id
              }
            });
            console.log(`Creado gasto: ${categoria} - Mes ${mes + 1} - ${Math.round(montoFinal)}`);
          }
        }
      }
      
      // Añadir algunos gastos en tarjeta
      const gastosTarjeta = [
        { concepto: 'Compra en Amazon', monto: 120 * variacion, categoria: 'Tecnología' },
        { concepto: 'Supermercado', monto: 200 * variacion, categoria: 'Alimentación' },
        { concepto: 'Ropa', monto: 150 * variacion, categoria: 'Ropa' }
      ];
      
      for (const gasto of gastosTarjeta) {
        const categoriaObj = CATEGORIAS.find(c => c.descripcion === gasto.categoria);
        
        if (categoriaObj) {
          await prisma.gasto.create({
            data: {
              concepto: gasto.concepto,
              monto: Math.round(gasto.monto * 100) / 100,
              fecha: randomDateInMonth(2024, mes),
              categoria: gasto.categoria,
              tipoTransaccion: 'gasto',
              tipoMovimiento: 'tarjeta',
              userId: user.id,
              categoriaId: categoriaObj.id
            }
          });
          console.log(`Creado gasto tarjeta: ${gasto.concepto} - Mes ${mes + 1} - ${Math.round(gasto.monto)}`);
        }
      }
      
      // Añadir financiación para el mes 2 (marzo)
      if (mes === 2) {
        // Crear un gasto grande con financiación
        const gastoFinanciado = await prisma.gasto.create({
          data: {
            concepto: 'MacBook Pro',
            monto: 1500,
            fecha: new Date(2024, mes, 15),
            categoria: 'Tecnología',
            tipoTransaccion: 'gasto',
            tipoMovimiento: 'tarjeta',
            userId: user.id,
            categoriaId: CATEGORIAS.find(c => c.descripcion === 'Tecnología').id
          }
        });
        
        // Crear la financiación
        await prisma.financiacion.create({
          data: {
            gastoId: gastoFinanciado.id,
            montoTotal: 1500,
            cantidadCuotas: 12,
            montoCuota: 125,
            fechaInicio: new Date(2024, mes, 15),
            fechaFin: new Date(2025, mes, 15),
            estado: 'activo',
            descripcion: 'Financiación MacBook Pro'
          }
        });
        console.log('Creada financiación: MacBook Pro - 12 cuotas de 125');
      }
    }

    console.log('Base de datos poblada con éxito');
  } catch (error) {
    console.error('Error al poblar la base de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar función principal
populateDatabase()
  .then(() => console.log('Script finalizado'))
  .catch(e => console.error(e)); 