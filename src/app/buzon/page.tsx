"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
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
  HelpCircle
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
  ticket: {
    label: "Ticket",
    icon: Receipt,
    color: "bg-green-500",
    bgColor: "bg-green-50 dark:bg-green-950",
    textColor: "text-green-700 dark:text-green-300"
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

export default function BuzonPage() {
  const [archivosClasificados, setArchivosClasificados] = useState<ArchivoClasificado[]>([])
  const [archivosSeleccionados, setArchivosSeleccionados] = useState<Set<string>>(new Set())
  const [uploadInProgress, setUploadInProgress] = useState(false)
  const [procesamientoInProgress, setProcesamientoInProgress] = useState(false)
  const [estadisticas, setEstadisticas] = useState<EstadisticasUpload | null>(null)
  const [archivosPrevisualizando, setArchivosPrevisualizando] = useState<Set<string>>(new Set())

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

      // Mostrar resultados
      if (resultado.estadisticas.exitosos > 0) {
        toast.success(`${resultado.estadisticas.exitosos} archivos clasificados correctamente`)
      }
      
      if (resultado.fallidos.length > 0) {
        toast.error(`${resultado.fallidos.length} archivos fallaron: ${resultado.fallidos[0]?.error}`)
      }

      console.log(`[BUZON-UI] Upload completado: ${resultado.estadisticas.exitosos} exitosos`)

    } catch (error) {
      console.error('[BUZON-UI] Error en upload:', error)
      toast.error(`Error al procesar archivos: ${error}`)
    } finally {
      setUploadInProgress(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.pdf']
    },
    maxFiles: 20,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploadInProgress || procesamientoInProgress
  })

  // Seleccionar/deseleccionar archivo
  const toggleSeleccion = (archivoId: string) => {
    const nuevaSeleccion = new Set(archivosSeleccionados)
    if (nuevaSeleccion.has(archivoId)) {
      nuevaSeleccion.delete(archivoId)
    } else {
      nuevaSeleccion.add(archivoId)
    }
    setArchivosSeleccionados(nuevaSeleccion)
  }

  // Seleccionar todos los archivos
  const seleccionarTodos = () => {
    if (archivosSeleccionados.size === archivosClasificados.length) {
      setArchivosSeleccionados(new Set())
    } else {
      setArchivosSeleccionados(new Set(archivosClasificados.map(a => a.archivoId)))
    }
  }

  // Previsualizar archivo
  const previsualizarArchivo = (archivo: ArchivoClasificado) => {
    setArchivosPrevisualizando(prev => new Set(prev).add(archivo.archivoId))
    
    // Crear modal o ventana para mostrar la imagen
    const ventana = window.open('', '_blank', 'width=800,height=600')
    if (ventana) {
      ventana.document.write(`
        <html>
          <head><title>Previsualización: ${archivo.nombre}</title></head>
          <body style="margin:0;padding:20px;background:#f5f5f5;">
            <div style="text-align:center;">
              <h3>${archivo.nombre}</h3>
              <p>Tipo: ${TIPOS_COMPROBANTES[archivo.tipo].label} (${archivo.confianza}% confianza)</p>
              <img src="${archivo.contenidoBase64}" style="max-width:100%;max-height:80vh;border:1px solid #ccc;border-radius:8px;" />
            </div>
          </body>
        </html>
      `)
      ventana.document.close()
    }
    
    setTimeout(() => {
      setArchivosPrevisualizando(prev => {
        const nuevos = new Set(prev)
        nuevos.delete(archivo.archivoId)
        return nuevos
      })
    }, 500)
  }

  // Procesar archivos seleccionados
  const procesarSeleccionados = async () => {
    if (archivosSeleccionados.size === 0) {
      toast.error("Selecciona al menos un archivo para procesar")
      return
    }

    setProcesamientoInProgress(true)

    try {
      const response = await fetch('/api/buzon/confirmar-lote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comprobantesIds: Array.from(archivosSeleccionados),
          accion: 'procesar_lote'
        })
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const resultado = await response.json()
      
      // Remover archivos procesados exitosamente
      const procesadosIds = new Set(resultado.exitosos.map((r: any) => r.comprobanteId))
      setArchivosClasificados(prev => prev.filter(a => !procesadosIds.has(a.archivoId)))
      setArchivosSeleccionados(new Set())

      // Mostrar resultados
      if (resultado.estadisticas.exitosos > 0) {
        toast.success(`${resultado.estadisticas.exitosos} comprobantes procesados correctamente`)
        toast.success(`${resultado.estadisticas.gastosCreados} gastos creados`)
      }
      
      if (resultado.estadisticas.fallidos > 0) {
        toast.error(`${resultado.estadisticas.fallidos} comprobantes fallaron`)
      }

      console.log(`[BUZON-UI] Procesamiento completado:`, resultado.estadisticas)

    } catch (error) {
      console.error('[BUZON-UI] Error en procesamiento:', error)
      toast.error(`Error al procesar: ${error}`)
    } finally {
      setProcesamientoInProgress(false)
    }
  }

  // Descartar archivos seleccionados
  const descartarSeleccionados = async () => {
    if (archivosSeleccionados.size === 0) {
      toast.error("Selecciona al menos un archivo para descartar")
      return
    }

    try {
      const response = await fetch('/api/buzon/descartar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comprobantesIds: Array.from(archivosSeleccionados),
          motivo: 'Descartado desde interfaz'
        })
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const resultado = await response.json()
      
      // Remover archivos descartados
      const descartadosIds = new Set(resultado.exitosos)
      setArchivosClasificados(prev => prev.filter(a => !descartadosIds.has(a.archivoId)))
      setArchivosSeleccionados(new Set())

      toast.success(`${resultado.estadisticas.exitosos} archivos descartados`)

    } catch (error) {
      console.error('[BUZON-UI] Error descartando:', error)
      toast.error(`Error al descartar: ${error}`)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📄 Buzón de Comprobantes</h1>
          <p className="text-muted-foreground">
            Arrastra y suelta comprobantes de transferencias, tickets, servicios y más
          </p>
        </div>
        
        {estadisticas && (
          <div className="text-right text-sm text-muted-foreground">
            <div>Total procesados: {estadisticas.total}</div>
            <div className="text-green-600">Exitosos: {estadisticas.exitosos}</div>
            {estadisticas.fallidos > 0 && (
              <div className="text-red-600">Fallidos: {estadisticas.fallidos}</div>
            )}
          </div>
        )}
      </div>

      {/* Drop Zone */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-300 hover:border-gray-400'
              }
              ${uploadInProgress ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            {uploadInProgress ? (
              <div className="space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <div>
                  <p className="text-lg font-medium">Clasificando archivos...</p>
                  <p className="text-sm text-muted-foreground">
                    Usando inteligencia artificial para detectar tipos de comprobantes
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 mx-auto text-gray-400" />
                <div>
                  <p className="text-lg font-medium">
                    {isDragActive 
                      ? "Suelta los archivos aquí..." 
                      : "Arrastra archivos aquí o haz clic para seleccionar"
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Máximo 20 archivos, 10MB cada uno. Formatos: JPG, PNG, PDF
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Archivos Clasificados */}
      {archivosClasificados.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Archivos Clasificados ({archivosClasificados.length})</CardTitle>
                <CardDescription>
                  Revisa la clasificación automática y procesa los comprobantes
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={seleccionarTodos}
                >
                  {archivosSeleccionados.size === archivosClasificados.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                </Button>
                
                {archivosSeleccionados.size > 0 && (
                  <>
                    <Button 
                      size="sm" 
                      onClick={procesarSeleccionados}
                      disabled={procesamientoInProgress}
                    >
                      {procesamientoInProgress ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <FileCheck className="h-4 w-4 mr-2" />
                          Procesar ({archivosSeleccionados.size})
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={descartarSeleccionados}
                      disabled={procesamientoInProgress}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Descartar ({archivosSeleccionados.size})
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {archivosClasificados.map((archivo) => {
                  const tipoInfo = TIPOS_COMPROBANTES[archivo.tipo]
                  const TipoIcon = tipoInfo.icon
                  const isSeleccionado = archivosSeleccionados.has(archivo.archivoId)
                  const isPrevisualizando = archivosPrevisualizando.has(archivo.archivoId)
                  
                  return (
                    <div
                      key={archivo.archivoId}
                      className={`
                        flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors
                        ${isSeleccionado ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}
                      `}
                      onClick={() => toggleSeleccion(archivo.archivoId)}
                    >
                      {/* Checkbox visual */}
                      <div className={`
                        w-5 h-5 border-2 rounded flex items-center justify-center
                        ${isSeleccionado ? 'border-primary bg-primary' : 'border-gray-300'}
                      `}>
                        {isSeleccionado && <Check className="h-3 w-3 text-white" />}
                      </div>

                      {/* Icono del tipo */}
                      <div className={`p-2 rounded-full ${tipoInfo.bgColor}`}>
                        <TipoIcon className={`h-5 w-5 ${tipoInfo.textColor}`} />
                      </div>

                      {/* Información del archivo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{archivo.nombre}</p>
                          <Badge variant="secondary" className={tipoInfo.bgColor}>
                            {tipoInfo.label}
                          </Badge>
                          <Badge variant="outline">
                            {archivo.confianza}% confianza
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(archivo.tamaño)}
                          {archivo.metadatos?.razon && ` • ${archivo.metadatos.razon}`}
                        </p>
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            previsualizarArchivo(archivo)
                          }}
                          disabled={isPrevisualizando}
                        >
                          {isPrevisualizando ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Estado vacío */}
      {archivosClasificados.length === 0 && !uploadInProgress && (
        <Alert>
          <FileImage className="h-4 w-4" />
          <AlertDescription>
            No hay archivos en el buzón. Arrastra algunos comprobantes para comenzar.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
} 