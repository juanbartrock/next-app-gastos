const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Función para generar fecha aleatoria entre dos fechas
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Función para generar fecha aleatoria en el futuro
function randomFutureDate(minDays = 30, maxDays = 365) {
  const today = new Date();
  const future = new Date();
  future.setDate(today.getDate() + minDays + Math.floor(Math.random() * (maxDays - minDays)));
  return future;
}

// Tipos de inversión predefinidos
const tiposInversion = [
  { nombre: 'Plazo Fijo', descripcion: 'Depósito a plazo fijo tradicional', icono: 'piggy-bank' },
  { nombre: 'Plazo Fijo UVA', descripcion: 'Depósito a plazo fijo ajustado por inflación', icono: 'trending-up' },
  { nombre: 'Bonos', descripcion: 'Bonos soberanos o corporativos', icono: 'landmark' },
  { nombre: 'Obligaciones Negociables', descripcion: 'Deuda emitida por empresas', icono: 'building' },
  { nombre: 'Acciones', descripcion: 'Participación en empresas cotizantes', icono: 'line-chart' },
  { nombre: 'ETF', descripcion: 'Fondos cotizados en bolsa', icono: 'bar-chart-2' },
  { nombre: 'Fondos Comunes de Inversión', descripcion: 'Fondos gestionados profesionalmente', icono: 'pie-chart' },
  { nombre: 'Cripto', descripcion: 'Criptomonedas y tokens digitales', icono: 'bitcoin' },
  { nombre: 'Dólar MEP', descripcion: 'Dólares adquiridos a través de bonos', icono: 'dollar-sign' },
  { nombre: 'Propiedades', descripcion: 'Inversiones inmobiliarias', icono: 'home' },
  { nombre: 'Oro', descripcion: 'Oro físico o instrumentos financieros respaldados', icono: 'activity' },
];

// Plataformas de inversión comunes
const plataformas = [
  'Banco Nación', 'Banco Galicia', 'Banco Santander', 'BBVA', 'Brubank',
  'Mercado Pago', 'PPI', 'Balanz', 'IOL', 'Cocos Capital',
  'Binance', 'Lemon', 'Ripio', 'Buenbit'
];

