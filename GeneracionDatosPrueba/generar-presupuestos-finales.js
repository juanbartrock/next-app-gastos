const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * SCRIPT PARA AÑADIR PRESUPUESTOS
 * 
 * Este script añade presupuestos mensuales siguiendo el modelo correcto
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
    
    // Definir montos de presupuestos por categoría
    const presupuestosPorCategoria = {
      'Alimentación': { min: 400, max: 500, nombre: 'Presupuesto Alimentación' },
      'Transporte': { min: 150, max: 200, nombre: 'Presupuesto Transporte' },
      'Vivienda': { min: 800, max: 1000, nombre: 'Presupuesto Vivienda' },
      'Servicios': { min: 200, max: 300, nombre: 'Presupuesto Servicios' },
      'Ocio': { min: 150, max: 250, nombre: 'Presupuesto Ocio' },
      'Restaurantes': { min: 200, max: 250, nombre: 'Presupuesto Restaurantes' },
      'Salud': { min: 100, max: 150, nombre: 'Presupuesto Salud' },
      'Ropa': { min: 150, max: 200, nombre: 'Presupuesto Ropa' }
    };
    
    // Obtener mes y año actual y siguiente
    const hoy = new Date();
    const mesActual = hoy.getMonth() + 1; // 1-12
    const añoActual = hoy.getFullYear();
    
    // Para siguiente mes
    let mesSiguiente = mesActual + 1;
    let añoSiguiente = añoActual;
    if (mesSiguiente > 12) {
      mesSiguiente = 1;
      añoSiguiente++;
    }
    
    let contadorPresupuestos = 0;
    
    // Crear presupuestos por categoría para el mes actual
    for (const [nombreCategoria, config] of Object.entries(presupuestosPorCategoria)) {
      if (!categoriasMap[nombreCategoria]) continue;
      
      const monto = Math.round((Math.random() * (config.max - config.min) + config.min) * 100) / 100;
      
      console.log(`Creando presupuesto para ${nombreCategoria}: ${monto}€`);
      
      try {
        await prisma.presupuesto.create({
          data: {
            nombre: config.nombre,
            monto: monto,
            mes: mesActual,
            año: añoActual,
            categoria: {
              connect: { id: categoriasMap[nombreCategoria] }
            },
            user: {
              connect: { id: usuario.id }
            }
          }
        });
        contadorPresupuestos++;
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️ Ya existe un presupuesto para ${nombreCategoria} en ${mesActual}/${añoActual}`);
        } else {
          throw error;
        }
      }
    }
    
    // Crear presupuesto sin categoría específica
    try {
      await prisma.presupuesto.create({
        data: {
          nombre: 'Presupuesto General',
          monto: 3000,
          mes: mesActual,
          año: añoActual,
          user: {
            connect: { id: usuario.id }
          }
        }
      });
      contadorPresupuestos++;
      console.log(`Creando presupuesto general: 3000€`);
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`⚠️ Ya existe un presupuesto general en ${mesActual}/${añoActual}`);
      } else {
        throw error;
      }
    }
    
    // Presupuestos para el mes siguiente (solo categorías principales)
    const categoriasPrioritarias = ['Alimentación', 'Transporte', 'Vivienda'];
    
    for (const nombreCategoria of categoriasPrioritarias) {
      if (!categoriasMap[nombreCategoria]) continue;
      
      const config = presupuestosPorCategoria[nombreCategoria];
      const monto = Math.round((Math.random() * (config.max - config.min) + config.min) * 100) / 100;
      
      console.log(`Creando presupuesto futuro para ${nombreCategoria}: ${monto}€`);
      
      try {
        await prisma.presupuesto.create({
          data: {
            nombre: `${config.nombre} (Futuro)`,
            monto: monto,
            mes: mesSiguiente,
            año: añoSiguiente,
            categoria: {
              connect: { id: categoriasMap[nombreCategoria] }
            },
            user: {
              connect: { id: usuario.id }
            }
          }
        });
        contadorPresupuestos++;
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️ Ya existe un presupuesto para ${nombreCategoria} en ${mesSiguiente}/${añoSiguiente}`);
        } else {
          throw error;
        }
      }
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