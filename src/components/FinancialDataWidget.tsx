"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

interface ExpenseCategory {
  name: string;
  value: number;
}

export function FinancialDataWidget() {
  const [expensesData, setExpensesData] = useState<ExpenseCategory[]>([])
  const [expensesLoading, setExpensesLoading] = useState(true)

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#6B8EFF'];

  const fetchExpensesByCategory = async () => {
    try {
      setExpensesLoading(true)
      
      // TODO: Implementar llamada a API real para obtener gastos por categoría
      // Por ahora, no mostrar datos simulados
      setExpensesData([]);
      
    } catch (error) {
      console.error('Error al cargar datos de gastos:', error)
      setExpensesData([])
    } finally {
      setExpensesLoading(false)
    }
  }

  useEffect(() => {
    fetchExpensesByCategory()
  }, [])

  // Función para formatear números
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(value)
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded p-2 shadow-md">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Distribución de Gastos del Mes</h3>
        {expensesLoading ? (
          <div className="flex items-center justify-center h-64">
            <Skeleton className="h-48 w-48 rounded-full" />
          </div>
        ) : expensesData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No hay datos de gastos disponibles</p>
              <p className="text-xs mt-1">Registra algunos gastos para ver la distribución</p>
            </div>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expensesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {expensesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-3 text-xs text-center text-muted-foreground">
          {expensesData.length === 0 ? "Sin datos de gastos registrados" : "Principales categorías de gastos"}
        </div>
      </CardContent>
    </Card>
  )
} 