// Función principal para generar datos
async function seedInversiones() {
  console.log('Iniciando generación de datos de prueba para inversiones...');

  try {
    // 1. Crear tipos de inversión predefinidos (si no existen)
    console.log('Creando tipos de inversión...');
    
    for (const tipo of tiposInversion) {
      // Primero buscar si existe
      const tipoExistente = await prisma.tipoInversion.findFirst({
        where: {
          nombre: tipo.nombre,
          userId: null
        }
      });

      if (!tipoExistente) {
        // Si no existe, crearlo
        await prisma.tipoInversion.create({
          data: {
            nombre: tipo.nombre,
            descripcion: tipo.descripcion,
            icono: tipo.icono,
            userId: null // Tipos predefinidos del sistema
          }
        });
      }
    }
    
    // 2. Obtener todos los usuarios
    const usuarios = await prisma.user.findMany({
      select: { id: true }
    });

    if (usuarios.length === 0) {
      console.log('No hay usuarios en la base de datos. Crea algunos usuarios primero.');
      return;
    }

    // 3. Obtener todos los tipos de inversión
    const tiposInversionDB = await prisma.tipoInversion.findMany();

    // 4. Crear inversiones para cada usuario
    console.log('Creando inversiones para usuarios...');
    
    for (const usuario of usuarios) {
      // Determinar número aleatorio de inversiones para este usuario (1-5)
      const numInversiones = Math.floor(Math.random() * 5) + 1;
      
      for (let i = 0; i < numInversiones; i++) {
        // Seleccionar tipo de inversión aleatorio
        const tipoRandom = tiposInversionDB[Math.floor(Math.random() * tiposInversionDB.length)];
        
        // Generar fechas (inicio en el pasado reciente)
        const fechaInicio = randomDate(new Date(2023, 0, 1), new Date());
        
        // Fechas de vencimiento solo para algunos tipos
        let fechaVencimiento = null;
        if (['Plazo Fijo', 'Plazo Fijo UVA', 'Bonos', 'Obligaciones Negociables'].includes(tipoRandom.nombre)) {
          fechaVencimiento = randomFutureDate();
        }
        
        // Generar monto inicial (entre 50,000 y 1,000,000)
        const montoInicial = Math.floor(Math.random() * 950000) + 50000;
        
        // Calcular rendimiento (entre -10% y +30%)
        const rendimientoPorcentaje = (Math.random() * 40) - 10;
        const rendimientoTotal = montoInicial * (rendimientoPorcentaje / 100);
        const montoActual = montoInicial + rendimientoTotal;
        
        // Rendimiento anual estimado (entre 0% y 20%)
        const rendimientoAnual = Math.floor(Math.random() * 2000) / 100; // 0-20% con 2 decimales
        
        // Estado (mayoría activas, algunas cerradas o vencidas)
        const estadoOpciones = ['activa', 'activa', 'activa', 'activa', 'cerrada', 'vencida'];
        const estado = estadoOpciones[Math.floor(Math.random() * estadoOpciones.length)];
        
        // Plataforma aleatoria
        const plataforma = plataformas[Math.floor(Math.random() * plataformas.length)];
        
        // Crear la inversión
        const inversion = await prisma.inversion.create({
          data: {
            nombre: `${tipoRandom.nombre} - ${plataforma}`,
            descripcion: `Inversión en ${tipoRandom.nombre} realizada a través de ${plataforma}.`,
            montoInicial,
            montoActual,
            rendimientoTotal,
            rendimientoAnual,
            fechaInicio,
            fechaVencimiento,
            estado,
            plataforma,
            tipoId: tipoRandom.id,
            userId: usuario.id,
            notas: 'Notas de seguimiento para esta inversión.',
          }
        });
        
        // 5. Crear cotizaciones históricas
        console.log(`Creando cotizaciones para inversión ID ${inversion.id}...`);
        
        // Cotización inicial (igual al monto inicial)
        await prisma.cotizacionInversion.create({
          data: {
            inversionId: inversion.id,
            valor: montoInicial,
            fecha: fechaInicio,
            fuente: 'Inversión inicial'
          }
        });
        
        // Cotizaciones intermedias (entre 2 y 5)
        const numCotizaciones = Math.floor(Math.random() * 4) + 2;
        const fechaFinal = fechaVencimiento || new Date();
        
        for (let j = 1; j <= numCotizaciones; j++) {
          // Calcular fecha intermedia
          const fechaIntermedia = new Date(
            fechaInicio.getTime() + (fechaFinal.getTime() - fechaInicio.getTime()) * (j / (numCotizaciones + 1))
          );
          
          // Calcular valor intermedio (progresión hacia el valor final)
          const valorIntermedio = montoInicial + (montoActual - montoInicial) * (j / (numCotizaciones + 1));
          
          await prisma.cotizacionInversion.create({
            data: {
              inversionId: inversion.id,
              valor: valorIntermedio,
              fecha: fechaIntermedia,
              fuente: plataforma
            }
          });
        }
        
        // Cotización final (solo si no está cerrada)
        if (estado !== 'cerrada') {
          await prisma.cotizacionInversion.create({
            data: {
              inversionId: inversion.id,
              valor: montoActual,
              fecha: new Date(),
              fuente: plataforma
            }
          });
        }
        
        // 6. Crear transacciones
        console.log(`Creando transacciones para inversión ID ${inversion.id}...`);
        
        // Transacción inicial (depósito)
        await prisma.transaccionInversion.create({
          data: {
            inversionId: inversion.id,
            tipo: 'deposito',
            monto: montoInicial,
            fecha: fechaInicio,
            descripcion: 'Depósito inicial'
          }
        });
        
        // Posibles transacciones adicionales
        if (Math.random() > 0.5) {
          // Intereses o dividendos
          const tipoTransaccion = ['Plazo Fijo', 'Plazo Fijo UVA', 'Bonos', 'Obligaciones Negociables'].includes(tipoRandom.nombre) 
            ? 'interes' 
            : 'dividendo';
          
          const montoTransaccion = montoInicial * ((Math.random() * 5) / 100); // 0-5% del monto inicial
          
          await prisma.transaccionInversion.create({
            data: {
              inversionId: inversion.id,
              tipo: tipoTransaccion,
              monto: montoTransaccion,
              fecha: new Date(fechaInicio.getTime() + Math.random() * (new Date().getTime() - fechaInicio.getTime())),
              descripcion: tipoTransaccion === 'interes' ? 'Pago de intereses' : 'Pago de dividendos'
            }
          });
        }
        
        // Para inversiones cerradas, agregar transacción de retiro
        if (estado === 'cerrada') {
          await prisma.transaccionInversion.create({
            data: {
              inversionId: inversion.id,
              tipo: 'retiro',
              monto: montoActual,
              fecha: fechaVencimiento || new Date(),
              descripcion: 'Retiro por cierre'
            }
          });
        }
      }
    }

    console.log('Datos de prueba para inversiones generados correctamente');
  } catch (error) {
    console.error('Error al generar datos de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función principal
seedInversiones()
  .then(() => console.log('Proceso completado.'))
  .catch(error => console.error('Error en el proceso:', error)); 