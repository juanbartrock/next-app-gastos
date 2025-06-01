import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener usuario con timeout más corto
    const usuario = await Promise.race([
      prisma.user.findUnique({
        where: { email: session.user.email }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout al buscar usuario')), 10000)
      )
    ]) as any

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Obtener gastos recurrentes del usuario con query simplificada
    const gastosRecurrentes = await Promise.race([
      prisma.gastoRecurrente.findMany({
        where: {
          userId: usuario.id,
          estado: {
            in: ['pendiente', 'pago_parcial']  // Solo los que no están completamente pagados
          }
        },
        include: {
          categoria: {
            select: {
              id: true,
              descripcion: true
            }
          },
          gastosGenerados: {
            select: {
              id: true,
              monto: true,
              fecha: true
            },
            take: 10 // Limitar resultados
          }
        },
        orderBy: {
          proximaFecha: 'asc'
        },
        take: 50 // Limitar a 50 gastos recurrentes máximo
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout al buscar gastos recurrentes')), 15000)
      )
    ]) as any

    // Calcular información adicional para cada recurrente
    const gastosConInfo = gastosRecurrentes.map((recurrente: any) => {
      const totalPagado = recurrente.gastosGenerados.reduce((sum: number, pago: any) => sum + pago.monto, 0)
      const saldoPendiente = recurrente.monto - totalPagado
      
      return {
        ...recurrente,
        totalPagado,
        saldoPendiente,
        porcentajePagado: (totalPagado / recurrente.monto) * 100
      }
    })

    return NextResponse.json(gastosConInfo)

  } catch (error) {
    console.error('Error al obtener gastos recurrentes disponibles:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 