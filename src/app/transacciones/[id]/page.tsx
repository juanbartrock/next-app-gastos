"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, ShoppingBag } from "lucide-react"
import { useCurrency } from "@/contexts/CurrencyContext"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Skeleton } from "@/components/ui/skeleton"

interface GastoDetalle {
  id: number
  gastoId: number
  descripcion: string
  cantidad: number
  precioUnitario: number | null
  subtotal: number
  createdAt: string
  updatedAt: string
}

interface Gasto {
  id: number
  concepto: string
  monto: number
  fecha: string
  categoria: string
  tipoTransaccion: string
  tipoMovimiento: string
  createdAt: string
  updatedAt: string
  userId: string | null
  grupoId: string | null
  categoriaId: number | null
  user?: {
    name: string | null
    email: string | null
  }
  grupo?: {
    nombre: string
  }
  detalles?: GastoDetalle[]
}

export default function DetalleGastoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { formatMoney } = useCurrency()
  const [gasto, setGasto] = useState<Gasto | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cargarGasto = async () => {
      try {
        setCargando(true)
        setError(null)
        
        const response = await fetch(`/api/gastos/${params.id}?includeDetails=true`)
        
        if (!response.ok) {
          throw new Error(`Error al cargar el gasto: ${response.statusText}`)
        }
        
        const data = await response.json()
        setGasto(data)
      } catch (error) {
        console.error("Error al cargar gasto:", error)
        setError("No se pudo cargar el detalle del gasto")
      } finally {
        setCargando(false)
      }
    }
    
    if (params.id) {
      cargarGasto()
    }
  }, [params.id])

  const formatoFecha = (fecha: string) => {
    return format(new Date(fecha), "d 'de' MMMM 'de' yyyy", { locale: es })
  }

  const tieneDetalles = gasto?.detalles && gasto.detalles.length > 0

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 py-6 md:px-6 bg-background border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push('/transacciones')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Detalle de Gasto</h1>
          </div>
        </div>
      </header>
      
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          {cargando ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-6 w-1/4" />
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{error}</p>
              </CardContent>
              <CardFooter>
                <Button onClick={() => router.push('/transacciones')}>
                  Volver a Transacciones
                </Button>
              </CardFooter>
            </Card>
          ) : gasto ? (
            <>
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle>{gasto.concepto}</CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-1 h-4 w-4" />
                    {formatoFecha(gasto.fecha)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Categoría</p>
                      <p>{gasto.categoria}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                      <p className="capitalize">{gasto.tipoMovimiento}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{formatMoney(gasto.monto)}</p>
                  </div>
                  
                  {gasto.grupo && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Grupo</p>
                      <p>{gasto.grupo.nombre}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {tieneDetalles ? (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <ShoppingBag className="mr-2 h-5 w-5" />
                        Detalle de Productos
                      </CardTitle>
                      <div className="text-sm text-muted-foreground">
                        {gasto.detalles?.length} {gasto.detalles?.length === 1 ? "producto" : "productos"}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 divide-y">
                      {gasto.detalles?.map((detalle) => (
                        <div key={detalle.id} className="pt-3 first:pt-0">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{detalle.descripcion}</span>
                            <span className="font-semibold">{formatMoney(detalle.subtotal)}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {detalle.cantidad} {detalle.cantidad > 1 ? "unidades" : "unidad"}
                            {detalle.precioUnitario ? ` a ${formatMoney(detalle.precioUnitario)}` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-muted/50">
                  <CardContent className="p-6 text-center text-muted-foreground">
                    <ShoppingBag className="mx-auto mb-3 h-10 w-10 opacity-50" />
                    <p>No hay detalles de productos para este gasto</p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </div>
      </main>
    </div>
  )
} 