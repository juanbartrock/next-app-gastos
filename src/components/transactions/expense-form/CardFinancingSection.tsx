import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { amountDigitsToNumber } from "@/lib/transactions/amount-utils"

interface CardFinancingSectionProps {
  movementType: "efectivo" | "digital" | "ahorro" | "tarjeta"
  tarjetaEspecifica: string
  setTarjetaEspecifica: (value: string) => void
  cantidadCuotas: string
  setCantidadCuotas: (value: string) => void
  fechaPrimerPagoStr: string
  setFechaPrimerPagoStr: (value: string) => void
  diaPago: string
  setDiaPago: (value: string) => void
  amount: string
  formatMoney: (value: number) => string
}

export function CardFinancingSection({
  movementType,
  tarjetaEspecifica,
  setTarjetaEspecifica,
  cantidadCuotas,
  setCantidadCuotas,
  fechaPrimerPagoStr,
  setFechaPrimerPagoStr,
  diaPago,
  setDiaPago,
  amount,
  formatMoney,
}: CardFinancingSectionProps) {
  if (movementType !== "tarjeta") {
    return null
  }

  return (
    <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
      <h4 className="font-medium text-gray-900 dark:text-gray-100">Detalles de Financiación</h4>

      <div className="space-y-2">
        <Label htmlFor="tarjetaEspecifica">Tarjeta Específica</Label>
        <Select value={tarjetaEspecifica} onValueChange={setTarjetaEspecifica}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar tarjeta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Visa Macro">💳 Visa Macro</SelectItem>
            <SelectItem value="Visa Ciudad">💳 Visa Ciudad</SelectItem>
            <SelectItem value="Mastercard BBVA">💳 Mastercard BBVA</SelectItem>
            <SelectItem value="Mastercard Galicia">💳 Mastercard Galicia</SelectItem>
            <SelectItem value="American Express">💳 American Express</SelectItem>
            <SelectItem value="Naranja">🧡 Naranja</SelectItem>
            <SelectItem value="Cabal">💙 Cabal</SelectItem>
            <SelectItem value="Otra">💳 Otra tarjeta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cantidadCuotas">Cantidad de Cuotas</Label>
        <Input
          id="cantidadCuotas"
          type="number"
          min="1"
          value={cantidadCuotas}
          onChange={(e) => setCantidadCuotas(e.target.value)}
          placeholder="Ej: 12"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fechaPrimerPago">Fecha del Primer Pago (DD/MM/YYYY)</Label>
        <Input
          type="text"
          id="fechaPrimerPago"
          value={fechaPrimerPagoStr}
          onChange={(e) => setFechaPrimerPagoStr(e.target.value)}
          placeholder="DD/MM/YYYY"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="diaPago">Día de Pago Mensual</Label>
        <Input
          id="diaPago"
          type="number"
          min="1"
          max="31"
          value={diaPago}
          onChange={(e) => setDiaPago(e.target.value)}
          placeholder="Ej: 10"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">Día del mes en que se realiza el pago (opcional)</p>
      </div>

      <div className="pt-2">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Monto por cuota: {cantidadCuotas && amount ? formatMoney(amountDigitsToNumber(amount) / parseInt(cantidadCuotas)) : formatMoney(0)}
        </p>
      </div>
    </div>
  )
}
