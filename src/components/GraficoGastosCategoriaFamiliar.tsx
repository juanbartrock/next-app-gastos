"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  Users, 
  Filter, 
  RotateCcw, 
  Eye, 
  EyeOff,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Hash,
  Percent,
  Crown,
  AlertCircle,
  RefreshCw
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { useCurrency } from "@/contexts/CurrencyContext"

interface GastoCategoriaFamiliar {
  categoria: string
  grupoCategoria: string | null
  totalGasto: number
  cantidadTransacciones: number
  promedioTransaccion: number
  participacionPorcentual: number
  usuarios: Array<{
    usuario: string
    totalGasto: number
    cantidadTransacciones: number
    participacionEnCategoria: number
  }>
}

interface EstadisticasGenerales {
  totalGastado: number
  totalTransacciones: number
  promedioTransaccion: number
  cantidadCategorias: number
  categoriaTopGasto: GastoCategoriaFamiliar | null
  mes: string
  periodo: {
    inicio: string
    fin: string
  }
}

interface CategoriaDisponible {
  descripcion: string
  grupo_categoria: string | null
}

interface Props {
  mesSeleccionado: string
}

const COLORES_GRAFICO = [
  '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#8b5cf6', '#6366f1', '#84cc16', '#f97316',
  '#14b8a6', '#a855f7', '#3b82f6', '#eab308', '#64748b'
]

