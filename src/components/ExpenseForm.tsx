"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useCurrency } from "@/contexts/CurrencyContext"
import { parseDDMMYYYY, formatDateToDDMMYYYY } from "@/lib/transactions/date-utils"
import { normalizeAmountInput, formatAmountFromDigits } from "@/lib/transactions/amount-utils"
import { TransactionBaseFields } from "@/components/transactions/expense-form/TransactionBaseFields"
import { RecurrentExpenseLinkSection } from "@/components/transactions/expense-form/RecurrentExpenseLinkSection"
import { CardFinancingSection } from "@/components/transactions/expense-form/CardFinancingSection"
import { AdvancedDateSection } from "@/components/transactions/expense-form/AdvancedDateSection"
import { Categoria, GastoRecurrente } from "@/components/transactions/expense-form/types"

interface ExpenseFormProps {
  onTransactionAdded: () => void
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
  const [gastosRecurrentes, setGastosRecurrentes] = useState<GastoRecurrente[]>([])
  const [gastoRecurrenteId, setGastoRecurrenteId] = useState<string>("")
  const [loadingRecurrentes, setLoadingRecurrentes] = useState(false)
  const [gastoRecurrenteSeleccionado, setGastoRecurrenteSeleccionado] = useState<GastoRecurrente | null>(null)

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
        <TransactionBaseFields
          transactionType={transactionType}
          setTransactionType={setTransactionType}
          amount={amount}
          handleAmountChange={handleAmountChange}
          currency={currency}
          loadingCategorias={loadingCategorias}
          categorias={categorias}
          movementType={movementType}
          setMovementType={setMovementType}
        />

        <RecurrentExpenseLinkSection
          gastoRecurrenteId={gastoRecurrenteId}
          handleGastoRecurrenteChange={handleGastoRecurrenteChange}
          loadingRecurrentes={loadingRecurrentes}
          gastosRecurrentes={gastosRecurrentes}
          gastoRecurrenteSeleccionado={gastoRecurrenteSeleccionado}
        />

        <CardFinancingSection
          movementType={movementType}
          tarjetaEspecifica={tarjetaEspecifica}
          setTarjetaEspecifica={setTarjetaEspecifica}
          cantidadCuotas={cantidadCuotas}
          setCantidadCuotas={setCantidadCuotas}
          fechaPrimerPagoStr={fechaPrimerPagoStr}
          setFechaPrimerPagoStr={setFechaPrimerPagoStr}
          diaPago={diaPago}
          setDiaPago={setDiaPago}
          amount={amount}
          formatMoney={formatMoney}
        />

        <AdvancedDateSection
          showAdvancedOptions={showAdvancedOptions}
          setShowAdvancedOptions={setShowAdvancedOptions}
          dateStr={dateStr}
          setDateStr={setDateStr}
          setDate={setDate}
          mostrarFechaImputacion={mostrarFechaImputacion}
          setMostrarFechaImputacion={setMostrarFechaImputacion}
          fechaImputacionStr={fechaImputacionStr}
          setFechaImputacionStr={setFechaImputacionStr}
          setFechaImputacion={setFechaImputacion}
        />

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