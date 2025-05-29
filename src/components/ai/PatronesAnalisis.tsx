'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, TrendingUp, TrendingDown, Minus, Brain, BarChart3 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { PatronGasto } from '@/lib/ai/AIAnalyzer'

interface PatronesAnalisisProps {
  userId?: string
}

export function PatronesAnalisis({ userId }: PatronesAnalisisProps) {
  const [loading, setLoading] = useState(false)
  const [patrones, setPatrones] = useState<PatronGasto[]>([])
  const [mesesAnalisis, setMesesAnalisis] = useState(6)
  const [ultimoAnalisis, setUltimoAnalisis] = useState<string | null>(null)
  const { toast } = useToast()

  const analizarPatrones = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/ai/analizar-patrones?meses=${mesesAnalisis}`)
      
      if (!response.ok) {
        throw new Error('Error al analizar patrones')
      }

      const data = await response.json()
      setPatrones(data.patrones)
      setUltimoAnalisis(new Date().toLocaleString('es-AR'))

      toast({
        title: "Análisis Completado",
        description: `Se detectaron ${data.patrones.length} patrones de gasto en los últimos ${mesesAnalisis} meses.`,
      })
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "No se pudo completar el análisis de patrones.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getTendenciaIcon = (tendencia: string) => {
    switch (tendencia) {
      case 'ascendente':
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'descendente':
        return <TrendingDown className="h-4 w-4 text-green-500" />
      case 'estable':
        return <Minus className="h-4 w-4 text-blue-500" />
      default:
        return <BarChart3 className="h-4 w-4 text-gray-500" />
    }
  }

  const getTendenciaColor = (tendencia: string) => {
    switch (tendencia) {
      case 'ascendente':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-200'
      case 'descendente':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-200'
      case 'estable':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-200'
    }
  }

  const getVariabilidadColor = (variabilidad: number) => {
    if (variabilidad < 0.3) return 'text-green-600 dark:text-green-400'
    if (variabilidad < 0.6) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
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
          Análisis de Patrones de Gastos con IA
        </CardTitle>
        <CardDescription>
          Identifica tendencias y comportamientos en tus gastos usando inteligencia artificial
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Período de análisis:</label>
            <select 
              value={mesesAnalisis}
              onChange={(e) => setMesesAnalisis(parseInt(e.target.value))}
              className="px-3 py-1 border rounded-md text-sm"
              disabled={loading}
            >
              <option value={3}>3 meses</option>
              <option value={6}>6 meses</option>
              <option value={12}>12 meses</option>
              <option value={24}>24 meses</option>
            </select>
          </div>
          
          <Button 
            onClick={analizarPatrones}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Brain className="h-4 w-4" />
            )}
            {loading ? 'Analizando...' : 'Analizar Patrones'}
          </Button>
        </div>

        {ultimoAnalisis && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Último análisis: {ultimoAnalisis}
          </div>
        )}

        {patrones.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-lg">Patrones Detectados ({patrones.length})</h4>
            
            <div className="grid gap-3">
              {patrones.map((patron, index) => (
                <div 
                  key={index}
                  className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-base">{patron.categoria}</h5>
                    <div className="flex items-center gap-2">
                      {getTendenciaIcon(patron.tendencia)}
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getTendenciaColor(patron.tendencia)}`}
                      >
                        {patron.tendencia}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Promedio mensual:</span>
                      <div className="font-medium">{formatearMoneda(patron.montoPromedio)}</div>
                    </div>
                    
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Frecuencia:</span>
                      <div className="font-medium">{patron.frecuencia.toFixed(1)} gastos/mes</div>
                    </div>
                    
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Variabilidad:</span>
                      <div className={`font-medium ${getVariabilidadColor(patron.variabilidad)}`}>
                        {(patron.variabilidad * 100).toFixed(0)}%
                        {patron.variabilidad < 0.3 && ' (Estable)'}
                        {patron.variabilidad >= 0.3 && patron.variabilidad < 0.6 && ' (Variable)'}
                        {patron.variabilidad >= 0.6 && ' (Muy variable)'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {patrones.length === 0 && ultimoAnalisis && (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              No se detectaron patrones significativos en el período seleccionado.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Intenta con un período más amplio o asegúrate de tener suficientes transacciones.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 