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

  const getAccentColor = () => {
    switch (variant) {
      case "positive": return "bg-emerald-400"
      case "negative": return "bg-red-400"
      default: return "bg-violet-400"
    }
  }

  const getTintBg = () => {
    switch (variant) {
      case "positive": return "dark:bg-emerald-500/[0.08]"
      case "negative": return "dark:bg-red-500/[0.08]"
      default: return "dark:bg-violet-500/[0.08]"
    }
  }

  const getIconColor = () => {
    switch (variant) {
      case "positive": return "text-emerald-400"
      case "negative": return "text-red-400"
      default: return "text-violet-400"
    }
  }

  const getIconBg = () => {
    switch (variant) {
      case "positive": return "bg-emerald-500/20"
      case "negative": return "bg-red-500/20"
      default: return "bg-violet-500/20"
    }
  }

  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl transition-all duration-200",
      "backdrop-blur-xl bg-white/[0.04] border border-white/[0.08]",
      "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20",
      getTintBg()
    )}>
      {/* Colored left border accent */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-xl", getAccentColor())} />
      <div className="p-5 pl-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-xs font-medium text-white/50 uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold tracking-tight text-white">
              {valuesVisible ? amount : "***"}
            </p>
            {subtitle && (
              <p className="text-xs text-white/40">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 text-xs">
                {trend.value > 0 ? (
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-400" />
                )}
                <span className={trend.value > 0 ? "text-emerald-400" : "text-red-400"}>
                  {Math.abs(trend.value)}% vs {trend.period}
                </span>
              </div>
            )}
          </div>
          <div className={cn("h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ml-3", getIconBg())}>
            <Icon className={cn("h-5 w-5", getIconColor())} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente para cargar datos
function LoadingScreen() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0D0B1E] via-[#0F1235] to-[#0B1530]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-500"></div>
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
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] transition-colors"
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
      <TabsList className="grid w-full grid-cols-3 bg-white/[0.05] backdrop-blur-sm border border-white/[0.08] rounded-xl">
        <TabsTrigger value="todos" className="flex items-center gap-2 text-xs data-[state=active]:bg-violet-600/70 data-[state=active]:text-white data-[state=active]:shadow-lg">
          <DollarSign className="h-3 w-3" />
          Todo
        </TabsTrigger>
        <TabsTrigger value="ingresos" className="flex items-center gap-2 text-xs data-[state=active]:bg-violet-600/70 data-[state=active]:text-white data-[state=active]:shadow-lg">
          <TrendingUp className="h-3 w-3" />
          Ingresos
        </TabsTrigger>
        <TabsTrigger value="egresos" className="flex items-center gap-2 text-xs data-[state=active]:bg-violet-600/70 data-[state=active]:text-white data-[state=active]:shadow-lg">
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

  // Cálculos de saldos totales HISTÓRICOS (para el header)
  const totalBalancesHistoricos = (() => {
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

  // Cálculos de saldos DEL MES ACTUAL (para las tarjetas del tab familiar)
  const totalBalancesMes = (() => {
    const totals = { total: 0, efectivo: 0, digital: 0, ahorro: 0 }

    gastosFamiliaresDelMes.forEach(gasto => {
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

    return totals
  })()

  // Tipos de balance total para navegación (HISTÓRICO en el header)
  const totalBalanceTypes = [
    { label: "Saldo Total (Incluye Grupo)", amount: formatMoney(totalBalancesHistoricos.total) },
    { label: "Total Efectivo", amount: formatMoney(totalBalancesHistoricos.efectivo) },
    { label: "Total Digital", amount: formatMoney(totalBalancesHistoricos.digital) },
    { label: "Total Ahorros", amount: formatMoney(totalBalancesHistoricos.ahorro) },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#0D0B1E] via-[#0F1235] to-[#0B1530]">
      {/* Header premium */}
      <header className="bg-gradient-to-r from-violet-950/80 via-indigo-950/80 to-slate-950/80 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="flex items-center justify-between py-4">
            {/* Sección izquierda: Saldo y Cotizaciones */}
            <div className="flex items-center gap-6">
              {/* Widget de Saldo Total */}
              <div className="glass-card flex items-center p-4 rounded-2xl min-w-[320px] bg-violet-500/[0.06]">
                <div className="flex flex-col flex-1 text-center">
                  <div className="text-xs uppercase font-semibold text-violet-300 tracking-widest mb-1">
                    {totalBalanceTypes[balanceIndex].label}
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {valuesVisible ? totalBalanceTypes[balanceIndex].amount : "***"}
                  </div>
                  <div className="text-xs text-violet-300/60 mt-1">
                    Incluye gastos familiares
                  </div>
                </div>
                <div className="flex flex-col border-l pl-4 border-white/[0.08] py-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateBalanceType("prev")}
                    className="text-white/40 hover:text-white hover:bg-white/10 h-8 w-8 p-0 rounded-full"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateBalanceType("next")}
                    className="text-white/40 hover:text-white hover:bg-white/10 h-8 w-8 p-0 rounded-full"
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
                className="rounded-full hover:bg-white/10"
                title={valuesVisible ? "Ocultar valores" : "Mostrar valores"}
              >
                {valuesVisible ? (
                  <Eye className="h-4 w-4 text-white/50" />
                ) : (
                  <EyeOff className="h-4 w-4 text-white/50" />
                )}
              </Button>

              <div className="flex items-center">
                <Sun className="h-4 w-4 text-white/40" />
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                  className="mx-2"
                />
                <Moon className="h-4 w-4 text-white/40" />
              </div>

              <div data-tour="notifications">
                <NotificationCenter />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 bg-violet-600/30 text-violet-300 hover:bg-violet-600/50">
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
      <main className="flex-1">
        <div className="max-w-screen-2xl mx-auto px-6 py-6">
          <div className="space-y-6">
            {/* Navegación de mes */}
            <div className="flex items-center justify-between bg-white/[0.04] backdrop-blur-sm rounded-2xl border border-white/[0.06] px-6 py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="flex items-center gap-1 hover:bg-white/10 rounded-full text-white/70 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <div className="text-center">
                <h1 className="text-xl font-semibold text-white capitalize">
                  {format(new Date(currentYear, currentMonth), 'MMMM yyyy', { locale: es })}
                </h1>
                <p className="text-violet-300/70 text-sm">Dashboard financiero</p>
                {/* Indicador de nivel de acceso */}
                <div className="mt-1">
                  <NivelAccesoIndicator nivel={nivel} esAdministrador={esAdministradorFamiliar} />
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="flex items-center gap-1 hover:bg-white/10 rounded-full text-white/70 hover:text-white"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Tabs para separar vistas */}
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className={cn(
                "grid w-full bg-white/[0.05] backdrop-blur-sm border border-white/[0.08] rounded-xl",
                puedeVerGastosFamiliares() ? "grid-cols-2" : "grid-cols-1"
              )}>
                <TabsTrigger value="personal" className="flex items-center gap-2 data-[state=active]:bg-violet-600/70 data-[state=active]:text-white data-[state=active]:shadow-lg">
                  <UserCheck className="h-4 w-4" />
                  Mi situación mensual
                </TabsTrigger>
                {puedeVerGastosFamiliares() && (
                  <TabsTrigger value="familiar" className="flex items-center gap-2 data-[state=active]:bg-violet-600/70 data-[state=active]:text-white data-[state=active]:shadow-lg">
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
                  <Card className="glass-card rounded-2xl border-white/[0.08]">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-white/90 text-base font-semibold">
                        <BarChart className="h-5 w-5" />
                        Mis gastos por categoría
                      </CardTitle>
                      <CardDescription className="text-white/40 text-xs">
                        Distribución de mis gastos personales este mes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <MultiChartWidget month={currentMonth} year={currentYear} />
                    </CardContent>
                  </Card>

                  <Card className="glass-card rounded-2xl border-white/[0.08]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white/90 text-base font-semibold">Próximas tareas</CardTitle>
                      <CardDescription className="text-white/40 text-xs">
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
                  <Card className="glass-card rounded-2xl border-white/[0.08]" data-tour="add-transaction">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white/90 text-base font-semibold">Registrar nuevo movimiento</CardTitle>
                      <CardDescription className="text-white/40 text-xs">
                        Registra un nuevo gasto o ingreso personal. Usa el checkbox para indicar si debe incluirse en los totales familiares.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <DashboardExpenseForm onTransactionAdded={reloadData} />
                    </CardContent>
                  </Card>

                  {/* Últimos movimientos personales */}
                  <Card className="glass-card rounded-2xl border-white/[0.08]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white/90 text-base font-semibold">Mis últimos movimientos</CardTitle>
                      <CardDescription className="text-white/40 text-xs">
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

                  {/* Estadísticas adicionales familiares DEL MES */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <BalanceCard
                      title="Total Efectivo"
                      amount={formatMoney(totalBalancesMes.efectivo)}
                      icon={Banknote}
                      variant="default"
                    />
                    <BalanceCard
                      title="Total Digital"
                      amount={formatMoney(totalBalancesMes.digital)}
                      icon={CreditCard}
                      variant="default"
                    />
                    <BalanceCard
                      title="Total Ahorros"
                      amount={formatMoney(totalBalancesMes.ahorro)}
                      icon={PiggyBank}
                      variant="default"
                    />
                    <BalanceCard
                      title="Saldo General"
                      amount={formatMoney(totalBalancesMes.total)}
                      icon={DollarSign}
                      variant={totalBalancesMes.total >= 0 ? "positive" : "negative"}
                    />
                  </div>

                  {/* Formulario de nuevo movimiento y últimos movimientos familiares */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="glass-card rounded-2xl border-white/[0.08]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-white/90 text-base font-semibold">Registrar nuevo movimiento</CardTitle>
                        <CardDescription className="text-white/40 text-xs">
                          Registra un nuevo gasto o ingreso. Marca el checkbox para incluirlo en los totales familiares.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <DashboardExpenseForm onTransactionAdded={reloadData} />
                      </CardContent>
                    </Card>

                    {/* Últimos movimientos familiares */}
                    <Card className="glass-card rounded-2xl border-white/[0.08]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-white/90 text-base font-semibold">Últimos movimientos familiares</CardTitle>
                        <CardDescription className="text-white/40 text-xs">
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