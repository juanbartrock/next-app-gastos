const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function ajustarPlanesProductizacion() {
  console.log('🚀 Iniciando ajuste de planes para productización...')

  try {
    // 1. ELIMINAR PLANES OBSOLETOS Y CREAR LOS 3 PLANES TARGET
    console.log('\n📋 Paso 1: Configurando 3 planes de suscripción...')

    // Primero, migrar todos los usuarios existentes a un plan temporal Premium
    const usuariosExistentes = await prisma.user.findMany({ where: { planId: { not: null } } })
    
    // Crear o encontrar plan Premium primero para migración
    let planPremium = await prisma.plan.findFirst({ where: { nombre: 'Premium' } })
    
    if (!planPremium) {
      planPremium = await prisma.plan.create({
        data: {
          nombre: 'Premium',
          descripcion: 'Plan completo con todas las funcionalidades',
          esPago: true,
          precioMensual: 9.99,
          activo: true,
          colorHex: '#10B981',
          features: JSON.stringify([
            'Transacciones ilimitadas',
            'Alertas ilimitadas',
            'Usuarios ilimitados por grupo',
            'IA completa (análisis ilimitados)',
            'Gastos recurrentes + automatizaciones',
            'Categorías personalizadas ilimitadas',
            'Dashboard Premium + Analytics',
            'Soporte prioritario'
          ]),
          limitaciones: {
            transacciones_mensuales: -1,
            alertas_activas: -1,
            usuarios_por_grupo: -1,
            ai_analisis: -1,
            gastos_recurrentes: true,
            exportaciones_mensuales: -1,
            categorias_personalizadas: -1,
            dashboard_avanzado: true,
            soporte_prioritario: true
          },
          ordenDisplay: 3,
          trialDias: 30
        }
      })
    }

    // Migrar usuarios a Premium para preservar datos
    if (usuariosExistentes.length > 0) {
      await prisma.user.updateMany({
        data: { planId: planPremium.id }
      })
      console.log(`✅ ${usuariosExistentes.length} usuarios migrados a Premium temporal`)
    }

    // Eliminar planes obsoletos (que no sean los 3 target)
    await prisma.plan.deleteMany({
      where: {
        nombre: { notIn: ['Básico', 'Profesional', 'Premium'] }
      }
    })

    // Crear o actualizar Plan Básico
    let planBasico = await prisma.plan.findFirst({ where: { nombre: 'Básico' } })
    
    if (planBasico) {
      planBasico = await prisma.plan.update({
        where: { id: planBasico.id },
        data: {
          descripcion: 'Plan gratuito con funcionalidades básicas',
          esPago: false,
          precioMensual: 0,
          activo: true,
          colorHex: '#9CA3AF',
          features: JSON.stringify([
            '50 transacciones por mes',
            '5 alertas activas',
            '3 usuarios por grupo',
            'Dashboard básico',
            'Categorías genéricas'
          ]),
          limitaciones: {
            transacciones_mensuales: 50,
            alertas_activas: 5,
            usuarios_por_grupo: 3,
            ai_analisis: 0,
            gastos_recurrentes: false,
            exportaciones_mensuales: 1,
            categorias_personalizadas: 0,
            dashboard_avanzado: false
          },
          ordenDisplay: 1,
          trialDias: 0
        }
      })
    } else {
      planBasico = await prisma.plan.create({
        data: {
          nombre: 'Básico',
          descripcion: 'Plan gratuito con funcionalidades básicas',
          esPago: false,
          precioMensual: 0,
          activo: true,
          colorHex: '#9CA3AF',
          features: JSON.stringify([
            '50 transacciones por mes',
            '5 alertas activas',
            '3 usuarios por grupo',
            'Dashboard básico',
            'Categorías genéricas'
          ]),
          limitaciones: {
            transacciones_mensuales: 50,
            alertas_activas: 5,
            usuarios_por_grupo: 3,
            ai_analisis: 0,
            gastos_recurrentes: false,
            exportaciones_mensuales: 1,
            categorias_personalizadas: 0,
            dashboard_avanzado: false
          },
          ordenDisplay: 1,
          trialDias: 0
        }
      })
    }

    // Crear o actualizar Plan Profesional
    let planProfesional = await prisma.plan.findFirst({ where: { nombre: 'Profesional' } })
    
    if (planProfesional) {
      planProfesional = await prisma.plan.update({
        where: { id: planProfesional.id },
        data: {
          descripcion: 'Plan intermedio para usuarios activos',
          esPago: true,
          precioMensual: 4.99,
          activo: true,
          colorHex: '#3B82F6',
          features: JSON.stringify([
            '500 transacciones por mes',
            '25 alertas activas',
            '10 usuarios por grupo',
            'IA básica (1 análisis/semana)',
            'Gastos recurrentes completo',
            '15 categorías personalizadas',
            'Dashboard avanzado'
          ]),
          limitaciones: {
            transacciones_mensuales: 500,
            alertas_activas: 25,
            usuarios_por_grupo: 10,
            ai_analisis: 4,
            gastos_recurrentes: true,
            exportaciones_mensuales: 10,
            categorias_personalizadas: 15,
            dashboard_avanzado: true
          },
          ordenDisplay: 2,
          trialDias: 14
        }
      })
    } else {
      planProfesional = await prisma.plan.create({
        data: {
          nombre: 'Profesional',
          descripcion: 'Plan intermedio para usuarios activos',
          esPago: true,
          precioMensual: 4.99,
          activo: true,
          colorHex: '#3B82F6',
          features: JSON.stringify([
            '500 transacciones por mes',
            '25 alertas activas',
            '10 usuarios por grupo',
            'IA básica (1 análisis/semana)',
            'Gastos recurrentes completo',
            '15 categorías personalizadas',
            'Dashboard avanzado'
          ]),
          limitaciones: {
            transacciones_mensuales: 500,
            alertas_activas: 25,
            usuarios_por_grupo: 10,
            ai_analisis: 4,
            gastos_recurrentes: true,
            exportaciones_mensuales: 10,
            categorias_personalizadas: 15,
            dashboard_avanzado: true
          },
          ordenDisplay: 2,
          trialDias: 14
        }
      })
    }

    // Actualizar Plan Premium (ya existe)
    planPremium = await prisma.plan.update({
      where: { id: planPremium.id },
      data: {
        descripcion: 'Plan completo con todas las funcionalidades',
        esPago: true,
        precioMensual: 9.99,
        activo: true,
        colorHex: '#10B981',
        features: JSON.stringify([
          'Transacciones ilimitadas',
          'Alertas ilimitadas',
          'Usuarios ilimitados por grupo',
          'IA completa (análisis ilimitados)',
          'Gastos recurrentes + automatizaciones',
          'Categorías personalizadas ilimitadas',
          'Dashboard Premium + Analytics',
          'Soporte prioritario'
        ]),
        limitaciones: {
          transacciones_mensuales: -1,
          alertas_activas: -1,
          usuarios_por_grupo: -1,
          ai_analisis: -1,
          gastos_recurrentes: true,
          exportaciones_mensuales: -1,
          categorias_personalizadas: -1,
          dashboard_avanzado: true,
          soporte_prioritario: true
        },
        ordenDisplay: 3,
        trialDias: 30
      }
    })

    console.log('✅ Planes configurados:')
    console.log(`   Básico: ${planBasico.id}`)
    console.log(`   Profesional: ${planProfesional.id}`)
    console.log(`   Premium: ${planPremium.id}`)

    // 2. ESTADÍSTICAS FINALES
    console.log('\n📊 Paso 2: Estadísticas finales...')

    const [totalUsuarios, stats] = await Promise.all([
      prisma.user.count(),
      Promise.all([
        prisma.user.count({ where: { planId: planBasico.id } }),
        prisma.user.count({ where: { planId: planProfesional.id } }),
        prisma.user.count({ where: { planId: planPremium.id } })
      ])
    ])

    console.log(`📈 Total de usuarios: ${totalUsuarios}`)
    console.log(`   Plan Básico: ${stats[0]} usuarios`)
    console.log(`   Plan Profesional: ${stats[1]} usuarios`)
    console.log(`   Plan Premium: ${stats[2]} usuarios`)

    console.log('\n🎉 ¡Ajuste de planes completado!')
    console.log('📝 Sistema de 3 planes listo para productización')
    console.log('\n🎯 PRÓXIMOS PASOS:')
    console.log('1. Implementar middleware de validación de límites')
    console.log('2. Crear UI de administración de planes')
    console.log('3. Configurar sistema de billing')

  } catch (error) {
    console.error('❌ Error durante el ajuste:', error)
    throw error
  }
}

// Ejecutar ajuste
ajustarPlanesProductizacion()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  }) 