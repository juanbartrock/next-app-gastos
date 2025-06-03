"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

// Función super simple para renderizar markdown básico - GARANTIZADO QUE FUNCIONA
function renderMarkdown(text: string): JSX.Element {
  const parts = text.split('\n');
  
  return (
    <div className="space-y-2">
      {parts.map((line, index) => {
        const trimmedLine = line.trim();
        
        // Headers
        if (trimmedLine.startsWith('### ')) {
          return (
            <h3 key={index} className="text-base font-semibold mb-1 mt-3 text-current">
              {trimmedLine.replace('### ', '')}
            </h3>
          );
        }
        if (trimmedLine.startsWith('## ')) {
          return (
            <h2 key={index} className="text-lg font-bold mb-2 mt-3 text-current">
              {trimmedLine.replace('## ', '')}
            </h2>
          );
        }
        if (trimmedLine.startsWith('# ')) {
          return (
            <h1 key={index} className="text-xl font-bold mb-2 mt-2 text-current">
              {trimmedLine.replace('# ', '')}
            </h1>
          );
        }
        
        // Lista con viñetas
        if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
          return (
            <div key={index} className="flex items-start ml-3 mb-1">
              <span className="text-current mr-2 mt-0.5">•</span>
              <span className="text-current">{processSimpleBold(trimmedLine.slice(2))}</span>
            </div>
          );
        }
        
        // Lista numerada
        if (trimmedLine.match(/^\d+\. /)) {
          const number = trimmedLine.match(/^(\d+)\./)?.[1] || '1';
          const content = trimmedLine.replace(/^\d+\. /, '');
          return (
            <div key={index} className="flex items-start ml-3 mb-1">
              <span className="text-current mr-2 font-medium">{number}.</span>
              <span className="text-current">{processSimpleBold(content)}</span>
            </div>
          );
        }
        
        // Línea vacía
        if (!trimmedLine) {
          return <div key={index} className="h-1"></div>;
        }
        
        // Párrafo normal
        return (
          <p key={index} className="mb-1 text-current leading-relaxed">
            {processSimpleBold(trimmedLine)}
          </p>
        );
      })}
    </div>
  );
}

// Función súper simple para procesar negrita
function processSimpleBold(text: string): JSX.Element {
  // Dividir el texto por patrones de negrita **texto**
  const regex = /(\*\*[^*]+\*\*)/g;
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          // Es texto en negrita
          const boldText = part.slice(2, -2);
          return (
            <strong key={i} className="font-bold text-current">
              {boldText}
            </strong>
          );
        } else {
          // Es texto normal
          return (
            <span key={i} className="text-current">
              {part}
            </span>
          );
        }
      })}
    </>
  );
}

// Constantes para el caché
const CACHE_KEY_PREFIX = "financial_summary_cache"
const CACHE_DURATION_HOURS = 24

// Funciones para manejo del caché
const getCacheKey = (context: string) => `${CACHE_KEY_PREFIX}_${context}`

const getCachedData = (context: string) => {
  try {
    const cacheKey = getCacheKey(context)
    const cached = localStorage.getItem(cacheKey)
    if (!cached) return null
    
    const { data, timestamp } = JSON.parse(cached)
    const now = new Date().getTime()
    const cacheTime = new Date(timestamp).getTime()
    const hoursDiff = (now - cacheTime) / (1000 * 60 * 60)
    
    // Si han pasado más de 24 horas, el caché está vencido
    if (hoursDiff > CACHE_DURATION_HOURS) {
      localStorage.removeItem(cacheKey)
      return null
    }
    
    return { data, timestamp: new Date(timestamp) }
  } catch (error) {
    console.error('Error al leer caché:', error)
    return null
  }
}

const setCachedData = (context: string, data: string) => {
  try {
    const cacheKey = getCacheKey(context)
    const cacheData = {
      data,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem(cacheKey, JSON.stringify(cacheData))
  } catch (error) {
    console.error('Error al guardar caché:', error)
  }
}

const isDataFresh = (timestamp: Date): boolean => {
  const now = new Date().getTime()
  const cacheTime = timestamp.getTime()
  const hoursDiff = (now - cacheTime) / (1000 * 60 * 60)
  return hoursDiff < CACHE_DURATION_HOURS
}

interface FinancialSummaryProps {
  className?: string
  context?: "dashboard" | "recurrentes" | "general"
}

export function FinancialSummary({ className, context = "dashboard" }: FinancialSummaryProps) {
  const [summary, setSummary] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isFromCache, setIsFromCache] = useState(false)

  const fetchSummary = async (forceRefresh = false) => {
    setLoading(true)
    setError(null)
    
    try {
      // Verificar caché primero (solo si no es un refresh forzado)
      if (!forceRefresh) {
        const cached = getCachedData(context)
        if (cached) {
          setSummary(cached.data)
          setLastUpdated(cached.timestamp)
          setIsFromCache(true)
          setLoading(false)
          return
        }
      }
      
      // Si no hay caché o es un refresh forzado, hacer petición a la API
      setIsFromCache(false)
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
          ],
          context: context,
          isResumenRequest: true  // Flag para indicar que es una solicitud de resumen financiero
        })
      })

      if (!response.ok) {
        throw new Error("Error al obtener el resumen financiero")
      }

      const data = await response.json()
      
      // Verificar si OpenAI está configurado
      let responseContent = data.response;
      if (data.debug && !data.debug.openaiConfigured) {
        responseContent += "\n\n---\n\n*Nota: El asistente IA avanzado no está configurado. Este análisis se basa en respuestas predefinidas usando tus datos financieros reales.*";
      }
      
      // Guardar en caché
      setCachedData(context, responseContent)
      
      setSummary(responseContent)
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Error:", error)
      setError("No se pudo cargar el resumen financiero. Intente nuevamente más tarde.")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchSummary(true) // Forzar actualización
  }

  useEffect(() => {
    fetchSummary(false) // Cargar desde caché si está disponible
  }, [context])

  return (
    <Card className={cn("w-full h-full border-0 shadow-none", className)}>
      <CardHeader className="pb-2 px-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">
            Análisis Financiero Personalizado
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <div className="text-xs text-muted-foreground text-right">
                <div>
                  {isFromCache ? "Desde caché:" : "Actualizado:"} {lastUpdated.toLocaleTimeString()}
                </div>
                {isFromCache && (
                  <div className="text-xs">
                    {isDataFresh(lastUpdated) ? (
                      `Válido por ${Math.ceil(CACHE_DURATION_HOURS - (new Date().getTime() - lastUpdated.getTime()) / (1000 * 60 * 60))}h más`
                    ) : (
                      "Caché vencido"
                    )}
                  </div>
                )}
              </div>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={handleRefresh} 
              disabled={loading}
              title={isFromCache ? "Actualizar análisis (forzar nueva consulta a IA)" : "Actualizar análisis"}
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
              onClick={handleRefresh}
              className="flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        ) : (
          <>
            {isFromCache && (
              <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  ℹ️ Análisis en caché (actualizado hace {Math.floor((new Date().getTime() - lastUpdated!.getTime()) / (1000 * 60 * 60))}h). 
                  Presiona el botón de actualizar para obtener un análisis nuevo.
                </p>
              </div>
            )}
            <div className="text-sm">
              {renderMarkdown(summary)}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
} 