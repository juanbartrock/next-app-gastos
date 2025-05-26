"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Building2, Calendar, DollarSign, TrendingDown, AlertCircle, Eye, Edit, Trash2 } from "lucide-react"
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
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { format, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { useCurrency } from "@/contexts/CurrencyContext"
import { PageLayout } from "@/components/PageLayout"

// Tipos
type Prestamo = {
  id: string
  entidadFinanciera: string
  tipoCredito: string
  montoAprobado: number
  saldoActual: number
  tasaInteres: number
  plazoMeses: number
  cuotaMensual: number
  cuotasPagadas: number
  cuotasPendientes: number
  fechaDesembolso: Date
  fechaPrimeraCuota: Date
  fechaProximaCuota?: Date
  fechaVencimiento: Date
  estado: string
  proposito?: string
  numeroCredito?: string
  pagos: PagoPrestamo[]
}

type PagoPrestamo = {
  id: string
  numeroCuota: number
  montoPagado: number
  fechaPago: Date
  fechaVencimiento: Date
}

export default function PrestamosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { formatMoney } = useCurrency()
  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPrestamo, setSelectedPrestamo] = useState<Prestamo | null>(null)

  // Cargar préstamos
  const cargarPrestamos = async () => {
    try {
      const response = await fetch('/api/prestamos')
      if (response.ok) {
        const data = await response.json()
        setPrestamos(data)
      } else {
        toast.error('Error al cargar préstamos')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar préstamos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      cargarPrestamos()
    }
  }, [status])

  // Redireccionar si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/login')
    }
  }, [status, router])

  if (status === "loading" || loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando préstamos...</p>
          </div>
        </div>
      </PageLayout>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  // Funciones auxiliares
  const getEstadoBadge = (estado: string) => {
    const variants = {
      activo: "default",
      pagado: "secondary",
      vencido: "destructive",
      refinanciado: "outline"
    } as const

    return (
      <Badge variant={variants[estado as keyof typeof variants] || "default"}>
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </Badge>
    )
  }

  const formatFecha = (fecha: Date | string) => {
    return format(new Date(fecha), 'dd/MM/yyyy', { locale: es })
  }

  const calcularDiasVencimiento = (fechaProxima?: Date) => {
    if (!fechaProxima) return null
    return differenceInDays(new Date(fechaProxima), new Date())
  }

  const eliminarPrestamo = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este préstamo?')) {
      return
    }

    try {
      const response = await fetch(`/api/prestamos/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Préstamo eliminado exitosamente')
        cargarPrestamos()
      } else {
        toast.error('Error al eliminar préstamo')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al eliminar préstamo')
    }
  }

  // Calcular totales
  const calcularTotales = () => {
    const totalSaldos = prestamos.reduce((acc, p) => acc + p.saldoActual, 0)
    const totalCuotasMensuales = prestamos
      .filter(p => p.estado === 'activo')
      .reduce((acc, p) => acc + p.cuotaMensual, 0)
    const prestamosActivos = prestamos.filter(p => p.estado === 'activo').length
    const proximosVencimientos = prestamos.filter(p => {
      if (!p.fechaProximaCuota) return false
      const dias = calcularDiasVencimiento(p.fechaProximaCuota)
      return dias !== null && dias <= 7 && dias >= 0
    }).length

    return {
      totalSaldos,
      totalCuotasMensuales,
      prestamosActivos,
      proximosVencimientos
    }
  }

  const totales = calcularTotales()

  return (
    <PageLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gestión de Préstamos
            </h1>
            <p className="text-muted-foreground">
              Administra tus préstamos y créditos bancarios
            </p>
          </div>
          <Button onClick={() => router.push('/prestamos/nuevo')} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Préstamo
          </Button>
        </div>

        {/* Resumen */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMoney(totales.totalSaldos)}</div>
              <p className="text-xs text-muted-foreground">
                Deuda pendiente total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cuotas Mensuales</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMoney(totales.totalCuotasMensuales)}</div>
              <p className="text-xs text-muted-foreground">
                Total mensual a pagar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Préstamos Activos</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totales.prestamosActivos}</div>
              <p className="text-xs text-muted-foreground">
                Créditos en curso
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximos Vencimientos</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totales.proximosVencimientos}</div>
              <p className="text-xs text-muted-foreground">
                En los próximos 7 días
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Préstamos */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Préstamos</CardTitle>
            <CardDescription>
              Lista completa de tus préstamos y créditos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {prestamos.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No tienes préstamos registrados</h3>
                <p className="text-muted-foreground mb-4">
                  Comienza registrando tu primer préstamo o crédito bancario
                </p>
                <Button onClick={() => router.push('/prestamos/nuevo')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Préstamo
                </Button>
              </div>
            ) : (
              <Table>
                <TableCaption>
                  Lista de todos tus préstamos y créditos
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entidad</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Cuota</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead>Próximo Pago</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prestamos.map((prestamo) => {
                    const diasVencimiento = calcularDiasVencimiento(prestamo.fechaProximaCuota)
                    const progreso = (prestamo.cuotasPagadas / prestamo.plazoMeses) * 100

                    return (
                      <TableRow key={prestamo.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{prestamo.entidadFinanciera}</div>
                            {prestamo.numeroCredito && (
                              <div className="text-sm text-muted-foreground">
                                #{prestamo.numeroCredito}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{prestamo.tipoCredito}</TableCell>
                        <TableCell>
                          <div className="text-right">
                            <div className="font-semibold">{formatMoney(prestamo.saldoActual)}</div>
                            <div className="text-sm text-muted-foreground">
                              de {formatMoney(prestamo.montoAprobado)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-right">
                            <div className="font-semibold">{formatMoney(prestamo.cuotaMensual)}</div>
                            <div className="text-sm text-muted-foreground">
                              {prestamo.tasaInteres}% anual
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{prestamo.cuotasPagadas}</span>
                              <span>{prestamo.plazoMeses}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${progreso}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-muted-foreground text-center">
                              {Math.round(progreso)}% completado
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {prestamo.fechaProximaCuota ? (
                            <div className="text-right">
                              <div className="font-medium">
                                {formatFecha(prestamo.fechaProximaCuota)}
                              </div>
                              {diasVencimiento !== null && (
                                <div className={`text-sm ${
                                  diasVencimiento <= 3 ? 'text-red-600' : 
                                  diasVencimiento <= 7 ? 'text-yellow-600' : 
                                  'text-muted-foreground'
                                }`}>
                                  {diasVencimiento === 0 ? 'Hoy' :
                                   diasVencimiento === 1 ? 'Mañana' :
                                   diasVencimiento > 0 ? `En ${diasVencimiento} días` :
                                   `Vencido hace ${Math.abs(diasVencimiento)} días`}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getEstadoBadge(prestamo.estado)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedPrestamo(prestamo)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Detalles del Préstamo</DialogTitle>
                                  <DialogDescription>
                                    Información completa del préstamo
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedPrestamo && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="text-sm font-medium">Entidad Financiera</label>
                                        <p>{selectedPrestamo.entidadFinanciera}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Tipo de Crédito</label>
                                        <p>{selectedPrestamo.tipoCredito}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Monto Aprobado</label>
                                        <p>{formatMoney(selectedPrestamo.montoAprobado)}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Saldo Actual</label>
                                        <p>{formatMoney(selectedPrestamo.saldoActual)}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Tasa de Interés</label>
                                        <p>{selectedPrestamo.tasaInteres}% anual</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Cuota Mensual</label>
                                        <p>{formatMoney(selectedPrestamo.cuotaMensual)}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Fecha de Desembolso</label>
                                        <p>{formatFecha(selectedPrestamo.fechaDesembolso)}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Fecha de Vencimiento</label>
                                        <p>{formatFecha(selectedPrestamo.fechaVencimiento)}</p>
                                      </div>
                                    </div>
                                    {selectedPrestamo.proposito && (
                                      <div>
                                        <label className="text-sm font-medium">Propósito</label>
                                        <p>{selectedPrestamo.proposito}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/prestamos/${prestamo.id}/editar`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => eliminarPrestamo(prestamo.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            
                            {prestamo.estado === 'activo' && (
                              <Button 
                                size="sm"
                                onClick={() => router.push(`/prestamos/${prestamo.id}/pagar`)}
                              >
                                Pagar Cuota
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
} 