import { RefreshCw } from "lucide-react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GastoRecurrente } from "./types"

interface RecurrentExpenseLinkSectionProps {
  gastoRecurrenteId: string
  handleGastoRecurrenteChange: (value: string) => void
  loadingRecurrentes: boolean
  gastosRecurrentes: GastoRecurrente[]
  gastoRecurrenteSeleccionado: GastoRecurrente | null
}

export function RecurrentExpenseLinkSection({
  gastoRecurrenteId,
  handleGastoRecurrenteChange,
  loadingRecurrentes,
  gastosRecurrentes,
  gastoRecurrenteSeleccionado,
}: RecurrentExpenseLinkSectionProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="gastoRecurrente" className="flex items-center">
        <RefreshCw className="mr-2 h-4 w-4" />
        Asociar a Gasto Recurrente (opcional)
      </Label>
      <Select value={gastoRecurrenteId || "none"} onValueChange={handleGastoRecurrenteChange}>
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar gasto recurrente..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Ninguno</SelectItem>
          {loadingRecurrentes ? (
            <SelectItem value="loading" disabled>
              Cargando gastos recurrentes...
            </SelectItem>
          ) : (
            gastosRecurrentes.map((recurrente) => (
              <SelectItem key={recurrente.id} value={recurrente.id.toString()}>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{recurrente.concepto}</div>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        recurrente.estadoVisual === "pagado"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : recurrente.estadoVisual === "pago_parcial"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                      }`}
                    >
                      {recurrente.estadoTexto}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ${recurrente.monto.toLocaleString()} total
                    {recurrente.saldoPendiente > 0 && (
                      <span className="ml-1">- ${Math.abs(recurrente.saldoPendiente).toLocaleString()} pendiente</span>
                    )}
                    {recurrente.saldoPendiente < 0 && (
                      <span className="ml-1 text-green-600">
                        - ${Math.abs(recurrente.saldoPendiente).toLocaleString()} sobrepagado
                      </span>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {gastoRecurrenteSeleccionado && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md">
          <div className="text-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="font-medium text-blue-900 dark:text-blue-100">
                {gastoRecurrenteSeleccionado.concepto}
              </div>
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${
                  gastoRecurrenteSeleccionado.estadoVisual === "pagado"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                    : gastoRecurrenteSeleccionado.estadoVisual === "pago_parcial"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                      : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                }`}
              >
                {gastoRecurrenteSeleccionado.estadoTexto}
              </span>
            </div>
            <div className="text-blue-700 dark:text-blue-300 mt-1">
              Monto total: ${gastoRecurrenteSeleccionado.monto.toLocaleString()}
            </div>
            {gastoRecurrenteSeleccionado.totalPagado > 0 && (
              <div className="text-blue-700 dark:text-blue-300">
                Ya pagado: ${gastoRecurrenteSeleccionado.totalPagado.toLocaleString()} (
                {gastoRecurrenteSeleccionado.porcentajePagado.toFixed(1)}%)
              </div>
            )}
            {gastoRecurrenteSeleccionado.saldoPendiente > 0 && (
              <div className="text-amber-700 dark:text-amber-300">
                Saldo pendiente: ${gastoRecurrenteSeleccionado.saldoPendiente.toLocaleString()}
              </div>
            )}
            {gastoRecurrenteSeleccionado.saldoPendiente < 0 && (
              <div className="text-green-700 dark:text-green-300">
                Sobrepagado: ${Math.abs(gastoRecurrenteSeleccionado.saldoPendiente).toLocaleString()}
              </div>
            )}
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              💡 Este pago se asociará al gasto recurrente.
              {gastoRecurrenteSeleccionado.estadoVisual === "pagado"
                ? " Útil para facturas adicionales o imponderables."
                : " Actualizará el estado automáticamente."}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
