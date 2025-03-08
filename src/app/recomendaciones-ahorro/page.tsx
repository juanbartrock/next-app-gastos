"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  LightbulbIcon, 
  DollarSign, 
  ArrowRightCircle, 
  Sparkles,
  ExternalLink,
  RefreshCw,
  Database,
  Bot,
  Globe,
  ArrowRight,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCurrency } from "@/contexts/CurrencyContext"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

// Tipos para las promociones
interface ServicioAlternativo {
  id: number
  nombre: string
  descripcion?: string
  monto: number
  urlOrigen?: string
}

interface Servicio {
  id: number
  nombre: string
  monto: number
  descripcion?: string
}

interface Promocion {
  id: number
  titulo: string
  descripcion: string
  urlOrigen?: string
  descuento?: number
  porcentajeAhorro?: number
  fechaVencimiento?: string
  servicioId?: number
  servicio?: Servicio
  alternativas: ServicioAlternativo[]
}

export default function RecomendacionesAhorroPage() {
  const router = useRouter()
  const { status } = useSession()
  const [promociones, setPromociones] = useState<Promocion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isScrapingLoading, setIsScrapingLoading] = useState(false)
  const { formatMoney } = useCurrency()
  
  // Redireccionar si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])
  
  // Cargar las promociones
  useEffect(() => {
    const cargarPromociones = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/promociones")
        
        if (!response.ok) {
          throw new Error("Error al cargar las promociones")
        }
        
        const data = await response.json()
        setPromociones(data)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (status === "authenticated") {
      cargarPromociones()
    }
  }, [status])
  
  // Función para volver al dashboard
  const goBack = () => {
    router.back()
  }
  
  // Calcular el ahorro total estimado
  const calcularAhorroTotal = () => {
    return promociones.reduce((total, promocion) => {
      // Si hay un descuento directo
      if (promocion.descuento) {
        return total + promocion.descuento
      }
      
      // Si hay un porcentaje de ahorro y un servicio asociado
      if (promocion.porcentajeAhorro && promocion.servicio) {
        return total + (promocion.servicio.monto * promocion.porcentajeAhorro / 100)
      }
      
      // Si hay alternativas, usar la diferencia con el mejor precio
      if (promocion.alternativas.length > 0 && promocion.servicio) {
        const mejorAlternativa = promocion.alternativas.reduce(
          (mejor, actual) => actual.monto < mejor.monto ? actual : mejor, 
          promocion.alternativas[0]
        )
        
        return total + (promocion.servicio.monto - mejorAlternativa.monto)
      }
      
      return total
    }, 0)
  }
  
  // Función para generar nuevas recomendaciones
  const generarNuevasRecomendaciones = async () => {
    try {
      setIsGenerating(true)
      toast.info("Buscando nuevas oportunidades de ahorro... Esto puede tardar unos momentos.")
      
      const response = await fetch("/api/recomendaciones-ahorro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      })
      
      if (!response.ok) {
        throw new Error("Error al generar recomendaciones")
      }
      
      const data = await response.json()
      
      // Recargar las promociones
      const responsePromociones = await fetch("/api/promociones")
      
      if (!responsePromociones.ok) {
        throw new Error("Error al cargar las promociones")
      }
      
      const promocionesData = await responsePromociones.json()
      setPromociones(promocionesData)
      
      toast.success(`¡Se han encontrado ${data.length} oportunidades de ahorro!`)
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al buscar nuevas promociones. Por favor, intenta de nuevo más tarde.")
    } finally {
      setIsGenerating(false)
    }
  }
  
  // Función para ejecutar el scraping manualmente
  const ejecutarScraping = async () => {
    try {
      setIsScrapingLoading(true)
      toast.info("Buscando ofertas reales mediante scraping... Esto puede tardar hasta un minuto.")
      
      const response = await fetch("/api/scraping/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      })
      
      if (!response.ok) {
        throw new Error("Error al ejecutar el scraping")
      }
      
      const data = await response.json()
      
      // Recargar las promociones
      try {
        setIsLoading(true)
        const responsePromociones = await fetch("/api/promociones")
        
        if (!responsePromociones.ok) {
          throw new Error("Error al cargar las promociones")
        }
        
        const promocionesData = await responsePromociones.json()
        setPromociones(promocionesData)
      } catch (error) {
        console.error("Error al recargar promociones:", error)
      } finally {
        setIsLoading(false)
      }
      
      toast.success(`¡Se han encontrado ${data.totalPromotions || 0} ofertas mediante scraping!`)
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al ejecutar el scraping. Por favor, intenta de nuevo más tarde.")
    } finally {
      setIsScrapingLoading(false)
    }
  }
  
  // Función para determinar si una promoción es de scraping o de IA
  const isScrapedPromotion = (promocion: Promocion): boolean => {
    // Las promociones scrappeadas suelen tener URLs reales y títulos específicos
    if (promocion.urlOrigen && (
      promocion.urlOrigen.includes('netflix.com') || 
      promocion.urlOrigen.includes('spotify.com') ||
      promocion.urlOrigen.includes('claro.com') ||
      promocion.urlOrigen.includes('personal.com') ||
      promocion.urlOrigen.includes('movistar.com') ||
      promocion.urlOrigen.includes('directv.com')
    )) {
      return true;
    }
    
    // También podemos revisar el título
    if (promocion.titulo && (
      promocion.titulo.includes('Plan Netflix') ||
      promocion.titulo.includes('Plan Spotify Premium') ||
      promocion.titulo.includes('Promoción Spotify') ||
      promocion.titulo.includes('Plan Personal') ||
      promocion.titulo.includes('Promoción Personal') ||
      promocion.titulo.includes('Plan Claro') ||
      promocion.titulo.includes('Promoción Claro')
    )) {
      return true;
    }
    
    return false;
  };
  
  // Renderizar pantalla de carga
  if (status === "loading") {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-300"></div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto p-4 md:p-6 h-screen flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-1" 
          onClick={goBack}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver</span>
        </Button>
        <h1 className="text-2xl font-bold flex items-center">
          <LightbulbIcon className="h-6 w-6 mr-2 text-yellow-500" />
          Recomendaciones de Ahorro
        </h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1" 
            onClick={ejecutarScraping}
            disabled={isScrapingLoading}
          >
            <Database className={`h-4 w-4 ${isScrapingLoading ? 'animate-pulse' : ''}`} />
            <span>Scraping</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1" 
            onClick={generarNuevasRecomendaciones}
            disabled={isGenerating}
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>IA</span>
          </Button>
        </div>
      </div>
      
      {/* Tarjeta de resumen */}
      <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-blue-950 dark:to-indigo-950 shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Ahorro Potencial Estimado</h2>
              <p className="text-muted-foreground mt-1">
                Basado en tus servicios contratados y las promociones disponibles
              </p>
            </div>
            <div className="flex items-center">
              <DollarSign className="h-10 w-10 text-green-500 mr-2" />
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {isLoading ? (
                  <Skeleton className="h-9 w-32" />
                ) : (
                  formatMoney(calcularAhorroTotal())
                )}
                <span className="text-sm font-normal text-muted-foreground ml-1">/ mes</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Lista de promociones */}
      <Card className="flex-1 shadow-md">
        <CardHeader className="bg-primary/5 dark:bg-primary/10 rounded-t-lg">
          <CardTitle className="text-xl">Oportunidades de Ahorro</CardTitle>
          <CardDescription>
            Recomendaciones personalizadas basadas en tus servicios contratados
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-330px)]">
            <div className="p-4">
              {isLoading ? (
                // Esqueletos de carga
                Array(3).fill(0).map((_, index) => (
                  <Card key={index} className="mb-4 overflow-hidden">
                    <CardHeader className="pb-2">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-16 w-full mb-4" />
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : promociones.length > 0 ? (
                // Listar promociones
                promociones.map((promocion) => (
                  <Card key={promocion.id} className="mb-4 overflow-hidden border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{promocion.titulo}</CardTitle>
                          <div className="flex items-center mt-1">
                            {isScrapedPromotion(promocion) ? (
                              <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                                <Globe className="h-3 w-3" />
                                <span>Tiempo real</span>
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1 bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800">
                                <Bot className="h-3 w-3" />
                                <span>IA</span>
                              </Badge>
                            )}
                          </div>
                        </div>
                        {promocion.fechaVencimiento && (
                          <Badge variant="outline">
                            Válido hasta: {new Date(promocion.fechaVencimiento).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                      <CardDescription>
                        {promocion.servicio?.nombre && (
                          <span className="font-medium">
                            Servicio: {promocion.servicio.nombre} ({formatMoney(promocion.servicio.monto)}/mes)
                          </span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4">{promocion.descripcion}</p>
                      
                      {promocion.alternativas.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-sm font-medium mb-2 flex items-center">
                            <Sparkles className="h-3 w-3 mr-1 text-yellow-500" />
                            Alternativas disponibles:
                          </h4>
                          <div className="space-y-2">
                            {/* Mostrar servicio original primero */}
                            {promocion.servicio && (
                              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center">
                                    <span className="font-medium">Actual: {promocion.servicio.nombre}</span>
                                  </div>
                                  <span className="text-red-600 dark:text-red-400 font-bold">
                                    {formatMoney(promocion.servicio.monto)}/mes
                                  </span>
                                </div>
                                {promocion.servicio.descripcion && (
                                  <p className="text-sm text-muted-foreground mt-1">{promocion.servicio.descripcion}</p>
                                )}
                              </div>
                            )}
                            
                            {/* Flecha de comparación */}
                            <div className="flex justify-center">
                              <div className="bg-blue-100 dark:bg-blue-900/20 rounded-full p-1">
                                <ArrowRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                            </div>
                            
                            {/* Mostrar alternativas */}
                            {promocion.alternativas.map((alt) => (
                              <div key={alt.id} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-100 dark:border-green-900">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center">
                                    <Check className="h-4 w-4 text-green-600 dark:text-green-400 mr-1" />
                                    <span className="font-medium">{alt.nombre}</span>
                                  </div>
                                  <span className="text-green-600 dark:text-green-400 font-bold">
                                    {formatMoney(alt.monto)}/mes
                                  </span>
                                </div>
                                {alt.descripcion && (
                                  <p className="text-sm text-muted-foreground mt-1">{alt.descripcion}</p>
                                )}
                              </div>
                            ))}
                            
                            {/* Mostrar el ahorro */}
                            {promocion.servicio && promocion.alternativas.length > 0 && (
                              <div className="mt-2 p-3 bg-green-100 dark:bg-green-900/30 rounded-md">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium flex items-center">
                                    <Sparkles className="h-4 w-4 mr-1 text-yellow-500" />
                                    Ahorro mensual:
                                  </span>
                                  <span className="text-xl font-bold text-green-600 dark:text-green-400">
                                    {formatMoney(promocion.servicio.monto - Math.min(...promocion.alternativas.map(a => a.monto)))}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-sm text-muted-foreground">Ahorro anual:</span>
                                  <span className="font-bold text-green-600 dark:text-green-400">
                                    {formatMoney((promocion.servicio.monto - Math.min(...promocion.alternativas.map(a => a.monto))) * 12)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between bg-secondary/20">
                      <Button variant="ghost" size="sm" asChild>
                        <a 
                          href={promocion.urlOrigen || "#"} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={!promocion.urlOrigen ? "pointer-events-none opacity-50" : ""}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Ver oferta
                        </a>
                      </Button>
                      <Button variant="default" size="sm">
                        <ArrowRightCircle className="h-4 w-4 mr-1" />
                        Ver detalles
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                // Mensaje si no hay promociones
                <div className="text-center py-8">
                  <LightbulbIcon className="h-12 w-12 mx-auto text-yellow-500 opacity-70 mb-2" />
                  <h3 className="text-lg font-medium mb-1">No hay recomendaciones disponibles</h3>
                  <p className="text-muted-foreground">
                    Estamos buscando oportunidades de ahorro para tus servicios contratados. 
                    ¡Vuelve a revisar más tarde!
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>Las recomendaciones se basan en los servicios contratados y gastos recurrentes identificados.</p>
        <p>Los montos de ahorro son estimados y pueden variar según las condiciones específicas de cada servicio.</p>
        <p className="mt-2 text-xs text-gray-400">
          Utiliza <span className="font-semibold">Scraping</span> para buscar ofertas reales en sitios web o <span className="font-semibold">IA</span> para generar recomendaciones inteligentes.
        </p>
      </div>
    </div>
  )
} 