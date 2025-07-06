"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  BarChart, 
  Bell, 
  ChevronLeft, 
  ChevronRight, 
  DollarSign, 
  Loader2, 
  LogOut, 
  Moon, 
  Settings, 
  Sun, 
  User, 
  ChevronUp, 
  ChevronDown, 
  Eye, 
  EyeOff,
  TrendingUp,
  TrendingDown,
  Users,
  UserCheck,
  Wallet,
  CreditCard,
  Banknote,
  PiggyBank,
  Shield,
  Lock,
  Info,
  Crown
} from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/contexts/SidebarContext"
import { useTheme } from "@/providers/ThemeProvider"
import { useVisibility } from "@/contexts/VisibilityContext"
import { usePermisosFamiliares } from "@/contexts/PermisosFamiliaresContext"
import { Switch } from "@/components/ui/switch"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { ExpenseForm } from "@/components/ExpenseForm"
import { NotificationCenter } from "@/components/alertas/NotificationCenter"
import { FinancialDataWidget } from "@/components/FinancialDataWidget"
import { MultiChartWidget } from "@/components/MultiChartWidget"
import { TareasWidget } from "@/components/TareasWidget"
import { DollarIndicator } from "@/components/DollarIndicator"
import { CurrencySelector } from "@/components/CurrencySelector"

import { FinancialSummary } from "@/components/FinancialSummary"
import { CustomTour } from "@/components/onboarding/CustomTour"

import { useCurrency } from "@/contexts/CurrencyContext"
import { useOnboarding } from "@/contexts/OnboardingContext"

// Componente para mostrar estadísticas de gastos
function BalanceCard({ 
  title, 
  amount, 
  subtitle, 
  icon: Icon, 
  variant = "default",
  trend
}: {
  title: string
  amount: string
  subtitle?: string
  icon: any
  variant?: "default" | "positive" | "negative"
  trend?: { value: number; period: string }
}) {
  const { valuesVisible } = useVisibility()
  
  const getVariantStyles = () => {
    switch (variant) {
      case "positive":
        return "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
      case "negative":
        return "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
      default:
        return "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
    }
  }

  const getIconStyles = () => {
    switch (variant) {
      case "positive":
        return "text-green-600 dark:text-green-400"
      case "negative":
        return "text-red-600 dark:text-red-400"
      default:
        return "text-blue-600 dark:text-blue-400"
    }
  }

  return (
    <Card className={cn("transition-all hover:shadow-md", getVariantStyles())}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">
              {valuesVisible ? amount : "***"}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 text-xs">
                {trend.value > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={trend.value > 0 ? "text-green-600" : "text-red-600"}>
                  {Math.abs(trend.value)}% vs {trend.period}
                </span>
              </div>
            )}
          </div>
          <Icon className={cn("h-8 w-8", getIconStyles())} />
        </div>
      </CardContent>
    </Card>
  )
}

// Componente para cargar datos
function LoadingScreen() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-300"></div>
    </div>
  )
}

// Wrapper para formulario de gastos sin título
function DashboardExpenseForm({ onTransactionAdded }: { onTransactionAdded: () => void }) {
  return (
    <div className="expense-form-wrapper">
      <style jsx>{`
        .expense-form-wrapper :global(h3) {
          display: none;
        }
      `}</style>
      <ExpenseForm onTransactionAdded={onTransactionAdded} />
    </div>
  )
}

