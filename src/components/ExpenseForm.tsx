"use client"

import { useState, useEffect } from "react"
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
import { ArrowDown, ArrowUp, CalendarIcon, CreditCard, Plus, Users } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { useCurrency } from "@/contexts/CurrencyContext"

interface Grupo {
  id: string;
  nombre: string;
}

interface ExpenseFormProps {
  onTransactionAdded: () => void
}

// Nueva interfaz para categorías
interface Categoria {
  id: number;
  descripcion: string;
  grupo_categoria: string | null;
  status: boolean;
}

export function ExpenseForm({ onTransactionAdded }: ExpenseFormProps) {
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState<Date>()
  const [transactionType, setTransactionType] = useState<"income" | "expense">("expense")
  const [movementType, setMovementType] = useState<"efectivo" | "digital" | "ahorro" | "tarjeta">("efectivo")
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<boolean>(false)
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [selectedGrupoId, setSelectedGrupoId] = useState<string>("personal")
  const [loadingGrupos, setLoadingGrupos] = useState(false)
  // Nuevo estado para categorías
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(false)
  
  // Estados para financiación con tarjeta
  const [cantidadCuotas, setCantidadCuotas] = useState<string>("1")
  const [fechaPrimerPago, setFechaPrimerPago] = useState<Date | undefined>(undefined)
  const [diaPago, setDiaPago] = useState<string>("")

  const { currency, formatMoney } = useCurrency()

  // Cargar los grupos del usuario
  useEffect(() => {
    const fetchGrupos = async () => {
      try {
        setLoadingGrupos(true)
        const response = await fetch("/api/grupos")
        if (response.ok) {
          const data = await response.json()
          setGrupos(data)
        }
      } catch (error) {
        console.error("Error al cargar grupos:", error)
      } finally {
        setLoadingGrupos(false)
      }
    }

    fetchGrupos()
  }, [])

  // Cargar las categorías
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        setLoadingCategorias(true)
        const response = await fetch("/api/categorias")
        if (response.ok) {
          const data = await response.json()
          setCategorias(data)
        }
      } catch (error) {
        console.error("Error al cargar categorías:", error)
      } finally {
        setLoadingCategorias(false)
      }
    }

    fetchCategorias()
  }, [])

  // Función para formatear el monto con el formato requerido
  const formatAmount = (value: string) => {
    // Eliminar todo excepto números
    const numbers = value.replace(/\D/g, "")

    // Convertir a número y formatear con el contexto de moneda
    const amountNumber = Number(numbers) / 100
    return formatMoney(amountNumber)
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
    const categoriaId = formData.get('categoriaId')?.toString()

    if (!concepto || !monto || !categoriaId) {
      setError("Por favor, completa todos los campos")
      return
    }

    // Validar campos de financiación si es tarjeta
    if (movementType === "tarjeta") {
      if (!cantidadCuotas || parseInt(cantidadCuotas) < 1) {
        setError("Por favor, ingresa una cantidad válida de cuotas")
        return
      }
    }

    try {
      // Crear el gasto
      const response = await fetch('/api/gastos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          concepto,
          monto: Number(monto) / 100,
          categoria,
          categoriaId: parseInt(categoriaId),
          tipoTransaccion: transactionType,
          tipoMovimiento: movementType,
          fecha: date || new Date(),
          grupoId: selectedGrupoId === "personal" ? null : selectedGrupoId
        }),
      })

      if (!response.ok) {
        throw new Error('Error al crear el registro')
      }

      const data = await response.json()
      console.log('Registro creado:', data)
      
      // Si es tarjeta, crear la financiación
      if (movementType === "tarjeta") {
        const montoTotal = Number(monto) / 100
        const montoCuota = montoTotal / parseInt(cantidadCuotas)
        
        console.log('Creando financiación con datos:', {
          gastoId: data.id,
          cantidadCuotas: parseInt(cantidadCuotas),
          montoCuota,
          fechaPrimerPago: fechaPrimerPago ? new Date(fechaPrimerPago).toISOString() : null,
          diaPago: diaPago ? parseInt(diaPago) : null
        })
        
        try {
          const financiacionResponse = await fetch('/api/financiacion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              gastoId: data.id,
              cantidadCuotas: parseInt(cantidadCuotas),
              montoCuota,
              fechaPrimerPago: fechaPrimerPago ? new Date(fechaPrimerPago).toISOString() : null,
              diaPago: diaPago ? parseInt(diaPago) : null
            }),
          })
          
          if (!financiacionResponse.ok) {
            const errorText = await financiacionResponse.text()
            console.error('Error al crear financiación. Status:', financiacionResponse.status, 'Response:', errorText)
            try {
              const errorJson = JSON.parse(errorText)
              toast.error(`Error: ${errorJson.error || errorJson.details || 'Error al crear la financiación'}`)
            } catch {
              toast.error(`Error (${financiacionResponse.status}): ${errorText || 'Error al crear la financiación'}`)
            }
          } else {
            const financiacionData = await financiacionResponse.json()
            console.log('Financiación creada:', financiacionData)
            toast.success("Gasto y financiación registrados correctamente")
          }
        } catch (error) {
          console.error('Error de red al crear financiación:', error)
          toast.error("Error de conexión al crear la financiación")
        }
      } else {
        toast.success("Transacción registrada correctamente")
      }
      
      // Resetear formulario
      form.reset()
      setAmount("")
      setDate(undefined)
      setTransactionType("expense")
      setMovementType("efectivo")
      setSelectedGrupoId("personal")
      setCantidadCuotas("1")
      setFechaPrimerPago(undefined)
      setDiaPago("")
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
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 text-center">Nuevo Registro</h3>

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
            type="text"
            placeholder="$0,00"
            value={amount}
            onChange={handleAmountChange}
            autoComplete="off"
            autoFocus
            className={amount ? "border-green-500 dark:border-green-600" : ""}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Ingrese el monto en pesos argentinos (ARS). La visualización en otra moneda es solo informativa.
          </p>
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
          <Label htmlFor="categoriaId">Categoría</Label>
          <Select name="categoriaId">
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              {loadingCategorias ? (
                <SelectItem value="loading" disabled>Cargando categorías...</SelectItem>
              ) : categorias.length > 0 ? (
                categorias.map((categoria) => (
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
                  <SelectItem value="alimentacion">Alimentación</SelectItem>
                  <SelectItem value="transporte">Transporte</SelectItem>
                  <SelectItem value="servicios">Servicios</SelectItem>
                  <SelectItem value="ocio">Ocio</SelectItem>
                  <SelectItem value="otros">Otros</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Fecha</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? (
                  format(date, 'PPP', { locale: es })
                ) : (
                  <span>Seleccionar fecha</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>

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
          <Label>Tipo de Movimiento</Label>
          <RadioGroup
            defaultValue="efectivo"
            value={movementType}
            onValueChange={(value) => setMovementType(value as "efectivo" | "digital" | "ahorro" | "tarjeta")}
            className="flex flex-wrap"
          >
            <div className="flex items-center space-x-2 mr-4 mb-2">
              <RadioGroupItem value="efectivo" id="efectivo" />
              <Label htmlFor="efectivo">Efectivo</Label>
            </div>
            <div className="flex items-center space-x-2 mr-4 mb-2">
              <RadioGroupItem value="digital" id="digital" />
              <Label htmlFor="digital">Digital</Label>
            </div>
            <div className="flex items-center space-x-2 mr-4 mb-2">
              <RadioGroupItem value="ahorro" id="ahorro" />
              <Label htmlFor="ahorro">Ahorro</Label>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value="tarjeta" id="tarjeta" />
              <Label htmlFor="tarjeta" className="flex items-center">
                <CreditCard className="mr-1 h-4 w-4" />
                Tarjeta
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Campos adicionales para financiación con tarjeta */}
        {movementType === "tarjeta" && (
          <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Detalles de Financiación</h4>
            
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
              <Label htmlFor="fechaPrimerPago">Fecha del Primer Pago</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaPrimerPago ? (
                      format(fechaPrimerPago, 'PPP', { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={fechaPrimerPago}
                    onSelect={setFechaPrimerPago}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
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
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Día del mes en que se realiza el pago (opcional)
              </p>
            </div>
            
            <div className="pt-2">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Monto por cuota: {cantidadCuotas && amount ? 
                  formatAmount((parseInt(amount.replace(/[^0-9]/g, "")) / parseInt(cantidadCuotas)).toString()) : 
                  formatMoney(0)}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Grupo (opcional)</Label>
          <Select value={selectedGrupoId} onValueChange={setSelectedGrupoId}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar grupo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">Personal (sin grupo)</SelectItem>
              {loadingGrupos ? (
                <SelectItem value="loading" disabled>Cargando grupos...</SelectItem>
              ) : (
                grupos.map((grupo) => (
                  <SelectItem key={grupo.id} value={grupo.id}>
                    {grupo.nombre}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" className="w-full">
          Guardar
        </Button>
      </form>
    </div>
  )
} 