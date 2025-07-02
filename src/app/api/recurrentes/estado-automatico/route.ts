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

    // Obtener parámetro para verificar si queremos cerrar períodos anteriores
    const url = new URL(request.url)
    const cerrarPeriodosAnteriores = url.searchParams.get('cerrarPeriodosAnteriores') === 'true'

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

    // Nueva función para detectar gastos del período anterior no pagados
    const esDelPeriodoAnteriorNoPagado = (recurrente: any): boolean => {
      if (!recurrente.proximaFecha) return false
      
      const ahora = new Date()
      const proximaFecha = new Date(recurrente.proximaFecha)
      
      // Calcular días que han pasado desde la fecha próxima
      const diasPasados = Math.ceil((ahora.getTime() - proximaFecha.getTime()) / (1000 * 60 * 60 * 24))
      
      // Determinar si ya pasó un período completo según la periodicidad
      let diasPeriodo = 30 // Default mensual
      switch (recurrente.periodicidad.toLowerCase()) {
        case 'mensual': diasPeriodo = 30; break
        case 'bimestral': diasPeriodo = 60; break
        case 'trimestral': diasPeriodo = 90; break
        case 'semestral': diasPeriodo = 180; break
        case 'anual': diasPeriodo = 365; break
        case 'semanal': diasPeriodo = 7; break
        case 'quincenal': diasPeriodo = 15; break
      }
      
      // Si han pasado más días que un período y no está pagado
      return diasPasados > 7 && // Al menos una semana de gracia
             !tieneGastoEnPeriodoActual(recurrente) &&
             !['pagado', 'n/a'].includes(recurrente.estado)
    }

    // Función para calcular la próxima fecha basada en periodicidad
    const calcularProximaFecha = (fechaActual: Date, periodicidad: string): Date => {
      const nuevaFecha = new Date(fechaActual)
      
      switch (periodicidad.toLowerCase()) {
        case 'semanal':
          nuevaFecha.setDate(nuevaFecha.getDate() + 7)
          break
        case 'quincenal':
          nuevaFecha.setDate(nuevaFecha.getDate() + 15)
          break
        case 'mensual':
          nuevaFecha.setMonth(nuevaFecha.getMonth() + 1)
          break
        case 'bimestral':
          nuevaFecha.setMonth(nuevaFecha.getMonth() + 2)
          break
        case 'trimestral':
          nuevaFecha.setMonth(nuevaFecha.getMonth() + 3)
          break
        case 'semestral':
          nuevaFecha.setMonth(nuevaFecha.getMonth() + 6)
          break
        case 'anual':
          nuevaFecha.setFullYear(nuevaFecha.getFullYear() + 1)
          break
        default:
          nuevaFecha.setMonth(nuevaFecha.getMonth() + 1) // Default mensual
      }
      
      return nuevaFecha
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
    const periodosCerrados = []
    
    for (const recurrente of gastosRecurrentes) {
      let estadoCalculado = calcularEstadoAutomatico(recurrente)
      let tieneGasto = tieneGastoEnPeriodoActual(recurrente)
      let fechaActualizada = recurrente.proximaFecha
      let periodoFueCerrado = false
      
      // Si se requiere cerrar períodos anteriores y este recurrente califica
      if (cerrarPeriodosAnteriores && esDelPeriodoAnteriorNoPagado(recurrente)) {
        // Avanzar la fecha al siguiente período
        if (recurrente.proximaFecha) {
          fechaActualizada = calcularProximaFecha(new Date(recurrente.proximaFecha), recurrente.periodicidad)
          estadoCalculado = 'programado' // Resetear estado para el nuevo período
          periodoFueCerrado = true
          
          periodosCerrados.push({
            id: recurrente.id,
            concepto: recurrente.concepto,
            fechaAnterior: recurrente.proximaFecha,
            fechaNueva: fechaActualizada,
            estadoAnterior: recurrente.estado,
            razon: 'Período anterior cerrado sin pago'
          })
        }
      }
      
      // Actualizar en base de datos si hay cambios
      if (estadoCalculado !== recurrente.estado || periodoFueCerrado) {
        await prisma.gastoRecurrente.update({
          where: { id: recurrente.id },
          data: { 
            estado: estadoCalculado,
            ...(periodoFueCerrado && { proximaFecha: fechaActualizada })
          }
        })
      }
      
      estadosActualizados.push({
        id: recurrente.id,
        concepto: recurrente.concepto,
        estadoAnterior: recurrente.estado,
        estadoNuevo: estadoCalculado,
        tieneGastoEnPeriodo: tieneGasto,
        proximaFecha: fechaActualizada,
        proximaFechaAnterior: recurrente.proximaFecha,
        periodoFueCerrado,
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
      actualizados: estadosActualizados.filter(e => e.estadoAnterior !== e.estadoNuevo).length,
      periodosCerrados: periodosCerrados.length
    }

    return NextResponse.json({
      success: true,
      message: cerrarPeriodosAnteriores 
        ? `Estados actualizados y ${periodosCerrados.length} períodos cerrados` 
        : 'Estados calculados exitosamente',
      data: estadosActualizados,
      periodosCerrados,
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