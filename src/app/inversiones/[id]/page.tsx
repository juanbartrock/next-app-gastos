"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { 
  ArrowLeft, TrendingUp, LineChart, Pencil, AlertTriangle, 
  BarChart4, PiggyBank, ArrowDown, ArrowUp, Clock, Loader2,
  CalendarClock, Building, AlertCircle
} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useCurrency } from "@/contexts/CurrencyContext"
import Link from "next/link"

// Tipo de datos para la inversión (simulado por ahora)
interface Inversion {
  id: string
  nombre: string
  descripcion?: string
  tipo: {
    id: string
    nombre: string
  }
  montoInicial: number
  montoActual: number
  rendimientoTotal: number
  rendimientoAnual?: number
  fechaInicio: string
  fechaVencimiento?: string
  estado: "activa" | "cerrada" | "vencida"
  plataforma?: string
  notas?: string
  createdAt: string
}

// Tipo de datos para transacciones
interface Transaccion {
  id: string
  tipo: "deposito" | "retiro" | "dividendo" | "interes" | "comision"
  monto: number
  fecha: string
  descripcion?: string
}

// Tipo de datos para historial de cotizaciones
interface Cotizacion {
  id: string
  valor: number
  fecha: string
  fuente?: string
}

export default function DetalleInversionPage() {
  // Utiliza el hook useParams para acceder a los parámetros de forma segura
  const params = useParams();
  const id = params?.id as string;
  
  const [inversion, setInversion] = useState<Inversion | null>(null)
  const [transacciones, setTransacciones] = useState<Transaccion[]>([])
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { formatMoney } = useCurrency()
  const { status } = useSession()
  const router = useRouter()

  // Redireccionar si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Función para cargar los datos de la inversión (simulada por ahora)
  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoading(true)
      try {
        // Simulamos la carga de datos - se reemplazará por llamadas a API
        setTimeout(() => {
          // Inversión de ejemplo
          setInversion({
            id: id,
            nombre: "Plazo Fijo UVA",
            descripcion: "Plazo fijo ajustado por inflación con rendimiento real superior a un plazo fijo tradicional.",
            tipo: {
              id: "2",
              nombre: "Plazo Fijo UVA"
            },
            montoInicial: 500000,
            montoActual: 530000,
            rendimientoTotal: 30000,
            rendimientoAnual: 9.5,
            fechaInicio: "2023-12-01",
            fechaVencimiento: "2024-06-01",
            estado: "activa",
            plataforma: "Banco Nación",
            notas: "Renovación automática activada. Intereses mensuales.",
            createdAt: "2023-12-01"
          })

          // Transacciones de ejemplo
          setTransacciones([
            {
              id: "t1",
              tipo: "deposito",
              monto: 500000,
              fecha: "2023-12-01",
              descripcion: "Depósito inicial"
            },
            {
              id: "t2",
              tipo: "interes",
              monto: 4000,
              fecha: "2024-01-01",
              descripcion: "Interés mensual"
            },
            {
              id: "t3",
              tipo: "interes",
              monto: 4200,
              fecha: "2024-02-01",
              descripcion: "Interés mensual"
            },
            {
              id: "t4",
              tipo: "interes",
              monto: 4300,
              fecha: "2024-03-01",
              descripcion: "Interés mensual"
            }
          ])

          // Cotizaciones de ejemplo
          setCotizaciones([
            {
              id: "c1",
              valor: 500000,
              fecha: "2023-12-01",
              fuente: "Depósito inicial"
            },
            {
              id: "c2",
              valor: 504000,
              fecha: "2024-01-01",
              fuente: "Banco Nación"
            },
            {
              id: "c3",
              valor: 515000,
              fecha: "2024-02-01",
              fuente: "Banco Nación"
            },
            {
              id: "c4",
              valor: 530000,
              fecha: "2024-03-01",
              fuente: "Banco Nación"
            }
          ])

          setIsLoading(false)
        }, 1000)
      } catch (error) {
        console.error("Error al cargar datos de la inversión:", error)
        setIsLoading(false)
      }
    }

    if (status === "authenticated") {
      cargarDatos()
    }
  }, [status, id])

  // Función para volver
  const goBack = () => {
    router.back()
  }

  // Iconos para los tipos de transacción
  const transaccionIcon = (tipo: string) => {
    switch (tipo) {
      case "deposito":
        return <ArrowDown className="h-4 w-4 text-green-500" />
      case "retiro":
        return <ArrowUp className="h-4 w-4 text-red-500" />
      case "dividendo":
        return <PiggyBank className="h-4 w-4 text-green-500" />
      case "interes":
        return <BarChart4 className="h-4 w-4 text-green-500" />
      case "comision":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  // Texto descriptivo para los tipos de transacción
  const transaccionText = (tipo: string) => {
    switch (tipo) {
      case "deposito":
        return "Depósito"
      case "retiro":
        return "Retiro"
      case "dividendo":
        return "Dividendo"
      case "interes":
        return "Interés"
      case "comision":
        return "Comisión"
      default:
        return tipo.charAt(0).toUpperCase() + tipo.slice(1)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!inversion) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-1 mr-4" 
            onClick={goBack}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver</span>
          </Button>
        </div>
        <Card className="max-w-3xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-1">Inversión no encontrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              No se encontró la inversión solicitada o no tienes acceso a ella.
            </p>
            <Button asChild>
              <Link href="/inversiones">Ver todas mis inversiones</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calcular días restantes para inversiones con vencimiento
  const diasRestantes = inversion.fechaVencimiento 
    ? Math.max(0, Math.ceil((new Date(inversion.fechaVencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : null

  // Calcular rendimiento para mostrar en porcentaje
  const rendimientoPorcentaje = ((inversion.montoActual - inversion.montoInicial) / inversion.montoInicial) * 100

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-1 mr-4" 
          onClick={goBack}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver</span>
        </Button>
        <h1 className="text-2xl font-bold flex items-center">
          <TrendingUp className="h-6 w-6 mr-2 text-primary" />
          Detalle de Inversión
        </h1>
      </div>

      {/* Encabezado y resumen */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold">{inversion.nombre}</CardTitle>
              <CardDescription className="text-sm flex items-center gap-1">
                {inversion.tipo.nombre}
                {inversion.plataforma && (
                  <>
                    <span className="mx-1">•</span>
                    <span className="flex items-center">
                      <Building className="h-3 w-3 mr-1" />
                      {inversion.plataforma}
                    </span>
                  </>
                )}
              </CardDescription>
            </div>
            <Badge 
              variant={
                inversion.estado === "activa" ? "outline" : 
                inversion.estado === "vencida" ? "secondary" : "default"
              }
              className="text-xs"
            >
              {inversion.estado.charAt(0).toUpperCase() + inversion.estado.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-muted-foreground mb-1 text-sm">Monto Inicial</p>
              <p className="text-xl font-bold">{formatMoney(inversion.montoInicial)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-sm">Valor Actual</p>
              <p className="text-xl font-bold">{formatMoney(inversion.montoActual)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-sm">Rendimiento</p>
              <div className="flex items-center">
                <p className="text-xl font-bold mr-2">{formatMoney(inversion.rendimientoTotal)}</p>
                <Badge 
                  variant={inversion.rendimientoTotal >= 0 ? "outline" : "destructive"}
                  className="flex items-center"
                >
                  {inversion.rendimientoTotal >= 0 ? "+" : ""}{rendimientoPorcentaje.toFixed(2)}%
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-sm">
                {inversion.rendimientoAnual ? "Rendimiento Anual Estimado" : "Fecha de Inicio"}
              </p>
              {inversion.rendimientoAnual ? (
                <p className="text-xl font-bold">{inversion.rendimientoAnual}%</p>
              ) : (
                <p className="text-xl font-bold">
                  {format(new Date(inversion.fechaInicio), "PPP", { locale: es })}
                </p>
              )}
            </div>
          </div>

          {/* Información de vencimiento */}
          {inversion.fechaVencimiento && (
            <div className="mt-4 p-3 bg-primary/5 rounded-lg flex items-start gap-3">
              <CalendarClock className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="font-medium mb-1">
                  Vence el {format(new Date(inversion.fechaVencimiento), "PPP", { locale: es })}
                </p>
                {diasRestantes !== null && (
                  <p className="text-sm text-muted-foreground">
                    {diasRestantes === 0 
                      ? "¡Vence hoy!" 
                      : `Faltan ${diasRestantes} ${diasRestantes === 1 ? 'día' : 'días'} para el vencimiento`}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Descripción */}
          {inversion.descripcion && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">{inversion.descripcion}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end pt-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1" asChild>
            <Link href={`/inversiones/${inversion.id}/editar`}>
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Editar Inversión
            </Link>
          </Button>
        </CardFooter>
      </Card>

      {/* Tabs con transacciones y cotizaciones */}
      <Tabs defaultValue="transacciones">
        <TabsList>
          <TabsTrigger value="transacciones">Transacciones</TabsTrigger>
          <TabsTrigger value="cotizaciones">Historial de Valor</TabsTrigger>
          <TabsTrigger value="notas">Notas</TabsTrigger>
        </TabsList>
        
        {/* Contenido: Transacciones */}
        <TabsContent value="transacciones" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Historial de Transacciones</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/inversiones/${inversion.id}/transaccion/nueva`}>
                    Registrar Transacción
                  </Link>
                </Button>
              </div>
              <CardDescription>
                Depósitos, retiros, intereses y otras operaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transacciones.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transacciones.map((transaccion) => (
                      <TableRow key={transaccion.id}>
                        <TableCell className="font-medium">
                          {format(new Date(transaccion.fecha), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {transaccionIcon(transaccion.tipo)}
                            <span>{transaccionText(transaccion.tipo)}</span>
                          </div>
                        </TableCell>
                        <TableCell>{transaccion.descripcion || "-"}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMoney(transaccion.monto)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No hay transacciones registradas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Contenido: Cotizaciones */}
        <TabsContent value="cotizaciones" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Historial de Valor</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/inversiones/${inversion.id}/cotizacion/nueva`}>
                    Actualizar Valor
                  </Link>
                </Button>
              </div>
              <CardDescription>
                Evolución del valor de tu inversión a lo largo del tiempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cotizaciones.length > 0 ? (
                <>
                  <div className="h-60 mb-6 border-b pb-4">
                    <div className="flex h-full items-center justify-center">
                      <LineChart className="h-12 w-12 text-muted-foreground" />
                      <p className="ml-2 text-muted-foreground">
                        El gráfico de evolución estará disponible pronto
                      </p>
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Fuente</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cotizaciones.map((cotizacion) => (
                        <TableRow key={cotizacion.id}>
                          <TableCell className="font-medium">
                            {format(new Date(cotizacion.fecha), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell>{cotizacion.fuente || "-"}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatMoney(cotizacion.valor)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No hay cotizaciones registradas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Contenido: Notas */}
        <TabsContent value="notas" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notas y Comentarios</CardTitle>
            </CardHeader>
            <CardContent>
              {inversion.notas ? (
                <div className="p-4 bg-muted rounded-md whitespace-pre-wrap">
                  {inversion.notas}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No hay notas registradas</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-0 justify-end">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/inversiones/${inversion.id}/editar`}>
                  Editar Notas
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Integración con el asesor financiero */}
      <Card className="mt-8 border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-lg">
            <AlertCircle className="mr-2 h-5 w-5 text-primary" />
            Análisis del Asesor Financiero
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Obtén un análisis personalizado de esta inversión y recomendaciones para optimizar su rendimiento.
          </p>
          <Button asChild>
            <Link href={`/financial-advisor?investment=${inversion.id}`}>
              Consultar sobre esta inversión
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 