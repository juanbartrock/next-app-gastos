const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Función para borrar todos los datos de la base de datos
async function resetDatabase() {
  console.log('INICIANDO BORRADO COMPLETO DE LA BASE DE DATOS...');
  console.log('⚠️ ADVERTENCIA: Se borrarán TODOS los datos ⚠️');
  console.log('==============================================');

  try {
    // Borramos datos en el orden correcto para evitar problemas con las restricciones de clave foránea
    console.log('1. Borrando datos de transacciones de inversiones...');
    await prisma.transaccionInversion.deleteMany({});
    
    console.log('2. Borrando datos de cotizaciones de inversiones...');
    await prisma.cotizacionInversion.deleteMany({});
    
    console.log('3. Borrando datos de inversiones...');
    await prisma.inversion.deleteMany({});
    
    console.log('4. Borrando tipos de inversión personalizados...');
    await prisma.tipoInversion.deleteMany({
      where: {
        NOT: {
          userId: null
        }
      }
    });
    
    console.log('5. Borrando tipos de inversión predefinidos...');
    await prisma.tipoInversion.deleteMany({});
    
    console.log('6. Borrando gastos recurrentes...');
    await prisma.gastoRecurrente.deleteMany({});
    
    console.log('7. Borrando financiaciones...');
    await prisma.financiacion.deleteMany({});
    
    console.log('8. Borrando presupuestos...');
    await prisma.presupuesto.deleteMany({});
    
    console.log('9. Borrando servicios alternativos...');
    await prisma.servicioAlternativo.deleteMany({});
    
    console.log('10. Borrando promociones...');
    await prisma.promocion.deleteMany({});
    
    console.log('11. Borrando servicios...');
    await prisma.servicio.deleteMany({});
    
    console.log('12. Borrando gastos...');
    await prisma.gasto.deleteMany({});
    
    console.log('13. Borrando miembros de grupos...');
    await prisma.grupoMiembro.deleteMany({});
    
    console.log('14. Borrando grupos...');
    await prisma.grupo.deleteMany({});
    
    console.log('15. Borrando categorías...');
    await prisma.categoria.deleteMany({});
    
    console.log('16. Borrando tokens de verificación...');
    await prisma.verificationToken.deleteMany({});
    
    console.log('17. Borrando sesiones...');
    await prisma.session.deleteMany({});
    
    console.log('18. Borrando cuentas...');
    await prisma.account.deleteMany({});
    
    console.log('19. Borrando usuarios...');
    await prisma.user.deleteMany({});
    
    console.log('==============================================');
    console.log('✅ BASE DE DATOS COMPLETAMENTE BORRADA');
    console.log('Ahora puedes crear nuevos usuarios y repoblar con datos iniciales.');
  } catch (error) {
    console.error('❌ ERROR AL RESETEAR LA BASE DE DATOS:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
resetDatabase()
  .then(() => console.log('Proceso de reseteo completado.'))
  .catch(error => console.error('Error en el proceso de reseteo:', error)); 