const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function actualizarFinanciacionesVisaCiudad() {
  try {
    console.log('🚀 Iniciando actualización de financiaciones...')
    
    // 1. Obtener todas las financiaciones que NO tienen información de tarjeta
    const financiacionesSinTarjeta = await prisma.financiacion.findMany({
      where: {
        tarjetaInfo: null
      },
      include: {
        gasto: {
          select: {
            id: true,
            concepto: true,
            monto: true
          }
        }
      }
    })
    
    console.log(`📊 Encontradas ${financiacionesSinTarjeta.length} financiaciones sin información de tarjeta`)
    
    if (financiacionesSinTarjeta.length === 0) {
      console.log('✅ No hay financiaciones para actualizar')
      return
    }
    
    // 2. Crear registros de FinanciacionTarjeta para cada financiación
    let actualizadas = 0
    
    for (const financiacion of financiacionesSinTarjeta) {
      try {
        await prisma.financiacionTarjeta.create({
          data: {
            financiacionId: financiacion.id,
            tarjetaEspecifica: 'Visa Ciudad'
          }
        })
        
        actualizadas++
        console.log(`✅ Financiación ${financiacion.id} (${financiacion.gasto.concepto}) → Visa Ciudad`)
        
      } catch (error) {
        console.error(`❌ Error al actualizar financiación ${financiacion.id}:`, error.message)
      }
    }
    
    console.log(`\n🎉 Actualización completada:`)
    console.log(`   📈 Total procesadas: ${financiacionesSinTarjeta.length}`)
    console.log(`   ✅ Actualizadas exitosamente: ${actualizadas}`)
    console.log(`   ❌ Errores: ${financiacionesSinTarjeta.length - actualizadas}`)
    
    // 3. Verificar resultado
    const financiacionesConTarjeta = await prisma.financiacion.findMany({
      include: {
        tarjetaInfo: true,
        gasto: {
          select: {
            concepto: true
          }
        }
      }
    })
    
    console.log(`\n📋 Resumen actual:`)
    financiacionesConTarjeta.forEach(f => {
      const tarjeta = f.tarjetaInfo?.tarjetaEspecifica || 'Sin tarjeta'
      console.log(`   - ${f.gasto.concepto}: ${tarjeta}`)
    })
    
  } catch (error) {
    console.error('💥 Error general:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  actualizarFinanciacionesVisaCiudad()
    .then(() => {
      console.log('\n🏁 Script finalizado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error)
      process.exit(1)
    })
}

module.exports = { actualizarFinanciacionesVisaCiudad } 