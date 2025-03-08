const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * SCRIPT PARA AÑADIR PRESUPUESTOS
 * 
 * Este script añade presupuestos mensuales para categorías y grupos
 * NO elimina ni modifica ningún dato existente
 */

async function generarPresupuestos() {
  console.log('=== AÑADIENDO PRESUPUESTOS MENSUALES ===');
  
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
    
    // Verificar categorías principales
    const categoriasPrincipales = [
      'Alimentación', 'Transporte', 'Vivienda', 'Servicios', 
      'Ocio', 'Restaurantes', 'Salud', 'Ropa'
    ];
    const categoriasMap = {};
    
    for (const nombreCategoria of categoriasPrincipales) {
      let categoria = await prisma.categoria.findFirst({
        where: { descripcion: nombreCategoria }
      });
      
      if (!categoria) {
        // No crear categorías si no existen, solo reportar
        console.log(`⚠️ Categoría ${nombreCategoria} no encontrada, saltando...`);
        continue;
      } else {
        console.log(`✓ Categoría existente: ${categoria.descripcion}`);
        categoriasMap[nombreCategoria] = categoria.id;
      }
    }
    
    // Buscar o crear grupo principal para el usuario
    let grupoPrincipal = await prisma.grupo.findFirst({
      where: {
        adminId: usuario.id
      }
    });
    
    if (!grupoPrincipal) {
      grupoPrincipal = await prisma.grupo.create({
        data: {
          nombre: 'Personal',
          descripcion: 'Mi grupo personal de gastos',
          admin: {
            connect: { id: usuario.id }
          }
        }
      });
      console.log(`✓ Grupo personal creado: ${grupoPrincipal.nombre}`);
      
      // Crear relación GrupoMiembro para el administrador
      await prisma.grupoMiembro.create({
        data: {
          rol: 'admin',
          grupo: {
            connect: { id: grupoPrincipal.id }
          },
          user: {
            connect: { id: usuario.id }
          }
        }
      });
      console.log(`✓ Usuario añadido como administrador del grupo`);
    } else {
      console.log(`✓ Grupo existente: ${grupoPrincipal.nombre}`);
    }
    
    // Definir montos de presupuestos por categoría
    const presupuestosPorCategoria = {
      'Alimentación': { min: 400, max: 500 },
      'Transporte': { min: 150, max: 200 },
      'Vivienda': { min: 800, max: 1000 },
      'Servicios': { min: 200, max: 300 },
      'Ocio': { min: 150, max: 250 },
      'Restaurantes': { min: 200, max: 250 },
      'Salud': { min: 100, max: 150 },
      'Ropa': { min: 150, max: 200 }
    };
    
    // Generar presupuesto para el mes actual
    const mesActual = new Date();
    const primerDiaMes = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1);
    const ultimoDiaMes = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0);
    
    let contadorPresupuestos = 0;
    
    // Crear presupuestos por categoría
    for (const [nombreCategoria, rango] of Object.entries(presupuestosPorCategoria)) {
      if (!categoriasMap[nombreCategoria]) continue;
      
      const monto = Math.round((Math.random() * (rango.max - rango.min) + rango.min) * 100) / 100;
      
      console.log(`Creando presupuesto para ${nombreCategoria}: ${monto}€`);
      
      await prisma.presupuesto.create({
        data: {
          monto: monto,
          fechaInicio: primerDiaMes,
          fechaFin: ultimoDiaMes,
          categoria: {
            connect: { id: categoriasMap[nombreCategoria] }
          },
          user: {
            connect: { id: usuario.id }
          }
        }
      });
      
      contadorPresupuestos++;
    }
    
    // Presupuesto para el grupo principal
    console.log(`Creando presupuesto para grupo: ${grupoPrincipal.nombre}`);
    
    await prisma.presupuesto.create({
      data: {
        monto: 1000,
        fechaInicio: primerDiaMes,
        fechaFin: ultimoDiaMes,
        grupo: {
          connect: { id: grupoPrincipal.id }
        },
        user: {
          connect: { id: usuario.id }
        }
      }
    });
    contadorPresupuestos++;
    
    // Presupuesto para mes siguiente (próximo mes)
    const mesSiguiente = new Date();
    mesSiguiente.setMonth(mesSiguiente.getMonth() + 1);
    const primerDiaMesSiguiente = new Date(mesSiguiente.getFullYear(), mesSiguiente.getMonth(), 1);
    const ultimoDiaMesSiguiente = new Date(mesSiguiente.getFullYear(), mesSiguiente.getMonth() + 1, 0);
    
    // Solo para algunas categorías principales
    const categoriasPrioritarias = ['Alimentación', 'Transporte', 'Vivienda'];
    
    for (const nombreCategoria of categoriasPrioritarias) {
      if (!categoriasMap[nombreCategoria]) continue;
      
      const rango = presupuestosPorCategoria[nombreCategoria];
      const monto = Math.round((Math.random() * (rango.max - rango.min) + rango.min) * 100) / 100;
      
      console.log(`Creando presupuesto futuro para ${nombreCategoria}: ${monto}€`);
      
      await prisma.presupuesto.create({
        data: {
          monto: monto,
          fechaInicio: primerDiaMesSiguiente,
          fechaFin: ultimoDiaMesSiguiente,
          categoria: {
            connect: { id: categoriasMap[nombreCategoria] }
          },
          user: {
            connect: { id: usuario.id }
          }
        }
      });
      
      contadorPresupuestos++;
    }
    
    // Resumen final
    console.log('\n===== RESUMEN =====');
    console.log(`✅ Se han añadido ${contadorPresupuestos} presupuestos a la base de datos`);
    console.log('⭐ Todos los presupuestos se añadieron correctamente');
    
  } catch (error) {
    console.error('\n❌ ERROR AL AÑADIR PRESUPUESTOS:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
    console.log('\n=== SCRIPT FINALIZADO ===');
  }
}

// Ejecutar inmediatamente
generarPresupuestos(); 