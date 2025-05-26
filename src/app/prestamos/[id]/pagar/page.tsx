'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft, Calculator, CreditCard, DollarSign } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { PageLayout } from '@/components/PageLayout'

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
  fechaProximaCuota?: Date
  numeroCredito?: string
}

export default function PagarCuotaPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const prestamoId = params.id as string

  const [prestamo, setPrestamo] = useState<Prestamo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    montoPagado: '',
    montoCapital: '',
    montoInteres: '',
    montoSeguro: '0',
    montoComision: '0',
    fechaPago: format(new Date(), 'yyyy-MM-dd'),
    fechaVencimiento: '',
    diasMora: '0',
    interesMora: '0',
    metodoPago: '',
    comprobante: '',
    observaciones: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      cargarPrestamo()
    }
  }, [status, prestamoId])

  const cargarPrestamo = async () => {
    try {
      const response = await fetch('/api/prestamos')
      if (response.ok) {
        const prestamos = await response.json()
        const prestamoEncontrado = prestamos.find((p: Prestamo) => p.id === prestamoId)
        
        if (prestamoEncontrado) {
          setPrestamo(prestamoEncontrado)
          
          // Configurar fecha de vencimiento por defecto
          if (prestamoEncontrado.fechaProximaCuota) {
            setFormData(prev => ({
              ...prev,
              fechaVencimiento: format(new Date(prestamoEncontrado.fechaProximaCuota!), 'yyyy-MM-dd'),
              montoPagado: prestamoEncontrado.cuotaMensual.toString()
            }))
          }
        } else {
          toast.error('Préstamo no encontrado')
          router.push('/prestamos')
        }
      } else {
        toast.error('Error al cargar préstamo')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar préstamo')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Calcular desglose de la cuota (sin IVA base + IVA)
  const calcularDesglose = () => {
    if (!prestamo) return { cuotaSinIva: 0, iva: 0, totalConIva: 0 }
    
    const cuotaSinIva = prestamo.cuotaMensual / 1.21
    const iva = cuotaSinIva * 0.21
    const totalConIva = prestamo.cuotaMensual
    
    return { cuotaSinIva, iva, totalConIva }
  }

  const calcularAmortizacion = () => {
    if (!prestamo) return { capital: 0, interes: 0 }
    
    const { cuotaSinIva } = calcularDesglose()
    const tasaMensual = prestamo.tasaInteres / 100 / 12
    const interes = prestamo.saldoActual * tasaMensual
    const capital = cuotaSinIva - interes
    
    return { capital: Math.max(0, capital), interes }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Validaciones
      if (!formData.montoPagado || !formData.fechaPago || !formData.fechaVencimiento) {
        toast.error('Por favor completa todos los campos obligatorios')
        return
      }

      const response = await fetch(`/api/prestamos/${prestamoId}/pagar-cuota`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          montoPagado: parseFloat(formData.montoPagado),
          montoCapital: parseFloat(formData.montoCapital) || calcularAmortizacion().capital,
          montoInteres: parseFloat(formData.montoInteres) || calcularAmortizacion().interes,
          montoSeguro: parseFloat(formData.montoSeguro) || 0,
          montoComision: parseFloat(formData.montoComision) || 0,
          fechaPago: formData.fechaPago,
          fechaVencimiento: formData.fechaVencimiento,
          diasMora: parseInt(formData.diasMora) || 0,
          interesMora: parseFloat(formData.interesMora) || 0,
          metodoPago: formData.metodoPago,
          comprobante: formData.comprobante,
          observaciones: formData.observaciones
        }),
      })

      if (response.ok) {
        toast.success('Pago de cuota registrado exitosamente')
        router.push('/prestamos')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al registrar pago')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al registrar pago')
    } finally {
      setSubmitting(false)
    }
  }

  const metodosPago = [
    'Efectivo',
    'Transferencia bancaria',
    'Débito automático',
    'Tarjeta de débito',
    'Tarjeta de crédito',
    'Cheque',
    'Otro'
  ]

  if (loading) {
    return (
      <PageLayout>
        <div className="container mx-auto p-6">
          <div className="text-center">Cargando...</div>
        </div>
      </PageLayout>
    )
  }

  if (!prestamo) {
    return (
      <PageLayout>
        <div className="container mx-auto p-6">
          <div className="text-center">Préstamo no encontrado</div>
        </div>
      </PageLayout>
    )
  }

  const { cuotaSinIva, iva, totalConIva } = calcularDesglose()
  const { capital, interes } = calcularAmortizacion()

  return (
    <PageLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Pagar Cuota de Préstamo
            </h1>
            <p className="text-muted-foreground">
              {prestamo.entidadFinanciera} - {prestamo.tipoCredito}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información del Préstamo */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Información del Préstamo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Entidad</Label>
                  <p className="text-sm">{prestamo.entidadFinanciera}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tipo</Label>
                  <p className="text-sm">{prestamo.tipoCredito}</p>
                </div>
                {prestamo.numeroCredito && (
                  <div>
                    <Label className="text-sm font-medium">Número</Label>
                    <p className="text-sm">#{prestamo.numeroCredito}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">Saldo Actual</Label>
                  <p className="text-sm font-semibold">${prestamo.saldoActual.toLocaleString('es-AR')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Cuotas</Label>
                  <p className="text-sm">{prestamo.cuotasPagadas} de {prestamo.plazoMeses}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Próximo Vencimiento</Label>
                  <p className="text-sm">
                    {prestamo.fechaProximaCuota 
                      ? format(new Date(prestamo.fechaProximaCuota), 'dd/MM/yyyy', { locale: es })
                      : 'No definido'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Desglose de la Cuota */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Desglose de Cuota
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Cuota base (sin IVA):</span>
                  <span className="font-medium">${cuotaSinIva.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">IVA (21%):</span>
                  <span className="font-medium">${iva.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-semibold">Total con IVA:</span>
                  <span className="font-bold text-lg">${totalConIva.toFixed(2)}</span>
                </div>
                
                <Separator className="my-3" />
                
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Amortización estimada:</p>
                  <div className="flex justify-between">
                    <span>Capital:</span>
                    <span>${capital.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Intereses:</span>
                    <span>${interes.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formulario de Pago */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Registrar Pago de Cuota
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Montos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="montoPagado">Monto Total Pagado *</Label>
                      <Input
                        id="montoPagado"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.montoPagado}
                        onChange={(e) => handleInputChange('montoPagado', e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Incluye IVA. Cuota sugerida: ${totalConIva.toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="metodoPago">Método de Pago *</Label>
                      <Select 
                        value={formData.metodoPago} 
                        onValueChange={(value) => handleInputChange('metodoPago', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona método" />
                        </SelectTrigger>
                        <SelectContent>
                          {metodosPago.map((metodo) => (
                            <SelectItem key={metodo} value={metodo}>
                              {metodo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="montoCapital">Monto a Capital</Label>
                      <Input
                        id="montoCapital"
                        type="number"
                        step="0.01"
                        placeholder={capital.toFixed(2)}
                        value={formData.montoCapital}
                        onChange={(e) => handleInputChange('montoCapital', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="montoInteres">Monto a Intereses</Label>
                      <Input
                        id="montoInteres"
                        type="number"
                        step="0.01"
                        placeholder={interes.toFixed(2)}
                        value={formData.montoInteres}
                        onChange={(e) => handleInputChange('montoInteres', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="montoSeguro">Seguro</Label>
                      <Input
                        id="montoSeguro"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.montoSeguro}
                        onChange={(e) => handleInputChange('montoSeguro', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="montoComision">Comisiones</Label>
                      <Input
                        id="montoComision"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.montoComision}
                        onChange={(e) => handleInputChange('montoComision', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Fechas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fechaPago">Fecha de Pago *</Label>
                      <Input
                        id="fechaPago"
                        type="date"
                        value={formData.fechaPago}
                        onChange={(e) => handleInputChange('fechaPago', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="fechaVencimiento">Fecha de Vencimiento *</Label>
                      <Input
                        id="fechaVencimiento"
                        type="date"
                        value={formData.fechaVencimiento}
                        onChange={(e) => handleInputChange('fechaVencimiento', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Mora (si aplica) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="diasMora">Días de Mora</Label>
                      <Input
                        id="diasMora"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.diasMora}
                        onChange={(e) => handleInputChange('diasMora', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="interesMora">Interés por Mora</Label>
                      <Input
                        id="interesMora"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.interesMora}
                        onChange={(e) => handleInputChange('interesMora', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Comprobante y Observaciones */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="comprobante">Número de Comprobante</Label>
                      <Input
                        id="comprobante"
                        placeholder="Número de recibo, transferencia, etc."
                        value={formData.comprobante}
                        onChange={(e) => handleInputChange('comprobante', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="observaciones">Observaciones</Label>
                      <Textarea
                        id="observaciones"
                        placeholder="Notas adicionales sobre el pago..."
                        value={formData.observaciones}
                        onChange={(e) => handleInputChange('observaciones', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex gap-4 justify-end pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => router.back()}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Registrando...' : 'Registrar Pago'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>
        </div>
      </div>
    </PageLayout>
  )
} 