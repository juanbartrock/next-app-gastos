// Script para crear los planes predeterminados en la base de datos
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Comprobar si ya existen planes
    const planesCount = await prisma.plan.count();
    
    if (planesCount === 0) {
      console.log('Creando planes predeterminados...');
      
      // Crear plan gratuito
      const planGratuito = await prisma.plan.create({
        data: {
          nombre: "Gratuito",
          descripcion: "Plan básico con funcionalidades limitadas",
          esPago: false,
        }
      });
      console.log('Plan gratuito creado: ' + JSON.stringify(planGratuito, null, 2));
      
      // Crear plan premium
      const planPremium = await prisma.plan.create({
        data: {
          nombre: "Premium",
          descripcion: "Plan completo con todas las funcionalidades",
          esPago: true,
          precioMensual: 9.99,
        }
      });
      console.log('Plan premium creado: ' + JSON.stringify(planPremium, null, 2));
      
      console.log('Planes predeterminados creados correctamente');
    } else {
      console.log(`Ya existen ${planesCount} planes en la base de datos. No se crearon nuevos planes.`);
      
      // Mostrar los planes existentes
      const planes = await prisma.plan.findMany();
      console.log('Planes existentes: ' + JSON.stringify(planes, null, 2));
    }
  } catch (error) {
    console.error('Error al crear los planes predeterminados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 