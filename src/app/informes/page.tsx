"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart3, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon, 
  CalendarDays, 
  TrendingUp, 
  DollarSign, 
  Users, 
  CreditCard, 
  RefreshCw, 
  Wallet,
  ArrowUpDown
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { DatePickerWithRange } from "@/components/DatePickerWithRange"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DateRange } from "react-day-picker"
import { useSession } from "next-auth/react"
import { format, addDays, subMonths, isWithinInterval, isBefore } from "date-fns"
import { es } from "date-fns/locale"
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts'

// Interfaces para los datos
interface Gasto {
  id: number
  concepto: string
  monto: number
  fecha: string
  categoria: string
  tipoTransaccion: string
  tipoMovimiento: string
}

interface Presupuesto {
  id: number
  nombre: string
  monto: number
  mes: number
  año: number
  gastoActual: number
  porcentajeConsumido: number
  disponible: number
  categoria?: {
    id: number
    descripcion: string
  }
}

interface GastoRecurrente {
  id: number
  concepto: string
  monto: number
  periodicidad: string
  proximaFecha?: string
  estado: string
  categoria?: {
    id: number
    descripcion: string
  }
}

interface Financiacion {
  id: number
  montoCuota: number
  fechaProximoPago: string
  gasto: {
    concepto: string
    monto: number
  }
}

// Interfaz para datos de gastos por categoría
interface GastoPorCategoria {
  categoria: string
  monto: number
  color: string
}

// Interfaz para datos de evolución de gastos
interface GastoMensual {
  mes: string
  monto: number
}

// Colores para el gráfico de pie
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1'];

