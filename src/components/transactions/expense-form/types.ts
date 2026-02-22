export interface Categoria {
  id: number
  descripcion: string
  grupo_categoria: string | null
  status: boolean
}

export interface GastoRecurrente {
  id: number
  concepto: string
  monto: number
  estadoVisual: "pagado" | "pago_parcial" | string
  estadoTexto: string
  saldoPendiente: number
  totalPagado: number
  porcentajePagado: number
}
