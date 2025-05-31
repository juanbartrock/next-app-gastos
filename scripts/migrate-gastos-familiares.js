const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateGastosFamiliares() {
  try {
    console.log('🚀 Iniciando migración de gastos familiares...')

    // 1. Como incluirEnFamilia es un campo nuevo con default true, 
    // simplemente actualizamos todos los gastos existentes
    const gastosActualizados = await prisma.gasto.updateMany({
      data: {
        incluirEnFamilia: true
      }
    })

    console.log(`✅ Actualizados ${gastosActualizados.count} gastos con incluirEnFamilia = true`)

    // 2. Estadísticas finales
    const totalGastos = await prisma.gasto.count()
    const gastosFamiliares = await prisma.gasto.count({
      where: { incluirEnFamilia: true }
    })
    const gastosPersonales = await prisma.gasto.count({
      where: { incluirEnFamilia: false }
    })

    console.log('\n📊 Estadísticas finales:')
    console.log(`   Total de gastos: ${totalGastos}`)
    console.log(`   Gastos familiares: ${gastosFamiliares}`)
    console.log(`   Gastos personales: ${gastosPersonales}`)

    // 3. Mostrar algunos ejemplos
    const ejemplosGastos = await prisma.gasto.findMany({
      take: 3,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    })

    console.log('\n📋 Ejemplos de gastos migrados:')
    ejemplosGastos.forEach((gasto, index) => {
      console.log(`   ${index + 1}. ${gasto.concepto} - $${gasto.monto} (Usuario: ${gasto.user?.name || gasto.user?.email}) - Familiar: ${gasto.incluirEnFamilia}`)
    })

    console.log('\n🎉 Migración completada exitosamente!')
    console.log('\n💡 Todos los gastos existentes ahora están marcados como familiares por defecto.')
    console.log('   Los usuarios pueden cambiar esto individualmente desde el formulario.')

  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  migrateGastosFamiliares()
    .catch(console.error)
    .finally(() => process.exit())
}

module.exports = { migrateGastosFamiliares } 