export default function InformesPage() {
  const { data: session } = useSession()
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  })
  
  const [currency, setCurrency] = useState("ARS")
  
  // Estados para almacenar los datos de las tarjetas
  const [totalGastos, setTotalGastos] = useState(0)
  const [presupuestos, setPresupuestos] = useState<{ total: number, cumplidos: number }>({ total: 0, cumplidos: 0 })
  const [gastosRecurrentes, setGastosRecurrentes] = useState(0)
  const [financiaciones, setFinanciaciones] = useState(0)
  const [cargando, setCargando] = useState(true)
  
  // Estados para los nuevos componentes
  const [gastosPorCategoria, setGastosPorCategoria] = useState<GastoPorCategoria[]>([])
  const [evolucionGastos, setEvolucionGastos] = useState<GastoMensual[]>([])
  const [proximosPagos, setProximosPagos] = useState<GastoRecurrente[]>([])
  const [presupuestosCriticos, setPresupuestosCriticos] = useState<Presupuesto[]>([])
  const [todosDatosPresupuestos, setTodosDatosPresupuestos] = useState<Presupuesto[]>([])

  // Función para obtener los datos según el mes seleccionado
  useEffect(() => {
    const fetchData = async () => {
      if (!session) return
      
      try {
        setCargando(true)
        
        // Obtener el mes y año del selector
        const mes = dateRange.from ? dateRange.from.getMonth() + 1 : new Date().getMonth() + 1
        const año = dateRange.from ? dateRange.from.getFullYear() : new Date().getFullYear()
        
        // Fechas para filtrar (primero y último día del mes)
        const fechaInicio = new Date(año, mes - 1, 1)
        const fechaFin = new Date(año, mes, 0)
        
        // 1. Obtener gastos del mes
        const gastosResponse = await fetch(`/api/gastos?desde=${fechaInicio.toISOString()}&hasta=${fechaFin.toISOString()}`)
        const gastos = await gastosResponse.json()
        
        // Filtrar solo los gastos (no ingresos) y sumar el total
        const soloGastos = gastos.filter((g: Gasto) => g.tipoTransaccion === 'expense')
        const sumaGastos = soloGastos.reduce((acc: number, g: Gasto) => acc + g.monto, 0)
        setTotalGastos(sumaGastos)
        
        // 2. Obtener presupuestos del mes
        const presupuestosResponse = await fetch(`/api/presupuestos?mes=${mes}&año=${año}`)
        const datosPresupuestos = await presupuestosResponse.json()
        
        // Contar presupuestos cumplidos (porcentaje consumido <= 100%)
        const totalPresupuestos = datosPresupuestos.length
        const cumplidosPresupuestos = datosPresupuestos.filter(
          (p: Presupuesto) => p.porcentajeConsumido <= 100
        ).length
        
        setPresupuestos({
          total: totalPresupuestos,
          cumplidos: cumplidosPresupuestos
        })
        
        // Guardar todos los datos de presupuestos para usar después
        setTodosDatosPresupuestos(datosPresupuestos)
        
        // Filtrar presupuestos críticos (más del 75% consumido o que hayan superado el límite)
        const criticos = datosPresupuestos.filter(
          (p: Presupuesto) => p.porcentajeConsumido > 75
        )
        setPresupuestosCriticos(criticos)
        
        // 3. Obtener gastos recurrentes
        const recurrentesResponse = await fetch('/api/recurrentes')
        const gastosRecurrentes = await recurrentesResponse.json()
        
        // Sumar el total de gastos recurrentes
        const totalRecurrentes = gastosRecurrentes.reduce(
          (acc: number, g: GastoRecurrente) => acc + g.monto, 0
        )
        
        setGastosRecurrentes(totalRecurrentes)
        
        // Filtrar próximos pagos (próximos 15 días)
        const fechaHoy = new Date()
        const fecha15Dias = addDays(fechaHoy, 15)
        
        const proximos = gastosRecurrentes.filter((g: GastoRecurrente) => {
          if (!g.proximaFecha) return false
          const fechaPago = new Date(g.proximaFecha)
          return isBefore(fechaPago, fecha15Dias) && !isBefore(fechaPago, fechaHoy)
        }).sort((a: GastoRecurrente, b: GastoRecurrente) => {
          return new Date(a.proximaFecha || '').getTime() - new Date(b.proximaFecha || '').getTime()
        })
        
        setProximosPagos(proximos)
        
        // 4. Obtener financiaciones
        const financiacionesResponse = await fetch('/api/financiacion')
        const datosFinanciaciones = await financiacionesResponse.json()
        
        // Filtrar financiaciones con próximo pago en el mes seleccionado y sumar
        const financiacionesMes = datosFinanciaciones.filter((f: Financiacion) => {
          const fechaPago = f.fechaProximoPago ? new Date(f.fechaProximoPago) : null
          return fechaPago && 
                 fechaPago.getMonth() + 1 === mes && 
                 fechaPago.getFullYear() === año
        })
        
        const totalFinanciaciones = financiacionesMes.reduce(
          (acc: number, f: Financiacion) => acc + f.montoCuota, 0
        )
        
        setFinanciaciones(totalFinanciaciones)
        
        // 5. Procesar datos para el gráfico de gastos por categoría
        const categorias: { [key: string]: number } = {}
        
        soloGastos.forEach((gasto: Gasto) => {
          const cat = gasto.categoria || 'Sin categoría'
          categorias[cat] = (categorias[cat] || 0) + gasto.monto
        })
        
        const datosPieChart: GastoPorCategoria[] = Object.keys(categorias).map((cat, index) => ({
          categoria: cat,
          monto: categorias[cat],
          color: COLORS[index % COLORS.length]
        })).sort((a, b) => b.monto - a.monto) // Ordenar de mayor a menor
        
        setGastosPorCategoria(datosPieChart)
        
        // 6. Obtener datos para el gráfico de evolución de gastos (últimos 6 meses)
        const fechas = []
        for (let i = 0; i < 6; i++) {
          const fecha = subMonths(new Date(), i)
          fechas.push({
            mes: format(fecha, 'MMM yyyy', { locale: es }),
            fechaInicio: new Date(fecha.getFullYear(), fecha.getMonth(), 1),
            fechaFin: new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0)
          })
        }
        
        // Obtener gastos para cada mes
        const promesasGastos = fechas.map(async (periodo) => {
          const response = await fetch(`/api/gastos?desde=${periodo.fechaInicio.toISOString()}&hasta=${periodo.fechaFin.toISOString()}`)
          const gastosMes = await response.json()
          const soloGastosMes = gastosMes.filter((g: Gasto) => g.tipoTransaccion === 'expense')
          const totalMes = soloGastosMes.reduce((acc: number, g: Gasto) => acc + g.monto, 0)
          
          return {
            mes: periodo.mes,
            monto: totalMes
          }
        })
        
        const datosEvolucion = await Promise.all(promesasGastos)
        setEvolucionGastos(datosEvolucion.reverse()) // Ordenar de más antiguo a más reciente
        
      } catch (error) {
        console.error('Error al cargar datos:', error)
      } finally {
        setCargando(false)
      }
    }
    
    fetchData()
  }, [dateRange, session])
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 py-6 md:px-6 bg-background border-b">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Informes Financieros</h1>
            <p className="text-muted-foreground mt-1">Analiza y visualiza tu situación financiera</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <DatePickerWithRange 
              date={dateRange} 
              setDate={(date) => setDateRange(date)}
              className="w-full sm:w-auto"
            />
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Moneda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ARS">ARS</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="gastos">Análisis de Gastos</TabsTrigger>
            <TabsTrigger value="presupuestos">Presupuestos</TabsTrigger>
            <TabsTrigger value="finanzas">Finanzas</TabsTrigger>
            <TabsTrigger value="avanzado">Avanzado</TabsTrigger>
          </TabsList>
          
          {/* DASHBOARD EJECUTIVO */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
                </CardHeader>
                <CardContent>
                  {cargando ? (
                    <div className="text-2xl font-bold">Cargando...</div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">${totalGastos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
                      <p className="text-xs text-muted-foreground">
                        Gastos del mes {dateRange.from ? format(dateRange.from, 'MMMM yyyy', { locale: es }) : ''}
                      </p>
                      <Progress value={65} className="mt-2 h-1" />
                    </>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Presupuestos</CardTitle>
                </CardHeader>
                <CardContent>
                  {cargando ? (
                    <div className="text-2xl font-bold">Cargando...</div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{presupuestos.cumplidos}/{presupuestos.total}</div>
                      <p className="text-xs text-muted-foreground">
                        Categorías dentro del presupuesto
                      </p>
                      <Progress 
                        value={presupuestos.total > 0 ? (presupuestos.cumplidos / presupuestos.total) * 100 : 0} 
                        className="mt-2 h-1" 
                      />
                    </>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Gastos Recurrentes</CardTitle>
                </CardHeader>
                <CardContent>
                  {cargando ? (
                    <div className="text-2xl font-bold">Cargando...</div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">${gastosRecurrentes.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
                      <p className="text-xs text-muted-foreground">
                        {totalGastos > 0 ? `${Math.round((gastosRecurrentes / totalGastos) * 100)}% de tus gastos totales` : 'Sin gastos registrados'}
                      </p>
                      <Progress 
                        value={totalGastos > 0 ? (gastosRecurrentes / totalGastos) * 100 : 0} 
                        className="mt-2 h-1" 
                      />
                    </>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Financiaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  {cargando ? (
                    <div className="text-2xl font-bold">Cargando...</div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">${financiaciones.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
                      <p className="text-xs text-muted-foreground">
                        Pagos financiados este mes
                      </p>
                      <Progress 
                        value={totalGastos > 0 ? (financiaciones / totalGastos) * 100 : 0} 
                        className="mt-2 h-1" 
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="col-span-1 md:col-span-1 lg:col-span-1">
                <CardHeader>
                  <CardTitle>Gastos por Categoría</CardTitle>
                  <CardDescription>Distribución del último mes</CardDescription>
                </CardHeader>
                <CardContent className="text-center py-8">
                  {cargando ? (
                    <div className="flex justify-center items-center h-36">
                      <p>Cargando datos...</p>
                    </div>
                  ) : gastosPorCategoria.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={gastosPorCategoria}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="monto"
                            nameKey="categoria"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {gastosPorCategoria.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `$${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`} />
                        </PieChart>
                      </ResponsiveContainer>
                      
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {gastosPorCategoria.slice(0, 4).map((cat, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                            <span className="text-sm truncate" title={cat.categoria}>
                              {cat.categoria}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col justify-center items-center h-36">
                      <PieChartIcon className="h-12 w-12 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No hay datos disponibles</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="col-span-1 md:col-span-1 lg:col-span-2">
                <CardHeader>
                  <CardTitle>Evolución de Gastos</CardTitle>
                  <CardDescription>Últimos 6 meses</CardDescription>
                </CardHeader>
                <CardContent className="text-center py-6">
                  {cargando ? (
                    <div className="flex justify-center items-center h-36">
                      <p>Cargando datos...</p>
                    </div>
                  ) : evolucionGastos.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={evolucionGastos} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip formatter={(value) => `$${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`} />
                        <Legend />
                        <Line type="monotone" dataKey="monto" name="Gastos" stroke="#8884d8" activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col justify-center items-center h-36">
                      <LineChartIcon className="h-12 w-12 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No hay datos disponibles</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Próximos Pagos</CardTitle>
                  <CardDescription>Calendario de los próximos 15 días</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    {cargando ? (
                      <div className="flex justify-center items-center h-full">
                        <p>Cargando datos...</p>
                      </div>
                    ) : proximosPagos.length > 0 ? (
                      <div className="space-y-2">
                        {proximosPagos.map((pago) => (
                          <div key={pago.id} className="flex justify-between items-center border-b pb-2">
                            <div>
                              <p className="font-medium">{pago.concepto}</p>
                              <p className="text-sm text-muted-foreground">
                                Vence: {pago.proximaFecha ? format(new Date(pago.proximaFecha), 'dd/MM/yyyy') : 'Sin fecha'}
                              </p>
                            </div>
                            <Badge>${pago.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col justify-center items-center h-full">
                        <CalendarDays className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No hay pagos próximos</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Presupuestos Críticos</CardTitle>
                  <CardDescription>Categorías en riesgo de sobregasto</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    {cargando ? (
                      <div className="flex justify-center items-center h-full">
                        <p>Cargando datos...</p>
                      </div>
                    ) : presupuestosCriticos.length > 0 ? (
                      <div className="space-y-3">
                        {presupuestosCriticos.map((presupuesto) => (
                          <div key={presupuesto.id} className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">
                                {presupuesto.nombre || (presupuesto.categoria?.descripcion || 'Sin categoría')}
                              </span>
                              <span className={`text-sm ${presupuesto.porcentajeConsumido >= 100 ? "text-destructive font-bold" : "text-destructive"}`}>
                                {Math.round(presupuesto.porcentajeConsumido)}%
                              </span>
                            </div>
                            <Progress 
                              value={presupuesto.porcentajeConsumido > 100 ? 100 : presupuesto.porcentajeConsumido} 
                              className={`h-2 ${presupuesto.porcentajeConsumido >= 100 ? "bg-destructive/20" : ""}`} 
                            />
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">
                                ${presupuesto.gastoActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })} de ${presupuesto.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </span>
                              <span className={presupuesto.porcentajeConsumido >= 100 ? "text-destructive" : "text-green-600"}>
                                {presupuesto.porcentajeConsumido >= 100 
                                  ? `Excedido por $${Math.abs(presupuesto.disponible).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                                  : `Disponible: $${presupuesto.disponible.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                                }
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col justify-center items-center h-full">
                        <BarChart3 className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No hay presupuestos en riesgo</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Otras pestañas - Desactivadas temporalmente para corregir errores */}
          <TabsContent value="gastos" className="space-y-6">
            <div className="p-4 text-center">
              <p>Contenido no implementado</p>
            </div>
          </TabsContent>
          
          <TabsContent value="presupuestos" className="space-y-6">
            <div className="p-4 text-center">
              <p>Contenido no implementado</p>
            </div>
          </TabsContent>
          
          <TabsContent value="finanzas" className="space-y-6">
            <div className="p-4 text-center">
              <p>Contenido no implementado</p>
            </div>
          </TabsContent>
          
          <TabsContent value="avanzado" className="space-y-6">
            <div className="p-4 text-center">
              <p>Contenido no implementado</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}