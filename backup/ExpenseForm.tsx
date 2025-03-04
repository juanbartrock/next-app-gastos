"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ArrowDown, ArrowUp, CalendarIcon, Plus } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface ExpenseFormProps {
  onTransactionAdded: () => void
}

export function ExpenseForm({ onTransactionAdded }: ExpenseFormProps) {
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState<Date>()
  const [transactionType, setTransactionType] = useState<"income" | "expense">("expense")
  const [movementType, setMovementType] = useState<"efectivo" | "digital" | "ahorro">("efectivo")
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<boolean>(false)

  // Función para formatear el monto con el formato requerido
  const formatAmount = (value: string) => {
    // Eliminar todo excepto números
    const numbers = value.replace(/\D/g, "")

    // Convertir a número y formatear
    const formatted = new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(Number(numbers) / 100)

    return formatted
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "")
    setAmount(value ? formatAmount(value) : "")
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setSuccess(false)
    
    const form = event.currentTarget
    const formData = new FormData(form)
    
    const concepto = formData.get('concepto')?.toString()
    const monto = amount.replace(/[^0-9]/g, "") // Eliminar todo excepto números
    const categoria = formData.get('categoria')?.toString()

    if (!concepto || !monto || !categoria) {
      setError("Por favor, completa todos los campos")
      return
    }

    try {
      const response = await fetch('/api/gastos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          concepto,
          monto: Number(monto) / 100,
          categoria,
          tipoTransaccion: transactionType,
          tipoMovimiento: movementType,
          fecha: date || new Date()
        }),
      })

      if (!response.ok) {
        throw new Error('Error al crear el registro')
      }

      const data = await response.json()
      console.log('Registro creado:', data)
      form.reset()
      setAmount("")
      setDate(undefined)
      setTransactionType("expense")
      setMovementType("efectivo")
      setSuccess(true)
      
      onTransactionAdded()
      
      setTimeout(() => {
        setSuccess(false)
      }, 3000)
      
    } catch (error) {
      console.error('Error:', error)
      setError("Error al crear el registro. Por favor, intenta de nuevo.")
    }
  }

  return (
    <div className="mt-8 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Nuevo Registro</h3>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded text-sm">
          ¡Registro creado exitosamente!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Monto</Label>
          <Input
            id="amount"
            name="amount"
            type="text"
            value={amount}
            onChange={handleAmountChange}
            placeholder="$0.000.000,00"
            className="text-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="concepto">Concepto</Label>
          <Input
            id="concepto"
            name="concepto"
            type="text"
            placeholder="Ej: Compra supermercado"
            className="dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoria">Categoría</Label>
          <Select name="categoria">
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alimentacion">Alimentación</SelectItem>
              <SelectItem value="transporte">Transporte</SelectItem>
              <SelectItem value="servicios">Servicios</SelectItem>
              <SelectItem value="ocio">Ocio</SelectItem>
              <SelectItem value="otros">Otros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Fecha</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal truncate">
                <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">{date ? format(date, "PPP", { locale: es }) : "Seleccionar"}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Tipo de transacción</Label>
          <RadioGroup
            defaultValue="expense"
            value={transactionType}
            onValueChange={(value) => setTransactionType(value as "income" | "expense")}
            className="grid grid-cols-2 gap-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="income" id="income" className="peer sr-only" />
              <Label
                htmlFor="income"
                className={`flex items-center justify-center w-full gap-2 rounded-md border-2 p-2 cursor-pointer
                  ${transactionType === "income" 
                    ? "border-green-500 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300" 
                    : "border-gray-200 dark:border-gray-700"}`}
              >
                <ArrowDown className="w-4 h-4" />
                Ingreso
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="expense" id="expense" className="peer sr-only" />
              <Label
                htmlFor="expense"
                className={`flex items-center justify-center w-full gap-2 rounded-md border-2 p-2 cursor-pointer
                  ${transactionType === "expense" 
                    ? "border-orange-500 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300" 
                    : "border-gray-200 dark:border-gray-700"}`}
              >
                <ArrowUp className="w-4 h-4" />
                Egreso
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label>Tipo de movimiento</Label>
          <Select value={movementType} onValueChange={(value) => setMovementType(value as "efectivo" | "digital" | "ahorro")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="efectivo">Efectivo</SelectItem>
              <SelectItem value="digital">Digital</SelectItem>
              <SelectItem value="ahorro">Ahorro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Registrar
        </Button>
      </form>
    </div>
  )
} 