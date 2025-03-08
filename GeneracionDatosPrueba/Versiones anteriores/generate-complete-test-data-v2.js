const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script completo para generar datos de prueba realistas
 * - Datos para los últimos 6 meses
 * - 2 usuarios (principal y secundario)
 * - 1 grupo compartido entre ambos
 * - Distintos tipos de gastos (efectivo, tarjeta, transferencia)
 * - Varias financiaciones con diferentes plazos
 * - Presupuestos mensuales por categoría
 * - Gastos recurrentes con diferentes periodicidades
 */

// Categorías con distribución realista de gastos
const CATEGORIAS = [
  { descripcion: 'Vivienda', grupo_categoria: 'Básicos', porcentajeGasto: 0.25 },
  { descripcion: 'Alimentación', grupo_categoria: 'Básicos', porcentajeGasto: 0.20 },
  { descripcion: 'Transporte', grupo_categoria: 'Básicos', porcentajeGasto: 0.10 },
  { descripcion: 'Servicios', grupo_categoria: 'Básicos', porcentajeGasto: 0.08 },
  { descripcion: 'Salud', grupo_categoria: 'Bienestar', porcentajeGasto: 0.05 },
  { descripcion: 'Educación', grupo_categoria: 'Bienestar', porcentajeGasto: 0.03 },
  { descripcion: 'Entretenimiento', grupo_categoria: 'Ocio', porcentajeGasto: 0.06 },
  { descripcion: 'Viajes', grupo_categoria: 'Ocio', porcentajeGasto: 0.05 },
  { descripcion: 'Ropa', grupo_categoria: 'Personal', porcentajeGasto: 0.04 },
  { descripcion: 'Restaurantes', grupo_categoria: 'Ocio', porcentajeGasto: 0.06 },
  { descripcion: 'Suscripciones', grupo_categoria: 'Digital', porcentajeGasto: 0.03 },
  { descripcion: 'Tecnología', grupo_categoria: 'Digital', porcentajeGasto: 0.02 },
  { descripcion: 'Mascotas', grupo_categoria: 'Personal', porcentajeGasto: 0.02 }
];

// Conceptos por categoría para generar datos más realistas
const CONCEPTOS_POR_CATEGORIA = {
  'Vivienda': ['Alquiler', 'Hipoteca', 'Servicios comunes', 'Reparaciones', 'Muebles', 'Decoración'],
  'Alimentación': ['Supermercado', 'Frutería', 'Carnicería', 'Panadería', 'Comida preparada'],
  'Transporte': ['Gasolina', 'Transporte público', 'Taxi/Uber', 'Parking', 'Peajes', 'Mantenimiento vehículo'],
  'Servicios': ['Electricidad', 'Agua', 'Gas', 'Internet', 'Telefonía móvil', 'TV/Streaming'],
  'Salud': ['Farmacia', 'Médico', 'Dentista', 'Fisioterapia', 'Seguro médico', 'Gimnasio'],
  'Educación': ['Libros', 'Cursos', 'Material escolar', 'Matrícula', 'Clases particulares', 'Formación'],
  'Entretenimiento': ['Cine', 'Conciertos', 'Teatro', 'Videojuegos', 'Suscripciones ocio', 'Eventos'],
  'Viajes': ['Vuelos', 'Hoteles', 'Actividades turísticas', 'Seguro viaje', 'Recuerdos', 'Transporte local'],
  'Ropa': ['Ropa casual', 'Ropa formal', 'Calzado', 'Accesorios', 'Arreglos de ropa'],
  'Restaurantes': ['Comida rápida', 'Café', 'Restaurante casual', 'Restaurante elegante', 'Bares'],
  'Suscripciones': ['Netflix', 'Spotify', 'Amazon Prime', 'Disney+', 'HBO', 'Apple TV'],
  'Tecnología': ['Teléfono', 'Ordenador', 'Accesorios', 'Software', 'Reparaciones tecnológicas'],
  'Mascotas': ['Comida mascota', 'Veterinario', 'Accesorios mascota', 'Peluquería mascota', 'Juguetes mascota']
};

