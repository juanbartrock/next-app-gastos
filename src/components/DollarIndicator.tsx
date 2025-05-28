"use client"

import { useState, useEffect } from "react"
import { RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useVisibility } from "@/contexts/VisibilityContext"

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

interface FinancialData {
  dollar: DollarData;
  lastUpdated: string;
}

export function DollarIndicator() {
  const [data, setData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { valuesVisible } = useVisibility()

  const fetchDollarData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/financial-data')
      if (!response.ok) {
        throw new Error('Error al obtener datos del dólar')
      }
      
      const data = await response.json()
      setData(data)
    } catch (error) {
      console.error('Error al cargar datos del dólar:', error)
      setError('Error al cargar cotizaciones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDollarData()
    
    // Actualizar datos cada 15 minutos
    const interval = setInterval(fetchDollarData, 15 * 60 * 1000)
    
    // Limpiar intervalo al desmontar
    return () => clearInterval(interval)
  }, [])

  // Función para formatear números sin símbolo de moneda
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Función para mostrar valores ocultos
  const displayValue = (value: string) => {
    return valuesVisible ? value : "•••"
  }

  if (loading) {
    return (
      <div className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 min-w-[320px]">
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-6 w-full" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 min-w-[320px]">
        <div className="flex-1 text-center">
          <p className="text-xs text-red-500 mb-1">{error}</p>
          <button 
            onClick={fetchDollarData}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto"
          >
            <RefreshCw className="h-3 w-3" />
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 min-w-[320px]">
      <div className="flex-1">
        <div className="text-xs uppercase font-medium text-gray-500 dark:text-gray-400 tracking-wider mb-1 text-center">
          Cotizaciones
        </div>
        
        <div className="flex justify-center items-center gap-6">
          {/* Dólar Oficial */}
          <div className="text-center">
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Oficial</div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-green-600 dark:text-green-400">
                ${displayValue(formatNumber(data.dollar.oficial.compra))}
              </span>
              <span className="text-xs text-muted-foreground">|</span>
              <span className="text-sm font-bold text-red-600 dark:text-red-400">
                ${displayValue(formatNumber(data.dollar.oficial.venta))}
              </span>
            </div>
          </div>
          
          {/* Separador vertical */}
          <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
          
          {/* Dólar Blue */}
          <div className="text-center">
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Blue</div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-green-600 dark:text-green-400">
                ${displayValue(formatNumber(data.dollar.blue.compra))}
              </span>
              <span className="text-xs text-muted-foreground">|</span>
              <span className="text-sm font-bold text-red-600 dark:text-red-400">
                ${displayValue(formatNumber(data.dollar.blue.venta))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 