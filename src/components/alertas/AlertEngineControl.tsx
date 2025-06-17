'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Play, Eye, AlertTriangle, CheckCircle, Clock, Bell, Square, Zap, TrendingUp, CreditCard } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Progress } from "@/components/ui/progress"

interface AlertaEvaluada {
  tipo: string
  prioridad: string
  titulo: string
}

interface EstadisticasEvaluacion {
  totalCondicionesEvaluadas: number
  alertasCreadas: number
  tiempoEjecucion: number
  distribuciones: {
    [key: string]: number
  }
}

interface SchedulerStatus {
  isRunning: boolean
  hasInterval: boolean
  lastSubscriptionTasksDate: string
  subscriptionTasksExecutedToday: boolean
}

export function AlertEngineControl() {
  const [loading, setLoading] = useState(false)
  const [evaluando, setEvaluando] = useState(false)
  const [schedulerLoading, setSchedulerLoading] = useState(false)
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null)
  const [estadisticas, setEstadisticas] = useState<EstadisticasEvaluacion | null>(null)
  const { toast } = useToast()

  // Cargar estado del scheduler al montar el componente
  useEffect(() => {
    loadSchedulerStatus()
  }, [])

  const loadSchedulerStatus = async () => {
    try {
      const response = await fetch('/api/alertas/scheduler')
      if (response.ok) {
        const data = await response.json()
        setSchedulerStatus(data.status)
      }
    } catch (error) {
      console.error('Error loading scheduler status:', error)
    }
  }

  const controlScheduler = async (action: 'start' | 'stop' | 'runOnce', intervalMinutes?: number) => {
    setSchedulerLoading(true)
    try {
      const response = await fetch('/api/alertas/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, intervalMinutes }),
      })

      if (!response.ok) {
        throw new Error('Error al controlar scheduler')
      }

      const data = await response.json()
      
      toast({
        title: "Scheduler Actualizado",
        description: data.mensaje,
      })

      // Actualizar estado del scheduler
      await loadSchedulerStatus()

      // Si se ejecutó una vez, actualizar estadísticas
      if (action === 'runOnce') {
        await evaluarCondiciones()
      }
    } catch (error) {
      console.error('Error controlling scheduler:', error)
      toast({
        title: "Error",
        description: "Error al controlar el scheduler automático.",
        variant: "destructive",
      })
    } finally {
      setSchedulerLoading(false)
    }
  }

  const getPriorityIcon = (prioridad: string) => {
    switch (prioridad.toUpperCase()) {
      case 'CRITICA':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'ALTA':
        return <Bell className="h-4 w-4 text-orange-500" />
      case 'MEDIA':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'BAJA':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad.toUpperCase()) {
      case 'CRITICA':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'ALTA':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIA':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'BAJA':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const evaluarCondiciones = async () => {
    setEvaluando(true)
    try {
      const response = await fetch('/api/alertas/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Error al evaluar condiciones')
      }

      const data = await response.json()
      setEstadisticas(data.estadisticas)
      
      toast({
        title: "Evaluación Completada",
        description: `${data.estadisticas.alertasCreadas} nueva${data.estadisticas.alertasCreadas === 1 ? '' : 's'} alerta${data.estadisticas.alertasCreadas === 1 ? '' : 's'} creada${data.estadisticas.alertasCreadas === 1 ? '' : 's'}`,
      })
    } catch (error) {
      console.error('Error evaluating conditions:', error)
      toast({
        title: "Error",
        description: "Error al evaluar las condiciones automáticas.",
        variant: "destructive",
      })
    } finally {
      setEvaluando(false)
    }
  }

  const ejecutarMotor = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/alertas/evaluate', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Error al ejecutar motor de alertas')
      }

      const data = await response.json()

      toast({
        title: "Motor de Alertas Ejecutado",
        description: data.mensaje,
      })

      // Actualizar estadísticas después de crear alertas
      await evaluarCondiciones()
    } catch (error) {
      console.error('Error ejecutando motor de alertas:', error)
      toast({
        title: "Error",
        description: "Error al ejecutar el motor de alertas automático.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const limpiarAlertas = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/alertas', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al limpiar alertas')
      }

      const data = await response.json()
      
      toast({
        title: "Alertas Eliminadas",
        description: `${data.count} alerta${data.count === 1 ? '' : 's'} eliminada${data.count === 1 ? '' : 's'}`,
      })
    } catch (error) {
      console.error('Error clearing alerts:', error)
      toast({
        title: "Error",
        description: "Error al eliminar las alertas.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Control de Evaluación Manual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Evaluación Manual
            </CardTitle>
            <CardDescription>
              Ejecuta la evaluación de alertas para todos los usuarios inmediatamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={evaluarCondiciones}
              disabled={evaluando || loading}
              className="w-full flex items-center gap-2"
            >
              {evaluando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              {evaluando ? 'Evaluando...' : 'Evaluar Condiciones'}
            </Button>

            <Button 
              onClick={limpiarAlertas}
              disabled={loading || evaluando}
              variant="outline"
              className="w-full flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              {loading ? 'Limpiando...' : 'Limpiar Todas las Alertas'}
            </Button>
          </CardContent>
        </Card>

        {/* Estadísticas de Última Evaluación */}
        {estadisticas && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Última Evaluación
              </CardTitle>
              <CardDescription>
                Resultados de la evaluación más reciente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {estadisticas.alertasCreadas}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Alertas Creadas
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {estadisticas.totalCondicionesEvaluadas}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Condiciones Evaluadas
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tiempo de Ejecución</span>
                  <span className="font-medium">{estadisticas.tiempoEjecucion}ms</span>
                </div>
              </div>

              {/* Distribución por Prioridad */}
              {Object.keys(estadisticas.distribuciones).length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Distribución por Prioridad</div>
                  {Object.entries(estadisticas.distribuciones).map(([prioridad, cantidad]) => (
                    <div key={prioridad} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {getPriorityIcon(prioridad)}
                        <span className="capitalize">{prioridad.toLowerCase()}</span>
                      </div>
                      <Badge variant="outline">{cantidad}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Control del Scheduler Automático */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Programación Automática
          </CardTitle>
          <CardDescription>
            Controla la ejecución automática del motor de alertas y tareas de suscripciones para todos los usuarios.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {schedulerStatus && (
            <>
              {/* Estado del Scheduler */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <div 
                    className={`h-3 w-3 rounded-full ${
                      schedulerStatus.isRunning ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                  <span className="font-medium">
                    Estado: {schedulerStatus.isRunning ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <Badge variant={schedulerStatus.isRunning ? 'default' : 'secondary'}>
                  {schedulerStatus.isRunning ? 'Ejecutándose cada 60min' : 'Detenido'}
                </Badge>
              </div>

              {/* Estado de Tareas de Suscripciones */}
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800 dark:text-blue-200">
                    Tareas de Suscripciones
                  </span>
                </div>
                <Badge variant={schedulerStatus.subscriptionTasksExecutedToday ? 'default' : 'secondary'}>
                  {schedulerStatus.subscriptionTasksExecutedToday ? 'Ejecutadas Hoy' : 'Pendientes'}
                </Badge>
              </div>

              {schedulerStatus.lastSubscriptionTasksDate && (
                <div className="text-xs text-muted-foreground">
                  Última ejecución de suscripciones: {schedulerStatus.lastSubscriptionTasksDate}
                </div>
              )}
            </>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={() => controlScheduler('start', 60)}
              disabled={schedulerLoading || schedulerStatus?.isRunning}
              variant="default"
              className="flex items-center gap-2"
            >
              {schedulerLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Iniciar Sistema Automático
            </Button>

            <Button 
              onClick={() => controlScheduler('stop')}
              disabled={schedulerLoading || !schedulerStatus?.isRunning}
              variant="destructive"
              className="flex items-center gap-2"
            >
              {schedulerLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              Detener Sistema
            </Button>

            <Button 
              onClick={() => controlScheduler('runOnce')}
              disabled={schedulerLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {schedulerLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Ejecutar Una Vez
            </Button>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• <strong>Alertas:</strong> Se evalúan cada 60 minutos (máximo 24 veces al día)</p>
            <p>• <strong>Suscripciones:</strong> Se procesan una vez por día (renovaciones y downgrades)</p>
            <p>• <strong>Sistema integrado:</strong> Ambas tareas se ejecutan automáticamente sin CRON jobs externos</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 