// Componente para mostrar últimos movimientos
function UltimosMovimientos({ gastos }: { gastos: any[] }) {
  const { formatMoney } = useCurrency()
  const { valuesVisible } = useVisibility()
  const [expandido, setExpandido] = useState(false)
  
  const cantidadMostrar = expandido ? 20 : 6
  const ultimosMovimientos = gastos
    .slice(0, expandido ? 50 : 15)  // Obtener más datos cuando esté expandido
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // Filtrar movimientos por tipo
  const ingresos = ultimosMovimientos.filter(m => m.tipoTransaccion === 'income').slice(0, cantidadMostrar)
  const egresos = ultimosMovimientos.filter(m => m.tipoTransaccion === 'expense').slice(0, cantidadMostrar)
  const todos = ultimosMovimientos.slice(0, cantidadMostrar)

  const getMovementIcon = (tipoMovimiento: string) => {
    switch (tipoMovimiento) {
      case 'efectivo':
        return <Banknote className="h-4 w-4 text-green-600" />
      case 'digital':
        return <CreditCard className="h-4 w-4 text-blue-600" />
      case 'ahorro':
        return <PiggyBank className="h-4 w-4 text-purple-600" />
      case 'tarjeta':
        return <CreditCard className="h-4 w-4 text-orange-600" />
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />
    }
  }

  const getTransactionColor = (tipoTransaccion: string) => {
    return tipoTransaccion === 'income' ? 'text-green-600' : 'text-red-600'
  }

  const renderMovimientos = (movimientos: any[], emptyMessage: string, tipoFiltro: string) => (
    <div className="space-y-3">
      {movimientos.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className={cn("space-y-3", expandido && "max-h-96 overflow-y-auto")}>
            {movimientos.map((movimiento) => (
              <div
                key={movimiento.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3">
                  {getMovementIcon(movimiento.tipoMovimiento)}
                  <div className="flex-1">
                    <p className="font-medium text-sm truncate max-w-[150px]">
                      {movimiento.concepto}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(movimiento.fecha), 'dd/MM/yy', { locale: es })}
                      {movimiento.incluirEnFamilia && (
                        <span className="ml-2 text-blue-500">• Familiar</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "font-semibold text-sm",
                    getTransactionColor(movimiento.tipoTransaccion)
                  )}>
                    {movimiento.tipoTransaccion === 'income' ? '+' : '-'}
                    {valuesVisible ? formatMoney(movimiento.monto) : "***"}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {movimiento.tipoMovimiento}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Información de paginación */}
          {expandido && (
            <div className="text-center text-xs text-muted-foreground py-2 border-t">
              Mostrando {movimientos.length} 
              {tipoFiltro === 'todos' && ' movimientos'}
              {tipoFiltro === 'ingresos' && ' ingresos'}
              {tipoFiltro === 'egresos' && ' egresos'}
            </div>
          )}
        </>
      )}
    </div>
  )

  return (
    <Tabs defaultValue="todos" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="todos" className="flex items-center gap-2 text-xs">
          <DollarSign className="h-3 w-3" />
          Todo
        </TabsTrigger>
        <TabsTrigger value="ingresos" className="flex items-center gap-2 text-xs">
          <TrendingUp className="h-3 w-3" />
          Ingresos
        </TabsTrigger>
        <TabsTrigger value="egresos" className="flex items-center gap-2 text-xs">
          <TrendingDown className="h-3 w-3" />
          Egresos
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="todos" className="mt-4">
        {renderMovimientos(todos, "No hay movimientos registrados", "todos")}
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-3"
          onClick={() => setExpandido(!expandido)}
        >
          {expandido ? "Mostrar menos" : `Ver todos los movimientos (${ultimosMovimientos.length})`}
        </Button>
      </TabsContent>
      
      <TabsContent value="ingresos" className="mt-4">
        {renderMovimientos(ingresos, "No hay ingresos registrados", "ingresos")}
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-3"
          onClick={() => setExpandido(!expandido)}
        >
          {expandido ? "Mostrar menos" : `Ver todos los ingresos (${ultimosMovimientos.filter(m => m.tipoTransaccion === 'income').length})`}
        </Button>
      </TabsContent>
      
      <TabsContent value="egresos" className="mt-4">
        {renderMovimientos(egresos, "No hay egresos registrados", "egresos")}
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-3"
          onClick={() => setExpandido(!expandido)}
        >
          {expandido ? "Mostrar menos" : `Ver todos los egresos (${ultimosMovimientos.filter(m => m.tipoTransaccion === 'expense').length})`}
        </Button>
      </TabsContent>
    </Tabs>
  )
}

