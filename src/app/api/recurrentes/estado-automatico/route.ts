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

    // Obtener todos los gastos recurrentes del usuario con sus gastos generados
    const gastosRecurrentes = await prisma.gastoRecurrente.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        categoria: true,
        gastosGenerados: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    // Función para verificar si hay pago en el período actual
    const tieneGastoEnPeriodoActual = (recurrente: any): boolean => {
      if (!recurrente.proximaFecha) return false
      
      const ahora = new Date()
      const proximaFecha = new Date(recurrente.proximaFecha)
      
      // Si ya pasó la fecha próxima, buscar pago en los últimos días según periodicidad
      let diasTolerancia = 30 // Default para mensual
      
      switch (recurrente.periodicidad.toLowerCase()) {
        case 'mensual':
          diasTolerancia = 30
          break
        case 'bimestral':
          diasTolerancia = 60
          break
        case 'trimestral':
          diasTolerancia = 90
          break
        case 'semestral':
          diasTolerancia = 180
          break
        case 'anual':
          diasTolerancia = 365
          break
      }
      
      // Buscar si hay un gasto generado en el período correspondiente
      const fechaLimiteInferior = new Date(proximaFecha)
      fechaLimiteInferior.setDate(fechaLimiteInferior.getDate() - diasTolerancia)
      
      const gastosFiltrados = recurrente.gastosGenerados.filter(gasto => {
        const fechaGasto = new Date(gasto.fechaImputacion || gasto.fecha)
        return fechaGasto >= fechaLimiteInferior && fechaGasto <= ahora
      })
      
      return gastosFiltrados.length > 0
    }

    // Calcular estado automático para cada recurrente
    const calcularEstadoAutomatico = (recurrente: any): string => {
      const ahora = new Date()
      const proximaFecha = recurrente.proximaFecha ? new Date(recurrente.proximaFecha) : null
      
      // Si no tiene fecha próxima, mantener estado actual
      if (!proximaFecha) {
        return recurrente.estado
      }
      
      // Si tiene gasto generado en el período actual
      if (tieneGastoEnPeriodoActual(recurrente)) {
        return 'pagado'
      }
      
      // Si ya pasó la fecha y no hay pago
      if (ahora > proximaFecha) {
        return 'pendiente'
      }
      
      // Si la fecha está próxima (próximos 7 días)
      const diferenciaDias = Math.ceil((proximaFecha.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))
      if (diferenciaDias <= 7 && diferenciaDias > 0) {
        return 'proximo' // Nuevo estado para "próximo a vencer"
      }
      
      // Si está programado para el futuro
      if (ahora <= proximaFecha) {
        return 'programado'
      }
      
      return recurrente.estado // Mantener estado actual como fallback
    }

    // Procesar cada recurrente y actualizar estados si es necesario
    const estadosActualizados = []
    
    for (const recurrente of gastosRecurrentes) {
      const estadoCalculado = calcularEstadoAutomatico(recurrente)
      const tieneGasto = tieneGastoEnPeriodoActual(recurrente)
      
      // Solo actualizar si el estado cambió
      if (estadoCalculado !== recurrente.estado) {
        await prisma.gastoRecurrente.update({
          where: { id: recurrente.id },
          data: { estado: estadoCalculado }
        })
      }
      
      estadosActualizados.push({
        id: recurrente.id,
        concepto: recurrente.concepto,
        estadoAnterior: recurrente.estado,
        estadoNuevo: estadoCalculado,
        tieneGastoEnPeriodo: tieneGasto,
        proximaFecha: recurrente.proximaFecha,
        cantidadGastosGenerados: recurrente.gastosGenerados.length
      })
    }

    // Calcular estadísticas
    const stats = {
      total: gastosRecurrentes.length,
      pagados: estadosActualizados.filter(e => e.estadoNuevo === 'pagado').length,
      pendientes: estadosActualizados.filter(e => e.estadoNuevo === 'pendiente').length,
      proximos: estadosActualizados.filter(e => e.estadoNuevo === 'proximo').length,
      programados: estadosActualizados.filter(e => e.estadoNuevo === 'programado').length,
      actualizados: estadosActualizados.filter(e => e.estadoAnterior !== e.estadoNuevo).length
    }

    return NextResponse.json({
      success: true,
      message: 'Estados calculados exitosamente',
      data: estadosActualizados,
      stats
    })

  } catch (error) {
    console.error('Error al calcular estados automáticos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { recurrenteId } = await request.json()

    if (!recurrenteId) {
      return NextResponse.json({ error: 'ID de recurrente requerido' }, { status: 400 })
    }

    // Obtener el recurrente específico
    const recurrente = await prisma.gastoRecurrente.findFirst({
      where: {
        id: parseInt(recurrenteId),
        userId: session.user.id
      },
      include: {
        gastosGenerados: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!recurrente) {
      return NextResponse.json({ error: 'Gasto recurrente no encontrado' }, { status: 404 })
    }

    // Misma lógica de cálculo pero para un solo recurrente
    const ahora = new Date()
    const proximaFecha = recurrente.proximaFecha ? new Date(recurrente.proximaFecha) : null
    
    let estadoCalculado = recurrente.estado
    let tieneGasto = false
    
    if (proximaFecha) {
      // Verificar si tiene gasto en período
      let diasTolerancia = 30
      switch (recurrente.periodicidad.toLowerCase()) {
        case 'mensual': diasTolerancia = 30; break
        case 'bimestral': diasTolerancia = 60; break
        case 'trimestral': diasTolerancia = 90; break
        case 'semestral': diasTolerancia = 180; break
        case 'anual': diasTolerancia = 365; break
      }
      
      const fechaLimiteInferior = new Date(proximaFecha)
      fechaLimiteInferior.setDate(fechaLimiteInferior.getDate() - diasTolerancia)
      
      const gastosFiltrados = recurrente.gastosGenerados.filter(gasto => {
        const fechaGasto = new Date(gasto.fechaImputacion || gasto.fecha)
        return fechaGasto >= fechaLimiteInferior && fechaGasto <= ahora
      })
      
      tieneGasto = gastosFiltrados.length > 0
      
      if (tieneGasto) {
        estadoCalculado = 'pagado'
      } else if (ahora > proximaFecha) {
        estadoCalculado = 'pendiente'
      } else {
        const diferenciaDias = Math.ceil((proximaFecha.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))
        if (diferenciaDias <= 7 && diferenciaDias > 0) {
          estadoCalculado = 'proximo'
        } else {
          estadoCalculado = 'programado'
        }
      }
    }

    // Actualizar si cambió
    if (estadoCalculado !== recurrente.estado) {
      await prisma.gastoRecurrente.update({
        where: { id: recurrente.id },
        data: { estado: estadoCalculado }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Estado calculado exitosamente',
      data: {
        id: recurrente.id,
        concepto: recurrente.concepto,
        estadoAnterior: recurrente.estado,
        estadoNuevo: estadoCalculado,
        tieneGastoEnPeriodo: tieneGasto,
        proximaFecha: recurrente.proximaFecha,
        cantidadGastosGenerados: recurrente.gastosGenerados.length
      }
    })

  } catch (error) {
    console.error('Error al calcular estado automático individual:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 