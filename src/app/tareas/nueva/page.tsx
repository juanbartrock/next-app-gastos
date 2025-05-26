"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { 
  CheckSquare2, 
  ArrowLeft,
  Calendar,
  Flag,
  Building2,
  Repeat,
  TrendingUp,
  PieChart,
  Loader2,
  Save,
  Bell
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

const categorias = [
  'finanzas',
  'inversiones',
  'presupuestos',
  'préstamos',
  'personal',
  'hogar',
  'trabajo',
  'salud',
  'educación',
  'ocio'
]

const prioridades = [
  { value: 'alta', label: 'Alta', color: 'text-red-600' },
  { value: 'media', label: 'Media', color: 'text-yellow-600' },
  { value: 'baja', label: 'Baja', color: 'text-green-600' }
]

// Tipos para datos relacionados
interface PrestamoData {
  id: string
  entidadFinanciera: string
  numeroCredito?: string
}

interface GastoRecurrenteData {
  id: number
  concepto: string
  monto: number
}

interface InversionData {
  id: string
  nombre: string
  tipo: {
    nombre: string
  }
}

interface PresupuestoData {
  id: string
  nombre: string
  monto: number
}

export default function NuevaTareaPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [guardando, setGuardando] = useState(false)
  
  // Estados del formulario
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [prioridad, setPrioridad] = useState('media')
  const [categoria, setCategoria] = useState('')
  const [esFinanciera, setEsFinanciera] = useState(false)
  const [recordatorio, setRecordatorio] = useState('')
  
  // Relaciones financieras
  const [prestamoId, setPrestamoId] = useState('')
  const [gastoRecurrenteId, setGastoRecurrenteId] = useState('')
  const [inversionId, setInversionId] = useState('')
  const [presupuestoId, setPresupuestoId] = useState('')
  
  // Datos para selectores
  const [prestamos, setPrestamos] = useState<PrestamoData[]>([])
  const [gastosRecurrentes, setGastosRecurrentes] = useState<GastoRecurrenteData[]>([])
  const [inversiones, setInversiones] = useState<InversionData[]>([])
  const [presupuestos, setPresupuestos] = useState<PresupuestoData[]>([])

  // Cargar datos relacionados cuando sea una tarea financiera
  useEffect(() => {
    if (esFinanciera && session?.user) {
      fetchDatosFinancieros()
    }
  }, [esFinanciera, session])

  const fetchDatosFinancieros = async () => {
    try {
      setLoading(true)
      
      // Cargar préstamos
      const prestamosResponse = await fetch('/api/prestamos')
      if (prestamosResponse.ok) {
        const prestamosData = await prestamosResponse.json()
        setPrestamos(prestamosData.prestamos || [])
      }
      
      // Cargar gastos recurrentes
      const recurrentesResponse = await fetch('/api/recurrentes')
      if (recurrentesResponse.ok) {
        const recurrentesData = await recurrentesResponse.json()
        setGastosRecurrentes(recurrentesData || [])
      }
      
      // Cargar inversiones
      const inversionesResponse = await fetch('/api/inversiones')
      if (inversionesResponse.ok) {
        const inversionesData = await inversionesResponse.json()
        setInversiones(inversionesData || [])
      }
      
      // Cargar presupuestos
      const presupuestosResponse = await fetch('/api/presupuestos')
      if (presupuestosResponse.ok) {
        const presupuestosData = await presupuestosResponse.json()
        setPresupuestos(presupuestosData || [])
      }
    } catch (error) {
      console.error('Error al cargar datos financieros:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!titulo.trim()) {
      toast.error('El título es requerido')
      return
    }
    
    try {
      setGuardando(true)
      
      const tareaData = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        fechaVencimiento: fechaVencimiento || undefined,
        prioridad,
        categoria: categoria || undefined,
        esFinanciera,
        recordatorio: recordatorio || undefined,
        prestamoId: prestamoId || undefined,
        gastoRecurrenteId: gastoRecurrenteId || undefined,
        inversionId: inversionId || undefined,
        presupuestoId: presupuestoId || undefined,
      }
      
      const response = await fetch('/api/tareas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tareaData),
      })
      
      if (response.ok) {
        toast.success('Tarea creada exitosamente')
        router.push('/tareas')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Error al crear la tarea')
      }
    } catch (error) {
      console.error('Error al crear tarea:', error)
      toast.error('Error al crear la tarea')
    } finally {
      setGuardando(false)
    }
  }

  // Limpiar relaciones cuando se cambia el tipo de tarea
  useEffect(() => {
    if (!esFinanciera) {
      setPrestamoId('')
      setGastoRecurrenteId('')
      setInversionId('')
      setPresupuestoId('')
    }
  }, [esFinanciera])

  if (status === "loading") {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-1" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver</span>
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <CheckSquare2 className="h-7 w-7 mr-2 text-purple-600" />
            Nueva Tarea
          </h1>
          <p className="text-muted-foreground">
            Crea una nueva tarea o recordatorio
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>
              Datos principales de la tarea
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                placeholder="Ej: Revisar estado de cuenta bancario"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                placeholder="Detalles adicionales sobre la tarea..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="prioridad">Prioridad</Label>
                <Select value={prioridad} onValueChange={setPrioridad}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {prioridades.map(prio => (
                      <SelectItem key={prio.value} value={prio.value}>
                        <div className="flex items-center gap-2">
                          <Flag className={`h-3 w-3 ${prio.color}`} />
                          {prio.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fechas y recordatorios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Fechas y Recordatorios
            </CardTitle>
            <CardDescription>
              Configura cuándo vence la tarea y cuándo quieres ser recordado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fechaVencimiento">Fecha de vencimiento</Label>
                <Input
                  id="fechaVencimiento"
                  type="datetime-local"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="recordatorio" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Recordatorio
                </Label>
                <Input
                  id="recordatorio"
                  type="datetime-local"
                  value={recordatorio}
                  onChange={(e) => setRecordatorio(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración financiera */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración Financiera</CardTitle>
            <CardDescription>
              Si es una tarea relacionada con finanzas, puedes vincularla a préstamos, inversiones, etc.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="esFinanciera">Tarea financiera</Label>
                <p className="text-sm text-muted-foreground">
                  Marcar si esta tarea está relacionada con aspectos financieros
                </p>
              </div>
              <Switch
                id="esFinanciera"
                checked={esFinanciera}
                onCheckedChange={setEsFinanciera}
              />
            </div>
            
            {esFinanciera && (
              <div className="space-y-4 border-t pt-4">
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2">Cargando datos financieros...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Préstamo relacionado
                      </Label>
                      <Select value={prestamoId} onValueChange={setPrestamoId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar préstamo" />
                        </SelectTrigger>
                        <SelectContent>
                          {prestamos.map(prestamo => (
                            <SelectItem key={prestamo.id} value={prestamo.id}>
                              {prestamo.entidadFinanciera}
                              {prestamo.numeroCredito && ` - ${prestamo.numeroCredito}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Repeat className="h-4 w-4" />
                        Gasto recurrente
                      </Label>
                      <Select value={gastoRecurrenteId} onValueChange={setGastoRecurrenteId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar gasto recurrente" />
                        </SelectTrigger>
                        <SelectContent>
                          {gastosRecurrentes.map(gasto => (
                            <SelectItem key={gasto.id} value={gasto.id.toString()}>
                              {gasto.concepto} - ${gasto.monto}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Inversión relacionada
                      </Label>
                      <Select value={inversionId} onValueChange={setInversionId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar inversión" />
                        </SelectTrigger>
                        <SelectContent>
                          {inversiones.map(inversion => (
                            <SelectItem key={inversion.id} value={inversion.id}>
                              {inversion.nombre} ({inversion.tipo.nombre})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <PieChart className="h-4 w-4" />
                        Presupuesto relacionado
                      </Label>
                      <Select value={presupuestoId} onValueChange={setPresupuestoId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar presupuesto" />
                        </SelectTrigger>
                        <SelectContent>
                          {presupuestos.map(presupuesto => (
                            <SelectItem key={presupuesto.id} value={presupuesto.id}>
                              {presupuesto.nombre} - ${presupuesto.monto}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vista previa */}
        {titulo && (
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa</CardTitle>
              <CardDescription>
                Así se verá tu tarea una vez creada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30">
                <div className="h-5 w-5 rounded border-2 border-purple-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm leading-none truncate">
                      {titulo}
                    </p>
                    <Badge variant={
                      prioridad === 'alta' ? 'destructive' : 
                      prioridad === 'baja' ? 'secondary' : 'default'
                    } className="text-xs flex-shrink-0">
                      <Flag className="h-3 w-3 mr-1" />
                      {prioridad}
                    </Badge>
                  </div>
                  
                  {descripcion && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {descripcion}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-yellow-100 text-yellow-800">
                      pendiente
                    </Badge>
                    
                    {categoria && (
                      <Badge variant="outline" className="text-xs">
                        {categoria}
                      </Badge>
                    )}
                    
                    {esFinanciera && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                        Financiera
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botones de acción */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={guardando}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={guardando || !titulo.trim()}
          >
            {guardando ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Crear Tarea
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 