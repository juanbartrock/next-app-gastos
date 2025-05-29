"use client"

import { useState } from "react"
import { AlertTriangle, Info, CheckCircle, XCircle, Bell, Clock, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useVisibility } from "@/contexts/VisibilityContext"

// Tipos para las alertas
interface Alerta {
  id: string
  tipo: string
  prioridad: "BAJA" | "MEDIA" | "ALTA" | "CRITICA"
  titulo: string
  mensaje: string
  leida: boolean
  accionado: boolean
  fechaCreacion: string
  fechaExpiracion?: string
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

interface AlertsListProps {
  alertas: Alerta[]
  loading?: boolean
  onMarcarLeida?: (alertaId: string) => void
  onMarcarAccionado?: (alertaId: string) => void
  onEliminar?: (alertaId: string) => void
  showActions?: boolean
}

export function AlertsList({ 
  alertas, 
  loading = false, 
  onMarcarLeida,
  onMarcarAccionado,
  onEliminar,
  showActions = true 
}: AlertsListProps) {
  const { valuesVisible } = useVisibility()

  const getPriorityIcon = (prioridad: string) => {
    switch (prioridad) {
      case "CRITICA":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "ALTA":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case "MEDIA":
        return <Info className="h-5 w-5 text-blue-500" />
      case "BAJA":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case "CRITICA":
        return "border-l-red-500 bg-red-50 dark:bg-red-950/20"
      case "ALTA":
        return "border-l-orange-500 bg-orange-50 dark:bg-orange-950/20"
      case "MEDIA":
        return "border-l-blue-500 bg-blue-50 dark:bg-blue-950/20"
      case "BAJA":
        return "border-l-green-500 bg-green-50 dark:bg-green-950/20"
      default:
        return "border-l-gray-500 bg-gray-50 dark:bg-gray-950/20"
    }
  }

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      PAGO_RECURRENTE: "Pago Recurrente",
      PRESUPUESTO_80: "Presupuesto 80%",
      PRESUPUESTO_90: "Presupuesto 90%",
      PRESUPUESTO_SUPERADO: "Presupuesto Superado",
      META_PROGRESO: "Meta de Ahorro",
      INVERSION_VENCIMIENTO: "Inversión Vencimiento",
      PRESTAMO_CUOTA: "Cuota de Préstamo",
      GASTO_INUSUAL: "Gasto Inusual",
      OPORTUNIDAD_AHORRO: "Oportunidad de Ahorro",
      SALDO_BAJO: "Saldo Bajo",
      RECOMENDACION_IA: "Recomendación IA",
      TAREA_VENCIMIENTO: "Tarea Vencimiento",
      PROMOCION_DISPONIBLE: "Promoción Disponible"
    }
    return labels[tipo] || tipo.replace("_", " ")
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
      categoria: getTipoLabel(alerta.tipo)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (alertas.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No hay alertas
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            No se encontraron alertas para mostrar.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {alertas.map((alerta) => {
        const detalle = getAlertaDetalle(alerta)
        
        return (
          <Card 
            key={alerta.id} 
            className={`border-l-4 ${getPriorityColor(alerta.prioridad)} ${
              !alerta.leida ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getPriorityIcon(alerta.prioridad)}
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {alerta.titulo}
                      {!alerta.leida && (
                        <Badge variant="secondary" className="text-xs">
                          Nueva
                        </Badge>
                      )}
                      {alerta.accionado && (
                        <Badge variant="outline" className="text-xs">
                          Accionado
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {getTipoLabel(alerta.tipo)}
                      </Badge>
                      {detalle.categoria && (
                        <Badge variant="secondary" className="text-xs">
                          {detalle.categoria}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {detalle.monto && (
                  <div className="text-right">
                    <span className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                      {detalle.monto}
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {alerta.mensaje}
              </p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {format(new Date(alerta.fechaCreacion), "dd 'de' MMMM 'a las' HH:mm", { locale: es })}
                  </span>
                  {alerta.fechaExpiracion && (
                    <span className="text-orange-600 dark:text-orange-400">
                      Expira: {format(new Date(alerta.fechaExpiracion), "dd/MM/yyyy", { locale: es })}
                    </span>
                  )}
                </div>
                
                {showActions && (
                  <div className="flex items-center gap-2">
                    {!alerta.leida && onMarcarLeida && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onMarcarLeida(alerta.id)}
                        className="text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Marcar leída
                      </Button>
                    )}
                    {!alerta.accionado && onMarcarAccionado && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onMarcarAccionado(alerta.id)}
                        className="text-xs"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Accionado
                      </Button>
                    )}
                    {onEliminar && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEliminar(alerta.id)}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Eliminar
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
} 