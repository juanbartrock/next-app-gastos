"use client"

import { useState, useEffect } from "react"
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
import { ArrowDown, ArrowUp, CalendarIcon, CreditCard, Plus, Users, Loader2 } from "lucide-react"
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

// FUNCIONES HELPER PARA FECHAS (DD/MM/YYYY) - Se pueden mover a un archivo utils/date.ts si se usan en múltiples sitios
const parseDDMMYYYY = (dateStr: string): Date | undefined => {
  if (!dateStr) return undefined;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1000 && year < 3000 && day > 0 && day <= 31 && month >= 0 && month < 12) {
      const date = new Date(year, month, day);
      if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
        return date;
      }
    }
  }
  return undefined;
};

const formatDateToDDMMYYYY = (date: Date | undefined): string => {
  if (!date) return "";
  try {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    return "";
  }
};

export function ExpenseForm({ onTransactionAdded }: ExpenseFormProps) {
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [dateStr, setDateStr] = useState<string>(formatDateToDDMMYYYY(new Date()))
  const [transactionType, setTransactionType] = useState<"income" | "expense">("expense")
  const [movementType, setMovementType] = useState<"efectivo" | "digital" | "ahorro" | "tarjeta">("efectivo")
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [selectedGrupoId, setSelectedGrupoId] = useState<string>("personal")
  const [loadingGrupos, setLoadingGrupos] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(false)
  
  // Estados para financiación con tarjeta
  const [cantidadCuotas, setCantidadCuotas] = useState<string>("1")
  const [fechaPrimerPago, setFechaPrimerPago] = useState<Date | undefined>(undefined)
  const [fechaPrimerPagoStr, setFechaPrimerPagoStr] = useState<string>("")
  const [diaPago, setDiaPago] = useState<string>("")

  // Estado para controlar la visibilidad de opciones avanzadas
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false)

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
    setLoading(true)
    
    const form = event.currentTarget
    const formData = new FormData(form)
    
    const concepto = formData.get('concepto')?.toString()
    const monto = amount.replace(/[^0-9]/g, "") // Eliminar todo excepto números
    const categoria = formData.get('categoria')?.toString()
    const categoriaId = formData.get('categoriaId')?.toString()

    if (!concepto || !monto || !categoriaId) {
      setError("Por favor, completa todos los campos")
      setLoading(false)
      return
    }

    // Validar campos de financiación si es tarjeta
    if (movementType === "tarjeta") {
      if (!cantidadCuotas || parseInt(cantidadCuotas) < 1) {
        setError("Por favor, ingresa una cantidad válida de cuotas")
        setLoading(false)
        return
      }
    }

    const parsedFechaPrimerPago = parseDDMMYYYY(fechaPrimerPagoStr);
    if (movementType === "tarjeta" && fechaPrimerPagoStr && !parsedFechaPrimerPago) {
      setError("Formato de Fecha del Primer Pago inválido. Usar DD/MM/YYYY");
      setLoading(false);
      return;
    }

    const parsedDate = parseDDMMYYYY(dateStr);
    if (!parsedDate) { // La fecha principal es obligatoria
        setError("Formato de Fecha de transacción inválido. Usar DD/MM/YYYY");
        setLoading(false);
        return;
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
          fecha: parsedDate,
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
          fechaPrimerPago: parsedFechaPrimerPago,
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
              fechaPrimerPago: parsedFechaPrimerPago,
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
      const today = new Date()
      setDate(today)
      setDateStr(formatDateToDDMMYYYY(today))
      setTransactionType("expense")
      setMovementType("efectivo")
      setSelectedGrupoId("personal")
      setCantidadCuotas("1")
      setFechaPrimerPago(undefined)
      setFechaPrimerPagoStr("")
      setDiaPago("")
      setSuccess(true)
      
      onTransactionAdded()
      
      setTimeout(() => {
        setSuccess(false)
      }, 3000)
      
    } catch (error) {
      console.error('Error:', error)
      setError("Error al crear el registro. Por favor, intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm dark:bg-red-900/50 dark:text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-md bg-green-50 text-green-600 text-sm dark:bg-green-900/50 dark:text-green-200">
          Transacción guardada correctamente
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
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
              {currency === 'ARS' ? '$' : 'US$'}
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
          <Label htmlFor="movementType">Tipo de Movimiento</Label>
          <Select 
            value={movementType} 
            onValueChange={(value) => setMovementType(value as "efectivo" | "digital" | "ahorro" | "tarjeta")}
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

        {/* Botón para mostrar/ocultar opciones avanzadas */}
        <Button 
          type="button" 
          variant="outline" 
          className="w-full flex items-center justify-center"
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
        >
          {showAdvancedOptions ? "Ocultar opciones avanzadas" : "Mostrar opciones avanzadas"}
          <Plus className={`ml-2 h-4 w-4 transition-transform ${showAdvancedOptions ? "rotate-45" : ""}`} />
        </Button>

        {/* Contenido visible siempre */}
        <div className={`space-y-4 ${showAdvancedOptions ? "" : "hidden"}`}>
          <div className="space-y-2">
            <Label htmlFor="date">Fecha (DD/MM/YYYY)</Label>
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
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar"
          )}
        </Button>
      </form>
    </div>
  )
} 