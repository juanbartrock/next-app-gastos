const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * SCRIPT PARA AÑADIR SERVICIOS CONTRATADOS DE PRUEBA
 * 
 * Este script añade servicios contratados según el modelo definido en el esquema
 * NO elimina ni modifica ningún dato existente
 */

async function generarServicios() {
  console.log('=== AÑADIENDO SERVICIOS CONTRATADOS ===');
  
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
    
    // Servicios de streaming
    const serviciosStreaming = [
      { 
        nombre: 'Netflix', 
        descripcion: 'Plan Estándar con anuncios',
        monto: 3490, 
        medioPago: 'Tarjeta de crédito', 
        tarjeta: 'Visa',
        fechaCobro: new Date(2024, 2, 15) 
      },
      { 
        nombre: 'Disney+', 
        descripcion: 'Plan Combo+ (incluye Star+)',
        monto: 2900, 
        medioPago: 'Débito automático',
        fechaCobro: new Date(2024, 2, 5) 
      },
      { 
        nombre: 'Amazon Prime Video', 
        descripcion: 'Plan mensual con beneficios de envío',
        monto: 1390, 
        medioPago: 'Tarjeta de crédito', 
        tarjeta: 'Mastercard',
        fechaCobro: new Date(2024, 2, 10) 
      },
      { 
        nombre: 'HBO Max', 
        descripcion: 'Plan básico',
        monto: 2290, 
        medioPago: 'Tarjeta de crédito', 
        tarjeta: 'Visa',
        fechaCobro: new Date(2024, 2, 22) 
      }
    ];
    
    // Servicios de productividad/suscripciones
    const serviciosProductividad = [
      { 
        nombre: 'ChatGPT Plus', 
        descripcion: 'Servicio premium de IA',
        monto: 8000, 
        medioPago: 'Tarjeta de crédito', 
        tarjeta: 'Visa',
        fechaCobro: new Date(2024, 2, 20) 
      },
      { 
        nombre: 'Cursor Pro', 
        descripcion: 'IDE con IA integrada',
        monto: 6800, 
        medioPago: 'Tarjeta de crédito', 
        tarjeta: 'Visa',
        fechaCobro: new Date(2024, 2, 25) 
      },
      { 
        nombre: 'Microsoft 365', 
        descripcion: 'Suscripción familiar',
        monto: 2360, 
        medioPago: 'Tarjeta de crédito', 
        tarjeta: 'Mastercard',
        fechaCobro: new Date(2024, 2, 8) 
      }
    ];
    
    // Servicios de música
    const serviciosMusica = [
      { 
        nombre: 'Spotify Premium', 
        descripcion: 'Plan individual',
        monto: 1590, 
        medioPago: 'Débito automático',
        fechaCobro: new Date(2024, 2, 28) 
      },
      { 
        nombre: 'Apple Music', 
        descripcion: 'Plan familiar',
        monto: 1790, 
        medioPago: 'Tarjeta de crédito', 
        tarjeta: 'Visa',
        fechaCobro: new Date(2024, 2, 3) 
      }
    ];
    
    // Servicios básicos
    const serviciosBasicos = [
      { 
        nombre: 'Internet', 
        descripcion: 'Fibra óptica 300 Mbps',
        monto: 18500, 
        medioPago: 'Débito automático',
        fechaCobro: new Date(2024, 2, 10) 
      },
      { 
        nombre: 'Telefonía móvil', 
        descripcion: 'Plan con datos ilimitados',
        monto: 12800, 
        medioPago: 'Débito automático',
        fechaCobro: new Date(2024, 2, 5) 
      },
      { 
        nombre: 'Televisión por cable', 
        descripcion: 'Plan con canales HD',
        monto: 9500, 
        medioPago: 'Débito automático',
        fechaCobro: new Date(2024, 2, 15) 
      }
    ];
    
    // Combinar todos los servicios
    const todosServicios = [
      ...serviciosStreaming,
      ...serviciosProductividad,
      ...serviciosMusica,
      ...serviciosBasicos
    ];
    
    // Insertar servicios en la base de datos
    let serviciosCreados = 0;
    for (const servicio of todosServicios) {
      try {
        await prisma.servicio.create({
          data: {
            nombre: servicio.nombre,
            descripcion: servicio.descripcion,
            monto: servicio.monto,
            medioPago: servicio.medioPago,
            tarjeta: servicio.tarjeta || null,
            fechaCobro: servicio.fechaCobro,
            userId: usuario.id
          }
        });
        console.log(`✅ Servicio añadido: ${servicio.nombre}`);
        serviciosCreados++;
      } catch (error) {
        console.error(`❌ Error al añadir servicio ${servicio.nombre}:`, error);
      }
    }
    
    console.log(`✅ Se han añadido ${serviciosCreados} servicios contratados`);
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
generarServicios()
  .then(() => {
    console.log('✅ Proceso completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en el proceso:', error);
    process.exit(1);
  }); 