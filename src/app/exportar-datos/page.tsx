"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, FileSpreadsheet, Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function ExportarDatosPage() {
  const [mesSeleccionado, setMesSeleccionado] = useState("")
  const [añoSeleccionado, setAñoSeleccionado] = useState(new Date().getFullYear().toString())
  const [tipoExportacion, setTipoExportacion] = useState("personal") // "personal" o "grupo"
  const [grupoSeleccionado, setGrupoSeleccionado] = useState("")
  const [exportando, setExportando] = useState(false)
  const [gruposAdministrados, setGruposAdministrados] = useState<any[]>([])

  // Generar opciones de meses
  const meses = [
    { value: "01", label: "Enero" },
    { value: "02", label: "Febrero" },
    { value: "03", label: "Marzo" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Mayo" },
    { value: "06", label: "Junio" },
    { value: "07", label: "Julio" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" }
  ]

  // Generar opciones de años (5 años hacia atrás y 2 hacia adelante)
  const añoActual = new Date().getFullYear()
  const años = []
  for (let i = añoActual - 5; i <= añoActual + 2; i++) {
    años.push(i.toString())
  }

  // Cargar grupos administrados
  useEffect(() => {
    const cargarGrupos = async () => {
      try {
        const response = await fetch('/api/usuario/grupos-administrados')
        const data = await response.json()
        setGruposAdministrados(data.grupos || [])
      } catch (error) {
        console.error('Error al cargar grupos:', error)
      }
    }
    cargarGrupos()
  }, [])

  const handleExportar = async () => {
    if (!mesSeleccionado) {
      toast.error("Por favor selecciona un mes")
      return
    }

    if (tipoExportacion === 'grupo' && !grupoSeleccionado) {
      toast.error("Por favor selecciona un grupo")
      return
    }

    try {
      setExportando(true)
      
      const params = new URLSearchParams({
        mes: mesSeleccionado,
        año: añoSeleccionado,
        tipo: tipoExportacion
      })
      
      if (tipoExportacion === 'grupo' && grupoSeleccionado) {
        params.append('grupoId', grupoSeleccionado)
      }
      
      const response = await fetch(`/api/exportar-datos?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Error al generar el archivo')
      }

      // Obtener el archivo como blob
      const blob = await response.blob()
      
      // Crear link de descarga
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `datos-financieros-${meses.find(m => m.value === mesSeleccionado)?.label}-${añoSeleccionado}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success("Archivo exportado exitosamente")
    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al exportar los datos")
    } finally {
      setExportando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Botón de volver */}
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al Dashboard
            </Button>
          </Link>
        </div>

        <div className="text-center mb-8">
          <FileSpreadsheet className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Exportar Datos Financieros
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Descarga un archivo Excel con todos tus datos financieros del mes seleccionado
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuración de Exportación</CardTitle>
            <CardDescription>
              Selecciona el período del cual deseas exportar los datos. El archivo incluirá:
              movimientos, financiación, préstamos, servicios, recurrentes, presupuestos e inversiones.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Selector de Tipo de Exportación */}
            {gruposAdministrados.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Exportación
                </label>
                <Select value={tipoExportacion} onValueChange={(value) => {
                  setTipoExportacion(value)
                  if (value === 'personal') {
                    setGrupoSeleccionado('')
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">📊 Mis datos personales</SelectItem>
                    <SelectItem value="grupo">👥 Datos de grupo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Selector de Grupo Específico */}
            {tipoExportacion === 'grupo' && gruposAdministrados.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Seleccionar Grupo
                </label>
                <Select value={grupoSeleccionado} onValueChange={setGrupoSeleccionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Elegir grupo a exportar" />
                  </SelectTrigger>
                  <SelectContent>
                    {gruposAdministrados.map(grupo => (
                      <SelectItem key={grupo.id} value={grupo.id}>
                        {grupo.nombre} ({grupo.miembros.length} miembros)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Selector de Año */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Año
              </label>
              <Select value={añoSeleccionado} onValueChange={setAñoSeleccionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar año" />
                </SelectTrigger>
                <SelectContent>
                  {años.map(año => (
                    <SelectItem key={año} value={año}>
                      {año}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selector de Mes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mes
              </label>
              <Select value={mesSeleccionado} onValueChange={setMesSeleccionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar mes" />
                </SelectTrigger>
                <SelectContent>
                  {meses.map(mes => (
                    <SelectItem key={mes.value} value={mes.value}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Información del contenido */}
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                El archivo Excel incluirá las siguientes hojas:
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• <strong>Movimientos:</strong> Todos los ingresos y egresos del mes</li>
                <li>• <strong>Financiación:</strong> Movimientos de tarjetas y financiaciones</li>
                <li>• <strong>Préstamos:</strong> Información de préstamos activos y pagos</li>
                <li>• <strong>Servicios:</strong> Gastos de servicios del mes</li>
                <li>• <strong>Recurrentes:</strong> Gastos recurrentes y sus estados</li>
                <li>• <strong>Presupuestos:</strong> Presupuestos del mes y su ejecución</li>
                <li>• <strong>Inversiones:</strong> Movimientos de inversión del período</li>
              </ul>
            </div>

            {/* Botón de exportación */}
            <Button 
              onClick={handleExportar}
              disabled={!mesSeleccionado || exportando || (tipoExportacion === 'grupo' && !grupoSeleccionado)}
              className="w-full"
              size="lg"
            >
              {exportando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando archivo...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Datos
                </>
              )}
            </Button>

            {mesSeleccionado && (
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Se exportarán los datos {tipoExportacion === 'grupo' ? 'del grupo' : 'personales'} de <strong>
                  {meses.find(m => m.value === mesSeleccionado)?.label} {añoSeleccionado}
                </strong>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Información adicional */}
        <div className="mt-8 bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            📋 Información importante:
          </h3>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• Los datos se filtran por fecha de imputación contable</li>
            <li>• El archivo se genera en formato Excel (.xlsx)</li>
            <li>• La descarga comenzará automáticamente al completarse</li>
            <li>• Los datos están organizados en hojas separadas por tipo</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 