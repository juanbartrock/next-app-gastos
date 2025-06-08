'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { CheckCircle, XCircle, Gift, Crown, AlertTriangle } from "lucide-react"

export default function TestPromoPage() {
  const [codigo, setCodigo] = useState("")
  const [validacion, setValidacion] = useState(null)
  const [aplicando, setAplicando] = useState(false)
  const [verificando, setVerificando] = useState(false)

  const verificarCodigo = async () => {
    if (!codigo.trim()) return

    setVerificando(true)
    setValidacion(null)

    try {
      const response = await fetch(`/api/codigos-promocionales/validar?codigo=${codigo.trim()}`)
      const data = await response.json()
      
      setValidacion(data)
    } catch (error) {
      setValidacion({
        valido: false,
        error: 'Error de conexión'
      })
    } finally {
      setVerificando(false)
    }
  }

  const aplicarCodigo = async () => {
    if (!codigo.trim()) return

    setAplicando(true)

    try {
      const response = await fetch('/api/codigos-promocionales/validar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ codigo: codigo.trim() })
      })

      const data = await response.json()
      setValidacion(data)

      if (data.aplicado) {
        // Recargar la página después de 3 segundos para mostrar el nuevo plan
        setTimeout(() => {
          window.location.reload()
        }, 3000)
      }
    } catch (error) {
      setValidacion({
        valido: false,
        aplicado: false,
        error: 'Error de conexión'
      })
    } finally {
      setAplicando(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Gift className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">🎁 Códigos Promocionales</h1>
          <p className="text-muted-foreground">
            Prueba el sistema de códigos promocionales para obtener planes premium
          </p>
        </div>
      </div>

      {/* Códigos de prueba disponibles */}
      <Card>
        <CardHeader>
          <CardTitle>📝 Códigos de Prueba Disponibles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">Plan Premium</Badge>
                <Crown className="h-4 w-4 text-yellow-600" />
              </div>
              <p className="font-mono font-bold text-lg">PREMIUM2025</p>
              <p className="text-sm text-muted-foreground">
                Plan Premium gratuito por 6 meses
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">0/100 usos</Badge>
                <Badge variant="secondary" className="text-xs">Vence 31/12/2025</Badge>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-950">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">Premium Lifetime</Badge>
                <Crown className="h-4 w-4 text-purple-600" />
              </div>
              <p className="font-mono font-bold text-lg">LIFETIME_VIP</p>
              <p className="text-sm text-muted-foreground">
                Plan Premium de por vida - Solo VIPs
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">0/50 usos</Badge>
                <Badge variant="secondary" className="text-xs">Vence 30/6/2025</Badge>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">Plan Básico</Badge>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <p className="font-mono font-bold text-lg">BASICO50</p>
              <p className="text-sm text-muted-foreground">
                Plan Básico con 50% descuento por 3 meses
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">0/200 usos</Badge>
                <Badge variant="secondary" className="text-xs">Vence 31/12/2025</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulario para probar códigos */}
      <Card>
        <CardHeader>
          <CardTitle>🧪 Probar Código Promocional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="space-y-2">
            <Label htmlFor="codigo">Código Promocional</Label>
            <div className="flex gap-2">
              <Input
                id="codigo"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="Ej: PREMIUM2025"
                className="font-mono"
                disabled={aplicando}
              />
              <Button 
                onClick={verificarCodigo} 
                variant="outline"
                disabled={!codigo.trim() || verificando || aplicando}
              >
                {verificando ? 'Verificando...' : 'Verificar'}
              </Button>
            </div>
          </div>

          {/* Resultado de la validación */}
          {validacion && (
            <div className="space-y-3">
              
              {validacion.valido ? (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="space-y-2">
                    <div className="font-semibold text-green-800 dark:text-green-200">
                      ✅ Código válido: {validacion.planNombre}
                    </div>
                    {validacion.descripcion && (
                      <p className="text-sm">{validacion.descripcion}</p>
                    )}
                    <div className="flex gap-2 text-sm">
                      {validacion.duracionMeses && (
                        <Badge variant="outline">
                          {validacion.duracionMeses} meses
                        </Badge>
                      )}
                      {validacion.esPermanente && (
                        <Badge variant="outline" className="bg-purple-100 text-purple-800">
                          Permanente
                        </Badge>
                      )}
                      {validacion.usosRestantes !== null && (
                        <Badge variant="outline">
                          {validacion.usosRestantes === null ? '∞' : validacion.usosRestantes} usos restantes
                        </Badge>
                      )}
                    </div>
                    
                    {!validacion.aplicado && (
                      <Button 
                        onClick={aplicarCodigo}
                        className="mt-3 gap-2"
                        disabled={aplicando}
                      >
                        {aplicando ? 'Aplicando...' : 'Aplicar Código'}
                        <Gift className="h-4 w-4" />
                      </Button>
                    )}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription>
                    <div className="font-semibold text-red-800 dark:text-red-200">
                      ❌ Código inválido
                    </div>
                    <p className="text-sm">{validacion.error}</p>
                  </AlertDescription>
                </Alert>
              )}

              {/* Mensaje de éxito después de aplicar */}
              {validacion.aplicado && (
                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                  <Crown className="h-4 w-4 text-blue-600" />
                  <AlertDescription>
                    <div className="font-semibold text-blue-800 dark:text-blue-200">
                      🎉 ¡Código aplicado exitosamente!
                    </div>
                    <p className="text-sm">{validacion.mensaje}</p>
                    <div className="mt-2 text-sm space-y-1">
                      <p><strong>Plan:</strong> {validacion.detalles?.planNombre}</p>
                      {validacion.detalles?.duracionMeses && (
                        <p><strong>Duración:</strong> {validacion.detalles.duracionMeses} meses</p>
                      )}
                      {validacion.detalles?.fechaVencimiento && (
                        <p><strong>Vencimiento:</strong> {new Date(validacion.detalles.fechaVencimiento).toLocaleDateString()}</p>
                      )}
                    </div>
                    <p className="text-xs mt-2 text-muted-foreground">
                      La página se recargará automáticamente en 3 segundos...
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

        </CardContent>
      </Card>

      {/* Instrucciones */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Instrucciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><strong>1. Copia uno de los códigos de prueba</strong> de la sección de arriba</p>
            <p><strong>2. Pégalo en el campo</strong> y presiona "Verificar" para validar</p>
            <p><strong>3. Si es válido, presiona "Aplicar Código"</strong> para activar el plan</p>
            <p><strong>4. Tu plan se actualizará automáticamente</strong> y tendrás acceso a las nuevas funcionalidades</p>
          </div>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Nota:</strong> Cada código solo puede ser usado una vez por usuario. 
              Los códigos tienen fechas de vencimiento y límites de uso.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
} 