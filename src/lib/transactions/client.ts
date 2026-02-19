export interface CreateGastoPayload {
  concepto: string
  monto: number
  categoria?: string
  categoriaId: number
  tipoTransaccion: "income" | "expense"
  tipoMovimiento: "efectivo" | "digital" | "ahorro" | "tarjeta"
  fecha: Date
  fechaImputacion?: Date
  grupoId: string | null
  incluirEnFamilia: boolean
  gastoRecurrenteId?: number
}

export interface CreateFinanciacionPayload {
  gastoId: number
  cantidadCuotas: number
  montoCuota: number
  fechaPrimerPago?: Date
  diaPago: number | null
  tarjetaEspecifica: string
}

export async function parseApiError(response: Response, fallbackMessage: string): Promise<string> {
  try {
    const data = await response.json()
    return data?.error || data?.details || fallbackMessage
  } catch {
    try {
      const text = await response.text()
      return text || fallbackMessage
    } catch {
      return fallbackMessage
    }
  }
}

export async function createGasto(payload: CreateGastoPayload) {
  const response = await fetch('/api/gastos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await parseApiError(response, 'Error al crear el registro')
    throw new Error(message)
  }

  return response.json()
}

export async function createFinanciacion(payload: CreateFinanciacionPayload) {
  const response = await fetch('/api/financiacion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await parseApiError(response, 'Error al crear la financiación')
    throw new Error(message)
  }

  return response.json()
}

export async function getGastosRecurrentesDisponibles() {
  const response = await fetch('/api/gastos/recurrentes-disponibles')

  if (!response.ok) {
    const message = await parseApiError(response, 'Error al cargar gastos recurrentes')
    throw new Error(message)
  }

  return response.json()
}
