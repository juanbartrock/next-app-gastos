"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, CreditCard, Calendar, DollarSign, Check, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Financiacion {
  id: number
  cantidadCuotas: number
  cuotasPagadas: number
  cuotasRestantes: number
  montoCuota: number
  gasto: {
    id: number
    concepto: string
    monto: number
    fecha: string
  }
  tarjetaInfo?: {
    tarjetaEspecifica: string
  }
}

interface PagoTarjeta {
  gastoId: number
  concepto: string
  monto: number
  fecha: string
  tarjetaEspecifica: string
}

export default function PagarTarjetaPage() {
  const router = useRouter()
  const [financiaciones, setFinanciaciones] = useState<Financiacion[]>([])
  const [pagosTarjeta, setPagosTarjeta] = useState<PagoTarjeta[]>([])
  const [tarjetaSeleccionada, setTarjetaSeleccionada] = useState<string>("all")
  const [pagoSeleccionado, setPagoSeleccionado] = useState<string>("")
  const [cuotasSeleccionadas, setCuotasSeleccionadas] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  // Cargar datos al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoadingData(true)
        
        // Cargar financiaciones pendientes
        const resFinanciaciones = await fetch('/api/financiacion')
        if (resFinanciaciones.ok) {
          const dataFinanciaciones = await resFinanciaciones.json()
          setFinanciaciones(dataFinanciaciones.filter((f: Financiacion) => f.cuotasRestantes > 0))
        }
        
        // Cargar pagos de tarjeta (transacciones que podrían ser pagos de tarjeta)
        const resPagos = await fetch('/api/gastos/pagos-tarjeta')
        if (resPagos.ok) {
          const dataPagos = await resPagos.json()
          setPagosTarjeta(dataPagos)
        }
        
      } catch (error) {
        console.error('Error al cargar datos:', error)
        toast.error('Error al cargar los datos')
      } finally {
        setLoadingData(false)
      }
    }
    
    cargarDatos()
  }, [])

  // Obtener tarjetas únicas
  const tarjetasDisponibles = Array.from(
    new Set(
      financiaciones
        .filter(f => f.tarjetaInfo?.tarjetaEspecifica)
        .map(f => f.tarjetaInfo!.tarjetaEspecifica)
    )
  )

  // Filtrar financiaciones por tarjeta seleccionada
  const financiacionesFiltradas = financiaciones.filter(f => 
    tarjetaSeleccionada === "all" || !tarjetaSeleccionada || f.tarjetaInfo?.tarjetaEspecifica === tarjetaSeleccionada
  )

  // Filtrar pagos por tarjeta seleccionada
  const pagosFiltrados = pagosTarjeta.filter(p => 
    tarjetaSeleccionada === "all" || !tarjetaSeleccionada || p.tarjetaEspecifica === tarjetaSeleccionada
  )

  const handleCuotaToggle = (financiacionId: number) => {
    setCuotasSeleccionadas(prev => 
      prev.includes(financiacionId)
        ? prev.filter(id => id !== financiacionId)
        : [...prev, financiacionId]
    )
  }

  const handleVincularPago = async () => {
    if (!pagoSeleccionado || cuotasSeleccionadas.length === 0) {
      toast.error('Selecciona un pago y al menos una cuota')
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch('/api/financiacion/vincular-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pagoGastoId: parseInt(pagoSeleccionado),
          financiacionIds: cuotasSeleccionadas
        })
      })

      if (!response.ok) {
        throw new Error('Error al vincular el pago')
      }

      toast.success('Pago vinculado correctamente')
      
      // Recargar datos
      window.location.reload()
      
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al vincular el pago')
    } finally {
      setLoading(false)
    }
  }

  const calcularTotalSeleccionado = () => {
    return financiacionesFiltradas
      .filter(f => cuotasSeleccionadas.includes(f.id))
      .reduce((total, f) => total + f.montoCuota, 0)
  }

  if (loadingData) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Cargando financiaciones...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Pagar Tarjeta</h1>
          <p className="text-muted-foreground">
            Vincula pagos de tarjeta a cuotas específicas sin duplicar gastos
          </p>
        </div>
      </div>

      {/* Selector de tarjeta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Seleccionar Tarjeta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={tarjetaSeleccionada} onValueChange={setTarjetaSeleccionada}>
            <SelectTrigger>
              <SelectValue placeholder="Todas las tarjetas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las tarjetas</SelectItem>
              {tarjetasDisponibles.map(tarjeta => (
                <SelectItem key={tarjeta} value={tarjeta}>
                  {tarjeta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Panel de pagos de tarjeta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pagos Realizados
            </CardTitle>
            <CardDescription>
              Selecciona el pago de tarjeta que realizaste
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pagosFiltrados.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                <p>No hay pagos de tarjeta registrados</p>
                <p className="text-sm">Registra primero el pago de tu tarjeta como transacción</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pagosFiltrados.map(pago => (
                  <div
                    key={pago.gastoId}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      pagoSeleccionado === pago.gastoId.toString()
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setPagoSeleccionado(pago.gastoId.toString())}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{pago.concepto}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(pago.fecha).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${pago.monto.toLocaleString()}</p>
                        <Badge variant="outline">{pago.tarjetaEspecifica}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel de cuotas pendientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Cuotas Pendientes
            </CardTitle>
            <CardDescription>
              Selecciona las cuotas que se pagan con este pago
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {financiacionesFiltradas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Check className="h-8 w-8 mx-auto mb-2" />
                <p>No hay cuotas pendientes</p>
              </div>
            ) : (
              <div className="space-y-2">
                {financiacionesFiltradas.map(financiacion => (
                  <div
                    key={financiacion.id}
                    className="p-3 border rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={cuotasSeleccionadas.includes(financiacion.id)}
                        onCheckedChange={() => handleCuotaToggle(financiacion.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{financiacion.gasto.concepto}</p>
                        <p className="text-sm text-muted-foreground">
                          Cuota {financiacion.cuotasPagadas + 1}/{financiacion.cantidadCuotas}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            ${financiacion.montoCuota.toLocaleString()}
                          </Badge>
                          {financiacion.tarjetaInfo && (
                            <Badge variant="secondary">
                              {financiacion.tarjetaInfo.tarjetaEspecifica}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Panel de resumen y acción */}
      {cuotasSeleccionadas.length > 0 && pagoSeleccionado && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen del Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Total de cuotas seleccionadas:</p>
                <p className="text-2xl font-bold">${calcularTotalSeleccionado().toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Cuotas a pagar:</p>
                <p className="text-lg font-semibold">{cuotasSeleccionadas.length}</p>
              </div>
            </div>
            <Separator className="my-4" />
            <Button 
              onClick={handleVincularPago}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Procesando...' : 'Vincular Pago a Cuotas'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 