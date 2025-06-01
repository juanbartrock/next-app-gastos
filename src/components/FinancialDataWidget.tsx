"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Settings, Eye, EyeOff, BarChart3, Filter, RotateCcw, Calendar } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface ExpenseCategory {
  name: string;
  value: number;
  color?: string;
}

interface CategoryFilter {
  name: string;
  visible: boolean;
  value: number;
  percentage: number;
}

interface FilterPreferences {
  hiddenCategories: string[];
  minPercentage: number;
  maxPercentage: number;
  autoHideByPercentage: boolean;
}

interface FinancialDataWidgetProps {
  month?: number;
  year?: number;
}

export function FinancialDataWidget({ month, year }: FinancialDataWidgetProps) {
  const { data: session } = useSession()
  const [expensesData, setExpensesData] = useState<ExpenseCategory[]>([])
  const [filteredData, setFilteredData] = useState<ExpenseCategory[]>([])
  const [categoryFilters, setCategoryFilters] = useState<CategoryFilter[]>([])
  const [expensesLoading, setExpensesLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  
  // Filtros avanzados
  const [minPercentage, setMinPercentage] = useState<number[]>([0])
  const [maxPercentage, setMaxPercentage] = useState<number[]>([100])
  const [autoHideByPercentage, setAutoHideByPercentage] = useState(false)

  // Usar fechas pasadas como props o las actuales como fallback
  const currentMonth = month ?? new Date().getMonth()
  const currentYear = year ?? new Date().getFullYear()

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#6B8EFF', '#82CA9D', '#FFC658', '#FF7C7C'];
  const STORAGE_KEY = `financial-widget-filters-${currentMonth}-${currentYear}`

  // Cargar preferencias guardadas (por mes/año específico)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const prefs: FilterPreferences = JSON.parse(saved)
        setMinPercentage([prefs.minPercentage || 0])
        setMaxPercentage([prefs.maxPercentage || 100])
        setAutoHideByPercentage(prefs.autoHideByPercentage || false)
      } else {
        // Resetear a valores por defecto si no hay preferencias para este mes
        setMinPercentage([0])
        setMaxPercentage([100])
        setAutoHideByPercentage(false)
      }
    } catch (error) {
      console.error('Error loading filter preferences:', error)
    }
  }, [STORAGE_KEY])

  // Guardar preferencias (específicas por mes/año)
  const savePreferences = () => {
    try {
      const prefs: FilterPreferences = {
        hiddenCategories: categoryFilters.filter(f => !f.visible).map(f => f.name),
        minPercentage: minPercentage[0],
        maxPercentage: maxPercentage[0],
        autoHideByPercentage
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    } catch (error) {
      console.error('Error saving filter preferences:', error)
    }
  }

  const fetchExpensesByCategory = async () => {
    if (!session?.user?.id) return
    
    try {
      setExpensesLoading(true)
      
      // Usar las fechas pasadas como props (currentMonth y currentYear)
      const startOfMonth = new Date(currentYear, currentMonth, 1)
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0)
      
      // Llamar a la API de gastos del mes especificado
      const response = await fetch(
        `/api/gastos?desde=${startOfMonth.toISOString()}&hasta=${endOfMonth.toISOString()}&usarFechaImputacion=true`
      )
      
      if (!response.ok) {
        throw new Error('Error al obtener gastos')
      }
      
      const gastos = await response.json()
      
      // Función para obtener la fecha contable (fechaImputacion o fecha como fallback)
      const obtenerFechaContable = (gasto: any): Date => {
        return gasto.fechaImputacion ? new Date(gasto.fechaImputacion) : new Date(gasto.fecha)
      }
      
      // Filtrar solo gastos (no ingresos) Y verificar que estén en el mes correcto usando fecha contable
      const soloGastos = gastos.filter((gasto: any) => {
        if (gasto.tipoTransaccion !== 'expense') return false
        
        // Verificar que la fecha contable esté realmente en el mes seleccionado
        const fechaContable = obtenerFechaContable(gasto)
        const mesGasto = fechaContable.getMonth()
        const añoGasto = fechaContable.getFullYear()
        
        return mesGasto === currentMonth && añoGasto === currentYear
      })
      
      // Agrupar por categoría
      const categorias: { [key: string]: number } = {}
      
      soloGastos.forEach((gasto: any) => {
        const categoria = gasto.categoria?.nombre || gasto.categoria || 'Sin categoría'
        categorias[categoria] = (categorias[categoria] || 0) + Number(gasto.monto)
      })
      
      // Convertir a array y ordenar por monto descendente
      const categoriasArray = Object.entries(categorias)
        .map(([name, value], index) => ({
          name,
          value,
          color: COLORS[index % COLORS.length]
        }))
        .sort((a, b) => b.value - a.value)
      
      // Calcular total para porcentajes
      const total = categoriasArray.reduce((sum, cat) => sum + cat.value, 0)
      
      // Cargar preferencias guardadas para aplicar filtros
      const saved = localStorage.getItem(STORAGE_KEY)
      let hiddenCategories: string[] = []
      if (saved) {
        try {
          const prefs: FilterPreferences = JSON.parse(saved)
          hiddenCategories = prefs.hiddenCategories || []
        } catch (error) {
          console.error('Error parsing saved preferences:', error)
        }
      }
      
      // Crear filtros de categorías
      const filters = categoriasArray.map(cat => {
        const percentage = total > 0 ? (cat.value / total) * 100 : 0
        let visible = !hiddenCategories.includes(cat.name)
        
        // Aplicar filtro automático por porcentaje si está habilitado
        if (autoHideByPercentage) {
          if (percentage < minPercentage[0] || percentage > maxPercentage[0]) {
            visible = false
          }
        }
        
        return {
          name: cat.name,
          visible,
          value: cat.value,
          percentage
        }
      })
      
      setExpensesData(categoriasArray)
      setCategoryFilters(filters)
      
    } catch (error) {
      console.error('Error al cargar datos de gastos:', error)
      setExpensesData([])
      setCategoryFilters([])
      setFilteredData([])
    } finally {
      setExpensesLoading(false)
    }
  }

  // Recargar datos cuando cambian el mes, año o la sesión
  useEffect(() => {
    fetchExpensesByCategory()
  }, [session?.user?.id, currentMonth, currentYear])

  // Actualizar datos filtrados cuando cambian los filtros
  useEffect(() => {
    let filtered = expensesData.filter(category => {
      const filter = categoryFilters.find(f => f.name === category.name)
      if (!filter) return false
      
      // Aplicar filtro de visibilidad manual
      if (!filter.visible) return false
      
      // Aplicar filtro automático por porcentaje
      if (autoHideByPercentage) {
        if (filter.percentage < minPercentage[0] || filter.percentage > maxPercentage[0]) {
          return false
        }
      }
      
      return true
    })
    
    setFilteredData(filtered)
  }, [categoryFilters, expensesData, minPercentage, maxPercentage, autoHideByPercentage])

  // Función para togglear visibilidad de categoría
  const toggleCategoryVisibility = (categoryName: string) => {
    setCategoryFilters(prev => 
      prev.map(filter => 
        filter.name === categoryName 
          ? { ...filter, visible: !filter.visible }
          : filter
      )
    )
  }

  // Función para mostrar/ocultar todas las categorías
  const toggleAllCategories = (visible: boolean) => {
    setCategoryFilters(prev => 
      prev.map(filter => ({ ...filter, visible }))
    )
  }

  // Función para resetear filtros
  const resetFilters = () => {
    setCategoryFilters(prev => prev.map(filter => ({ ...filter, visible: true })))
    setMinPercentage([0])
    setMaxPercentage([100])
    setAutoHideByPercentage(false)
    localStorage.removeItem(STORAGE_KEY)
  }

  // Función para aplicar filtro automático de categorías grandes/pequeñas
  const applyQuickFilter = (type: 'hideSmall' | 'hideLarge' | 'hideOutliers') => {
    const total = expensesData.reduce((sum, cat) => sum + cat.value, 0)
    
    setCategoryFilters(prev => prev.map(filter => {
      const percentage = total > 0 ? (filter.value / total) * 100 : 0
      
      switch (type) {
        case 'hideSmall':
          return { ...filter, visible: percentage >= 5 } // Ocultar categorías menores al 5%
        case 'hideLarge':
          return { ...filter, visible: percentage <= 30 } // Ocultar categorías mayores al 30%
        case 'hideOutliers':
          return { ...filter, visible: percentage >= 2 && percentage <= 40 } // Ocultar extremos
        default:
          return filter
      }
    }))
  }

  // Función para formatear números
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const total = filteredData.reduce((sum, item) => sum + item.value, 0)
      const percentage = total > 0 ? (data.value / total) * 100 : 0
      
      return (
        <div className="bg-background border rounded p-3 shadow-md">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">{formatCurrency(data.value)}</p>
          <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}% del total visible</p>
        </div>
      );
    }
    return null;
  };

  const totalVisible = filteredData.reduce((sum, cat) => sum + cat.value, 0)
  const totalOriginal = expensesData.reduce((sum, cat) => sum + cat.value, 0)
  const hiddenCount = categoryFilters.filter(f => !f.visible).length

  // Estadísticas para el modo análisis
  const stats = {
    avgCategoryValue: filteredData.length > 0 ? totalVisible / filteredData.length : 0,
    largestCategory: filteredData.length > 0 ? filteredData[0] : null,
    smallestCategory: filteredData.length > 0 ? filteredData[filteredData.length - 1] : null,
    concentration: filteredData.length > 0 ? (filteredData.slice(0, 3).reduce((sum, cat) => sum + cat.value, 0) / totalVisible) * 100 : 0
  }

  // Formatear el mes y año actual para mostrar en el título
  const periodLabel = format(new Date(currentYear, currentMonth), 'MMMM yyyy', { locale: es })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">Distribución de Gastos</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="capitalize">{periodLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {expensesData.length > 0 && (
              <>
                <Badge variant="outline" className="text-xs">
                  {filteredData.length}/{expensesData.length} categorías
                </Badge>
                {hiddenCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {hiddenCount} ocultas
                  </Badge>
                )}
              </>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnalysis(!showAnalysis)}
              className={showAnalysis ? "bg-primary/10" : ""}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filtros de Categorías</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetFilters}
                      className="h-6 px-2 text-xs"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reset
                    </Button>
                  </div>

                  {/* Filtros rápidos */}
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">FILTROS RÁPIDOS</Label>
                    <div className="flex gap-1 mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => applyQuickFilter('hideSmall')}
                        className="h-6 px-2 text-xs"
                      >
                        Ocultar pequeños
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => applyQuickFilter('hideLarge')}
                        className="h-6 px-2 text-xs"
                      >
                        Ocultar grandes
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => applyQuickFilter('hideOutliers')}
                        className="h-6 px-2 text-xs"
                      >
                        Sin extremos
                      </Button>
                    </div>
                  </div>

                  {/* Filtro automático por porcentaje */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={autoHideByPercentage}
                        onCheckedChange={setAutoHideByPercentage}
                      />
                      <Label className="text-sm">Filtro automático por porcentaje</Label>
                    </div>
                    
                    {autoHideByPercentage && (
                      <div className="space-y-3 pl-6">
                        <div>
                          <Label className="text-xs">Porcentaje mínimo: {minPercentage[0]}%</Label>
                          <Slider
                            value={minPercentage}
                            onValueChange={setMinPercentage}
                            max={maxPercentage[0] - 1}
                            step={0.5}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Porcentaje máximo: {maxPercentage[0]}%</Label>
                          <Slider
                            value={maxPercentage}
                            onValueChange={setMaxPercentage}
                            min={minPercentage[0] + 1}
                            max={100}
                            step={0.5}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Controles manuales */}
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-muted-foreground">CONTROL MANUAL</Label>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAllCategories(true)}
                        className="h-6 px-2 text-xs"
                      >
                        Todas
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAllCategories(false)}
                        className="h-6 px-2 text-xs"
                      >
                        Ninguna
                      </Button>
                    </div>
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
                            {formatCurrency(filter.value)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {totalVisible !== totalOriginal && (
                    <div className="pt-2 border-t text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Total visible:</span>
                        <span>{formatCurrency(totalVisible)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total original:</span>
                        <span>{formatCurrency(totalOriginal)}</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <Button
                      onClick={savePreferences}
                      size="sm"
                      className="w-full"
                    >
                      Guardar Preferencias
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {expensesLoading ? (
          <div className="flex items-center justify-center h-64">
            <Skeleton className="h-48 w-48 rounded-full" />
          </div>
        ) : expensesData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No hay datos de gastos disponibles</p>
              <p className="text-xs mt-1 capitalize">para {periodLabel}</p>
            </div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <EyeOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Todas las categorías están ocultas</p>
              <p className="text-xs mt-1">Usa los filtros para mostrar categorías</p>
            </div>
          </div>
        ) : (
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
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        
        <div className="mt-4 text-center">
          {filteredData.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Total mostrado: {formatCurrency(totalVisible)}</span>
              {totalVisible !== totalOriginal && (
                <span className="ml-2">({((totalVisible / totalOriginal) * 100).toFixed(0)}% del total)</span>
              )}
            </div>
          )}
          <div className="text-xs text-muted-foreground mt-1">
            {expensesData.length === 0 
              ? "Sin datos de gastos registrados" 
              : `${filteredData.length} de ${expensesData.length} categorías mostradas`
            }
          </div>
        </div>

        {/* Modo análisis */}
        {showAnalysis && filteredData.length > 0 && (
          <div className="mt-6 pt-4 border-t space-y-3">
            <h4 className="text-sm font-medium">Análisis de Distribución</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-muted-foreground">Promedio por categoría</div>
                <div className="font-medium">{formatCurrency(stats.avgCategoryValue)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Concentración (top 3)</div>
                <div className="font-medium">{stats.concentration.toFixed(1)}%</div>
              </div>
              {stats.largestCategory && (
                <div>
                  <div className="text-muted-foreground">Mayor gasto</div>
                  <div className="font-medium truncate">{stats.largestCategory.name}</div>
                  <div className="text-muted-foreground">{formatCurrency(stats.largestCategory.value)}</div>
                </div>
              )}
              {stats.smallestCategory && (
                <div>
                  <div className="text-muted-foreground">Menor gasto</div>
                  <div className="font-medium truncate">{stats.smallestCategory.name}</div>
                  <div className="text-muted-foreground">{formatCurrency(stats.smallestCategory.value)}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 