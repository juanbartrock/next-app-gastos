// Script para crear las funcionalidades predeterminadas en la base de datos
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Lista de funcionalidades que ofrece la aplicación
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
  },
  {
    nombre: "Asesor Financiero",
    descripcion: "Recibe consejos personalizados para mejorar tus finanzas",
    slug: "asesor-financiero",
    icono: "Lightbulb",
  },
  {
    nombre: "Recomendaciones de Ahorro",
    descripcion: "Obtén sugerencias para reducir gastos y ahorrar dinero",
    slug: "recomendaciones-ahorro",
    icono: "Scissors",
  },
  {
    nombre: "Seguimiento de Precios",
    descripcion: "Monitorea precios de productos que te interesan",
    slug: "seguimiento-precios",
    icono: "LineChart",
  },
  {
    nombre: "Asistente por Voz",
    descripcion: "Interactúa con la aplicación usando comandos de voz",
    slug: "asistente-voz",
    icono: "Mic",
  },
];

// Mapeo de funcionalidades por plan
const PLAN_GRATUITO_FUNCIONALIDADES = [
  "seguimiento-gastos",
  "presupuestos",
  "gastos-recurrentes"
];

const PLAN_PREMIUM_FUNCIONALIDADES = [
  "seguimiento-gastos",
  "presupuestos",
  "gastos-recurrentes",
  "financiacion",
  "grupos",
  "informes",
  "inversiones",
  "asesor-financiero",
  "recomendaciones-ahorro",
  "seguimiento-precios",
  "asistente-voz"
];

async function main() {
  try {
    // 1. Crear las funcionalidades si no existen
    console.log('Verificando funcionalidades existentes...');
    
    const funcionesExistentes = await prisma.funcionalidad.findMany();
    console.log(`Encontradas ${funcionesExistentes.length} funcionalidades existentes.`);
    
    // Crear las funcionalidades que no existen
    for (const funcionalidad of FUNCIONALIDADES) {
      const existe = funcionesExistentes.some(f => f.slug === funcionalidad.slug);
      
      if (!existe) {
        console.log(`Creando funcionalidad: ${funcionalidad.nombre}`);
        await prisma.funcionalidad.create({
          data: funcionalidad
        });
      } else {
        console.log(`Funcionalidad ya existe: ${funcionalidad.nombre}`);
      }
    }
    
    // 2. Obtener los planes existentes
    const planes = await prisma.plan.findMany();
    console.log(`Encontrados ${planes.length} planes.`);
    
    if (planes.length < 2) {
      console.error('Error: No se encontraron los planes Gratuito y Premium.');
      return;
    }
    
    const planGratuito = planes.find(p => !p.esPago);
    const planPremium = planes.find(p => p.esPago);
    
    if (!planGratuito || !planPremium) {
      console.error('Error: No se encontraron los planes Gratuito y Premium.');
      return;
    }
    
    console.log(`Plan Gratuito ID: ${planGratuito.id}`);
    console.log(`Plan Premium ID: ${planPremium.id}`);
    
    // 3. Obtener todas las funcionalidades
    const funcionalidades = await prisma.funcionalidad.findMany();
    
    // 4. Asignar funcionalidades al plan gratuito
    for (const funcionalidad of funcionalidades) {
      const activar = PLAN_GRATUITO_FUNCIONALIDADES.includes(funcionalidad.slug);
      
      // Verificar si ya existe la relación
      const existeRelacion = await prisma.funcionalidadPlan.findFirst({
        where: {
          planId: planGratuito.id,
          funcionalidadId: funcionalidad.id
        }
      });
      
      if (existeRelacion) {
        // Actualizar si es necesario
        if (existeRelacion.activo !== activar) {
          console.log(`Actualizando funcionalidad ${funcionalidad.nombre} para plan Gratuito: ${activar ? 'Activada' : 'Desactivada'}`);
          await prisma.funcionalidadPlan.update({
            where: { id: existeRelacion.id },
            data: { activo: activar }
          });
        }
      } else {
        // Crear nueva relación
        console.log(`Asignando funcionalidad ${funcionalidad.nombre} a plan Gratuito: ${activar ? 'Activada' : 'Desactivada'}`);
        await prisma.funcionalidadPlan.create({
          data: {
            planId: planGratuito.id,
            funcionalidadId: funcionalidad.id,
            activo: activar
          }
        });
      }
    }
    
    // 5. Asignar funcionalidades al plan premium
    for (const funcionalidad of funcionalidades) {
      const activar = PLAN_PREMIUM_FUNCIONALIDADES.includes(funcionalidad.slug);
      
      // Verificar si ya existe la relación
      const existeRelacion = await prisma.funcionalidadPlan.findFirst({
        where: {
          planId: planPremium.id,
          funcionalidadId: funcionalidad.id
        }
      });
      
      if (existeRelacion) {
        // Actualizar si es necesario
        if (existeRelacion.activo !== activar) {
          console.log(`Actualizando funcionalidad ${funcionalidad.nombre} para plan Premium: ${activar ? 'Activada' : 'Desactivada'}`);
          await prisma.funcionalidadPlan.update({
            where: { id: existeRelacion.id },
            data: { activo: activar }
          });
        }
      } else {
        // Crear nueva relación
        console.log(`Asignando funcionalidad ${funcionalidad.nombre} a plan Premium: ${activar ? 'Activada' : 'Desactivada'}`);
        await prisma.funcionalidadPlan.create({
          data: {
            planId: planPremium.id,
            funcionalidadId: funcionalidad.id,
            activo: activar
          }
        });
      }
    }
    
    console.log('Funcionalidades y asignaciones creadas correctamente.');
  } catch (error) {
    console.error('Error al crear funcionalidades:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 