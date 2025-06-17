"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Bug, 
  Lightbulb, 
  MessageSquare, 
  Zap, 
  Monitor, 
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

// Constantes temporales hasta que Prisma se regenere completamente
const TipoFeedback = {
  BUG: "BUG",
  MEJORA: "MEJORA", 
  SUGERENCIA: "SUGERENCIA",
  PROBLEMA_RENDIMIENTO: "PROBLEMA_RENDIMIENTO",
  ERROR_INTERFAZ: "ERROR_INTERFAZ",
  FUNCIONALIDAD_FALTANTE: "FUNCIONALIDAD_FALTANTE"
} as const

const PrioridadFeedback = {
  BAJA: "BAJA",
  MEDIA: "MEDIA", 
  ALTA: "ALTA",
  CRITICA: "CRITICA"
} as const

const EstadoFeedback = {
  PENDIENTE: "PENDIENTE",
  EN_REVISION: "EN_REVISION",
  SOLUCIONADO: "SOLUCIONADO", 
  DESCARTADO: "DESCARTADO",
  PLANIFICADO: "PLANIFICADO"
} as const

// Tipos derivados
type TipoFeedbackType = typeof TipoFeedback[keyof typeof TipoFeedback]
type PrioridadFeedbackType = typeof PrioridadFeedback[keyof typeof PrioridadFeedback]
type EstadoFeedbackType = typeof EstadoFeedback[keyof typeof EstadoFeedback]

const tiposIcon = {
  [TipoFeedback.BUG]: { icon: Bug, color: "text-red-500", bgColor: "bg-red-50", label: "Bug" },
  [TipoFeedback.MEJORA]: { icon: Lightbulb, color: "text-yellow-500", bgColor: "bg-yellow-50", label: "Mejora" },
  [TipoFeedback.SUGERENCIA]: { icon: MessageSquare, color: "text-blue-500", bgColor: "bg-blue-50", label: "Sugerencia" },
  [TipoFeedback.PROBLEMA_RENDIMIENTO]: { icon: Zap, color: "text-orange-500", bgColor: "bg-orange-50", label: "Rendimiento" },
  [TipoFeedback.ERROR_INTERFAZ]: { icon: Monitor, color: "text-purple-500", bgColor: "bg-purple-50", label: "Interfaz" },
  [TipoFeedback.FUNCIONALIDAD_FALTANTE]: { icon: Plus, color: "text-green-500", bgColor: "bg-green-50", label: "Feature" }
}

const prioridadesConfig = {
  [PrioridadFeedback.BAJA]: { color: "text-green-600", bgColor: "bg-green-100", label: "Baja" },
  [PrioridadFeedback.MEDIA]: { color: "text-yellow-600", bgColor: "bg-yellow-100", label: "Media" },
  [PrioridadFeedback.ALTA]: { color: "text-orange-600", bgColor: "bg-orange-100", label: "Alta" },
  [PrioridadFeedback.CRITICA]: { color: "text-red-600", bgColor: "bg-red-100", label: "Crítica" }
}

const estadosConfig = {
  [EstadoFeedback.PENDIENTE]: { icon: Clock, color: "text-gray-500", bgColor: "bg-gray-100", label: "Pendiente" },
  [EstadoFeedback.EN_REVISION]: { icon: AlertCircle, color: "text-blue-500", bgColor: "bg-blue-100", label: "En Revisión" },
  [EstadoFeedback.SOLUCIONADO]: { icon: CheckCircle, color: "text-green-500", bgColor: "bg-green-100", label: "Solucionado" },
  [EstadoFeedback.DESCARTADO]: { icon: XCircle, color: "text-red-500", bgColor: "bg-red-100", label: "Descartado" },
  [EstadoFeedback.PLANIFICADO]: { icon: Calendar, color: "text-purple-500", bgColor: "bg-purple-100", label: "Planificado" }
}

