"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  LineChart,
  Line
} from "recharts"
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  Grid3x3, 
  Target, 
  TrendingUp,
  Calendar,
  Settings,
  RotateCcw
} from "lucide-react"
import { useSession } from "next-auth/react"
import { useCurrency } from "@/contexts/CurrencyContext"
import { useVisibility } from "@/contexts/VisibilityContext"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface ExpenseCategory {
  name: string
  value: number
  color?: string
  percentage?: number
}

interface MultiChartWidgetProps {
  month: number
  year: number
}

type ChartType = 'donut' | 'treemap' | 'bullet' | 'sparklines'

const COLORS = [
  '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#6366f1', '#84cc16', '#f97316', '#14b8a6',
  '#a855f7', '#3b82f6', '#eab308', '#64748b', '#f43f5e'
]

const CHART_OPTIONS = [
  { value: 'donut', label: 'Donut', icon: PieChartIcon, description: 'Vista tradicional circular' },
  { value: 'treemap', label: 'Treemap', icon: Grid3x3, description: 'Rectángulos proporcionales' },
  { value: 'sparklines', label: 'Tendencias', icon: TrendingUp, description: 'Mini-gráficos' }
]



// Componente Sparklines
function SparklineChart({ data, last3MonthsData }: { data: ExpenseCategory[], last3MonthsData: { month: string; data: ExpenseCategory[] }[] }) {
  const { formatMoney } = useCurrency()
  const { valuesVisible } = useVisibility()
  
  return (
    <div className="space-y-4">
      {data.slice(0, 6).map((category, index) => {
        // Construir datos de sparkline para los últimos 3 meses
        const sparklineData = last3MonthsData.map((monthData, monthIndex) => {
          const categoryInMonth = monthData.data.find(c => c.name === category.name)
          return {
            value: categoryInMonth?.value || 0,
            month: monthData.month,
            monthIndex
          }
        })
        
        // Calcular tendencia general (comparar primer vs último mes)
        const firstValue = sparklineData[0]?.value || 0
        const lastValue = sparklineData[sparklineData.length - 1]?.value || 0
        const trend = lastValue > firstValue ? 'up' : lastValue < firstValue ? 'down' : 'same'
        const changePercent = firstValue > 0 
          ? ((lastValue - firstValue) / firstValue * 100) 
          : lastValue > 0 ? 100 : 0
        
        return (
          <div key={category.name} className="flex items-center justify-between p-2 rounded border">
            <div className="flex-1">
              <div className="font-medium text-sm truncate">{category.name}</div>
              <div className="text-lg font-bold">
                {valuesVisible ? formatMoney(lastValue) : "***"}
              </div>
              <div className={`text-xs flex items-center gap-1 ${
                trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'
              }`}>
                {changePercent !== 0 && (
                  <>
                    <TrendingUp className={`h-3 w-3 ${trend === 'down' ? 'rotate-180' : ''}`} />
                    {changePercent.toFixed(1)}% últimos 3 meses
                  </>
                )}
                {changePercent === 0 && (
                  <span className="text-gray-500">Sin cambios</span>
                )}
              </div>
            </div>
            <div className="w-20 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData}>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={category.color || COLORS[index]} 
                    strokeWidth={2}
                    dot={{ fill: category.color || COLORS[index], r: 2 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Componente principal
export function MultiChartWidget({ month, year }: MultiChartWidgetProps) {
  const { data: session } = useSession()
  const { formatMoney } = useCurrency()
  const { valuesVisible } = useVisibility()
  
  const [loading, setLoading] = useState(false)
  const [expensesData, setExpensesData] = useState<ExpenseCategory[]>([])
  const [chartType, setChartType] = useState<ChartType>('donut')
  const [last3MonthsData, setLast3MonthsData] = useState<{ month: string; data: ExpenseCategory[] }[]>([])
  
  const currentMonth = month
  const currentYear = year
  
  // Constante para localStorage
  const STORAGE_KEY = `multiChartWidget-filters-${session?.user?.id || 'guest'}`
  
  // Cargar datos
  const fetchExpensesByCategory = async () => {
    if (!session?.user?.id) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/gastos?month=${currentMonth + 1}&year=${currentYear}`)
      if (!response.ok) throw new Error('Error al cargar gastos')
      
      const data = await response.json()
      const soloGastos = data.filter((item: any) => item.tipoTransaccion === 'expense')
      
      // Agrupar por categoría usando fechaImputacion
      const categorias: { [key: string]: number } = {}
      soloGastos.forEach((gasto: any) => {
        // Usar fechaImputacion si está disponible, si no usar fecha
        const fechaParaAgrupar = gasto.fechaImputacion ? new Date(gasto.fechaImputacion) : new Date(gasto.fecha)
        const mesImputacion = fechaParaAgrupar.getMonth()
        const anioImputacion = fechaParaAgrupar.getFullYear()
        
        // Solo incluir si coincide con el mes actual por fechaImputacion
        if (mesImputacion === currentMonth && anioImputacion === currentYear) {
          const categoria = gasto.categoria?.nombre || gasto.categoria || 'Sin categoría'
          categorias[categoria] = (categorias[categoria] || 0) + Number(gasto.monto)
        }
      })
      
      // Convertir a array y ordenar
      const categoriasArray = Object.entries(categorias)
        .map(([name, value], index) => ({
          name,
          value,
          color: COLORS[index % COLORS.length]
        }))
        .sort((a, b) => b.value - a.value)
      
      setExpensesData(categoriasArray)
      
      // Cargar datos de los últimos 3 meses para tendencias (usando fechaImputacion)
      const monthsData: { month: string; data: ExpenseCategory[] }[] = []
      
      for (let i = 2; i >= 0; i--) {
        const targetMonth = currentMonth - i < 0 ? 12 + (currentMonth - i) : currentMonth - i
        const targetYear = currentMonth - i < 0 ? currentYear - 1 : currentYear
        
        try {
          const response = await fetch(`/api/gastos?month=${targetMonth + 1}&year=${targetYear}`)
          if (response.ok) {
            const data = await response.json()
            const gastos = data.filter((item: any) => item.tipoTransaccion === 'expense')
            
            const categorias: { [key: string]: number } = {}
            gastos.forEach((gasto: any) => {
              // Usar fechaImputacion si está disponible, si no usar fecha
              const fechaParaAgrupar = gasto.fechaImputacion ? new Date(gasto.fechaImputacion) : new Date(gasto.fecha)
              const mesImputacion = fechaParaAgrupar.getMonth()
              const anioImputacion = fechaParaAgrupar.getFullYear()
              
              // Solo incluir si coincide con el mes objetivo por fechaImputacion
              if (mesImputacion === targetMonth && anioImputacion === targetYear) {
                const categoria = gasto.categoria?.nombre || gasto.categoria || 'Sin categoría'
                categorias[categoria] = (categorias[categoria] || 0) + Number(gasto.monto)
              }
            })
            
            const categoriasArray = Object.entries(categorias)
              .map(([name, value], index) => ({
                name,
                value,
                color: COLORS[index % COLORS.length]
              }))
            
            const monthLabel = format(new Date(targetYear, targetMonth), 'MMM yyyy', { locale: es })
            monthsData.push({
              month: monthLabel,
              data: categoriasArray
            })
          }
        } catch (error) {
          console.error(`Error loading data for month ${targetMonth}/${targetYear}:`, error)
        }
      }
      
      setLast3MonthsData(monthsData)
      
      // Crear filtros de categorías
      const total = categoriasArray.reduce((sum, cat) => sum + cat.value, 0)
      const hiddenCategories = loadPreferences()
      const filters = categoriasArray.map(cat => {
        const percentage = total > 0 ? (cat.value / total) * 100 : 0
        return {
          name: cat.name,
          visible: !hiddenCategories.includes(cat.name),
          value: cat.value,
          percentage
        }
      })
      setCategoryFilters(filters)
      
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchExpensesByCategory()
  }, [session, currentMonth, currentYear])
  
  // useEffect para cargar preferencias del usuario
  useEffect(() => {
    if (session?.user?.id) {
      const hiddenCategories = loadPreferences()
      // Las preferencias del tipo de gráfico se cargan dentro de loadPreferences()
      // Solo inicializamos los filtros aquí si hay categorías cargadas
      if (expensesData.length > 0) {
        const filters = expensesData.map((category, index) => ({
          name: category.name,
          visible: !hiddenCategories.includes(category.name),
          value: category.value,
          percentage: category.value / expensesData.reduce((sum, d) => sum + d.value, 0) * 100
        }))
        setCategoryFilters(filters)
      }
    }
  }, [session?.user?.id, expensesData])
  
  // Estados para filtros (copiados del componente original)
  const [categoryFilters, setCategoryFilters] = useState<{ name: string; visible: boolean; value: number; percentage: number }[]>([])
  const [showFilters, setShowFilters] = useState(false)
  
  // Calcular datos filtrados
  const filteredData = expensesData.filter(item => {
    const filter = categoryFilters.find(f => f.name === item.name)
    return filter ? filter.visible : true
  })
  
  const totalVisible = filteredData.reduce((sum, d) => sum + d.value, 0)
  const totalOriginal = expensesData.reduce((sum, d) => sum + d.value, 0)
  
  // Funciones de filtro
  const toggleCategoryVisibility = (categoryName: string) => {
    setCategoryFilters(prev => {
      const updated = prev.map(filter =>
        filter.name === categoryName
          ? { ...filter, visible: !filter.visible }
          : filter
      )
      // Guardar automáticamente
      setTimeout(() => savePreferences(), 100)
      return updated
    })
  }
  
  const toggleAllCategories = (visible: boolean) => {
    setCategoryFilters(prev => prev.map(filter => ({ ...filter, visible })))
  }
  
  // Guardar preferencias en localStorage
  const savePreferences = () => {
    const hiddenCategories = categoryFilters.filter(f => !f.visible).map(f => f.name)
    const preferences = {
      hiddenCategories,
      chartType
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  }
  
  // Cargar preferencias desde localStorage
  const loadPreferences = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const preferences = JSON.parse(saved)
        
        // Restaurar tipo de gráfico
        if (preferences.chartType && CHART_OPTIONS.find(opt => opt.value === preferences.chartType)) {
          setChartType(preferences.chartType)
        } else {
          // Si no hay tipo guardado, usar donut por defecto
          setChartType('donut')
        }
        
        return preferences.hiddenCategories || []
      } else {
        // Si no hay preferencias guardadas, usar donut por defecto
        setChartType('donut')
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
      setChartType('donut') // En caso de error, usar donut por defecto
    }
    return []
  }
  
  const renderChart = () => {
    if (loading) {
      return <Skeleton className="h-64 w-full" />
    }
    
    if (expensesData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay gastos registrados este mes</p>
          </div>
        </div>
      )
    }

    if (filteredData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p>Todas las categorías están ocultas</p>
            <p className="text-xs mt-1">Usa los filtros para mostrar categorías</p>
          </div>
        </div>
      )
    }
    
    switch (chartType) {
      case 'donut':
        return (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filteredData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => 
                    percent > 0.05 ? `${name.length > 10 ? name.substring(0, 10) + '...' : name}: ${(percent * 100).toFixed(0)}%` : ''
                  }
                  labelLine={false}
                >
                  {filteredData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [
                    valuesVisible ? formatMoney(value) : "***", 
                    "Monto"
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )
        
      case 'treemap':
        return (
          <div className="h-64 grid grid-cols-4 gap-2 p-4">
            {filteredData.slice(0, 8).map((category, index) => {
              const percentage = (category.value / totalVisible) * 100
              return (
                <div
                  key={category.name}
                  className="relative rounded p-2 text-white text-xs font-bold flex items-center justify-center text-center"
                  style={{
                    backgroundColor: category.color,
                    height: `${Math.max(40, (percentage / 5) * 40)}px`
                  }}
                  title={`${category.name}: ${valuesVisible ? formatMoney(category.value) : "***"} (${percentage.toFixed(1)}%)`}
                >
                  <div>
                    <div className="truncate">{category.name.length > 8 ? category.name.substring(0, 6) + '...' : category.name}</div>
                    <div className="text-xs">{percentage.toFixed(0)}%</div>
                  </div>
                </div>
              )
            })}
          </div>
        )
        
              case 'sparklines':
        return <SparklineChart data={filteredData} last3MonthsData={last3MonthsData} />
        
      default:
        return null
    }
  }
  

  const periodLabel = format(new Date(currentYear, currentMonth), 'MMMM yyyy', { locale: es })
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribución de Gastos
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="capitalize">{periodLabel}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {expensesData.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {filteredData.length}/{expensesData.length} categorías
                </Badge>
                {totalVisible !== totalOriginal && (
                  <Badge variant="secondary" className="text-xs">
                    {((totalVisible / totalOriginal) * 100).toFixed(0)}% visible
                  </Badge>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Popover open={showFilters} onOpenChange={setShowFilters}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Filtros de Categorías</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAllCategories(true)}
                        className="h-6 px-2 text-xs"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Todas
                      </Button>
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {categoryFilters.map((filter, index) => (
                        <div key={filter.name} className="flex items-center justify-between space-x-2">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <Checkbox
                              checked={filter.visible}
                              onCheckedChange={() => toggleCategoryVisibility(filter.name)}
                            />
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <div 
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <span className="text-sm truncate">{filter.name}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs font-medium">
                              {filter.percentage.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {valuesVisible ? formatMoney(filter.value) : "***"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Select 
                value={chartType} 
                onValueChange={(value: ChartType) => {
                  setChartType(value)
                  setTimeout(() => savePreferences(), 100)
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Gráfico" />
                </SelectTrigger>
                <SelectContent>
                  {CHART_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {renderChart()}
        
        {expensesData.length > 0 && (
          <div className="mt-4 text-center">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">
                Total mostrado: {valuesVisible ? formatMoney(totalVisible) : "***"}
              </span>
              {totalVisible !== totalOriginal && (
                <span className="ml-2">({((totalVisible / totalOriginal) * 100).toFixed(0)}% del total)</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {filteredData.length} de {expensesData.length} categorías mostradas
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 