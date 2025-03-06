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
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ExpenseForm } from "@/components/ExpenseForm"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
import { DistributionPanel } from "@/components/DistributionPanel"

export default function BankingDashboard({ nombreUsuario = "Usuario" }) {
  const [darkMode, setDarkMode] = useState(false)
  const [balanceIndex, setBalanceIndex] = useState(0)
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState<Date>()
  const [transactionType, setTransactionType] = useState<"income" | "expense">("expense")
  const [transactions, setTransactions] = useState<any[]>([])
  const [editingTransaction, setEditingTransaction] = useState<any>(null)
  const router = useRouter()

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/gastos')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error('Error al cargar transacciones:', error)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

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

  // Aplicar clase dark al elemento html cuando cambia el modo
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

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
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="mx-auto w-full max-w-7xl rounded-3xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        <div className="grid grid-cols-12 h-full">
          {/* Sidebar */}
          <div className="col-span-3 border-r border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10">
                <img src="/ai-financial-logo.svg" alt="AI Financial Management" className="w-full h-full" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-gray-900 dark:text-white">AI Financial</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Management</span>
              </div>
            </div>

            <nav className="space-y-1">
              <Button variant="ghost" className="w-full justify-start gap-3 py-6">
                <Grid className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <span className="font-medium">Principal</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-3 py-6 text-gray-500 dark:text-gray-400">
                <CreditCard className="w-5 h-5" />
                <span>Tarjetas</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-3 py-6 text-gray-500 dark:text-gray-400">
                <FileText className="w-5 h-5" />
                <span>Detalles</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-3 py-6 text-gray-500 dark:text-gray-400">
                <Users className="w-5 h-5" />
                <span>Grupo</span>
              </Button>
            </nav>

            {/* Expense Form */}
            <ExpenseForm onTransactionAdded={fetchTransactions} />
          </div>

          {/* Main Content */}
          <div className="col-span-9 p-8">
            <header className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold dark:text-white">¡Hola, {nombreUsuario}!</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Sun className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} id="dark-mode" />
                  <Moon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </Button>
              </div>
            </header>

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

              {/* Monthly Balance */}
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
              <div className="col-span-12">
                <DistributionPanel transactions={transactions} onEdit={setEditingTransaction} onTransactionUpdated={fetchTransactions} />
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
                            <tr key={transaction.id}>
                              <td className="py-3 text-sm">
                                {format(new Date(transaction.fecha), "dd MMM yyyy", { locale: es })}
                              </td>
                              <td className="py-3 text-sm capitalize">{transaction.categoria}</td>
                              <td className="py-3 text-sm">{transaction.concepto}</td>
                              <td className="text-right">
                                <Badge 
                                  className={transaction.tipoTransaccion === "income" 
                                    ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300" 
                                    : "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300"
                                  }
                                >
                                  {transaction.tipoTransaccion === "income" ? "Ingreso" : "Egreso"}
                                </Badge>
                              </td>
                              <td className="text-right">
                                <Badge variant="outline" className="capitalize">
                                  {transaction.tipoMovimiento}
                                </Badge>
                              </td>
                              <td className="text-right text-sm font-medium">
                                {new Intl.NumberFormat("es-AR", {
                                  style: "currency",
                                  currency: "ARS",
                                }).format(transaction.monto)}
                              </td>
                              <td className="text-right">
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

