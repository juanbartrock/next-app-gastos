'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, CreditCard, ArrowLeft, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

function SuscripcionPendienteContent() {
  const [verificando, setVerificando] = useState(false)
  const [estado, setEstado] = useState<'pending' | 'approved' | 'rejected' | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  const paymentId = searchParams.get('payment_id')
  const status = searchParams.get('status')
  const externalReference = searchParams.get('external_reference')

  useEffect(() => {
    if (paymentId) {
      // Verificar estado cada 10 segundos
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/suscripciones/verificar-pago?payment_id=${paymentId}`)
          const data = await response.json()
          
          if (data.status !== 'pending') {
            setEstado(data.status)
            clearInterval(interval)
            
            // Redirigir según el resultado
            if (data.status === 'approved') {
              toast.success('¡Pago aprobado!')
              setTimeout(() => router.push('/suscripcion/exito?payment_id=' + paymentId), 1500)
            } else if (data.status === 'rejected') {
              toast.error('Pago rechazado')
              setTimeout(() => router.push('/suscripcion/fallo?payment_id=' + paymentId), 1500)
            }
          }
        } catch (error) {
          console.error('Error verificando estado:', error)
        }
      }, 10000)

      return () => clearInterval(interval)
    }
  }, [paymentId, router])

  const verificarManualmente = async () => {
    if (!paymentId) return
    
    setVerificando(true)
    try {
      const response = await fetch(`/api/suscripciones/verificar-pago?payment_id=${paymentId}`)
      const data = await response.json()
      
      setEstado(data.status)
      
      if (data.status === 'approved') {
        toast.success('¡Pago aprobado!')
        router.push('/suscripcion/exito?payment_id=' + paymentId)
      } else if (data.status === 'rejected') {
        toast.error('Pago rechazado')
        router.push('/suscripcion/fallo?payment_id=' + paymentId)
      } else {
        toast.info('El pago aún está siendo procesado')
      }
    } catch (error) {
      console.error('Error verificando pago:', error)
      toast.error('Error verificando el estado del pago')
    } finally {
      setVerificando(false)
    }
  }

  const obtenerMensajePendiente = () => {
    return 'Tu pago está siendo procesado. Esto puede tomar unos minutos.'
  }

  const obtenerInstrucciones = () => {
    return [
      'No cierres esta ventana mientras procesamos tu pago',
      'Te notificaremos automáticamente cuando el pago sea confirmado',
      'Si pagaste en efectivo, el procesamiento puede tomar hasta 3 días hábiles',
      'Recibirás un email de confirmación una vez aprobado el pago'
    ]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full w-fit">
            {estado === 'approved' ? (
              <CheckCircle className="h-12 w-12 text-green-600" />
            ) : estado === 'rejected' ? (
              <AlertTriangle className="h-12 w-12 text-red-600" />
            ) : (
              <Clock className="h-12 w-12 text-yellow-600 animate-pulse" />
            )}
          </div>
          
          <CardTitle className="text-2xl text-yellow-700 dark:text-yellow-300">
            {estado === 'approved' ? '¡Pago Aprobado!' : 
             estado === 'rejected' ? 'Pago Rechazado' : 
             'Procesando Pago...'}
          </CardTitle>
          
          <p className="text-muted-foreground mt-2">
            {estado === 'approved' ? 'Tu suscripción está siendo activada' :
             estado === 'rejected' ? 'Hubo un problema con tu pago' :
             obtenerMensajePendiente()}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Estado actual */}
          <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
            <Clock className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              {estado === null || estado === 'pending' ? (
                <>
                  <strong>Tu pago está siendo verificado</strong>
                  <br />
                  <span className="text-sm">Estamos validando la información con tu banco. Este proceso es automático y suele tardar solo unos minutos.</span>
                </>
              ) : estado === 'approved' ? (
                <>
                  <strong>¡Pago confirmado!</strong>
                  <br />
                  <span className="text-sm">Serás redirigido automáticamente a la página de confirmación.</span>
                </>
              ) : (
                <>
                  <strong>Pago no procesado</strong>
                  <br />
                  <span className="text-sm">Serás redirigido a los detalles del error.</span>
                </>
              )}
            </AlertDescription>
          </Alert>

          {/* Detalles del pago */}
          {paymentId && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Detalles del Pago
              </h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">ID de Pago:</span>
                  <p className="font-mono">{paymentId}</p>
                </div>
                
                <div>
                  <span className="text-muted-foreground">Estado:</span>
                  <p className="capitalize text-yellow-600">
                    {estado === 'approved' ? 'Aprobado' :
                     estado === 'rejected' ? 'Rechazado' :
                     'En proceso'}
                  </p>
                </div>
                
                {externalReference && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Referencia:</span>
                    <p className="font-mono text-xs">{externalReference}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instrucciones */}
          {(estado === null || estado === 'pending') && (
            <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold">Mientras esperas...</h3>
              
              <ul className="space-y-2 text-sm">
                {obtenerInstrucciones().map((instruccion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{instruccion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Timeline de procesamiento */}
          {(estado === null || estado === 'pending') && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
              <h3 className="font-semibold mb-3">Proceso de Validación</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm">Pago iniciado</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Clock className="h-3 w-3 text-white animate-pulse" />
                  </div>
                  <span className="text-sm">Validando con el banco...</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-xs text-gray-600">3</span>
                  </div>
                  <span className="text-sm text-gray-500">Activación de suscripción</span>
                </div>
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={verificarManualmente}
              variant="outline"
              disabled={verificando || estado !== null}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${verificando ? 'animate-spin' : ''}`} />
              Verificar Estado
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
          </div>

          {/* Información adicional */}
          <div className="text-center text-sm text-muted-foreground pt-4 border-t">
            ¿El pago no se procesa? Contacta a{' '}
            <a href="mailto:soporte@app-gastos.com" className="text-blue-600 hover:underline">
              soporte técnico
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SuscripcionPendientePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <SuscripcionPendienteContent />
    </Suspense>
  )
} 