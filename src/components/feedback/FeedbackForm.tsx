"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { Loader2, Upload, X, Bug, Lightbulb, MessageSquare, Zap, Monitor, Plus } from "lucide-react"
import { TipoFeedback, PrioridadFeedback } from "@prisma/client"

// Detectar información del dispositivo
function detectDeviceInfo() {
  if (typeof window === 'undefined') return {
    dispositivo: "Servidor",
    navegador: "SSR",
    sistemaOS: "Unknown"
  }

  const userAgent = navigator.userAgent
  const platform = navigator.platform
  
  // Detectar SO
  let sistemaOS = "Unknown"
  if (userAgent.includes("Windows")) sistemaOS = "Windows"
  else if (userAgent.includes("Mac")) sistemaOS = "macOS"
  else if (userAgent.includes("Linux")) sistemaOS = "Linux"
  else if (userAgent.includes("Android")) sistemaOS = "Android"
  else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) sistemaOS = "iOS"

  // Detectar navegador
  let navegador = "Unknown"
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) navegador = "Chrome"
  else if (userAgent.includes("Firefox")) navegador = "Firefox"
  else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) navegador = "Safari"
  else if (userAgent.includes("Edg")) navegador = "Edge"

  // Detectar dispositivo aproximado
  let dispositivo = "Desktop"
  if (userAgent.includes("Mobile")) dispositivo = "Mobile"
  else if (userAgent.includes("Tablet")) dispositivo = "Tablet"

  return {
    dispositivo: `${dispositivo} - ${sistemaOS}`,
    navegador: `${navegador} ${getNavigatorVersion()}`,
    sistemaOS
  }
}

function getNavigatorVersion() {
  if (typeof window === 'undefined') return ""
  
  const userAgent = navigator.userAgent
  const versionMatch = userAgent.match(/(?:Chrome|Firefox|Safari|Edg)\/([0-9.]+)/)
  return versionMatch ? versionMatch[1] : ""
}

const tiposIcon = {
  [TipoFeedback.BUG]: { icon: Bug, color: "text-red-500", label: "Bug / Error" },
  [TipoFeedback.MEJORA]: { icon: Lightbulb, color: "text-yellow-500", label: "Mejora" },
  [TipoFeedback.SUGERENCIA]: { icon: MessageSquare, color: "text-blue-500", label: "Sugerencia" },
  [TipoFeedback.PROBLEMA_RENDIMIENTO]: { icon: Zap, color: "text-orange-500", label: "Problema de Rendimiento" },
  [TipoFeedback.ERROR_INTERFAZ]: { icon: Monitor, color: "text-purple-500", label: "Error de Interfaz" },
  [TipoFeedback.FUNCIONALIDAD_FALTANTE]: { icon: Plus, color: "text-green-500", label: "Funcionalidad Faltante" }
}

const prioridadesConfig = {
  [PrioridadFeedback.BAJA]: { color: "text-green-600", label: "Baja" },
  [PrioridadFeedback.MEDIA]: { color: "text-yellow-600", label: "Media" },
  [PrioridadFeedback.ALTA]: { color: "text-orange-600", label: "Alta" },
  [PrioridadFeedback.CRITICA]: { color: "text-red-600", label: "Crítica" }
}

