'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, Upload, CheckCircle, Loader2 } from "lucide-react"

interface DatosTransferencia {
  monto: number
  bancoEmisor: string
  bancoReceptor: string
  cbuEmisor: string
  cbuReceptor: string
  concepto: string
  fecha: string
  destinatarioNombre: string
}

interface DatosServicio {
  importe: number
  entidad: string
  concepto: string
  fechaPago: string
  codigoLinkPagos: string
  numeroReferencia: string
}

interface DatosResumen {
  banco: string
  numeroTarjeta: string
  titular: string
  fechaVencimiento: string
  pagoMinimo: number
  saldoTotal: number
  fechaResumen: string
  movimientos: Array<{
    fecha: string
    comercio: string
    monto: number
  }>
}

export default function PruebaOCRComprobantes() {
  const [procesando, setProcesando] = useState<{[key: string]: boolean}>({})
  const [resultados, setResultados] = useState<{[key: string]: any}>({})
  const [errores, setErrores] = useState<{[key: string]: string}>({})

  const procesarImagen = async (archivo: File, tipo: 'transferencia' | 'servicio' | 'resumen') => {
    const key = `${tipo}_${Date.now()}`
    setProcesando(prev => ({ ...prev, [key]: true }))
    setErrores(prev => ({ ...prev, [key]: '' }))

    try {
      // Convertir archivo a base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const result = reader.result as string
          resolve(result.split(',')[1]) // Remover prefijo data:image/...;base64,
        }
        reader.readAsDataURL(archivo)
      })

      // Llamar a la API correspondiente
      const response = await fetch(`/api/ocr/test-${tipo}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imagen: base64,
          nombreArchivo: archivo.name
        })
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const datos = await response.json()
      setResultados(prev => ({ ...prev, [key]: datos }))

    } catch (error) {
      console.error(`Error procesando ${tipo}:`, error)
      setErrores(prev => ({ 
        ...prev, 
        [key]: error instanceof Error ? error.message : 'Error desconocido' 
      }))
    } finally {
      setProcesando(prev => ({ ...prev, [key]: false }))
    }
  }

  const ComponenteSubida = ({ 
    tipo, 
    titulo, 
    descripcion 
  }: { 
    tipo: 'transferencia' | 'servicio' | 'resumen'
    titulo: string
    descripcion: string 
  }) => {
    const [archivo, setArchivo] = useState<File | null>(null)
    const key = archivo ? `${tipo}_${archivo.name}` : ''
    const estaProcessando = procesando[key]
    const resultado = resultados[key]
    const error = errores[key]

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{titulo}</CardTitle>
          <CardDescription>{descripcion}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor={`file-${tipo}`}>Seleccionar imagen</Label>
            <Input
              id={`file-${tipo}`}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                setArchivo(file || null)
              }}
            />
          </div>

          {archivo && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{archivo.name}</Badge>
                <Badge variant="secondary">{(archivo.size / 1024).toFixed(1)} KB</Badge>
              </div>

              <Button
                onClick={() => procesarImagen(archivo, tipo)}
                disabled={estaProcessando}
                className="w-full"
              >
                {estaProcessando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Procesar con OCR
                  </>
                )}
              </Button>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                </div>
              )}

              {resultado && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      Procesado exitosamente
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(resultado, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Prueba OCR - Comprobantes</h1>
        <p className="text-muted-foreground mt-2">
          Página de prueba para iterar y mejorar el reconocimiento óptico de caracteres en diferentes tipos de comprobantes.
        </p>
      </div>

      <Tabs defaultValue="transferencia" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transferencia">Transferencias</TabsTrigger>
          <TabsTrigger value="servicio">Servicios</TabsTrigger>
          <TabsTrigger value="resumen">Resúmenes TC</TabsTrigger>
        </TabsList>

        <TabsContent value="transferencia" className="mt-6">
          <ComponenteSubida
            tipo="transferencia"
            titulo="Comprobantes de Transferencia"
            descripcion="Sube una imagen de un comprobante de transferencia bancaria (Banco Ciudad, Macro, etc.)"
          />
        </TabsContent>

        <TabsContent value="servicio" className="mt-6">
          <ComponenteSubida
            tipo="servicio"
            titulo="Comprobantes de Servicios"
            descripcion="Sube una imagen de un comprobante de pago de servicios (Edenor, Metrogas, etc.)"
          />
        </TabsContent>

        <TabsContent value="resumen" className="mt-6">
          <ComponenteSubida
            tipo="resumen"
            titulo="Resúmenes de Tarjeta de Crédito"
            descripcion="Sube una imagen de un resumen de tarjeta de crédito (Banco Macro, Banco Ciudad, etc.)"
          />
        </TabsContent>
      </Tabs>

      <Separator className="my-8" />

      <div className="text-sm text-muted-foreground">
        <h3 className="font-medium mb-2">Instrucciones:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Selecciona el tipo de comprobante en las pestañas superiores</li>
          <li>Sube una imagen clara del comprobante (PNG, JPG, etc.)</li>
          <li>Haz clic en "Procesar con OCR" para analizar</li>
          <li>Revisa los datos extraídos y ajusta los prompts según sea necesario</li>
        </ul>
      </div>
    </div>
  )
} 