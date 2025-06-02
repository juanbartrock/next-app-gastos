"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, CheckCircle, AlertCircle, Clock, Calendar, DollarSign } from "lucide-react"

export default function TestRecurrentesPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const gastosRecurrentesPrueba = [
    {
      concepto: "Alquiler - MARTA BEATRIZ BUFFA",
      monto: 757500,
      periodicidad: "mensual",
      comentario: "Alquiler mensual",
      tipoMovimiento: "digital",
      proximaFecha: "2025-02-01"
    },
    {
      concepto: "Pago a CEREZO HERNAN JOSE",
      monto: 757500,
      periodicidad: "mensual", 
      comentario: "Pago mensual",
      tipoMovimiento: "digital",
      proximaFecha: "2025-02-01"
    },
    {
      concepto: "Transferencia a GUZMAN BRENDA ANTONELA",
      monto: 140352,
      periodicidad: "mensual",
      comentario: "Pago mensual",
      tipoMovimiento: "digital", 
      proximaFecha: "2025-02-01"
    }
  ]

  const crearTodos = async () => {
    setLoading(true)
    
    try {
      for (const gasto of gastosRecurrentesPrueba) {
        const response = await fetch('/api/recurrentes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(gasto)
        })
        
        if (!response.ok) {
          throw new Error(`Error creando ${gasto.concepto}`)
        }
        
        console.log(`✅ Creado: ${gasto.concepto}`)
      }
      
      toast.success("✅ Todos los gastos recurrentes creados correctamente")
      
    } catch (error) {
      console.error('Error:', error)
      toast.error(`❌ Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testGenerarPago = async () => {
    setLoading(true)
    try {
      // Primero obtenemos la lista de recurrentes
      const response = await fetch('/api/recurrentes')
      if (!response.ok) throw new Error('Error al obtener recurrentes')
      
      const recurrentes = await response.json()
      
      if (recurrentes.length === 0) {
        toast.error('No hay gastos recurrentes para probar')
        return
      }

      // Tomamos el primer recurrente para la prueba
      const primerRecurrente = recurrentes[0]
      
      const genResponse = await fetch(`/api/recurrentes/${primerRecurrente.id}/generar-pago`, {
        method: 'POST'
      })
      
      if (genResponse.ok) {
        const resultado = await genResponse.json()
        toast.success('¡Pago generado exitosamente!')
        setResults(resultado)
      } else {
        const error = await genResponse.json()
        toast.error(error.error || 'Error al generar pago')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al probar generar pago')
    } finally {
      setLoading(false)
    }
  }

  const testEstadosAutomaticos = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/recurrentes/estado-automatico')
      
      if (response.ok) {
        const resultado = await response.json()
        toast.success(`Estados actualizados: ${resultado.stats.actualizados} cambios`)
        setResults(resultado)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al actualizar estados')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al probar estados automáticos')
    } finally {
      setLoading(false)
    }
  }

  const testListaConRelaciones = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/recurrentes')
      
      if (response.ok) {
        const recurrentes = await response.json()
        toast.success(`Cargados ${recurrentes.length} gastos recurrentes`)
        setResults(recurrentes)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al cargar lista')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al probar lista con relaciones')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🧪 Test Gastos Recurrentes Mejorados
          </h1>
        </div>

        {/* Botones de prueba */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Generar Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Genera un pago real desde un gasto recurrente y establece la relación padre-hijo. El tipo de movimiento se hereda del recurrente.
              </p>
              <Button 
                onClick={testGenerarPago}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  'Probar Generar Pago'
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Estados Automáticos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Calcula automáticamente los estados basado en pagos realizados y fechas.
              </p>
              <Button 
                onClick={testEstadosAutomaticos}
                disabled={loading}
                variant="secondary"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calculando...
                  </>
                ) : (
                  'Actualizar Estados'
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Lista con Relaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Carga la lista de recurrentes incluyendo los gastos generados.
              </p>
              <Button 
                onClick={testListaConRelaciones}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  'Cargar Lista'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Resultados */}
        {results && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Resultados de la Prueba
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto max-h-96 text-sm">
                {JSON.stringify(results, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Información sobre las mejoras */}
        <Card className="w-full mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              Nuevas Funcionalidades Implementadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-green-600 mb-2">✅ Relación Padre-Hijo</h3>
                <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• Campo <code>gastoRecurrenteId</code> en modelo Gasto</li>
                  <li>• Campo <code>gastosGenerados</code> en modelo GastoRecurrente</li>
                  <li>• Campo <code>tipoMovimiento</code> heredado del recurrente</li>
                  <li>• Relación bidireccional funcionando</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-green-600 mb-2">✅ Estados Automáticos</h3>
                <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• <span className="bg-green-100 px-1 rounded">Pagado</span>: Tiene gasto generado</li>
                  <li>• <span className="bg-red-100 px-1 rounded">Pendiente</span>: Pasó fecha sin pago</li>
                  <li>• <span className="bg-orange-100 px-1 rounded">Próximo</span>: Vence en 7 días</li>
                  <li>• <span className="bg-blue-100 px-1 rounded">Programado</span>: Fecha futura</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-green-600 mb-2">✅ APIs Nuevas</h3>
                <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• <code>POST /api/recurrentes/[id]/generar-pago</code></li>
                  <li>• <code>GET /api/recurrentes/estado-automatico</code></li>
                  <li>• <code>POST /api/recurrentes/estado-automatico</code></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-green-600 mb-2">✅ UI Mejorada</h3>
                <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• Botón "Generar Pago" en tabla</li>
                  <li>• Botón "Actualizar Estados" en header</li>
                  <li>• Estados visuales con colores</li>
                  <li>• Contador de pagos generados</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full mt-6">
          <CardHeader>
            <CardTitle>🧪 Crear Gastos Recurrentes de Prueba</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Esto creará gastos recurrentes que coinciden con los comprobantes que procesaste:
            </p>
            
            <div className="space-y-2">
              {gastosRecurrentesPrueba.map((gasto, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <p className="font-medium">{gasto.concepto}</p>
                  <p className="text-sm text-muted-foreground">
                    ${gasto.monto.toLocaleString()} • {gasto.periodicidad}
                  </p>
                </div>
              ))}
            </div>
            
            <Button 
              onClick={crearTodos} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Creando..." : "✨ Crear Todos los Gastos Recurrentes"}
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Después de esto, ve al buzón y procesa los comprobantes de nuevo para ver las sugerencias.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 