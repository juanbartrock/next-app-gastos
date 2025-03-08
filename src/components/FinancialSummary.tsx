"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface FinancialSummaryProps {
  className?: string
}

export function FinancialSummary({ className }: FinancialSummaryProps) {
  const [summary, setSummary] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchSummary = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Enviar una consulta predefinida al asistente financiero
      const response = await fetch("/api/financial-advisor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: "Por favor, dame un resumen conciso de mi situación financiera actual, incluyendo mis gastos recurrentes y los servicios contratados. NO USES FRASES INTRODUCTORIAS NI DE CORTESÍA como 'Claro, basándome en tus datos financieros...'. Comienza directamente con el resumen estructurado usando los subtítulos (Resumen General, Gastos Principales, etc.). Destaca las áreas de mayor gasto y ofrece recomendaciones concretas para optimizar mi economía."
            }
          ]
        })
      })

      if (!response.ok) {
        throw new Error("Error al obtener el resumen financiero")
      }

      const data = await response.json()
      setSummary(data.response)
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Error:", error)
      setError("No se pudo cargar el resumen financiero. Intente nuevamente más tarde.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [])

  return (
    <Card className={cn("w-full h-full border-0 shadow-none", className)}>
      <CardHeader className="pb-2 px-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">
            Análisis Financiero Personalizado
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Actualizado: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={fetchSummary} 
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0 pt-0">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-4">
            <p className="text-red-500 mb-2">{error}</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchSummary}
              className="flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        ) : (
          <div className="text-sm whitespace-pre-wrap">
            {summary}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 