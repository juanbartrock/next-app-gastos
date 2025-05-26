"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Calculator, Building2 } from "lucide-react"
import { toast } from "sonner"
import { PageLayout } from "@/components/PageLayout"

export default function NuevoPrestamoPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    entidadFinanciera: '',
    tipoCredito: '',
    montoSolicitado: '',
    montoAprobado: '',
    montoDesembolsado: '',
    tasaInteres: '',
    plazoMeses: '',
    fechaDesembolso: '',
    fechaPrimeraCuota: '',
    diaPago: '',
    proposito: '',
    garantia: '',
    seguroVida: false,
    seguroDesempleo: false,
    comisiones: '',
    gastosNotariales: '',
    numeroCredito: '',
    observaciones: ''
  })

  // Redireccionar si no está autenticado
  if (status === "unauthenticated") {
    router.push('/login')
    return null
  }

  if (status === "loading") {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </PageLayout>
    )
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const calcularCuotaMensual = () => {
    const monto = parseFloat(formData.montoAprobado)
    const tasa = parseFloat(formData.tasaInteres)
    const plazo = parseInt(formData.plazoMeses)

    if (monto && tasa && plazo) {
      const tasaMensual = tasa / 100 / 12
      const cuota = monto * (tasaMensual * Math.pow(1 + tasaMensual, plazo)) / 
                   (Math.pow(1 + tasaMensual, plazo) - 1)
      return cuota.toFixed(2)
    }
    return '0.00'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validaciones básicas
      if (!formData.entidadFinanciera || !formData.tipoCredito || !formData.montoAprobado || 
          !formData.tasaInteres || !formData.plazoMeses || !formData.fechaDesembolso || 
          !formData.fechaPrimeraCuota) {
        toast.error('Por favor completa todos los campos obligatorios')
        return
      }

      const response = await fetch('/api/prestamos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          montoSolicitado: parseFloat(formData.montoSolicitado) || parseFloat(formData.montoAprobado),
          montoAprobado: parseFloat(formData.montoAprobado),
          montoDesembolsado: parseFloat(formData.montoDesembolsado) || parseFloat(formData.montoAprobado),
          tasaInteres: parseFloat(formData.tasaInteres),
          plazoMeses: parseInt(formData.plazoMeses),
          diaPago: formData.diaPago ? parseInt(formData.diaPago) : null,
          comisiones: parseFloat(formData.comisiones) || 0,
          gastosNotariales: parseFloat(formData.gastosNotariales) || 0,
        }),
      })

      if (response.ok) {
        toast.success('Préstamo registrado exitosamente')
        router.push('/prestamos')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al registrar préstamo')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al registrar préstamo')
    } finally {
      setLoading(false)
    }
  }

  const tiposCredito = [
    'Personal',
    'Hipotecario',
    'Vehicular',
    'Comercial',
    'Educativo',
    'Consumo',
    'Microcrédito',
    'Línea de crédito',
    'Otro'
  ]

  const tiposGarantia = [
    'Sin garantía',
    'Hipotecaria',
    'Prendaria',
    'Fiador',
    'Aval',
    'Garantía real',
    'Otro'
  ]

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
              Registrar Nuevo Préstamo
            </h1>
            <p className="text-muted-foreground">
              Ingresa los datos de tu préstamo o crédito bancario
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Información Básica del Préstamo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="entidadFinanciera">Entidad Financiera *</Label>
                  <Input
                    id="entidadFinanciera"
                    placeholder="Ej: Banco Nacional, Cooperativa XYZ"
                    value={formData.entidadFinanciera}
                    onChange={(e) => handleInputChange('entidadFinanciera', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="tipoCredito">Tipo de Crédito *</Label>
                  <Select 
                    value={formData.tipoCredito} 
                    onValueChange={(value) => handleInputChange('tipoCredito', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposCredito.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="numeroCredito">Número de Crédito</Label>
                  <Input
                    id="numeroCredito"
                    placeholder="Número asignado por la entidad"
                    value={formData.numeroCredito}
                    onChange={(e) => handleInputChange('numeroCredito', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="proposito">Propósito del Préstamo</Label>
                  <Input
                    id="proposito"
                    placeholder="Ej: Compra de vivienda, vehículo, etc."
                    value={formData.proposito}
                    onChange={(e) => handleInputChange('proposito', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Financiera */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Información Financiera
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="montoSolicitado">Monto Solicitado</Label>
                  <Input
                    id="montoSolicitado"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.montoSolicitado}
                    onChange={(e) => handleInputChange('montoSolicitado', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="montoAprobado">Monto Aprobado *</Label>
                  <Input
                    id="montoAprobado"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.montoAprobado}
                    onChange={(e) => handleInputChange('montoAprobado', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="montoDesembolsado">Monto Desembolsado</Label>
                  <Input
                    id="montoDesembolsado"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.montoDesembolsado}
                    onChange={(e) => handleInputChange('montoDesembolsado', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="tasaInteres">Tasa de Interés Anual (%) *</Label>
                  <Input
                    id="tasaInteres"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.tasaInteres}
                    onChange={(e) => handleInputChange('tasaInteres', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="plazoMeses">Plazo en Meses *</Label>
                  <Input
                    id="plazoMeses"
                    type="number"
                    placeholder="12"
                    value={formData.plazoMeses}
                    onChange={(e) => handleInputChange('plazoMeses', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label>Cuota Mensual Estimada</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <span className="font-semibold">
                      ${calcularCuotaMensual()}
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="comisiones">Comisiones</Label>
                  <Input
                    id="comisiones"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.comisiones}
                    onChange={(e) => handleInputChange('comisiones', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="gastosNotariales">Gastos Notariales</Label>
                  <Input
                    id="gastosNotariales"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.gastosNotariales}
                    onChange={(e) => handleInputChange('gastosNotariales', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fechas y Pagos */}
          <Card>
            <CardHeader>
              <CardTitle>Fechas y Configuración de Pagos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="fechaDesembolso">Fecha de Desembolso *</Label>
                  <Input
                    id="fechaDesembolso"
                    type="date"
                    value={formData.fechaDesembolso}
                    onChange={(e) => handleInputChange('fechaDesembolso', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="fechaPrimeraCuota">Fecha Primera Cuota *</Label>
                  <Input
                    id="fechaPrimeraCuota"
                    type="date"
                    value={formData.fechaPrimeraCuota}
                    onChange={(e) => handleInputChange('fechaPrimeraCuota', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="diaPago">Día de Pago Mensual</Label>
                  <Input
                    id="diaPago"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="15"
                    value={formData.diaPago}
                    onChange={(e) => handleInputChange('diaPago', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Garantías y Seguros */}
          <Card>
            <CardHeader>
              <CardTitle>Garantías y Seguros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="garantia">Tipo de Garantía</Label>
                <Select 
                  value={formData.garantia} 
                  onValueChange={(value) => handleInputChange('garantia', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de garantía" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposGarantia.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="seguroVida"
                    checked={formData.seguroVida}
                    onCheckedChange={(checked) => handleInputChange('seguroVida', checked as boolean)}
                  />
                  <Label htmlFor="seguroVida">Incluye Seguro de Vida</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="seguroDesempleo"
                    checked={formData.seguroDesempleo}
                    onCheckedChange={(checked) => handleInputChange('seguroDesempleo', checked as boolean)}
                  />
                  <Label htmlFor="seguroDesempleo">Incluye Seguro de Desempleo</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observaciones */}
          <Card>
            <CardHeader>
              <CardTitle>Observaciones Adicionales</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="observaciones">Notas y Comentarios</Label>
                <Textarea
                  id="observaciones"
                  placeholder="Información adicional sobre el préstamo..."
                  value={formData.observaciones}
                  onChange={(e) => handleInputChange('observaciones', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botones */}
          <div className="flex gap-4 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar Préstamo'}
            </Button>
          </div>
        </form>
      </div>
    </PageLayout>
  )
} 