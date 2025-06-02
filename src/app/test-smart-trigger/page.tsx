'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { 
  Zap, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Activity,
  Timer,
  BarChart3,
  Info,
  Play,
  RotateCcw,
  Eye
} from 'lucide-react'

interface SmartTriggerStats {
  lastExecution?: string
  executionsToday: number
  nextPossibleExecution: string
  isEnabled: boolean
}

interface ExecutionResult {
  executed: boolean
  reason: string
  alertasCreadas?: number
  lastExecution?: string
}

export default function TestSmartTriggerPage() {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<SmartTriggerStats | null>(null)
  const [lastResult, setLastResult] = useState<ExecutionResult | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const { toast } = useToast()

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)])
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/alertas/smart-trigger')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        addLog('Estadísticas cargadas correctamente')
      }
    } catch (error) {
      addLog('Error cargando estadísticas: ' + (error instanceof Error ? error.message : 'Error desconocido'))
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const executeSmartTrigger = async () => {
    setLoading(true)
    addLog('Iniciando ejecución del Smart Trigger...')
    
    try {
      const response = await fetch('/api/alertas/smart-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'test-page' })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setLastResult(data.result)
        setStats(data.stats)
        
        if (data.result.executed) {
          addLog(`✅ Ejecución exitosa: ${data.result.alertasCreadas} alertas creadas`)
          toast({
            title: "Smart Trigger ejecutado",
            description: `Se crearon ${data.result.alertasCreadas} alertas nuevas`,
          })
        } else {
          addLog(`ℹ️ No ejecutado: ${data.result.reason}`)
          toast({
            title: "Smart Trigger no ejecutado",
            description: data.result.reason,
            variant: "default"
          })
        }
      } else {
        addLog('❌ Error en la respuesta del servidor')
        toast({
          title: "Error",
          description: "Error al ejecutar el Smart Trigger",
          variant: "destructive"
        })
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      addLog('❌ Error de conexión: ' + errorMsg)
      toast({
        title: "Error de conexión",
        description: errorMsg,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const resetTrigger = async () => {
    try {
      addLog('Intentando reiniciar Smart Trigger...')
      // Esta funcionalidad requeriría una API adicional para reiniciar
      // Por ahora solo recargamos las estadísticas
      await loadStats()
      addLog('Estadísticas recargadas')
      toast({
        title: "Reinicio simulado",
        description: "Se recargaron las estadísticas del Smart Trigger",
      })
    } catch (error) {
      addLog('Error en reinicio: ' + (error instanceof Error ? error.message : 'Error desconocido'))
    }
  }

  const testFromDashboard = () => {
    addLog('Probando integración con Dashboard...')
    
    // Simular la llamada que hace el dashboard
    fetch('/api/alertas/smart-trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'dashboard-simulation' })
    })
    .then(response => response.json())
    .then(data => {
      addLog(`Dashboard simulation: ${data.success ? 'Exitoso' : 'Falló'}`)
      if (data.success) {
        setLastResult(data.result)
        setStats(data.stats)
      }
    })
    .catch(error => {
      addLog('Error en simulación Dashboard: ' + error.message)
    })
  }

  const getStatusColor = (executed: boolean) => {
    return executed ? 'text-green-600' : 'text-yellow-600'
  }

  const getStatusIcon = (executed: boolean) => {
    return executed ? CheckCircle : Clock
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pruebas Smart Trigger</h1>
          <p className="text-muted-foreground">
            Prueba el sistema de alertas inteligente localmente
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Modo Desarrollo
        </Badge>
      </div>

      {/* Estado actual del Smart Trigger */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Estado del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {stats?.isEnabled ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-600">Activo</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="font-medium text-red-600">Inactivo</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Ejecuciones Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{stats?.executionsToday || 0}</span>
              <span className="text-muted-foreground">/ 24 máx</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Última Ejecución</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-orange-500" />
              <span className="text-sm">
                {stats?.lastExecution 
                  ? new Date(stats.lastExecution).toLocaleString()
                  : 'Nunca ejecutado'
                }
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de prueba */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Controles de Prueba
          </CardTitle>
          <CardDescription>
            Ejecuta diferentes pruebas del Smart Trigger
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={executeSmartTrigger}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ejecutando...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Ejecutar Ahora
                </>
              )}
            </Button>

            <Button 
              onClick={testFromDashboard}
              variant="outline"
              className="w-full"
            >
              <Eye className="mr-2 h-4 w-4" />
              Simular Dashboard
            </Button>

            <Button 
              onClick={resetTrigger}
              variant="outline"
              className="w-full"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Recargar Stats
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultado de la última ejecución */}
      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(getStatusIcon(lastResult.executed), { 
                className: `h-5 w-5 ${getStatusColor(lastResult.executed)}` 
              })}
              Resultado de la Última Ejecución
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estado</p>
                <p className={`font-semibold ${getStatusColor(lastResult.executed)}`}>
                  {lastResult.executed ? 'Ejecutado' : 'No ejecutado'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alertas creadas</p>
                <p className="font-semibold">
                  {lastResult.alertasCreadas !== undefined ? lastResult.alertasCreadas : 'N/A'}
                </p>
              </div>
            </div>
            
            <Separator />
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Motivo:</strong> {lastResult.reason}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Log de eventos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Log de Eventos
          </CardTitle>
          <CardDescription>
            Historial de las últimas 10 acciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No hay eventos registrados
              </p>
            ) : (
              logs.map((log, index) => (
                <div 
                  key={index}
                  className="text-sm font-mono bg-muted p-2 rounded border-l-2 border-blue-500"
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Información de configuración */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Información de Configuración
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Intervalo mínimo:</p>
              <p className="text-muted-foreground">60 minutos entre ejecuciones</p>
            </div>
            <div>
              <p className="font-medium">Máximo diario:</p>
              <p className="text-muted-foreground">24 ejecuciones por día</p>
            </div>
            <div>
              <p className="font-medium">Usuarios activos:</p>
              <p className="text-muted-foreground">Actividad en últimos 7 días</p>
            </div>
            <div>
              <p className="font-medium">Próxima ejecución:</p>
              <p className="text-muted-foreground">
                {stats?.nextPossibleExecution 
                  ? new Date(stats.nextPossibleExecution).toLocaleString()
                  : 'Puede ejecutar ahora'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 