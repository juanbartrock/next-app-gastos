'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Play, Eye, AlertTriangle, CheckCircle, Clock, Bell, Square, Zap } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface AlertaEvaluada {
  tipo: string
  prioridad: string
  titulo: string
}

interface EstadisticasEvaluacion {
  alertasPotenciales: number
  detalles: AlertaEvaluada[]
}

export function AlertEngineControl() {
  const [loading, setLoading] = useState(false)
  const [evaluando, setEvaluando] = useState(false)
  const [schedulerLoading, setSchedulerLoading] = useState(false)
  const [schedulerStatus, setSchedulerStatus] = useState<{ isRunning: boolean; hasInterval: boolean } | null>(null)
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
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Error al evaluar condiciones')
      }

      const data = await response.json()
      setEstadisticas(data)

      toast({
        title: "Evaluación Completada",
        description: `Se encontraron ${data.alertasPotenciales} condiciones que pueden generar alertas.`,
      })
    } catch (error) {
      console.error('Error evaluando condiciones:', error)
      toast({
        title: "Error",
        description: "Error al evaluar las condiciones de alerta.",
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Motor de Alertas Automático
          </CardTitle>
          <CardDescription>
            Evalúa automáticamente las condiciones y genera alertas inteligentes para el usuario.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button 
              onClick={evaluarCondiciones}
              disabled={evaluando}
              variant="outline"
              className="flex items-center gap-2"
            >
              {evaluando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              Evaluar Condiciones
            </Button>

            <Button 
              onClick={ejecutarMotor}
              disabled={loading || evaluando}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Ejecutar Motor
            </Button>
          </div>

          {estadisticas && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Evaluación de Condiciones</h4>
                <Badge variant="secondary">
                  {estadisticas.alertasPotenciales} condiciones detectadas
                </Badge>
              </div>

              {estadisticas.alertasPotenciales > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Condiciones que pueden generar alertas:
                  </p>
                  <div className="grid gap-2">
                    {estadisticas.detalles.map((alerta, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border"
                      >
                        <div className="flex items-center gap-3">
                          {getPriorityIcon(alerta.prioridad)}
                          <span className="text-sm font-medium">{alerta.titulo}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPriorityColor(alerta.prioridad)}`}
                          >
                            {alerta.prioridad}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {alerta.tipo.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ✅ No se encontraron condiciones que requieran alertas automáticas.
                </p>
              )}
            </div>
          )}

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              ¿Cómo funciona el Motor de Alertas?
            </h5>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• <strong>Presupuestos:</strong> Alertas al 80%, 90% y 100% del presupuesto usado</li>
              <li>• <strong>Préstamos:</strong> Cuotas próximas a vencer (próximos 7 días)</li>
              <li>• <strong>Inversiones:</strong> Vencimientos próximos (próximos 30 días)</li>
              <li>• <strong>Gastos Recurrentes:</strong> Pagos próximos (próximos 3 días)</li>
              <li>• <strong>Tareas:</strong> Tareas vencidas sin completar</li>
              <li>• <strong>Gastos Anómalos:</strong> Gastos 3x mayores que el promedio histórico</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Programación Automática
          </CardTitle>
          <CardDescription>
            Controla la ejecución automática del motor de alertas para todos los usuarios.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {schedulerStatus && (
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
                {schedulerStatus.isRunning ? 'Ejecutándose' : 'Detenido'}
              </Badge>
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
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
              Iniciar Scheduler (60min)
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
              Detener Scheduler
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

          <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <h5 className="font-medium text-orange-900 dark:text-orange-100 mb-2">
              ⚡ Programación Automática
            </h5>
            <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-1">
              <li>• <strong>Intervalo por defecto:</strong> Cada 60 minutos</li>
              <li>• <strong>Usuarios evaluados:</strong> Solo usuarios activos (con actividad en 30 días)</li>
              <li>• <strong>Limpieza automática:</strong> Elimina alertas expiradas</li>
              <li>• <strong>Logging completo:</strong> Registra todas las evaluaciones y resultados</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 