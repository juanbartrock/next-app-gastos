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
import { ArrowDown, ArrowUp, CalendarIcon, CreditCard, Plus, Loader2, RefreshCw } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { useCurrency } from "@/contexts/CurrencyContext"
import { parseDDMMYYYY, formatDateToDDMMYYYY } from "@/lib/transactions/date-utils"
import { normalizeAmountInput, formatAmountFromDigits, amountDigitsToNumber } from "@/lib/transactions/amount-utils"

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
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [dateStr, setDateStr] = useState<string>(formatDateToDDMMYYYY(new Date()))
  const [fechaImputacion, setFechaImputacion] = useState<Date | undefined>(undefined)
  const [fechaImputacionStr, setFechaImputacionStr] = useState<string>("")
  const [mostrarFechaImputacion, setMostrarFechaImputacion] = useState<boolean>(false)
  const [transactionType, setTransactionType] = useState<"income" | "expense">("expense")
  const [movementType, setMovementType] = useState<"efectivo" | "digital" | "ahorro" | "tarjeta">("efectivo")
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(false)
  
  // Estados para financiación con tarjeta
  const [cantidadCuotas, setCantidadCuotas] = useState<string>("1")
  const [fechaPrimerPago, setFechaPrimerPago] = useState<Date | undefined>(undefined)
  const [fechaPrimerPagoStr, setFechaPrimerPagoStr] = useState<string>("")
  const [diaPago, setDiaPago] = useState<string>("")
  const [tarjetaEspecifica, setTarjetaEspecifica] = useState<string>("")

  // NUEVO: Estados para asociar a gastos recurrentes
  const [gastosRecurrentes, setGastosRecurrentes] = useState<any[]>([])
  const [gastoRecurrenteId, setGastoRecurrenteId] = useState<string>("")
  const [loadingRecurrentes, setLoadingRecurrentes] = useState(false)
  const [gastoRecurrenteSeleccionado, setGastoRecurrenteSeleccionado] = useState<any>(null)

  // Estado para controlar la visibilidad de opciones avanzadas
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false)

  const { currency, formatMoney } = useCurrency()

  // Cargar las categorías
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        setLoadingCategorias(true)
        const response = await fetch("/api/categorias/unificadas")
        if (response.ok) {
          const data = await response.json()
          
          // Usar las categorías unificadas directamente
          setCategorias(data.categorias || [])
        }
      } catch (error) {
        console.error("Error al cargar categorías:", error)
      } finally {
        setLoadingCategorias(false)
      }
    }

    fetchCategorias()
  }, [])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = normalizeAmountInput(e.target.value)
    setAmount(digits ? formatAmountFromDigits(digits, formatMoney) : "")
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setSuccess(false)
    setLoading(true)
    
    const form = event.currentTarget
    const formData = new FormData(form)
    
    const concepto = formData.get('concepto')?.toString()
    const monto = normalizeAmountInput(amount)
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
      if (!tarjetaEspecifica) {
        setError("Por favor, selecciona la tarjeta específica")
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

    // Validar fecha de imputación si se proporciona
    const parsedFechaImputacion = fechaImputacionStr ? parseDDMMYYYY(fechaImputacionStr) : undefined;
    if (fechaImputacionStr && !parsedFechaImputacion) {
      setError("Formato de Fecha de imputación inválido. Usar DD/MM/YYYY");
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
          fechaImputacion: parsedFechaImputacion,
          grupoId: null,
          incluirEnFamilia: true,
          gastoRecurrenteId: gastoRecurrenteId ? parseInt(gastoRecurrenteId) : undefined
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
              diaPago: diaPago ? parseInt(diaPago) : null,
              tarjetaEspecifica: tarjetaEspecifica
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
      setFechaImputacion(undefined)
      setFechaImputacionStr("")
      setMostrarFechaImputacion(false)
      setTransactionType("expense")
      setMovementType("efectivo")
      setCantidadCuotas("1")
      setFechaPrimerPago(undefined)
      setFechaPrimerPagoStr("")
      setDiaPago("")
      setTarjetaEspecifica("")
      setGastoRecurrenteId("")
      setGastoRecurrenteSeleccionado(null)
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

  // Función para cargar gastos recurrentes disponibles
  const fetchGastosRecurrentes = async () => {
    try {
      setLoadingRecurrentes(true)
      const response = await fetch('/api/gastos/recurrentes-disponibles')
      if (response.ok) {
        const data = await response.json()
        setGastosRecurrentes(data)
      }
    } catch (error) {
      console.error('Error al cargar gastos recurrentes:', error)
    } finally {
      setLoadingRecurrentes(false)
    }
  }

  // Cargar gastos recurrentes cuando se monta el componente
  useEffect(() => {
    fetchGastosRecurrentes()
  }, [])

  // Manejar selección de gasto recurrente
  const handleGastoRecurrenteChange = (value: string) => {
    setGastoRecurrenteId(value === "none" ? "" : value)
    if (value && value !== "none") {
      const recurrente = gastosRecurrentes.find(g => g.id.toString() === value)
      setGastoRecurrenteSeleccionado(recurrente)
      
      // Auto-rellenar concepto si no está lleno
      const conceptoInput = document.getElementById('concepto') as HTMLInputElement
      if (!conceptoInput?.value && recurrente) {
        conceptoInput.value = recurrente.concepto
      }
    } else {
      setGastoRecurrenteSeleccionado(null)
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
                categorias
                  .sort((a, b) => a.descripcion.localeCompare(b.descripcion)) // ✅ Ordenamiento alfabético
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

        {/* NUEVO: Selector de Gasto Recurrente */}
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
                <SelectItem value="loading" disabled>Cargando gastos recurrentes...</SelectItem>
              ) : (
                gastosRecurrentes.map((recurrente) => (
                  <SelectItem key={recurrente.id} value={recurrente.id.toString()}>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{recurrente.concepto}</div>
                        {/* Badge de estado */}
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          recurrente.estadoVisual === 'pagado' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                            : recurrente.estadoVisual === 'pago_parcial'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {recurrente.estadoTexto}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ${recurrente.monto.toLocaleString()} total
                        {recurrente.saldoPendiente > 0 && (
                          <span className="ml-1">
                            - ${Math.abs(recurrente.saldoPendiente).toLocaleString()} pendiente
                          </span>
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
          
          {/* Información del gasto recurrente seleccionado */}
          {gastoRecurrenteSeleccionado && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md">
              <div className="text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="font-medium text-blue-900 dark:text-blue-100">
                    {gastoRecurrenteSeleccionado.concepto}
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    gastoRecurrenteSeleccionado.estadoVisual === 'pagado' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                      : gastoRecurrenteSeleccionado.estadoVisual === 'pago_parcial'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {gastoRecurrenteSeleccionado.estadoTexto}
                  </span>
                </div>
                <div className="text-blue-700 dark:text-blue-300 mt-1">
                  Monto total: ${gastoRecurrenteSeleccionado.monto.toLocaleString()}
                </div>
                {gastoRecurrenteSeleccionado.totalPagado > 0 && (
                  <div className="text-blue-700 dark:text-blue-300">
                    Ya pagado: ${gastoRecurrenteSeleccionado.totalPagado.toLocaleString()} 
                    ({gastoRecurrenteSeleccionado.porcentajePagado.toFixed(1)}%)
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
                  {gastoRecurrenteSeleccionado.estadoVisual === 'pagado' ? 
                    ' Útil para facturas adicionales o imponderables.' :
                    ' Actualizará el estado automáticamente.'
                  }
                </div>
              </div>
            </div>
          )}
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
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Día del mes en que se realiza el pago (opcional)
              </p>
            </div>
            
            <div className="pt-2">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Monto por cuota: {cantidadCuotas && amount ? 
                  formatMoney(amountDigitsToNumber(amount) / parseInt(cantidadCuotas)) : 
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

          {/* Checkbox para activar fecha de imputación */}
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

          {/* Campo de fecha de imputación */}
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