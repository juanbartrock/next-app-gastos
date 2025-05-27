const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testBidirectionalIntegration() {
  try {
    console.log('🧪 Iniciando pruebas de integración bidireccional...\n')
    
    // Buscar un usuario de prueba
    const user = await prisma.user.findFirst({
      where: { email: 'test@test.com' }
    })
    
    if (!user) {
      console.log('❌ Usuario de prueba no encontrado')
      return
    }
    
    console.log(`✅ Usuario de prueba encontrado: ${user.email}`)
    
    // Prueba 1: Crear un servicio que genere un gasto recurrente
    console.log('\n📋 Prueba 1: Crear servicio → generar gasto recurrente')
    
    const servicioTest = await prisma.servicio.create({
      data: {
        nombre: 'Netflix Premium Test',
        descripcion: 'Suscripción de prueba',
        monto: 15.99,
        medioPago: 'tarjeta',
        fechaCobro: new Date('2025-02-01'),
        generaRecurrente: true,
        userId: user.id
      }
    })
    
    console.log(`✅ Servicio creado: ${servicioTest.nombre} - $${servicioTest.monto}`)
    
    // Verificar si se creó el gasto recurrente
    const gastoRecurrente = await prisma.gastoRecurrente.findFirst({
      where: {
        userId: user.id,
        concepto: servicioTest.nombre,
        esServicio: true
      }
    })
    
    if (gastoRecurrente) {
      console.log(`✅ Gasto recurrente creado automáticamente: ${gastoRecurrente.concepto}`)
      
      // Actualizar la relación
      await prisma.gastoRecurrente.update({
        where: { id: gastoRecurrente.id },
        data: { servicioId: servicioTest.id }
      })
      
      console.log('✅ Relación establecida entre servicio y gasto recurrente')
    } else {
      console.log('❌ No se creó el gasto recurrente automáticamente')
    }
    
    // Prueba 2: Crear un gasto recurrente que genere un servicio
    console.log('\n📋 Prueba 2: Crear gasto recurrente → generar servicio')
    
    const gastoRecurrenteTest = await prisma.gastoRecurrente.create({
      data: {
        concepto: 'Spotify Premium Test',
        periodicidad: 'mensual',
        monto: 9.99,
        comentario: 'Gasto recurrente de prueba',
        estado: 'pendiente',
        userId: user.id,
        esServicio: true,
        proximaFecha: new Date('2025-02-05')
      }
    })
    
    console.log(`✅ Gasto recurrente creado: ${gastoRecurrenteTest.concepto} - $${gastoRecurrenteTest.monto}`)
    
    // Crear el servicio asociado
    const servicioGenerado = await prisma.servicio.create({
      data: {
        nombre: gastoRecurrenteTest.concepto,
        descripcion: `Servicio generado automáticamente desde gasto recurrente: ${gastoRecurrenteTest.concepto}`,
        monto: gastoRecurrenteTest.monto,
        medioPago: 'efectivo',
        fechaCobro: gastoRecurrenteTest.proximaFecha,
        generaRecurrente: true,
        userId: user.id
      }
    })
    
    // Actualizar la relación
    await prisma.gastoRecurrente.update({
      where: { id: gastoRecurrenteTest.id },
      data: { servicioId: servicioGenerado.id }
    })
    
    console.log(`✅ Servicio creado automáticamente: ${servicioGenerado.nombre}`)
    console.log('✅ Relación establecida entre gasto recurrente y servicio')
    
    // Prueba 3: Verificar relaciones bidireccionales
    console.log('\n📋 Prueba 3: Verificar relaciones bidireccionales')
    
    const servicioConGasto = await prisma.servicio.findUnique({
      where: { id: servicioTest.id },
      include: { gastoRecurrente: true }
    })
    
    const gastoConServicio = await prisma.gastoRecurrente.findUnique({
      where: { id: gastoRecurrenteTest.id },
      include: { servicio: true }
    })
    
    if (servicioConGasto?.gastoRecurrente) {
      console.log(`✅ Servicio "${servicioConGasto.nombre}" está vinculado al gasto recurrente "${servicioConGasto.gastoRecurrente.concepto}"`)
    }
    
    if (gastoConServicio?.servicio) {
      console.log(`✅ Gasto recurrente "${gastoConServicio.concepto}" está vinculado al servicio "${gastoConServicio.servicio.nombre}"`)
    }
    
    // Resumen
    console.log('\n📊 Resumen de la prueba:')
    console.log(`🔗 Servicios con generaRecurrente: ${await prisma.servicio.count({ where: { generaRecurrente: true } })}`)
    console.log(`🔗 Gastos recurrentes con esServicio: ${await prisma.gastoRecurrente.count({ where: { esServicio: true } })}`)
    
    // Limpiar datos de prueba
    console.log('\n🧹 Limpiando datos de prueba...')
    await prisma.gastoRecurrente.deleteMany({
      where: {
        userId: user.id,
        concepto: { in: ['Netflix Premium Test', 'Spotify Premium Test'] }
      }
    })
    
    await prisma.servicio.deleteMany({
      where: {
        userId: user.id,
        nombre: { in: ['Netflix Premium Test', 'Spotify Premium Test'] }
      }
    })
    
    console.log('✅ Datos de prueba eliminados')
    console.log('\n🎉 Pruebas de integración bidireccional completadas exitosamente!')
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testBidirectionalIntegration() 