export function GraficoGastosCategoriaFamiliar({ mesSeleccionado }: Props) {
  const { formatMoney } = useCurrency()
  
  // Estados principales
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [datos, setDatos] = useState<GastoCategoriaFamiliar[]>([])
  const [estadisticasGenerales, setEstadisticasGenerales] = useState<EstadisticasGenerales | null>(null)
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<CategoriaDisponible[]>([])
  
  // Estados de filtros
  const [montoMinimo, setMontoMinimo] = useState('')
  const [montoMaximo, setMontoMaximo] = useState('')
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([])
  const [incluirSinCategoria, setIncluirSinCategoria] = useState(true)
  const [tipoVisualizacion, setTipoVisualizacion] = useState<'barras' | 'pie'>('barras')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [mostrarDetallesUsuarios, setMostrarDetallesUsuarios] = useState(false)

  // Cargar datos
  const cargarDatos = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        mes: mesSeleccionado,
        montoMinimo: montoMinimo || '0',
        montoMaximo: montoMaximo || '999999999',
        incluirSinCategoria: incluirSinCategoria.toString()
      })

      if (categoriasSeleccionadas.length > 0) {
        params.append('categorias', categoriasSeleccionadas.join(','))
      }

      const response = await fetch(`/api/informes/gastos-categoria-familiar?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al cargar datos')
      }

      const resultado = await response.json()
      setDatos(resultado.estadisticasPorCategoria)
      setEstadisticasGenerales(resultado.estadisticasGenerales)
      setCategoriasDisponibles(resultado.categoriasDisponibles)

    } catch (error) {
      console.error('Error al cargar datos:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
      toast.error('Error al cargar los datos del gráfico')
    } finally {
      setLoading(false)
    }
  }

  // Cargar datos al montar y cuando cambie el mes
  useEffect(() => {
    cargarDatos()
  }, [mesSeleccionado])

  // Funciones de filtros
  const aplicarFiltros = () => {
    cargarDatos()
  }

  const limpiarFiltros = () => {
    setMontoMinimo('')
    setMontoMaximo('')
    setCategoriasSeleccionadas([])
    setIncluirSinCategoria(true)
    // Los datos se recargarán automáticamente en el próximo useEffect
    setTimeout(cargarDatos, 100)
  }

  const toggleCategoria = (categoria: string) => {
    setCategoriasSeleccionadas(prev => 
      prev.includes(categoria)
        ? prev.filter(c => c !== categoria)
        : [...prev, categoria]
    )
  }

  const seleccionarTodasCategorias = () => {
    const todasLasCategorias = categoriasDisponibles.map(c => c.descripcion)
    setCategoriasSeleccionadas(todasLasCategorias)
  }

  const deseleccionarTodasCategorias = () => {
    setCategoriasSeleccionadas([])
  }

  // Preparar datos para gráficos
  const datosGrafico = datos.map((item, index) => ({
    categoria: item.categoria.length > 15 ? item.categoria.substring(0, 12) + '...' : item.categoria,
    categoriaCompleta: item.categoria,
    monto: item.totalGasto,
    transacciones: item.cantidadTransacciones,
    porcentaje: item.participacionPorcentual,
    promedio: item.promedioTransaccion,
    color: COLORES_GRAFICO[index % COLORES_GRAFICO.length],
    usuarios: item.usuarios
  }))

  // Componente de tooltip personalizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 border rounded-lg p-4 shadow-lg">
          <p className="font-medium text-sm">{data.categoriaCompleta}</p>
          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {formatMoney(data.monto)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {data.transacciones} transacciones
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {data.porcentaje.toFixed(1)}% del total
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Promedio: {formatMoney(data.promedio)}
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            Error al cargar datos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            onClick={cargarDatos} 
            variant="outline" 
            className="mt-4"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              {tipoVisualizacion === 'barras' ? (
                <BarChart3 className="h-6 w-6 text-white" />
              ) : (
                <PieChartIcon className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <CardTitle className="text-xl font-bold">
                Gastos por Categoría Familiar
              </CardTitle>
              <CardDescription className="text-base">
                Análisis detallado de gastos familiares en{' '}
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  {estadisticasGenerales?.mes}
                </span>
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {datos.length > 0 && (
              <>
                <Badge variant="outline" className="text-xs">
                  {datos.length} categorías
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {formatMoney(estadisticasGenerales?.totalGastado || 0)}
                </Badge>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className={mostrarFiltros ? "bg-purple-100 dark:bg-purple-900" : ""}
            >
              <Filter className="h-4 w-4" />
            </Button>

            <Select value={tipoVisualizacion} onValueChange={(value: 'barras' | 'pie') => setTipoVisualizacion(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="barras">Barras</SelectItem>
                <SelectItem value="pie">Circular</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Panel de filtros */}
        {mostrarFiltros && (
          <div className="mt-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-purple-200 dark:border-purple-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="montoMinimo">Monto mínimo</Label>
                <Input
                  id="montoMinimo"
                  type="number"
                  placeholder="0"
                  value={montoMinimo}
                  onChange={(e) => setMontoMinimo(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="montoMaximo">Monto máximo</Label>
                <Input
                  id="montoMaximo"
                  type="number"
                  placeholder="Sin límite"
                  value={montoMaximo}
                  onChange={(e) => setMontoMaximo(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Categorías ({categoriasSeleccionadas.length} seleccionadas)</Label>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={seleccionarTodasCategorias}
                      className="h-6 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-950"
                      disabled={categoriasDisponibles.length === 0}
                    >
                      Todas
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={deseleccionarTodasCategorias}
                      className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
                      disabled={categoriasSeleccionadas.length === 0}
                    >
                      Ninguna
                    </Button>
                  </div>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1 p-2 border rounded">
                  {categoriasDisponibles.map(categoria => (
                    <div key={categoria.descripcion} className="flex items-center space-x-2">
                      <Checkbox
                        id={categoria.descripcion}
                        checked={categoriasSeleccionadas.includes(categoria.descripcion)}
                        onCheckedChange={() => toggleCategoria(categoria.descripcion)}
                      />
                      <label
                        htmlFor={categoria.descripcion}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {categoria.descripcion}
                      </label>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sin-categoria"
                      checked={incluirSinCategoria}
                      onCheckedChange={(checked) => setIncluirSinCategoria(checked === true)}
                    />
                    <label
                      htmlFor="sin-categoria"
                      className="text-sm font-medium leading-none text-gray-500"
                    >
                      Sin categoría
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Acciones</Label>
                <div className="flex gap-2">
                  <Button onClick={aplicarFiltros} size="sm" disabled={loading}>
                    <Filter className="h-4 w-4 mr-1" />
                    Aplicar
                  </Button>
                  <Button onClick={limpiarFiltros} variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Limpiar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {datos.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl">
            <div className="text-center space-y-4">
              <BarChart3 className="h-16 w-16 mx-auto text-gray-400 opacity-50" />
              <div>
                <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                  📊 No hay datos disponibles
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No se encontraron gastos familiares con los filtros aplicados
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Estadísticas generales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg">
                <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-bold text-lg">{formatMoney(estadisticasGenerales?.totalGastado || 0)}</span>
                </div>
                <div className="text-xs text-gray-500">Total gastado</div>
              </div>
              
              <div className="text-center p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg">
                <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400">
                  <Hash className="h-4 w-4" />
                  <span className="font-bold text-lg">{estadisticasGenerales?.totalTransacciones}</span>
                </div>
                <div className="text-xs text-gray-500">Transacciones</div>
              </div>
              
              <div className="text-center p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg">
                <div className="flex items-center justify-center gap-1 text-purple-600 dark:text-purple-400">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-bold text-lg">{formatMoney(estadisticasGenerales?.promedioTransaccion || 0)}</span>
                </div>
                <div className="text-xs text-gray-500">Promedio</div>
              </div>
              
              <div className="text-center p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg">
                <div className="flex items-center justify-center gap-1 text-orange-600 dark:text-orange-400">
                  <Crown className="h-4 w-4" />
                  <span className="font-bold text-lg">{estadisticasGenerales?.cantidadCategorias}</span>
                </div>
                <div className="text-xs text-gray-500">Categorías</div>
              </div>
            </div>

            {/* Gráfico principal */}
            <div className="h-96 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                {tipoVisualizacion === 'barras' ? (
                  <BarChart data={datosGrafico} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="categoria" 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="monto" 
                      fill="url(#gradientBar)"
                      radius={[6, 6, 0, 0]}
                      stroke="#8b5cf6"
                      strokeWidth={1}
                    />
                    <defs>
                      <linearGradient id="gradientBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={datosGrafico}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="monto"
                      label={({ categoria, porcentaje }) => 
                        porcentaje > 5 ? `${categoria}: ${porcentaje.toFixed(1)}%` : ''
                      }
                      labelLine={false}
                    >
                      {datosGrafico.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Toggle para detalles de usuarios */}
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={() => setMostrarDetallesUsuarios(!mostrarDetallesUsuarios)}
                className="flex items-center gap-2"
              >
                {mostrarDetallesUsuarios ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {mostrarDetallesUsuarios ? 'Ocultar' : 'Mostrar'} detalles por usuario
              </Button>
            </div>

            {/* Detalles por usuario */}
            {mostrarDetallesUsuarios && (
              <div className="mt-6 space-y-4">
                <Separator />
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Participación por Usuario
                </h3>
                
                <div className="grid gap-4">
                  {datos.map((categoria, index) => (
                    <div 
                      key={categoria.categoria}
                      className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: COLORES_GRAFICO[index % COLORES_GRAFICO.length] }}
                          />
                          {categoria.categoria}
                        </h4>
                        <Badge variant="outline">
                          {formatMoney(categoria.totalGasto)} ({categoria.participacionPorcentual.toFixed(1)}%)
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {categoria.usuarios.map(usuario => (
                          <div 
                            key={usuario.usuario}
                            className="p-3 bg-gray-50 dark:bg-gray-700 rounded border"
                          >
                            <div className="font-medium text-sm">{usuario.usuario}</div>
                            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                              {formatMoney(usuario.totalGasto)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {usuario.cantidadTransacciones} transacciones ({usuario.participacionEnCategoria.toFixed(1)}%)
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
} 