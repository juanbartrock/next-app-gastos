"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Camera, Mic, PencilLine, History, Banknote, ArrowRightLeft, CreditCard, PiggyBank, DollarSign, Search, Filter, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExpenseForm } from "@/components/ExpenseForm"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useVisibility } from "@/contexts/VisibilityContext"
import { useCurrency } from "@/contexts/CurrencyContext"
import { cn } from "@/lib/utils"

// Interfaces para tipos
interface Categoria {
  id: number;
  descripcion: string;
  grupo_categoria: string | null;
}

interface FiltrosHistorial {
  busqueda: string;
  fechaDesde: string;
  fechaHasta: string;
  categoria: string;
  tipoMovimiento: string;
  tipoTransaccion: string;
  incluirEnFamilia: string;
}

export default function NuevoRegistroPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<string>("manual")
  const [gastosPersonales, setGastosPersonales] = useState<any[]>([])
  const [gastosFiltrados, setGastosFiltrados] = useState<any[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingCategorias, setLoadingCategorias] = useState(true)
  const { valuesVisible } = useVisibility()
  const { formatMoney } = useCurrency()

  // Estados para filtros
  const [filtros, setFiltros] = useState<FiltrosHistorial>({
    busqueda: '',
    fechaDesde: '',
    fechaHasta: '',
    categoria: '',
    tipoMovimiento: '',
    tipoTransaccion: '',
    incluirEnFamilia: ''
  })
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  const handleTransactionAdded = () => {
    // Recargar datos después de agregar una transacción
    fetchGastosPersonales()
  }

  const fetchGastosPersonales = async () => {
    try {
      const response = await fetch('/api/gastos')
      if (response.ok) {
        const data = await response.json()
        setGastosPersonales(data)
        setGastosFiltrados(data)
      }
    } catch (error) {
      console.error('Error al cargar gastos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategorias = async () => {
    try {
      const response = await fetch('/api/categorias')
      if (response.ok) {
        const data = await response.json()
        setCategorias(data)
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error)
    } finally {
      setLoadingCategorias(false)
    }
  }

  useEffect(() => {
    fetchGastosPersonales()
    fetchCategorias()
  }, [])

  // Función para aplicar filtros
  const aplicarFiltros = () => {
    let resultados = [...gastosPersonales]

    // Filtro por búsqueda (concepto)
    if (filtros.busqueda.trim()) {
      resultados = resultados.filter(gasto => 
        gasto.concepto.toLowerCase().includes(filtros.busqueda.toLowerCase())
      )
    }

    // Filtro por fecha desde
    if (filtros.fechaDesde) {
      const fechaDesde = new Date(filtros.fechaDesde)
      resultados = resultados.filter(gasto => 
        new Date(gasto.fecha) >= fechaDesde
      )
    }

    // Filtro por fecha hasta
    if (filtros.fechaHasta) {
      const fechaHasta = new Date(filtros.fechaHasta)
      fechaHasta.setHours(23, 59, 59, 999) // Incluir todo el día
      resultados = resultados.filter(gasto => 
        new Date(gasto.fecha) <= fechaHasta
      )
    }

    // Filtro por categoría
    if (filtros.categoria) {
      resultados = resultados.filter(gasto => 
        gasto.categoria === filtros.categoria
      )
    }

    // Filtro por tipo de movimiento
    if (filtros.tipoMovimiento) {
      resultados = resultados.filter(gasto => 
        gasto.tipoMovimiento === filtros.tipoMovimiento
      )
    }

    // Filtro por tipo de transacción
    if (filtros.tipoTransaccion) {
      resultados = resultados.filter(gasto => 
        gasto.tipoTransaccion === filtros.tipoTransaccion
      )
    }

    // Filtro por incluir en familia
    if (filtros.incluirEnFamilia) {
      const incluir = filtros.incluirEnFamilia === 'true'
      resultados = resultados.filter(gasto => 
        gasto.incluirEnFamilia === incluir
      )
    }

    setGastosFiltrados(resultados)
  }

  // Aplicar filtros cuando cambien
  useEffect(() => {
    aplicarFiltros()
  }, [filtros, gastosPersonales])

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      fechaDesde: '',
      fechaHasta: '',
      categoria: '',
      tipoMovimiento: '',
      tipoTransaccion: '',
      incluirEnFamilia: ''
    })
  }

  const actualizarFiltro = (campo: keyof FiltrosHistorial, valor: string) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }))
  }

  const getMovementIcon = (tipoMovimiento: string) => {
    switch (tipoMovimiento) {
      case 'efectivo':
        return <Banknote className="h-5 w-5 text-green-600" />
      case 'digital':
        return <CreditCard className="h-5 w-5 text-blue-600" />
      case 'ahorro':
        return <PiggyBank className="h-5 w-5 text-purple-600" />
      case 'tarjeta':
        return <CreditCard className="h-5 w-5 text-orange-600" />
      default:
        return <DollarSign className="h-5 w-5 text-gray-600" />
    }
  }

  const getTransactionColor = (tipoTransaccion: string) => {
    return tipoTransaccion === 'income' ? 'text-green-600' : 'text-red-600'
  }

  // Contar filtros activos
  const filtrosActivos = Object.values(filtros).filter(valor => valor.trim() !== '').length

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 py-6 md:px-6 bg-background border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push('/?dashboard=true')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Gestión de Movimientos</h1>
          </div>
        </div>
      </header>
      
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="manual" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6 mb-8">
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <PencilLine className="h-4 w-4" />
                <span>Manual</span>
              </TabsTrigger>
              <TabsTrigger value="voz" className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                <span>Voz</span>
              </TabsTrigger>
              <TabsTrigger value="foto" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                <span>Foto</span>
              </TabsTrigger>
              <TabsTrigger value="cajero" className="flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                <span>Cajero</span>
              </TabsTrigger>
              <TabsTrigger value="transferencia" className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                <span>Transferir</span>
              </TabsTrigger>
              <TabsTrigger value="historial" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span>Historial</span>
                {filtrosActivos > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {filtrosActivos}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="manual" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Formulario de Movimiento</CardTitle>
                </CardHeader>
                <CardContent>
                  <ExpenseForm onTransactionAdded={handleTransactionAdded} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="voz" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Asistente de Voz</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <p className="text-center text-muted-foreground mb-6">
                    Utiliza el asistente de voz para registrar tus movimientos de forma rápida y sencilla.
                  </p>
                  <Button 
                    size="lg" 
                    onClick={() => router.push('/voz')}
                    className="gap-2"
                  >
                    <Mic className="h-5 w-5" />
                    Iniciar Asistente de Voz
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="foto" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Captura de Ticket</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <p className="text-center text-muted-foreground mb-6">
                    Toma una foto de tu ticket para registrar automáticamente los detalles de la compra.
                  </p>
                  <Button 
                    size="lg" 
                    onClick={() => router.push('/transacciones/foto')}
                    className="gap-2"
                  >
                    <Camera className="h-5 w-5" />
                    Escanear Ticket
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cajero" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Extracción de Cajero</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <p className="text-center text-muted-foreground mb-6">
                    Registra extracciones de cajero automático y comisiones asociadas.
                  </p>
                  <Button 
                    size="lg" 
                    onClick={() => router.push('/transacciones/extraccion-cajero')}
                    className="gap-2"
                  >
                    <Banknote className="h-5 w-5" />
                    Registrar Extracción
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transferencia" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Transferencias Entre Cuentas</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <p className="text-center text-muted-foreground mb-6">
                    Registra transferencias entre tus diferentes cuentas o tipos de dinero.
                  </p>
                  <Button 
                    size="lg" 
                    onClick={() => router.push('/transacciones/transferir')}
                    className="gap-2"
                  >
                    <ArrowRightLeft className="h-5 w-5" />
                    Nueva Transferencia
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="historial" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Historial de Movimientos</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {gastosFiltrados.length} de {gastosPersonales.length} movimientos
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMostrarFiltros(!mostrarFiltros)}
                        className={cn(
                          "gap-2",
                          filtrosActivos > 0 && "border-blue-500 bg-blue-50 dark:bg-blue-950"
                        )}
                      >
                        <Filter className="h-4 w-4" />
                        Filtros
                        {filtrosActivos > 0 && (
                          <Badge variant="secondary" className="ml-1">
                            {filtrosActivos}
                          </Badge>
                        )}
                      </Button>
                      {filtrosActivos > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={limpiarFiltros}
                          className="gap-2"
                        >
                          <X className="h-4 w-4" />
                          Limpiar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Panel de filtros */}
                  {mostrarFiltros && (
                    <div className="mb-6 p-4 border rounded-lg bg-muted/30">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Búsqueda */}
                        <div className="space-y-2">
                          <Label htmlFor="busqueda">Buscar por concepto</Label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="busqueda"
                              placeholder="Ej: supermercado, nafta..."
                              value={filtros.busqueda}
                              onChange={(e) => actualizarFiltro('busqueda', e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>

                        {/* Fecha desde */}
                        <div className="space-y-2">
                          <Label htmlFor="fechaDesde">Fecha desde</Label>
                          <Input
                            id="fechaDesde"
                            type="date"
                            value={filtros.fechaDesde}
                            onChange={(e) => actualizarFiltro('fechaDesde', e.target.value)}
                          />
                        </div>

                        {/* Fecha hasta */}
                        <div className="space-y-2">
                          <Label htmlFor="fechaHasta">Fecha hasta</Label>
                          <Input
                            id="fechaHasta"
                            type="date"
                            value={filtros.fechaHasta}
                            onChange={(e) => actualizarFiltro('fechaHasta', e.target.value)}
                          />
                        </div>

                        {/* Categoría */}
                        <div className="space-y-2">
                          <Label>Categoría</Label>
                          <Select value={filtros.categoria} onValueChange={(value) => actualizarFiltro('categoria', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Todas las categorías" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Todas las categorías</SelectItem>
                              {categorias.map((categoria) => (
                                <SelectItem key={categoria.id} value={categoria.descripcion}>
                                  {categoria.descripcion}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Tipo de movimiento */}
                        <div className="space-y-2">
                          <Label>Tipo de movimiento</Label>
                          <Select value={filtros.tipoMovimiento} onValueChange={(value) => actualizarFiltro('tipoMovimiento', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Todos los tipos" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Todos los tipos</SelectItem>
                              <SelectItem value="efectivo">Efectivo</SelectItem>
                              <SelectItem value="digital">Digital</SelectItem>
                              <SelectItem value="ahorro">Ahorro</SelectItem>
                              <SelectItem value="tarjeta">Tarjeta</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Tipo de transacción */}
                        <div className="space-y-2">
                          <Label>Tipo de transacción</Label>
                          <Select value={filtros.tipoTransaccion} onValueChange={(value) => actualizarFiltro('tipoTransaccion', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Ingresos y gastos" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Ingresos y gastos</SelectItem>
                              <SelectItem value="income">Solo ingresos</SelectItem>
                              <SelectItem value="expense">Solo gastos</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Incluir en familia */}
                        <div className="space-y-2 md:col-span-3">
                          <Label>Incluir en familia</Label>
                          <Select value={filtros.incluirEnFamilia} onValueChange={(value) => actualizarFiltro('incluirEnFamilia', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Personales y familiares" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Personales y familiares</SelectItem>
                              <SelectItem value="true">Solo familiares</SelectItem>
                              <SelectItem value="false">Solo personales</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lista de movimientos */}
                  {loading ? (
                    <div className="text-center py-8">
                      <p>Cargando movimientos...</p>
                    </div>
                  ) : gastosFiltrados.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>
                        {filtrosActivos > 0 
                          ? "No hay movimientos que coincidan con los filtros" 
                          : "No hay movimientos registrados"
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {gastosFiltrados.slice(0, 50).map((movimiento) => (
                        <div
                          key={movimiento.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center gap-3">
                            {getMovementIcon(movimiento.tipoMovimiento)}
                            <div className="flex-1">
                              <p className="font-medium">{movimiento.concepto}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{format(new Date(movimiento.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
                                <Badge variant="outline" className="text-xs">
                                  {movimiento.categoria}
                                </Badge>
                                {movimiento.incluirEnFamilia && (
                                  <Badge variant="secondary" className="text-xs">
                                    Familiar
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              "font-bold",
                              getTransactionColor(movimiento.tipoTransaccion)
                            )}>
                              {movimiento.tipoTransaccion === 'income' ? '+' : '-'}
                              {valuesVisible ? formatMoney(movimiento.monto) : "••••••"}
                            </p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {movimiento.tipoMovimiento}
                            </p>
                          </div>
                        </div>
                      ))}
                      {gastosFiltrados.length > 50 && (
                        <div className="text-center pt-4">
                          <p className="text-sm text-muted-foreground">
                            Mostrando los primeros 50 resultados de {gastosFiltrados.length}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
} 