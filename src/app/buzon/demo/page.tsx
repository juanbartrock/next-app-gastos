"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { 
  FileImage, 
  Download, 
  Eye, 
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Info
} from "lucide-react"
import { toast } from "sonner"

// Datos de ejemplo para demostración
const EJEMPLOS_TRANSFERENCIAS = [
  {
    nombre: "transferencia_ciudad_757500.jpg",
    descripcion: "Transferencia Banco Ciudad $757.500 a MARTA BEATRIZ BUFFA",
    datosEsperados: {
      monto: 757500.00,
      banco: "Banco Ciudad",
      destino: "MARTA BEATRIZ,BUFFA",
      cbu: "01403792036624505468607",
      alias: "CURVA.CHOFER.FIDEO",
      operacion: "00154743",
      fecha: "01/06/2025 - 12:46:23 Hs."
    }
  },
  {
    nombre: "transferencia_ciudad_140352.jpg", 
    descripcion: "Transferencia Banco Ciudad $140.352 a GUZMAN BRENDA ANTONELA",
    datosEsperados: {
      monto: 140352.00,
      banco: "Banco Ciudad",
      destino: "GUZMAN BRENDA ANTONELA",
      cbu: "007015833000403411855",
      alias: "BREN.CATA.MATE",
      operacion: "00164055",
      fecha: "01/06/2025 - 12:49:31 Hs."
    }
  },
  {
    nombre: "transferencia_ciudad_cerezo.jpg",
    descripcion: "Transferencia Banco Ciudad $757.500 a CEREZO HERNAN JOSE",
    datosEsperados: {
      monto: 757500.00,
      banco: "Banco Ciudad", 
      destino: "CEREZO HERNAN JOSE",
      cbu: "01102675300267068907779",
      alias: "patin.fila.coto",
      operacion: "00159202",
      fecha: "01/06/2025 - 12:47:25 Hs."
    }
  }
]

