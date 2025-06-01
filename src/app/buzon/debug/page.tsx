"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, FileCheck, Bug } from "lucide-react"
import { toast } from "sonner"

export default function BuzonDebugPage() {
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<any>(null)

  // Base64 de prueba simplificado (imagen pequeña de 1x1 pixel)
  const BASE64_PRUEBA = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGAAAAAAElFTkSuQmCC"

  const probarUpload = async () => {
    setLoading(true)
    setResultado(null)

    try {
      console.log("[DEBUG] Iniciando test de upload")

      const response = await fetch('/api/buzon/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          archivos: [{
            nombre: "test_transferencia_debug.png",
            contenido: `data:image/png;base64,${BASE64_PRUEBA}`,
            tamaño: 100
          }]
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${JSON.stringify(data)}`)
      }

      console.log("[DEBUG] Upload exitoso:", data)
      setResultado(data)
      toast.success("Upload de debug exitoso")

    } catch (error) {
      console.error('[DEBUG] Error:', error)
      setResultado({ error: String(error) })
      toast.error(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const probarProcesamiento = async () => {
    if (!resultado?.exitosos?.[0]?.archivoId) {
      toast.error("Primero ejecuta el upload")
      return
    }

    setLoading(true)

    try {
      console.log("[DEBUG] Iniciando test de procesamiento")

      const response = await fetch('/api/buzon/confirmar-lote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comprobantesIds: [resultado.exitosos[0].archivoId],
          accion: 'procesar_lote'
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${JSON.stringify(data)}`)
      }

      console.log("[DEBUG] Procesamiento exitoso:", data)
      setResultado({ ...resultado, procesamiento: data })
      toast.success("Procesamiento de debug exitoso")

    } catch (error) {
      console.error('[DEBUG] Error en procesamiento:', error)
      setResultado({ ...resultado, error: String(error) })
      toast.error(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const probarListado = async () => {
    setLoading(true)

    try {
      console.log("[DEBUG] Iniciando test de listado")

      const response = await fetch('/api/buzon/comprobantes?estado=todos&limite=10')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${JSON.stringify(data)}`)
      }

      console.log("[DEBUG] Listado exitoso:", data)
      setResultado({ listado: data })
      toast.success("Listado de debug exitoso")

    } catch (error) {
      console.error('[DEBUG] Error en listado:', error)
      setResultado({ error: String(error) })
      toast.error(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Bug className="h-6 w-6" />
        <h1 className="text-2xl font-bold">🔧 Buzón Debug</h1>
      </div>

      <Alert>
        <AlertDescription>
          Página de debug para probar las APIs del buzón paso a paso con datos controlados.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          onClick={probarUpload}
          disabled={loading}
          className="h-24 flex flex-col items-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <FileCheck className="h-6 w-6" />
          )}
          <span>1. Test Upload</span>
        </Button>

        <Button 
          onClick={probarProcesamiento}
          disabled={loading || !resultado?.exitosos?.[0]}
          className="h-24 flex flex-col items-center gap-2"
          variant="secondary"
        >
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <FileCheck className="h-6 w-6" />
          )}
          <span>2. Test Procesamiento</span>
        </Button>

        <Button 
          onClick={probarListado}
          disabled={loading}
          className="h-24 flex flex-col items-center gap-2"
          variant="outline"
        >
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <FileCheck className="h-6 w-6" />
          )}
          <span>3. Test Listado</span>
        </Button>
      </div>

      {resultado && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado Debug</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-xs overflow-auto">
              {JSON.stringify(resultado, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 