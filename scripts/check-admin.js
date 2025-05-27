const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAdmin() {
  try {
    // Obtener el email del argumento de línea de comandos
    const email = process.argv[2]
    
    if (!email) {
      console.error('❌ Error: Debes proporcionar un email')
      console.log('📝 Uso: node scripts/check-admin.js usuario@email.com')
      process.exit(1)
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.error('❌ Error: El formato del email no es válido')
      process.exit(1)
    }

    console.log(`🔍 Verificando usuario con email: ${email}`)

    // Buscar el usuario por email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, isAdmin: true }
    })

    if (!user) {
      console.error(`❌ Error: No se encontró un usuario con email ${email}`)
      process.exit(1)
    }

    console.log('📋 Información del usuario:')
    console.log(`   - ID: ${user.id}`)
    console.log(`   - Nombre: ${user.name || 'No especificado'}`)
    console.log(`   - Email: ${user.email}`)
    console.log(`   - Es Admin: ${user.isAdmin ? 'Sí ✅' : 'No ❌'}`)
    
    if (user.isAdmin) {
      console.log('')
      console.log('🎉 Este usuario tiene permisos de administrador')
    } else {
      console.log('')
      console.log('ℹ️  Este usuario NO tiene permisos de administrador')
      console.log('💡 Para hacerlo admin, ejecuta: .\\make-admin.ps1 ' + email)
    }

  } catch (error) {
    console.error('❌ Error al verificar usuario:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar la función principal
checkAdmin() 