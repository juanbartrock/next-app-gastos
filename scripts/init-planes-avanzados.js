const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function initPlanesAvanzados() {
  try {
    console.log('🚀 Inicializando planes avanzados del sistema...')

    // Plan Básico (FREE)
    let planBasico = await prisma.plan.findFirst({
      where: { nombre: 'Básico' }
    })
    
    if (!planBasico) {
      planBasico = await prisma.plan.create({
        data: {
          nombre: 'Básico',
          descripcion: 'Plan gratuito con funcionalidades esenciales',
          esPago: false,
          precioMensual: 0
        }
      })
      console.log('✅ Plan Básico creado')
    } else {
      console.log('✅ Plan Básico ya existe')
    }

    // Plan Profesional
    let planProfesional = await prisma.plan.findFirst({
      where: { nombre: 'Profesional' }
    })
    
    if (!planProfesional) {
      planProfesional = await prisma.plan.create({
        data: {
          nombre: 'Profesional',
          descripcion: 'Para familias y usuarios avanzados',
          esPago: true,
          precioMensual: 2999
        }
      })
      console.log('✅ Plan Profesional creado')
    } else {
      console.log('✅ Plan Profesional ya existe')
    }

    // Plan Premium
    let planPremium = await prisma.plan.findFirst({
      where: { nombre: 'Premium' }
    })
    
    if (!planPremium) {
      planPremium = await prisma.plan.create({
        data: {
          nombre: 'Premium',
          descripcion: 'Para empresas y usuarios power',
          esPago: true,
          precioMensual: 5999
        }
      })
      console.log('✅ Plan Premium creado')
    } else {
      console.log('✅ Plan Premium ya existe')
    }

    console.log('✅ Planes inicializados correctamente')

  } catch (error) {
    console.error('❌ Error al inicializar planes:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

initPlanesAvanzados() 