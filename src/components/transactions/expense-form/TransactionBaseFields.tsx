import { ArrowDown, ArrowUp, CreditCard } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Categoria } from "./types"

interface TransactionBaseFieldsProps {
  transactionType: "income" | "expense"
  setTransactionType: (value: "income" | "expense") => void
  amount: string
  handleAmountChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  currency: "ARS" | "USD"
  loadingCategorias: boolean
  categorias: Categoria[]
  movementType: "efectivo" | "digital" | "ahorro" | "tarjeta"
  setMovementType: (value: "efectivo" | "digital" | "ahorro" | "tarjeta") => void
}

export function TransactionBaseFields({
  transactionType,
  setTransactionType,
  amount,
  handleAmountChange,
  currency,
  loadingCategorias,
  categorias,
  movementType,
  setMovementType,
}: TransactionBaseFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label>Tipo de Transacción</Label>
        <RadioGroup
          defaultValue="expense"
          value={transactionType}
          onValueChange={(value) => setTransactionType(value as "income" | "expense")}
          className="flex"
        >
          <div className="flex items-center space-x-2 mr-4">
            <RadioGroupItem value="expense" id="expense" />
            <Label htmlFor="expense" className="flex items-center">
              <ArrowDown className="mr-1 h-4 w-4 text-red-500" />
              Gasto
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="income" id="income" />
            <Label htmlFor="income" className="flex items-center">
              <ArrowUp className="mr-1 h-4 w-4 text-green-500" />
              Ingreso
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Monto</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            {currency === "ARS" ? "$" : "US$"}
          </span>
          <Input
            id="amount"
            name="amount"
            type="text"
            value={amount}
            onChange={handleAmountChange}
            className="pl-8"
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="concepto">Concepto</Label>
        <Input id="concepto" name="concepto" placeholder="Ej: Supermercado" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoria">Categoría</Label>
        <Select name="categoriaId" required>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar categoría" />
          </SelectTrigger>
          <SelectContent>
            {loadingCategorias ? (
              <SelectItem value="loading" disabled>
                Cargando categorías...
              </SelectItem>
            ) : categorias.length > 0 ? (
              categorias
                .sort((a, b) => a.descripcion.localeCompare(b.descripcion))
                .map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.id.toString()}>
                    {categoria.descripcion}
                    {categoria.grupo_categoria && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({categoria.grupo_categoria})
                      </span>
                    )}
                  </SelectItem>
                ))
            ) : (
              <>
                <SelectItem value="1">Alimentación</SelectItem>
                <SelectItem value="2">Transporte</SelectItem>
                <SelectItem value="3">Servicios</SelectItem>
                <SelectItem value="4">Ocio</SelectItem>
                <SelectItem value="5">Otros</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="movementType">Tipo de Movimiento</Label>
        <Select
          value={movementType}
          onValueChange={(value) =>
            setMovementType(value as "efectivo" | "digital" | "ahorro" | "tarjeta")
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="efectivo">Efectivo</SelectItem>
            <SelectItem value="digital">Digital</SelectItem>
            <SelectItem value="ahorro">Ahorro</SelectItem>
            <SelectItem value="tarjeta">
              <div className="flex items-center">
                <CreditCard className="mr-1 h-4 w-4" />
                Tarjeta
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  )
}
