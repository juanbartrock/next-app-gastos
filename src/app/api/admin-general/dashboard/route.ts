import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que sea admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Sin permisos de administrador' }, { status: 403 })
    }

    // Obtener estadísticas básicas del sistema
    const [
      totalUsuarios,
      totalPlanes,
      totalGastos,
      totalAlertas,
      totalGrupos,
      usuariosPorPlan,
      gastosUltimos30Dias
    ] = await Promise.all([
      // Total de usuarios
      prisma.user.count(),
      
      // Total de planes
      prisma.plan.count(),
      
      // Total de gastos/transacciones
      prisma.gasto.count(),
      
      // Total de alertas
      prisma.alerta.count(),
      
      // Total de grupos
      prisma.grupo.count(),
      
      // Usuarios por plan
      prisma.plan.findMany({
        select: {
          id: true,
          nombre: true,
          esPago: true,
          precioMensual: true,
          _count: {
            select: { usuarios: true }
          }
        }
      }),
      
      // Gastos últimos 30 días
      prisma.gasto.aggregate({
        where: {
          fecha: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        _sum: { monto: true },
        _count: { id: true }
      })
    ])

    // Calcular revenue mensual
    const revenueMensual = usuariosPorPlan.reduce((total, plan) => {
      if (plan.esPago && plan.precioMensual) {
        return total + (plan.precioMensual * plan._count.usuarios)
      }
      return total
    }, 0)

    // Estadísticas de planes de pago
    const usuariosPago = usuariosPorPlan
      .filter(plan => plan.esPago)
      .reduce((total, plan) => total + plan._count.usuarios, 0)

    // Actividad del sistema (solo datos básicos)
    const actividadReciente = {
      gastosHoy: await prisma.gasto.count({
        where: {
          fecha: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      alertasHoy: await prisma.alerta.count({
        where: {
          fechaCreacion: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    }

    return NextResponse.json({
      resumen: {
        totalUsuarios,
        totalPlanes,
        totalGastos,
        totalAlertas,  
        totalGrupos,
        usuariosPago,
        revenueMensual
      },
      planes: usuariosPorPlan,
      actividad: {
        gastosUltimos30Dias: {
          total: gastosUltimos30Dias._sum.monto || 0,
          cantidad: gastosUltimos30Dias._count || 0
        },
        actividadHoy: actividadReciente
      }
    })

  } catch (error) {
    console.error('Error obteniendo dashboard admin:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
} 