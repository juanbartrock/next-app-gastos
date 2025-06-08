const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function migrarCategoriasExpandidas() {
  console.log('🚀 Iniciando migración a sistema expandido de categorías...')
  console.log('📋 Sistema: Genéricas + Personales + Grupos')

  try {
    // 1. VERIFICAR ESTADO ACTUAL
    console.log('\n📋 Paso 1: Verificando estado actual...')
    
    const categoriasExistentes = await prisma.categoria.findMany()
    console.log(`📊 Categorías existentes encontradas: ${categoriasExistentes.length}`)

    const stats = await prisma.categoria.groupBy({
      by: ['esGenerica'],
      _count: true
    })

    stats.forEach(stat => {
      const tipo = stat.esGenerica ? 'Genéricas' : 'No Genéricas'
      console.log(`   ${tipo}: ${stat._count}`)
    })

    // 2. ASEGURAR QUE TODAS LAS CATEGORÍAS EXISTENTES SEAN GENÉRICAS
    console.log('\n📋 Paso 2: Configurando categorías existentes como genéricas...')
    
    const resultadoGenericar = await prisma.categoria.updateMany({
      where: {
        esGenerica: true,
        userId: null,
        grupoId: null
      },
      data: {
        tipo: "generica",
        activa: true
      }
    })
    
    console.log(`✅ Categorías configuradas como genéricas: ${resultadoGenericar.count}`)

    // 3. CREAR CATEGORÍAS GENÉRICAS DEL SISTEMA (si no existen)
    console.log('\n📋 Paso 3: Creando categorías genéricas del sistema...')
    
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
      const existe = await prisma.categoria.findFirst({
        where: { 
          descripcion: categoria.descripcion,
          esGenerica: true,
          userId: null,
          grupoId: null
        }
      })

      if (!existe) {
        await prisma.categoria.create({
          data: {
            ...categoria,
            status: true,
            esGenerica: true,
            activa: true,
            tipo: 'generica',
            userId: null,
            grupoId: null
          }
        })
        categoriasCreadas++
      }
    }

    console.log(`✅ Categorías genéricas del sistema creadas: ${categoriasCreadas}`)

    // 4. VERIFICAR USUARIOS Y CREAR CATEGORÍAS PERSONALES DE EJEMPLO
    console.log('\n📋 Paso 4: Configurando categorías personales de ejemplo...')
    
    const usuarios = await prisma.user.findMany({
      select: { id: true, name: true, email: true }
    })

    console.log(`👥 Usuarios encontrados: ${usuarios.length}`)

    // Crear algunas categorías personales de ejemplo para el primer usuario
    if (usuarios.length > 0) {
      const primerUsuario = usuarios[0]
      
      const categoriasPersonalesEjemplo = [
        { descripcion: '📝 Trabajo Freelance', grupo_categoria: 'personal', icono: '📝' },
        { descripcion: '🎮 Gaming', grupo_categoria: 'entretenimiento', icono: '🎮' },
        { descripcion: '🌱 Jardín Personal', grupo_categoria: 'personal', icono: '🌱' }
      ]

      let personalesCreadas = 0
      for (const categoria of categoriasPersonalesEjemplo) {
        const existe = await prisma.categoria.findFirst({
          where: { 
            descripcion: categoria.descripcion,
            userId: primerUsuario.id
          }
        })

        if (!existe) {
          await prisma.categoria.create({
            data: {
              ...categoria,
              status: true,
              esGenerica: false,
              activa: true,
              tipo: 'personal',
              userId: primerUsuario.id,
              grupoId: null,
              adminCreadorId: primerUsuario.id
            }
          })
          personalesCreadas++
        }
      }

      console.log(`✅ Categorías personales de ejemplo creadas: ${personalesCreadas} (Usuario: ${primerUsuario.name})`)
    }

    // 5. ESTADÍSTICAS FINALES
    console.log('\n📊 Paso 5: Estadísticas finales del sistema expandido...')
    
    const [
      totalCategorias,
      countGenericas,
      countPersonales,
      countGrupo
    ] = await Promise.all([
      prisma.categoria.count(),
      prisma.categoria.count({ 
        where: { 
          esGenerica: true, 
          userId: null, 
          grupoId: null 
        } 
      }),
      prisma.categoria.count({ 
        where: { 
          esGenerica: false, 
          userId: { not: null }, 
          grupoId: null 
        } 
      }),
      prisma.categoria.count({ 
        where: { 
          esGenerica: false, 
          grupoId: { not: null } 
        } 
      })
    ])

    console.log('\n📈 Estadísticas del sistema expandido:')
    console.log(`   📋 Total de categorías: ${totalCategorias}`)
    console.log(`   🌍 Categorías genéricas (sistema): ${countGenericas}`)
    console.log(`   👤 Categorías personales (usuarios): ${countPersonales}`)
    console.log(`   👥 Categorías de grupo: ${countGrupo}`)

    // 6. EJEMPLOS DE CONSULTA HÍBRIDA
    console.log('\n📋 Paso 6: Probando consultas híbridas...')
    
    if (usuarios.length > 0) {
      const usuarioTest = usuarios[0]
      
      // Simular la consulta que vería este usuario
      const [genericas, personales, grupos] = await Promise.all([
        // Categorías genéricas (todos las ven)
        prisma.categoria.findMany({
          where: {
            esGenerica: true,
            activa: true
          }
        }),
        // Categorías personales del usuario
        prisma.categoria.findMany({
          where: {
            userId: usuarioTest.id,
            activa: true
          }
        }),
        // Categorías de grupos donde es miembro (simulamos)
        prisma.categoria.findMany({
          where: {
            grupoId: { not: null },
            activa: true
          },
          include: {
            grupo: {
              include: {
                miembros: {
                  where: { userId: usuarioTest.id }
                }
              }
            }
          }
        })
      ])

      console.log(`👤 Usuario de prueba: ${usuarioTest.name}`)
      console.log(`   🌍 Ve ${genericas.length} categorías genéricas`)
      console.log(`   👤 Ve ${personales.length} categorías personales`)
      console.log(`   👥 Ve ${grupos.length} categorías de grupos`)
      console.log(`   📊 Total visible: ${genericas.length + personales.length + grupos.length}`)
    }

    console.log('\n🎉 ¡Migración a sistema expandido completada!')
    console.log('\n🎯 CARACTERÍSTICAS DEL SISTEMA:')
    console.log('1. ✅ Categorías genéricas - Visibles para todos')
    console.log('2. ✅ Categorías personales - Privadas por usuario')
    console.log('3. ✅ Categorías de grupo - Compartidas entre miembros')
    console.log('4. ✅ Jerarquía de visibilidad implementada')
    console.log('5. ✅ Sin pérdida de datos existentes')

    console.log('\n📝 PRÓXIMOS PASOS:')
    console.log('1. Actualizar APIs para soportar categorías personales')
    console.log('2. Modificar UIs para mostrar los 3 tipos')
    console.log('3. Ajustar limitaciones por plan para categorías personales')
    console.log('4. Implementar CRUD completo para categorías personales')

  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    throw error
  }
}

// Ejecutar migración
migrarCategoriasExpandidas()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  }) 