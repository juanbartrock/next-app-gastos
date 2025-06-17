"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, RefreshCw, Users, Clock, CheckCircle, Calendar, Settings, MessageSquare, X, Zap } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

interface FeedbackItem {
  id: string
  titulo: string
  descripcion: string
  tipo: string
  prioridad: string
  estado: string
  versionApp: string
  dispositivo: string
  respuesta?: string
  fechaRespuesta?: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
  }
  admin?: {
    id: string
    name: string
    email: string
  }
}

interface Estadisticas {
  total: number
  pendientes: number
  enRevision: number
  planificados: number
  implementados: number
  solucionados: number
  rechazados: number
}

export default function AdminFeedbackPage() {
  const { data: session } = useSession()
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const [actualizando, setActualizando] = useState<string | null>(null)
  const [dialogAbierto, setDialogAbierto] = useState<string | null>(null)
  const [respuestaTexto, setRespuestaTexto] = useState("")

  // Verificar permisos
  if (session?.user?.email !== "jpautasso@gmail.com") {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Acceso denegado. Solo el administrador principal puede ver esta pagina.
        </AlertDescription>
      </Alert>
    )
  }

  const cargarFeedbacks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/feedback/admin')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar feedbacks')
      }

      setFeedbacks(data.feedbacks)
      setEstadisticas(data.estadisticas)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar feedbacks')
      setFeedbacks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      cargarFeedbacks()
    }
  }, [session?.user?.id])

  const cambiarEstado = async (feedbackId: string, nuevoEstado: string) => {
    try {
      setActualizando(feedbackId)
      
      const response = await fetch('/api/feedback/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackIds: [feedbackId],
          estado: nuevoEstado
        })
      })

      if (!response.ok) {
        throw new Error('Error al actualizar estado')
      }

      toast.success('Estado actualizado correctamente')
      cargarFeedbacks() // Recargar datos
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar estado')
    } finally {
      setActualizando(null)
    }
  }

  const enviarRespuesta = async (feedbackId: string) => {
    if (!respuestaTexto.trim()) {
      toast.error('La respuesta no puede estar vacia')
      return
    }

    try {
      setActualizando(feedbackId)
      
      const response = await fetch('/api/feedback/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackIds: [feedbackId],
          respuesta: respuestaTexto.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Error al enviar respuesta')
      }

      toast.success('Respuesta enviada correctamente')
      setRespuestaTexto("")
      setDialogAbierto(null)
      cargarFeedbacks() // Recargar datos
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al enviar respuesta')
    } finally {
      setActualizando(null)
    }
  }

  if (loading && !estadisticas) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion de Feedback Beta</h1>
          <p className="text-muted-foreground">Panel administrativo para gestionar reportes de usuarios</p>
        </div>
        <Button onClick={cargarFeedbacks} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Estadisticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-2xl font-bold">{estadisticas.total}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-gray-500" />
              </div>
              <div className="text-2xl font-bold text-gray-600">{estadisticas.pendientes}</div>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <AlertCircle className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{estadisticas.enRevision}</div>
              <p className="text-xs text-muted-foreground">En Revision</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="h-5 w-5 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-purple-600">{estadisticas.planificados}</div>
              <p className="text-xs text-muted-foreground">Planificados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Zap className="h-5 w-5 text-orange-500" />
              </div>
              <div className="text-2xl font-bold text-orange-600">{estadisticas.implementados}</div>
              <p className="text-xs text-muted-foreground">Implementados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-green-600">{estadisticas.solucionados}</div>
              <p className="text-xs text-muted-foreground">Solucionados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <X className="h-5 w-5 text-red-500" />
              </div>
              <div className="text-2xl font-bold text-red-600">{estadisticas.rechazados}</div>
              <p className="text-xs text-muted-foreground">Rechazados</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de feedbacks */}
      {feedbacks.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No hay feedbacks de usuarios aun.</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((feedback) => (
            <Card key={feedback.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-medium text-lg leading-6">{feedback.titulo}</h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="secondary">{feedback.estado}</Badge>
                        <Badge variant="outline">{feedback.prioridad}</Badge>
                      </div>
                    </div>
                    
                    {/* Controles de Administracion */}
                    <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Cambiar estado:</span>
                        <Select
                          value={feedback.estado}
                          onValueChange={(nuevoEstado) => cambiarEstado(feedback.id, nuevoEstado)}
                          disabled={actualizando === feedback.id}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                            <SelectItem value="EN_REVISION">En Revision</SelectItem>
                            <SelectItem value="PLANIFICADO">Planificado</SelectItem>
                            <SelectItem value="IMPLEMENTADO">Implementado</SelectItem>
                            <SelectItem value="SOLUCIONADO">Solucionado</SelectItem>
                            <SelectItem value="RECHAZADO">Rechazado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Dialog open={dialogAbierto === feedback.id} onOpenChange={(open) => {
                        if (!open) setDialogAbierto(null)
                        else setDialogAbierto(feedback.id)
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Responder
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Responder Feedback</DialogTitle>
                            <DialogDescription>
                              Respuesta para: {feedback.titulo}
                            </DialogDescription>
                          </DialogHeader>
                          <Textarea
                            placeholder="Escribe tu respuesta aqui..."
                            value={respuestaTexto}
                            onChange={(e) => setRespuestaTexto(e.target.value)}
                            rows={4}
                          />
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogAbierto(null)}>
                              Cancelar
                            </Button>
                            <Button 
                              onClick={() => enviarRespuesta(feedback.id)}
                              disabled={!respuestaTexto.trim() || actualizando === feedback.id}
                            >
                              Enviar Respuesta
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="text-xs">Usuario: {feedback.user.name}</Badge>
                      <Badge variant="outline" className="text-xs">Email: {feedback.user.email}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{feedback.descripcion}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                      <span>#{feedback.id.slice(-8)}</span>
                      <span>•</span>
                      <span>{feedback.tipo}</span>
                      <span>•</span>
                      <span>{feedback.versionApp}</span>
                      <span>•</span>
                      <span>{feedback.dispositivo}</span>
                    </div>
                    {feedback.respuesta && (
                      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3 mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium text-green-700 dark:text-green-300">Respuesta enviada</span>
                          {feedback.admin && (
                            <span className="text-xs text-green-600 dark:text-green-400">por {feedback.admin.name}</span>
                          )}
                        </div>
                        <p className="text-sm text-green-800 dark:text-green-200">{feedback.respuesta}</p>
                        {feedback.fechaRespuesta && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            {formatDistanceToNow(new Date(feedback.fechaRespuesta), { addSuffix: true, locale: es })}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <span className="text-xs text-muted-foreground">
                        Reportado {formatDistanceToNow(new Date(feedback.createdAt), { addSuffix: true, locale: es })}
                      </span>
                      {feedback.updatedAt !== feedback.createdAt && (
                        <span className="text-xs text-muted-foreground">
                          Actualizado {formatDistanceToNow(new Date(feedback.updatedAt), { addSuffix: true, locale: es })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 