"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  FileImage, 
  Check, 
  X, 
  Eye, 
  Trash2, 
  FileCheck, 
  AlertCircle,
  Loader2,
  CreditCard,
  Receipt,
  FileText,
  HelpCircle,
  Zap,
  Clock,
  DollarSign,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles
} from "lucide-react"
import { toast } from "sonner"

// Tipos de comprobantes con iconos y colores
const TIPOS_COMPROBANTES = {
  transferencia: {
    label: "Transferencia",
    icon: CreditCard,
    color: "bg-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    textColor: "text-blue-700 dark:text-blue-300"
  },
  servicio: {
    label: "Servicio",
    icon: FileText,
    color: "bg-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-950",
    textColor: "text-orange-700 dark:text-orange-300"
  },
  resumen_tarjeta: {
    label: "Resumen Tarjeta",
    icon: CreditCard,
    color: "bg-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950",
    textColor: "text-purple-700 dark:text-purple-300"
  },
  ticket: {
    label: "Ticket",
    icon: Receipt,
    color: "bg-green-500",
    bgColor: "bg-green-50 dark:bg-green-950",
    textColor: "text-green-700 dark:text-green-300"
  },
  desconocido: {
    label: "Desconocido",
    icon: HelpCircle,
    color: "bg-gray-500",
    bgColor: "bg-gray-50 dark:bg-gray-950",
    textColor: "text-gray-700 dark:text-gray-300"
  }
}

interface ArchivoClasificado {
  archivoId: string
  nombre: string
  tipo: keyof typeof TIPOS_COMPROBANTES
  contenidoBase64: string
  tamaño: number
  confianza: number
  metadatos?: Record<string, any>
}

interface EstadisticasUpload {
  total: number
  exitosos: number
  fallidos: number
  tiposDetectados: Record<string, number>
}

interface ComprobanteListItem {
  id: string
  nombreArchivo: string
  tipoDetectado: string
  estado: 'pendiente' | 'procesado' | 'error'
  fechaSubida: string
  datosExtraidos?: any
  gastosCreados?: any[]
  error?: string
}