// Gastos recurrentes realistas
const GASTOS_RECURRENTES = [
  { concepto: 'Alquiler', monto: 800, categoria: 'Vivienda', periodicidad: 'mensual' },
  { concepto: 'Netflix', monto: 15, categoria: 'Suscripciones', periodicidad: 'mensual' },
  { concepto: 'Spotify', monto: 10, categoria: 'Suscripciones', periodicidad: 'mensual' },
  { concepto: 'Internet', monto: 50, categoria: 'Servicios', periodicidad: 'mensual' },
  { concepto: 'Gimnasio', monto: 45, categoria: 'Salud', periodicidad: 'mensual' },
  { concepto: 'Seguro médico', monto: 120, categoria: 'Salud', periodicidad: 'mensual' },
  { concepto: 'Mantenimiento coche', monto: 80, categoria: 'Transporte', periodicidad: 'bimestral' },
  { concepto: 'Seguro del coche', monto: 250, categoria: 'Transporte', periodicidad: 'semestral' }
];

// Eventos especiales (compras grandes que pueden ser financiadas)
const EVENTOS_ESPECIALES = [
  { tipo: 'viaje', monto: 1200, concepto: 'Viaje a la playa', categoria: 'Viajes', financiado: true, cuotas: 6 },
  { tipo: 'tecnologia', monto: 1500, concepto: 'MacBook Air', categoria: 'Tecnología', financiado: true, cuotas: 12 },
  { tipo: 'muebles', monto: 900, concepto: 'Sofá nuevo', categoria: 'Vivienda', financiado: true, cuotas: 9 },
  { tipo: 'reparacion', monto: 500, concepto: 'Reparación electrodoméstico', categoria: 'Vivienda', financiado: false },
  { tipo: 'regalo', monto: 300, concepto: 'Regalo de cumpleaños', categoria: 'Entretenimiento', financiado: false }
];

// Financiaciones garantizadas (para asegurar variedad de casos)
const FINANCIACIONES_GARANTIZADAS = [
  { concepto: 'iPhone 14 Pro', monto: 1299, categoria: 'Tecnología', cuotas: 12, mesInicio: 1 },
  { concepto: 'Smart TV 55"', monto: 799, categoria: 'Tecnología', cuotas: 6, mesInicio: 2 },
  { concepto: 'Muebles de cocina', monto: 2500, categoria: 'Vivienda', cuotas: 18, mesInicio: 0 },
  { concepto: 'Lavadora', monto: 699, categoria: 'Vivienda', cuotas: 9, mesInicio: 3 },
  { concepto: 'Viaje a Europa', monto: 3000, categoria: 'Viajes', cuotas: 24, mesInicio: 1 },
  { concepto: 'Bicicleta eléctrica', monto: 899, categoria: 'Transporte', cuotas: 8, mesInicio: 4 },
  { concepto: 'Curso de programación', monto: 1200, categoria: 'Educación', cuotas: 12, mesInicio: 2 },
  { concepto: 'Consola PS5', monto: 599, categoria: 'Entretenimiento', cuotas: 6, mesInicio: 5 }
];

// Utilidades para generar datos aleatorios
function randomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDate(startDate, endDate) {
  const minTime = startDate.getTime();
  const maxTime = endDate.getTime();
  const randomTime = minTime + Math.random() * (maxTime - minTime);
  return new Date(randomTime);
}

