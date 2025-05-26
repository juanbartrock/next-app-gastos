"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { 
  CheckSquare2, 
  Plus, 
  Filter, 
  Search,
  ArrowLeft,
  Calendar,
  Flag,
  Eye,
  Edit,
  Trash2,
  Clock,
  AlertTriangle,
  Loader2,
  CheckCircle
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

// Tipos de datos
interface TareaData {
  id: string
  titulo: string
  descripcion?: string
  fechaVencimiento?: string
  prioridad: 'alta' | 'media' | 'baja'
  estado: 'pendiente' | 'completada' | 'cancelada'
  esFinanciera: boolean
  categoria?: string
  prestamo?: {
    id: string
    entidadFinanciera: string
    numeroCredito?: string
  }
  gastoRecurrente?: {
    id: number
    concepto: string
    monto: number
  }
  inversion?: {
    id: string
    nombre: string
    tipo: {
      nombre: string
    }
  }
  presupuesto?: {
    id: string
    nombre: string
    monto: number
  }
  createdAt: string
  completadaEn?: string
}

const categorias = [
  'finanzas',
  'inversiones',
  'presupuestos',
  'préstamos',
  'personal',
  'hogar',
  'trabajo',
  'salud',
  'educación',
  'ocio'
]

export default function TareasPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [tareas, setTareas] = useState<TareaData[]>([])
  const [loading, setLoading] = useState(true)
  const [completandoTarea, setCompletandoTarea] = useState<string | null>(null)
  const [eliminandoTarea, setEliminandoTarea] = useState<string | null>(null)
  
  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todas')
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [filtroPrioridad, setFiltroPrioridad] = useState('todas')
  const [filtroFinanciera, setFiltroFinanciera] = useState('todas')

  // Función para obtener todas las tareas
  const fetchTareas = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filtroEstado !== 'todas') params.set('estado', filtroEstado)
      if (filtroCategoria !== 'todas') params.set('categoria', filtroCategoria)
      if (filtroFinanciera !== 'todas') params.set('esFinanciera', filtroFinanciera)
      
      const response = await fetch(`/api/tareas?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setTareas(data.tareas || [])
      }
    } catch (error) {
      console.error('Error al cargar tareas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user) {
      fetchTareas()
    }
  }, [session, filtroEstado, filtroCategoria, filtroFinanciera])

  // Función para marcar tarea como completada
  const completarTarea = async (tareaId: string) => {
    try {
      setCompletandoTarea(tareaId)
      const response = await fetch(`/api/tareas/${tareaId}/completar`, {
        method: 'POST',
      })
      
      if (response.ok) {
        await fetchTareas()
      }
    } catch (error) {
      console.error('Error al completar tarea:', error)
    } finally {
      setCompletandoTarea(null)
    }
  }

  // Función para eliminar tarea
  const eliminarTarea = async (tareaId: string) => {
    try {
      setEliminandoTarea(tareaId)
      const response = await fetch(`/api/tareas/${tareaId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        await fetchTareas()
      }
    } catch (error) {
      console.error('Error al eliminar tarea:', error)
    } finally {
      setEliminandoTarea(null)
    }
  }

  // Función para obtener el color de prioridad
  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta':
        return 'destructive'
      case 'media':
        return 'default'
      case 'baja':
        return 'secondary'
      default:
        return 'default'
    }
  }

  // Función para obtener el color del estado
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completada':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'cancelada':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    }
  }

  // Función para formatear fecha de vencimiento
  const formatearFechaVencimiento = (fecha?: string) => {
    if (!fecha) return null
    
    const fechaVenc = new Date(fecha)
    const ahora = new Date()
    const diferencia = fechaVenc.getTime() - ahora.getTime()
    const diasRestantes = Math.ceil(diferencia / (1000 * 60 * 60 * 24))
    
    if (diasRestantes < 0) {
      return { texto: 'Vencida', color: 'text-red-600', icono: AlertTriangle }
    } else if (diasRestantes === 0) {
      return { texto: 'Hoy', color: 'text-orange-600', icono: AlertTriangle }
    } else if (diasRestantes === 1) {
      return { texto: 'Mañana', color: 'text-yellow-600', icono: Clock }
    } else if (diasRestantes <= 7) {
      return { 
        texto: `En ${diasRestantes} días`, 
        color: 'text-blue-600', 
        icono: Calendar 
      }
    } else {
      return { 
        texto: format(fechaVenc, 'dd MMM yyyy', { locale: es }), 
        color: 'text-muted-foreground', 
        icono: Calendar 
      }
    }
  }

  // Función para obtener el contexto financiero
  const getContextoFinanciero = (tarea: TareaData) => {
    if (tarea.prestamo) {
      return `Préstamo: ${tarea.prestamo.entidadFinanciera}`
    }
    if (tarea.gastoRecurrente) {
      return `Gasto recurrente: ${tarea.gastoRecurrente.concepto}`
    }
    if (tarea.inversion) {
      return `Inversión: ${tarea.inversion.nombre}`
    }
    if (tarea.presupuesto) {
      return `Presupuesto: ${tarea.presupuesto.nombre}`
    }
    return null
  }

  // Filtrar tareas
  const tareasFiltradas = tareas.filter(tarea => {
    const cumpleBusqueda = busqueda === '' || 
      tarea.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      tarea.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
      false
    
    const cumplePrioridad = filtroPrioridad === 'todas' || tarea.prioridad === filtroPrioridad
    
    return cumpleBusqueda && cumplePrioridad
  })

  // Agrupar tareas por estado
  const tareasPendientes = tareasFiltradas.filter(t => t.estado === 'pendiente')
  const tareasCompletadas = tareasFiltradas.filter(t => t.estado === 'completada')
  const tareasCanceladas = tareasFiltradas.filter(t => t.estado === 'cancelada')

  if (status === "loading") {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-1" 
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver al Dashboard</span>
            </Button>
          </div>
          <h1 className="text-3xl font-bold flex items-center">
            <CheckSquare2 className="h-7 w-7 mr-2 text-purple-600" />
            Mis Tareas
          </h1>
          <p className="text-muted-foreground">
            Gestiona tus tareas y recordatorios financieros y personales
          </p>
        </div>
        <Button asChild>
          <Link href="/tareas/nueva">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarea
          </Link>
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckSquare2 className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{tareas.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{tareasPendientes.length}</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{tareasCompletadas.length}</p>
                <p className="text-xs text-muted-foreground">Completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">
                  {tareasPendientes.filter(t => {
                    if (!t.fechaVencimiento) return false
                    const fechaVenc = new Date(t.fechaVencimiento)
                    const ahora = new Date()
                    const diferencia = fechaVenc.getTime() - ahora.getTime()
                    const diasRestantes = Math.ceil(diferencia / (1000 * 60 * 60 * 24))
                    return diasRestantes <= 1
                  }).length}
                </p>
                <p className="text-xs text-muted-foreground">Vencen hoy/mañana</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Filtros</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tareas..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todos los estados</SelectItem>
                  <SelectItem value="pendiente">Pendientes</SelectItem>
                  <SelectItem value="completada">Completadas</SelectItem>
                  <SelectItem value="cancelada">Canceladas</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las categorías</SelectItem>
                  {categorias.map(categoria => (
                    <SelectItem key={categoria} value={categoria}>
                      {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filtroPrioridad} onValueChange={setFiltroPrioridad}>
                <SelectTrigger>
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las prioridades</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filtroFinanciera} onValueChange={setFiltroFinanciera}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todos los tipos</SelectItem>
                  <SelectItem value="true">Financieras</SelectItem>
                  <SelectItem value="false">Personales</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setBusqueda('')
                  setFiltroEstado('todas')
                  setFiltroCategoria('todas')
                  setFiltroPrioridad('todas')
                  setFiltroFinanciera('todas')
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de tareas */}
      <Card>
        <CardHeader>
          <CardTitle>
            Tareas ({tareasFiltradas.length})
          </CardTitle>
          <CardDescription>
            {tareasFiltradas.length === 0 
              ? 'No se encontraron tareas con los filtros aplicados'
              : `Mostrando ${tareasFiltradas.length} tarea${tareasFiltradas.length !== 1 ? 's' : ''}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tareasFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay tareas</h3>
              <p className="text-muted-foreground mb-4">
                {tareas.length === 0 
                  ? 'Aún no has creado ninguna tarea.'
                  : 'No se encontraron tareas con los filtros aplicados.'
                }
              </p>
              <Button asChild>
                <Link href="/tareas/nueva">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear primera tarea
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {tareasFiltradas.map((tarea) => {
                const fechaInfo = formatearFechaVencimiento(tarea.fechaVencimiento)
                const contexto = getContextoFinanciero(tarea)
                const IconoFecha = fechaInfo?.icono
                
                return (
                  <div
                    key={tarea.id}
                    className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    {tarea.estado === 'pendiente' && (
                      <Checkbox
                        checked={false}
                        disabled={completandoTarea === tarea.id}
                        onCheckedChange={() => completarTarea(tarea.id)}
                        className="mt-0.5"
                      />
                    )}
                    
                    {tarea.estado === 'completada' && (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    )}
                    
                    {tarea.estado === 'cancelada' && (
                      <div className="h-5 w-5 rounded-full bg-gray-300 mt-0.5 flex-shrink-0" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className={cn(
                              "font-medium text-sm leading-none truncate",
                              tarea.estado === 'completada' && "line-through text-muted-foreground"
                            )}>
                              {tarea.titulo}
                            </p>
                            <Badge 
                              variant={getPrioridadColor(tarea.prioridad)}
                              className="text-xs flex-shrink-0"
                            >
                              <Flag className="h-3 w-3 mr-1" />
                              {tarea.prioridad}
                            </Badge>
                          </div>
                          
                          {tarea.descripcion && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {tarea.descripcion}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={getEstadoColor(tarea.estado)}>
                              {tarea.estado}
                            </Badge>
                            
                            {tarea.categoria && (
                              <Badge variant="outline" className="text-xs">
                                {tarea.categoria}
                              </Badge>
                            )}
                            
                            {tarea.esFinanciera && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                Financiera
                              </Badge>
                            )}
                            
                            {fechaInfo && (
                              <div className={cn(
                                "flex items-center gap-1 text-xs",
                                fechaInfo.color
                              )}>
                                {IconoFecha && <IconoFecha className="h-3 w-3" />}
                                {fechaInfo.texto}
                              </div>
                            )}
                          </div>
                          
                          {contexto && (
                            <p className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-1 rounded-md inline-block mt-2">
                              {contexto}
                            </p>
                          )}
                          
                          {tarea.completadaEn && (
                            <p className="text-xs text-green-600 mt-1">
                              Completada el {format(new Date(tarea.completadaEn), 'dd/MM/yyyy HH:mm', { locale: es })}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <Link href={`/tareas/${tarea.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <Link href={`/tareas/${tarea.id}/editar`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={eliminandoTarea === tarea.id}
                              >
                                {eliminandoTarea === tarea.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. La tarea "{tarea.titulo}" será eliminada permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => eliminarTarea(tarea.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                    
                    {completandoTarea === tarea.id && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-0.5" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 