const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
  { nombre: 'Otro', descripcion: 'Otros tipos de inversión', icono: 'more-horizontal' },
];

// Función principal para crear los tipos de inversión
async function crearTiposInversion() {
  console.log('CREANDO TIPOS DE INVERSIÓN PREDEFINIDOS...');
  console.log('==============================================');

  try {
    for (const tipo of tiposInversion) {
      try {
        // Crear el tipo de inversión
        const created = await prisma.tipoInversion.create({
          data: {
            nombre: tipo.nombre,
            descripcion: tipo.descripcion,
            icono: tipo.icono,
            userId: null // Tipos predefinidos del sistema (no asociados a ningún usuario)
          }
        });
        console.log(`✅ Tipo de inversión creado: ${tipo.nombre} (ID: ${created.id})`);
      } catch (itemError) {
        console.error(`❌ Error al crear tipo de inversión ${tipo.nombre}:`, itemError);
      }
    }

    console.log('==============================================');
    console.log('✅ TIPOS DE INVERSIÓN CREADOS CORRECTAMENTE');
  } catch (error) {
    console.error('❌ ERROR AL CREAR TIPOS DE INVERSIÓN:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
crearTiposInversion()
  .then(() => console.log('Proceso completado.'))
  .catch(error => console.error('Error en el proceso:', error)); 