// Componente para mostrar el nivel de acceso del usuario
function NivelAccesoIndicator({ nivel, esAdministrador }: { nivel: string, esAdministrador: boolean }) {
  const getIndicatorStyle = () => {
    switch (nivel) {
      case 'ADMINISTRADOR_FAMILIAR':
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200"
      case 'MIEMBRO_COMPLETO':
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200"
      case 'MIEMBRO_LIMITADO':
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200"
      case 'PERSONAL':
        return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getIcono = () => {
    switch (nivel) {
      case 'ADMINISTRADOR_FAMILIAR':
        return <Shield className="h-3 w-3" />
      case 'MIEMBRO_COMPLETO':
        return <Users className="h-3 w-3" />
      case 'MIEMBRO_LIMITADO':
        return <Lock className="h-3 w-3" />
      case 'PERSONAL':
        return <User className="h-3 w-3" />
      default:
        return <Info className="h-3 w-3" />
    }
  }

  const getTexto = () => {
    switch (nivel) {
      case 'ADMINISTRADOR_FAMILIAR':
        return "Administrador Familiar"
      case 'MIEMBRO_COMPLETO':
        return "Acceso Familiar Completo"
      case 'MIEMBRO_LIMITADO':
        return "Acceso Limitado"
      case 'PERSONAL':
        return "Solo Personal"
      default:
        return "Sin Grupo"
    }
  }

  return (
    <Badge variant="outline" className={cn("flex items-center gap-1 text-xs", getIndicatorStyle())}>
      {getIcono()}
      {getTexto()}
    </Badge>
  )
}

export default function DashboardRedesigned() {
  // Hooks de autenticación y contextos
  const router = useRouter()
  const { data: session, status } = useSession()
  const { isOpen } = useSidebar()
  const { theme, toggleTheme } = useTheme()
  const { valuesVisible, toggleVisibility } = useVisibility()
  const { formatMoney } = useCurrency()
  const { 
    nivel, 
    puedeVerGastosFamiliares, 
    esAdministradorFamiliar, 
    tienePermisosFamiliares,
    loading: permisosLoading,
    error: permisosError
  } = usePermisosFamiliares()
  const { isFirstTime, tourActive, closeWelcomeModal } = useOnboarding()
  
  // Estados de la interfaz de usuario
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [gastosPersonales, setGastosPersonales] = useState<any[]>([])
  const [gastosFamiliares, setGastosFamiliares] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [balanceIndex, setBalanceIndex] = useState(0)
  const [signingOut, setSigningOut] = useState(false)
  
  // NUEVO: Estado para gastos pendientes
  const [gastosPendientes, setGastosPendientes] = useState({
    totalPendiente: 0,
    gastosRecurrentes: { total: 0, cantidad: 0 },
    prestamos: { total: 0, cantidad: 0 },
    resumen: { totalGeneral: 0, cantidadTotal: 0, mes: '' }
  })

  // Ref para controlar la primera carga
  const isFirstLoad = useRef(true)

  // Función para ejecutar Smart Trigger en background
  const executeSmartTrigger = async () => {
    try {
      console.log('🎯 Ejecutando Smart Trigger desde Dashboard...')
      
      // Llamada asíncrona que no bloquea la UI
      fetch('/api/alertas/smart-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'dashboard' })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success && data.result.executed) {
          console.log(`✅ Smart Trigger: ${data.result.alertasCreadas} alertas creadas`)
        } else {
          console.log(`ℹ️ Smart Trigger: ${data.result.reason}`)
        }
      })
      .catch(error => {
        // Error silencioso - no afecta la experiencia del usuario
        console.log('Smart Trigger ejecutado en background:', error.message)
      })
    } catch (error) {
      // Fallo silencioso
      console.log('Smart Trigger no disponible')
    }
  }

  // Función para cargar gastos personales
  const fetchGastosPersonales = async () => {
    try {
      const response = await fetch('/api/gastos?usarFechaImputacion=true')
      if (response.ok) {
        const data = await response.json()
        setGastosPersonales(data)
      }
    } catch (error) {
      console.error('Error al cargar gastos personales:', error)
    }
  }

  // Función para cargar gastos familiares
  const fetchGastosFamiliares = async () => {
    try {
      const response = await fetch(`/api/gastos/familiares?month=${currentMonth}&year=${currentYear}`)
      if (response.ok) {
        const data = await response.json()
        setGastosFamiliares(data.gastos || [])
      } else {
        console.error('Error al obtener gastos familiares:', response.statusText)
        setGastosFamiliares([])
      }
    } catch (error) {
      console.error('Error al obtener gastos familiares:', error)
      setGastosFamiliares([])
    }
  }

  // NUEVA FUNCIÓN: Obtener gastos pendientes
  const fetchGastosPendientes = async () => {
    try {
      const response = await fetch('/api/gastos/pendientes')
      if (response.ok) {
        const data = await response.json()
        setGastosPendientes(data)
      } else {
        console.error('Error al obtener gastos pendientes:', response.statusText)
        setGastosPendientes({
          totalPendiente: 0,
          gastosRecurrentes: { total: 0, cantidad: 0 },
          prestamos: { total: 0, cantidad: 0 },
          resumen: { totalGeneral: 0, cantidadTotal: 0, mes: '' }
        })
      }
    } catch (error) {
      console.error('Error al obtener gastos pendientes:', error)
      setGastosPendientes({
        totalPendiente: 0,
        gastosRecurrentes: { total: 0, cantidad: 0 },
        prestamos: { total: 0, cantidad: 0 },
        resumen: { totalGeneral: 0, cantidadTotal: 0, mes: '' }
      })
    }
  }

  // Función para recargar todos los datos
  const reloadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchGastosPersonales(),
        fetchGastosFamiliares(),
        fetchGastosPendientes()
      ])
    } finally {
      setLoading(false)
    }
  }

  // Efecto para redireccionar si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Efecto para carga inicial de datos
  useEffect(() => {
    if (status === "authenticated" && isFirstLoad.current) {
      isFirstLoad.current = false
      reloadData()
      executeSmartTrigger()
    }
  }, [status])

  // Efecto para recargar datos cuando cambie el mes (solo después de la primera carga)
  useEffect(() => {
    if (status === "authenticated" && !isFirstLoad.current) {
      reloadData()
    }
  }, [currentMonth, currentYear])

  // Navegación por meses
  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(prev => prev - 1)
      } else {
        setCurrentMonth(prev => prev - 1)
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(prev => prev + 1)
      } else {
        setCurrentMonth(prev => prev + 1)
      }
    }
  }
  
  // Navegación por tipos de saldo total
  const navigateBalanceType = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setBalanceIndex((current) => (current === 0 ? totalBalanceTypes.length - 1 : current - 1))
    } else {
      setBalanceIndex((current) => (current === totalBalanceTypes.length - 1 ? 0 : current + 1))
    }
  }

  if (status === "loading") {
    return <LoadingScreen />
  }

  // Cálculos de gastos personales del mes actual
  const gastosPersonalesDelMes = gastosPersonales.filter(gasto => {
    const fechaContable = (gasto as any).fechaImputacion || gasto.fecha
    const gastoDate = new Date(fechaContable)
    return gastoDate.getMonth() === currentMonth && gastoDate.getFullYear() === currentYear
  })

  const personalMonthStats = (() => {
    let ingresos = 0
    let gastos = 0

    gastosPersonalesDelMes.forEach(gasto => {
      const amount = Number(gasto.monto)
      if (gasto.tipoTransaccion === 'income') {
        ingresos += amount
      } else {
        gastos += amount
      }
    })

    return {
      ingresos,
      gastos,
      balance: ingresos - gastos
    }
  })()

  // Cálculos de gastos familiares del mes actual
  const gastosFamiliaresDelMes = (Array.isArray(gastosFamiliares) ? gastosFamiliares : []).filter(gasto => {
    const fechaContable = (gasto as any).fechaImputacion || gasto.fecha
    const gastoDate = new Date(fechaContable)
    return gastoDate.getMonth() === currentMonth && gastoDate.getFullYear() === currentYear
  })

  const familyMonthStats = (() => {
    let ingresos = 0
    let gastos = 0

    gastosFamiliaresDelMes.forEach(gasto => {
      const amount = Number(gasto.monto)
      if (gasto.tipoTransaccion === 'income') {
        ingresos += amount
      } else {
        gastos += amount
      }
    })

    return {
      ingresos,
      gastos,
      balance: ingresos - gastos
    }
  })()

  // Cálculos de saldos totales por tipo de movimiento
  const totalBalances = (() => {
    const totals = { total: 0, efectivo: 0, digital: 0, ahorro: 0 }

    // Verificar que gastosFamiliares sea un array
    if (Array.isArray(gastosFamiliares)) {
      gastosFamiliares.forEach(gasto => {
        const amount = gasto.tipoTransaccion === 'income' ? Number(gasto.monto) : -Number(gasto.monto)
        
        totals.total += amount
        
        if (gasto.tipoMovimiento === 'efectivo') {
          totals.efectivo += amount
        } else if (gasto.tipoMovimiento === 'digital') {
          totals.digital += amount
        } else if (gasto.tipoMovimiento === 'ahorro') {
          totals.ahorro += amount
        }
      })
    }

    return totals
  })()

  // Tipos de balance total para navegación
  const totalBalanceTypes = [
    { label: "Saldo Total (Incluye Grupo)", amount: formatMoney(totalBalances.total) },
    { label: "Total Efectivo", amount: formatMoney(totalBalances.efectivo) },
    { label: "Total Digital", amount: formatMoney(totalBalances.digital) },
    { label: "Total Ahorros", amount: formatMoney(totalBalances.ahorro) },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header mejorado */}
      <header className="bg-white dark:bg-gray-900 border-b shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="flex items-center justify-between py-4">
            {/* Sección izquierda: Saldo y Cotizaciones */}
            <div className="flex items-center gap-6">
              {/* Widget de Saldo Total */}
              <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-xl shadow-sm border border-blue-100 dark:border-blue-800 min-w-[320px]">
                <div className="flex flex-col flex-1 text-center">
                  <div className="text-xs uppercase font-semibold text-blue-600 dark:text-blue-400 tracking-wider mb-1">
                    {totalBalanceTypes[balanceIndex].label}
                  </div>
                  <div className="text-4xl font-bold text-blue-700 dark:text-blue-300">
                    {valuesVisible ? totalBalanceTypes[balanceIndex].amount : "***"}
                  </div>
                  <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                    Incluye gastos familiares
                  </div>
                </div>
                <div className="flex flex-col border-l pl-4 border-blue-200 dark:border-blue-700 py-1">
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateBalanceType("prev")}
                    className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 h-8 w-8 p-0"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateBalanceType("next")}
                    className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 h-8 w-8 p-0"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Widget de Cotizaciones */}
              <DollarIndicator />
            </div>

            {/* Sección derecha: Controles */}
            <div className="flex items-center gap-4">
              <div className="ml-3">
                <CurrencySelector />
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleVisibility}
                className="rounded-full"
                title={valuesVisible ? "Ocultar valores" : "Mostrar valores"}
              >
                {valuesVisible ? (
                  <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                ) : (
                  <EyeOff className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                )}
              </Button>
              
              <div className="flex items-center">
                <Sun className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                  className="mx-2"
                />
                <Moon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </div>
              
              <div data-tour="notifications">
                <NotificationCenter />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                    {session?.user?.name?.charAt(0) || 'U'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => router.push('/perfil')}>
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/configuracion')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configuración
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    disabled={signingOut}
                    onClick={async () => {
                      setSigningOut(true)
                      try {
                        await signOut({ callbackUrl: '/login' })
                      } catch (error) {
                        console.error('Error al cerrar sesión:', error)
                        setSigningOut(false)
                      }
                    }}
                  >
                    {signingOut ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cerrando sesión...
                      </>
                    ) : (
                      <>
                        <LogOut className="mr-2 h-4 w-4" />
                        Cerrar sesión
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-screen-2xl mx-auto px-6 py-6">
          <div className="space-y-6">
            {/* Navegación de mes */}
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateMonth('prev')}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <div className="text-center">
                <h1 className="text-2xl font-bold">
                  {format(new Date(currentYear, currentMonth), 'MMMM yyyy', { locale: es })}
                </h1>
                <p className="text-sm text-muted-foreground">Dashboard financiero</p>
                {/* Indicador de nivel de acceso */}
                <div className="mt-2">
                  <NivelAccesoIndicator nivel={nivel} esAdministrador={esAdministradorFamiliar} />
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateMonth('next')}
                className="flex items-center gap-2"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Tabs para separar vistas */}
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className={cn("grid w-full", puedeVerGastosFamiliares() ? "grid-cols-2" : "grid-cols-1")}>
                <TabsTrigger value="personal" className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Mi situación mensual
                </TabsTrigger>
                {puedeVerGastosFamiliares() && (
                  <TabsTrigger value="familiar" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Situación familiar
                  </TabsTrigger>
                )}
              </TabsList>
              
              {/* Tab Personal */}
              <TabsContent value="personal" className="space-y-6" data-tour="dashboard-main">
                <div className="grid gap-4 md:grid-cols-4" data-tour="balance-cards">
                  <BalanceCard
                    title="Mis Ingresos"
                    amount={formatMoney(personalMonthStats.ingresos)}
                    subtitle="Solo mis ingresos personales"
                    icon={TrendingUp}
                    variant="positive"
                  />
                  <BalanceCard
                    title="Mis Gastos"
                    amount={formatMoney(personalMonthStats.gastos)}
                    subtitle="Solo mis gastos personales"
                    icon={TrendingDown}
                    variant="negative"
                  />
                  <BalanceCard
                    title="Mi Balance"
                    amount={formatMoney(personalMonthStats.balance)}
                    subtitle="Balance personal del mes"
                    icon={Wallet}
                    variant={personalMonthStats.balance >= 0 ? "positive" : "negative"}
                  />
                  <BalanceCard
                    title="Gastos Pendientes"
                    amount={formatMoney(gastosPendientes.totalPendiente)}
                    subtitle={`${gastosPendientes.resumen.cantidadTotal} gastos por pagar`}
                    icon={Bell}
                    variant="negative"
                  />
                </div>
                
                {/* Gráfico de gastos personales */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart className="h-5 w-5" />
                        Mis gastos por categoría
                      </CardTitle>
                      <CardDescription>
                        Distribución de mis gastos personales este mes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <MultiChartWidget month={currentMonth} year={currentYear} />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Próximas tareas</CardTitle>
                      <CardDescription>
                        Tareas pendientes y recordatorios
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <TareasWidget />
                    </CardContent>
                  </Card>
                </div>

                {/* Formulario de nuevo movimiento y últimos movimientos personales */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card data-tour="add-transaction">
                    <CardHeader>
                      <CardTitle>Registrar nuevo movimiento</CardTitle>
                      <CardDescription>
                        Registra un nuevo gasto o ingreso personal. Usa el checkbox para indicar si debe incluirse en los totales familiares.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <DashboardExpenseForm onTransactionAdded={reloadData} />
                    </CardContent>
                  </Card>

                  {/* Últimos movimientos personales */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Mis últimos movimientos</CardTitle>
                      <CardDescription>
                        Movimientos personales recientes registrados
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <UltimosMovimientos gastos={gastosPersonales} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Tab Familiar */}
              {puedeVerGastosFamiliares() ? (
                <TabsContent value="familiar" className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-4">
                    <BalanceCard
                      title="Ingresos Familiares"
                      amount={formatMoney(familyMonthStats.ingresos)}
                      subtitle="Ingresos de todos los miembros"
                      icon={TrendingUp}
                      variant="positive"
                    />
                    <BalanceCard
                      title="Gastos Familiares"
                      amount={formatMoney(familyMonthStats.gastos)}
                      subtitle="Gastos marcados como familiares"
                      icon={TrendingDown}
                      variant="negative"
                    />
                    <BalanceCard
                      title="Balance Familiar"
                      amount={formatMoney(familyMonthStats.balance)}
                      subtitle="Balance familiar del mes"
                      icon={Users}
                      variant={familyMonthStats.balance >= 0 ? "positive" : "negative"}
                    />
                    <BalanceCard
                      title="Gastos Pendientes"
                      amount={formatMoney(gastosPendientes.totalPendiente)}
                      subtitle={`${gastosPendientes.resumen.cantidadTotal} gastos por pagar`}
                      icon={Bell}
                      variant="negative"
                    />
                  </div>

                  {/* Estadísticas adicionales familiares */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <BalanceCard
                      title="Total Efectivo"
                      amount={formatMoney(totalBalances.efectivo)}
                      icon={Banknote}
                      variant="default"
                    />
                    <BalanceCard
                      title="Total Digital"
                      amount={formatMoney(totalBalances.digital)}
                      icon={CreditCard}
                      variant="default"
                    />
                    <BalanceCard
                      title="Total Ahorros"
                      amount={formatMoney(totalBalances.ahorro)}
                      icon={PiggyBank}
                      variant="default"
                    />
                    <BalanceCard
                      title="Saldo General"
                      amount={formatMoney(totalBalances.total)}
                      icon={DollarSign}
                      variant={totalBalances.total >= 0 ? "positive" : "negative"}
                    />
                  </div>

                  {/* Formulario de nuevo movimiento y últimos movimientos familiares */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Registrar nuevo movimiento</CardTitle>
                        <CardDescription>
                          Registra un nuevo gasto o ingreso. Marca el checkbox para incluirlo en los totales familiares.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <DashboardExpenseForm onTransactionAdded={reloadData} />
                      </CardContent>
                    </Card>

                    {/* Últimos movimientos familiares */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Últimos movimientos familiares</CardTitle>
                        <CardDescription>
                          Movimientos familiares recientes registrados
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <UltimosMovimientos gastos={gastosFamiliares} />
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              ) : (
                <TabsContent value="familiar" className="space-y-6">
                  <Alert>
                    <Lock className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">Acceso Restringido</p>
                        <p>No tienes permisos para ver la información familiar completa. Solo puedes acceder a tu información personal.</p>
                        <p className="text-sm text-muted-foreground">
                          {nivel === 'MIEMBRO_LIMITADO' && "Contacta al administrador familiar para solicitar permisos adicionales."}
                          {nivel === 'PERSONAL' && "Únete a un grupo familiar o contacta al administrador para obtener acceso."}
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </main>
      
      {/* Tour interactivo - inicia directamente */}
      <CustomTour />
      

    </div>
  )
} 