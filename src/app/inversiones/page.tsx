"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { 
  TrendingUp, Plus, ArrowUpRight, ArrowDownRight, 
  Loader2, RefreshCw, Filter, FilePieChart, ArrowLeft
} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCurrency } from "@/contexts/CurrencyContext"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

// Tipos de datos para inversiones (se usarán hasta tener la API)
interface Inversion {
  id: string
  nombre: string
  tipo: {
    nombre: string
    icono?: string
  }
  montoInicial: number
  montoActual: number
  rendimientoTotal: number
  rendimientoAnual?: number
  fechaInicio: string
  fechaVencimiento?: string
  estado: "activa" | "cerrada" | "vencida"
  plataforma?: string
}

export default function InversionesPage() {
  const [inversiones, setInversiones] = useState<Inversion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string>("todas")
  const [filtroTipo, setFiltroTipo] = useState<string>("todos")
  const { formatMoney } = useCurrency()
  const { status } = useSession()
  const router = useRouter()

  // Redireccionar si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Función para cargar inversiones
  useEffect(() => {
    const cargarInversiones = async () => {
      setIsLoading(true)
      try {
        // Llamada a la API real
        const response = await fetch('/api/inversiones')
        
        if (!response.ok) {
          throw new Error('Error al cargar inversiones')
        }
        
        const data = await response.json()
        setInversiones(data.inversiones || [])
      } catch (error) {
        console.error("Error al cargar inversiones:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (status === "authenticated") {
      cargarInversiones()
    }
  }, [status])

  // Filtrar inversiones según criterios
  const inversionesFiltradas = inversiones.filter(inversion => {
    const pasaFiltroEstado = filtroEstado === "todas" || inversion.estado === filtroEstado
    const pasaFiltroTipo = filtroTipo === "todos" || inversion.tipo.nombre === filtroTipo
    return pasaFiltroEstado && pasaFiltroTipo
  })

  // Calcular totales
  const totalInvertido = inversiones.reduce((sum, inv) => sum + inv.montoInicial, 0)
  const valorActual = inversiones.reduce((sum, inv) => sum + inv.montoActual, 0)
  const rendimientoTotal = valorActual - totalInvertido
  const rendimientoPorcentaje = totalInvertido > 0 
    ? ((valorActual - totalInvertido) / totalInvertido) * 100 
    : 0

  // Obtener tipos únicos para el filtro
  const tiposUnicos = Array.from(new Set(inversiones.map(inv => inv.tipo.nombre)))

  if (status === "loading") {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-1" 
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver al Dashboard</span>
            </Button>
          </div>
          <h1 className="text-3xl font-bold flex items-center">
            <TrendingUp className="h-7 w-7 mr-2 text-primary" />
            Mis Inversiones
          </h1>
          <p className="text-muted-foreground">
            Administra y monitorea tu cartera de inversiones
          </p>
        </div>
        <Button asChild>
          <Link href="/inversiones/nueva">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Inversión
          </Link>
        </Button>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Capital Invertido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(totalInvertido)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(valorActual)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rendimiento Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold mr-2">{formatMoney(rendimientoTotal)}</div>
              <Badge 
                variant={rendimientoTotal >= 0 ? "outline" : "destructive"}
                className="flex items-center"
              >
                {rendimientoTotal >= 0 
                  ? <ArrowUpRight className="h-3 w-3 mr-1" /> 
                  : <ArrowDownRight className="h-3 w-3 mr-1" />
                }
                {rendimientoPorcentaje.toFixed(2)}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros de inversiones */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-4">
        <div className="flex items-center">
          <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-muted-foreground font-medium mr-2">Filtrar:</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="activa">Activas</SelectItem>
              <SelectItem value="cerrada">Cerradas</SelectItem>
              <SelectItem value="vencida">Vencidas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              {tiposUnicos.map(tipo => (
                <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            size="icon"
            title="Actualizar cotizaciones"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Lista de inversiones */}
      <div className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : inversionesFiltradas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inversionesFiltradas.map((inversion) => (
                <Link href={`/inversiones/${inversion.id}`} key={inversion.id}>
                  <Card className="h-full hover:border-primary/50 transition-all">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-bold">{inversion.nombre}</CardTitle>
                        <Badge 
                          variant={
                            inversion.estado === "activa" ? "outline" : 
                            inversion.estado === "vencida" ? "secondary" : "default"
                          }
                        >
                          {inversion.estado}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center">
                        {inversion.tipo.nombre} 
                        {inversion.plataforma && <span> • {inversion.plataforma}</span>}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Monto Inicial</p>
                          <p className="font-medium">{formatMoney(inversion.montoInicial)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Valor Actual</p>
                          <p className="font-medium">{formatMoney(inversion.montoActual)}</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <div className="w-full flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <Badge 
                            variant={inversion.rendimientoTotal >= 0 ? "outline" : "destructive"}
                            className="flex items-center"
                          >
                            {inversion.rendimientoTotal >= 0 
                              ? <ArrowUpRight className="h-3 w-3 mr-1" /> 
                              : <ArrowDownRight className="h-3 w-3 mr-1" />
                            }
                            {((inversion.rendimientoTotal / inversion.montoInicial) * 100).toFixed(2)}%
                          </Badge>
                          
                          {inversion.rendimientoAnual && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({inversion.rendimientoAnual}% anual)
                            </span>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" className="ml-auto">
                          Ver detalles
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="bg-muted/40">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <FilePieChart className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-1">Sin inversiones que mostrar</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {inversiones.length === 0
                    ? "Aún no has registrado ninguna inversión."
                    : "No hay inversiones que coincidan con los filtros seleccionados."
                  }
                </p>
                {inversiones.length === 0 && (
                  <Button asChild>
                    <Link href="/inversiones/nueva">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar primera inversión
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>


    </div>
  )
} 