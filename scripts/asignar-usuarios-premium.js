const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function asignarUsuariosPremium() {
  try {
    console.log('🚀 Asignando todos los usuarios actuales al plan Premium...')

    // Obtener el plan Premium
    const planPremium = await prisma.plan.findFirst({
      where: { nombre: 'Premium' }
    })

    if (!planPremium) {
      throw new Error('Plan Premium no encontrado. Ejecuta primero init-planes-avanzados.js')
    }

    console.log(`📦 Plan Premium encontrado: ${planPremium.id}`)

    // Obtener todos los usuarios
    const todosLosUsuarios = await prisma.user.findMany({
      select: { 
        id: true, 
        name: true, 
        email: true, 
        planId: true 
      }
    })

    console.log(`👥 Total de usuarios en el sistema: ${todosLosUsuarios.length}`)

    // Filtrar usuarios que no tienen plan Premium
    const usuariosSinPremium = todosLosUsuarios.filter(user => user.planId !== planPremium.id)
    
    console.log(`🔄 Usuarios a actualizar: ${usuariosSinPremium.length}`)

    if (usuariosSinPremium.length === 0) {
      console.log('✅ Todos los usuarios ya tienen plan Premium')
      return
    }

    // Asignar plan Premium a todos los usuarios
    const resultado = await prisma.user.updateMany({
      where: {
        id: {
          in: usuariosSinPremium.map(user => user.id)
        }
      },
      data: {
        planId: planPremium.id
      }
    })

    console.log(`✅ ${resultado.count} usuarios actualizados al plan Premium`)

    // Mostrar resumen final
    const estadisticasFinales = await prisma.user.groupBy({
      by: ['planId'],
      _count: { id: true }
    })

    console.log('\n📊 Distribución final de planes:')
    for (const stat of estadisticasFinales) {
      if (stat.planId) {
        const plan = await prisma.plan.findUnique({
          where: { id: stat.planId },
          select: { nombre: true }
        })
        console.log(`   ${plan?.nombre || 'Desconocido'}: ${stat._count.id} usuarios`)
      } else {
        console.log(`   Sin plan: ${stat._count.id} usuarios`)
      }
    }

    console.log('\n🎉 ¡Todos los usuarios actuales ahora tienen acceso Premium!')
    console.log('   - Funcionalidades ilimitadas')
    console.log('   - IA completa disponible')
    console.log('   - Sin restricciones de uso')

  } catch (error) {
    console.error('❌ Error al asignar usuarios Premium:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

asignarUsuariosPremium()
  .then(() => {
    console.log('\n✨ Proceso completado exitosamente')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Error en el proceso:', error)
    process.exit(1)
  }) 