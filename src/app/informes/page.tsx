"use client"

import { useState, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useCurrency } from "@/contexts/CurrencyContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { 
  FileBarChart, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Users, 
  AlertCircle, 
  Shield,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  DollarSign,
  PieChart,
  Clock,
  Star,
  Sparkles,
  BarChart3,
  Settings,
  RotateCcw,
  EyeOff
} from "lucide-react"
import { format, addMonths, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

interface InformeData {
  resumen: {
    mes: string
    totalIngresos: number
    totalEgresos: number
    balance: number
    cantidadIngresos: number
    cantidadEgresos: number
    cantidadProximosPagos: number
    montoProximosPagos: number
  }
  movimientos: {
    ingresos: any[]
    egresos: any[]
    totalIngresos: number
    totalEgresos: number
    porUsuario: Array<{
      usuario: { id: string, name: string }
      ingresos: any[]
      egresos: any[]
      totalIngresos: number
      totalEgresos: number
      balance: number
      cantidadMovimientos: number
    }>
  }
  gastosDiarios: Array<{
    fecha: string
    fechaCompleta: string
    monto: number
  }>
  proximosPagos: Array<{
    id: number
    concepto: string
    monto: number
    periodicidad: string
    proximaFecha: string
    estado: string
    user: { name: string }
    categoria: { descripcion: string } | null
    totalPagado: number
    saldoPendiente: number
    porcentajePagado: number
    diasHastaVencimiento: number | null
  }>
  filtros?: {
    categorias: string[]
    estadisticasGastos: {
      minimo: number
      maximo: number
      promedio: number
    }
  }
}

export default function InformesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { formatMoney } = useCurrency()

  const [data, setData] = useState<InformeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mesSeleccionado, setMesSeleccionado] = useState(() => {
    const hoy = new Date()
    return format(hoy, 'yyyy-MM')
  })

  // Estados para filtros de gastos diarios basados en el dashboard
  const [showFilters, setShowFilters] = useState(false)
  const [categoryFilters, setCategoryFilters] = useState<Array<{
    name: string
    visible: boolean
    value: number
    percentage: number
  }>>([])
  const [autoHideByPercentage, setAutoHideByPercentage] = useState(false)
  const [minPercentage, setMinPercentage] = useState([0])
  const [maxPercentage, setMaxPercentage] = useState([100])

  // Redireccionar si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Cargar datos de informes
  const cargarInformes = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('Cargando informes para mes:', mesSeleccionado) // Debug

      const response = await fetch(`/api/informes/familiares?mes=${mesSeleccionado}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al cargar informes')
      }

      const result = await response.json()
      console.log('Informes cargados para mes:', result.data?.resumen?.mes) // Debug
      setData(result.data)
    } catch (error) {
      console.error('Error al cargar informes:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
      toast.error('Error al cargar los informes familiares')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      cargarInformes()
    }
  }, [status, mesSeleccionado])

  // Efecto para actualizar filtros cuando se cargan los datos
  useEffect(() => {
    if (data?.filtros?.estadisticasGastos) {
      setMinPercentage([0])
      setMaxPercentage([data.filtros.estadisticasGastos.maximo])
    }
  }, [data])

  // Navegación de meses mejorada con validaciones
  const irMesAnterior = () => {
    try {
      const fechaActual = new Date(mesSeleccionado + '-01')
      
      // Validar que la fecha actual sea válida
      if (isNaN(fechaActual.getTime())) {
        console.error('Fecha actual inválida:', mesSeleccionado)
        toast.error('Error: fecha actual inválida')
        return
      }
      
      const mesAnterior = subMonths(fechaActual, 1)
      const nuevoMes = format(mesAnterior, 'yyyy-MM')
      
      console.log('Navegando a mes anterior:', nuevoMes) // Debug
      setMesSeleccionado(nuevoMes)
    } catch (error) {
      console.error('Error al navegar al mes anterior:', error)
      toast.error('Error al cambiar mes')
    }
  }

  const irMesSiguiente = () => {
    try {
      const fechaActual = new Date(mesSeleccionado + '-01')
      
      // Validar que la fecha actual sea válida
      if (isNaN(fechaActual.getTime())) {
        console.error('Fecha actual inválida:', mesSeleccionado)
        toast.error('Error: fecha actual inválida')
        return
      }
      
      const mesSiguiente = addMonths(fechaActual, 1)
      const nuevoMes = format(mesSiguiente, 'yyyy-MM')
      
      // Opcional: Limitar a no navegar más allá del mes actual
      const hoy = new Date()
      const mesActual = format(hoy, 'yyyy-MM')
      
      if (nuevoMes > mesActual) {
        toast.info('No se puede navegar más allá del mes actual')
        return
      }
      
      console.log('Navegando a mes siguiente:', nuevoMes) // Debug
      setMesSeleccionado(nuevoMes)
    } catch (error) {
      console.error('Error al navegar al mes siguiente:', error)
      toast.error('Error al cambiar mes')
    }
  }

  // Función para ir directamente al mes actual
  const irMesActual = () => {
    const hoy = new Date()
    const mesActual = format(hoy, 'yyyy-MM')
    console.log('Navegando al mes actual:', mesActual) // Debug
    setMesSeleccionado(mesActual)
    toast.success('Navegando al mes actual')
  }

  const formatearFecha = (fecha: string) => {
    if (!fecha) return 'Fecha no disponible'
    
    try {
      const fechaObj = new Date(fecha)
      if (isNaN(fechaObj.getTime())) {
        return 'Fecha inválida'
      }
      return format(fechaObj, 'dd/MM/yyyy', { locale: es })
    } catch (error) {
      console.warn('Error al formatear fecha:', fecha, error)
      return 'Fecha inválida'
    }
  }

  // Nueva función para formatear fechas considerando fechaImputacion
  const formatearFechaConImputacion = (transaccion: any) => {
    // Validaciones defensivas para evitar errores de fecha inválida
    if (!transaccion) {
      console.warn('formatearFechaConImputacion: transaccion es null/undefined')
      return {
        fechaPrincipal: 'Fecha no disponible',
        fechaSecundaria: null,
        esImputacion: false
      }
    }

    // Verificar que la transacción tenga al menos una fecha
    if (!transaccion.fecha && !transaccion.fechaImputacion) {
      console.warn('formatearFechaConImputacion: transaccion sin fechas válidas', transaccion)
      return {
        fechaPrincipal: 'Sin fecha',
        fechaSecundaria: null,
        esImputacion: false
      }
    }

    // Función auxiliar para validar fechas
    const esFechaValida = (fecha: any) => {
      if (!fecha) return false
      const fechaObj = new Date(fecha)
      return !isNaN(fechaObj.getTime())
    }

    // Función auxiliar para formatear fecha de forma segura
    const formatearFechaSegura = (fecha: any) => {
      if (!esFechaValida(fecha)) return null
      try {
        return format(new Date(fecha), 'dd/MM/yyyy', { locale: es })
      } catch (error) {
        console.warn('Error al formatear fecha:', fecha, error)
        return null
      }
    }

    if (transaccion.fechaImputacion && esFechaValida(transaccion.fechaImputacion)) {
      const fechaImputacion = formatearFechaSegura(transaccion.fechaImputacion)
      const fechaOriginal = formatearFechaSegura(transaccion.fecha)
      
      // Si no se pudo formatear la fecha de imputación, usar la original
      if (!fechaImputacion) {
        return {
          fechaPrincipal: fechaOriginal || 'Fecha inválida',
          fechaSecundaria: null,
          esImputacion: false
        }
      }
      
      // Si las fechas son diferentes y ambas son válidas, mostrar ambas
      if (fechaOriginal && fechaImputacion !== fechaOriginal) {
        return {
          fechaPrincipal: fechaImputacion,
          fechaSecundaria: fechaOriginal,
          esImputacion: true
        }
      } else {
        return {
          fechaPrincipal: fechaImputacion,
          fechaSecundaria: null,
          esImputacion: true
        }
      }
    } else {
      // Si no hay fechaImputacion o es inválida, usar fecha normal
      const fechaNormal = formatearFechaSegura(transaccion.fecha)
      return {
        fechaPrincipal: fechaNormal || 'Fecha inválida',
        fechaSecundaria: null,
        esImputacion: false
      }
    }
  }

  const formatearFechaRelativa = (fecha: string) => {
    if (!fecha) return 'Fecha no disponible'
    
    try {
      const fechaObj = new Date(fecha)
      if (isNaN(fechaObj.getTime())) {
        return 'Fecha inválida'
      }
      
      const ahora = new Date()
      const diferenciaDias = Math.ceil((fechaObj.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diferenciaDias < 0) {
        return `Hace ${Math.abs(diferenciaDias)} día${Math.abs(diferenciaDias) !== 1 ? 's' : ''}`
      } else if (diferenciaDias === 0) {
        return 'Hoy'
      } else if (diferenciaDias === 1) {
        return 'Mañana'
      } else {
        return `En ${diferenciaDias} día${diferenciaDias !== 1 ? 's' : ''}`
      }
    } catch (error) {
      console.warn('Error al formatear fecha relativa:', fecha, error)
      return 'Fecha inválida'
    }
  }

  // Función para filtrar gastos diarios
  const gastosDiariosFiltrados = useMemo(() => {
    if (!data?.gastosDiarios) return []
    
    return data.gastosDiarios.filter(gasto => {
      // Filtro por monto
      const pasaFiltroMonto = gasto.monto >= minPercentage[0] && gasto.monto <= maxPercentage[0]
      
      // Para categorías, como los datos diarios están agregados, solo aplicamos filtro de monto
      // El filtro de categoría se puede implementar más adelante con datos más detallados
      
      return pasaFiltroMonto
    })
  }, [data?.gastosDiarios, minPercentage, maxPercentage])

  // Función para resetear filtros
  const resetearFiltros = () => {
    setMinPercentage([0])
    if (data?.filtros?.estadisticasGastos) {
      setMaxPercentage([data.filtros.estadisticasGastos.maximo])
    } else {
      setMaxPercentage([100000])
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="relative">
              <RefreshCw className="h-12 w-12 text-blue-500 animate-spin mx-auto" />
              <Sparkles className="h-6 w-6 text-purple-400 absolute -top-2 -right-2 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                Cargando Informes Familiares
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Preparando análisis financiero...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-red-900 dark:to-pink-900">
        <div className="container mx-auto p-6">
          <Alert variant="destructive" className="max-w-2xl mx-auto mt-20 border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription className="ml-2">
              {error === 'No tienes permisos de administrador familiar para ver estos informes' ? (
                <div className="space-y-3">
                  <div className="font-semibold text-red-800 dark:text-red-200">
                    🔒 Acceso Restringido
                  </div>
                  <p className="text-red-700 dark:text-red-300">
                    Solo los administradores familiares pueden acceder a esta sección de informes. 
                    Contacta al administrador de tu grupo familiar para obtener los permisos necesarios.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="font-semibold text-red-800 dark:text-red-200">
                    ⚠️ Error de Carga
                  </div>
                  <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto p-6">
          <Alert className="max-w-2xl mx-auto mt-20 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <AlertDescription className="ml-2 text-blue-800 dark:text-blue-200">
              <div className="space-y-2">
                <div className="font-semibold">📊 Sin Datos Disponibles</div>
                <p>No se pudieron cargar los datos de informes.</p>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header con gradiente espectacular */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-10 dark:opacity-20 rounded-3xl"></div>
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <FileBarChart className="h-8 w-8 text-white" />
                  </div>
                  <Star className="h-5 w-5 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Informes Familiares
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 text-lg mt-2">
                    Análisis completo de movimientos y gastos del grupo familiar
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 border-green-300 dark:border-green-700">
                <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-300 font-medium">Administrador Familiar</span>
              </Badge>
            </div>
          </div>
        </div>

        {/* Control de mes mejorado */}
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="h-10 w-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                Período de Análisis
              </CardTitle>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={irMesAnterior}
                  className="hover:bg-blue-50 dark:hover:bg-blue-900 border-blue-300 hover:border-blue-400 transition-all duration-200"
                >
                  <ChevronLeft className="h-4 w-4 text-blue-600" />
                </Button>
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-bold text-lg shadow-md relative">
                  {data?.resumen?.mes || format(new Date(mesSeleccionado + '-01'), 'MMMM yyyy', { locale: es })}
                  {mesSeleccionado === format(new Date(), 'yyyy-MM') && (
                    <div className="absolute -top-1 -right-1">
                      <div className="h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={irMesSiguiente}
                  className="hover:bg-blue-50 dark:hover:bg-blue-900 border-blue-300 hover:border-blue-400 transition-all duration-200"
                >
                  <ChevronRight className="h-4 w-4 text-blue-600" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={irMesActual}
                  className="hover:bg-green-50 dark:hover:bg-green-900 border-green-300 hover:border-green-400 transition-all duration-200"
                  title="Ir al mes actual"
                >
                  <Calendar className="h-4 w-4 text-green-600" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Resumen general con cards espectaculares */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Ingresos */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/90">💰 Ingresos</CardTitle>
              <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white mb-1">
                {formatMoney(data.resumen.totalIngresos)}
              </div>
              <p className="text-xs text-white/80">
                {data.resumen.cantidadIngresos} movimiento{data.resumen.cantidadIngresos !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          {/* Gastos */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-red-400 to-pink-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/90">💸 Gastos</CardTitle>
              <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white mb-1">
                {formatMoney(data.resumen.totalEgresos)}
              </div>
              <p className="text-xs text-white/80">
                {data.resumen.cantidadEgresos} movimiento{data.resumen.cantidadEgresos !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          {/* Balance */}
          <Card className={`relative overflow-hidden ${data.resumen.balance >= 0 
            ? 'bg-gradient-to-br from-blue-400 to-cyan-600' 
            : 'bg-gradient-to-br from-orange-400 to-red-500'} text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105`}>
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/90">⚖️ Balance</CardTitle>
              <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                {data.resumen.balance >= 0 ? <TrendingUp className="h-5 w-5 text-white" /> : <TrendingDown className="h-5 w-5 text-white" />}
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white mb-1">
                {formatMoney(data.resumen.balance)}
              </div>
              <p className="text-xs text-white/80">
                {data.resumen.balance >= 0 ? '✅ Superávit' : '⚠️ Déficit'}
              </p>
            </CardContent>
          </Card>

          {/* Próximos Pagos */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-purple-400 to-indigo-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/90">⏰ Próximos Pagos</CardTitle>
              <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white mb-1">
                {data.resumen.cantidadProximosPagos}
              </div>
              <p className="text-xs text-white/80">
                {formatMoney(data.resumen.montoProximosPagos)} pendientes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contenido principal con tabs mejorados */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
          <Tabs defaultValue="movimientos" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 p-1 rounded-xl">
              <TabsTrigger 
                value="movimientos" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md rounded-lg transition-all duration-200"
              >
                <Users className="h-4 w-4" />
                Movimientos Familiares
              </TabsTrigger>
              <TabsTrigger 
                value="gastos-diarios"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-md rounded-lg transition-all duration-200"
              >
                <BarChart3 className="h-4 w-4" />
                Gastos Diarios
              </TabsTrigger>
              <TabsTrigger 
                value="proximos-pagos"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-md rounded-lg transition-all duration-200"
              >
                <Clock className="h-4 w-4" />
                Próximos Pagos
              </TabsTrigger>
            </TabsList>

            {/* 1. MOVIMIENTOS FAMILIARES */}
            <TabsContent value="movimientos" className="space-y-6">
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    Movimientos de la Familia
                  </CardTitle>
                  <CardDescription className="text-base">
                    Ingresos y egresos familiares de <span className="font-semibold text-blue-600 dark:text-blue-400">{data.resumen.mes}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="egresos" className="space-y-4">
                    <TabsList className="bg-blue-100 dark:bg-blue-900">
                      <TabsTrigger 
                        value="egresos"
                        className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
                      >
                        📉 Egresos ({data.movimientos.egresos.length})
                      </TabsTrigger>
                      <TabsTrigger 
                        value="ingresos"
                        className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
                      >
                        📈 Ingresos ({data.movimientos.ingresos.length})
                      </TabsTrigger>
                      <TabsTrigger 
                        value="por-usuario"
                        className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                      >
                        👥 Por Integrante ({data.movimientos.porUsuario?.length || 0})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="egresos">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900 dark:to-pink-900 rounded-xl">
                          <h4 className="font-semibold text-lg">💸 Total de Egresos</h4>
                          <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                            -{formatMoney(data.movimientos.totalEgresos)}
                          </span>
                        </div>
                        <Separator />
                        <div className="max-h-96 overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-inner">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gray-50 dark:bg-gray-700">
                                <TableHead className="font-semibold">📅 Fecha</TableHead>
                                <TableHead className="font-semibold">📝 Concepto</TableHead>
                                <TableHead className="font-semibold">🏷️ Categoría</TableHead>
                                <TableHead className="font-semibold">👤 Usuario</TableHead>
                                <TableHead className="text-right font-semibold">💰 Monto</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {data.movimientos.egresos.map((egreso) => (
                                <TableRow key={egreso.id} className="hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
                                  <TableCell className="font-medium">
                                    <div className="space-y-1">
                                      <div>{formatearFechaConImputacion(egreso).fechaPrincipal}</div>
                                      {formatearFechaConImputacion(egreso).esImputacion && (
                                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700">
                                          📅 Fecha Imputación
                                        </Badge>
                                      )}
                                      {formatearFechaConImputacion(egreso).fechaSecundaria && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          Original: {formatearFechaConImputacion(egreso).fechaSecundaria}
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-medium">{egreso.concepto}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="bg-gray-100 dark:bg-gray-700">
                                      {egreso.categoriaRel?.descripcion || egreso.categoria}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="secondary">
                                      {egreso.user?.name}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right text-red-600 dark:text-red-400 font-bold text-lg">
                                    -{formatMoney(egreso.monto)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="ingresos">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-xl">
                          <h4 className="font-semibold text-lg">💰 Total de Ingresos</h4>
                          <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                            +{formatMoney(data.movimientos.totalIngresos)}
                          </span>
                        </div>
                        <Separator />
                        <div className="max-h-96 overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-inner">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gray-50 dark:bg-gray-700">
                                <TableHead className="font-semibold">📅 Fecha</TableHead>
                                <TableHead className="font-semibold">📝 Concepto</TableHead>
                                <TableHead className="font-semibold">🏷️ Categoría</TableHead>
                                <TableHead className="font-semibold">👤 Usuario</TableHead>
                                <TableHead className="text-right font-semibold">💰 Monto</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {data.movimientos.ingresos.map((ingreso) => (
                                <TableRow key={ingreso.id} className="hover:bg-green-50 dark:hover:bg-green-950 transition-colors">
                                  <TableCell className="font-medium">
                                    <div className="space-y-1">
                                      <div>{formatearFechaConImputacion(ingreso).fechaPrincipal}</div>
                                      {formatearFechaConImputacion(ingreso).esImputacion && (
                                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700">
                                          📅 Fecha Imputación
                                        </Badge>
                                      )}
                                      {formatearFechaConImputacion(ingreso).fechaSecundaria && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          Original: {formatearFechaConImputacion(ingreso).fechaSecundaria}
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-medium">{ingreso.concepto}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="bg-gray-100 dark:bg-gray-700">
                                      {ingreso.categoriaRel?.descripcion || ingreso.categoria}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="secondary">
                                      {ingreso.user?.name}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right text-green-600 dark:text-green-400 font-bold text-lg">
                                    +{formatMoney(ingreso.monto)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="por-usuario">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-xl">
                          <h4 className="font-semibold text-lg">👥 Movimientos por Integrante</h4>
                          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {data.movimientos.porUsuario?.length || 0} integrante{(data.movimientos.porUsuario?.length || 0) !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <Separator />
                        
                        {data.movimientos.porUsuario && data.movimientos.porUsuario.length > 0 ? (
                          <div className="grid gap-6">
                            {data.movimientos.porUsuario.map((userMovimientos) => (
                              <Card key={userMovimientos.usuario.id} className="bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800">
                                <CardHeader className="pb-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                                        <Users className="h-6 w-6 text-white" />
                                      </div>
                                      <div>
                                        <CardTitle className="text-lg">{userMovimientos.usuario.name}</CardTitle>
                                        <CardDescription>{userMovimientos.cantidadMovimientos} movimiento{userMovimientos.cantidadMovimientos !== 1 ? 's' : ''}</CardDescription>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className={`text-2xl font-bold ${userMovimientos.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {userMovimientos.balance >= 0 ? '+' : ''}{formatMoney(userMovimientos.balance)}
                                      </div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        Balance neto
                                      </div>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    {/* Ingresos del usuario */}
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                      <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        <span className="font-semibold text-green-700 dark:text-green-300">Ingresos</span>
                                      </div>
                                      <div className="text-xl font-bold text-green-600 dark:text-green-400">
                                        +{formatMoney(userMovimientos.totalIngresos)}
                                      </div>
                                      <div className="text-sm text-green-600 dark:text-green-400">
                                        {userMovimientos.ingresos.length} movimiento{userMovimientos.ingresos.length !== 1 ? 's' : ''}
                                      </div>
                                    </div>
                                    
                                    {/* Egresos del usuario */}
                                    <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950 p-4 rounded-lg border border-red-200 dark:border-red-800">
                                      <div className="flex items-center gap-2 mb-2">
                                        <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                                        <span className="font-semibold text-red-700 dark:text-red-300">Egresos</span>
                                      </div>
                                      <div className="text-xl font-bold text-red-600 dark:text-red-400">
                                        -{formatMoney(userMovimientos.totalEgresos)}
                                      </div>
                                      <div className="text-sm text-red-600 dark:text-red-400">
                                        {userMovimientos.egresos.length} movimiento{userMovimientos.egresos.length !== 1 ? 's' : ''}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Detalle de movimientos del usuario */}
                                  <Tabs defaultValue="egresos-usuario" className="mt-4">
                                    <TabsList className="grid w-full grid-cols-2">
                                      <TabsTrigger value="egresos-usuario" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700">
                                        💸 Egresos ({userMovimientos.egresos.length})
                                      </TabsTrigger>
                                      <TabsTrigger value="ingresos-usuario" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
                                        💰 Ingresos ({userMovimientos.ingresos.length})
                                      </TabsTrigger>
                                    </TabsList>
                                    
                                    <TabsContent value="egresos-usuario" className="mt-4">
                                      {userMovimientos.egresos.length > 0 ? (
                                        <div className="max-h-64 overflow-y-auto bg-red-50 dark:bg-red-950 rounded-lg p-3">
                                          <Table>
                                            <TableHeader>
                                              <TableRow>
                                                <TableHead className="text-xs">Fecha</TableHead>
                                                <TableHead className="text-xs">Concepto</TableHead>
                                                <TableHead className="text-xs">Categoría</TableHead>
                                                <TableHead className="text-right text-xs">Monto</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {userMovimientos.egresos.map((egreso) => (
                                                <TableRow key={egreso.id} className="hover:bg-red-100 dark:hover:bg-red-900">
                                                  <TableCell className="text-xs">
                                                    <div>{formatearFechaConImputacion(egreso).fechaPrincipal}</div>
                                                    {formatearFechaConImputacion(egreso).esImputacion && (
                                                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-300 mt-1">
                                                        📅 Imputación
                                                      </Badge>
                                                    )}
                                                  </TableCell>
                                                  <TableCell className="text-xs font-medium">{egreso.concepto}</TableCell>
                                                  <TableCell className="text-xs">
                                                    <Badge variant="outline" className="text-xs">
                                                      {egreso.categoriaRel?.descripcion || egreso.categoria}
                                                    </Badge>
                                                  </TableCell>
                                                  <TableCell className="text-right text-xs font-bold text-red-600 dark:text-red-400">
                                                    -{formatMoney(egreso.monto)}
                                                  </TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      ) : (
                                        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                          💸 No hay egresos registrados
                                        </div>
                                      )}
                                    </TabsContent>
                                    
                                    <TabsContent value="ingresos-usuario" className="mt-4">
                                      {userMovimientos.ingresos.length > 0 ? (
                                        <div className="max-h-64 overflow-y-auto bg-green-50 dark:bg-green-950 rounded-lg p-3">
                                          <Table>
                                            <TableHeader>
                                              <TableRow>
                                                <TableHead className="text-xs">Fecha</TableHead>
                                                <TableHead className="text-xs">Concepto</TableHead>
                                                <TableHead className="text-xs">Categoría</TableHead>
                                                <TableHead className="text-right text-xs">Monto</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {userMovimientos.ingresos.map((ingreso) => (
                                                <TableRow key={ingreso.id} className="hover:bg-green-100 dark:hover:bg-green-900">
                                                  <TableCell className="text-xs">
                                                    <div>{formatearFechaConImputacion(ingreso).fechaPrincipal}</div>
                                                    {formatearFechaConImputacion(ingreso).esImputacion && (
                                                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-300 mt-1">
                                                        📅 Imputación
                                                      </Badge>
                                                    )}
                                                  </TableCell>
                                                  <TableCell className="text-xs font-medium">{ingreso.concepto}</TableCell>
                                                  <TableCell className="text-xs">
                                                    <Badge variant="outline" className="text-xs">
                                                      {ingreso.categoriaRel?.descripcion || ingreso.categoria}
                                                    </Badge>
                                                  </TableCell>
                                                  <TableCell className="text-right text-xs font-bold text-green-600 dark:text-green-400">
                                                    +{formatMoney(ingreso.monto)}
                                                  </TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      ) : (
                                        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                          💰 No hay ingresos registrados
                                        </div>
                                      )}
                                    </TabsContent>
                                  </Tabs>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-48 text-muted-foreground bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl">
                            <div className="text-center space-y-4">
                              <div className="relative">
                                <Users className="h-16 w-16 mx-auto text-gray-400 opacity-50" />
                                <Sparkles className="h-6 w-6 text-blue-400 absolute -top-2 -right-2" />
                              </div>
                              <div>
                                <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                                  👥 No hay movimientos por integrante
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  en este período
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 2. GASTOS DIARIOS */}
            <TabsContent value="gastos-diarios" className="space-y-6">
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                          <BarChart3 className="h-5 w-5 text-white" />
                        </div>
                        Gastos Diarios Familiares
                      </CardTitle>
                      <CardDescription className="text-base">
                        Distribución de gastos por día en <span className="font-semibold text-purple-600 dark:text-purple-400">{data.resumen.mes}</span>
                      </CardDescription>
                    </div>
                    
                    {/* Botones de control como en el dashboard */}
                    <div className="flex items-center gap-2">
                      <Popover open={showFilters} onOpenChange={setShowFilters}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-96">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">Filtros de Gastos Diarios</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetearFiltros}
                                className="h-6 px-2 text-xs"
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Reset
                              </Button>
                            </div>

                            {/* Controles de monto */}
                            <div className="space-y-3">
                              <div>
                                <Label className="text-xs">Monto mínimo: ${minPercentage[0].toLocaleString()}</Label>
                                <Slider
                                  value={minPercentage}
                                  onValueChange={setMinPercentage}
                                  max={data?.filtros?.estadisticasGastos?.maximo || 100000}
                                  step={1000}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Monto máximo: ${maxPercentage[0].toLocaleString()}</Label>
                                <Slider
                                  value={maxPercentage}
                                  onValueChange={setMaxPercentage}
                                  min={minPercentage[0] + 1000}
                                  max={data?.filtros?.estadisticasGastos?.maximo || 100000}
                                  step={1000}
                                  className="mt-1"
                                />
                              </div>
                            </div>

                            {data?.filtros && (
                              <div className="pt-2 border-t text-xs text-muted-foreground">
                                <div className="flex justify-between">
                                  <span>Días mostrados:</span>
                                  <span>{gastosDiariosFiltrados.length} de {data.gastosDiarios.length}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Rango original:</span>
                                  <span>${data.filtros.estadisticasGastos.minimo.toLocaleString()} - ${data.filtros.estadisticasGastos.maximo.toLocaleString()}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {gastosDiariosFiltrados.length > 0 ? (
                    <div className="h-96 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-inner">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={gastosDiariosFiltrados}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="fecha" 
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            tickFormatter={(value) => `$${value.toLocaleString()}`}
                          />
                          <Tooltip 
                            formatter={(value, name, props) => {
                              return [formatMoney(Number(value)), '💸 Gasto del día']
                            }}
                            labelFormatter={(label) => `📅 Fecha: ${label}`}
                            contentStyle={{
                              backgroundColor: '#f9fafb',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                              fontSize: '14px'
                            }}
                            cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                            wrapperStyle={{ outline: 'none' }}
                          />
                          <Bar 
                            dataKey="monto" 
                            fill="url(#gradientBar)"
                            radius={[6, 6, 0, 0]}
                            stroke="#8b5cf6"
                            strokeWidth={1}
                          />
                          <defs>
                            <linearGradient id="gradientBar" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8b5cf6" />
                              <stop offset="100%" stopColor="#ec4899" />
                            </linearGradient>
                          </defs>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-muted-foreground bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl">
                      <div className="text-center space-y-4">
                        <div className="relative">
                          <BarChart3 className="h-16 w-16 mx-auto text-gray-400 opacity-50" />
                          <Sparkles className="h-6 w-6 text-purple-400 absolute -top-2 -right-2" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                            📊 No hay gastos registrados
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            en este período
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 3. PRÓXIMOS PAGOS */}
            <TabsContent value="proximos-pagos" className="space-y-6">
              <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 border-orange-200 dark:border-orange-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    Próximos Pagos Familiares
                  </CardTitle>
                  <CardDescription className="text-base">
                    Gastos recurrentes próximos a vencer <span className="font-semibold text-orange-600 dark:text-orange-400">(próximos 30 días)</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.proximosPagos.length > 0 ? (
                    <div className="space-y-4">
                      <div className="max-h-96 overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-inner">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50 dark:bg-gray-700">
                              <TableHead className="font-semibold">📝 Concepto</TableHead>
                              <TableHead className="font-semibold">👤 Usuario</TableHead>
                              <TableHead className="font-semibold">📅 Fecha</TableHead>
                              <TableHead className="font-semibold">🔄 Estado</TableHead>
                              <TableHead className="text-right font-semibold">💰 Saldo Pendiente</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.proximosPagos.map((pago) => (
                              <TableRow key={pago.id} className="hover:bg-orange-50 dark:hover:bg-orange-950 transition-colors">
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                                      {pago.concepto}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      🏷️ {pago.categoria?.descripcion} • 🔄 {pago.periodicidad}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    {pago.user.name}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="font-medium">{formatearFecha(pago.proximaFecha)}</div>
                                    <div className="text-sm font-medium text-orange-600 dark:text-orange-400">
                                      {pago.proximaFecha ? formatearFechaRelativa(pago.proximaFecha) : 'Sin fecha'}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={
                                      pago.estado === 'pendiente' ? 'destructive' :
                                      pago.estado === 'pago_parcial' ? 'secondary' :
                                      pago.estado === 'proximo' ? 'default' :
                                      'outline'
                                    }
                                    className={`${
                                      pago.estado === 'pendiente' ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200' :
                                      pago.estado === 'pago_parcial' ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200' :
                                      pago.estado === 'proximo' ? 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-200' :
                                      'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900 dark:text-gray-200'
                                    }`}
                                  >
                                    {pago.estado === 'pendiente' ? '⚠️ Pendiente' :
                                     pago.estado === 'pago_parcial' ? '🟡 Pago Parcial' :
                                     pago.estado === 'proximo' ? '🟠 Próximo' :
                                     pago.estado}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="space-y-1">
                                    <div className="font-bold text-lg text-orange-600 dark:text-orange-400">
                                      {formatMoney(pago.saldoPendiente)}
                                    </div>
                                    {pago.porcentajePagado > 0 && (
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        ✅ {pago.porcentajePagado.toFixed(1)}% pagado
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-muted-foreground bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl">
                      <div className="text-center space-y-4">
                        <div className="relative">
                          <Calendar className="h-16 w-16 mx-auto text-gray-400 opacity-50" />
                          <Sparkles className="h-6 w-6 text-orange-400 absolute -top-2 -right-2" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                            🎉 No hay pagos próximos pendientes
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            ¡Todo al día!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 