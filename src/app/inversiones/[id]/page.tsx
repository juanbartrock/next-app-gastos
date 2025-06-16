"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { 
  ArrowLeft, TrendingUp, Plus, Minus, Loader2, PiggyBank,
  CalendarClock, Building, DollarSign, AlertCircle, Check
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCurrency } from "@/contexts/CurrencyContext"
import { toast } from "sonner"
import Link from "next/link"

// Tipos de datos reales
interface Inversion {
  id: string
  nombre: string
  descripcion?: string
  tipo: {
    id: string
    nombre: string
    descripcion?: string
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

interface TransaccionInversion {
  id: string
  tipo: string
  monto: number
  fecha: string
  descripcion?: string
}

export default function DetalleInversionPage() {
  const params = useParams();
  const id = params?.id as string;
  
  const [inversion, setInversion] = useState<Inversion | null>(null)
  const [transacciones, setTransacciones] = useState<TransaccionInversion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingAction, setIsLoadingAction] = useState(false)
  
  // Estados para modales
  const [modalAporte, setModalAporte] = useState(false)
  const [modalRetiro, setModalRetiro] = useState(false)
  
  // Estados para formularios
  const [montoAporte, setMontoAporte] = useState("")
  const [fechaAporte, setFechaAporte] = useState("")
  const [notasAporte, setNotasAporte] = useState("")
  
  const [montoRetiro, setMontoRetiro] = useState("")
  const [tipoRetiro, setTipoRetiro] = useState<'parcial' | 'total'>('parcial')
  const [fechaRetiro, setFechaRetiro] = useState("")
  const [notasRetiro, setNotasRetiro] = useState("")
  
  const { formatMoney } = useCurrency()
  const { status } = useSession()
  const router = useRouter()

  // Redireccionar si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Cargar datos reales de la inversión
  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoading(true)
      try {
        // Cargar inversión
        const inversionResponse = await fetch(`/api/inversiones`)
        if (!inversionResponse.ok) throw new Error('Error al cargar inversión')
        
        const inversionesData = await inversionResponse.json()
        const inversionEncontrada = inversionesData.inversiones?.find((inv: any) => inv.id === id)
        
        if (!inversionEncontrada) {
          toast.error("Inversión no encontrada")
          router.push('/inversiones')
          return
        }
        
        setInversion(inversionEncontrada)

        // Cargar transacciones de la inversión
        const transaccionesResponse = await fetch(`/api/inversiones/${id}/transacciones`)
        if (transaccionesResponse.ok) {
          const transaccionesData = await transaccionesResponse.json()
          setTransacciones(transaccionesData.transacciones || [])
        }
        
      } catch (error) {
        console.error("Error al cargar datos:", error)
        toast.error("Error al cargar los datos de la inversión")
      } finally {
        setIsLoading(false)
      }
    }

