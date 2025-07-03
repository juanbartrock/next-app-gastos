import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'
import { calcularEstadoRecurrente } from '@/lib/gastos-recurrentes-utils'

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
          userId: usuario.id
          // Permitir todos los estados para casos como facturas adicionales o imponderables
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
              fecha: true,
              fechaImputacion: true
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

    // Calcular información adicional para cada recurrente usando las nuevas utilidades
    const gastosConInfo = gastosRecurrentes.map((recurrente: any) => {
      // Usar las nuevas utilidades para calcular estado correcto por período
      const estadoCalculado = calcularEstadoRecurrente(recurrente, recurrente.gastosGenerados)
      
      return {
        ...recurrente,
        totalPagado: estadoCalculado.totalPagado,
        saldoPendiente: estadoCalculado.saldoPendiente,
        porcentajePagado: estadoCalculado.porcentajePagado,
        estadoVisual: estadoCalculado.estado,
        // Información adicional para el selector
        estadoTexto: estadoCalculado.estado === 'pagado' ? 'Completamente pagado' : 
                     estadoCalculado.estado === 'pago_parcial' ? `${estadoCalculado.porcentajePagado.toFixed(1)}% pagado` : 
                     'Pendiente de pago'
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