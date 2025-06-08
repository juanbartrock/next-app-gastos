'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { XCircle, CreditCard, ArrowLeft, RefreshCw, AlertTriangle, HelpCircle } from "lucide-react"
import { toast } from "sonner"

function SuscripcionFalloContent() {
  const [intentando, setIntentando] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  const paymentId = searchParams.get('payment_id')
  const status = searchParams.get('status')
  const statusDetail = searchParams.get('status_detail')
  const externalReference = searchParams.get('external_reference')

  useEffect(() => {
    // Registrar el intento fallido
    const registrarFallo = async () => {
      if (paymentId) {
        try {
          await fetch('/api/suscripciones/registrar-fallo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentId,
              status,
              statusDetail,
              externalReference
            })
          })
        } catch (error) {
          console.error('Error registrando fallo:', error)
        }
      }
    }

    registrarFallo()
  }, [paymentId, status, statusDetail, externalReference])

  const obtenerMensajeError = () => {
    switch (statusDetail) {
      case 'cc_rejected_insufficient_amount':
        return 'Fondos insuficientes en tu tarjeta'
      case 'cc_rejected_bad_filled_security_code':
        return 'Código de seguridad incorrecto'
      case 'cc_rejected_bad_filled_date':
        return 'Fecha de vencimiento incorrecta'
      case 'cc_rejected_bad_filled_other':
        return 'Revisa los datos de tu tarjeta'
      case 'cc_rejected_blacklist':
        return 'Tarjeta no autorizada'
      case 'cc_rejected_call_for_authorize':
        return 'Contacta a tu banco para autorizar el pago'
      case 'cc_rejected_card_disabled':
        return 'Tu tarjeta está deshabilitada'
      case 'cc_rejected_duplicated_payment':
        return 'Ya existe un pago similar'
      case 'cc_rejected_high_risk':
        return 'El pago fue rechazado por seguridad'
      case 'cc_rejected_max_attempts':
        return 'Superaste el límite de intentos'
      default:
        return 'El pago no pudo ser procesado'
    }
  }

  const obtenerSolucion = () => {
    switch (statusDetail) {
      case 'cc_rejected_insufficient_amount':
        return 'Verifica que tengas suficiente saldo o límite disponible'
      case 'cc_rejected_bad_filled_security_code':
      case 'cc_rejected_bad_filled_date':
      case 'cc_rejected_bad_filled_other':
        return 'Revisa cuidadosamente todos los datos de tu tarjeta'
      case 'cc_rejected_blacklist':
      case 'cc_rejected_card_disabled':
        return 'Intenta con otra tarjeta o contacta a tu banco'
      case 'cc_rejected_call_for_authorize':
        return 'Llama a tu banco para autorizar pagos online'
      case 'cc_rejected_duplicated_payment':
        return 'Espera unos minutos antes de volver a intentar'
      case 'cc_rejected_high_risk':
        return 'Intenta con otro medio de pago o contacta a soporte'
      case 'cc_rejected_max_attempts':
        return 'Espera 24 horas antes del próximo intento'
      default:
        return 'Intenta nuevamente o usa otro medio de pago'
    }
  }

  const reintentar = () => {
    setIntentando(true)
    // Redirigir a la página de planes para intentar nuevamente
    router.push('/planes?retry=true')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 p-3 bg-red-100 dark:bg-red-900 rounded-full w-fit">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
          
          <CardTitle className="text-2xl text-red-700 dark:text-red-300">
            Pago No Procesado
          </CardTitle>
          
          <p className="text-muted-foreground mt-2">
            Tu pago no pudo ser completado. Pero no te preocupes, puedes intentar nuevamente.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Detalles del error */}
          <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <strong>{obtenerMensajeError()}</strong>
              <br />
              <span className="text-sm">{obtenerSolucion()}</span>
            </AlertDescription>
          </Alert>

          {/* Detalles técnicos */}
          {paymentId && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Detalles del Intento
              </h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">ID de Pago:</span>
                  <p className="font-mono">{paymentId}</p>
                </div>
                
                <div>
                  <span className="text-muted-foreground">Estado:</span>
                  <p className="capitalize text-red-600">{status === 'rejected' ? 'Rechazado' : status}</p>
                </div>
                
                {statusDetail && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Detalle:</span>
                    <p className="text-xs">{statusDetail}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recomendaciones */}
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              ¿Qué puedes hacer?
            </h3>
            
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Verifica que los datos de tu tarjeta sean correctos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Asegúrate de tener fondos suficientes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Intenta con otra tarjeta de crédito o débito</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Contacta a tu banco si el problema persiste</span>
              </li>
            </ul>
          </div>

          {/* Medios de pago alternativos */}
          <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Medios de Pago Disponibles</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>✅ Visa</div>
              <div>✅ Mastercard</div>
              <div>✅ American Express</div>
              <div>✅ Visa Débito</div>
              <div>✅ Mastercard Débito</div>
              <div>✅ PagoFácil</div>
              <div>✅ RapiPago</div>
              <div>✅ Dinero en cuenta MP</div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={reintentar}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={intentando}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${intentando ? 'animate-spin' : ''}`} />
              Intentar Nuevamente
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
          </div>

          {/* Soporte */}
          <div className="text-center text-sm text-muted-foreground pt-4 border-t">
            ¿Necesitas ayuda? Contacta a nuestro{' '}
            <a href="mailto:soporte@app-gastos.com" className="text-blue-600 hover:underline">
              equipo de soporte
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SuscripcionFalloPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <SuscripcionFalloContent />
    </Suspense>
  )
} 