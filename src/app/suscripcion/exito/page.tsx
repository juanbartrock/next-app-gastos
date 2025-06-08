'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Crown, Calendar, CreditCard, ArrowRight, Loader2 } from "lucide-react"
import { toast } from "sonner"

function SuscripcionExitoContent() {
  const [loading, setLoading] = useState(true)
  const [procesado, setProcesado] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  const paymentId = searchParams.get('payment_id')
  const status = searchParams.get('status')
  const externalReference = searchParams.get('external_reference')
  const merchantOrderId = searchParams.get('merchant_order_id')

  useEffect(() => {
    const procesarPago = async () => {
      if (!paymentId) {
        toast.error('ID de pago no encontrado')
        setLoading(false)
        return
      }

      try {
        // Dar tiempo para que el webhook procese el pago
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // Verificar el estado del pago
        const response = await fetch(`/api/suscripciones/verificar-pago?payment_id=${paymentId}`)
        const data = await response.json()

        if (response.ok) {
          setProcesado(true)
          toast.success('¡Pago procesado exitosamente!')
        } else {
          toast.error('Error verificando el pago')
        }
      } catch (error) {
        console.error('Error procesando pago:', error)
        toast.error('Error de conexión')
      } finally {
        setLoading(false)
      }
    }

    procesarPago()
  }, [paymentId])

  const formatearFecha = (fecha: Date) => {
    return fecha.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const calcularVencimiento = () => {
    const hoy = new Date()
    hoy.setMonth(hoy.getMonth() + 1)
    return hoy
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 p-3 bg-green-100 dark:bg-green-900 rounded-full w-fit">
            {loading ? (
              <Loader2 className="h-12 w-12 text-green-600 animate-spin" />
            ) : (
              <CheckCircle className="h-12 w-12 text-green-600" />
            )}
          </div>
          
          <CardTitle className="text-2xl text-green-700 dark:text-green-300">
            {loading ? 'Procesando Pago...' : '¡Pago Exitoso!'}
          </CardTitle>
          
          <p className="text-muted-foreground mt-2">
            {loading 
              ? 'Estamos verificando tu pago con MercadoPago'
              : 'Tu suscripción ha sido activada correctamente'
            }
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Detalles del pago */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Detalles del Pago
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">ID de Pago:</span>
                <p className="font-mono">{paymentId || 'Cargando...'}</p>
              </div>
              
              <div>
                <span className="text-muted-foreground">Estado:</span>
                <p className="capitalize text-green-600">{status === 'approved' ? 'Aprobado' : status}</p>
              </div>
              
              {externalReference && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Referencia:</span>
                  <p className="font-mono text-xs">{externalReference}</p>
                </div>
              )}
            </div>
          </div>

          {/* Información de la suscripción */}
          {procesado && (
            <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                Tu Suscripción Premium
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Plan Activado:</span>
                  <span className="font-medium">Plan Premium</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Válido hasta:</span>
                  <span className="font-medium">{formatearFecha(calcularVencimiento())}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Próximo cobro:</span>
                  <span className="font-medium">{formatearFecha(calcularVencimiento())}</span>
                </div>
              </div>
            </div>
          )}

          {/* Beneficios desbloqueados */}
          {procesado && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                Funcionalidades Desbloqueadas
              </h3>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Transacciones ilimitadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>IA financiera avanzada</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Modo familiar completo</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Alertas automáticas</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Préstamos e inversiones</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Exportación avanzada</span>
                </div>
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={() => router.push('/dashboard')} 
              className="flex-1"
              disabled={loading}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Ir al Dashboard
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/suscripcion')}
              disabled={loading}
            >
              Ver Mi Suscripción
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SuscripcionExitoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <SuscripcionExitoContent />
    </Suspense>
  )
} 