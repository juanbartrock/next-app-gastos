import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = session.user.id

    console.log(`🗑️ Iniciando eliminación de cuenta para usuario: ${userId}`)

    // Usar transacción para garantizar que todo se elimine correctamente
    await prisma.$transaction(async (tx) => {
      // 1. Eliminar alertas
      await tx.alerta.deleteMany({
        where: { userId }
      })
      console.log(`✅ Alertas eliminadas para usuario: ${userId}`)

      // 2. Eliminar configuraciones de alertas
      await tx.configuracionAlerta.deleteMany({
        where: { userId }
      })
      console.log(`✅ Configuraciones de alertas eliminadas para usuario: ${userId}`)

      // 3. Eliminar transacciones de inversión
      await tx.transaccionInversion.deleteMany({
        where: { inversion: { userId } }
      })
      console.log(`✅ Transacciones de inversión eliminadas para usuario: ${userId}`)

      // 4. Eliminar inversiones
      await tx.inversion.deleteMany({
        where: { userId }
      })
      console.log(`✅ Inversiones eliminadas para usuario: ${userId}`)

      // 5. Eliminar pagos de préstamos
      await tx.pagoPrestamo.deleteMany({
        where: { prestamo: { userId } }
      })
      console.log(`✅ Pagos de préstamos eliminados para usuario: ${userId}`)

      // 6. Eliminar préstamos
      await tx.prestamo.deleteMany({
        where: { userId }
      })
      console.log(`✅ Préstamos eliminados para usuario: ${userId}`)

      // 7. Eliminar tareas
      await tx.tarea.deleteMany({
        where: { userId }
      })
      console.log(`✅ Tareas eliminadas para usuario: ${userId}`)

      // 8. Eliminar presupuestos
      await tx.presupuesto.deleteMany({
        where: { userId }
      })
      console.log(`✅ Presupuestos eliminados para usuario: ${userId}`)

      // 9. Eliminar gastos recurrentes
      await tx.gastoRecurrente.deleteMany({
        where: { userId }
      })
      console.log(`✅ Gastos recurrentes eliminados para usuario: ${userId}`)

      // 10. Eliminar transacciones/gastos
      await tx.gasto.deleteMany({
        where: { userId }
      })
      console.log(`✅ Transacciones eliminadas para usuario: ${userId}`)

      // 11. Eliminar categorías personales
      await tx.categoria.deleteMany({
        where: { userId }
      })
      console.log(`✅ Categorías personales eliminadas para usuario: ${userId}`)

      // 12. Eliminar membresías de grupos
      await tx.grupoMiembro.deleteMany({
        where: { userId }
      })
      console.log(`✅ Membresías de grupos eliminadas para usuario: ${userId}`)

      // 13. Eliminar grupos creados por el usuario
      await tx.grupo.deleteMany({
        where: { adminId: userId }
      })
      console.log(`✅ Grupos creados eliminados para usuario: ${userId}`)

      // 14. Eliminar sesiones de NextAuth
      await tx.session.deleteMany({
        where: { userId }
      })
      console.log(`✅ Sesiones eliminadas para usuario: ${userId}`)

      // 15. Eliminar cuentas OAuth conectadas
      await tx.account.deleteMany({
        where: { userId }
      })
      console.log(`✅ Cuentas OAuth eliminadas para usuario: ${userId}`)

      // 16. Finalmente, eliminar el usuario
      await tx.user.delete({
        where: { id: userId }
      })
      console.log(`✅ Usuario eliminado completamente: ${userId}`)
    })

    console.log(`🎉 Eliminación de cuenta completada exitosamente para usuario: ${userId}`)

    return NextResponse.json({ 
      message: 'Cuenta eliminada correctamente. Se han eliminado todos los datos asociados.' 
    })

  } catch (error) {
    console.error('❌ Error al eliminar cuenta:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor al eliminar la cuenta' },
      { status: 500 }
    )
  }
} 