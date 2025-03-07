"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CreditCard, ExternalLink, ArrowDown, ArrowLeft } from "lucide-react"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { format, addMonths, isSameMonth, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { useCurrency } from "@/contexts/CurrencyContext"

// Tipos
type Financiacion = {
  id: number
  gastoId: number
  gasto: {
    id: number
    concepto: string
    monto: number
    fecha: Date
    categoria: string
  }
  userId: string
  cantidadCuotas: number
  cuotasPagadas: number
  cuotasRestantes: number
  montoCuota: number
  fechaPrimerPago?: Date
  fechaProximoPago?: Date
  diaPago?: number
  createdAt: Date
  updatedAt: Date
}

// Componente de carga
function LoadingScreen() {
  return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
}

export default function FinanciacionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [financiaciones, setFinanciaciones] = useState<Financiacion[]>([])
  const [pagoDialogOpen, setPagoDialogOpen] = useState(false)
  const [currentFinanciacionId, setCurrentFinanciacionId] = useState<number | null>(null)
  const [selectedTipoMovimiento, setSelectedTipoMovimiento] = useState("digital")
  const { formatMoney } = useCurrency()

  // Cargar datos iniciales
  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Cargar financiaciones
      const response = await fetch('/api/financiacion')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error en la respuesta:', response.status, errorData);
        throw new Error(errorData.error || 'Error al cargar financiaciones');
      }
      
      const datos = await response.json()
      console.log('Financiaciones cargadas:', datos)
      setFinanciaciones(datos)
    } catch (error) {
      console.error('Error al cargar datos:', error)
      toast.error('Error al cargar los datos de financiación. Por favor, intenta nuevamente más tarde.')
    } finally {
      setLoading(false)
    }
  }

  // Efecto para redireccionar si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      fetchData()
    }
  }, [status, router])

  // Mostrar diálogo de pago
  const openPagoDialog = (id: number) => {
    setCurrentFinanciacionId(id)
    setSelectedTipoMovimiento("digital")
    setPagoDialogOpen(true)
  }

  // Actualizar cuota pagada
  const handlePagarCuota = async () => {
    if (!currentFinanciacionId) return
    
    try {
      const financiacion = financiaciones.find(f => f.id === currentFinanciacionId)
      if (!financiacion || financiacion.cuotasRestantes === 0) return
      
      const response = await fetch(`/api/financiacion/${currentFinanciacionId}/pagar-cuota`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tipoMovimiento: selectedTipoMovimiento
        })
      })
      
      if (!response.ok) {
        throw new Error('Error al actualizar cuota pagada')
      }
      
      const result = await response.json()
      
      toast.success('Cuota registrada como pagada')
      if (result.gastoRegistrado) {
        toast.success(`Se registró un gasto de ${formatMoney(result.gastoRegistrado.monto)} en tu cuenta`)
      }
      
      setPagoDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al registrar el pago')
      setPagoDialogOpen(false)
    }
  }

  // Ver detalle del gasto asociado
  const handleVerGasto = (id: number) => {
    // Aquí podría implementarse una navegación al detalle del gasto
    toast.info('Funcionalidad de ver detalle en desarrollo')
  }

  // Si está cargando, mostrar pantalla de carga
  if (status === "loading" || loading) {
    return <LoadingScreen />
  }

  // Si no está autenticado, no mostrar nada (la redirección se maneja en el efecto)
  if (status === "unauthenticated") {
    return null
  }

  // Funciones de formateo
  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(monto)
  }

  const formatFecha = (fecha?: Date) => {
    if (!fecha) return "No definida"
    return format(new Date(fecha), 'dd/MM/yyyy', { locale: es })
  }

  // Calcular monto total restante
  const calcularMontoRestante = (financiacion: Financiacion) => {
    return financiacion.montoCuota * financiacion.cuotasRestantes
  }

  // Calcular próximo pago si no está definido
  const getProximoPago = (financiacion: Financiacion) => {
    if (financiacion.fechaProximoPago) {
      return formatFecha(financiacion.fechaProximoPago)
    }
    
    if (financiacion.fechaPrimerPago && financiacion.cuotasPagadas > 0) {
      const primerPago = new Date(financiacion.fechaPrimerPago)
      const proximoPago = addMonths(primerPago, financiacion.cuotasPagadas)
      return formatFecha(proximoPago)
    }
    
    return "No definida"
  }

  // Cálculo de totales
  const calcularTotales = () => {
    const fechaActual = new Date();
    
    // Total de pagos del mes en curso
    const totalMesEnCurso = financiaciones.reduce((acc, financiacion) => {
      if (financiacion.fechaProximoPago && 
          isSameMonth(new Date(financiacion.fechaProximoPago), fechaActual)) {
        return acc + financiacion.montoCuota;
      }
      return acc;
    }, 0);
    
    // Total restante (suma de todos los montos restantes)
    const totalRestante = financiaciones.reduce((acc, financiacion) => {
      return acc + calcularMontoRestante(financiacion);
    }, 0);
    
    // Próximo pago (fecha más cercana)
    let proximoPago: Date | null = null;
    
    financiaciones.forEach(financiacion => {
      if (financiacion.fechaProximoPago && financiacion.cuotasRestantes > 0) {
        const fechaProx = new Date(financiacion.fechaProximoPago);
        if (!proximoPago || fechaProx < proximoPago) {
          proximoPago = fechaProx;
        }
      }
    });
    
    return {
      totalMesEnCurso,
      totalRestante,
      proximoPago
    };
  };

  const { totalMesEnCurso, totalRestante, proximoPago } = calcularTotales();

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financiación con Tarjeta</h1>
          <Button variant="outline" onClick={() => router.push("/?dashboard=true")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Button>
        </div>

        {/* Resumen de totales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white dark:bg-gray-800 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Mes en Curso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatMoney(totalMesEnCurso)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Pagos programados para este mes</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Restante</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatMoney(totalRestante)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Monto total a pagar en todas las financiaciones</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Próximo Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {proximoPago ? formatFecha(proximoPago) : "No hay pagos programados"}
              </div>
              <p className="text-xs text-gray-500 mt-1">Fecha del próximo pago más cercano</p>
            </CardContent>
          </Card>
        </div>

        <Card className="w-full bg-white dark:bg-gray-800 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              <span>Gastos Financiados</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {financiaciones.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No tienes gastos financiados con tarjeta registrados.
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Los gastos financiados se crearán automáticamente al registrar un gasto de tipo "tarjeta".
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableCaption>Listado de tus gastos financiados con tarjeta</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Monto Total</TableHead>
                      <TableHead>Cuota</TableHead>
                      <TableHead>Cuotas Pagadas</TableHead>
                      <TableHead>Cuotas Restantes</TableHead>
                      <TableHead>Próximo Pago</TableHead>
                      <TableHead>Monto Restante</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {financiaciones.map((financiacion) => (
                      <TableRow key={financiacion.id}>
                        <TableCell className="font-medium">
                          {financiacion.gasto.concepto}
                        </TableCell>
                        <TableCell>
                          {formatMoney(financiacion.gasto.monto)}
                        </TableCell>
                        <TableCell>
                          {formatMoney(financiacion.montoCuota)}
                        </TableCell>
                        <TableCell>
                          {financiacion.cuotasPagadas} de {financiacion.cantidadCuotas}
                        </TableCell>
                        <TableCell>
                          {financiacion.cuotasRestantes}
                        </TableCell>
                        <TableCell>
                          {getProximoPago(financiacion)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatMoney(calcularMontoRestante(financiacion))}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openPagoDialog(financiacion.id)}
                              disabled={financiacion.cuotasRestantes === 0}
                            >
                              Pagar Cuota
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleVerGasto(financiacion.gastoId)}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Diálogo para pagar cuota */}
        <Dialog open={pagoDialogOpen} onOpenChange={setPagoDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pago de Cuota</DialogTitle>
              <DialogDescription>
                Selecciona el tipo de movimiento para registrar este pago.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <Label htmlFor="tipoMovimiento" className="mb-2 block">
                Tipo de Movimiento
              </Label>
              <Select 
                value={selectedTipoMovimiento} 
                onValueChange={setSelectedTipoMovimiento}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="ahorro">Ahorro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handlePagarCuota}>
                Registrar Pago
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 