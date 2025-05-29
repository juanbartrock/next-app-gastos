'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { 
  Loader2, 
  Brain, 
  BarChart3, 
  Lightbulb, 
  AlertTriangle,
  FileText,
  SearchX,
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle
} from 'lucide-react'

export default function TestFase3Page() {
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [resultados, setResultados] = useState<Record<string, any>>({})
  const { toast } = useToast()

  const setLoadingState = (key: string, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }))
  }

  const testAnalisisPatrones = async () => {
    setLoadingState('patrones', true)
    try {
      const response = await fetch('/api/ai/analizar-patrones?meses=6')
      const data = await response.json()
      
      if (response.ok) {
        setResultados(prev => ({ ...prev, patrones: data }))
        toast({
          title: "✅ Análisis de Patrones",
          description: `${data.patrones.length} patrones detectados correctamente`,
        })
      } else {
        throw new Error(data.error || 'Error desconocido')
      }
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: "❌ Error en Análisis de Patrones",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoadingState('patrones', false)
    }
  }

  const testRecomendaciones = async () => {
    setLoadingState('recomendaciones', true)
    try {
      const response = await fetch('/api/ai/recomendaciones')
      const data = await response.json()
      
      if (response.ok) {
        setResultados(prev => ({ ...prev, recomendaciones: data }))
        toast({
          title: "✅ Recomendaciones IA",
          description: `${data.recomendaciones.length} recomendaciones generadas`,
        })
      } else {
        throw new Error(data.error || 'Error desconocido')
      }
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: "❌ Error en Recomendaciones",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoadingState('recomendaciones', false)
    }
  }

  const testAlertasPredictivas = async () => {
    setLoadingState('alertas', true)
    try {
      const response = await fetch('/api/ai/alertas-predictivas')
      const data = await response.json()
      
      if (response.ok) {
        setResultados(prev => ({ ...prev, alertas: data }))
        toast({
          title: "✅ Alertas Predictivas",
          description: `${data.alertasPredictivas.length} alertas predichas`,
        })
      } else {
        throw new Error(data.error || 'Error desconocido')
      }
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: "❌ Error en Alertas Predictivas",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoadingState('alertas', false)
    }
  }

  const testReporteInteligente = async () => {
    setLoadingState('reporte', true)
    try {
      const response = await fetch('/api/ai/reporte-inteligente')
      const data = await response.json()
      
      if (response.ok) {
        setResultados(prev => ({ ...prev, reporte: data }))
        toast({
          title: "✅ Reporte Inteligente",
          description: "Reporte mensual generado exitosamente",
        })
      } else {
        throw new Error(data.error || 'Error desconocido')
      }
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: "❌ Error en Reporte Inteligente",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoadingState('reporte', false)
    }
  }

  const testDeteccionAnomalias = async () => {
    setLoadingState('anomalias', true)
    try {
      const response = await fetch('/api/ai/detectar-anomalias')
      const data = await response.json()
      
      if (response.ok) {
        setResultados(prev => ({ ...prev, anomalias: data }))
        toast({
          title: "✅ Detección de Anomalías",
          description: `${data.gastosAnomalos.length} gastos anómalos detectados`,
        })
      } else {
        throw new Error(data.error || 'Error desconocido')
      }
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: "❌ Error en Detección de Anomalías",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoadingState('anomalias', false)
    }
  }

  const ejecutarTodasLasPruebas = async () => {
    toast({
      title: "🧪 Iniciando Pruebas Completas",
      description: "Ejecutando todas las funcionalidades de IA...",
    })

    await Promise.all([
      testAnalisisPatrones(),
      testRecomendaciones(),
      testAlertasPredictivas(),
      testReporteInteligente(),
      testDeteccionAnomalias()
    ])

    toast({
      title: "🎉 Pruebas Completadas",
      description: "Todas las funcionalidades de IA han sido probadas",
    })
  }

  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(monto)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
            <Brain className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Test FASE 3 - Inteligencia Artificial
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Prueba completa de todas las funcionalidades de IA implementadas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <span className="text-sm text-purple-700 dark:text-purple-300">
            <strong>OpenAI Integration:</strong> Análisis de patrones, recomendaciones, alertas predictivas y reportes inteligentes
          </span>
        </div>
      </div>

      {/* Panel de Control */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Panel de Control de Pruebas
          </CardTitle>
          <CardDescription>
            Ejecuta las pruebas individualmente o todas a la vez
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <Button 
              onClick={testAnalisisPatrones}
              disabled={loading.patrones}
              className="flex items-center gap-2"
              variant="outline"
            >
              {loading.patrones ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
              Patrones
            </Button>

            <Button 
              onClick={testRecomendaciones}
              disabled={loading.recomendaciones}
              className="flex items-center gap-2"
              variant="outline"
            >
              {loading.recomendaciones ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
              Recomendaciones
            </Button>

            <Button 
              onClick={testAlertasPredictivas}
              disabled={loading.alertas}
              className="flex items-center gap-2"
              variant="outline"
            >
              {loading.alertas ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
              Alertas
            </Button>

            <Button 
              onClick={testReporteInteligente}
              disabled={loading.reporte}
              className="flex items-center gap-2"
              variant="outline"
            >
              {loading.reporte ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Reporte
            </Button>

            <Button 
              onClick={testDeteccionAnomalias}
              disabled={loading.anomalias}
              className="flex items-center gap-2"
              variant="outline"
            >
              {loading.anomalias ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchX className="h-4 w-4" />}
              Anomalías
            </Button>

            <Button 
              onClick={ejecutarTodasLasPruebas}
              disabled={Object.values(loading).some(l => l)}
              className="flex items-center gap-2 md:col-span-1"
            >
              {Object.values(loading).some(l => l) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              Todo
            </Button>
          </div>

          {/* Estados de las pruebas */}
          <div className="grid grid-cols-5 gap-2 text-center text-sm">
            {[
              { key: 'patrones', label: 'Patrones' },
              { key: 'recomendaciones', label: 'Recomendaciones' },
              { key: 'alertas', label: 'Alertas' },
              { key: 'reporte', label: 'Reporte' },
              { key: 'anomalias', label: 'Anomalías' }
            ].map(test => (
              <div key={test.key} className="flex flex-col items-center gap-1">
                {loading[test.key] ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                ) : resultados[test.key] ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-xs">{test.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Tabs defaultValue="patrones" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="patrones">Patrones</TabsTrigger>
          <TabsTrigger value="recomendaciones">Recomendaciones</TabsTrigger>
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
          <TabsTrigger value="reporte">Reporte</TabsTrigger>
          <TabsTrigger value="anomalias">Anomalías</TabsTrigger>
        </TabsList>

        <TabsContent value="patrones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Análisis de Patrones de Gastos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resultados.patrones ? (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    {resultados.patrones.patrones.length} patrones detectados
                  </div>
                  {resultados.patrones.patrones.map((patron: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{patron.categoria}</span>
                        <Badge variant="outline">{patron.tendencia}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Promedio:</span>
                          <div>{formatearMoneda(patron.montoPromedio)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Frecuencia:</span>
                          <div>{patron.frecuencia.toFixed(1)}/mes</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Variabilidad:</span>
                          <div>{(patron.variabilidad * 100).toFixed(0)}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No hay resultados aún. Ejecuta la prueba de patrones.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recomendaciones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-green-600" />
                Recomendaciones Personalizadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resultados.recomendaciones ? (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    {resultados.recomendaciones.recomendaciones.length} recomendaciones generadas
                  </div>
                  {resultados.recomendaciones.recomendaciones.map((rec: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{rec.titulo}</h4>
                        <div className="flex gap-1">
                          <Badge variant="outline">{rec.tipo}</Badge>
                          <Badge variant="outline">{rec.prioridad}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rec.descripcion}</p>
                      {rec.impactoEconomico > 0 && (
                        <div className="text-sm font-medium text-green-600">
                          Impacto: {formatearMoneda(rec.impactoEconomico)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No hay resultados aún. Ejecuta la prueba de recomendaciones.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alertas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Alertas Predictivas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resultados.alertas ? (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    {resultados.alertas.alertasPredictivas.length} alertas predichas
                  </div>
                  {resultados.alertas.alertasPredictivas.map((alerta: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{alerta.titulo}</h4>
                        <div className="flex gap-1">
                          <Badge variant="outline">{alerta.impacto}</Badge>
                          <Badge variant="outline">{alerta.probabilidad}%</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{alerta.descripcion}</p>
                      {alerta.recomendacionesPrevention && (
                        <div className="text-xs text-gray-500">
                          Prevención: {alerta.recomendacionesPrevention.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No hay resultados aún. Ejecuta la prueba de alertas predictivas.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reporte" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Reporte Inteligente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resultados.reporte?.reporte ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h3 className="font-medium mb-2">Resumen Ejecutivo</h3>
                    <p className="text-sm">{resultados.reporte.reporte.resumenEjecutivo}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Insights Clave</h3>
                    <ul className="space-y-1">
                      {resultados.reporte.reporte.insights.map((insight: string, index: number) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm mb-1">Score Financiero</h4>
                      <div className="text-2xl font-bold text-purple-600">
                        {resultados.reporte.reporte.scoreFinanciero}/100
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-1">Período</h4>
                      <div className="text-lg">{resultados.reporte.reporte.periodo}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No hay resultados aún. Ejecuta la prueba de reporte inteligente.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SearchX className="h-5 w-5 text-red-600" />
                Detección de Anomalías
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resultados.anomalias ? (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    {resultados.anomalias.gastosAnomalos.length} gastos anómalos detectados
                  </div>
                  <p className="text-sm">{resultados.anomalias.explicacion}</p>
                  {resultados.anomalias.gastosAnomalos.map((gasto: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">Gasto ID: {gasto.id}</span>
                        <Badge variant="outline">{gasto.nivelRiesgo}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{gasto.razonAnomalia}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No hay resultados aún. Ejecuta la prueba de detección de anomalías.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 