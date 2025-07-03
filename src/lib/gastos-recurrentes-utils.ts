/**
 * Utilidades para manejo de gastos recurrentes y cálculo de períodos
 */

export interface GastoRecurrente {
  id: number
  monto: number
  proximaFecha: Date | string | null
  periodicidad: string
  estado: string
}

export interface PagoGasto {
  id: number
  monto: number
  fecha: Date | string
  fechaImputacion?: Date | string | null
}

/**
 * Calcula el rango de fechas válido para el período actual basado en la fecha actual (mes actual)
 */
export function calcularPeriodoActual(gastoRecurrente: GastoRecurrente): { fechaInicio: Date; fechaFin: Date } | null {
  const ahora = new Date()
  
  // Para gastos mensuales (el caso más común), el período actual es el mes actual
  if (gastoRecurrente.periodicidad.toLowerCase() === 'mensual') {
    const fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1) // Primer día del mes actual
    const fechaFin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0) // Último día del mes actual
    return { fechaInicio, fechaFin }
  }

  // Para otros períodos, usar la lógica basada en proximaFecha si existe
  if (!gastoRecurrente.proximaFecha) {
    return null
  }

  const proximaFecha = new Date(gastoRecurrente.proximaFecha)
  const periodicidad = gastoRecurrente.periodicidad.toLowerCase()

  // Calcular fecha de inicio del período actual
  const fechaInicio = new Date(proximaFecha)
  
  switch (periodicidad) {
    case 'semanal':
      fechaInicio.setDate(fechaInicio.getDate() - 7)
      break
    case 'quincenal':
      fechaInicio.setDate(fechaInicio.getDate() - 15)
      break
    case 'bimestral':
      fechaInicio.setMonth(fechaInicio.getMonth() - 2)
      break
    case 'trimestral':
      fechaInicio.setMonth(fechaInicio.getMonth() - 3)
      break
    case 'semestral':
      fechaInicio.setMonth(fechaInicio.getMonth() - 6)
      break
    case 'anual':
      fechaInicio.setFullYear(fechaInicio.getFullYear() - 1)
      break
    default:
      // Para periodicidades no reconocidas, usar el mes actual
      const inicioMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
      const finMesActual = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0)
      return { fechaInicio: inicioMesActual, fechaFin: finMesActual }
  }

  // La fecha fin es la próxima fecha del recurrente
  const fechaFin = new Date(proximaFecha)

  return { fechaInicio, fechaFin }
}

/**
 * Filtra los pagos que pertenecen al período actual del gasto recurrente
 */
export function filtrarPagosPeriodoActual(gastoRecurrente: GastoRecurrente, pagos: PagoGasto[]): PagoGasto[] {
  const periodo = calcularPeriodoActual(gastoRecurrente)
  
  if (!periodo) {
    return []
  }

  return pagos.filter(pago => {
    // Usar fechaImputacion si existe, sino fecha normal
    const fechaPago = new Date(pago.fechaImputacion || pago.fecha)
    
    // El pago debe estar dentro del período actual
    return fechaPago >= periodo.fechaInicio && fechaPago <= periodo.fechaFin
  })
}

/**
 * Calcula el total pagado y el estado correcto para un gasto recurrente
 */
export function calcularEstadoRecurrente(gastoRecurrente: GastoRecurrente, pagos: PagoGasto[]): {
  totalPagado: number
  saldoPendiente: number
  porcentajePagado: number
  estado: string
} {
  const pagosPeriodoActual = filtrarPagosPeriodoActual(gastoRecurrente, pagos)
  const totalPagado = pagosPeriodoActual.reduce((sum, pago) => sum + pago.monto, 0)
  const saldoPendiente = gastoRecurrente.monto - totalPagado
  const porcentajePagado = gastoRecurrente.monto > 0 ? (totalPagado / gastoRecurrente.monto) * 100 : 0

  // Determinar estado basado en el pago del período actual
  let estado = 'pendiente'
  if (totalPagado >= gastoRecurrente.monto) {
    estado = 'pagado'
  } else if (totalPagado > 0) {
    estado = 'pago_parcial'
  }

  return {
    totalPagado,
    saldoPendiente,
    porcentajePagado,
    estado
  }
}

/**
 * Calcula la próxima fecha basada en periodicidad
 */
export function calcularProximaFecha(fechaActual: Date, periodicidad: string): Date {
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