export default function BuzonPage() {
  const [archivosClasificados, setArchivosClasificados] = useState<ArchivoClasificado[]>([])
  const [comprobantes, setComprobantes] = useState<ComprobanteListItem[]>([])
  const [archivosSeleccionados, setArchivosSeleccionados] = useState<Set<string>>(new Set())
  const [uploadInProgress, setUploadInProgress] = useState(false)
  const [procesamientoInProgress, setProcesamientoInProgress] = useState(false)
  const [estadisticas, setEstadisticas] = useState<EstadisticasUpload | null>(null)
  const [tabActiva, setTabActiva] = useState("subir")

  // Cargar comprobantes existentes
  const cargarComprobantes = async () => {
    try {
      const response = await fetch('/api/buzon/comprobantes')
      if (response.ok) {
        const datos = await response.json()
        setComprobantes(datos)
      }
    } catch (error) {
      console.error('Error cargando comprobantes:', error)
    }
  }

  useEffect(() => {
    cargarComprobantes()
  }, [])

  // Función para convertir archivo a base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error: ProgressEvent<FileReader>) => reject(error)
    })
  }

  // Configuración del dropzone
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setUploadInProgress(true)
    
    try {
      console.log(`[BUZON-UI] Procesando ${acceptedFiles.length} archivos`)

      // Convertir archivos a base64
      const archivosBase64 = await Promise.all(
        acceptedFiles.map(async (file) => ({
          nombre: file.name,
          contenido: await fileToBase64(file),
          tamaño: file.size
        }))
      )

      // Enviar a la API de clasificación
      const response = await fetch('/api/buzon/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          archivos: archivosBase64
        })
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const resultado = await response.json()
      
      // Actualizar estado
      setArchivosClasificados(prev => [...prev, ...resultado.exitosos])
      setEstadisticas(resultado.estadisticas)

      // Mostrar resultado
      toast.success(`${resultado.exitosos.length} archivos clasificados correctamente`)
      
      if (resultado.fallidos?.length > 0) {
        toast.error(`${resultado.fallidos.length} archivos fallaron`)
      }

      // Recargar lista de comprobantes
      cargarComprobantes()

    } catch (error) {
      console.error('[BUZON-UI] Error en upload:', error)
      toast.error('Error procesando archivos')
    } finally {
      setUploadInProgress(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploadInProgress
  })

  // Procesar comprobante individual con nuevo sistema
  const procesarComprobante = async (archivo: ArchivoClasificado) => {
    try {
      setProcesamientoInProgress(true)

      const response = await fetch('/api/buzon/procesar-comprobante', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comprobanteId: archivo.archivoId,
          tipoComprobante: archivo.tipo,
          contenidoBase64: archivo.contenidoBase64
        })
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const resultado = await response.json()

      if (resultado.success) {
        toast.success(`Comprobante procesado: ${resultado.gastosCreados?.length || 0} gastos creados`)
        
        // Actualizar lista de comprobantes
        cargarComprobantes()
        
        // Remover de archivos clasificados
        setArchivosClasificados(prev => 
          prev.filter(a => a.archivoId !== archivo.archivoId)
        )
      } else {
        throw new Error(resultado.error || 'Error desconocido')
      }

    } catch (error) {
      console.error('[BUZON-UI] Error procesando comprobante:', error)
      toast.error(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setProcesamientoInProgress(false)
    }
  }

  // Procesar todos los archivos clasificados
  const procesarTodos = async () => {
    if (archivosClasificados.length === 0) return

    setProcesamientoInProgress(true)

    let exitosos = 0
    let fallidos = 0

    for (const archivo of archivosClasificados) {
      try {
        await procesarComprobante(archivo)
        exitosos++
      } catch (error) {
        fallidos++
        console.error(`Error procesando ${archivo.nombre}:`, error)
      }
    }

    toast.success(`Procesamiento completado: ${exitosos} exitosos, ${fallidos} fallidos`)
    setProcesamientoInProgress(false)
  }

  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Obtener ícono del tipo
  const getIconoTipo = (tipo: keyof typeof TIPOS_COMPROBANTES) => {
    const IconComponent = TIPOS_COMPROBANTES[tipo]?.icon || HelpCircle
    return <IconComponent className="h-4 w-4" />
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileCheck className="h-8 w-8 text-primary" />
          Buzón de Comprobantes
        </h1>
        <p className="text-muted-foreground mt-2">
          Sube comprobantes de transferencias, servicios y resúmenes de tarjeta para procesamiento automático con IA
        </p>
      </div>

      <Tabs value={tabActiva} onValueChange={setTabActiva} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="subir">Subir Archivos</TabsTrigger>
          <TabsTrigger value="clasificados">
            Clasificados ({archivosClasificados.length})
          </TabsTrigger>
          <TabsTrigger value="procesados">
            Procesados ({comprobantes.filter(c => c.estado === 'procesado').length})
          </TabsTrigger>
        </TabsList>

        {/* Tab: Subir Archivos */}
        <TabsContent value="subir" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Subir Comprobantes
              </CardTitle>
              <CardDescription>
                Arrastra archivos aquí o haz clic para seleccionar. Formatos soportados: JPG, PNG, PDF
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${isDragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-primary/50'
                  }
                  ${uploadInProgress ? 'pointer-events-none opacity-50' : ''}
                `}
              >
                <input {...getInputProps()} />
                
                {uploadInProgress ? (
                  <div className="space-y-4">
                    <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                    <p className="text-lg font-medium">Procesando archivos...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div className="space-y-2">
                      <p className="text-lg font-medium">
                        {isDragActive ? 'Suelta los archivos aquí' : 'Arrastra archivos aquí'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        o haz clic para seleccionar archivos
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {estadisticas && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h3 className="font-medium mb-2">Estadísticas del último upload:</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <span className="ml-2 font-medium">{estadisticas.total}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Exitosos:</span>
                      <span className="ml-2 font-medium text-green-600">{estadisticas.exitosos}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fallidos:</span>
                      <span className="ml-2 font-medium text-red-600">{estadisticas.fallidos}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Archivos Clasificados */}
        <TabsContent value="clasificados" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Archivos Clasificados</h2>
            <div className="space-x-2">
              <Button
                onClick={procesarTodos}
                disabled={archivosClasificados.length === 0 || procesamientoInProgress}
                className="flex items-center gap-2"
              >
                {procesamientoInProgress ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Procesar Todos
              </Button>
            </div>
          </div>

          {archivosClasificados.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileImage className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay archivos clasificados pendientes</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {archivosClasificados.map((archivo) => (
                <Card key={archivo.archivoId}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${TIPOS_COMPROBANTES[archivo.tipo]?.bgColor}`}>
                          {getIconoTipo(archivo.tipo)}
                        </div>
                        
                        <div>
                          <h3 className="font-medium">{archivo.nombre}</h3>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <Badge variant="secondary">
                              {TIPOS_COMPROBANTES[archivo.tipo]?.label || archivo.tipo}
                            </Badge>
                            <span>{formatFileSize(archivo.tamaño)}</span>
                            <span>Confianza: {archivo.confianza}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => procesarComprobante(archivo)}
                          disabled={procesamientoInProgress}
                          className="flex items-center gap-2"
                        >
                          {procesamientoInProgress ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Zap className="h-4 w-4" />
                          )}
                          Procesar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab: Comprobantes Procesados */}
        <TabsContent value="procesados" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Comprobantes Procesados</h2>
            <Button
              onClick={cargarComprobantes}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </div>

          {comprobantes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay comprobantes procesados</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {comprobantes.map((comprobante) => (
                <Card key={comprobante.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${
                          comprobante.estado === 'procesado' 
                            ? 'bg-green-50 dark:bg-green-950'
                            : comprobante.estado === 'error'
                              ? 'bg-red-50 dark:bg-red-950'
                              : 'bg-yellow-50 dark:bg-yellow-950'
                        }`}>
                          {comprobante.estado === 'procesado' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : comprobante.estado === 'error' ? (
                            <XCircle className="h-4 w-4 text-red-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                        
                        <div>
                          <h3 className="font-medium">{comprobante.nombreArchivo}</h3>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <Badge variant="secondary">
                              {TIPOS_COMPROBANTES[comprobante.tipoDetectado as keyof typeof TIPOS_COMPROBANTES]?.label || comprobante.tipoDetectado}
                            </Badge>
                            <span>{new Date(comprobante.fechaSubida).toLocaleDateString()}</span>
                            {comprobante.gastosCreados && (
                              <span className="text-green-600">
                                {comprobante.gastosCreados.length} gastos creados
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {comprobante.datosExtraidos && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${comprobante.datosExtraidos.monto?.toLocaleString() || 
                              comprobante.datosExtraidos.importe?.toLocaleString() ||
                              comprobante.datosExtraidos.pagoMinimo?.toLocaleString() || '0'}
                          </Badge>
                        )}
                        
                        {comprobante.error && (
                          <Badge variant="destructive">
                            Error
                          </Badge>
                        )}
                      </div>
                    </div>

                    {comprobante.error && (
                      <Alert className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {comprobante.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 