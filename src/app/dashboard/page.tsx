"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bell, ChevronLeft, ChevronRight, CreditCard, DollarSign, Edit2, LogOut, Moon, Settings, Sun, User } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/contexts/SidebarContext"
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
import { RecurringPaymentAlert } from "@/components/RecurringPaymentAlert"
import { FinancialDataWidget } from "@/components/FinancialDataWidget"
import { CurrencySelector } from "@/components/CurrencySelector"
import { useCurrency } from "@/contexts/CurrencyContext"

// Componente personalizado para envolver ExpenseForm
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

function LoadingScreen() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-300"></div>
    </div>
  )
}

export default function BankingDashboard() {
  // Hooks de autenticación
  const router = useRouter()
  const { data: session, status } = useSession()
  const { isOpen } = useSidebar()
  
  // Estados de la interfaz de usuario
  const [darkMode, setDarkMode] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [transactions, setTransactions] = useState<any[]>([])
  const [editingTransaction, setEditingTransaction] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [balanceIndex, setBalanceIndex] = useState(0)

  // Reemplazar la función formatMoney con la del contexto de moneda
  const { formatMoney } = useCurrency();

  // Definir fetchTransactions antes de usarlo en useEffect
  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/gastos')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error('Error al cargar transacciones:', error)
    } finally {
      setLoading(false)
    }
  }

  // Efecto para redireccionar si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      console.log("Usuario no autenticado, redirigiendo a login");
      router.push("/login");
    } else if (status === "authenticated") {
      console.log("Usuario autenticado correctamente:", session?.user?.name);
    }
  }, [status, router, session]);

  // Efecto para cargar transacciones
  useEffect(() => {
    if (status === "authenticated") {
      fetchTransactions();
    }
  }, [status]);

  // Efecto para el modo oscuro
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Navegación por meses
  const navigateBalance = (direction: "prev" | "next") => {
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
  
  // Navegación por tipos de saldo
  const navigateBalanceType = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setBalanceIndex((current) => (current === 0 ? balanceTypes.length - 1 : current - 1))
    } else {
      setBalanceIndex((current) => (current === balanceTypes.length - 1 ? 0 : current + 1))
    }
  }

  const handleEditTransaction = async (updatedTransaction: any) => {
    try {
      const response = await fetch(`/api/gastos/${updatedTransaction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTransaction),
      })

      if (response.ok) {
        await fetchTransactions()
        setEditingTransaction(null)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  if (status === "loading") {
    return <LoadingScreen />
  }

  // Cálculo de balances
  const balanceData = (() => {
    if (!transactions.length) return { income: 0, expenses: 0, balance: 0, efectivo: 0, digital: 0, ahorro: 0 }

    // Filtrar transacciones del mes actual
    const currentTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.fecha)

      // Convertir la fecha a UTC para evitar problemas con zonas horarias
      const transactionMonth = transactionDate.getUTCMonth()
      const transactionYear = transactionDate.getUTCFullYear()

      const isCurrentMonth = transactionMonth === currentMonth && transactionYear === currentYear
      const isNotTarjeta = transaction.tipoMovimiento !== 'tarjeta'

      return isCurrentMonth && isNotTarjeta
    })

    // Calcular gastos e ingresos del mes
    let totalExpenses = 0
    let totalIncome = 0

    currentTransactions.forEach(transaction => {
      const amount = Number(transaction.monto)
      // Asumimos que si no es ingreso, es gasto
      if (transaction.tipoTransaccion === 'ingreso') {
        totalIncome += amount
      } else {
        totalExpenses += amount
      }
    })
      
    // Calcular saldos por tipo de movimiento (excluyendo tarjeta)
    const totals = transactions
      .filter(t => t.tipoMovimiento !== 'tarjeta')
      .reduce((acc, t) => {
        const amount = t.tipoTransaccion === 'ingreso' ? Number(t.monto) : -Number(t.monto)
        
        // Actualizar total general
        acc.total += amount
        
        // Actualizar totales por tipo de movimiento
        if (t.tipoMovimiento === 'efectivo') {
          acc.efectivo += amount
        } else if (t.tipoMovimiento === 'digital') {
          acc.digital += amount
        } else if (t.tipoMovimiento === 'ahorro') {
          acc.ahorro += amount
        }
        
        return acc
      }, { total: 0, efectivo: 0, digital: 0, ahorro: 0 })

    return {
      income: totalIncome,
      expenses: totalExpenses,
      balance: totalIncome - totalExpenses,
      ...totals
    }
  })()
  
  // Definir tipos de balance para navegación
  const balanceTypes = [
    { label: "Saldo total", amount: formatMoney(balanceData.total) },
    { label: "Total Efectivo", amount: formatMoney(balanceData.efectivo) },
    { label: "Total Digital", amount: formatMoney(balanceData.digital) },
    { label: "Total Ahorros", amount: formatMoney(balanceData.ahorro) },
  ]

  return (
    <div className="flex flex-col">
      <header className="px-4 py-4 md:py-6 bg-background border-b">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard Financiero</h1>

          <div className="flex items-center gap-4">
            {/* Selector de moneda */}
            <CurrencySelector />
            
            {/* Alternador de tema */}
            <div className="flex items-center">
              <Sun className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Switch
                checked={darkMode}
                onCheckedChange={setDarkMode}
                className="mx-2"
              />
              <Moon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
            
            {/* Componente de alertas de pagos recurrentes */}
            <RecurringPaymentAlert />

            {/* Avatar y menú de usuario */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 bg-blue-100 text-blue-600">
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
                <DropdownMenuItem onClick={() => router.push('/api/auth/signout')}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <div className="grid gap-6">
          {/* Balance y Widget Financiero en dos columnas */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Columna izquierda: Balance navegable */}
            <Card className="bg-blue-900 dark:bg-blue-950 text-white">
              <CardHeader className="text-center">
                <CardTitle className="text-lg font-medium text-blue-200">
                  {balanceTypes[balanceIndex].label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 items-center">
                  <div className="flex justify-center">
                    <button 
                      onClick={() => navigateBalanceType("prev")}
                      className="text-blue-300 hover:text-white transition-colors"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="text-4xl font-bold text-center">{balanceTypes[balanceIndex].amount}</div>
                  <div className="flex justify-center">
                    <button 
                      onClick={() => navigateBalanceType("next")}
                      className="text-blue-300 hover:text-white transition-colors"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Columna derecha: Widget Financiero */}
            <FinancialDataWidget />
          </div>

          {/* Balance Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between p-4">
                <div>
                  <CardTitle className="text-sm text-muted-foreground">Ingresos</CardTitle>
                  <CardDescription className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatMoney(balanceData.income)}
                  </CardDescription>
                </div>
                <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between p-4">
                <div>
                  <CardTitle className="text-sm text-muted-foreground">Gastos</CardTitle>
                  <CardDescription className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatMoney(balanceData.expenses)}
                  </CardDescription>
                </div>
                <div className="bg-red-100 dark:bg-red-900 p-2 rounded-full">
                  <CreditCard className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </CardHeader>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between p-4">
                <div>
                  <CardTitle className="text-sm text-muted-foreground">Balance</CardTitle>
                  <CardDescription className={cn(
                    "text-2xl font-bold",
                    balanceData.balance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"
                  )}>
                    {formatMoney(balanceData.balance)}
                  </CardDescription>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                  <BarChart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateBalance('prev')}
            >
              Anterior
            </Button>
            <div className="text-lg font-semibold">
              {new Date(currentYear, currentMonth).toLocaleDateString('es', { month: 'long', year: 'numeric' })}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateBalance('next')}
            >
              Siguiente
            </Button>
          </div>

          {/* Two Column Layout: Form and Transactions */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Transaction Input Form */}
            <Card>
              <CardHeader className="p-4">
                <CardTitle>Nuevo Registro</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <DashboardExpenseForm onTransactionAdded={fetchTransactions} />
              </CardContent>
            </Card>

            {/* Transaction List */}
            <Card>
              <CardHeader className="p-4">
                <CardTitle>Transacciones Recientes</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[300px] overflow-auto">
                  {loading ? (
                    <div className="flex justify-center items-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">
                      No hay transacciones registradas.
                    </div>
                  ) : (
                    <div>
                      {transactions
                        .filter(transaction => {
                          const transactionDate = new Date(transaction.fecha)
                          return transactionDate.getMonth() === currentMonth && 
                                transactionDate.getFullYear() === currentYear
                        })
                        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                        .slice(0, 5) // Mostrar solo las 5 más recientes
                        .map((transaction) => (
                          <div 
                            key={transaction.id} 
                            className="flex items-center justify-between px-4 py-3 border-b last:border-0 hover:bg-muted/50"
                          >
                            <div className="flex items-center">
                              <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center mr-3",
                                transaction.tipoTransaccion === 'ingreso' 
                                  ? "bg-green-100 dark:bg-green-900" 
                                  : "bg-red-100 dark:bg-red-900"
                              )}>
                                {transaction.tipoTransaccion === 'ingreso' ? (
                                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                                ) : (
                                  <CreditCard className="h-5 w-5 text-red-600 dark:text-red-400" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium">{transaction.descripcion}</div>
                                <div className="text-sm text-muted-foreground">
                                  {format(new Date(transaction.fecha), 'PPP', { locale: es })}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "font-medium",
                                transaction.tipoTransaccion === 'ingreso' ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                              )}>
                                {transaction.tipoTransaccion === 'ingreso' ? '+' : '-'}{formatMoney(transaction.monto)}
                              </span>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setEditingTransaction(transaction)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                <div className="p-4 text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/transacciones')}
                  >
                    Ver todo el historial
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
} 