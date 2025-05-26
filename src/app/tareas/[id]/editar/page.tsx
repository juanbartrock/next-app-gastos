"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { 
  ArrowLeft,
  Calendar,
  Flag,
  Save,
  Loader2,
  Building,
  TrendingUp,
  DollarSign,
  Target,
  Clock
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { toast } from "sonner"

// Tipos de datos
interface TareaData {
  id: string
  titulo: string
  descripcion?: string
  fechaVencimiento?: string
  prioridad: 'alta' | 'media' | 'baja'
  estado: 'pendiente' | 'completada' | 'cancelada'
  esFinanciera: boolean
  categoria?: string
  recordatorio?: string
  prestamoId?: string
  gastoRecurrenteId?: number
  inversionId?: string
  presupuestoId?: string
  prestamo?: {
    id: string
    entidadFinanciera: string
    numeroCredito?: string
  }
  gastoRecurrente?: {
    id: number
    concepto: string
    monto: number
  }
  inversion?: {
    id: string
    nombre: string
    tipo: {
      nombre: string
    }
  }
  presupuesto?: {
    id: string
    nombre: string
    monto: number
  }
  createdAt: string
}

interface OpcionFinanciera {
  id: string
  nombre: string
  tipo: string
}

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

export default function EditarTareaPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const tareaId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [tarea, setTarea] = useState<TareaData | null>(null)
  
  // Estados del formulario
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [prioridad, setPrioridad] = useState<'alta' | 'media' | 'baja'>('media')
  const [estado, setEstado] = useState<'pendiente' | 'completada' | 'cancelada'>('pendiente')
  const [categoria, setCategoria] = useState('')
  const [recordatorio, setRecordatorio] = useState('')
  const [esFinanciera, setEsFinanciera] = useState(false)
  const [elementoFinancieroId, setElementoFinancieroId] = useState('')
  const [tipoElementoFinanciero, setTipoElementoFinanciero] = useState('')
  
  // Opciones financieras
  const [prestamos, setPrestamos] = useState<OpcionFinanciera[]>([])
  const [gastosRecurrentes, setGastosRecurrentes] = useState<OpcionFinanciera[]>([])
  const [inversiones, setInversiones] = useState<OpcionFinanciera[]>([])
  const [presupuestos, setPresupuestos] = useState<OpcionFinanciera[]>([])

  // Función para obtener la tarea
  const fetchTarea = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tareas/${tareaId}`)
      
      if (response.ok) {
        const data = await response.json()
        setTarea(data)
        
        // Llenar el formulario con los datos existentes
        setTitulo(data.titulo || '')
        setDescripcion(data.descripcion || '')
        setFechaVencimiento(data.fechaVencimiento ? format(new Date(data.fechaVencimiento), 'yyyy-MM-dd') : '')
        setPrioridad(data.prioridad || 'media')
        setEstado(data.estado || 'pendiente')
        setCategoria(data.categoria || '')
        setRecordatorio(data.recordatorio ? format(new Date(data.recordatorio), "yyyy-MM-dd'T'HH:mm") : '')
        setEsFinanciera(data.esFinanciera || false)
        
        // Configurar elemento financiero si existe
        if (data.prestamoId) {
          setTipoElementoFinanciero('prestamo')
          setElementoFinancieroId(data.prestamoId)
        } else if (data.gastoRecurrenteId) {
          setTipoElementoFinanciero('gastoRecurrente')
          setElementoFinancieroId(data.gastoRecurrenteId.toString())
        } else if (data.inversionId) {
          setTipoElementoFinanciero('inversion')
          setElementoFinancieroId(data.inversionId)
        } else if (data.presupuestoId) {
          setTipoElementoFinanciero('presupuesto')
          setElementoFinancieroId(data.presupuestoId)
        }
        
      } else if (response.status === 404) {
        toast.error('Tarea no encontrada')
        router.push('/tareas')
      } else {
        toast.error('Error al cargar la tarea')
      }
    } catch (error) {
      console.error('Error al cargar tarea:', error)
      toast.error('Error al cargar la tarea')
    } finally {
      setLoading(false)
    }
  }

  // Función para obtener opciones financieras
  const fetchOpcionesFinancieras = async () => {
    try {
      // Obtener préstamos
      const prestamosRes = await fetch('/api/prestamos')
      if (prestamosRes.ok) {
        const prestamosData = await prestamosRes.json()
        setPrestamos(prestamosData.prestamos?.map((p: any) => ({
          id: p.id,
          nombre: `${p.entidadFinanciera} - ${p.numeroCredito || 'Sin número'}`,
          tipo: 'prestamo'
        })) || [])
      }

      // Obtener gastos recurrentes
      const gastosRes = await fetch('/api/recurrentes')
      if (gastosRes.ok) {
        const gastosData = await gastosRes.json()
        setGastosRecurrentes(gastosData.gastosRecurrentes?.map((g: any) => ({
          id: g.id.toString(),
          nombre: `${g.concepto} - $${g.monto.toLocaleString('es-AR')}`,
          tipo: 'gastoRecurrente'
        })) || [])
      }

      // Obtener inversiones
      const inversionesRes = await fetch('/api/inversiones')
      if (inversionesRes.ok) {
        const inversionesData = await inversionesRes.json()
        setInversiones(inversionesData.inversiones?.map((i: any) => ({
          id: i.id,
          nombre: `${i.nombre} (${i.tipo?.nombre || 'Sin tipo'})`,
          tipo: 'inversion'
        })) || [])
      }

      // Obtener presupuestos
      const presupuestosRes = await fetch('/api/presupuestos')
      if (presupuestosRes.ok) {
        const presupuestosData = await presupuestosRes.json()
        setPresupuestos(presupuestosData.presupuestos?.map((p: any) => ({
          id: p.id,
          nombre: `${p.nombre} - $${p.monto.toLocaleString('es-AR')} (${p.mes}/${p.año})`,
          tipo: 'presupuesto'
        })) || [])
      }
    } catch (error) {
      console.error('Error al cargar opciones financieras:', error)
    }
  }

  useEffect(() => {
    if (session?.user && tareaId) {
      fetchTarea()
      fetchOpcionesFinancieras()
    }
  }, [session, tareaId])

  // Función para guardar cambios
  const guardarCambios = async () => {
    if (!titulo.trim()) {
      toast.error('El título es obligatorio')
      return
    }

    try {
      setGuardando(true)
      
      const datosActualizacion: any = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        fechaVencimiento: fechaVencimiento || null,
        prioridad,
        estado,
        categoria: categoria || null,
        recordatorio: recordatorio || null,
      }

      // Configurar elemento financiero
      if (esFinanciera && tipoElementoFinanciero && elementoFinancieroId) {
        // Limpiar todas las relaciones primero
        datosActualizacion.prestamoId = null
        datosActualizacion.gastoRecurrenteId = null
        datosActualizacion.inversionId = null
        datosActualizacion.presupuestoId = null
        
        // Establecer la relación correcta
        switch (tipoElementoFinanciero) {
          case 'prestamo':
            datosActualizacion.prestamoId = elementoFinancieroId
            break
          case 'gastoRecurrente':
            datosActualizacion.gastoRecurrenteId = parseInt(elementoFinancieroId)
            break
          case 'inversion':
            datosActualizacion.inversionId = elementoFinancieroId
            break
          case 'presupuesto':
            datosActualizacion.presupuestoId = elementoFinancieroId
            break
        }
      } else {
        // Si no es financiera, limpiar todas las relaciones
        datosActualizacion.prestamoId = null
        datosActualizacion.gastoRecurrenteId = null
        datosActualizacion.inversionId = null
        datosActualizacion.presupuestoId = null
      }

      const response = await fetch(`/api/tareas/${tareaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosActualizacion),
      })

      if (response.ok) {
        toast.success('Tarea actualizada correctamente')
        router.push(`/tareas/${tareaId}`)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Error al actualizar la tarea')
      }
    } catch (error) {
      console.error('Error al actualizar tarea:', error)
      toast.error('Error al actualizar la tarea')
    } finally {
      setGuardando(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session?.user) {
    router.push('/login')
    return null
  }

  if (!tarea) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Tarea no encontrada</h1>
          <Button asChild>
            <Link href="/tareas">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a tareas
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/tareas/${tareaId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar Tarea</h1>
            <p className="text-muted-foreground">
              Modifica los detalles de tu tarea
            </p>
          </div>
        </div>
        
        <Button onClick={guardarCambios} disabled={guardando}>
          {guardando ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Guardar cambios
        </Button>
      </div>

      {/* Formulario */}
      <div className="space-y-6">
        {/* Información básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>
              Detalles principales de la tarea
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: Revisar estado de inversión en FCI"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe los detalles de la tarea..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prioridad">Prioridad</Label>
                <Select value={prioridad} onValueChange={(value: 'alta' | 'media' | 'baja') => setPrioridad(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">
                      <div className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-red-600" />
                        Alta
                      </div>
                    </SelectItem>
                    <SelectItem value="media">
                      <div className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-yellow-600" />
                        Media
                      </div>
                    </SelectItem>
                    <SelectItem value="baja">
                      <div className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-green-600" />
                        Baja
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select value={estado} onValueChange={(value: 'pendiente' | 'completada' | 'cancelada') => setEstado(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="completada">Completada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Select value={categoria || undefined} onValueChange={setCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Fechas */}
        <Card>
          <CardHeader>
            <CardTitle>Fechas</CardTitle>
            <CardDescription>
              Configura fechas importantes para la tarea
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fechaVencimiento">Fecha de vencimiento</Label>
                <Input
                  id="fechaVencimiento"
                  type="date"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recordatorio">Recordatorio</Label>
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

        {/* Contexto financiero */}
        <Card>
          <CardHeader>
            <CardTitle>Contexto Financiero</CardTitle>
            <CardDescription>
              Vincula esta tarea con elementos financieros específicos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="esFinanciera"
                checked={esFinanciera}
                onCheckedChange={(checked) => {
                  setEsFinanciera(checked as boolean)
                  if (!checked) {
                    setTipoElementoFinanciero('')
                    setElementoFinancieroId('')
                  }
                }}
              />
              <Label htmlFor="esFinanciera">
                Esta es una tarea financiera
              </Label>
            </div>

            {esFinanciera && (
              <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                <div className="space-y-2">
                  <Label>Tipo de elemento financiero</Label>
                  <Select value={tipoElementoFinanciero || undefined} onValueChange={setTipoElementoFinanciero}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prestamo">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Préstamo
                        </div>
                      </SelectItem>
                      <SelectItem value="gastoRecurrente">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Gasto Recurrente
                        </div>
                      </SelectItem>
                      <SelectItem value="inversion">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Inversión
                        </div>
                      </SelectItem>
                      <SelectItem value="presupuesto">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Presupuesto
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {tipoElementoFinanciero && (
                  <div className="space-y-2">
                    <Label>Elemento específico</Label>
                    <Select value={elementoFinancieroId || undefined} onValueChange={setElementoFinancieroId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el elemento" />
                      </SelectTrigger>
                      <SelectContent>
                        {tipoElementoFinanciero === 'prestamo' && prestamos.map((prestamo) => (
                          <SelectItem key={prestamo.id} value={prestamo.id}>
                            {prestamo.nombre}
                          </SelectItem>
                        ))}
                        {tipoElementoFinanciero === 'gastoRecurrente' && gastosRecurrentes.map((gasto) => (
                          <SelectItem key={gasto.id} value={gasto.id}>
                            {gasto.nombre}
                          </SelectItem>
                        ))}
                        {tipoElementoFinanciero === 'inversion' && inversiones.map((inversion) => (
                          <SelectItem key={inversion.id} value={inversion.id}>
                            {inversion.nombre}
                          </SelectItem>
                        ))}
                        {tipoElementoFinanciero === 'presupuesto' && presupuestos.map((presupuesto) => (
                          <SelectItem key={presupuesto.id} value={presupuesto.id}>
                            {presupuesto.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 