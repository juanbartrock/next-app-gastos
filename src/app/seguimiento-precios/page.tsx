"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowUpDown, ExternalLink, RefreshCcw, Search, ShoppingBag, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useCurrency } from "@/contexts/CurrencyContext"
import { toast } from "sonner"
import Link from "next/link"

interface Producto {
  id: number
  descripcion: string
  precioActual: number
  gastoId: number
  fecha: string
}

interface ResultadoBusqueda {
  foundBetterPrice: boolean
  bestPrice?: number
  saving?: number
  savingPercentage?: number
  store?: string
  url?: string
  productCategory: string
  allResults: {
    service: string
    results: {
      productName: string
      price: number
      store: string
      url: string
      imageUrl?: string
      availability?: boolean
      timestamp: Date
    }[]
  }[]
}

interface Oferta {
  producto: Producto
  resultado: ResultadoBusqueda
}

interface ResultadoSeguimiento {
  results: Oferta[];
  stats: {
    totalProductos: number;
    busquedasRealizadas: number;
    alternativasUsadas: number;
    resultadosEncontrados: number;
    mejoresPrecios: number;
    errores: number;
    totalTime: number;
  };
}

export default function SeguimientoPreciosPage() {
  const [loading, setLoading] = useState(false)
  const [resultados, setResultados] = useState<ResultadoSeguimiento | null>(null)
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null)
  const { formatMoney } = useCurrency()

  const buscarOfertas = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/price-search", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Error al buscar ofertas")
      }

      const data = await response.json()
      setResultados(data)
      
      if (data.stats.mejoresPrecios > 0) {
        toast.success(`¡Se encontraron ${data.stats.mejoresPrecios} mejores precios!`)
      } else {
        toast.info("No se encontraron mejores precios para tus productos")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al buscar ofertas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    buscarOfertas()
  }, [])

  const toggleProductExpand = (productId: number) => {
    if (expandedProduct === productId) {
      setExpandedProduct(null)
    } else {
      setExpandedProduct(productId)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Seguimiento de Precios</h1>
          </div>
          <div>
            <Button 
              onClick={buscarOfertas} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCcw className="h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Buscar Ofertas
                </>
              )}
            </Button>
          </div>
        </div>

        {loading && !resultados ? (
          <Card>
            <CardContent className="py-10">
              <div className="flex flex-col items-center justify-center">
                <RefreshCcw className="h-8 w-8 animate-spin mb-4 text-primary" />
                <p className="text-lg">Buscando mejores precios...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Estamos consultando múltiples sitios para encontrar las mejores ofertas
                </p>
              </div>
            </CardContent>
          </Card>
        ) : resultados ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Productos en seguimiento</p>
                    <p className="text-2xl font-bold">{resultados.stats.totalProductos}</p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Ofertas encontradas</p>
                    <p className="text-2xl font-bold">{resultados.stats.mejoresPrecios}</p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Ahorro potencial</p>
                    <p className="text-2xl font-bold">
                      {formatMoney(
                        resultados.results
                          .filter(oferta => oferta.resultado.foundBetterPrice)
                          .reduce(
                            (total, oferta) => total + (oferta.resultado.saving || 0), 
                            0
                          )
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {resultados.results.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Mejores Ofertas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {resultados.results
                      .filter(oferta => oferta.resultado.foundBetterPrice)
                      .map((oferta) => (
                        <div key={oferta.producto.id} className="border rounded-lg overflow-hidden">
                          <div 
                            className="p-4 flex justify-between items-center cursor-pointer hover:bg-muted/30"
                            onClick={() => toggleProductExpand(oferta.producto.id)}
                          >
                            <div>
                              <div className="font-medium">{oferta.producto.descripcion}</div>
                              <div className="text-sm text-muted-foreground">
                                Comprado el {format(new Date(oferta.producto.fecha), "d 'de' MMMM 'de' yyyy", { locale: es })}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-sm text-muted-foreground">Precio actual</div>
                                <div className="font-medium">{formatMoney(oferta.producto.precioActual)}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-muted-foreground">Mejor precio</div>
                                <div className="font-medium text-green-600 dark:text-green-400">
                                  {formatMoney(oferta.resultado.bestPrice || 0)}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-muted-foreground">Ahorro</div>
                                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                  {oferta.resultado.savingPercentage}% ({formatMoney(oferta.resultado.saving || 0)})
                                </Badge>
                              </div>
                              <ArrowUpDown className={`h-4 w-4 transition-transform ${expandedProduct === oferta.producto.id ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                          
                          {expandedProduct === oferta.producto.id && (
                            <div className="p-4 border-t bg-muted/10">
                              <div className="mb-3">
                                <div className="text-sm font-medium mb-2">Mejor oferta encontrada:</div>
                                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                                  <div>
                                    <div className="font-medium">{oferta.resultado.store}</div>
                                    <div className="text-sm text-muted-foreground">
                                      Precio: {formatMoney(oferta.resultado.bestPrice || 0)}
                                    </div>
                                  </div>
                                  <Button variant="outline" size="sm" asChild>
                                    <a href={oferta.resultado.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                      <ExternalLink className="h-3 w-3" />
                                      Ver oferta
                                    </a>
                                  </Button>
                                </div>
                              </div>
                              
                              <Separator className="my-3" />
                              
                              <div>
                                <div className="text-sm font-medium mb-2">Todas las ofertas encontradas:</div>
                                <div className="space-y-2">
                                  {oferta.resultado.allResults.flatMap(serviceResult => 
                                    serviceResult.results.slice(0, 3).map((result, idx) => (
                                      <div key={`${serviceResult.service}-${idx}`} className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/20">
                                        <div>
                                          <div className="text-sm">{result.store}</div>
                                          <div className="text-xs text-muted-foreground">
                                            vía {serviceResult.service}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className="font-medium">{formatMoney(result.price)}</span>
                                          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                            <a href={result.url} target="_blank" rel="noopener noreferrer">
                                              <ExternalLink className="h-3 w-3" />
                                            </a>
                                          </Button>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-10">
                  <div className="flex flex-col items-center justify-center">
                    <ShoppingBag className="h-8 w-8 mb-4 text-muted-foreground" />
                    <p className="text-lg">No se encontraron mejores precios para tus productos</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Seguiremos buscando regularmente para encontrar buenas ofertas
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="py-10">
              <div className="flex flex-col items-center justify-center">
                <ShoppingBag className="h-8 w-8 mb-4 text-muted-foreground" />
                <p className="text-lg">No hay productos marcados para seguimiento de precios</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Marca productos para seguimiento durante el ingreso de gastos
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 