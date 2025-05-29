'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Loader2, 
  Brain, 
  Lightbulb, 
  PiggyBank, 
  Target,
  TrendingUp,
  AlertTriangle,
  DollarSign
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { RecomendacionIA } from '@/lib/ai/AIAnalyzer'

interface RecomendacionesIAProps {
  userId?: string
}

export function RecomendacionesIA({ userId }: RecomendacionesIAProps) {
  const [loading, setLoading] = useState(false)
  const [recomendaciones, setRecomendaciones] = useState<RecomendacionIA[]>([])
  const [ultimaActualizacion, setUltimaActualizacion] = useState<string | null>(null)
  const [resumen, setResumen] = useState<any>(null)
  const { toast } = useToast()

  const generarRecomendaciones = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai/recomendaciones')
      
      if (!response.ok) {
        throw new Error('Error al generar recomendaciones')
      }

      const data = await response.json()
      setRecomendaciones(data.recomendaciones)
      setResumen(data.metadatos.resumen)
      setUltimaActualizacion(new Date().toLocaleString('es-AR'))

      toast({
        title: "Recomendaciones Generadas",
        description: `Se generaron ${data.recomendaciones.length} recomendaciones personalizadas.`,
      })
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "No se pudieron generar las recomendaciones.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'ahorro':
        return <PiggyBank className="h-4 w-4 text-green-600" />
      case 'presupuesto':
        return <Target className="h-4 w-4 text-blue-600" />
      case 'inversion':
        return <TrendingUp className="h-4 w-4 text-purple-600" />
      case 'alerta':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      default:
        return <Lightbulb className="h-4 w-4 text-gray-600" />
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'ahorro':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-200'
      case 'presupuesto':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200'
      case 'inversion':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-200'
      case 'alerta':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-200'
    }
  }

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'critica':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-200'
      case 'alta':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-200'
      case 'media':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-200'
      case 'baja':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-200'
    }
  }

  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(monto)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          Recomendaciones Personalizadas con IA
        </CardTitle>
        <CardDescription>
          Obtén consejos financieros personalizados basados en tu comportamiento de gastos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Button 
            onClick={generarRecomendaciones}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Brain className="h-4 w-4" />
            )}
            {loading ? 'Generando...' : 'Generar Recomendaciones'}
          </Button>

          {ultimaActualizacion && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Última actualización: {ultimaActualizacion}
            </div>
          )}
        </div>

        {resumen && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-green-600">
                <PiggyBank className="h-4 w-4" />
                <span className="font-medium">{resumen.ahorro}</span>
              </div>
              <div className="text-xs text-gray-500">Ahorro</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-blue-600">
                <Target className="h-4 w-4" />
                <span className="font-medium">{resumen.presupuesto}</span>
              </div>
              <div className="text-xs text-gray-500">Presupuesto</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-purple-600">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">{resumen.inversion}</span>
              </div>
              <div className="text-xs text-gray-500">Inversión</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-orange-600">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">{formatearMoneda(resumen.impactoEconomicoTotal)}</span>
              </div>
              <div className="text-xs text-gray-500">Impacto Total</div>
            </div>
          </div>
        )}

        {recomendaciones.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-lg">Recomendaciones ({recomendaciones.length})</h4>
            
            <div className="space-y-3">
              {recomendaciones
                .sort((a, b) => {
                  const prioridadOrder = { 'critica': 4, 'alta': 3, 'media': 2, 'baja': 1 }
                  return (prioridadOrder[b.prioridad as keyof typeof prioridadOrder] || 0) - 
                         (prioridadOrder[a.prioridad as keyof typeof prioridadOrder] || 0)
                })
                .map((recomendacion, index) => (
                  <div 
                    key={index}
                    className="p-4 border rounded-lg bg-white dark:bg-gray-900"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getTipoIcon(recomendacion.tipo)}
                        <h5 className="font-medium text-base">{recomendacion.titulo}</h5>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getTipoColor(recomendacion.tipo)}`}
                        >
                          {recomendacion.tipo}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getPrioridadColor(recomendacion.prioridad)}`}
                        >
                          {recomendacion.prioridad}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                      {recomendacion.descripcion}
                    </p>

                    <div className="flex items-center justify-between text-sm">
                      {recomendacion.categoria && (
                        <span className="text-gray-600 dark:text-gray-400">
                          Categoría: {recomendacion.categoria}
                        </span>
                      )}
                      
                      {recomendacion.impactoEconomico > 0 && (
                        <div className="flex items-center gap-1 text-green-600 font-medium">
                          <DollarSign className="h-3 w-3" />
                          {formatearMoneda(recomendacion.impactoEconomico)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {recomendaciones.length === 0 && ultimaActualizacion && (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              No se generaron recomendaciones en este momento.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Asegúrate de tener suficientes datos financieros para obtener recomendaciones personalizadas.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 