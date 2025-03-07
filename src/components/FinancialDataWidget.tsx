"use client"

import { useState, useEffect } from "react"
import { ArrowUp, ArrowDown, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface DollarData {
  oficial: {
    compra: number;
    venta: number;
    variacion: number;
  };
  blue: {
    compra: number;
    venta: number;
    variacion: number;
  };
}

interface Indices {
  inflacionMensual: number;
  inflacionAnual: number;
  merval: {
    valor: number;
    variacion: number;
  };
  riesgoPais: number;
}

interface FinancialData {
  dollar: DollarData;
  indices: Indices;
  lastUpdated: string;
}

export function FinancialDataWidget() {
  const [data, setData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchFinancialData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/financial-data')
      if (!response.ok) {
        throw new Error('Error al obtener datos financieros')
      }
      
      const data = await response.json()
      setData(data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error al cargar datos financieros:', error)
      setError('No se pudieron cargar los datos financieros')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFinancialData()
    
    // Actualizar datos cada 15 minutos
    const interval = setInterval(fetchFinancialData, 15 * 60 * 1000)
    
    // Limpiar intervalo al desmontar
    return () => clearInterval(interval)
  }, [])

  // Función para formatear números
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(value)
  }
  
  // Función para formatear porcentajes
  const formatPercent = (value: number) => {
    return value.toFixed(2) + '%'
  }

  // Componente para mostrar valor con indicador de tendencia
  const ValueWithTrend = ({ value, trend }: { value: number | string, trend: number }) => (
    <div className="flex items-center">
      <span className="text-xl font-semibold mr-2">{value}</span>
      {trend !== 0 && (
        trend > 0 ? (
          <ArrowUp className="h-4 w-4 text-red-500" />
        ) : (
          <ArrowDown className="h-4 w-4 text-green-500" />
        )
      )}
    </div>
  )

  // Renderizar estado de carga
  if (loading && !data) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Cargando datos financieros...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Renderizar estado de error
  if (error) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Información Financiera
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-2">
            <p className="text-red-500 mb-2">{error}</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchFinancialData}
              className="flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Renderizar datos financieros
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium">
            Información Financiera
          </CardTitle>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Actualizado: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="dolar">
          <TabsList className="grid grid-cols-2 mb-2">
            <TabsTrigger value="dolar">Dólar</TabsTrigger>
            <TabsTrigger value="indices">Índices</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dolar" className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Dólar Oficial</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Compra</p>
                  <ValueWithTrend 
                    value={formatCurrency(data?.dollar.oficial.compra || 0)} 
                    trend={0} 
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Venta</p>
                  <ValueWithTrend 
                    value={formatCurrency(data?.dollar.oficial.venta || 0)} 
                    trend={0} 
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-1">Dólar Blue</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Compra</p>
                  <ValueWithTrend 
                    value={formatCurrency(data?.dollar.blue.compra || 0)} 
                    trend={0} 
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Venta</p>
                  <ValueWithTrend 
                    value={formatCurrency(data?.dollar.blue.venta || 0)} 
                    trend={0} 
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="indices">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Inflación Mensual</span>
                <Badge variant={data?.indices.inflacionMensual && data.indices.inflacionMensual > 3 ? "destructive" : "secondary"}>
                  {formatPercent(data?.indices.inflacionMensual || 0)}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Inflación Anual</span>
                <Badge variant="destructive">
                  {formatPercent(data?.indices.inflacionAnual || 0)}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Merval</span>
                <div className="flex items-center">
                  <span className="text-sm font-medium mr-2">
                    {new Intl.NumberFormat('es-AR').format(data?.indices.merval.valor || 0)}
                  </span>
                  <Badge variant={data?.indices.merval.variacion && data.indices.merval.variacion > 0 ? "secondary" : "destructive"}>
                    {data?.indices.merval.variacion && data.indices.merval.variacion > 0 ? '+' : ''}
                    {formatPercent(data?.indices.merval.variacion || 0)}
                  </Badge>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Riesgo País</span>
                <Badge variant={data?.indices.riesgoPais && data.indices.riesgoPais > 1000 ? "destructive" : "secondary"}>
                  {data?.indices.riesgoPais || 0} pts
                </Badge>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-2 flex justify-end">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={fetchFinancialData}
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            <span className="sr-only">Actualizar</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 