const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * SCRIPT PARA AÑADIR GASTOS RECURRENTES
 * 
 * Este script añade gastos recurrentes según el modelo definido en el esquema
 * NO elimina ni modifica ningún dato existente
 */

async function generarGastosRecurrentes() {
  console.log('=== AÑADIENDO GASTOS RECURRENTES ===');
  
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
    const categoriasNecesarias = [
      'Servicios', 'Vivienda', 'Salud', 'Transporte', 
      'Educación', 'Entretenimiento', 'Suscripciones'
    ];
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
            grupo_categoria: nombreCategoria === 'Servicios' || nombreCategoria === 'Vivienda' ? 'Gastos Básicos' : 
                             nombreCategoria === 'Entretenimiento' ? 'Entretenimiento' : 
                             nombreCategoria === 'Salud' ? 'Salud y Bienestar' : 
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
    
    // Definir gastos recurrentes a crear con los campos según el modelo
    const gastosRecurrentes = [
      { concepto: 'Netflix', monto: 14.99, periodicidad: 'mensual', comentario: 'Suscripción streaming', categoria: 'Entretenimiento' },
      { concepto: 'Spotify', monto: 9.99, periodicidad: 'mensual', comentario: 'Música en streaming', categoria: 'Entretenimiento' },
      { concepto: 'Internet Fibra', monto: 49.99, periodicidad: 'mensual', comentario: 'Conexión internet hogar', categoria: 'Servicios' },
      { concepto: 'Telefonía Móvil', monto: 29.99, periodicidad: 'mensual', comentario: 'Plan móvil datos', categoria: 'Servicios' },
      { concepto: 'Alquiler', monto: 850.00, periodicidad: 'mensual', comentario: 'Alquiler apartamento', categoria: 'Vivienda' },
      { concepto: 'Seguro Hogar', monto: 120.00, periodicidad: 'trimestral', comentario: 'Seguro de vivienda', categoria: 'Vivienda' },
      { concepto: 'Seguro Médico', monto: 80.00, periodicidad: 'mensual', comentario: 'Seguro de salud privado', categoria: 'Salud' },
      { concepto: 'Gimnasio', monto: 45.00, periodicidad: 'mensual', comentario: 'Suscripción gimnasio', categoria: 'Salud' },
      { concepto: 'Bono Transporte', monto: 40.00, periodicidad: 'mensual', comentario: 'Transporte público', categoria: 'Transporte' },
      { concepto: 'Seguro Coche', monto: 180.00, periodicidad: 'trimestral', comentario: 'Seguro vehículo', categoria: 'Transporte' },
      { concepto: 'Curso Online', monto: 25.00, periodicidad: 'mensual', comentario: 'Plataforma de cursos', categoria: 'Educación' },
      { concepto: 'Amazon Prime', monto: 49.99, periodicidad: 'anual', comentario: 'Suscripción Prime', categoria: 'Suscripciones' },
      { concepto: 'PlayStation Plus', monto: 9.99, periodicidad: 'mensual', comentario: 'Suscripción juegos', categoria: 'Entretenimiento' },
      { concepto: 'Mantenimiento Coche', monto: 120.00, periodicidad: 'semestral', comentario: 'Revisión periódica', categoria: 'Transporte' },
      { concepto: 'Donación ONG', monto: 15.00, periodicidad: 'mensual', comentario: 'Aportación social', categoria: 'Servicios' }
    ];
    
    // Crear gastos recurrentes
    let contadorRecurrentes = 0;
    const proximaFecha = new Date();
    proximaFecha.setDate(proximaFecha.getDate() + 15); // Próximo pago en 15 días
    
    const ultimoPago = new Date();
    ultimoPago.setMonth(ultimoPago.getMonth() - 1); // Último pago hace un mes
    
    for (let i = 0; i < gastosRecurrentes.length; i++) {
      const r = gastosRecurrentes[i];
      
      console.log(`Creando gasto recurrente: ${r.concepto}...`);
      
      // Obtener ID de categoría o establecer a null si no existe
      const categoriaId = categoriasMap[r.categoria] || null;
      
      await prisma.gastoRecurrente.create({
        data: {
          concepto: r.concepto,
          monto: r.monto,
          periodicidad: r.periodicidad,
          comentario: r.comentario,
          estado: 'activo',
          proximaFecha: proximaFecha,
          ultimoPago: ultimoPago,
          user: {
            connect: { id: usuario.id }
          },
          ...(categoriaId && {
            categoria: {
              connect: { id: categoriaId }
            }
          })
        }
      });
      
      contadorRecurrentes++;
      console.log(`✅ Gasto recurrente creado: ${r.concepto} - ${r.periodicidad}`);
    }
    
    // Resumen final
    console.log('\n===== RESUMEN =====');
    console.log(`✅ Se han añadido ${contadorRecurrentes} gastos recurrentes a la base de datos`);
    console.log('⭐ Todos los gastos recurrentes se añadieron correctamente');
    
  } catch (error) {
    console.error('\n❌ ERROR AL AÑADIR GASTOS RECURRENTES:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
    console.log('\n=== SCRIPT FINALIZADO ===');
  }
}

// Ejecutar inmediatamente
generarGastosRecurrentes(); 