    if (status === "authenticated" && id) {
      cargarDatos()
    }
  }, [status, id, router])

  // Función para aportar dinero
  const handleAporte = async () => {
    if (!montoAporte || parseFloat(montoAporte) <= 0) {
      toast.error("Ingrese un monto válido")
      return
    }

    setIsLoadingAction(true)
    try {
      const response = await fetch(`/api/inversiones/${id}/aportar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          montoAporte: parseFloat(montoAporte),
          fecha: fechaAporte || undefined,
          notas: notasAporte || undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al realizar aporte')
      }

      const result = await response.json()
      toast.success(result.message)
      
      // Actualizar datos
      setInversion(result.inversion)
      setTransacciones(prev => [result.transaccion, ...prev])
      
      // Limpiar formulario
      setMontoAporte("")
      setFechaAporte("")
      setNotasAporte("")
      setModalAporte(false)
      
    } catch (error: any) {
      console.error("Error en aporte:", error)
      toast.error(error.message || "Error al realizar el aporte")
    } finally {
      setIsLoadingAction(false)
    }
  }

  // Función para retirar dinero
  const handleRetiro = async () => {
    if (!montoRetiro || parseFloat(montoRetiro) <= 0) {
      toast.error("Ingrese un monto válido")
      return
    }

    if (inversion && parseFloat(montoRetiro) > inversion.montoActual) {
      toast.error(`Monto excede el disponible: ${formatMoney(inversion.montoActual)}`)
      return
    }

    setIsLoadingAction(true)
    try {
      const response = await fetch(`/api/inversiones/${id}/retirar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          montoRetiro: parseFloat(montoRetiro),
          tipoRetiro,
          fecha: fechaRetiro || undefined,
          notas: notasRetiro || undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al realizar retiro')
      }

      const result = await response.json()
      toast.success(result.message)
      
      // Actualizar datos
      setInversion(result.inversion)
      setTransacciones(prev => [result.transaccion, ...prev])
      
      // Limpiar formulario
      setMontoRetiro("")
      setFechaRetiro("")
      setNotasRetiro("")
      setModalRetiro(false)
      
    } catch (error: any) {
      console.error("Error en retiro:", error)
      toast.error(error.message || "Error al realizar el retiro")
    } finally {
      setIsLoadingAction(false)
    }
  }

  const goBack = () => {
    router.back()
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
      <div className="container mx-auto p-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Inversión no encontrada</h1>
          <Button onClick={goBack}>Volver</Button>
        </div>
      </div>
    )
  }

  const rendimientoPorcentaje = inversion.montoInicial > 0 
    ? ((inversion.montoActual - inversion.montoInicial) / inversion.montoInicial) * 100 
    : 0

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={goBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{inversion.nombre}</h1>
          <p className="text-muted-foreground">{inversion.tipo.nombre}</p>
        </div>
        <div className="ml-auto">
          <Badge variant={inversion.estado === 'activa' ? 'default' : 'secondary'}>
            {inversion.estado}
          </Badge>
        </div>
      </div>

      {/* Cards de información principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monto Actual</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(inversion.montoActual)}</div>
            <p className="text-xs text-muted-foreground">
              Inversión inicial: {formatMoney(inversion.montoInicial)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rendimiento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMoney(inversion.rendimientoTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              {rendimientoPorcentaje >= 0 ? '+' : ''}{rendimientoPorcentaje.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rendimiento Anual</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inversion.rendimientoAnual ? `${inversion.rendimientoAnual}%` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Esperado anual
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Botones de acción */}
      {inversion.estado === 'activa' && (
        <div className="flex gap-4">
          <Dialog open={modalAporte} onOpenChange={setModalAporte}>
            <DialogTrigger asChild>
              <Button className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Dinero
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Dinero a la Inversión</DialogTitle>
                <DialogDescription>
                  Agregue dinero adicional a {inversion.nombre}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="montoAporte">Monto a Aportar</Label>
                  <Input
                    id="montoAporte"
                    type="number"
                    placeholder="0.00"
                    value={montoAporte}
                    onChange={(e) => setMontoAporte(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="fechaAporte">Fecha (opcional)</Label>
                  <Input
                    id="fechaAporte"
                    type="date"
                    value={fechaAporte}
                    onChange={(e) => setFechaAporte(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="notasAporte">Notas (opcional)</Label>
                  <Textarea
                    id="notasAporte"
                    placeholder="Notas adicionales..."
                    value={notasAporte}
                    onChange={(e) => setNotasAporte(e.target.value)}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setModalAporte(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAporte} disabled={isLoadingAction}>
                  {isLoadingAction ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Agregar Dinero
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={modalRetiro} onOpenChange={setModalRetiro}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1">
                <Minus className="h-4 w-4 mr-2" />
                Retirar Dinero
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Retirar Dinero de la Inversión</DialogTitle>
                <DialogDescription>
                  Retire dinero de {inversion.nombre}. Disponible: {formatMoney(inversion.montoActual)}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="montoRetiro">Monto a Retirar</Label>
                  <Input
                    id="montoRetiro"
                    type="number"
                    placeholder="0.00"
                    max={inversion.montoActual}
                    value={montoRetiro}
                    onChange={(e) => setMontoRetiro(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Tipo de Retiro</Label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant={tipoRetiro === 'parcial' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTipoRetiro('parcial')}
                    >
                      Parcial
                    </Button>
                    <Button
                      type="button"
                      variant={tipoRetiro === 'total' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setTipoRetiro('total')
                        setMontoRetiro(inversion.montoActual.toString())
                      }}
                    >
                      Total
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="fechaRetiro">Fecha (opcional)</Label>
                  <Input
                    id="fechaRetiro"
                    type="date"
                    value={fechaRetiro}
                    onChange={(e) => setFechaRetiro(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="notasRetiro">Notas (opcional)</Label>
                  <Textarea
                    id="notasRetiro"
                    placeholder="Notas adicionales..."
                    value={notasRetiro}
                    onChange={(e) => setNotasRetiro(e.target.value)}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setModalRetiro(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleRetiro} disabled={isLoadingAction} variant="destructive">
                  {isLoadingAction ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Minus className="h-4 w-4 mr-2" />}
                  Retirar Dinero
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Tabs con información detallada */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="transacciones">Transacciones</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Detalles de la Inversión</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {inversion.descripcion && (
                <div>
                  <Label className="text-sm font-medium">Descripción</Label>
                  <p className="text-sm text-muted-foreground">{inversion.descripcion}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Fecha de Inicio</Label>
                  <p className="text-sm">{format(new Date(inversion.fechaInicio), 'dd/MM/yyyy', { locale: es })}</p>
                </div>
                
                {inversion.fechaVencimiento && (
                  <div>
                    <Label className="text-sm font-medium">Fecha de Vencimiento</Label>
                    <p className="text-sm">{format(new Date(inversion.fechaVencimiento), 'dd/MM/yyyy', { locale: es })}</p>
                  </div>
                )}
                
                {inversion.plataforma && (
                  <div>
                    <Label className="text-sm font-medium">Plataforma</Label>
                    <p className="text-sm">{inversion.plataforma}</p>
                  </div>
                )}
              </div>
              
              {inversion.notas && (
                <div>
                  <Label className="text-sm font-medium">Notas</Label>
                  <p className="text-sm text-muted-foreground">{inversion.notas}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="transacciones">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Transacciones</CardTitle>
              <CardDescription>
                Movimientos realizados en esta inversión
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transacciones.length === 0 ? (
                <div className="text-center py-8">
                  <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay transacciones registradas</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Descripción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transacciones.map((transaccion) => (
                      <TableRow key={transaccion.id}>
                        <TableCell>
                          {format(new Date(transaccion.fecha), 'dd/MM/yyyy', { locale: es })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {transaccion.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatMoney(transaccion.monto)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {transaccion.descripcion || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 