"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { 
  ArrowLeft,
  Calendar,
  Flag,
  Edit,
  Trash2,
  Clock,
  AlertTriangle,
  Loader2,
  CheckCircle,
  User,
  Building,
  TrendingUp,
  DollarSign,
  Target
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { toast } from "sonner"

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
  recordatorio?: string
  prestamo?: {
    id: string
    entidadFinanciera: string
    numeroCredito?: string
    fechaProximaCuota?: string
  }
  gastoRecurrente?: {
    id: number
    concepto: string
    monto: number
    proximaFecha?: string
  }
  inversion?: {
    id: string
    nombre: string
    fechaVencimiento?: string
    tipo: {
      nombre: string
    }
  }
  presupuesto?: {
    id: string
    nombre: string
    monto: number
    mes: number
    año: number
  }
  createdAt: string
  completadaEn?: string
}

export default function TareaDetallePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const tareaId = params.id as string
  
  const [tarea, setTarea] = useState<TareaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [eliminando, setEliminando] = useState(false)

  // Función para obtener la tarea
  const fetchTarea = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tareas/${tareaId}`)
      
      if (response.ok) {
        const data = await response.json()
        setTarea(data)
      } else if (response.status === 404) {
        toast.error('Tarea no encontrada')
        router.push('/tareas')
      } else {
        toast.error('Error al cargar la tarea')
      }
    } catch (error) {
      console.error('Error al cargar tarea:', error)
      toast.error('Error al cargar la tarea')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user && tareaId) {
      fetchTarea()
    }
  }, [session, tareaId])

  // Función para eliminar tarea
  const eliminarTarea = async () => {
    try {
      setEliminando(true)
      const response = await fetch(`/api/tareas/${tareaId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        toast.success('Tarea eliminada correctamente')
        router.push('/tareas')
      } else {
        toast.error('Error al eliminar la tarea')
      }
    } catch (error) {
      console.error('Error al eliminar tarea:', error)
      toast.error('Error al eliminar la tarea')
    } finally {
      setEliminando(false)
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
      return { texto: 'Mañana', color: 'text-orange-600', icono: Clock }
    } else if (diasRestantes <= 7) {
      return { texto: `En ${diasRestantes} días`, color: 'text-yellow-600', icono: Clock }
    } else {
      return { texto: format(fechaVenc, 'dd/MM/yyyy', { locale: es }), color: 'text-muted-foreground', icono: Calendar }
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session?.user) {
    router.push('/login')
    return null
  }

  if (!tarea) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Tarea no encontrada</h1>
          <Button asChild>
            <Link href="/tareas">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a tareas
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const fechaInfo = formatearFechaVencimiento(tarea.fechaVencimiento)
  const IconoFecha = fechaInfo?.icono

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/tareas">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detalle de Tarea</h1>
            <p className="text-muted-foreground">
              Creada el {format(new Date(tarea.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/tareas/${tarea.id}/editar`}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={eliminando}>
                {eliminando ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. La tarea será eliminada permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={eliminarTarea}>
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Información principal */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className={cn(
                "text-xl mb-2",
                tarea.estado === 'completada' && "line-through text-muted-foreground"
              )}>
                {tarea.titulo}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={getEstadoColor(tarea.estado)}>
                  {tarea.estado === 'completada' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {tarea.estado}
                </Badge>
                
                <Badge variant={getPrioridadColor(tarea.prioridad)}>
                  <Flag className="h-3 w-3 mr-1" />
                  {tarea.prioridad}
                </Badge>
                
                {tarea.categoria && (
                  <Badge variant="outline">
                    {tarea.categoria}
                  </Badge>
                )}
                
                {tarea.esFinanciera && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    Financiera
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        {tarea.descripcion && (
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Descripción</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {tarea.descripcion}
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Fechas importantes */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Fechas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tarea.fechaVencimiento && (
              <div className="flex items-center gap-3">
                {IconoFecha && <IconoFecha className={cn("h-5 w-5", fechaInfo?.color)} />}
                <div>
                  <p className="font-medium">Fecha de vencimiento</p>
                  <p className={cn("text-sm", fechaInfo?.color)}>
                    {format(new Date(tarea.fechaVencimiento), 'dd/MM/yyyy', { locale: es })}
                    {fechaInfo && ` (${fechaInfo.texto})`}
                  </p>
                </div>
              </div>
            )}
            
            {tarea.recordatorio && (
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Recordatorio</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(tarea.recordatorio), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </p>
                </div>
              </div>
            )}
            
            {tarea.completadaEn && (
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Completada</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(tarea.completadaEn), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contexto financiero */}
      {(tarea.prestamo || tarea.gastoRecurrente || tarea.inversion || tarea.presupuesto) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contexto Financiero</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tarea.prestamo && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <Building className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      Préstamo - {tarea.prestamo.entidadFinanciera}
                    </p>
                    {tarea.prestamo.numeroCredito && (
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Número: {tarea.prestamo.numeroCredito}
                      </p>
                    )}
                    {tarea.prestamo.fechaProximaCuota && (
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Próxima cuota: {format(new Date(tarea.prestamo.fechaProximaCuota), 'dd/MM/yyyy', { locale: es })}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {tarea.gastoRecurrente && (
                <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <DollarSign className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-900 dark:text-orange-100">
                      Gasto Recurrente - {tarea.gastoRecurrente.concepto}
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      Monto: ${tarea.gastoRecurrente.monto.toLocaleString('es-AR')}
                    </p>
                    {tarea.gastoRecurrente.proximaFecha && (
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        Próximo pago: {format(new Date(tarea.gastoRecurrente.proximaFecha), 'dd/MM/yyyy', { locale: es })}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {tarea.inversion && (
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      Inversión - {tarea.inversion.nombre}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Tipo: {tarea.inversion.tipo.nombre}
                    </p>
                    {tarea.inversion.fechaVencimiento && (
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Vencimiento: {format(new Date(tarea.inversion.fechaVencimiento), 'dd/MM/yyyy', { locale: es })}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {tarea.presupuesto && (
                <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <Target className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-purple-900 dark:text-purple-100">
                      Presupuesto - {tarea.presupuesto.nombre}
                    </p>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Monto: ${tarea.presupuesto.monto.toLocaleString('es-AR')}
                    </p>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Período: {tarea.presupuesto.mes}/{tarea.presupuesto.año}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 