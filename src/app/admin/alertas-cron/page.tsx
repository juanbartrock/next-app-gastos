'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { 
  Clock, 
  Zap, 
  Globe,
  Key,
  Copy,
  ExternalLink,
  Info,
  Loader2
} from 'lucide-react'

export default function AlertasCronPage() {
  const [loading, setLoading] = useState(false)
  const [cronToken, setCronToken] = useState('')
  const [lastResult, setLastResult] = useState<any>(null)
  const { toast } = useToast()

  const executeManualCron = async () => {
    setLoading(true)
    try {
      const token = cronToken || 'cron-default-token'
      
      const response = await fetch('/api/alertas/cron', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Error al ejecutar cron de alertas')
      }

      const data = await response.json()
      setLastResult(data)

      toast({
        title: "Cron Ejecutado",
        description: data.mensaje,
      })
    } catch (error) {
      console.error('Error executing cron:', error)
      toast({
        title: "Error",
        description: "Error al ejecutar el cron de alertas.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado",
      description: "Texto copiado al portapapeles",
    })
  }

  const cronUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/alertas/cron`
    : 'https://tu-app.vercel.app/api/alertas/cron'

  const uptimeRobotExample = `Monitor Type: HTTP(s)
URL: ${cronUrl}
Friendly Name: Alertas Automáticas
Headers: Authorization: Bearer ${cronToken || 'tu-token-secreto'}
Monitoring Interval: 60 minutes`

  const githubActionExample = `name: Alertas Automáticas
on:
  schedule:
    - cron: '0 */1 * * *'  # Cada hora
jobs:
  alertas:
    runs-on: ubuntu-latest
    steps:
      - name: Ejecutar Alertas
        run: |
          curl -X GET "${cronUrl}" \\
            -H "Authorization: Bearer \${{ secrets.CRON_TOKEN }}" \\
            -H "Content-Type: application/json"`

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Clock className="h-8 w-8 text-blue-600" />
          Alertas Automáticas con Cron
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Configuración para ejecutar alertas automáticas usando servicios externos de cron
        </p>
      </div>

      {/* Configuración del Token */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Configuración de Seguridad
          </CardTitle>
          <CardDescription>
            Token de autorización para proteger el endpoint de cron
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="token">Token de Cron (CRON_SECRET_TOKEN)</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="token"
                type="password"
                placeholder="Ingresa el token secreto"
                value={cronToken}
                onChange={(e) => setCronToken(e.target.value)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCronToken('alertas-' + Math.random().toString(36).substr(2, 9))}
              >
                Generar
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Este token debe configurarse como variable de entorno CRON_SECRET_TOKEN en Vercel
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Prueba Manual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Prueba Manual
          </CardTitle>
          <CardDescription>
            Ejecutar manualmente la evaluación de alertas para verificar funcionamiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={executeManualCron}
            disabled={loading || !cronToken}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Ejecutar Evaluación de Alertas
          </Button>

          {lastResult && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h4 className="font-medium mb-2">Último Resultado:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Usuarios evaluados:</span>
                  <Badge variant="outline" className="ml-2">{lastResult.totalUsuarios}</Badge>
                </div>
                <div>
                  <span className="text-gray-600">Alertas creadas:</span>
                  <Badge className="ml-2">{lastResult.totalAlertasCreadas}</Badge>
                </div>
                <div>
                  <span className="text-gray-600">Alertas eliminadas:</span>
                  <Badge variant="secondary" className="ml-2">{lastResult.alertasEliminadas}</Badge>
                </div>
                <div>
                  <span className="text-gray-600">Timestamp:</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(lastResult.timestamp).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuración de Servicios Externos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Configuración de Servicios Externos
          </CardTitle>
          <CardDescription>
            Ejemplos para configurar cron jobs automáticos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* URL del Endpoint */}
          <div>
            <Label>URL del Endpoint</Label>
            <div className="flex gap-2 mt-1">
              <Input 
                value={cronUrl}
                readOnly 
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(cronUrl)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* UptimeRobot */}
          <div>
            <h4 className="font-medium flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              UptimeRobot (Recomendado)
            </h4>
            <pre className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-xs overflow-x-auto mt-2">
              {uptimeRobotExample}
            </pre>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => copyToClipboard(uptimeRobotExample)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Configuración
            </Button>
          </div>

          {/* GitHub Actions */}
          <div>
            <h4 className="font-medium flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              GitHub Actions
            </h4>
            <pre className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-xs overflow-x-auto mt-2">
              {githubActionExample}
            </pre>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => copyToClipboard(githubActionExample)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Workflow
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Información Adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Información Importante
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p><strong>Vercel Limitations:</strong> Las funciones serverless no mantienen procesos persistentes, por eso necesitamos servicios externos.</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <p><strong>UptimeRobot:</strong> Servicio gratuito que puede hacer ping cada 60 minutos a tu endpoint.</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
            <p><strong>GitHub Actions:</strong> Alternativa gratuita usando cron jobs de GitHub.</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
            <p><strong>Vercel Cron:</strong> Disponible en Plan Pro, pero requiere configuración adicional.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 