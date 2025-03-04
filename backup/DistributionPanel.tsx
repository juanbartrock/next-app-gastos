import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"

interface Transaction {
  id: string
  monto: number
  categoria: string
  tipoTransaccion: "income" | "expense"
  fecha: string
}

interface DistributionPanelProps {
  transactions: Transaction[]
  onEdit?: (transaction: Transaction) => void
  onTransactionUpdated?: () => void
}

export function DistributionPanel({ transactions }: DistributionPanelProps) {
  const [currentView, setCurrentView] = useState<"monthly" | "category">("monthly")
  const [currentDate, setCurrentDate] = useState(new Date())

  // Función para obtener el balance mensual
  const getMonthlyBalance = () => {
    const lastSixMonths = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(currentDate, i)
      const start = startOfMonth(date)
      const end = endOfMonth(date)
      
      const monthTransactions = transactions.filter(t => {
        const transDate = new Date(t.fecha)
        return transDate >= start && transDate <= end
      })

      const income = monthTransactions
        .filter(t => t.tipoTransaccion === "income")
        .reduce((sum, t) => sum + t.monto, 0)

      const expenses = monthTransactions
        .filter(t => t.tipoTransaccion === "expense")
        .reduce((sum, t) => sum + t.monto, 0)

      return {
        month: format(date, "MMM yyyy", { locale: es }),
        ingresos: income,
        egresos: expenses,
        balance: income - expenses
      }
    }).reverse()

    return lastSixMonths
  }

  // Función para obtener gastos por categoría del mes actual
  const getCurrentMonthExpensesByCategory = () => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    
    const monthTransactions = transactions.filter(t => {
      const transDate = new Date(t.fecha)
      return transDate >= start && transDate <= end && t.tipoTransaccion === "expense"
    })

    const categories = ["alimentacion", "transporte", "servicios", "ocio", "otros"]
    return categories.map(cat => ({
      categoria: cat.charAt(0).toUpperCase() + cat.slice(1),
      monto: monthTransactions
        .filter(t => t.categoria === cat)
        .reduce((sum, t) => sum + t.monto, 0)
    }))
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(prev => 
      direction === "prev" ? subMonths(prev, 1) : subMonths(prev, -1)
    )
  }

  return (
    <Card className="col-span-10 dark:bg-gray-700 dark:text-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">
          {currentView === "monthly" ? "Balance Mensual" : "Gastos por Categoría"}
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentView(currentView === "monthly" ? "category" : "monthly")}
          >
            {currentView === "monthly" ? "Ver Categorías" : "Ver Balance"}
          </Button>
          {currentView === "category" && (
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth("prev")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth("next")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {currentView === "monthly" ? (
              <BarChart data={getMonthlyBalance()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => 
                    new Intl.NumberFormat("es-AR", {
                      style: "currency",
                      currency: "ARS"
                    }).format(value)
                  }
                />
                <Bar dataKey="ingresos" fill="#22c55e" name="Ingresos" />
                <Bar dataKey="egresos" fill="#ef4444" name="Egresos" />
                <Bar dataKey="balance" fill="#3b82f6" name="Balance" />
              </BarChart>
            ) : (
              <BarChart data={getCurrentMonthExpensesByCategory()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoria" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => 
                    new Intl.NumberFormat("es-AR", {
                      style: "currency",
                      currency: "ARS"
                    }).format(value)
                  }
                />
                <Bar dataKey="monto" fill="#3b82f6" name="Monto" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
} 