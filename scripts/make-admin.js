const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function makeAdmin() {
  try {
    // Obtener el email del argumento de línea de comandos
    const email = process.argv[2]
    
    if (!email) {
      console.error('❌ Error: Debes proporcionar un email')
      console.log('📝 Uso: node scripts/make-admin.js usuario@email.com')
      process.exit(1)
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.error('❌ Error: El formato del email no es válido')
      process.exit(1)
    }

    console.log(`🔍 Buscando usuario con email: ${email}`)

    // Buscar el usuario por email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, isAdmin: true }
    })

    if (!user) {
      console.error(`❌ Error: No se encontró un usuario con email ${email}`)
      process.exit(1)
    }

    // Verificar si ya es admin
    if (user.isAdmin) {
      console.log(`ℹ️  El usuario ${user.name || user.email} ya es administrador`)
      process.exit(0)
    }

    // Actualizar el usuario para hacerlo admin
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { isAdmin: true },
      select: { id: true, email: true, name: true, isAdmin: true }
    })

    console.log('✅ Usuario actualizado exitosamente:')
    console.log(`   - ID: ${updatedUser.id}`)
    console.log(`   - Nombre: ${updatedUser.name || 'No especificado'}`)
    console.log(`   - Email: ${updatedUser.email}`)
    console.log(`   - Es Admin: ${updatedUser.isAdmin ? 'Sí' : 'No'}`)
    console.log('')
    console.log('🎉 ¡El usuario ahora es administrador!')

  } catch (error) {
    console.error('❌ Error al actualizar usuario:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar la función principal
makeAdmin() 