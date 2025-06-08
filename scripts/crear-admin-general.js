const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function crearAdminGeneral() {
  try {
    console.log('🚀 Creando usuario Administrador General...')

    // Datos del admin general
    const adminData = {
      email: 'admin@sistema.com',
      name: 'Administrador General',
      password: 'Admin123!',  // Contraseña temporal - cambiar después
      phoneNumber: '+54911234567'
    }

    console.log(`📧 Email: ${adminData.email}`)
    console.log(`🔑 Contraseña temporal: ${adminData.password}`)
    console.log('⚠️  IMPORTANTE: Cambiar la contraseña después del primer login\n')

    // Verificar si ya existe un admin general
    const adminExistente = await prisma.user.findUnique({
      where: { email: adminData.email }
    })

    if (adminExistente) {
      console.log('✅ Usuario admin general ya existe')
      
      // Verificar y actualizar roles si es necesario
      const updateData = {
        isAdmin: true,
        rolSistema: 'admin_general',
        estado: 'activo'
      }

      await prisma.user.update({
        where: { id: adminExistente.id },
        data: updateData
      })

      console.log('✅ Roles y permisos actualizados')
      console.log(`👤 Usuario: ${adminExistente.id}`)
      return adminExistente
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(adminData.password, 12)

    // Obtener plan Premium para el admin
    const planPremium = await prisma.plan.findFirst({
      where: { nombre: 'Premium' }
    })

    if (!planPremium) {
      throw new Error('Plan Premium no encontrado. Ejecuta primero init-planes-avanzados.js')
    }

    // Crear usuario admin general
    const nuevoAdmin = await prisma.user.create({
      data: {
        email: adminData.email,
        name: adminData.name,
        password: hashedPassword,
        phoneNumber: adminData.phoneNumber,
        planId: planPremium.id,
        isAdmin: true,
        rolSistema: 'admin_general',
        estado: 'activo',
        fechaRegistro: new Date(),
        emailVerified: new Date() // Admin pre-verificado
      }
    })

    console.log('✅ Usuario Administrador General creado exitosamente!')
    console.log(`👤 ID: ${nuevoAdmin.id}`)
    console.log(`📧 Email: ${nuevoAdmin.email}`)
    console.log(`🏆 Plan: Premium`)
    console.log(`🛡️  Rol: Administrador General`)

    // Crear grupo de administradores si no existe
    const grupoAdmins = await prisma.grupo.findFirst({
      where: { nombre: 'Administradores' }
    })

    if (!grupoAdmins) {
      const nuevoGrupoAdmins = await prisma.grupo.create({
        data: {
          nombre: 'Administradores',
          descripcion: 'Grupo de administradores del sistema',
          adminId: nuevoAdmin.id
        }
      })

      console.log(`👥 Grupo "Administradores" creado: ${nuevoGrupoAdmins.id}`)
    }

    console.log('\n🎯 PRÓXIMOS PASOS:')
    console.log('1. Accede a /login con las credenciales mostradas')
    console.log('2. Ve a /admin-general para administrar el sistema')
    console.log('3. Cambia la contraseña desde /perfil')
    console.log('4. Configura los planes y funcionalidades')

    return nuevoAdmin

  } catch (error) {
    console.error('❌ Error al crear admin general:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Función para mostrar instrucciones de acceso
function mostrarInstrucciones() {
  console.log('\n📋 INSTRUCCIONES DE ACCESO:')
  console.log('=' .repeat(50))
  console.log('🌐 URL: http://localhost:3000/login')
  console.log('📧 Email: admin@sistema.com')
  console.log('🔑 Contraseña: Admin123!')
  console.log('=' .repeat(50))
  console.log('🛡️  Panel Admin: http://localhost:3000/admin-general')
  console.log('⚙️  Perfil: http://localhost:3000/perfil')
  console.log('=' .repeat(50))
}

crearAdminGeneral()
  .then(() => {
    mostrarInstrucciones()
    console.log('\n✨ Administrador General listo para usar!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Error en el proceso:', error)
    process.exit(1)
  }) 