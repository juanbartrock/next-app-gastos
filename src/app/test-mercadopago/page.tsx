'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  CreditCard, 
  TestTube, 
  ExternalLink, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Copy,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"

export default function TestMercadoPagoPage() {
  const [loading, setLoading] = useState(false)
  const [pagoData, setPagoData] = useState<any>(null)
  const [monto, setMonto] = useState('999')
  const [concepto, setConcepto] = useState('Test Plan Premium - Prueba')
  const [verificandoPago, setVerificandoPago] = useState(false)
  const [estadoPago, setEstadoPago] = useState<any>(null)

  // Crear pago de prueba
  const crearPagoPrueba = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/suscripciones/crear-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: 'plan-premium',
          tipoPago: 'inicial',
          montoCustom: parseFloat(monto),
          conceptoCustom: concepto
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setPagoData(data)
        toast.success('¡Pago creado exitosamente!')
      } else {
        toast.error(`Error: ${data.error || 'No se pudo crear el pago'}`)
      }
    } catch (error) {
      console.error('Error creando pago:', error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  // Verificar estado del pago
  const verificarPago = async () => {
    if (!pagoData?.payment_id) return
    
    setVerificandoPago(true)
    try {
      const response = await fetch(`/api/suscripciones/verificar-pago?payment_id=${pagoData.payment_id}`)
      const data = await response.json()
      
      setEstadoPago(data)
      
      if (response.ok) {
        toast.success('Estado actualizado')
      } else {
        toast.error(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error verificando pago:', error)
      toast.error('Error verificando pago')
    } finally {
      setVerificandoPago(false)
    }
  }

  // Copiar al portapapeles
  const copiarAlPortapapeles = (texto: string) => {
    navigator.clipboard.writeText(texto)
    toast.success('Copiado al portapapeles')
  }

  const getEstadoBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Aprobado</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rechazado</Badge>
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800">Cancelado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <TestTube className="h-8 w-8 text-blue-500" />
          Test MercadoPago Argentina
        </h1>
        <p className="text-muted-foreground">
          Página de pruebas para validar la integración con MercadoPago
        </p>
      </div>

      {/* Configuración del pago */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            1. Configurar Pago de Prueba
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="monto">Monto (ARS)</Label>
              <Input
                id="monto"
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="999"
              />
            </div>
            <div>
              <Label htmlFor="concepto">Concepto</Label>
              <Input
                id="concepto"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder="Descripción del pago"
              />
            </div>
          </div>
          
          <Button 
            onClick={crearPagoPrueba} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Creando pago...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Crear Pago de Prueba
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultado del pago */}
      {pagoData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              2. Pago Creado - Datos de MercadoPago
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Link de pago */}
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">🔗 Link de Pago</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copiarAlPortapapeles(pagoData.init_point)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copiar
                </Button>
              </div>
              <p className="text-sm font-mono bg-white dark:bg-gray-800 p-2 rounded break-all">
                {pagoData.init_point}
              </p>
              <div className="mt-3">
                <Button asChild className="w-full">
                  <a href={pagoData.init_point} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir en MercadoPago (Nueva Pestaña)
                  </a>
                </Button>
              </div>
            </div>

            {/* Detalles técnicos */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Payment ID:</span>
                <p className="font-mono">{pagoData.payment_id}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Reference:</span>
                <p className="font-mono text-xs">{pagoData.external_reference}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Monto:</span>
                <p>${pagoData.monto}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Estado Inicial:</span>
                <p>Pendiente de pago</p>
              </div>
            </div>

            {/* URLs de retorno */}
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-xs">
              <h4 className="font-medium mb-2">URLs de Retorno Configuradas:</h4>
              <div className="space-y-1">
                <div><strong>Éxito:</strong> {pagoData.success_url}</div>
                <div><strong>Fallo:</strong> {pagoData.failure_url}</div>
                <div><strong>Pendiente:</strong> {pagoData.pending_url}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verificación de estado */}
      {pagoData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              3. Verificar Estado del Pago
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={verificarPago} 
              disabled={verificandoPago}
              variant="outline"
              className="w-full"
            >
              {verificandoPago ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Verificar Estado
                </>
              )}
            </Button>

            {estadoPago && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Estado:</span>
                  {getEstadoBadge(estadoPago.status)}
                </div>
                
                {estadoPago.status_detail && (
                  <div>
                    <span className="font-medium">Detalle:</span>
                    <p className="text-sm">{estadoPago.status_detail}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Monto:</span>
                    <p>${estadoPago.amount}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Método:</span>
                    <p>{estadoPago.payment_method || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instrucciones */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Instrucciones para Probar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="font-bold text-blue-600">1.</span>
              <span>Configura el monto y concepto, luego crea el pago</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-blue-600">2.</span>
              <span>Abre el link de MercadoPago en una nueva pestaña</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-blue-600">3.</span>
              <span>Usa las credenciales de la cuenta COMPRADOR que creaste</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-blue-600">4.</span>
              <span>Usa tarjetas de prueba: <code>4509 9535 6623 3704</code> (Visa)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-blue-600">5.</span>
              <span>Verifica que las páginas de éxito/fallo/pendiente funcionan</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-blue-600">6.</span>
              <span>Usa "Verificar Estado" para comprobar que el webhook funcionó</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estado de MercadoPago */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Modo Sandbox:</strong> Esta página usa las credenciales de prueba. 
          Los pagos no son reales y se procesan instantáneamente.
        </AlertDescription>
      </Alert>
    </div>
  )
} 