'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  FileSpreadsheet, 
  Check, 
  X, 
  AlertCircle, 
  Download,
  Info,
  Users,
  CreditCard,
  PiggyBank,
  Receipt,
  ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface PreviewData {
  gastos: any[]
  gastosRecurrentes: any[]
  presupuestos: any[]
  prestamos: any[]
}

interface ImportResult {
  success: boolean
  errors: string[]
  imported: {
    gastos: number
    gastosRecurrentes: number
    presupuestos: number
    prestamos: number
  }
}

export default function ImportarDatosPage() {
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [importing, setImporting] = useState(false)
  const [validating, setValidating] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const router = useRouter()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      toast.error('Por favor, selecciona un archivo Excel (.xlsx o .xls)')
      return
    }

    setFile(selectedFile)
    setValidating(true)
    setErrors([])
    setPreviewData(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/importar-datos/preview', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al procesar el archivo')
      }

      if (result.errors && result.errors.length > 0) {
        setErrors(result.errors)
      }

      setPreviewData(result.preview)
      toast.success('Archivo procesado correctamente')
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al procesar el archivo')
      setFile(null)
    } finally {
      setValidating(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  })

  const handleImport = async () => {
    if (!file || !previewData) return

    setImporting(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/importar-datos/import', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al importar los datos')
      }

      setImportResult(result)
      toast.success('¡Datos importados exitosamente!')
      
      // Limpiar estado después de importar
      setTimeout(() => {
        setFile(null)
        setPreviewData(null)
        setImportResult(null)
        setErrors([])
      }, 5000)

    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al importar los datos')
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const link = document.createElement('a')
    link.href = '/api/importar-datos/template'
    link.download = 'plantilla-gastos-inicial.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const totalRecords = previewData 
    ? previewData.gastos.length + previewData.gastosRecurrentes.length + 
      previewData.presupuestos.length + previewData.prestamos.length
    : 0

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Importar Datos Iniciales</h1>
            <p className="text-muted-foreground">
              Importa tus datos financieros desde Excel para comenzar rápidamente
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push('/?dashboard=true')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Dashboard
          </Button>
        </div>
      </div>

      {/* Plantilla de descarga */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Plantilla de Excel
          </CardTitle>
          <CardDescription>
            Descarga nuestra plantilla para asegurar el formato correcto de tus datos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={downloadTemplate} variant="outline" className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Descargar Plantilla Excel
          </Button>
        </CardContent>
      </Card>

      {/* Zona de subida */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
              ${validating ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-primary/10">
                {validating ? (
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                ) : (
                  <Upload className="h-8 w-8 text-primary" />
                )}
              </div>
              
              {validating ? (
                <div>
                  <p className="text-lg font-medium">Procesando archivo...</p>
                  <p className="text-sm text-muted-foreground">Esto puede tomar unos segundos</p>
                </div>
              ) : file ? (
                <div>
                  <p className="text-lg font-medium text-green-600">
                    <Check className="inline h-5 w-5 mr-1" />
                    {file.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Archivo listo para importar
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium">
                    {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra tu archivo Excel aquí'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    o haz clic para seleccionar un archivo (.xlsx, .xls)
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Errores de validación */}
      {errors.length > 0 && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">Se encontraron algunos problemas:</div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
            <p className="mt-2 text-sm font-medium">
              Los registros válidos se pueden importar, los demás serán omitidos.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Preview de datos */}
      {previewData && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Vista Previa de Datos
              </span>
              <Badge variant="secondary">
                {totalRecords} registros encontrados
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="gastos" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="gastos" className="flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Gastos ({previewData.gastos.length})
                </TabsTrigger>
                <TabsTrigger value="recurrentes" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Recurrentes ({previewData.gastosRecurrentes.length})
                </TabsTrigger>
                <TabsTrigger value="presupuestos" className="flex items-center gap-2">
                  <PiggyBank className="h-4 w-4" />
                  Presupuestos ({previewData.presupuestos.length})
                </TabsTrigger>
                <TabsTrigger value="prestamos" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Préstamos ({previewData.prestamos.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="gastos" className="mt-4">
                <PreviewTable data={previewData.gastos} type="gastos" />
              </TabsContent>

              <TabsContent value="recurrentes" className="mt-4">
                <PreviewTable data={previewData.gastosRecurrentes} type="recurrentes" />
              </TabsContent>

              <TabsContent value="presupuestos" className="mt-4">
                <PreviewTable data={previewData.presupuestos} type="presupuestos" />
              </TabsContent>

              <TabsContent value="prestamos" className="mt-4">
                <PreviewTable data={previewData.prestamos} type="prestamos" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Botón de importar */}
      {previewData && totalRecords > 0 && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">¿Listo para importar?</h3>
                <p className="text-sm text-muted-foreground">
                  Se importarán {totalRecords} registros en total
                </p>
              </div>
              <Button 
                onClick={handleImport} 
                disabled={importing}
                size="lg"
              >
                {importing ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Datos
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado de importación */}
      {importResult && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="font-medium text-green-800 mb-2">
              ¡Importación completada exitosamente!
            </div>
            <div className="space-y-1 text-sm text-green-700">
              <p>• {importResult.imported.gastos} gastos importados</p>
              <p>• {importResult.imported.gastosRecurrentes} gastos recurrentes importados</p>
              <p>• {importResult.imported.presupuestos} presupuestos importados</p>
              <p>• {importResult.imported.prestamos} préstamos importados</p>
            </div>
            {importResult.errors.length > 0 && (
              <div className="mt-2 pt-2 border-t border-green-200">
                <p className="text-sm font-medium text-orange-700">Advertencias:</p>
                <ul className="list-disc list-inside text-xs text-orange-600">
                  {importResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-4 flex items-center gap-2">
              <Button 
                onClick={() => router.push('/?dashboard=true')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ir al Dashboard
              </Button>
              <p className="text-xs text-green-600">
                Los datos se limpiarán automáticamente en unos segundos
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Información Importante
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>• La plantilla contiene hojas separadas para cada tipo de dato (Gastos, Recurrentes, Presupuestos, Préstamos)</p>
          <p>• Los campos obligatorios están marcados en la plantilla</p>
          <p>• Las fechas deben estar en formato DD/MM/AAAA</p>
          <p>• Los montos deben ser números positivos</p>
          <p>• Las categorías se crearán automáticamente si no existen</p>
          <p>• Puedes importar solo algunos tipos de datos, no es necesario completar todas las hojas</p>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente para mostrar la tabla de preview
function PreviewTable({ data, type }: { data: any[], type: string }) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileSpreadsheet className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No se encontraron datos de {type} en el archivo</p>
      </div>
    )
  }

  const getColumns = () => {
    if (data.length === 0) return []
    return Object.keys(data[0]).filter(key => key !== 'errors')
  }

  const columns = getColumns()
  const displayData = data.slice(0, 5) // Mostrar solo los primeros 5 registros

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-border rounded-lg">
          <thead>
            <tr className="bg-muted/50">
              {columns.map((column) => (
                <th key={column} className="border border-border px-3 py-2 text-left text-sm font-medium">
                  {column.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, index) => (
              <tr key={index} className="hover:bg-muted/30">
                {columns.map((column) => (
                  <td key={column} className="border border-border px-3 py-2 text-sm">
                    {row[column]?.toString() || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length > 5 && (
        <p className="text-sm text-muted-foreground text-center">
          Y {data.length - 5} registros más...
        </p>
      )}
    </div>
  )
} 