"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
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

export default function InformesPage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  })
  
  const [currency, setCurrency] = useState("ARS")
  
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
                  <div className="text-2xl font-bold">$45,231.89</div>
                  <p className="text-xs text-muted-foreground">+20.1% respecto al mes anterior</p>
                  <Progress value={65} className="mt-2 h-1" />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Presupuestos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8/12</div>
                  <p className="text-xs text-muted-foreground">Categorías dentro del presupuesto</p>
                  <Progress value={66} className="mt-2 h-1" />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Gastos Recurrentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$12,450</div>
                  <p className="text-xs text-muted-foreground">28% de tus gastos totales</p>
                  <Progress value={28} className="mt-2 h-1" />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Financiaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$9,230</div>
                  <p className="text-xs text-muted-foreground">4 financiaciones activas</p>
                  <Progress value={45} className="mt-2 h-1" />
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
                  <PieChart className="h-36 w-36 mx-auto text-primary" strokeWidth={1} />
                </CardContent>
              </Card>
              
              <Card className="col-span-1 md:col-span-1 lg:col-span-2">
                <CardHeader>
                  <CardTitle>Evolución de Gastos</CardTitle>
                  <CardDescription>Últimos 6 meses</CardDescription>
                </CardHeader>
                <CardContent className="text-center py-6">
                  <LineChart className="h-36 w-full mx-auto text-primary" strokeWidth={1} />
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
                    <div className="space-y-2">
                      {Array.from({length: 5}).map((_, i) => (
                        <div key={i} className="flex justify-between items-center border-b pb-2">
                          <div>
                            <p className="font-medium">Préstamo Banco XYZ</p>
                            <p className="text-sm text-muted-foreground">Vence: 15/06/2024</p>
                          </div>
                          <Badge>$2,450</Badge>
                        </div>
                      ))}
                    </div>
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
                    <div className="space-y-3">
                      {["Entretenimiento", "Comida", "Transporte"].map((cat, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">{cat}</span>
                            <span className="text-sm text-destructive">85%</span>
                          </div>
                          <Progress value={85} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* ANÁLISIS DE GASTOS */}
          <TabsContent value="gastos" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="col-span-1 md:col-span-1">
                <CardHeader>
                  <CardTitle>Gastos por Categoría</CardTitle>
                  <CardDescription>Distribución detallada</CardDescription>
                </CardHeader>
                <CardContent className="text-center py-6">
                  <PieChart className="h-48 w-48 mx-auto text-primary" strokeWidth={1} />
                  <div className="mt-6 grid grid-cols-2 gap-2">
                    {["Vivienda", "Comida", "Transporte", "Entretenimiento"].map((cat, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full bg-primary-${i+1}00`} />
                        <span className="text-sm">{cat}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="col-span-1 md:col-span-1 lg:col-span-2">
                <CardHeader>
                  <CardTitle>Evolución Temporal</CardTitle>
                  <CardDescription>Comparativa mensual</CardDescription>
                </CardHeader>
                <CardContent className="py-6">
                  <LineChart className="h-64 w-full mx-auto text-primary" strokeWidth={1} />
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Comparativa Anual</CardTitle>
                <CardDescription>Gastos mensuales respecto al año anterior</CardDescription>
              </CardHeader>
              <CardContent className="py-6">
                <BarChart3 className="h-64 w-full mx-auto text-primary" strokeWidth={1} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Flujo de Caja</CardTitle>
                  <CardDescription>Ingresos vs. Gastos</CardDescription>
                </div>
                <Select defaultValue="mensual">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Periodicidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensual">Mensual</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="py-6">
                <BarChart3 className="h-64 w-full mx-auto text-primary" strokeWidth={1} />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* PRESUPUESTOS */}
          <TabsContent value="presupuestos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cumplimiento de Presupuestos</CardTitle>
                <CardDescription>Estado actual vs. presupuesto asignado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {[
                    { category: "Vivienda", budget: 25000, spent: 23450, percent: 94 },
                    { category: "Alimentación", budget: 18000, spent: 14500, percent: 80 },
                    { category: "Transporte", budget: 8000, spent: 7200, percent: 90 },
                    { category: "Entretenimiento", budget: 5000, spent: 6300, percent: 126 },
                    { category: "Servicios", budget: 12000, spent: 11980, percent: 99 }
                  ].map((item, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{item.category}</span>
                        <span className={item.percent > 100 ? "text-destructive font-medium" : "font-medium"}>
                          ${item.spent.toLocaleString()} / ${item.budget.toLocaleString()}
                        </span>
                      </div>
                      <Progress 
                        value={item.percent > 100 ? 100 : item.percent} 
                        className={`h-2 ${item.percent > 100 ? "bg-destructive/20" : ""}`}
                      />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.percent}% utilizado
                        </span>
                        <span className={item.percent > 100 ? "text-destructive" : "text-green-600"}>
                          {item.percent > 100 
                            ? `Excedido por $${(item.spent - item.budget).toLocaleString()}`
                            : `Disponible: $${(item.budget - item.spent).toLocaleString()}`
                          }
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Cumplimiento</CardTitle>
                  <CardDescription>Evolución mensual por categoría</CardDescription>
                </CardHeader>
                <CardContent className="py-6">
                  <LineChart className="h-64 w-full mx-auto text-primary" strokeWidth={1} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recomendaciones</CardTitle>
                  <CardDescription>Ajustes sugeridos para tus presupuestos</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                      {[
                        { category: "Entretenimiento", suggestion: "Reducir presupuesto", reason: "Consistentemente por debajo del 70% de uso" },
                        { category: "Comida", suggestion: "Aumentar presupuesto", reason: "Excedido en 3 de los últimos 5 meses" },
                        { category: "Transporte", suggestion: "Mantener presupuesto", reason: "Uso equilibrado entre 85-95%" }
                      ].map((item, i) => (
                        <div key={i} className="border-b pb-3">
                          <div className="flex justify-between items-start">
                            <span className="font-medium">{item.category}</span>
                            <Badge variant={
                              item.suggestion.includes("Reducir") ? "outline" : 
                              item.suggestion.includes("Aumentar") ? "destructive" : "secondary"
                            }>
                              {item.suggestion}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{item.reason}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* FINANZAS */}
          <TabsContent value="finanzas" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Financiaciones Activas</CardTitle>
                  <CardDescription>Estado de tus créditos y financiaciones</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                      {[
                        { name: "Préstamo Personal", total: 120000, paid: 40000, remaining: 80000, nextPayment: "15/06/2024", installment: 5000 },
                        { name: "Tarjeta XYZ", total: 45000, paid: 15000, remaining: 30000, nextPayment: "22/06/2024", installment: 3000 },
                        { name: "Electrodoméstico", total: 30000, paid: 20000, remaining: 10000, nextPayment: "05/07/2024", installment: 2500 }
                      ].map((item, i) => (
                        <div key={i} className="border-b pb-3">
                          <div className="flex justify-between">
                            <span className="font-medium">{item.name}</span>
                            <Badge variant="outline">{Math.round((item.paid / item.total) * 100)}% pagado</Badge>
                          </div>
                          <Progress value={(item.paid / item.total) * 100} className="h-2 mt-2" />
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Próximo pago:</span>
                              <p>{item.nextPayment}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Cuota:</span>
                              <p>${item.installment.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Pagado:</span>
                              <p>${item.paid.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Restante:</span>
                              <p>${item.remaining.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Gastos Recurrentes</CardTitle>
                  <CardDescription>Compromisos financieros periódicos</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                      {[
                        { name: "Netflix", amount: 1500, frequency: "Mensual", nextPayment: "05/06/2024" },
                        { name: "Gimnasio", amount: 3000, frequency: "Mensual", nextPayment: "10/06/2024" },
                        { name: "Alquiler", amount: 25000, frequency: "Mensual", nextPayment: "01/07/2024" },
                        { name: "Internet", amount: 4500, frequency: "Mensual", nextPayment: "15/06/2024" },
                        { name: "Seguro Auto", amount: 5800, frequency: "Mensual", nextPayment: "20/06/2024" }
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center border-b pb-3">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">{item.frequency}</Badge>
                              <span className="text-xs text-muted-foreground">Próximo: {item.nextPayment}</span>
                            </div>
                          </div>
                          <span className="font-medium">${item.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Calendario de Pagos</CardTitle>
                <CardDescription>Próximos 3 meses</CardDescription>
              </CardHeader>
              <CardContent className="py-6">
                <div className="flex justify-center">
                  <CalendarDays className="h-64 w-full mx-auto text-muted-foreground" strokeWidth={1} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* ANÁLISIS AVANZADO */}
          <TabsContent value="avanzado" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Gastos Grupales</CardTitle>
                  <CardDescription>Análisis por grupo y miembro</CardDescription>
                </CardHeader>
                <CardContent className="py-6">
                  <div className="flex justify-center mb-4">
                    <Select defaultValue="grupo1">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Seleccionar grupo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grupo1">Viaje a Bariloche</SelectItem>
                        <SelectItem value="grupo2">Gastos del Hogar</SelectItem>
                        <SelectItem value="grupo3">Eventos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <PieChart className="h-48 w-48 mx-auto text-primary mb-4" strokeWidth={1} />
                  <div className="space-y-2 mt-4">
                    {[
                      { name: "María", amount: 12500, percentage: 25 },
                      { name: "Juan", amount: 15000, percentage: 30 },
                      { name: "Carlos", amount: 22500, percentage: 45 }
                    ].map((member, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span>{member.name}</span>
                        <div className="text-right">
                          <span className="block">${member.amount.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground">{member.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Análisis Multimoneda</CardTitle>
                  <CardDescription>Impacto de variaciones cambiarias</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between mb-4">
                    <div>
                      <p className="text-lg font-bold">Total en ARS</p>
                      <p className="text-2xl">$458,230</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">Total en USD</p>
                      <p className="text-2xl">$1,250</p>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Distribución por moneda:</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm">ARS</span>
                        <span className="text-sm">82%</span>
                      </div>
                      <Progress value={82} className="h-2" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm">USD</span>
                        <span className="text-sm">18%</span>
                      </div>
                      <Progress value={18} className="h-2" />
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-sm font-medium mb-2">Evolución del tipo de cambio:</p>
                    <LineChart className="h-28 w-full mx-auto text-primary" strokeWidth={1} />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Predicciones y Tendencias</CardTitle>
                <CardDescription>Proyección de gastos para los próximos 3 meses</CardDescription>
              </CardHeader>
              <CardContent className="py-6">
                <div className="mb-4">
                  <TrendingUp className="h-64 w-full mx-auto text-primary" strokeWidth={1} />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm">Junio 2024</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-xl font-bold">$48,230</p>
                      <p className="text-xs text-muted-foreground">+5.3% respecto a mayo</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm">Julio 2024</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-xl font-bold">$52,150</p>
                      <p className="text-xs text-muted-foreground">+8.1% respecto a junio</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm">Agosto 2024</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-xl font-bold">$49,800</p>
                      <p className="text-xs text-muted-foreground">-4.5% respecto a julio</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">Recomendaciones basadas en tendencias:</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex gap-2 items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                      <span>Considera ajustar el presupuesto de entretenimiento, que muestra una tendencia al alza.</span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                      <span>Tus gastos en servicios se mantienen estables, lo que indica una buena gestión.</span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                      <span>Se espera un aumento estacional en gastos de vacaciones para agosto.</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}