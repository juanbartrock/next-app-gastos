// Script para sincronizar el esquema Prisma y crear los planes en producción
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

async function main() {
  try {
    console.log('Aplicando cambios del esquema a la base de datos de producción...');
    
    // Aplicar los cambios del esquema a la base de datos
    try {
      // Intentamos primero con db push que es menos invasivo
      execSync('npx prisma db push', { stdio: 'inherit' });
      console.log('Schema aplicado correctamente con db push.');
    } catch (error) {
      console.error('Error al aplicar schema con db push:', error);
      console.log('Intentando con migrate deploy...');
      
      try {
        // Si db push falla, intentamos con migrate deploy
        execSync('npx prisma migrate deploy', { stdio: 'inherit' });
        console.log('Migraciones aplicadas correctamente con migrate deploy.');
      } catch (migrateError) {
        console.error('Error al aplicar migraciones con migrate deploy:', migrateError);
        throw new Error('No se pudo sincronizar el esquema con la base de datos.');
      }
    }
    
    // Inicializar el cliente de Prisma
    const prisma = new PrismaClient();
    
    // Crear planes si no existen
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
      console.log('Plan gratuito creado:', planGratuito);
      
      // Crear plan premium
      const planPremium = await prisma.plan.create({
        data: {
          nombre: "Premium",
          descripcion: "Plan completo con todas las funcionalidades",
          esPago: true,
          precioMensual: 9.99,
        }
      });
      console.log('Plan premium creado:', planPremium);
      
      // Crear funcionalidades
      const FUNCIONALIDADES = [
        {
          nombre: "Seguimiento de Gastos",
          descripcion: "Registra y monitorea todos tus gastos diarios",
          slug: "seguimiento-gastos",
          icono: "Receipt",
        },
        {
          nombre: "Presupuestos",
          descripcion: "Crea y gestiona presupuestos mensuales por categoría",
          slug: "presupuestos",
          icono: "PiggyBank",
        },
        {
          nombre: "Gastos Recurrentes",
          descripcion: "Administra tus gastos fijos mensuales",
          slug: "gastos-recurrentes",
          icono: "Repeat",
        },
        {
          nombre: "Financiación en Cuotas",
          descripcion: "Seguimiento de pagos en cuotas y financiación",
          slug: "financiacion",
          icono: "CreditCard",
        },
        {
          nombre: "Gestión de Grupos",
          descripcion: "Comparte gastos con amigos o familiares",
          slug: "grupos",
          icono: "Users",
        },
        {
          nombre: "Informes Financieros",
          descripcion: "Visualiza informes detallados de tu situación financiera",
          slug: "informes",
          icono: "BarChart",
        },
        {
          nombre: "Seguimiento de Inversiones",
          descripcion: "Administra tu portafolio de inversiones",
          slug: "inversiones",
          icono: "TrendingUp",
        }
      ];
      
      for (const funcionalidad of FUNCIONALIDADES) {
        await prisma.funcionalidad.create({
          data: funcionalidad
        });
      }
      console.log('Funcionalidades creadas correctamente');
      
      // Asignar funcionalidades a planes
      const PLAN_GRATUITO_FUNCIONALIDADES = [
        "seguimiento-gastos",
        "presupuestos",
        "gastos-recurrentes"
      ];
      
      const todasFuncionalidades = await prisma.funcionalidad.findMany();
      
      for (const funcionalidad of todasFuncionalidades) {
        const activarGratuito = PLAN_GRATUITO_FUNCIONALIDADES.includes(funcionalidad.slug);
        
        await prisma.funcionalidadPlan.create({
          data: {
            planId: planGratuito.id,
            funcionalidadId: funcionalidad.id,
            activo: activarGratuito
          }
        });
        
        // Para el plan premium, todas están activas
        await prisma.funcionalidadPlan.create({
          data: {
            planId: planPremium.id,
            funcionalidadId: funcionalidad.id,
            activo: true
          }
        });
      }
      
      console.log('Asignación de funcionalidades completada');
    } else {
      console.log(`Ya existen ${planesCount} planes en la base de datos.`);
      
      // Mostrar los planes existentes
      const planes = await prisma.plan.findMany();
      console.log('Planes existentes:', planes);
    }
    
    // Asignar plan gratuito a usuarios sin plan
    const usuariosSinPlan = await prisma.user.findMany({
      where: {
        planId: null
      }
    });
    
    if (usuariosSinPlan.length > 0) {
      console.log(`Encontrados ${usuariosSinPlan.length} usuarios sin plan asignado.`);
      
      // Buscar el plan gratuito
      const planGratuito = await prisma.plan.findFirst({
        where: { esPago: false }
      });
      
      if (planGratuito) {
        // Actualizar todos los usuarios sin plan
        await prisma.user.updateMany({
          where: {
            planId: null
          },
          data: {
            planId: planGratuito.id
          }
        });
        
        console.log(`Se ha asignado el plan gratuito a ${usuariosSinPlan.length} usuarios.`);
      }
    } else {
      console.log('Todos los usuarios ya tienen un plan asignado.');
    }
    
    console.log('Proceso completado con éxito.');
  } catch (error) {
    console.error('Error durante el proceso:', error);
  }
}

main(); 