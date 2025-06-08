const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrarCategoriasHibridas() {
  console.log('🚀 Iniciando migración a sistema híbrido de categorías...')

  try {
    // 1. MIGRAR CATEGORÍAS EXISTENTES A GENÉRICAS
    console.log('\n📋 Paso 1: Migrando categorías existentes a genéricas...')
    
    const categoriasExistentes = await prisma.categoria.findMany()
    console.log(`📊 Categorías existentes encontradas: ${categoriasExistentes.length}`)

    if (categoriasExistentes.length > 0) {
      // Actualizar todas las categorías existentes para marcarlas como genéricas
      const resultadoMigracion = await prisma.categoria.updateMany({
        data: {
          esGenerica: true,
          activa: true,
          tipo: "generica"
        }
      })
      
      console.log(`✅ Categorías migradas a genéricas: ${resultadoMigracion.count}`)
    }

    // 2. CREAR CATEGORÍAS GENÉRICAS DEL SISTEMA
    console.log('\n📋 Paso 2: Creando categorías genéricas del sistema...')
    
    const categoriasGenericas = [
      { descripcion: '🍽️ Alimentación', grupo_categoria: 'esenciales', colorHex: '#10B981', icono: '🍽️' },
      { descripcion: '🚗 Transporte', grupo_categoria: 'esenciales', colorHex: '#3B82F6', icono: '🚗' },
      { descripcion: '🏠 Hogar', grupo_categoria: 'esenciales', colorHex: '#F59E0B', icono: '🏠' },
      { descripcion: '💊 Salud', grupo_categoria: 'esenciales', colorHex: '#EF4444', icono: '💊' },
      { descripcion: '🎯 Entretenimiento', grupo_categoria: 'entretenimiento', colorHex: '#8B5CF6', icono: '🎯' },
      { descripcion: '👔 Ropa', grupo_categoria: 'personal', colorHex: '#EC4899', icono: '👔' },
      { descripcion: '📚 Educación', grupo_categoria: 'desarrollo', colorHex: '#06B6D4', icono: '📚' },
      { descripcion: '💰 Servicios', grupo_categoria: 'esenciales', colorHex: '#84CC16', icono: '💰' },
      { descripcion: '🎁 Regalos', grupo_categoria: 'especiales', colorHex: '#F97316', icono: '🎁' },
      { descripcion: '📱 Tecnología', grupo_categoria: 'tecnologia', colorHex: '#6366F1', icono: '📱' }
    ]

    let categoriasCreadas = 0
    for (const categoria of categoriasGenericas) {
      // Verificar si ya existe
      const existe = await prisma.categoria.findFirst({
        where: { descripcion: categoria.descripcion }
      })

      if (!existe) {
        await prisma.categoria.create({
          data: {
            ...categoria,
            status: true,
            esGenerica: true,
            activa: true,
            tipo: 'generica'
          }
        })
        categoriasCreadas++
      }
    }

    console.log(`✅ Categorías genéricas creadas: ${categoriasCreadas}`)

    // 3. ESTADÍSTICAS FINALES
    console.log('\n📊 Paso 3: Generando estadísticas finales...')
    
    const stats = await prisma.categoria.groupBy({
      by: ['esGenerica', 'activa'],
      _count: true
    })

    console.log('\n📈 Estadísticas del sistema híbrido:')
    stats.forEach(stat => {
      const tipo = stat.esGenerica ? 'Genéricas' : 'De Grupo'
      const estado = stat.activa ? 'Activas' : 'Inactivas'
      console.log(`   ${tipo} ${estado}: ${stat._count}`)
    })

    // 4. VERIFICACIÓN DE INTEGRIDAD
    console.log('\n🔍 Paso 4: Verificación de integridad...')
    
         const [totalCategorias, countGenericas, countGrupo] = await Promise.all([
       prisma.categoria.count(),
       prisma.categoria.count({ where: { esGenerica: true } }),
       prisma.categoria.count({ where: { esGenerica: false } })
     ])

     console.log(`   Total de categorías: ${totalCategorias}`)
     console.log(`   Categorías genéricas: ${countGenericas}`)
     console.log(`   Categorías de grupo: ${countGrupo}`)

         console.log('✅ Verificación de integridad completada')

    console.log('\n🎉 ¡Migración completada exitosamente!')
    console.log('📝 El sistema híbrido de categorías está listo para usar')
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    throw error
  }
}

// Ejecutar migración
migrarCategoriasHibridas()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })

module.exports = { migrarCategoriasHibridas } 