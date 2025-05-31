"use client"

import { useState, useEffect } from "react"
import { Bell, AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useVisibility } from "@/contexts/VisibilityContext"

// Tipos para las alertas
interface Alerta {
  id: string
  tipo: string
  prioridad: "BAJA" | "MEDIA" | "ALTA" | "CRITICA"
  titulo: string
  mensaje: string
  leida: boolean
  fechaCreacion: string
  metadatos?: Record<string, any>
  gastoRecurrente?: {
    concepto: string
    monto: number
    categoria?: {
      descripcion: string
    }
  }
  prestamo?: {
    entidadFinanciera: string
    cuotaMensual: number
  }
  presupuesto?: {
    nombre: string
    monto: number
    categoria?: {
      descripcion: string
    }
  }
  tarea?: {
    titulo: string
    fechaVencimiento?: string
  }
  promocion?: {
    titulo: string
    descuento?: number
    porcentajeAhorro?: number
  }
}

interface AlertasResponse {
  alertas: Alerta[]
  stats: {
    noLeidas: number
    total: number
  }
}

export function NotificationCenter() {
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [stats, setStats] = useState({ noLeidas: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { valuesVisible } = useVisibility()
  const { data: session, status } = useSession()

  useEffect(() => {
    // Solo intentar obtener alertas si el usuario está autenticado
    if (status === "authenticated" && session?.user?.id) {
      fetchAlertas()
    } else if (status === "unauthenticated") {
      setLoading(false)
      setError(null)
      setAlertas([])
      setStats({ noLeidas: 0, total: 0 })
    }
  }, [status, session])

  const fetchAlertas = async () => {
    // Verificar autenticación antes de hacer la petición
    if (!session?.user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch("/api/alertas?limite=10&leidas=false")
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("No autorizado")
        }
        throw new Error("Error al obtener alertas")
      }

      const data: AlertasResponse = await response.json()
      setAlertas(data.alertas)
      setStats(data.stats)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      setError(errorMsg)
      console.error("Error al obtener alertas:", error)
    } finally {
      setLoading(false)
    }
  }

  const marcarComoLeida = async (alertaId: string) => {
    // Verificar autenticación antes de hacer la petición
    if (!session?.user?.id) {
      return
    }

    try {
      const response = await fetch(`/api/alertas/${alertaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ leida: true }),
      })

      if (response.ok) {
        // Actualizar el estado local
        setAlertas(prev => prev.filter(alerta => alerta.id !== alertaId))
        setStats(prev => ({ 
          ...prev, 
          noLeidas: Math.max(0, prev.noLeidas - 1) 
        }))
      }
    } catch (error) {
      console.error("Error al marcar alerta como leída:", error)
    }
  }

  const getPriorityIcon = (prioridad: string) => {
    switch (prioridad) {
      case "CRITICA":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "ALTA":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "MEDIA":
        return <Info className="h-4 w-4 text-blue-500" />
      case "BAJA":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case "CRITICA":
        return "text-red-800 dark:text-red-200"
      case "ALTA":
        return "text-orange-800 dark:text-orange-200"
      case "MEDIA":
        return "text-blue-800 dark:text-blue-200"
      case "BAJA":
        return "text-green-800 dark:text-green-200"
      default:
        return "text-gray-800 dark:text-gray-200"
    }
  }

  const formatMonto = (monto: number) => {
    if (!valuesVisible) return "***"
    return `$${monto.toLocaleString("es-AR")}`
  }

  const getAlertaDetalle = (alerta: Alerta) => {
    if (alerta.gastoRecurrente) {
      return {
        subtitulo: alerta.gastoRecurrente.concepto,
        monto: formatMonto(alerta.gastoRecurrente.monto),
        categoria: alerta.gastoRecurrente.categoria?.descripcion
      }
    }
    
    if (alerta.prestamo) {
      return {
        subtitulo: alerta.prestamo.entidadFinanciera,
        monto: formatMonto(alerta.prestamo.cuotaMensual),
        categoria: "Préstamo"
      }
    }
    
    if (alerta.presupuesto) {
      return {
        subtitulo: alerta.presupuesto.nombre,
        monto: formatMonto(alerta.presupuesto.monto),
        categoria: alerta.presupuesto.categoria?.descripcion
      }
    }
    
    if (alerta.tarea) {
      return {
        subtitulo: alerta.tarea.titulo,
        monto: null,
        categoria: "Tarea"
      }
    }
    
    if (alerta.promocion) {
      const descuento = alerta.promocion.descuento 
        ? formatMonto(alerta.promocion.descuento)
        : alerta.promocion.porcentajeAhorro 
          ? `${alerta.promocion.porcentajeAhorro}%`
          : null
      
      return {
        subtitulo: alerta.promocion.titulo,
        monto: descuento,
        categoria: "Promoción"
      }
    }
    
    return {
      subtitulo: alerta.mensaje,
      monto: null,
      categoria: alerta.tipo.replace("_", " ")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          {stats.noLeidas > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-white" 
              variant="destructive"
            >
              {stats.noLeidas > 99 ? "99+" : stats.noLeidas}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[400px] max-h-[500px] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <Bell className="h-4 w-4 text-amber-500" />
          Centro de Notificaciones
          {stats.noLeidas > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {stats.noLeidas} nuevas
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {loading ? (
          <div className="py-4 px-4 text-sm text-gray-500 text-center">
            Cargando alertas...
          </div>
        ) : error ? (
          <div className="py-4 px-4 text-sm text-red-500 text-center">
            {error}
          </div>
        ) : alertas.length === 0 ? (
          <div className="py-4 px-4 text-sm text-gray-500 text-center">
            No hay alertas pendientes
          </div>
        ) : (
          alertas.map((alerta) => {
            const detalle = getAlertaDetalle(alerta)
            
            return (
              <DropdownMenuItem 
                key={alerta.id} 
                className="py-3 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => marcarComoLeida(alerta.id)}
              >
                <div className="flex items-start gap-3 w-full">
                  {getPriorityIcon(alerta.prioridad)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`font-medium text-sm ${getPriorityColor(alerta.prioridad)}`}>
                        {alerta.titulo}
                      </span>
                      {detalle.monto && (
                        <span className="font-semibold text-sm text-amber-600 dark:text-amber-400">
                          {detalle.monto}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {detalle.subtitulo}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      {detalle.categoria && (
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {detalle.categoria}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {format(new Date(alerta.fechaCreacion), "dd MMM HH:mm", { locale: es })}
                      </span>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            )
          })
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/alertas" className="flex justify-center text-sm text-blue-600 dark:text-blue-400 py-2">
            Ver todas las alertas
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 