// Función principal
async function generateCompleteTestData() {
  console.log('=== INICIO DE GENERACIÓN DE DATOS DE PRUEBA COMPLETOS (V2) ===');
  console.log('Generando datos realistas para los últimos 6 meses');
  
  try {
    // 1. LIMPIEZA DE DATOS EXISTENTES
    console.log('\n----- LIMPIANDO DATOS EXISTENTES -----');
    
    // Eliminar en orden para evitar problemas de restricciones
    await prisma.financiacion.deleteMany();
    console.log('✓ Financiaciones eliminadas');
    
    await prisma.presupuesto.deleteMany();
    console.log('✓ Presupuestos eliminados');
    
    await prisma.gasto.deleteMany();
    console.log('✓ Gastos eliminados');
    
    await prisma.gastoRecurrente.deleteMany();
    console.log('✓ Gastos recurrentes eliminados');
    
    await prisma.grupoMiembro.deleteMany();
    console.log('✓ Miembros de grupos eliminados');
    
    await prisma.grupo.deleteMany();
    console.log('✓ Grupos eliminados');
    
    // Conservamos las categorías para reutilizarlas
    
    // 2. PREPARACIÓN DE PERIODOS DE TIEMPO
    const hoy = new Date();
    const periodos = [];
    
    for (let i = 5; i >= 0; i--) {
      const mes = new Date(hoy);
      mes.setMonth(hoy.getMonth() - i);
      periodos.push({
        mes: mes.getMonth() + 1, // 1-12
        año: mes.getFullYear(),
        inicioPeriodo: new Date(mes.getFullYear(), mes.getMonth(), 1),
        finPeriodo: new Date(mes.getFullYear(), mes.getMonth() + 1, 0)
      });
    }
    
    console.log(`Generando datos para los periodos: ${periodos.map(p => `${p.mes}/${p.año}`).join(', ')}`);
    
    // 3. BUSCAR O CREAR USUARIOS
    console.log('\n----- CONFIGURANDO USUARIOS -----');
    
    // Buscar usuario principal
    let usuarioPrincipal = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'jpautasso@example.com' },
          { email: { contains: 'jpaut' } }
        ]
      }
    });
    
    // Si no existe, crearlo
    if (!usuarioPrincipal) {
      usuarioPrincipal = await prisma.user.create({
        data: {
          name: 'Juan Pautasso',
          email: 'jpautasso@example.com',
          password: '$2a$10$aBcDeFgHiJkLmNoPqRsTuVwXyZ123456789AbCdEfGh', // Hash ficticio
          image: 'https://i.pravatar.cc/150?u=jpautasso'
        }
      });
      console.log(`✓ Usuario principal creado: ${usuarioPrincipal.name}`);
    } else {
      console.log(`✓ Usuario principal encontrado: ${usuarioPrincipal.name}`);
    }
    
    // Crear usuario secundario
    const usuarioSecundario = await prisma.user.create({
      data: {
        name: 'Ana García',
        email: 'ana.garcia@example.com',
        password: '$2a$10$aBcDeFgHiJkLmNoPqRsTuVwXyZ987654321AbCdEfGh', // Hash ficticio
        image: 'https://i.pravatar.cc/150?u=anagarcia'
      }
    });
    console.log(`✓ Usuario secundario creado: ${usuarioSecundario.name}`);
    
    // 4. CREAR GRUPO COMPARTIDO
    console.log('\n----- CREANDO GRUPO COMPARTIDO -----');
    
    const grupo = await prisma.grupo.create({
      data: {
        nombre: 'Gastos Compartidos',
        descripcion: 'Grupo para compartir gastos entre amigos',
        admin: {
          connect: {
            id: usuarioPrincipal.id
          }
        }
      }
    });
    console.log(`✓ Grupo creado: ${grupo.nombre} (ID: ${grupo.id})`);
    
    // Añadir ambos usuarios como miembros
    await prisma.grupoMiembro.create({
      data: {
        rol: 'admin',
        grupo: { connect: { id: grupo.id } },
        user: { connect: { id: usuarioPrincipal.id } }
      }
    });
    
    await prisma.grupoMiembro.create({
      data: {
        rol: 'miembro',
        grupo: { connect: { id: grupo.id } },
        user: { connect: { id: usuarioSecundario.id } }
      }
    });
    console.log('✓ Ambos usuarios añadidos al grupo');
    
    // 5. VERIFICAR Y CREAR CATEGORÍAS
    console.log('\n----- CONFIGURANDO CATEGORÍAS -----');
    
    // Mapa para almacenar IDs de categorías
    const categoriasMap = {};
    
    for (const cat of CATEGORIAS) {
      // Verificar si ya existe
      let categoria = await prisma.categoria.findFirst({
        where: { 
          descripcion: cat.descripcion 
        }
      });
      
      // Si no existe, crearla
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
      
      // Guardar ID en el mapa
      categoriasMap[cat.descripcion] = categoria.id;
    }
    
    // 6. CREAR GASTOS RECURRENTES PARA AMBOS USUARIOS
    console.log('\n----- CREANDO GASTOS RECURRENTES -----');
    
    // Para usuario principal (todos los recurrentes)
    for (const gr of GASTOS_RECURRENTES) {
      const categoriaId = categoriasMap[gr.categoria];
      
      if (!categoriaId) {
        console.warn(`⚠ No se encontró la categoría ${gr.categoria}`);
        continue;
      }
      
      const fechaProxima = new Date();
      fechaProxima.setMonth(fechaProxima.getMonth() + 1);
      
      await prisma.gastoRecurrente.create({
        data: {
          concepto: gr.concepto,
          monto: gr.monto,
          periodicidad: gr.periodicidad,
          estado: 'activo',
          proximaFecha: fechaProxima,
          ultimoPago: new Date(),
          categoria: {
            connect: {
              id: categoriaId
            }
          },
          user: {
            connect: {
              id: usuarioPrincipal.id
            }
          }
        }
      });
    }
    console.log(`✓ Gastos recurrentes creados para ${usuarioPrincipal.name}`);
    
    // Para usuario secundario (sólo algunos)
    const recurrentesSecundarios = GASTOS_RECURRENTES.filter((_, i) => i % 3 === 0); // Cada tercer elemento
    
    for (const gr of recurrentesSecundarios) {
      const categoriaId = categoriasMap[gr.categoria];
      
      if (!categoriaId) continue;
      
      const fechaProxima = new Date();
      fechaProxima.setMonth(fechaProxima.getMonth() + 1);
      
      await prisma.gastoRecurrente.create({
        data: {
          concepto: gr.concepto,
          monto: gr.monto * 0.9, // Ligeramente menor para diferenciarlo
          periodicidad: gr.periodicidad,
          estado: 'activo',
          proximaFecha: fechaProxima,
          ultimoPago: new Date(),
          categoria: {
            connect: {
              id: categoriaId
            }
          },
          user: {
            connect: {
              id: usuarioSecundario.id
            }
          }
        }
      });
    }
    console.log(`✓ Gastos recurrentes creados para ${usuarioSecundario.name}`);
    
    // 7. CREAR PRESUPUESTOS MENSUALES
    console.log('\n----- CREANDO PRESUPUESTOS MENSUALES -----');
    
    // Base de ingresos para el presupuesto
    const ingresoBaseJuan = 3000;
    const ingresoBaseAna = 2700;
    
    for (const periodo of periodos) {
      // Presupuestos para usuario principal (para todas las categorías)
      for (const cat of CATEGORIAS) {
        // Calcular presupuesto con variación aleatoria
        const variacion = 0.9 + Math.random() * 0.2; // Entre 0.9 y 1.1
        const monto = Math.round(ingresoBaseJuan * cat.porcentajeGasto * variacion);
        
        await prisma.presupuesto.create({
          data: {
            nombre: `Presupuesto ${cat.descripcion}`,
            monto: monto,
            mes: periodo.mes,
            año: periodo.año,
            categoria: {
              connect: {
                id: categoriasMap[cat.descripcion]
              }
            },
            user: {
              connect: {
                id: usuarioPrincipal.id
              }
            }
          }
        });
      }
      
      // Presupuestos para usuario secundario (sólo para algunas categorías)
      for (const cat of CATEGORIAS.filter(c => ['Vivienda', 'Alimentación', 'Transporte', 'Entretenimiento', 'Servicios'].includes(c.descripcion))) {
        const variacion = 0.9 + Math.random() * 0.2;
        const monto = Math.round(ingresoBaseAna * cat.porcentajeGasto * variacion);
        
        await prisma.presupuesto.create({
          data: {
            nombre: `Presupuesto ${cat.descripcion}`,
            monto: monto,
            mes: periodo.mes,
            año: periodo.año,
            categoria: {
              connect: {
                id: categoriasMap[cat.descripcion]
              }
            },
            user: {
              connect: {
                id: usuarioSecundario.id
              }
            }
          }
        });
      }
    }
    console.log('✓ Presupuestos mensuales creados para ambos usuarios');
    
    // 8. CREAR FINANCIACIONES GARANTIZADAS
    console.log('\n----- CREANDO FINANCIACIONES GARANTIZADAS -----');
    
    let contadorFinanciaciones = 0;
    
    // Crear financiaciones garantizadas para ambos usuarios
    for (let i = 0; i < FINANCIACIONES_GARANTIZADAS.length; i++) {
      const financiacion = FINANCIACIONES_GARANTIZADAS[i];
      const usuario = i % 2 === 0 ? usuarioPrincipal : usuarioSecundario;
      const mesIndex = financiacion.mesInicio % periodos.length;
      const periodo = periodos[mesIndex];
      
      const categoriaId = categoriasMap[financiacion.categoria];
      if (!categoriaId) continue;
      
      // Crear el gasto asociado
      const gastoFinanciado = await prisma.gasto.create({
        data: {
          concepto: financiacion.concepto,
          monto: financiacion.monto,
          fecha: randomDate(periodo.inicioPeriodo, periodo.finPeriodo),
          categoria: financiacion.categoria,
          tipoTransaccion: 'gasto',
          tipoMovimiento: 'tarjeta', // Normalmente las compras grandes se pagan con tarjeta
          categoriaRel: {
            connect: {
              id: categoriaId
            }
          },
          user: {
            connect: {
              id: usuario.id
            }
          }
        }
      });
      
      // Calcular fechas para la financiación
      const fechaPrimerPago = new Date(gastoFinanciado.fecha);
      fechaPrimerPago.setMonth(fechaPrimerPago.getMonth() + 1);
      
      const fechaProximoPago = new Date(fechaPrimerPago);
      fechaProximoPago.setMonth(fechaProximoPago.getMonth() + 1);
      
      // Crear la financiación
      await prisma.financiacion.create({
        data: {
          cantidadCuotas: financiacion.cuotas,
          cuotasPagadas: 0,
          cuotasRestantes: financiacion.cuotas,
          montoCuota: Math.round((financiacion.monto / financiacion.cuotas) * 100) / 100,
          fechaPrimerPago: fechaPrimerPago,
          fechaProximoPago: fechaProximoPago,
          diaPago: fechaPrimerPago.getDate(),
          gasto: {
            connect: {
              id: gastoFinanciado.id
            }
          },
          user: {
            connect: {
              id: usuario.id
            }
          }
        }
      });
      
      contadorFinanciaciones++;
      console.log(`✓ Financiación garantizada ${contadorFinanciaciones}: ${financiacion.concepto} - ${financiacion.cuotas} cuotas de $${Math.round((financiacion.monto / financiacion.cuotas) * 100) / 100} para ${usuario.name}`);
    }
    
    // 9. GENERAR TRANSACCIONES PARA CADA PERIODO
    console.log('\n----- GENERANDO TRANSACCIONES -----');
    
    // Tipo de movimientos disponibles con distribución realista
    const tiposMovimiento = [
      { tipo: 'efectivo', probabilidad: 0.3 },
      { tipo: 'tarjeta', probabilidad: 0.5 },
      { tipo: 'transferencia', probabilidad: 0.2 }
    ];
    
    // Para cada periodo generamos transacciones
    for (const periodo of periodos) {
      console.log(`\nGenerando datos para ${periodo.mes}/${periodo.año}...`);
      
      // INGRESOS
      // Ingreso mensual para usuario principal
      await prisma.gasto.create({
        data: {
          concepto: 'Salario',
          monto: ingresoBaseJuan * (0.95 + Math.random() * 0.1), // Pequeña variación
          fecha: randomDate(periodo.inicioPeriodo, new Date(periodo.inicioPeriodo.getTime() + 5 * 24 * 60 * 60 * 1000)), // Primeros 5 días
          categoria: 'Ingresos',
          tipoTransaccion: 'ingreso',
          tipoMovimiento: 'transferencia',
          user: {
            connect: {
              id: usuarioPrincipal.id
            }
          }
        }
      });
      
      // Ingreso mensual para usuario secundario
      await prisma.gasto.create({
        data: {
          concepto: 'Salario',
          monto: ingresoBaseAna * (0.95 + Math.random() * 0.1),
          fecha: randomDate(periodo.inicioPeriodo, new Date(periodo.inicioPeriodo.getTime() + 5 * 24 * 60 * 60 * 1000)),
          categoria: 'Ingresos',
          tipoTransaccion: 'ingreso',
          tipoMovimiento: 'transferencia',
          user: {
            connect: {
              id: usuarioSecundario.id
            }
          }
        }
      });
      
      // GASTOS INDIVIDUALES PARA USUARIO PRINCIPAL
      for (const cat of CATEGORIAS) {
        const categoriaId = categoriasMap[cat.descripcion];
        if (!categoriaId) continue;
        
        // Número de transacciones para esta categoría este mes
        const numTransacciones = randomInRange(2, 8);
        
        // Presupuesto base para esta categoría
        const presupuestoBase = ingresoBaseJuan * cat.porcentajeGasto;
        
        // Dividir el presupuesto entre las transacciones (con variación)
        for (let i = 0; i < numTransacciones; i++) {
          // El monto depende del tipo de categoría y es variable
          let porcentajeGasto = (1 / numTransacciones) * (0.8 + Math.random() * 0.4);
          let monto = Math.round(presupuestoBase * porcentajeGasto);
          
          // Asegurar que el monto sea razonable
          if (monto < 5) monto = randomInRange(5, 20);
          
          // Elegir un concepto aleatorio para esta categoría
          const conceptosDisponibles = CONCEPTOS_POR_CATEGORIA[cat.descripcion] || [`Gasto de ${cat.descripcion}`];
          const concepto = randomElement(conceptosDisponibles);
          
          // Elegir tipo de movimiento con ponderación
          const rnd = Math.random();
          let tipoMovimientoElegido = 'efectivo';
          let acumulado = 0;
          
          for (const tm of tiposMovimiento) {
            acumulado += tm.probabilidad;
            if (rnd <= acumulado) {
              tipoMovimientoElegido = tm.tipo;
              break;
            }
          }
          
          // Crear el gasto
          await prisma.gasto.create({
            data: {
              concepto: concepto,
              monto: monto,
              fecha: randomDate(periodo.inicioPeriodo, periodo.finPeriodo),
              categoria: cat.descripcion,
              tipoTransaccion: 'gasto',
              tipoMovimiento: tipoMovimientoElegido,
              categoriaRel: {
                connect: {
                  id: categoriaId
                }
              },
              user: {
                connect: {
                  id: usuarioPrincipal.id
                }
              }
            }
          });
        }
      }
      console.log(`✓ Gastos individuales creados para ${usuarioPrincipal.name}`);
      
      // GASTOS INDIVIDUALES PARA USUARIO SECUNDARIO (menos categorías y transacciones)
      for (const cat of CATEGORIAS.filter(c => ['Vivienda', 'Alimentación', 'Transporte', 'Servicios', 'Entretenimiento', 'Salud'].includes(c.descripcion))) {
        const categoriaId = categoriasMap[cat.descripcion];
        if (!categoriaId) continue;
        
        const numTransacciones = randomInRange(1, 5);
        const presupuestoBase = ingresoBaseAna * cat.porcentajeGasto;
        
        for (let i = 0; i < numTransacciones; i++) {
          let porcentajeGasto = (1 / numTransacciones) * (0.8 + Math.random() * 0.4);
          let monto = Math.round(presupuestoBase * porcentajeGasto);
          
          if (monto < 5) monto = randomInRange(5, 20);
          
          const conceptosDisponibles = CONCEPTOS_POR_CATEGORIA[cat.descripcion] || [`Gasto de ${cat.descripcion}`];
          const concepto = randomElement(conceptosDisponibles);
          
          const tipoMovimientoElegido = randomElement(['efectivo', 'tarjeta', 'transferencia']);
          
          await prisma.gasto.create({
            data: {
              concepto: concepto,
              monto: monto,
              fecha: randomDate(periodo.inicioPeriodo, periodo.finPeriodo),
              categoria: cat.descripcion,
              tipoTransaccion: 'gasto',
              tipoMovimiento: tipoMovimientoElegido,
              categoriaRel: {
                connect: {
                  id: categoriaId
                }
              },
              user: {
                connect: {
                  id: usuarioSecundario.id
                }
              }
            }
          });
        }
      }
      console.log(`✓ Gastos individuales creados para ${usuarioSecundario.name}`);
      
      // GASTOS COMPARTIDOS EN EL GRUPO
      // Algunas categorías que son comunes para compartir
      const categoriasCompartidas = ['Alimentación', 'Entretenimiento', 'Viajes', 'Restaurantes', 'Servicios'];
      
      for (const catNombre of categoriasCompartidas) {
        const categoriaId = categoriasMap[catNombre];
        if (!categoriaId) continue;
        
        // 0-3 gastos compartidos por categoría y mes
        const numGastosCompartidos = randomInRange(0, 3);
        
        for (let i = 0; i < numGastosCompartidos; i++) {
          const monto = randomInRange(30, 200); // Montos mayores para gastos compartidos
          const conceptosDisponibles = CONCEPTOS_POR_CATEGORIA[catNombre] || [`Gasto compartido de ${catNombre}`];
          const concepto = randomElement(conceptosDisponibles);
          
          // Alternar entre ambos usuarios como pagadores
          const usuarioPagador = (i % 2 === 0) ? usuarioPrincipal : usuarioSecundario;
          
          await prisma.gasto.create({
            data: {
              concepto: concepto,
              monto: monto,
              fecha: randomDate(periodo.inicioPeriodo, periodo.finPeriodo),
              categoria: catNombre,
              tipoTransaccion: 'gasto',
              tipoMovimiento: randomElement(['tarjeta', 'efectivo']),
              categoriaRel: {
                connect: {
                  id: categoriaId
                }
              },
              user: {
                connect: {
                  id: usuarioPagador.id
                }
              },
              grupo: {
                connect: {
                  id: grupo.id
                }
              }
            }
          });
        }
      }
      console.log(`✓ Gastos compartidos creados para el grupo`);
      
      // EVENTOS ESPECIALES (1 cada 2 meses aproximadamente)
      if (Math.random() < 0.5) {
        const eventoAleatorio = randomElement(EVENTOS_ESPECIALES);
        const categoriaId = categoriasMap[eventoAleatorio.categoria];
        
        if (!categoriaId) continue;
        
        // Usuario aleatorio para el evento
        const usuarioEvento = Math.random() < 0.7 ? usuarioPrincipal : usuarioSecundario;
        
        // Crear el gasto para el evento especial
        const gastoEvento = await prisma.gasto.create({
          data: {
            concepto: eventoAleatorio.concepto,
            monto: eventoAleatorio.monto,
            fecha: randomDate(periodo.inicioPeriodo, periodo.finPeriodo),
            categoria: eventoAleatorio.categoria,
            tipoTransaccion: 'gasto',
            tipoMovimiento: 'tarjeta', // Eventos grandes suelen ser con tarjeta
            categoriaRel: {
              connect: {
                id: categoriaId
              }
            },
            user: {
              connect: {
                id: usuarioEvento.id
              }
            }
          }
        });
        
        console.log(`✓ Evento especial creado: ${eventoAleatorio.concepto} - $${eventoAleatorio.monto}`);
        
        // Si el evento está financiado, crear la financiación
        if (eventoAleatorio.financiado) {
          const fechaPrimerPago = new Date(gastoEvento.fecha);
          fechaPrimerPago.setMonth(fechaPrimerPago.getMonth() + 1);
          
          const fechaProximoPago = new Date(fechaPrimerPago);
          fechaProximoPago.setMonth(fechaProximoPago.getMonth() + 1);
          
          await prisma.financiacion.create({
            data: {
              cantidadCuotas: eventoAleatorio.cuotas,
              cuotasPagadas: 0,
              cuotasRestantes: eventoAleatorio.cuotas,
              montoCuota: Math.round((eventoAleatorio.monto / eventoAleatorio.cuotas) * 100) / 100,
              fechaPrimerPago: fechaPrimerPago,
              fechaProximoPago: fechaProximoPago,
              diaPago: fechaPrimerPago.getDate(),
              gasto: {
                connect: {
                  id: gastoEvento.id
                }
              },
              user: {
                connect: {
                  id: usuarioEvento.id
                }
              }
            }
          });
          
          contadorFinanciaciones++;
          console.log(`✓ Financiación creada para ${eventoAleatorio.concepto} (${eventoAleatorio.cuotas} cuotas)`);
        }
      }
    }
    
    console.log('\n=== RESUMEN DE DATOS GENERADOS ===');
    console.log(`Total de financiaciones creadas: ${contadorFinanciaciones}`);
    console.log(`Periodos: ${periodos.map(p => `${p.mes}/${p.año}`).join(', ')}`);
    console.log(`Usuarios: ${usuarioPrincipal.name} y ${usuarioSecundario.name}`);
    console.log(`Grupo compartido: ${grupo.nombre}`);
    
    console.log('\n=== GENERACIÓN DE DATOS COMPLETADA CON ÉXITO ===');
    console.log('El sistema ahora tiene datos completos para probar todas las funcionalidades');
    
  } catch (error) {
    console.error('\n❌ ERROR EN LA GENERACIÓN DE DATOS:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
    console.log('\n=== SCRIPT FINALIZADO ===');
  }
}

// Ejecutar la función principal
generateCompleteTestData(); 