'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface ComprobanteSubido {
  id: string
  nombreArchivo: string
  tipoDetectado: string
  confianzaClasificacion: number
  estado: string
  fechaSubida: string
  tamaño: number
}

interface ResultadoProcesamiento {
  exitosos: Array<{
    id: string
    gastoId?: number
    tipo: string
    monto?: number
  }>
  errores: Array<{
    id: string
    error: string
  }>
  estadisticas: {
    procesados: number
    gastosCreados: number
    erroresProcesamiento: number
  }
}

export default function TestBuzonPage() {
  const [archivosSubiendo, setArchivosSubiendo] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [comprobantes, setComprobantes] = useState<ComprobanteSubido[]>([])
  const [procesando, setProcesando] = useState(false)
  const [resultados, setResultados] = useState<ResultadoProcesamiento | null>(null)

  // Configurar dropzone
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setArchivosSubiendo(true)
    setProgreso(0)

    try {
      const formData = new FormData()
      acceptedFiles.forEach((file, index) => {
        formData.append(`archivo_${index}`, file)
      })

      console.log(`[TEST-BUZON] Subiendo ${acceptedFiles.length} archivos`)

      const response = await fetch('/api/buzon/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const resultado = await response.json()
      
      if (resultado.error) {
        throw new Error(resultado.error)
      }

      console.log('[TEST-BUZON] Resultado upload:', resultado)

      // Actualizar lista de comprobantes
      await cargarComprobantes()

      toast.success(`${resultado.estadisticas.exitosos} archivos subidos correctamente`)

      if (resultado.estadisticas.errores > 0) {
        toast.warning(`${resultado.estadisticas.errores} archivos tuvieron errores`)
      }

    } catch (error) {
      console.error('[TEST-BUZON] Error subiendo archivos:', error)
      toast.error(`Error subiendo archivos: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setArchivosSubiendo(false)
      setProgreso(0)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 20,
    maxSize: 10 * 1024 * 1024 // 10MB
  })

  // Cargar comprobantes desde la API
  const cargarComprobantes = async () => {
    try {
      const response = await fetch('/api/buzon/comprobantes')
      if (!response.ok) throw new Error('Error cargando comprobantes')
      
      const data = await response.json()
      setComprobantes(data.comprobantes || [])
    } catch (error) {
      console.error('[TEST-BUZON] Error cargando comprobantes:', error)
      toast.error('Error cargando comprobantes')
    }
  }

  // Procesar comprobantes seleccionados
  const procesarComprobantes = async (ids: string[]) => {
    if (ids.length === 0) {
      toast.warning('Selecciona al menos un comprobante')
      return
    }

    setProcesando(true)
    setResultados(null)

    try {
      console.log(`[TEST-BUZON] Procesando ${ids.length} comprobantes:`, ids)

      const response = await fetch('/api/buzon/confirmar-lote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comprobanteIds: ids })
      })

      console.log('[TEST-BUZON] Response status:', response.status)
      console.log('[TEST-BUZON] Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        console.error('[TEST-BUZON] Error response:', errorData)
        throw new Error(`Error ${response.status}: ${response.statusText}${errorData ? ` - ${JSON.stringify(errorData)}` : ''}`)
      }

      const resultado = await response.json()
      console.log('[TEST-BUZON] Resultado procesamiento:', resultado)

      setResultados(resultado.resultados)
      
      // Recargar comprobantes
      await cargarComprobantes()

      toast.success(`${resultado.resultados.estadisticas.procesados} comprobantes procesados`)

      if (resultado.resultados.estadisticas.erroresProcesamiento > 0) {
        toast.warning(`${resultado.resultados.estadisticas.erroresProcesamiento} errores de procesamiento`)
      }

    } catch (error) {
      console.error('[TEST-BUZON] Error procesando:', error)
      toast.error(`Error procesando: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setProcesando(false)
    }
  }

  // Descartar comprobantes
  const descartarComprobantes = async (ids: string[], motivo?: string) => {
    try {
      const response = await fetch('/api/buzon/descartar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comprobanteIds: ids, motivo })
      })

      if (!response.ok) throw new Error('Error descartando comprobantes')

      const resultado = await response.json()
      console.log('[TEST-BUZON] Comprobantes descartados:', resultado)

      await cargarComprobantes()
      toast.success(`${resultado.resultados.estadisticas.descartados} comprobantes descartados`)

    } catch (error) {
      console.error('[TEST-BUZON] Error descartando:', error)
      toast.error('Error descartando comprobantes')
    }
  }

  // Cargar comprobantes al montar el componente
  useState(() => {
    cargarComprobantes()
  })

  const comprobantesPendientes = comprobantes.filter(c => c.estado === 'pendiente')
  const comprobantesConfirmados = comprobantes.filter(c => c.estado === 'confirmado')
  const comprobantesDescartados = comprobantes.filter(c => c.estado === 'descartado')

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🗂️ Test Buzón de Comprobantes</h1>
          <p className="text-muted-foreground">
            Prueba el sistema de procesamiento automático de comprobantes
          </p>
        </div>
        <Button onClick={cargarComprobantes} variant="outline">
          Actualizar
        </Button>
      </div>

      {/* Zona de subida */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Comprobantes
          </CardTitle>
          <CardDescription>
            Arrastra archivos aquí o haz clic para seleccionar (máx. 20 archivos, 10MB cada uno)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-lg">Suelta los archivos aquí...</p>
            ) : (
              <div>
                <p className="text-lg mb-2">Arrastra comprobantes aquí</p>
                <p className="text-sm text-muted-foreground">
                  Soporta: JPG, PNG, PDF • Banco Ciudad, Banco Macro
                </p>
              </div>
            )}
          </div>

          {archivosSubiendo && (
            <div className="mt-4">
              <Progress value={progreso} className="w-full" />
              <p className="text-sm text-center mt-2">Subiendo archivos...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs de comprobantes */}
      <Tabs defaultValue="pendientes" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pendientes" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Pendientes ({comprobantesPendientes.length})
          </TabsTrigger>
          <TabsTrigger value="confirmados" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Procesados ({comprobantesConfirmados.length})
          </TabsTrigger>
          <TabsTrigger value="descartados" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Descartados ({comprobantesDescartados.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendientes" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Comprobantes Pendientes</h3>
            <div className="flex gap-2">
              <Button
                onClick={() => procesarComprobantes(comprobantesPendientes.map(c => c.id))}
                disabled={procesando || comprobantesPendientes.length === 0}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                {procesando ? 'Procesando...' : `Procesar Todos (${comprobantesPendientes.length})`}
              </Button>
              <Button
                variant="destructive"
                onClick={() => descartarComprobantes(comprobantesPendientes.map(c => c.id), 'Descarte masivo desde test')}
                disabled={comprobantesPendientes.length === 0}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Descartar Todos
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {comprobantesPendientes.map((comprobante) => (
              <Card key={comprobante.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm truncate">
                      {comprobante.nombreArchivo}
                    </CardTitle>
                    <Badge variant={
                      comprobante.tipoDetectado === 'servicio' ? 'default' :
                      comprobante.tipoDetectado === 'transferencia' ? 'secondary' :
                      comprobante.tipoDetectado === 'ticket' ? 'outline' :
                      comprobante.tipoDetectado === 'resumen_tarjeta' ? 'destructive' :
                      'outline'
                    }>
                      {comprobante.tipoDetectado === 'servicio' ? '⚡ Servicio' :
                       comprobante.tipoDetectado === 'transferencia' ? '💰 Transferencia' :
                       comprobante.tipoDetectado === 'ticket' ? '🧾 Ticket' :
                       comprobante.tipoDetectado === 'resumen_tarjeta' ? '💳 Resumen' :
                       '❓ Desconocido'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Confianza: {comprobante.confianzaClasificacion}%</span>
                    <span>{(comprobante.tamaño / 1024).toFixed(1)} KB</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => procesarComprobantes([comprobante.id])}
                      disabled={procesando}
                      className="flex-1"
                    >
                      Procesar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => descartarComprobantes([comprobante.id])}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {comprobantesPendientes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No hay comprobantes pendientes
            </div>
          )}
        </TabsContent>

        <TabsContent value="confirmados" className="space-y-4">
          <h3 className="text-lg font-semibold">Comprobantes Procesados</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {comprobantesConfirmados.map((comprobante) => (
              <Card key={comprobante.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm truncate flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {comprobante.nombreArchivo}
                  </CardTitle>
                  <Badge variant="outline">{comprobante.tipoDetectado}</Badge>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="descartados" className="space-y-4">
          <h3 className="text-lg font-semibold">Comprobantes Descartados</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {comprobantesDescartados.map((comprobante) => (
              <Card key={comprobante.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm truncate flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    {comprobante.nombreArchivo}
                  </CardTitle>
                  <Badge variant="outline">{comprobante.tipoDetectado}</Badge>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Resultados del procesamiento */}
      {resultados && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resultados del Procesamiento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {resultados.estadisticas.procesados}
                </div>
                <div className="text-sm text-muted-foreground">Procesados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {resultados.estadisticas.gastosCreados}
                </div>
                <div className="text-sm text-muted-foreground">Gastos Creados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {resultados.estadisticas.erroresProcesamiento}
                </div>
                <div className="text-sm text-muted-foreground">Errores</div>
              </div>
            </div>

            {resultados.exitosos.length > 0 && (
              <div>
                <h4 className="font-semibold text-green-600 mb-2">Exitosos:</h4>
                <div className="space-y-1">
                  {resultados.exitosos.map((exitoso) => (
                    <div key={exitoso.id} className="text-sm">
                      ✅ {exitoso.tipo} - Gasto ID: {exitoso.gastoId} 
                      {exitoso.monto && ` - $${exitoso.monto.toLocaleString()}`}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resultados.errores.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-600 mb-2">Errores:</h4>
                <div className="space-y-1">
                  {resultados.errores.map((error) => (
                    <div key={error.id} className="text-sm">
                      ❌ {error.id}: {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 