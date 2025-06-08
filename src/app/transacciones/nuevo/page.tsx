"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Camera, Mic, PencilLine, History, Banknote, ArrowRightLeft, CreditCard, PiggyBank, DollarSign, Search, Filter, X, Edit, Trash2, Eye, ChevronDown, ChevronUp, ExternalLink, Download, ChevronLeft, ChevronRight, Calendar, Users, User } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExpenseForm } from "@/components/ExpenseForm"
import { format, startOfMonth, endOfMonth, addMonths, subMonths, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { useVisibility } from "@/contexts/VisibilityContext"
import { useCurrency } from "@/contexts/CurrencyContext"
import { usePermisosFamiliares } from "@/contexts/PermisosFamiliaresContext"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Interfaces para tipos
interface Categoria {
  id: number;
  descripcion: string;
  grupo_categoria: string | null;
}

interface GastoDetalle {
  id: number
  gastoId: number
  descripcion: string
  cantidad: number
  precioUnitario: number | null
  subtotal: number
  seguimiento: boolean
  createdAt: string
  updatedAt: string
}

interface Gasto {
  id: number
  concepto: string
  monto: number
  fecha: string
  fechaImputacion?: string
  categoria: string
  tipoTransaccion: string
  tipoMovimiento: string
  incluirEnFamilia: boolean
  createdAt: string
  updatedAt: string
  userId: string | null
  grupoId: string | null
  categoriaId: number | null
  user?: {
    name: string | null
    email: string | null
  }
  grupo?: {
    nombre: string
  }
  detalles?: GastoDetalle[]
}

interface FiltrosHistorial {
  busqueda: string;
  categoria: string;
  tipoMovimiento: string;
  tipoTransaccion: string;
  incluirEnFamilia: string;
}

export default function TransaccionesPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<string>("manual")
  const [gastosPersonales, setGastosPersonales] = useState<Gasto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingCategorias, setLoadingCategorias] = useState(true)
  const [selectedTransaction, setSelectedTransaction] = useState<Gasto | null>(null)
  const { valuesVisible } = useVisibility()
  const { formatMoney } = useCurrency()
  const { esAdministradorFamiliar, loading: loadingPermisos } = usePermisosFamiliares()

  // Estados para paginación por mes
  const [mesActual, setMesActual] = useState(new Date())
  
  // Estado para modo familiar
  const [modoFamiliar, setModoFamiliar] = useState(false)

  // Estados para filtros
  const [filtros, setFiltros] = useState<FiltrosHistorial>({
    busqueda: '',
    categoria: 'all',
    tipoMovimiento: 'all',
    tipoTransaccion: 'all',
    incluirEnFamilia: 'all'
  })
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  // Función para obtener fecha de imputación o fecha normal
  const getFechaImputacion = (gasto: Gasto) => {
    return gasto.fechaImputacion ? parseISO(gasto.fechaImputacion) : parseISO(gasto.fecha)
  }

  // Organizar gastos por mes de imputación
  const organizarGastosPorMes = (gastos: Gasto[]) => {
    const gastosOrganizados: {[key: string]: Gasto[]} = {}
    
    gastos.forEach(gasto => {
      const fechaImputacion = getFechaImputacion(gasto)
      const keyMes = format(fechaImputacion, 'yyyy-MM')
      
      if (!gastosOrganizados[keyMes]) {
        gastosOrganizados[keyMes] = []
      }
      gastosOrganizados[keyMes].push(gasto)
    })

    // Ordenar los gastos dentro de cada mes por fecha descendente
    Object.keys(gastosOrganizados).forEach(mes => {
      gastosOrganizados[mes].sort((a, b) => {
        const fechaA = getFechaImputacion(a)
        const fechaB = getFechaImputacion(b)
        return fechaB.getTime() - fechaA.getTime()
      })
    })

    return gastosOrganizados
  }

  // Obtener gastos del mes actual
  const gastosDelMesActual = useMemo(() => {
    const gastosOrganizados = organizarGastosPorMes(gastosPersonales)
    const keyMes = format(mesActual, 'yyyy-MM')
    return gastosOrganizados[keyMes] || []
  }, [gastosPersonales, mesActual])

  // Función para aplicar filtros al mes actual
  const gastosFiltrados = useMemo(() => {
    let resultados = [...gastosDelMesActual]

    // Filtro por búsqueda (concepto)
    if (filtros.busqueda.trim()) {
      resultados = resultados.filter(gasto => 
        gasto.concepto.toLowerCase().includes(filtros.busqueda.toLowerCase())
      )
    }

    // Filtro por categoría
    if (filtros.categoria && filtros.categoria !== 'all') {
      resultados = resultados.filter(gasto => 
        gasto.categoria === filtros.categoria
      )
    }

    // Filtro por tipo de movimiento
    if (filtros.tipoMovimiento && filtros.tipoMovimiento !== 'all') {
      resultados = resultados.filter(gasto => 
        gasto.tipoMovimiento === filtros.tipoMovimiento
      )
    }

    // Filtro por tipo de transacción
    if (filtros.tipoTransaccion && filtros.tipoTransaccion !== 'all') {
      resultados = resultados.filter(gasto => 
        gasto.tipoTransaccion === filtros.tipoTransaccion
      )
    }

    // Filtro por incluir en familia
    if (filtros.incluirEnFamilia && filtros.incluirEnFamilia !== 'all') {
      const incluir = filtros.incluirEnFamilia === 'true'
      resultados = resultados.filter(gasto => 
        gasto.incluirEnFamilia === incluir
      )
    }

    return resultados
  }, [filtros, gastosDelMesActual])

  // Calcular totales
  const totales = useMemo(() => {
    // Total de ingresos del mes (solo ingresos)
    const totalIngresosMes = gastosDelMesActual.reduce((suma, gasto) => {
      return suma + (gasto.tipoTransaccion === 'income' ? gasto.monto : 0)
    }, 0)

    // Total filtrado (puede incluir ingresos y gastos según el filtro)
    const totalFiltrado = gastosFiltrados.reduce((suma, gasto) => {
      return suma + (gasto.tipoTransaccion === 'income' ? gasto.monto : -gasto.monto)
    }, 0)

    // Porcentaje basado en los ingresos totales del mes
    const porcentajeFiltrado = totalIngresosMes !== 0 ? Math.abs((totalFiltrado / totalIngresosMes) * 100) : 0

    return { totalIngresosMes, totalFiltrado, porcentajeFiltrado }
  }, [gastosDelMesActual, gastosFiltrados])

  // Calcular número de filtros activos
  const filtrosActivos = Object.entries(filtros).filter(([key, valor]) => {
    if (key === 'busqueda') {
      return valor !== ''
    }
    return valor !== 'all'
  }).length

  // Funciones de navegación por mes
  const irMesAnterior = () => {
    setMesActual(prev => subMonths(prev, 1))
  }

  const irMesSiguiente = () => {
    setMesActual(prev => addMonths(prev, 1))
  }

  const irMesHoy = () => {
    setMesActual(new Date())
  }

  const handleTransactionAdded = () => {
    fetchGastosPersonales()
  }

  const fetchGastosPersonales = async () => {
    try {
      setLoading(true)
      
      // Usar API familiar si está en modo familiar y es administrador
      const endpoint = (modoFamiliar && esAdministradorFamiliar) 
        ? '/api/gastos/familiares' 
        : '/api/gastos'
      
      const response = await fetch(endpoint)
      if (response.ok) {
        const data = await response.json()
        
        // La API familiar devuelve un objeto con gastos y permisos
        if (modoFamiliar && data.gastos) {
          setGastosPersonales(data.gastos)
        } else {
          setGastosPersonales(data)
        }
      }
    } catch (error) {
      console.error('Error al cargar gastos:', error)
      toast.error('Error al cargar transacciones')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategorias = async () => {
    try {
              const response = await fetch('/api/categorias/familiares')
              if (response.ok) {
          const data = await response.json()
          console.log('🔧 DEBUG TransaccionesPage - Data recibida:', {
            categorias: data.categorias?.length || 0,
            categoriasGenericas: data.categoriasGenericas?.length || 0,
            categoriasFamiliares: data.categoriasFamiliares?.length || 0,
            muestra5: data.categoriasFamiliares?.slice(0, 5).map((c: any) => ({ id: c.id, descripcion: c.descripcion }))
          })
          
          // Combinar categorías genéricas y familiares
          const todasLasCategorias = [
            ...(data.categoriasGenericas || []),
            ...(data.categoriasFamiliares || [])
          ]
          console.log('🔧 DEBUG TransaccionesPage - Categorías combinadas:', todasLasCategorias.length)
          setCategorias(todasLasCategorias)
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

  // Refrescar datos cuando cambie el modo familiar
  useEffect(() => {
    if (!loadingPermisos) {
      fetchGastosPersonales()
    }
  }, [modoFamiliar, esAdministradorFamiliar, loadingPermisos])

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      categoria: 'all',
      tipoMovimiento: 'all',
      tipoTransaccion: 'all',
      incluirEnFamilia: 'all'
    })
  }

  const actualizarFiltro = (campo: keyof FiltrosHistorial, valor: string) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }))
  }

  const verDetalles = async (transaction: Gasto, event: React.MouseEvent) => {
    event.stopPropagation()
    
    if (selectedTransaction?.id === transaction.id) {
      setSelectedTransaction(null)
      return
    }
    
    try {
      const response = await fetch(`/api/gastos/detalles/${transaction.id}`)
      if (response.ok) {
        const transactionWithDetails = await response.json()
        setSelectedTransaction(transactionWithDetails)
      } else {
        setSelectedTransaction(transaction)
      }
    } catch (error) {
      console.error('Error al cargar detalles:', error)
      setSelectedTransaction(transaction)
    }
  }

  const eliminarTransaccion = async (transactionId: number, event: React.MouseEvent) => {
    event.stopPropagation()
    
    if (!confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
      return
    }

    try {
      const response = await fetch(`/api/gastos/${transactionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Transacción eliminada correctamente')
        fetchGastosPersonales()
      } else {
        toast.error('Error al eliminar la transacción')
      }
    } catch (error) {
      console.error('Error al eliminar:', error)
      toast.error('Error al eliminar la transacción')
    }
  }

  const editarTransaccion = (transactionId: number, event: React.MouseEvent) => {
    event.stopPropagation()
    router.push(`/transacciones/${transactionId}/editar`)
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

  const exportarCSV = () => {
    if (gastosFiltrados.length === 0) {
      toast.error("No hay datos para exportar")
      return
    }

    const headers = ['Fecha', 'Concepto', 'Categoría', 'Tipo Movimiento', 'Tipo Transacción', 'Monto']
    const csvData = gastosFiltrados.map(gasto => [
      format(new Date(gasto.fecha), 'dd/MM/yyyy HH:mm', { locale: es }),
      `"${gasto.concepto.replace(/"/g, '""')}"`,
      `"${gasto.categoria}"`,
      gasto.tipoMovimiento,
      gasto.tipoTransaccion === 'income' ? 'Ingreso' : 'Gasto',
      gasto.monto.toString().replace('.', ',')
    ])

    const csvContent = [headers, ...csvData].map(row => row.join(';')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `transacciones_${format(mesActual, 'yyyy-MM', { locale: es })}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success("CSV exportado correctamente")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-4 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Transacciones</h1>
        </div>

        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
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
                        {gastosFiltrados.length} de {gastosDelMesActual.length} movimientos
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportarCSV}
                        className="gap-2 text-green-600 border-green-500 hover:bg-green-50 dark:hover:bg-green-950"
                        disabled={gastosFiltrados.length === 0}
                      >
                        <Download className="h-4 w-4" />
                        Exportar CSV
                        {gastosFiltrados.length > 0 && (
                          <Badge variant="secondary" className="ml-1">
                            {gastosFiltrados.length}
                          </Badge>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Toggle modo familiar */}
                  {esAdministradorFamiliar && (
                    <div className="mb-4 p-3 border rounded-lg bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            {modoFamiliar ? (
                              <Users className="h-4 w-4 text-blue-600" />
                            ) : (
                              <User className="h-4 w-4 text-gray-600" />
                            )}
                            <span className="text-sm font-medium">
                              {modoFamiliar ? 'Ver transacciones familiares' : 'Ver mis transacciones'}
                            </span>
                          </div>
                          <Button
                            variant={modoFamiliar ? "default" : "outline"}
                            size="sm"
                            onClick={() => setModoFamiliar(!modoFamiliar)}
                            className="ml-auto gap-2"
                          >
                            {modoFamiliar ? (
                              <>
                                <User className="h-4 w-4" />
                                Cambiar a Personal
                              </>
                            ) : (
                              <>
                                <Users className="h-4 w-4" />
                                Ver Familia
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      {modoFamiliar && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                          Mostrando transacciones de todos los miembros de la familia
                        </p>
                      )}
                    </div>
                  )}

                  {/* Navegación por mes */}
                  <div className="mb-6 p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Mes de imputación:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={irMesAnterior}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={irMesHoy}>
                          {format(mesActual, 'MMMM yyyy', { locale: es })}
                        </Button>
                        <Button variant="outline" size="sm" onClick={irMesSiguiente}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

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

                        {/* Categoría */}
                        <div className="space-y-2">
                          <Label>Categoría</Label>
                          <Select value={filtros.categoria} onValueChange={(value) => actualizarFiltro('categoria', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Todas las categorías" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas las categorías</SelectItem>
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
                              <SelectItem value="all">Todos los tipos</SelectItem>
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
                              <SelectItem value="all">Ingresos y gastos</SelectItem>
                              <SelectItem value="income">Solo ingresos</SelectItem>
                              <SelectItem value="expense">Solo gastos</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Incluir en familia */}
                        <div className="space-y-2 md:col-span-2">
                          <Label>Incluir en familia</Label>
                          <Select value={filtros.incluirEnFamilia} onValueChange={(value) => actualizarFiltro('incluirEnFamilia', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Personales y familiares" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Personales y familiares</SelectItem>
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
                          : `No hay movimientos registrados en ${format(mesActual, 'MMMM yyyy', { locale: es })}`
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {gastosFiltrados.map((movimiento) => (
                        <div key={movimiento.id}>
                          <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-3 flex-1">
                              {getMovementIcon(movimiento.tipoMovimiento)}
                              <div className="flex-1">
                                <p className="font-medium">{movimiento.concepto}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>{format(getFechaImputacion(movimiento), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {movimiento.categoria}
                                  </Badge>
                                  {modoFamiliar && movimiento.user?.name && (
                                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                      {movimiento.user.name}
                                    </Badge>
                                  )}
                                  {movimiento.incluirEnFamilia && (
                                    <Badge variant="secondary" className="text-xs">
                                      Familiar
                                    </Badge>
                                  )}
                                  {movimiento.detalles && movimiento.detalles.length > 0 && (
                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                      {movimiento.detalles.length} {movimiento.detalles.length === 1 ? 'producto' : 'productos'}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <div className="text-right mr-4">
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
                              
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => verDetalles(movimiento, e)}
                                  className="h-8 w-8 p-0"
                                  title={selectedTransaction?.id === movimiento.id ? "Ocultar resumen" : "Ver resumen rápido"}
                                >
                                  {selectedTransaction?.id === movimiento.id ? 
                                    <ChevronUp className="h-4 w-4" /> : 
                                    <Eye className="h-4 w-4" />
                                  }
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    router.push(`/transacciones/${movimiento.id}`)
                                  }}
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-50"
                                  title="Ver detalles completos"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => editarTransaccion(movimiento.id, e)}
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => eliminarTransaccion(movimiento.id, e)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                                  title="Eliminar"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          {selectedTransaction?.id === movimiento.id && selectedTransaction.detalles && selectedTransaction.detalles.length > 0 && (
                            <div className="ml-8 mr-4 mt-2 p-4 bg-muted/30 rounded-lg border-l-4 border-blue-500">
                              <h4 className="font-semibold mb-3 text-sm">Detalles del gasto:</h4>
                              <div className="space-y-2">
                                {selectedTransaction.detalles.map((detalle) => (
                                  <div key={detalle.id} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{detalle.descripcion}</span>
                                      {detalle.seguimiento && (
                                        <Badge variant="outline" className="text-xs">
                                          En seguimiento
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <span className="font-medium">
                                        {detalle.cantidad} × {valuesVisible ? formatMoney(detalle.precioUnitario || 0) : "••••"}
                                      </span>
                                      <span className="ml-2 font-bold">
                                        = {valuesVisible ? formatMoney(detalle.subtotal) : "••••••"}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Panel de totales */}
                  {gastosDelMesActual.length > 0 && (
                    <div className="mt-6 p-4 border-t bg-muted/10">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Total ingresos del mes ({format(mesActual, 'MMMM yyyy', { locale: es })}):</span>
                          <span className="font-bold text-green-600">
                            +{valuesVisible ? formatMoney(totales.totalIngresosMes) : "••••••"}
                          </span>
                        </div>
                        
                        {filtrosActivos > 0 && (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Total filtrado:</span>
                              <span className={cn(
                                "font-bold",
                                totales.totalFiltrado >= 0 ? 'text-green-600' : 'text-red-600'
                              )}>
                                {totales.totalFiltrado >= 0 ? '+' : ''}
                                {valuesVisible ? formatMoney(Math.abs(totales.totalFiltrado)) : "••••••"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                              <span>Porcentaje de los ingresos del mes:</span>
                              <span>{totales.porcentajeFiltrado.toFixed(1)}%</span>
                            </div>
                          </>
                        )}
                      </div>
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