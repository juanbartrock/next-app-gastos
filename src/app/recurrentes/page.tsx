"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Edit, Pencil, Repeat, Trash2, ArrowLeft } from "lucide-react"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useCurrency } from "@/contexts/CurrencyContext"
import { FinancialSummary } from "@/components/FinancialSummary"

// Tipos
type GastoRecurrente = {
  id: number
  concepto: string
  periodicidad: string
  monto: number
  comentario?: string
  estado: string
  proximaFecha?: Date
  ultimoPago?: Date
  categoriaId?: number
  categoria?: {
    id: number
    descripcion: string
  }
}

type Servicio = {
  id: number
  nombre: string
  descripcion?: string
  monto: number
  medioPago: string
  tarjeta?: string
  fechaCobro?: Date
  fechaVencimiento?: Date
}

type Categoria = {
  id: number
  descripcion: string
}

// Componente de carga
function LoadingScreen() {
  return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
}

export default function RecurrentesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { formatMoney } = useCurrency()
  
  // Estado para gastos recurrentes
  const [gastosRecurrentes, setGastosRecurrentes] = useState<GastoRecurrente[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingGasto, setEditingGasto] = useState<GastoRecurrente | null>(null)
  const [totalMesActual, setTotalMesActual] = useState(0)
  
  // Estado para servicios
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [isServicioFormOpen, setIsServicioFormOpen] = useState(false)
  const [servicioActual, setServicioActual] = useState<Servicio | null>(null)
  const [totalServicios, setTotalServicios] = useState(0)
  const [mostrarTodosServicios, setMostrarTodosServicios] = useState(false)
  
  // Estado para mostrar todos los gastos recurrentes
  const [mostrarTodosGastos, setMostrarTodosGastos] = useState(false)
  
  // Filtros
  const [filtroConcepto, setFiltroConcepto] = useState("")
  const [filtroCategoria, setFiltroCategoria] = useState<number | undefined>(undefined)
  const [filtroEstado, setFiltroEstado] = useState<string | undefined>(undefined)
  
  // Estados para el formulario
  const [concepto, setConcepto] = useState("")
  const [periodicidad, setPeriodicidad] = useState("mensual")
  const [monto, setMonto] = useState("")
  const [comentario, setComentario] = useState("")
  const [estado, setEstado] = useState("pendiente")
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined)
  const [proximaFecha, setProximaFecha] = useState<Date | undefined>(undefined)
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | undefined>(undefined)

  // Dialog para editar gastos
  useEffect(() => {
    if (editingGasto) {
      setConcepto(editingGasto.concepto || "")
      setMonto(editingGasto.monto.toString())
      setPeriodicidad(editingGasto.periodicidad || "")
      setComentario(editingGasto.comentario || "")
      setEstado(editingGasto.estado || "")
      setCategoriaSeleccionada(editingGasto.categoriaId?.toString() || "")
      
      if (editingGasto.proximaFecha) {
        setProximaFecha(new Date(editingGasto.proximaFecha))
      }
    }
  }, [editingGasto])

  // Formulario para servicios
  const [servicioNombre, setServicioNombre] = useState("")
  const [servicioDescripcion, setServicioDescripcion] = useState("")
  const [servicioMonto, setServicioMonto] = useState("")
  const [servicioMedioPago, setServicioMedioPago] = useState("Tarjeta de crédito")
  const [servicioTarjeta, setServicioTarjeta] = useState("")
  const [servicioFechaCobro, setServicioFechaCobro] = useState<Date | undefined>(undefined)

  // Resetear formulario de servicio
  const resetServicioForm = () => {
    setServicioNombre("")
    setServicioDescripcion("")
    setServicioMonto("")
    setServicioMedioPago("Tarjeta de crédito")
    setServicioTarjeta("")
    setServicioFechaCobro(undefined)
  }

  // Cargar datos en el formulario cuando se edita un servicio
  useEffect(() => {
    if (servicioActual) {
      setServicioNombre(servicioActual.nombre || "")
      setServicioDescripcion(servicioActual.descripcion || "")
      setServicioMonto(servicioActual.monto.toString())
      setServicioMedioPago(servicioActual.medioPago || "Tarjeta de crédito")
      setServicioTarjeta(servicioActual.tarjeta || "")
      
      if (servicioActual.fechaCobro) {
        setServicioFechaCobro(new Date(servicioActual.fechaCobro))
      }
    }
  }, [servicioActual])

  // Manejar envío del formulario de servicio
  const handleServicioSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!servicioNombre || !servicioMonto || !servicioMedioPago) {
      toast.error("Por favor completa los campos obligatorios")
      return
    }
    
    const nuevoServicio = {
      nombre: servicioNombre,
      descripcion: servicioDescripcion,
      monto: parseFloat(servicioMonto),
      medioPago: servicioMedioPago,
      tarjeta: servicioTarjeta,
      fechaCobro: servicioFechaCobro
    }
    
    let exito = false
    
    if (servicioActual) {
      // Editar servicio existente
      exito = await editarServicio(servicioActual.id, nuevoServicio)
    } else {
      // Crear nuevo servicio
      exito = await agregarServicio(nuevoServicio)
    }
    
    if (exito) {
      resetServicioForm()
      setIsServicioFormOpen(false)
    }
  }

  // Calcular el total de gastos recurrentes del mes actual
  useEffect(() => {
    if (gastosRecurrentes.length > 0) {
      const fechaActual = new Date();
      const mesActual = fechaActual.getMonth();
      const anioActual = fechaActual.getFullYear();
      
      const gastosMesActual = gastosRecurrentes.filter(gasto => {
        if (!gasto.proximaFecha) return false;
        const fechaProx = new Date(gasto.proximaFecha);
        return fechaProx.getMonth() === mesActual && fechaProx.getFullYear() === anioActual;
      });
      
      const suma = gastosMesActual.reduce((total, gasto) => total + gasto.monto, 0);
      setTotalMesActual(suma);
    }
  }, [gastosRecurrentes]);

  // Cargar datos iniciales
  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Obtener categorías
      const respCategorias = await fetch('/api/categorias')
      if (respCategorias.ok) {
        const datos = await respCategorias.json()
        setCategorias(datos)
      }
      
      // Obtener gastos recurrentes
      const respGastos = await fetch('/api/recurrentes')
      if (respGastos.ok) {
        const datos = await respGastos.json()
        setGastosRecurrentes(datos)
      }
      
      // Obtener servicios
      await fetchServicios()
    } catch (error) {
      console.error('Error al cargar datos:', error)
      toast.error('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  // Función para obtener servicios
  const fetchServicios = async () => {
    try {
      const response = await fetch('/api/servicios')
      if (response.ok) {
        const datos = await response.json()
        setServicios(datos)
        
        // Calcular total de servicios
        const total = datos.reduce((acc: number, servicio: Servicio) => acc + servicio.monto, 0)
        setTotalServicios(total)
      }
    } catch (error) {
      console.error('Error al cargar servicios:', error)
      // Usar datos de prueba si hay error (API aún no implementada)
      const datosPrueba: Servicio[] = [
        { id: 1, nombre: 'Netflix', monto: 3490, medioPago: 'Tarjeta de crédito', tarjeta: 'Visa', fechaCobro: new Date(2024, 2, 15) },
        { id: 2, nombre: 'Amazon Prime', monto: 1390, medioPago: 'Tarjeta de crédito', tarjeta: 'Mastercard', fechaCobro: new Date(2024, 2, 10) },
        { id: 3, nombre: 'Disney+', monto: 2900, medioPago: 'Débito automático', fechaCobro: new Date(2024, 2, 5) },
        { id: 4, nombre: 'ChatGPT', monto: 8000, medioPago: 'Tarjeta de crédito', tarjeta: 'Visa', fechaCobro: new Date(2024, 2, 20) },
        { id: 5, nombre: 'Spotify', monto: 1590, medioPago: 'Débito automático', fechaCobro: new Date(2024, 2, 28) }
      ]
      setServicios(datosPrueba)
      const total = datosPrueba.reduce((acc, servicio) => acc + servicio.monto, 0)
      setTotalServicios(total)
    }
  }

  // Agregar un nuevo servicio
  const agregarServicio = async (servicio: Omit<Servicio, 'id'>) => {
    try {
      const response = await fetch('/api/servicios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(servicio),
      })
      
      if (response.ok) {
        const nuevoServicio = await response.json()
        setServicios([...servicios, nuevoServicio])
        setTotalServicios(totalServicios + nuevoServicio.monto)
        toast.success('Servicio agregado con éxito')
        return true
      } else {
        throw new Error('Error al agregar servicio')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al agregar el servicio')
      
      // Simular adición mientras no exista la API
      const nuevoServicio: Servicio = {
        id: Date.now(),
        ...servicio
      }
      setServicios([...servicios, nuevoServicio])
      setTotalServicios(totalServicios + nuevoServicio.monto)
      toast.success('Servicio agregado con éxito (simulado)')
      return true
    }
  }

  // Editar un servicio existente
  const editarServicio = async (id: number, servicioActualizado: Partial<Servicio>) => {
    try {
      const response = await fetch(`/api/servicios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(servicioActualizado),
      })
      
      if (response.ok) {
        const datosActualizados = await response.json()
        setServicios(servicios.map(s => s.id === id ? datosActualizados : s))
        
        // Recalcular total
        const nuevoTotal = servicios
          .map(s => s.id === id ? datosActualizados : s)
          .reduce((acc, s) => acc + s.monto, 0)
        setTotalServicios(nuevoTotal)
        
        toast.success('Servicio actualizado con éxito')
        return true
      } else {
        throw new Error('Error al actualizar servicio')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar el servicio')
      
      // Simular actualización mientras no exista la API
      const serviciosActualizados = servicios.map(s => {
        if (s.id === id) {
          const updated = { ...s, ...servicioActualizado }
          return updated
        }
        return s
      })
      
      setServicios(serviciosActualizados)
      
      // Recalcular total
      const nuevoTotal = serviciosActualizados.reduce((acc, s) => acc + s.monto, 0)
      setTotalServicios(nuevoTotal)
      
      toast.success('Servicio actualizado con éxito (simulado)')
      return true
    }
  }

  // Eliminar un servicio
  const eliminarServicio = async (id: number) => {
    try {
      const response = await fetch(`/api/servicios/${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        const servicioEliminado = servicios.find(s => s.id === id)
        if (servicioEliminado) {
          setTotalServicios(totalServicios - servicioEliminado.monto)
        }
        
        setServicios(servicios.filter(s => s.id !== id))
        toast.success('Servicio eliminado con éxito')
      } else {
        throw new Error('Error al eliminar servicio')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al eliminar el servicio')
      
      // Simular eliminación mientras no exista la API
      const servicioEliminado = servicios.find(s => s.id === id)
      if (servicioEliminado) {
        setTotalServicios(totalServicios - servicioEliminado.monto)
      }
      
      setServicios(servicios.filter(s => s.id !== id))
      toast.success('Servicio eliminado con éxito (simulado)')
    }
  }

  // Efecto para redireccionar si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      fetchData()
    }
  }, [status, router])

  // Efecto para reiniciar formulario cuando se cambia el gasto en edición
  useEffect(() => {
    if (editingGasto) {
      setConcepto(editingGasto.concepto)
      setPeriodicidad(editingGasto.periodicidad)
      setMonto(editingGasto.monto.toString())
      setComentario(editingGasto.comentario || "")
      setEstado(editingGasto.estado)
      setCategoriaId(editingGasto.categoriaId)
      setProximaFecha(editingGasto.proximaFecha ? new Date(editingGasto.proximaFecha) : undefined)
    } else {
      resetForm()
    }
  }, [editingGasto])

  // Resetear formulario
  const resetForm = () => {
    setConcepto("")
    setPeriodicidad("mensual")
    setMonto("")
    setComentario("")
    setEstado("pendiente")
    setCategoriaId(undefined)
    setProximaFecha(undefined)
    setEditingGasto(null)
  }

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!concepto || !periodicidad || !monto) {
      toast.error('Por favor completa los campos obligatorios')
      return
    }
    
    try {
      const gastoData = {
        concepto,
        periodicidad,
        monto: parseFloat(monto),
        comentario,
        estado,
        categoriaId,
        proximaFecha
      }
      
      let response
      
      if (editingGasto) {
        // Actualizar gasto existente
        response = await fetch(`/api/recurrentes/${editingGasto.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(gastoData)
        })
      } else {
        // Crear nuevo gasto
        response = await fetch('/api/recurrentes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(gastoData)
        })
      }
      
      if (!response.ok) {
        throw new Error('Error al procesar la solicitud')
      }
      
      toast.success(editingGasto ? 'Gasto actualizado correctamente' : 'Gasto creado correctamente')
      fetchData()
      resetForm()
      setIsFormOpen(false)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al guardar el gasto recurrente')
    }
  }

  // Eliminar gasto
  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este gasto recurrente?')) {
      return
    }
    
    try {
      const response = await fetch(`/api/recurrentes/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Error al eliminar')
      }
      
      toast.success('Gasto eliminado correctamente')
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al eliminar el gasto')
    }
  }

  // Editar gasto
  const handleEdit = (gasto: GastoRecurrente) => {
    setEditingGasto(gasto)
    setIsFormOpen(true)
  }

  // Si está cargando, mostrar pantalla de carga
  if (status === "loading" || loading) {
    return <LoadingScreen />
  }

  // Si no está autenticado, no mostrar nada (la redirección se maneja en el efecto)
  if (status === "unauthenticated") {
    return null
  }

  // Función para formatear fechas
  const formatFecha = (fecha?: Date) => {
    if (!fecha) return "No definida"
    return format(new Date(fecha), 'dd/MM/yyyy', { locale: es })
  }

  // Obtener estado con estilo
  const getEstadoClase = (estado: string) => {
    switch (estado) {
      case 'pagado': return 'text-green-600 dark:text-green-400 font-medium'
      case 'parcial': return 'text-yellow-600 dark:text-yellow-400 font-medium'
      case 'pendiente': return 'text-red-600 dark:text-red-400 font-medium'
      case 'n/a': return 'text-gray-500 dark:text-gray-400'
      default: return ''
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gastos Recurrentes</h1>
          <div className="flex gap-4">
            <Button variant="default" onClick={() => { resetForm(); setIsFormOpen(true); }}>
              Nuevo Gasto Recurrente
            </Button>
            <Button variant="outline" onClick={() => { setServicioActual(null); setIsServicioFormOpen(true); }}>
              Nuevo Servicio
            </Button>
            <Button variant="outline" onClick={() => router.push("/?dashboard=true")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Button>
          </div>
        </div>

        {/* Total de gastos del mes actual y Servicios Contratados */}
        <Card className="w-full bg-white dark:bg-gray-800 shadow-lg mb-6">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">
              {/* Columna izquierda: Total gastos recurrentes y Análisis Financiero */}
              <div className="md:col-span-5 flex flex-col">
                {/* Total de gastos recurrentes */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Total gastos recurrentes</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="text-3xl font-bold text-primary">
                      {formatMoney(totalMesActual)}
                    </div>
                  </div>
                </div>
                
                {/* Análisis Financiero Personalizado */}
                <div className="p-4 flex-grow">
                  <FinancialSummary className="shadow-sm h-full" />
                </div>
              </div>
              
              {/* Columna derecha: Servicios contratados */}
              <div className="md:col-span-7 p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Servicios contratados</h3>
                  <div className="text-3xl font-bold text-primary">
                    {formatMoney(totalServicios)}
                  </div>
                </div>
                
                <div className="mt-4">
                  {servicios.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-gray-500 dark:text-gray-400">No hay servicios registrados</p>
                    </div>
                  ) : (
                    <div>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Servicio</TableHead>
                              <TableHead>Monto</TableHead>
                              <TableHead>Método de Pago</TableHead>
                              <TableHead>Fecha de Cobro</TableHead>
                              <TableHead className="w-[100px]">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(mostrarTodosServicios ? servicios : servicios.slice(0, 3)).map((servicio) => (
                              <TableRow key={servicio.id}>
                                <TableCell className="font-medium">{servicio.nombre}</TableCell>
                                <TableCell>{formatMoney(servicio.monto)}</TableCell>
                                <TableCell>
                                  {servicio.medioPago}
                                  {servicio.tarjeta && <span className="text-xs text-gray-500 ml-1">({servicio.tarjeta})</span>}
                                </TableCell>
                                <TableCell>
                                  {servicio.fechaCobro 
                                    ? format(new Date(servicio.fechaCobro), 'dd/MM/yyyy')
                                    : 'No especificada'}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => {
                                        setServicioActual(servicio)
                                        setIsServicioFormOpen(true)
                                      }}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => eliminarServicio(servicio.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      
                      {servicios.length > 3 && (
                        <div className="flex justify-center mt-3">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setMostrarTodosServicios(!mostrarTodosServicios)}
                          >
                            {mostrarTodosServicios ? "Ver menos" : `Ver todos (${servicios.length})`}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Filtros de búsqueda */}
        <Card className="w-full bg-white dark:bg-gray-800 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filtros de búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filtro-concepto">Concepto</Label>
                <Input
                  id="filtro-concepto"
                  placeholder="Buscar por concepto"
                  value={filtroConcepto}
                  onChange={(e) => setFiltroConcepto(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filtro-categoria">Categoría</Label>
                <Select value={filtroCategoria?.toString()} onValueChange={(value) => setFiltroCategoria(value !== "all" ? parseInt(value) : undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id.toString()}>
                        {categoria.descripcion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filtro-estado">Estado</Label>
                <Select value={filtroEstado || "all"} onValueChange={(value) => setFiltroEstado(value !== "all" ? value : undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="pagado">Pagado</SelectItem>
                    <SelectItem value="parcial">Parcial</SelectItem>
                    <SelectItem value="n/a">N/A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulario en diálogo */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingGasto ? "Editar Gasto Recurrente" : "Nuevo Gasto Recurrente"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="concepto">Concepto *</Label>
                  <Input 
                    id="concepto" 
                    value={concepto} 
                    onChange={(e) => setConcepto(e.target.value)} 
                    placeholder="Nombre del gasto" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="periodicidad">Periodicidad *</Label>
                  <Select value={periodicidad} onValueChange={setPeriodicidad} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar periodicidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensual">Mensual</SelectItem>
                      <SelectItem value="bimestral">Bimestral</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="semestral">Semestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monto">Monto *</Label>
                  <div className="relative">
                    <Input
                      id="monto"
                      type="text"
                      value={monto}
                      onChange={(e) => {
                        // Solo permitir números y un punto decimal
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        // Evitar múltiples puntos decimales
                        const parts = value.split('.');
                        if (parts.length > 2) {
                          return;
                        }
                        setMonto(value);
                      }}
                      placeholder="0.00"
                      required
                      className="pl-8"
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    {monto && (
                      <div className="mt-1 text-sm text-gray-500">
                        {formatMoney(parseFloat(monto) || 0)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoría</Label>
                  <Select 
                    value={categoriaSeleccionada} 
                    onValueChange={(val) => setCategoriaSeleccionada(val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.descripcion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select value={estado} onValueChange={setEstado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="parcial">Pago Parcial</SelectItem>
                      <SelectItem value="pagado">Pagado</SelectItem>
                      <SelectItem value="n/a">No Aplica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proximaFecha">Próxima Fecha</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {proximaFecha ? (
                          format(proximaFecha, 'PPP', { locale: es })
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={proximaFecha}
                        onSelect={setProximaFecha}
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="comentario">Comentario</Label>
                <Input 
                  id="comentario" 
                  value={comentario} 
                  onChange={(e) => setComentario(e.target.value)} 
                  placeholder="Comentario opcional" 
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => { resetForm(); setIsFormOpen(false); }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingGasto ? 'Actualizar' : 'Guardar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Diálogo para crear/editar servicios */}
        <Dialog open={isServicioFormOpen} onOpenChange={setIsServicioFormOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{servicioActual ? "Editar Servicio" : "Nuevo Servicio"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleServicioSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre del servicio *</Label>
                <Input
                  id="nombre"
                  value={servicioNombre}
                  onChange={(e) => setServicioNombre(e.target.value)}
                  placeholder="Ej. Netflix, Spotify, Disney+"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Input
                  id="descripcion"
                  value={servicioDescripcion}
                  onChange={(e) => setServicioDescripcion(e.target.value)}
                  placeholder="Descripción opcional del servicio"
                />
              </div>
              
              <div>
                <Label htmlFor="monto">Monto mensual *</Label>
                <div className="relative">
                  <Input
                    id="monto"
                    type="text"
                    value={servicioMonto}
                    onChange={(e) => {
                      // Solo permitir números y un punto decimal
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      // Evitar múltiples puntos decimales
                      const parts = value.split('.');
                      if (parts.length > 2) {
                        return;
                      }
                      setServicioMonto(value);
                    }}
                    placeholder="Importe mensual"
                    required
                    className="pl-8"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  {servicioMonto && (
                    <div className="mt-1 text-sm text-gray-500">
                      {formatMoney(parseFloat(servicioMonto) || 0)}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="medioPago">Medio de Pago *</Label>
                <Select
                  value={servicioMedioPago}
                  onValueChange={(value) => {
                    setServicioMedioPago(value)
                    // Si no es tarjeta, limpiar el campo de tarjeta
                    if (!value.toLowerCase().includes("tarjeta")) {
                      setServicioTarjeta("")
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un medio de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tarjeta de crédito">Tarjeta de crédito</SelectItem>
                    <SelectItem value="Tarjeta de débito">Tarjeta de débito</SelectItem>
                    <SelectItem value="Débito automático">Débito automático</SelectItem>
                    <SelectItem value="Transferencia bancaria">Transferencia bancaria</SelectItem>
                    <SelectItem value="Efectivo">Efectivo</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {servicioMedioPago.toLowerCase().includes("tarjeta") && (
                <div>
                  <Label htmlFor="tarjeta">Tarjeta</Label>
                  <Select
                    value={servicioTarjeta}
                    onValueChange={setServicioTarjeta}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una tarjeta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Visa">Visa</SelectItem>
                      <SelectItem value="Mastercard">Mastercard</SelectItem>
                      <SelectItem value="American Express">American Express</SelectItem>
                      <SelectItem value="Otra">Otra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div>
                <Label htmlFor="fechaCobro">Fecha de Cobro</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {servicioFechaCobro ? (
                        format(servicioFechaCobro, 'PPP', { locale: es })
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={servicioFechaCobro}
                      onSelect={setServicioFechaCobro}
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsServicioFormOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {servicioActual ? "Guardar Cambios" : "Crear Servicio"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Tabla de gastos recurrentes */}
        <Card className="w-full bg-white dark:bg-gray-800 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="w-5 h-5" />
              <span>Gastos Recurrentes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gastosRecurrentes.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No tienes gastos recurrentes registrados.
                </p>
                <Button onClick={() => { resetForm(); setIsFormOpen(true); }}>
                  Agregar tu primer gasto recurrente
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableCaption>Listado de tus gastos recurrentes</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Periodicidad</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Próximo Pago</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(mostrarTodosGastos ? gastosRecurrentes : gastosRecurrentes.slice(0, 3))
                      .filter(gasto => {
                        // Filtrar por concepto (case insensitive)
                        const conceptoMatch = !filtroConcepto || 
                          gasto.concepto.toLowerCase().includes(filtroConcepto.toLowerCase());
                        
                        // Filtrar por categoría
                        const categoriaMatch = !filtroCategoria || 
                          gasto.categoriaId === filtroCategoria;
                        
                        // Filtrar por estado
                        const estadoMatch = !filtroEstado || 
                          gasto.estado === filtroEstado;
                        
                        return conceptoMatch && categoriaMatch && estadoMatch;
                      })
                      .map((gasto) => (
                      <TableRow key={gasto.id}>
                        <TableCell className="font-medium">{gasto.concepto}</TableCell>
                        <TableCell>{gasto.periodicidad}</TableCell>
                        <TableCell>
                          {formatMoney(gasto.monto)}
                        </TableCell>
                        <TableCell>{formatFecha(gasto.proximaFecha)}</TableCell>
                        <TableCell>{gasto.categoria?.descripcion || "Sin categoría"}</TableCell>
                        <TableCell className={getEstadoClase(gasto.estado)}>
                          {gasto.estado}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEdit(gasto)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(gasto.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {gastosRecurrentes.length > 3 && (
                  <div className="flex justify-center mt-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setMostrarTodosGastos(!mostrarTodosGastos)}
                    >
                      {mostrarTodosGastos ? "Ver menos" : `Ver todos (${gastosRecurrentes.length})`}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 