import { CalendarIcon, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { parseDDMMYYYY } from "@/lib/transactions/date-utils"

interface AdvancedDateSectionProps {
  showAdvancedOptions: boolean
  setShowAdvancedOptions: (value: boolean) => void
  dateStr: string
  setDateStr: (value: string) => void
  setDate: (value: Date | undefined) => void
  mostrarFechaImputacion: boolean
  setMostrarFechaImputacion: (value: boolean) => void
  fechaImputacionStr: string
  setFechaImputacionStr: (value: string) => void
  setFechaImputacion: (value: Date | undefined) => void
}

export function AdvancedDateSection({
  showAdvancedOptions,
  setShowAdvancedOptions,
  dateStr,
  setDateStr,
  setDate,
  mostrarFechaImputacion,
  setMostrarFechaImputacion,
  fechaImputacionStr,
  setFechaImputacionStr,
  setFechaImputacion,
}: AdvancedDateSectionProps) {
  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center justify-center"
        onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
      >
        {showAdvancedOptions ? "Ocultar opciones avanzadas" : "Mostrar opciones avanzadas"}
        <Plus className={`ml-2 h-4 w-4 transition-transform ${showAdvancedOptions ? "rotate-45" : ""}`} />
      </Button>

      <div className={`space-y-4 ${showAdvancedOptions ? "" : "hidden"}`}>
        <div className="space-y-2">
          <Label htmlFor="date">Fecha de depósito/transacción (DD/MM/YYYY)</Label>
          <Input
            type="text"
            id="date"
            value={dateStr}
            onChange={(e) => {
              setDateStr(e.target.value)
              const parsedDate = parseDDMMYYYY(e.target.value)
              setDate(parsedDate)
            }}
            placeholder="DD/MM/YYYY"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="mostrarFechaImputacion"
            checked={mostrarFechaImputacion}
            onChange={(e) => setMostrarFechaImputacion(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <Label htmlFor="mostrarFechaImputacion" className="flex items-center cursor-pointer">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Usar fecha diferente para imputación contable
          </Label>
        </div>

        {mostrarFechaImputacion && (
          <div className="space-y-2 p-4 border border-amber-200 dark:border-amber-700 rounded-md bg-amber-50 dark:bg-amber-900/20">
            <Label htmlFor="fechaImputacion">Fecha de imputación contable (DD/MM/YYYY)</Label>
            <Input
              type="text"
              id="fechaImputacion"
              value={fechaImputacionStr}
              onChange={(e) => {
                setFechaImputacionStr(e.target.value)
                const parsedFechaImputacion = parseDDMMYYYY(e.target.value)
                setFechaImputacion(parsedFechaImputacion)
              }}
              placeholder="DD/MM/YYYY"
            />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              <strong>Ejemplo:</strong> Salario depositado el 31/05/2024 pero corresponde a junio → usar 01/06/2024 como fecha de imputación
            </p>
          </div>
        )}
      </div>
    </>
  )
}
