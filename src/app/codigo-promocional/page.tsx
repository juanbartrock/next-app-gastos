'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Gift, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
// import { toast } from 'react-hot-toast' // Comentado temporalmente

export default function CodigoPromocionalPage() {
  const [codigo, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const router = useRouter()

  const canjearCodigo = async () => {
    if (!codigo.trim()) {
      alert('Por favor ingresa un código') // Usar alert temporalmente
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/codigos-promocionales/canjear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: codigo.trim().toUpperCase() })
      })

      const data = await response.json()

      if (response.ok) {
        setResultado(data)
        // Redirigir al dashboard después de 3 segundos
        setTimeout(() => router.push('/dashboard'), 3000)
      } else {
        // Mostrar mensajes específicos según el tipo de error
        switch (data.codigo) {
          case 'CODIGO_INVALIDO':
            alert('El código ingresado no existe')
            break
          case 'CODIGO_INACTIVO':
            alert('Este código ya no está disponible')
            break
          case 'CODIGO_EXPIRADO':
            alert('Este código ha expirado')
            break
          case 'CODIGO_YA_USADO':
            alert('Ya has usado este código anteriormente')
            break
          case 'CODIGO_AGOTADO':
            alert('Este código ha alcanzado su límite de usos')
            break
          default:
            alert(data.error || 'Error al canjear código')
        }
      }
    } catch (error) {
      alert('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      canjearCodigo()
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <Gift className="h-12 w-12 mx-auto text-purple-600 mb-2" />
          <CardTitle className="text-2xl">Código Promocional</CardTitle>
          <p className="text-sm text-muted-foreground">
            ¿Tienes un código especial? Canjealo aquí
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!resultado ? (
            <>
              <div>
                <Input
                  placeholder="INGRESA-TU-CODIGO"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  className="text-center font-mono text-lg tracking-wider"
                  maxLength={20}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  Los códigos no distinguen entre mayúsculas y minúsculas
                </p>
              </div>
              <Button 
                onClick={canjearCodigo}
                disabled={loading || !codigo.trim()}
                className="w-full gap-2"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Canjeando...
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4" />
                    Canjear Código
                  </>
                )}
              </Button>
            </>
          ) : (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <div className="space-y-2">
                  <p className="font-semibold">{resultado.mensaje}</p>
                  {resultado.descripcion && (
                    <p className="text-sm">{resultado.descripcion}</p>
                  )}
                  <div className="bg-green-100 dark:bg-green-900 p-2 rounded text-xs">
                    <p><strong>Plan anterior:</strong> {resultado.planAnterior}</p>
                    <p><strong>Plan nuevo:</strong> {resultado.planNuevo}</p>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Redirigiendo al dashboard en 3 segundos...
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Información adicional */}
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              ¿No tienes un código? {' '}
              <button 
                onClick={() => router.push('/planes')}
                className="text-purple-600 hover:underline"
              >
                Ver planes disponibles
              </button>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Información sobre códigos promocionales */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">💡 Sobre los Códigos Promocionales</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Los códigos pueden darte acceso a planes premium</p>
          <p>• Cada código solo puede usarse una vez por usuario</p>
          <p>• Algunos códigos tienen fecha de vencimiento</p>
          <p>• Los cambios de plan son inmediatos</p>
        </CardContent>
      </Card>
    </div>
  )
} 