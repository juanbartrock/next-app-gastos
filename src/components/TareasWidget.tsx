"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { 
  CheckSquare2, 
  Plus, 
  Clock, 
  AlertTriangle, 
  ArrowRight,
  Loader2,
  Calendar,
  Flag
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
}

interface TareasWidgetProps {
  className?: string
}

export function TareasWidget({ className }: TareasWidgetProps) {
  const { data: session } = useSession()
  const [tareas, setTareas] = useState<TareaData[]>([])
  const [loading, setLoading] = useState(true)
  const [completandoTarea, setCompletandoTarea] = useState<string | null>(null)

  // Función para obtener las próximas tareas
  const fetchTareas = async () => {
    try {
      const response = await fetch('/api/tareas?estado=pendiente&limite=5')
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
  }, [session])

  // Función para marcar tarea como completada
  const completarTarea = async (tareaId: string) => {
    try {
      setCompletandoTarea(tareaId)
      const response = await fetch(`/api/tareas/${tareaId}/completar`, {
        method: 'POST',
      })
      
      if (response.ok) {
        // Actualizar la lista de tareas
        setTareas(prev => prev.filter(tarea => tarea.id !== tareaId))
      }
    } catch (error) {
      console.error('Error al completar tarea:', error)
    } finally {
      setCompletandoTarea(null)
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
        texto: format(fechaVenc, 'dd MMM', { locale: es }), 
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

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckSquare2 className="h-5 w-5 mr-2" />
            Próximas Tareas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <CheckSquare2 className="h-5 w-5 mr-2" />
              Próximas Tareas
            </CardTitle>
            <CardDescription>
              {tareas.length > 0 
                ? `${tareas.length} tarea${tareas.length !== 1 ? 's' : ''} pendiente${tareas.length !== 1 ? 's' : ''}`
                : 'No hay tareas pendientes'
              }
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/tareas">
                Ver todas
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/tareas/nueva">
                <Plus className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {tareas.length === 0 ? (
          <div className="text-center py-8">
            <CheckSquare2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">No tienes tareas pendientes</p>
            <Button asChild variant="outline">
              <Link href="/tareas/nueva">
                <Plus className="h-4 w-4 mr-2" />
                Crear primera tarea
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {tareas.map((tarea) => {
              const fechaInfo = formatearFechaVencimiento(tarea.fechaVencimiento)
              const contexto = getContextoFinanciero(tarea)
              const IconoFecha = fechaInfo?.icono
              
              return (
                <div
                  key={tarea.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    checked={false}
                    disabled={completandoTarea === tarea.id}
                    onCheckedChange={() => completarTarea(tarea.id)}
                    className="mt-0.5"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm leading-none mb-1 truncate">
                          {tarea.titulo}
                        </p>
                        {tarea.descripcion && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {tarea.descripcion}
                          </p>
                        )}
                        {contexto && (
                          <p className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-1 rounded-md inline-block mb-2">
                            {contexto}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge 
                          variant={getPrioridadColor(tarea.prioridad)}
                          className="text-xs"
                        >
                          <Flag className="h-3 w-3 mr-1" />
                          {tarea.prioridad}
                        </Badge>
                        
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
  )
} 