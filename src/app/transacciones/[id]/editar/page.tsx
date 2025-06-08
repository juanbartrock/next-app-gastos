"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDown, ArrowUp, CalendarIcon, CreditCard, Loader2, ArrowLeft, RefreshCw } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { useCurrency } from "@/contexts/CurrencyContext"

interface Categoria {
  id: number;
  descripcion: string;
  grupo_categoria: string | null;
  status: boolean;
}

interface GastoData {
  id: number;
  concepto: string;
  monto: number;
  fecha: string;
  fechaImputacion?: string;
  categoria: string;
  categoriaId?: number;
  tipoTransaccion: string;
  tipoMovimiento: string;
  incluirEnFamilia: boolean;
  gastoRecurrenteId?: number;
  categoriaRel?: Categoria;
}

// FUNCIONES HELPER PARA FECHAS (DD/MM/YYYY)
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

const formatDateToDDMMYYYY = (date: Date | string | undefined): string => {
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

export default function EditarTransaccionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const { formatMoney } = useCurrency()

  // Estados del formulario
  const [gasto, setGasto] = useState<GastoData | null>(null)
  const [amount, setAmount] = useState("")
  const [concepto, setConcepto] = useState("")
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("")
  const [dateStr, setDateStr] = useState("")
  const [fechaImputacionStr, setFechaImputacionStr] = useState("")
  const [mostrarFechaImputacion, setMostrarFechaImputacion] = useState(false)
  const [transactionType, setTransactionType] = useState<"income" | "expense">("expense")
  const [movementType, setMovementType] = useState<"efectivo" | "digital" | "ahorro" | "tarjeta">("efectivo")
  const [incluirEnFamilia, setIncluirEnFamilia] = useState(true)

  // Estados de carga
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(false)
  const [error, setError] = useState<string>("")

  // NUEVO: Estados para gastos recurrentes
  const [gastosRecurrentes, setGastosRecurrentes] = useState<any[]>([])
  const [gastoRecurrenteId, setGastoRecurrenteId] = useState<string>("")
  const [loadingRecurrentes, setLoadingRecurrentes] = useState(false)
  const [gastoRecurrenteSeleccionado, setGastoRecurrenteSeleccionado] = useState<any>(null)

  // Cargar categorías
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        setLoadingCategorias(true)
        const response = await fetch("/api/categorias/familiares")
                  if (response.ok) {
            const data = await response.json()
            // Combinar categorías genéricas y familiares
            const todasLasCategorias = [
              ...(data.categoriasGenericas || []),
              ...(data.categoriasFamiliares || [])
            ]
            setCategorias(todasLasCategorias)
        }
      } catch (error) {
        console.error("Error al cargar categorías:", error)
      } finally {
        setLoadingCategorias(false)
      }
    }

    fetchCategorias()
  }, [])

  // NUEVO: Función para cargar gastos recurrentes disponibles
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

  // NUEVO: Cargar gastos recurrentes cuando se monta el componente
  useEffect(() => {
    fetchGastosRecurrentes()
  }, [])

  // NUEVO: Cargar información del gasto recurrente seleccionado cuando cambia
  useEffect(() => {
    if (gastoRecurrenteId && gastoRecurrenteId !== "none" && gastosRecurrentes.length > 0) {
      const recurrente = gastosRecurrentes.find(g => g.id.toString() === gastoRecurrenteId)
      setGastoRecurrenteSeleccionado(recurrente)
    } else {
      setGastoRecurrenteSeleccionado(null)
    }
  }, [gastoRecurrenteId, gastosRecurrentes])

  // NUEVO: Manejar selección de gasto recurrente
  const handleGastoRecurrenteChange = (value: string) => {
    setGastoRecurrenteId(value === "none" ? "" : value)
    if (value && value !== "none") {
      const recurrente = gastosRecurrentes.find(g => g.id.toString() === value)
      setGastoRecurrenteSeleccionado(recurrente)
    } else {
      setGastoRecurrenteSeleccionado(null)
    }
  }

  // Cargar datos del gasto
  useEffect(() => {
    if (session && params.id) {
      const fetchGasto = async () => {
        try {
          setLoadingData(true)
          const response = await fetch(`/api/gastos/${params.id}`)
          if (response.ok) {
            const data: GastoData = await response.json()
            setGasto(data)
            
            // Llenar el formulario con los datos existentes
            setConcepto(data.concepto)
            setAmount(formatMoney(data.monto))
            setDateStr(formatDateToDDMMYYYY(data.fecha))
            setFechaImputacionStr(data.fechaImputacion ? formatDateToDDMMYYYY(data.fechaImputacion) : "")
            setMostrarFechaImputacion(!!data.fechaImputacion)
            setTransactionType(data.tipoTransaccion as "income" | "expense")
            setMovementType(data.tipoMovimiento as "efectivo" | "digital" | "ahorro" | "tarjeta")
            setIncluirEnFamilia(data.incluirEnFamilia)
            setCategoriaSeleccionada(data.categoriaId?.toString() || "")
            
            // NUEVO: Establecer gasto recurrente asociado si existe
            if (data.gastoRecurrenteId) {
              setGastoRecurrenteId(data.gastoRecurrenteId.toString())
            } else {
              setGastoRecurrenteId("")
            }
          } else {
            toast.error("Error al cargar los datos de la transacción")
            router.push("/transacciones/nuevo")
          }
        } catch (error) {
          console.error("Error al cargar gasto:", error)
          toast.error("Error al cargar los datos")
          router.push("/transacciones/nuevo")
        } finally {
          setLoadingData(false)
        }
      }

      fetchGasto()
    }
  }, [session, params.id, router, formatMoney])

  const formatAmount = (value: string) => {
    const numbers = value.replace(/\D/g, "")
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
    setLoading(true)

    if (!concepto || !amount || !categoriaSeleccionada) {
      setError("Por favor, completa todos los campos obligatorios")
      setLoading(false)
      return
    }

    // Validar fechas
    const parsedDate = parseDDMMYYYY(dateStr);
    if (!parsedDate) {
      setError("Formato de Fecha de transacción inválido. Usar DD/MM/YYYY");
      setLoading(false);
      return;
    }

    const parsedFechaImputacion = fechaImputacionStr ? parseDDMMYYYY(fechaImputacionStr) : undefined;
    if (fechaImputacionStr && !parsedFechaImputacion) {
      setError("Formato de Fecha de imputación inválido. Usar DD/MM/YYYY");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/gastos/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          concepto,
          monto: Number(amount.replace(/[^0-9]/g, "")) / 100,
          categoriaId: parseInt(categoriaSeleccionada),
          tipoTransaccion: transactionType,
          tipoMovimiento: movementType,
          fecha: parsedDate.toISOString(),
          fechaImputacion: parsedFechaImputacion?.toISOString(),
          incluirEnFamilia,
          gastoRecurrenteId: gastoRecurrenteId ? parseInt(gastoRecurrenteId) : undefined
        }),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar la transacción')
      }

      toast.success("Transacción actualizada correctamente")
      router.push("/transacciones/nuevo")
    } catch (error) {
      console.error('Error:', error)
      setError("Error al actualizar la transacción. Por favor, intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loadingData) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="p-6">
            <p>Debes iniciar sesión para editar transacciones.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Transacción</h1>
          <p className="text-muted-foreground">
            Modifica los datos de la transacción seleccionada
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos de la Transacción</CardTitle>
          <CardDescription>
            Edita los campos que desees modificar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm dark:bg-red-900/50 dark:text-red-200 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de Transacción */}
            <div className="space-y-2">
              <Label>Tipo de Transacción</Label>
              <RadioGroup
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

            {/* Concepto */}
            <div className="space-y-2">
              <Label htmlFor="concepto">Concepto</Label>
              <Input
                id="concepto"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder="Ej: Supermercado"
                required
              />
            </div>

            {/* Monto */}
            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  id="amount"
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  className="pl-8"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Categoría */}
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Select value={categoriaSeleccionada} onValueChange={setCategoriaSeleccionada}>
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
                    <SelectItem value="1" disabled>No hay categorías disponibles</SelectItem>
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
                          <div className="font-medium">{recurrente.concepto}</div>
                          <div className="text-xs text-muted-foreground">
                            ${recurrente.monto.toLocaleString()} - ${recurrente.saldoPendiente.toLocaleString()} pendiente
                            {recurrente.porcentajePagado > 0 && (
                              <span className="ml-1 text-amber-600">
                                ({recurrente.porcentajePagado.toFixed(1)}% pagado)
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
                    <div className="font-medium text-blue-900 dark:text-blue-100">
                      {gastoRecurrenteSeleccionado.concepto}
                    </div>
                    <div className="text-blue-700 dark:text-blue-300 mt-1">
                      Monto total: ${gastoRecurrenteSeleccionado.monto.toLocaleString()}
                    </div>
                    <div className="text-blue-700 dark:text-blue-300">
                      Saldo pendiente: ${gastoRecurrenteSeleccionado.saldoPendiente.toLocaleString()}
                    </div>
                    {gastoRecurrenteSeleccionado.porcentajePagado > 0 && (
                      <div className="text-amber-700 dark:text-amber-300">
                        Ya pagado: {gastoRecurrenteSeleccionado.porcentajePagado.toFixed(1)}%
                      </div>
                    )}
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      💡 Este pago se asociará al gasto recurrente y actualizará su estado automáticamente
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tipo de Movimiento */}
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

            {/* Fecha de transacción */}
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha de depósito/transacción (DD/MM/YYYY)</Label>
              <Input
                type="text"
                id="fecha"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                placeholder="DD/MM/YYYY"
              />
            </div>

            {/* Checkbox para fecha de imputación */}
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
                  onChange={(e) => setFechaImputacionStr(e.target.value)}
                  placeholder="DD/MM/YYYY"
                />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  <strong>Ejemplo:</strong> Salario depositado el 31/05/2024 pero corresponde a junio → usar 01/06/2024 como fecha de imputación
                </p>
              </div>
            )}

            {/* Incluir en familia */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="incluirEnFamilia"
                checked={incluirEnFamilia}
                onChange={(e) => setIncluirEnFamilia(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <Label htmlFor="incluirEnFamilia" className="cursor-pointer">
                Incluir en gastos familiares
              </Label>
            </div>

            {/* Botones */}
            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 