export function FeedbackForm() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [deviceInfo, setDeviceInfo] = useState({
    dispositivo: "",
    navegador: "",
    sistemaOS: ""
  })

  // Estados del formulario
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [tipo, setTipo] = useState<TipoFeedback | "">("")
  const [prioridad, setPrioridad] = useState<PrioridadFeedback | "">("")
  const [versionApp, setVersionApp] = useState("1.0.0-beta")
  const [dispositivo, setDispositivo] = useState("")
  const [enviarLogs, setEnviarLogs] = useState(true)
  const [capturaPantalla, setCapturaPantalla] = useState<File | null>(null)

  // Detectar información del dispositivo al cargar
  useEffect(() => {
    const info = detectDeviceInfo()
    setDeviceInfo(info)
    setDispositivo(info.dispositivo)
  }, [])

  // Validaciones
  const tituloValido = titulo.length >= 5 && titulo.length <= 80
  const descripcionValida = descripcion.length >= 20
  const formularioValido = tituloValido && descripcionValida && tipo && prioridad

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formularioValido) {
      toast.error("Por favor, completa todos los campos requeridos")
      return
    }

    setLoading(true)

    try {
      const metadata = {
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
        url: typeof window !== 'undefined' ? window.location.href : '',
        timestamp: new Date().toISOString(),
        screenResolution: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '',
        viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : ''
      }

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          titulo,
          descripcion,
          tipo,
          prioridad,
          versionApp,
          dispositivo,
          navegador: deviceInfo.navegador,
          sistemaOS: deviceInfo.sistemaOS,
          enviarLogs,
          metadata
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar feedback')
      }

      toast.success(`¡Gracias! Reporte #${data.id.slice(-8)} recibido`, {
        description: "Recibirás una notificación cuando tengamos una respuesta"
      })

      // Limpiar formulario
      setTitulo("")
      setDescripcion("")
      setTipo("")
      setPrioridad("")
      setCapturaPantalla(null)

      // Redirigir al historial
      router.push('/beta-feedback/historial')

    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al enviar feedback')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error("La imagen debe ser menor a 5MB")
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error("Solo se permiten archivos de imagen")
        return
      }
      setCapturaPantalla(file)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-blue-500" />
          Beta Feedback
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ayúdanos a mejorar FinanzIA reportando bugs, sugiriendo mejoras o compartiendo tu experiencia
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Título / Asunto */}
          <div className="space-y-2">
            <Label htmlFor="titulo">
              Título / Asunto <span className="text-red-500">*</span>
            </Label>
            <Input
              id="titulo"
              placeholder="Ejemplo: No carga pantalla de login"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className={!tituloValido && titulo.length > 0 ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground">
              {titulo.length}/80 caracteres {!tituloValido && titulo.length > 0 && "(mínimo 5 caracteres)"}
            </p>
          </div>

          {/* 2. Descripción detallada */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">
              Descripción detallada <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="descripcion"
              placeholder="Pasos para reproducir, resultado esperado vs obtenido, contexto adicional..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={4}
              className={!descripcionValida && descripcion.length > 0 ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground">
              {descripcion.length} caracteres {!descripcionValida && descripcion.length > 0 && "(mínimo 20 caracteres)"}
            </p>
          </div>

          {/* 3. Tipo de feedback */}
          <div className="space-y-2">
            <Label>
              Tipo de feedback <span className="text-red-500">*</span>
            </Label>
            <Select value={tipo} onValueChange={(value) => setTipo(value as TipoFeedback)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de feedback" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(tiposIcon).map(([key, config]) => {
                  const IconComponent = config.icon
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <IconComponent className={`h-4 w-4 ${config.color}`} />
                        {config.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* 4. Prioridad */}
          <div className="space-y-2">
            <Label>
              Prioridad <span className="text-red-500">*</span>
            </Label>
            <Select value={prioridad} onValueChange={(value) => setPrioridad(value as PrioridadFeedback)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona la prioridad" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(prioridadesConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <span className={config.color}>{config.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Grid para campos técnicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 5. Versión de la app */}
            <div className="space-y-2">
              <Label htmlFor="version">Versión de la app</Label>
              <Input
                id="version"
                value={versionApp}
                onChange={(e) => setVersionApp(e.target.value)}
                placeholder="v1.0.0-beta"
              />
            </div>

            {/* 6. Dispositivo / SO */}
            <div className="space-y-2">
              <Label htmlFor="dispositivo">Dispositivo / SO</Label>
              <Input
                id="dispositivo"
                value={dispositivo}
                onChange={(e) => setDispositivo(e.target.value)}
                placeholder="Ejemplo: Pixel 7 - Android 14"
              />
            </div>
          </div>

          {/* 7. Adjuntar captura */}
          <div className="space-y-2">
            <Label htmlFor="captura">Adjuntar captura (opcional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="captura"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('captura')?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Seleccionar imagen
              </Button>
              {capturaPantalla && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  {capturaPantalla.name}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCapturaPantalla(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              PNG/JPG - Máximo 5MB
            </p>
          </div>

          {/* 8. Enviar logs anónimos */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="logs"
              checked={enviarLogs}
              onCheckedChange={(checked) => setEnviarLogs(checked as boolean)}
            />
            <Label 
              htmlFor="logs" 
              className="text-sm font-normal cursor-pointer"
            >
              Enviar logs anónimos para ayudar en el diagnóstico
            </Label>
          </div>

          {/* Información técnica detectada */}
          <Alert>
            <AlertDescription className="text-xs">
              <strong>Información técnica detectada:</strong><br />
              Navegador: {deviceInfo.navegador}<br />
              Sistema: {deviceInfo.sistemaOS}<br />
              Dispositivo: {deviceInfo.dispositivo}
            </AlertDescription>
          </Alert>

          {/* 9. Botón Enviar */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!formularioValido || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando feedback...
              </>
            ) : (
              <>
                <Bug className="mr-2 h-4 w-4" />
                Enviar Feedback
              </>
            )}
          </Button>

          {!formularioValido && (
            <p className="text-xs text-muted-foreground text-center">
              Complete todos los campos obligatorios para enviar el feedback
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
} 