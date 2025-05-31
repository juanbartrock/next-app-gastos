"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  PiggyBank
} from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/contexts/SidebarContext"
import { useTheme } from "@/providers/ThemeProvider"
import { useVisibility } from "@/contexts/VisibilityContext"
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
import { TareasWidget } from "@/components/TareasWidget"
import { DollarIndicator } from "@/components/DollarIndicator"
import { CurrencySelector } from "@/components/CurrencySelector"
import { useCurrency } from "@/contexts/CurrencyContext"

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
              {valuesVisible ? amount : "••••••"}
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
  const router = useRouter()
  
  const ultimosMovimientos = gastos
    .slice(0, 5)
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

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

  return (
    <div className="space-y-3">
      {ultimosMovimientos.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <p>No hay movimientos registrados</p>
        </div>
      ) : (
        <>
          {ultimosMovimientos.map((movimiento) => (
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
                  {valuesVisible ? formatMoney(movimiento.monto) : "••••"}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {movimiento.tipoMovimiento}
                </p>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3"
            onClick={() => router.push('/transacciones/nuevo')}
          >
            Ver todos los movimientos
          </Button>
        </>
      )}
    </div>
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
  
  // Estados de la interfaz de usuario
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [gastosPersonales, setGastosPersonales] = useState<any[]>([])
  const [gastosFamiliares, setGastosFamiliares] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [balanceIndex, setBalanceIndex] = useState(0)
  const [signingOut, setSigningOut] = useState(false)

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
      const response = await fetch('/api/gastos/familiares?usarFechaImputacion=true')
      if (response.ok) {
        const data = await response.json()
        setGastosFamiliares(data)
      }
    } catch (error) {
      console.error('Error al cargar gastos familiares:', error)
    }
  }

  // Función para recargar todos los datos
  const reloadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchGastosPersonales(),
        fetchGastosFamiliares()
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

  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (status === "authenticated") {
      reloadData()
    }
  }, [status])

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
  const gastosFamiliaresDelMes = gastosFamiliares.filter(gasto => {
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

    return totals
  })()

  // Tipos de balance total para navegación
  const totalBalanceTypes = [
    { label: "Saldo Total Familiar", amount: formatMoney(totalBalances.total) },
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
                    {valuesVisible ? totalBalanceTypes[balanceIndex].amount : "••••••"}
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
              <CurrencySelector />
              
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
              
              <NotificationCenter />

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
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="personal" className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Mi situación mensual
                </TabsTrigger>
                <TabsTrigger value="familiar" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Situación familiar
                </TabsTrigger>
              </TabsList>
              
              {/* Tab Personal */}
              <TabsContent value="personal" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
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
                      <FinancialDataWidget />
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
              </TabsContent>
              
              {/* Tab Familiar */}
              <TabsContent value="familiar" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
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
              </TabsContent>
            </Tabs>

            {/* Formulario de nuevo movimiento y últimos movimientos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Registrar nuevo movimiento</CardTitle>
                  <CardDescription>
                    Registra un nuevo gasto o ingreso. Usa el checkbox para indicar si debe incluirse en los totales familiares.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DashboardExpenseForm onTransactionAdded={reloadData} />
                </CardContent>
              </Card>

              {/* Últimos movimientos */}
              <Card>
                <CardHeader>
                  <CardTitle>Últimos movimientos</CardTitle>
                  <CardDescription>
                    Movimientos recientes registrados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UltimosMovimientos gastos={gastosPersonales} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 