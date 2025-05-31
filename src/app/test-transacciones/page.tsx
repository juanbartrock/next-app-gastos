"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Banknote, Send } from "lucide-react"

export default function TestTransaccionesPage() {
  const [resultados, setResultados] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Test Extracción de Cajero
  const testExtraccionCajero = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/transacciones/extraccion-cajero', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monto: 10000,
          fecha: new Date().toISOString(),
          descripcion: "Prueba de extracción de cajero"
        }),
      })

      const data = await response.json()
      
      setResultados(prev => [...prev, {
        tipo: 'extraccion-cajero',
        success: response.ok,
        data: data,
        timestamp: new Date().toLocaleTimeString()
      }])

    } catch (error) {
      setResultados(prev => [...prev, {
        tipo: 'extraccion-cajero',
        success: false,
        error: error?.toString(),
        timestamp: new Date().toLocaleTimeString()
      }])
    } finally {
      setLoading(false)
    }
  }

  // Test Transferencia Externa
  const testTransferenciaExterna = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/transacciones/transferir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monto: 5000,
          tipoTransferencia: 'externa',
          destinatarioNombre: 'Juan Pérez',
          concepto: 'Pago de servicio de prueba',
          tipoMovimiento: 'digital',
          fecha: new Date().toISOString()
        }),
      })

      const data = await response.json()
      
      setResultados(prev => [...prev, {
        tipo: 'transferencia-externa',
        success: response.ok,
        data: data,
        timestamp: new Date().toLocaleTimeString()
      }])

    } catch (error) {
      setResultados(prev => [...prev, {
        tipo: 'transferencia-externa',
        success: false,
        error: error?.toString(),
        timestamp: new Date().toLocaleTimeString()
      }])
    } finally {
      setLoading(false)
    }
  }

  // Test obtener usuarios para transferencia interna
  const testObtenerUsuarios = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/transacciones/transferir')
      const data = await response.json()
      
      setResultados(prev => [...prev, {
        tipo: 'obtener-usuarios',
        success: response.ok,
        data: data,
        timestamp: new Date().toLocaleTimeString()
      }])

    } catch (error) {
      setResultados(prev => [...prev, {
        tipo: 'obtener-usuarios',
        success: false,
        error: error?.toString(),
        timestamp: new Date().toLocaleTimeString()
      }])
    } finally {
      setLoading(false)
    }
  }

  const limpiarResultados = () => {
    setResultados([])
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🧪 Test de Nuevas Funcionalidades</h1>
        <p className="text-muted-foreground">
          Prueba las nuevas funcionalidades de extracción de cajero y transferencias
        </p>
      </div>

      {/* Botones de Prueba */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-blue-600" />
              Extracción Cajero
            </CardTitle>
            <CardDescription>
              Prueba la extracción de $10,000
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testExtraccionCajero} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Procesando..." : "Probar Extracción"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-green-600" />
              Transferencia Externa
            </CardTitle>
            <CardDescription>
              Prueba transferencia de $5,000
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testTransferenciaExterna} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Procesando..." : "Probar Transferencia"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-purple-600" />
              Obtener Usuarios
            </CardTitle>
            <CardDescription>
              Lista usuarios para transferencias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testObtenerUsuarios} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Cargando..." : "Obtener Usuarios"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <div className="mb-6">
        <Button variant="outline" onClick={limpiarResultados}>
          Limpiar Resultados
        </Button>
      </div>

      {/* Resultados */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Resultados de Pruebas</h2>
        
        {resultados.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No hay resultados aún. Haz clic en algún botón de prueba para empezar.
            </AlertDescription>
          </Alert>
        )}

        {resultados.map((resultado, index) => (
          <Alert 
            key={index} 
            className={resultado.success 
              ? "border-green-200 bg-green-50 dark:bg-green-950" 
              : "border-red-200 bg-red-50 dark:bg-red-950"
            }
          >
            <CheckCircle className={`h-4 w-4 ${resultado.success ? 'text-green-600' : 'text-red-600'}`} />
            <AlertDescription>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium capitalize">
                    {resultado.tipo.replace('-', ' ')} - {resultado.timestamp}
                  </span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    resultado.success 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {resultado.success ? 'ÉXITO' : 'ERROR'}
                  </span>
                </div>
                
                {resultado.success && resultado.data && (
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border text-xs">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(resultado.data, null, 2)}
                    </pre>
                  </div>
                )}
                
                {!resultado.success && resultado.error && (
                  <div className="bg-red-100 dark:bg-red-900 p-3 rounded border text-xs text-red-800 dark:text-red-200">
                    <strong>Error:</strong> {resultado.error}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        ))}
      </div>
    </div>
  )
} 