interface FeedbackItem {
  id: string
  titulo: string
  descripcion: string
  tipo: TipoFeedbackType
  prioridad: PrioridadFeedbackType
  estado: EstadoFeedbackType
  versionApp: string
  dispositivo: string
  respuesta?: string
  fechaRespuesta?: string
  createdAt: string
  updatedAt: string
  admin?: {
    id: string
    name: string
    email: string
  }
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function FeedbackHistory() {
  const { data: session } = useSession()
  
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  
  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<EstadoFeedbackType | "ALL">("ALL")
  const [filtroTipo, setFiltroTipo] = useState<TipoFeedbackType | "ALL">("ALL")

  const cargarFeedbacks = async (page = 1) => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      })
      
      if (filtroEstado && filtroEstado !== "ALL") params.set('estado', filtroEstado)
      if (filtroTipo && filtroTipo !== "ALL") params.set('tipo', filtroTipo)

      const response = await fetch(`/api/feedback?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar feedbacks')
      }

      setFeedbacks(data.feedbacks)
      setPagination(data.pagination)

    } catch (error) {
      console.error('Error:', error)
      setFeedbacks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      cargarFeedbacks(1)
    }
  }, [session?.user?.id, filtroEstado, filtroTipo])

  const handlePageChange = (newPage: number) => {
    cargarFeedbacks(newPage)
  }

  const limpiarFiltros = () => {
    setFiltroEstado("ALL")
    setFiltroTipo("ALL")
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Historial de Feedback</span>
            <span className="text-sm font-normal text-muted-foreground">
              {pagination.total} reportes totales
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Filtro por estado */}
            <div className="flex-1">
              <Select value={filtroEstado} onValueChange={(value) => setFiltroEstado(value as EstadoFeedbackType | "ALL")}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los estados</SelectItem>
                  {Object.entries(estadosConfig).map(([key, config]) => {
                    const IconComponent = config.icon
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <IconComponent className={`h-4 w-4 ${config.color}`} />
                          {config.label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por tipo */}
            <div className="flex-1">
              <Select value={filtroTipo} onValueChange={(value) => setFiltroTipo(value as TipoFeedbackType | "ALL")}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los tipos</SelectItem>
                  {Object.entries(tiposIcon).map(([key, config]) => {
                    const IconComponent = config.icon
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <IconComponent className={`h-4 w-4 ${config.color}`} />
                          {config.label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Botón limpiar filtros */}
            {(filtroEstado !== "ALL" || filtroTipo !== "ALL") && (
              <Button variant="outline" onClick={limpiarFiltros}>
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de feedbacks */}
                {feedbacks.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {filtroEstado !== "ALL" || filtroTipo !== "ALL"
              ? "No se encontraron feedbacks con los filtros aplicados"
              : "Aún no has enviado ningún feedback. ¡Comparte tu experiencia con nosotros!"
            }
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((feedback) => {
            const tipoConfig = tiposIcon[feedback.tipo]
            const prioridadConfig = prioridadesConfig[feedback.prioridad]
            const estadoConfig = estadosConfig[feedback.estado]
            const TipoIcon = tipoConfig.icon
            const EstadoIcon = estadoConfig.icon

            return (
              <Card key={feedback.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icono del tipo */}
                    <div className={`p-2 rounded-full ${tipoConfig.bgColor}`}>
                      <TipoIcon className={`h-5 w-5 ${tipoConfig.color}`} />
                    </div>

                    {/* Contenido principal */}
                    <div className="flex-1 min-w-0">
                      {/* Header con título y badges */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-medium text-lg leading-6 truncate">
                          {feedback.titulo}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Badge de estado */}
                          <Badge variant="secondary" className={`${estadoConfig.bgColor} ${estadoConfig.color} border-0`}>
                            <EstadoIcon className="h-3 w-3 mr-1" />
                            {estadoConfig.label}
                          </Badge>
                          
                          {/* Badge de prioridad */}
                          <Badge variant="outline" className={`${prioridadConfig.bgColor} ${prioridadConfig.color} border-0`}>
                            {prioridadConfig.label}
                          </Badge>
                        </div>
                      </div>

                      {/* Descripción */}
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {feedback.descripcion}
                      </p>

                      {/* Información técnica */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                        <span>#{feedback.id.slice(-8)}</span>
                        <span>•</span>
                        <span>{tipoConfig.label}</span>
                        <span>•</span>
                        <span>{feedback.versionApp}</span>
                        <span>•</span>
                        <span>{feedback.dispositivo}</span>
                      </div>

                      {/* Respuesta del admin si existe */}
                      {feedback.respuesta && (
                        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                              Respuesta del equipo
                            </span>
                            {feedback.admin && (
                              <span className="text-xs text-blue-600 dark:text-blue-400">
                                por {feedback.admin.name}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            {feedback.respuesta}
                          </p>
                          {feedback.fechaRespuesta && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              {formatDistanceToNow(new Date(feedback.fechaRespuesta), { 
                                addSuffix: true, 
                                locale: es 
                              })}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Fechas */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <span className="text-xs text-muted-foreground">
                          Reportado {formatDistanceToNow(new Date(feedback.createdAt), { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </span>
                        {feedback.updatedAt !== feedback.createdAt && (
                          <span className="text-xs text-muted-foreground">
                            Actualizado {formatDistanceToNow(new Date(feedback.updatedAt), { 
                              addSuffix: true, 
                              locale: es 
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Página {pagination.page} de {pagination.totalPages} 
            <span className="ml-2">
              ({pagination.total} reportes totales)
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1
                } else if (pagination.page <= 3) {
                  pageNum = i + 1
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i
                } else {
                  pageNum = pagination.page - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === pagination.page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 