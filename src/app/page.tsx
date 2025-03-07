"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  ArrowUp,
  ArrowDown,
  Bell,
  ChevronRight,
  ChevronLeft,
  CreditCard,
  FileText,
  Grid,
  Moon,
  Plus,
  Send,
  Sun,
  CalendarIcon,
  Users,
  Pencil,
  MoreHorizontal,
  LogOut,
  Settings,
  BarChart3,
  Repeat,
  Menu,
  UserCircle,
  PanelLeft,
  PanelLeftClose,
  Home,
  PieChart
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { ExpenseForm } from "@/components/ExpenseForm"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
import { DistributionPanel } from "@/components/DistributionPanel"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { RecurringPaymentAlert } from "@/components/RecurringPaymentAlert"

// Componente de carga
function LoadingScreen() {
  return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
}

export default function BankingDashboard() {
  // Hooks de autenticación
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Estados del componente
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("darkMode") === "true"
    }
    return false
  })
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [balanceIndex, setBalanceIndex] = useState(0)
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState<Date>()
  const [transactionType, setTransactionType] = useState<"income" | "expense">("expense")
  const [transactions, setTransactions] = useState<any[]>([])
  const [editingTransaction, setEditingTransaction] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  // Si está cargando, mostrar pantalla de carga
  if (status === "loading" || (status === "authenticated" && loading)) {
    return <LoadingScreen />
  }

  // Si no está autenticado, no mostrar nada (la redirección se maneja en el efecto)
  if (status === "unauthenticated") {
    return null
  }

  // Nombre del usuario
  const nombreUsuario = session?.user?.name || "Usuario"

  // Funciones del componente
  const calculateBalances = () => {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Calcular totales por tipo de movimiento
    const totals = transactions.reduce((acc, transaction) => {
      const amount = transaction.tipoTransaccion === 'income' ? transaction.monto : -transaction.monto
      
      // Actualizar total general
      acc.total += amount

      // Actualizar totales por tipo de movimiento
      if (transaction.tipoMovimiento === 'efectivo') {
        acc.efectivo += amount
      } else if (transaction.tipoMovimiento === 'digital') {
        acc.digital += amount
      } else if (transaction.tipoMovimiento === 'ahorro') {
        acc.ahorro += amount
      }

      // Calcular totales mensuales
      const transactionDate = new Date(transaction.fecha)
      if (transactionDate >= firstDayOfMonth && transactionDate <= lastDayOfMonth) {
        if (transaction.tipoTransaccion === 'income') {
          acc.monthlyIncome += transaction.monto
        } else {
          acc.monthlyExpense += transaction.monto
        }
      }

      return acc
    }, {
      total: 0,
      efectivo: 0,
      digital: 0,
      ahorro: 0,
      monthlyIncome: 0,
      monthlyExpense: 0
    })

    return totals
  }

  const balances = calculateBalances()

  const balanceTypes = [
    { label: "Saldo total", amount: new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(balances.total) },
    { label: "Total Efectivo", amount: new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(balances.efectivo) },
    { label: "Total Digital", amount: new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(balances.digital) },
    { label: "Total Ahorros", amount: new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(balances.ahorro) },
  ]

  const navigateBalance = (direction: "prev" | "next") => {
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

      if (!response.ok) {
        throw new Error('Error al actualizar el registro')
      }

      await fetchTransactions()
      setEditingTransaction(null)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-20'} transition-all duration-300 border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg flex flex-col relative`}>
        {/* Botón toggle persistente */}
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 h-6 w-6 rounded-full shadow-md border-gray-200 bg-white dark:bg-gray-700 dark:border-gray-600 p-0"
        >
          {sidebarOpen ? <PanelLeftClose className="h-3 w-3" /> : <PanelLeft className="h-3 w-3" />}
        </Button>

        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center w-full'}`}>
              <div className="w-10 h-10 flex-shrink-0">
                <img src="/ai-financial-logo.svg" alt="AI Financial Management" className="w-full h-full" />
              </div>
              {sidebarOpen && (
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900 dark:text-white">AI Financial</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Management</span>
                </div>
              )}
            </div>
          </div>

          <nav className="space-y-1 mb-6">
            <Button 
              variant="ghost" 
              className="w-full flex items-center justify-center py-5"
              style={{ justifyContent: sidebarOpen ? 'flex-start' : 'center' }}
            >
              <Grid className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              {sidebarOpen && <span className="ml-3 font-medium">Dashboard</span>}
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400"
              style={{ justifyContent: sidebarOpen ? 'flex-start' : 'center' }}
              onClick={() => router.push('/voz')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 dark:text-gray-400">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" x2="12" y1="19" y2="22"></line>
              </svg>
              {sidebarOpen && <span className="ml-3">Gastos por Voz</span>}
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400"
              style={{ justifyContent: sidebarOpen ? 'flex-start' : 'center' }}
              onClick={() => router.push('/recurrentes')}
            >
              <Repeat className="w-5 h-5" />
              {sidebarOpen && <span className="ml-3">Recurrentes</span>}
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400"
              style={{ justifyContent: sidebarOpen ? 'flex-start' : 'center' }}
              onClick={() => router.push('/financiacion')}
            >
              <CreditCard className="w-5 h-5" />
              {sidebarOpen && <span className="ml-3">Financiación</span>}
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400"
              style={{ justifyContent: sidebarOpen ? 'flex-start' : 'center' }}
              onClick={() => router.push('/presupuestos')}
            >
              <PieChart className="w-5 h-5" />
              {sidebarOpen && <span className="ml-3">Presupuestos</span>}
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400"
              style={{ justifyContent: sidebarOpen ? 'flex-start' : 'center' }}
              onClick={() => router.push('/informes')}
            >
              <BarChart3 className="w-5 h-5" />
              {sidebarOpen && <span className="ml-3">Informes</span>}
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400"
              style={{ justifyContent: sidebarOpen ? 'flex-start' : 'center' }}
              onClick={() => router.push('/grupos')}
            >
              <Users className="w-5 h-5" />
              {sidebarOpen && <span className="ml-3">Grupos</span>}
            </Button>
          </nav>

          {/* Expense Form */}
          {sidebarOpen && (
            <div className="flex-1 overflow-y-auto">
              <ExpenseForm onTransactionAdded={fetchTransactions} />
            </div>
          )}

          {/* Logout Button removed from here */}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="border-b">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">
                ¡Bienvenido, {session?.user?.name || "Usuario"}!
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Sun className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Switch checked={darkMode} onCheckedChange={setDarkMode} id="dark-mode" />
                <Moon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </div>
              
              {/* Alerta de pagos recurrentes */}
              <RecurringPaymentAlert />
              
              {/* User Avatar */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <UserCircle className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/perfil">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Editar perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="grid gap-4 md:gap-8">
            {/* Main content components */}
            <div className="grid grid-cols-12 gap-6">
              {/* Balance Card */}
              <div className="col-span-5">
                <Card className="h-full bg-blue-900 dark:bg-blue-950 text-white">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-blue-200">
                      {balanceTypes[balanceIndex].label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold mb-4">{balanceTypes[balanceIndex].amount}</div>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => navigateBalance("prev")}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => navigateBalance("next")}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Situation */}
              <div className="col-span-7">
                <Card className="h-full dark:bg-gray-700 dark:text-white">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-2xl font-medium">Situación mensual</CardTitle>
                    <div className="flex flex-col items-end">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Balance</span>
                      <div className={`text-3xl font-bold ${(balances.monthlyIncome - balances.monthlyExpense) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(balances.monthlyIncome - balances.monthlyExpense)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {/* Ingresos */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Ingresos</span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(balances.monthlyIncome)}
                          </span>
                        </div>
                      </div>

                      {/* Gastos */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Gastos</span>
                          <span className="font-medium text-red-600 dark:text-red-400">
                            {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(balances.monthlyExpense)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Distribution Panel */}
              <div className="col-span-12 mt-6">
                <DistributionPanel transactions={transactions} />
              </div>

              {/* Transactions History */}
              <div className="col-span-12">
                <Card className="dark:bg-gray-700 dark:text-white">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-medium">Historial de transacciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
                            <th className="pb-3 font-normal">Fecha</th>
                            <th className="pb-3 font-normal">Categoría</th>
                            <th className="pb-3 font-normal">Concepto</th>
                            <th className="pb-3 font-normal text-right">Tipo Transacción</th>
                            <th className="pb-3 font-normal text-right">Tipo Movimiento</th>
                            <th className="pb-3 font-normal text-right">Monto</th>
                            <th className="pb-3 font-normal"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.slice(0, 5).map((transaction) => (
                            <tr key={transaction.id} className="border-b border-gray-100 dark:border-gray-700">
                              <td className="py-2 text-sm">{format(new Date(transaction.fecha), "dd/MM/yyyy")}</td>
                              <td className="py-2 text-sm">
                                <Badge variant="outline">{transaction.categoria}</Badge>
                              </td>
                              <td className="py-2 text-sm">{transaction.concepto}</td>
                              <td className="py-2 text-sm text-right">
                                <Badge
                                  className={
                                    transaction.tipoTransaccion === "income"
                                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                      : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                                  }
                                >
                                  {transaction.tipoTransaccion === "income" ? "Ingreso" : "Egreso"}
                                </Badge>
                              </td>
                              <td className="py-2 text-sm text-right capitalize">{transaction.tipoMovimiento}</td>
                              <td className="py-2 text-sm text-right font-medium">
                                {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
                                  transaction.monto
                                )}
                              </td>
                              <td className="py-2 text-sm text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setEditingTransaction(transaction)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-center mt-4">
                      <Button 
                        variant="link" 
                        className="text-orange-500 dark:text-orange-400 gap-2"
                        onClick={() => router.push('/transacciones')}
                      >
                        <Send className="w-4 h-4" />
                        <span>Ver todo el historial</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!editingTransaction} onOpenChange={() => setEditingTransaction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Transacción</DialogTitle>
          </DialogHeader>
          {editingTransaction && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                handleEditTransaction({
                  ...editingTransaction,
                  concepto: formData.get('concepto'),
                  monto: parseFloat(formData.get('monto')?.toString() || '0'),
                  categoria: formData.get('categoria'),
                  tipoTransaccion: formData.get('tipoTransaccion'),
                  tipoMovimiento: formData.get('tipoMovimiento'),
                  fecha: formData.get('fecha')
                })
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="concepto">Concepto</Label>
                <Input
                  id="concepto"
                  name="concepto"
                  defaultValue={editingTransaction.concepto}
                />
              </div>
              <div>
                <Label htmlFor="monto">Monto</Label>
                <Input
                  id="monto"
                  name="monto"
                  type="number"
                  step="0.01"
                  defaultValue={editingTransaction.monto}
                />
              </div>
              <div>
                <Label htmlFor="categoria">Categoría</Label>
                <Select name="categoria" defaultValue={editingTransaction.categoria}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alimentacion">Alimentación</SelectItem>
                    <SelectItem value="transporte">Transporte</SelectItem>
                    <SelectItem value="servicios">Servicios</SelectItem>
                    <SelectItem value="ocio">Ocio</SelectItem>
                    <SelectItem value="otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de Transacción</Label>
                <RadioGroup
                  name="tipoTransaccion"
                  defaultValue={editingTransaction.tipoTransaccion}
                  className="grid grid-cols-2 gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="income" id="edit-income" />
                    <Label
                      htmlFor="edit-income"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <ArrowDown className="w-4 h-4" />
                      Ingreso
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="expense" id="edit-expense" />
                    <Label
                      htmlFor="edit-expense"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <ArrowUp className="w-4 h-4" />
                      Egreso
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label>Tipo de Movimiento</Label>
                <Select name="tipoMovimiento" defaultValue={editingTransaction.tipoMovimiento}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                    <SelectItem value="ahorro">Ahorro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fecha</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(new Date(editingTransaction.fecha), "PPP", { locale: es })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      defaultMonth={new Date(editingTransaction.fecha)}
                      selected={new Date(editingTransaction.fecha)}
                      onSelect={(date) => {
                        if (date) {
                          editingTransaction.fecha = date.toISOString()
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingTransaction(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Guardar cambios</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

