'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Bell,
  Zap,
  Eye,
  Play,
  Square,
  Cpu
} from 'lucide-react'

interface AlertaEvaluada {
  tipo: string
  prioridad: string
  titulo: string
}

interface EstadisticasEvaluacion {
  alertasPotenciales: number
  detalles: AlertaEvaluada[]
}

export default function TestFase2Page() {
  const [loading, setLoading] = useState(false)
  const [evaluando, setEvaluando] = useState(false)
  const [schedulerLoading, setSchedulerLoading] = useState(false)
  const [schedulerStatus, setSchedulerStatus] = useState<{ isRunning: boolean; hasInterval: boolean } | null>(null)
  const [estadisticas, setEstadisticas] = useState<EstadisticasEvaluacion | null>(null)
  const [ultimaEjecucion, setUltimaEjecucion] = useState<string | null>(null)
  const { toast } = useToast()

  const getPriorityIcon = (prioridad: string) => {
    switch (prioridad.toUpperCase()) {
      case 'CRITICA':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'ALTA':
        return <Bell className="h-4 w-4 text-orange-500" />
      case 'MEDIA':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'BAJA':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad.toUpperCase()) {
      case 'CRITICA':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-200'
      case 'ALTA':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-200'
      case 'MEDIA':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-200'
      case 'BAJA':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-200'
    }
  }

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
      setUltimaEjecucion(new Date().toLocaleString('es-AR'))

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
      setUltimaEjecucion(new Date().toLocaleString('es-AR'))

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

  const controlScheduler = async (action: 'start' | 'stop' | 'runOnce') => {
    setSchedulerLoading(true)
    try {
      const response = await fetch('/api/alertas/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, intervalMinutes: 60 }),
      })

      if (!response.ok) {
        throw new Error('Error al controlar scheduler')
      }

      const data = await response.json()
      
      toast({
        title: "Scheduler Actualizado",
        description: data.mensaje,
      })

      await loadSchedulerStatus()
      setUltimaEjecucion(new Date().toLocaleString('es-AR'))

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

  // Cargar estado inicial
  useState(() => {
    loadSchedulerStatus()
    evaluarCondiciones()
  })

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Cpu className="h-8 w-8 text-blue-600" />
          FASE 2 - Motor Automático de Alertas
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Página de prueba para verificar el funcionamiento del motor automático de alertas
        </p>
      </div>

      {/* Estado del Sistema */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Estado del Motor de Alertas
            </span>
            {schedulerStatus && (
              <Badge variant={schedulerStatus.isRunning ? 'default' : 'secondary'}>
                {schedulerStatus.isRunning ? 'Activo' : 'Inactivo'}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Sistema automático de evaluación y generación de alertas inteligentes
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
                  Scheduler: {schedulerStatus.isRunning ? 'Ejecutándose' : 'Detenido'}
                </span>
              </div>
              {ultimaEjecucion && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Última ejecución: {ultimaEjecucion}
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

            <Button 
              onClick={() => controlScheduler('runOnce')}
              disabled={schedulerLoading}
              variant="secondary"
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
        </CardContent>
      </Card>

      {/* Resultados de Evaluación */}
      {estadisticas && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Resultado de Evaluación</span>
              <Badge variant="secondary">
                {estadisticas.alertasPotenciales} condiciones detectadas
              </Badge>
            </CardTitle>
            <CardDescription>
              Condiciones que pueden generar alertas automáticas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {estadisticas.alertasPotenciales > 0 ? (
              <div className="space-y-3">
                {estadisticas.detalles.map((alerta, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded border"
                  >
                    <div className="flex items-center gap-3">
                      {getPriorityIcon(alerta.prioridad)}
                      <span className="font-medium">{alerta.titulo}</span>
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
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-lg font-medium text-green-600 dark:text-green-400">
                  ¡Excelente! No hay condiciones que requieran alertas
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Todos los indicadores están dentro de los parámetros normales
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Control del Scheduler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Control del Scheduler Automático
          </CardTitle>
          <CardDescription>
            Gestiona la ejecución automática del motor de alertas para todos los usuarios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button 
              onClick={() => controlScheduler('start')}
              disabled={schedulerLoading || schedulerStatus?.isRunning}
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
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              ✨ Características de la FASE 2
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800 dark:text-blue-200">
              <div>
                <p><strong>🤖 Evaluación Automática:</strong></p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>Presupuestos (80%, 90%, 100%)</li>
                  <li>Préstamos próximos a vencer</li>
                  <li>Inversiones por vencer</li>
                </ul>
              </div>
              <div>
                <p><strong>🎯 Detección Inteligente:</strong></p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>Gastos recurrentes pendientes</li>
                  <li>Tareas vencidas</li>
                  <li>Gastos anómalos/inusuales</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 