export default function BuzonDemoPage() {
  const [resultadosPruebas, setResultadosPruebas] = useState<Record<string, any>>({})
  const [pruebandoArchivo, setPruebandoArchivo] = useState<string | null>(null)

  // Simular archivo para prueba
  const simularArchivoPrueba = async (ejemplo: typeof EJEMPLOS_TRANSFERENCIAS[0]) => {
    setPruebandoArchivo(ejemplo.nombre)
    
    try {
      // Simular datos de archivo
      const archivoSimulado = {
        nombre: ejemplo.nombre,
        contenido: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...", // Base64 simulado
        tamaño: 125000 // Tamaño simulado
      }

      console.log(`[BUZON-DEMO] Probando ${ejemplo.nombre}`)

      // Llamar a la API de upload
      const response = await fetch('/api/buzon/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          archivos: [archivoSimulado]
        })
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const resultado = await response.json()
      
      // Guardar resultado para mostrar
      setResultadosPruebas(prev => ({
        ...prev,
        [ejemplo.nombre]: {
          uploadExitoso: resultado.estadisticas.exitosos > 0,
          archivoClasificado: resultado.exitosos[0] || null,
          error: resultado.fallidos[0]?.error || null,
          datosEsperados: ejemplo.datosEsperados
        }
      }))

      if (resultado.estadisticas.exitosos > 0) {
        toast.success(`${ejemplo.nombre} clasificado correctamente`)
      } else {
        toast.error(`Error al procesar ${ejemplo.nombre}`)
      }

    } catch (error) {
      console.error(`[BUZON-DEMO] Error probando ${ejemplo.nombre}:`, error)
      setResultadosPruebas(prev => ({
        ...prev,
        [ejemplo.nombre]: {
          uploadExitoso: false,
          error: `Error de red: ${error}`,
          datosEsperados: ejemplo.datosEsperados
        }
      }))
      toast.error(`Error al probar ${ejemplo.nombre}: ${error}`)
    } finally {
      setPruebandoArchivo(null)
    }
  }

  // Probar procesamiento con OpenAI
  const probarProcesamiento = async (nombreArchivo: string) => {
    const resultado = resultadosPruebas[nombreArchivo]
    if (!resultado?.archivoClasificado) {
      toast.error("Primero debe subir el archivo")
      return
    }

    try {
      const response = await fetch('/api/buzon/confirmar-lote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comprobantesIds: [resultado.archivoClasificado.archivoId],
          accion: 'procesar_lote'
        })
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const procesamiento = await response.json()
      
      // Actualizar resultado
      setResultadosPruebas(prev => ({
        ...prev,
        [nombreArchivo]: {
          ...prev[nombreArchivo],
          procesamientoExitoso: procesamiento.estadisticas.exitosos > 0,
          datosExtraidos: procesamiento.exitosos[0]?.datosExtraidos || null,
          gastoCreado: procesamiento.exitosos[0]?.gastoCreado || null
        }
      }))

      if (procesamiento.estadisticas.exitosos > 0) {
        toast.success(`${nombreArchivo} procesado con OpenAI correctamente`)
      } else {
        toast.error(`Error al procesar ${nombreArchivo} con OpenAI`)
      }

    } catch (error) {
      console.error(`[BUZON-DEMO] Error procesando ${nombreArchivo}:`, error)
      toast.error(`Error al procesar: ${error}`)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🧪 Demo: Buzón de Comprobantes</h1>
        <p className="text-muted-foreground">
          Prueba el sistema con archivos de ejemplo de transferencias del Banco Ciudad
        </p>
      </div>

      {/* Alert informativo */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>🎯 ¿Cómo funciona?</strong><br />
          1. <strong>Subir</strong>: Simula cargar archivo y clasifica automáticamente<br />
          2. <strong>Procesar</strong>: Extrae datos usando OpenAI Vision API<br />
          3. <strong>Resultado</strong>: Crea transacción y gasto automáticamente
        </AlertDescription>
      </Alert>

      {/* Ejemplos disponibles */}
      <div className="grid gap-6">
        {EJEMPLOS_TRANSFERENCIAS.map((ejemplo) => {
          const resultado = resultadosPruebas[ejemplo.nombre]
          const estaProbando = pruebandoArchivo === ejemplo.nombre

          return (
            <Card key={ejemplo.nombre} className="w-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-blue-500" />
                      {ejemplo.nombre}
                    </CardTitle>
                    <CardDescription>{ejemplo.descripcion}</CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {resultado?.uploadExitoso && (
                      <Badge variant="secondary" className="bg-green-50 text-green-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Subido
                      </Badge>
                    )}
                    {resultado?.procesamientoExitoso && (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Procesado
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Datos esperados */}
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">📋 Datos Esperados:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    <div><strong>Monto:</strong> ${ejemplo.datosEsperados.monto.toLocaleString()}</div>
                    <div><strong>Destino:</strong> {ejemplo.datosEsperados.destino}</div>
                    <div><strong>Banco:</strong> {ejemplo.datosEsperados.banco}</div>
                    <div><strong>CBU:</strong> {ejemplo.datosEsperados.cbu}</div>
                    <div><strong>Alias:</strong> {ejemplo.datosEsperados.alias}</div>
                    <div><strong>Operación:</strong> {ejemplo.datosEsperados.operacion}</div>
                  </div>
                </div>

                {/* Resultados de prueba */}
                {resultado && (
                  <div className="space-y-3">
                    <Separator />
                    
                    {/* Resultado de upload */}
                    <div className={`p-3 rounded-lg ${resultado.uploadExitoso ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
                      <h4 className="font-medium flex items-center gap-2">
                        {resultado.uploadExitoso ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        1. Upload y Clasificación
                      </h4>
                      {resultado.uploadExitoso ? (
                        <div className="text-sm mt-1">
                          <p>✅ Archivo clasificado como: <strong>{resultado.archivoClasificado?.tipo}</strong></p>
                          <p>✅ Confianza: <strong>{resultado.archivoClasificado?.confianza}%</strong></p>
                        </div>
                      ) : (
                        <p className="text-sm text-red-600 mt-1">❌ {resultado.error}</p>
                      )}
                    </div>

                    {/* Resultado de procesamiento */}
                    {resultado.datosExtraidos && (
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                        <h4 className="font-medium flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-blue-600" />
                          2. Extracción de Datos (OpenAI)
                        </h4>
                        <div className="text-sm mt-1 grid grid-cols-2 gap-1">
                          <p>✅ Monto: <strong>${resultado.datosExtraidos.monto?.toLocaleString()}</strong></p>
                          <p>✅ Banco: <strong>{resultado.datosExtraidos.bancoEmisor}</strong></p>
                          <p>✅ CBU: <strong>{resultado.datosExtraidos.cbuDestino}</strong></p>
                          <p>✅ Operación: <strong>{resultado.datosExtraidos.numeroOperacion}</strong></p>
                        </div>
                      </div>
                    )}

                    {/* Gasto creado */}
                    {resultado.gastoCreado && (
                      <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-lg">
                        <h4 className="font-medium flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-purple-600" />
                          3. Gasto Creado
                        </h4>
                        <p className="text-sm mt-1">
                          ✅ ID: <strong>{resultado.gastoCreado.id}</strong> | 
                          Monto: <strong>${resultado.gastoCreado.monto?.toLocaleString()}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex gap-2">
                  <Button 
                    onClick={() => simularArchivoPrueba(ejemplo)}
                    disabled={estaProbando}
                    size="sm"
                  >
                    {estaProbando ? "Subiendo..." : "🔄 1. Subir y Clasificar"}
                  </Button>

                  {resultado?.uploadExitoso && !resultado?.procesamientoExitoso && (
                    <Button 
                      onClick={() => probarProcesamiento(ejemplo.nombre)}
                      variant="outline"
                      size="sm"
                    >
                      🤖 2. Procesar con OpenAI
                    </Button>
                  )}

                  {resultado?.gastoCreado && (
                    <Button 
                      onClick={() => window.open(`/transacciones/${resultado.gastoCreado.id}/editar`, '_blank')}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Gasto
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Ir al buzón real */}
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <FileImage className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="font-medium mb-2">¿Listo para usar tu propio archivo?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Prueba el buzón completo con tus comprobantes reales
          </p>
          <Button onClick={() => window.open('/buzon', '_blank')}>
            📄 Abrir Buzón de Comprobantes
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 