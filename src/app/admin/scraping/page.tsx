"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Check, 
  X, 
  AlertTriangle, 
  RefreshCw, 
  Play, 
  Clock, 
  BarChart
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

// Interfaces
interface ScraperStatus {
  servicio: string;
  disponible: boolean;
}

interface ScraperHistorial {
  servicio: string;
  ultimaEjecucion: string;
  totalPromociones: number;
}

interface ScraperData {
  servicios: ScraperStatus[];
  historial: ScraperHistorial[];
}

export default function ScrapingAdminPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [scraperData, setScraperData] = useState<ScraperData | null>(null)
  const [loading, setLoading] = useState(true)
  const [ejecutando, setEjecutando] = useState<string | null>(null)
  
  // Función para cargar el estado de los scrapers
  const cargarEstadoScrapers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/scraping/status")
      
      if (!response.ok) {
        throw new Error("Error al obtener estado de scrapers")
      }
      
      const data = await response.json()
      setScraperData(data)
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al cargar estado de scrapers")
    } finally {
      setLoading(false)
    }
  }
  
  // Cargar estado al montar el componente
  useEffect(() => {
    if (status === "authenticated") {
      cargarEstadoScrapers()
    } else if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])
  
  // Función para ejecutar un scraper específico
  const ejecutarScraper = async (servicio: string) => {
    try {
      setEjecutando(servicio)
      toast.info(`Ejecutando scraper para ${servicio}...`)
      
      const response = await fetch("/api/scraping/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ serviceName: servicio })
      })
      
      if (!response.ok) {
        throw new Error(`Error al ejecutar scraper de ${servicio}`)
      }
      
      const data = await response.json()
      
      toast.success(`Scraper de ${servicio} completado. Se encontraron ${data.promotionsFound || 0} promociones.`)
      
      // Recargar estado de scrapers
      await cargarEstadoScrapers()
    } catch (error) {
      console.error("Error:", error)
      toast.error(`Error al ejecutar scraper de ${servicio}`)
    } finally {
      setEjecutando(null)
    }
  }
  
  // Función para ejecutar todos los scrapers
  const ejecutarTodosScrapers = async () => {
    try {
      setEjecutando("todos")
      toast.info("Ejecutando todos los scrapers...")
      
      const response = await fetch("/api/scraping/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      })
      
      if (!response.ok) {
        throw new Error("Error al ejecutar scrapers")
      }
      
      const data = await response.json()
      
      toast.success(`Scrapers completados. Se encontraron ${data.totalPromotions || 0} promociones en total.`)
      
      // Recargar estado de scrapers
      await cargarEstadoScrapers()
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al ejecutar scrapers")
    } finally {
      setEjecutando(null)
    }
  }
  
  // Función para formatear fecha
  const formatearFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr)
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(fecha)
  }
  
  // Función para obtener el color del servicio
  const obtenerColorServicio = (servicio: string) => {
    const colores: Record<string, string> = {
      netflix: 'bg-red-500',
      spotify: 'bg-green-500',
      personal: 'bg-blue-500',
      claro: 'bg-yellow-500',
      movistar: 'bg-blue-400',
      directv: 'bg-blue-600'
    }
    
    return colores[servicio] || 'bg-gray-500'
  }
  
  // Verificar autenticación
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" onClick={() => router.push("/admin")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Admin
        </Button>
        <h1 className="text-2xl font-bold">Administración de Scrapers</h1>
        <Button 
          variant="outline" 
          onClick={cargarEstadoScrapers} 
          disabled={loading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>
      
      <Tabs defaultValue="estado">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="estado" className="flex-1">Estado Actual</TabsTrigger>
          <TabsTrigger value="historial" className="flex-1">Historial</TabsTrigger>
          <TabsTrigger value="ejecutar" className="flex-1">Ejecutar</TabsTrigger>
        </TabsList>
        
        <TabsContent value="estado">
          <Card>
            <CardHeader>
              <CardTitle>Estado de los Scrapers</CardTitle>
              <CardDescription>
                Estado actual de disponibilidad de cada servicio para scraping
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {scraperData?.servicios.map((item) => (
                    <Card key={item.servicio} className="overflow-hidden">
                      <div className={`h-1 ${obtenerColorServicio(item.servicio)}`}></div>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                          <div className="font-semibold capitalize">{item.servicio}</div>
                          {item.disponible ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <Check className="h-3.5 w-3.5 mr-1" />
                              Disponible
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              <X className="h-3.5 w-3.5 mr-1" />
                              No disponible
                            </Badge>
                          )}
                        </div>
                        
                        {/* Encontrar historial para este servicio */}
                        {scraperData?.historial.find(h => h.servicio === item.servicio) && (
                          <div className="mt-4 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Clock className="h-3.5 w-3.5 mr-1" />
                              Última ejecución: {formatearFecha(
                                scraperData.historial.find(h => h.servicio === item.servicio)?.ultimaEjecucion || ''
                              )}
                            </div>
                            <div className="flex items-center mt-1">
                              <BarChart className="h-3.5 w-3.5 mr-1" />
                              Promociones: {
                                scraperData.historial.find(h => h.servicio === item.servicio)?.totalPromociones || 0
                              }
                            </div>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="bg-muted/50">
                        <Button 
                          size="sm" 
                          className="w-full" 
                          disabled={!item.disponible || ejecutando !== null} 
                          onClick={() => ejecutarScraper(item.servicio)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Ejecutar
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="historial">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Ejecuciones</CardTitle>
              <CardDescription>
                Registro de las últimas ejecuciones de scrapers y sus resultados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : scraperData?.historial && scraperData.historial.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[150px]">Servicio</TableHead>
                        <TableHead>Última ejecución</TableHead>
                        <TableHead className="text-right">Promociones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scraperData.historial.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-2 ${obtenerColorServicio(item.servicio)}`}></div>
                              <span className="font-medium capitalize">{item.servicio}</span>
                            </div>
                          </TableCell>
                          <TableCell>{formatearFecha(item.ultimaEjecucion)}</TableCell>
                          <TableCell className="text-right">{item.totalPromociones}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500 opacity-70" />
                  <p>No hay historial de ejecuciones disponible.</p>
                  <p className="text-sm">Ejecuta un scraper para ver resultados aquí.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ejecutar">
          <Card>
            <CardHeader>
              <CardTitle>Ejecutar Scrapers</CardTitle>
              <CardDescription>
                Ejecuta los scrapers manualmente para actualizar las recomendaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-900/50 mb-4">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Advertencia:</p>
                      <p className="text-sm mt-1">
                        La ejecución de scrapers puede tardar varios minutos dependiendo del número de servicios y su complejidad.
                        No cierres esta ventana durante el proceso.
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  className="w-full h-16 text-lg"
                  disabled={ejecutando !== null}
                  onClick={ejecutarTodosScrapers}
                >
                  {ejecutando === "todos" ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Ejecutando todos los scrapers...
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Ejecutar todos los scrapers
                    </>
                  )}
                </Button>
                
                <Separator className="my-6" />
                
                <h3 className="text-lg font-medium mb-4">Ejecutar un scraper específico</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scraperData?.servicios.map((item) => (
                    <Button 
                      key={item.servicio}
                      variant="outline"
                      className="h-12 justify-start"
                      disabled={!item.disponible || ejecutando !== null} 
                      onClick={() => ejecutarScraper(item.servicio)}
                    >
                      {ejecutando === item.servicio ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${obtenerColorServicio(item.servicio)}`}></div>
                        <span className="capitalize">{item.servicio}</span>
                      </div>
                    </Button>
                  ))}
                </div>
                
                {ejecutando && (
                  <div className="mt-6">
                    <p className="text-sm text-center mb-2">
                      Ejecutando scraper{ejecutando === "todos" ? "s" : ` de ${ejecutando}`}...
                    </p>
                    <Progress value={50} className="h-2" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 