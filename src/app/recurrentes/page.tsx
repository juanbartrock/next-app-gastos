"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Edit, Pencil, Repeat, Trash2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"

// Tipos
type GastoRecurrente = {
  id: number
  concepto: string
  periodicidad: string
  monto: number
  comentario?: string
  estado: string
  proximaFecha?: Date
  ultimoPago?: Date
  categoriaId?: number
  categoria?: {
    id: number
    descripcion: string
  }
}

type Categoria = {
  id: number
  descripcion: string
}

// Componente de carga
function LoadingScreen() {
  return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
}

export default function RecurrentesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [gastos, setGastos] = useState<GastoRecurrente[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingGasto, setEditingGasto] = useState<GastoRecurrente | null>(null)
  
  // Estados para el formulario
  const [concepto, setConcepto] = useState("")
  const [periodicidad, setPeriodicidad] = useState("mensual")
  const [monto, setMonto] = useState("")
  const [comentario, setComentario] = useState("")
  const [estado, setEstado] = useState("pendiente")
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined)
  const [proximaFecha, setProximaFecha] = useState<Date | undefined>(undefined)

  // Cargar datos iniciales
  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Cargar gastos recurrentes
      const respGastos = await fetch('/api/recurrentes')
      if (respGastos.ok) {
        const datos = await respGastos.json()
        setGastos(datos)
      }
      
      // Cargar categorías
      const respCategorias = await fetch('/api/categorias')
      if (respCategorias.ok) {
        const datosCategorias = await respCategorias.json()
        setCategorias(datosCategorias)
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
      toast.error('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  // Efecto para redireccionar si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      fetchData()
    }
  }, [status, router])

  // Efecto para reiniciar formulario cuando se cambia el gasto en edición
  useEffect(() => {
    if (editingGasto) {
      setConcepto(editingGasto.concepto)
      setPeriodicidad(editingGasto.periodicidad)
      setMonto(editingGasto.monto.toString())
      setComentario(editingGasto.comentario || "")
      setEstado(editingGasto.estado)
      setCategoriaId(editingGasto.categoriaId)
      setProximaFecha(editingGasto.proximaFecha ? new Date(editingGasto.proximaFecha) : undefined)
    } else {
      resetForm()
    }
  }, [editingGasto])

  // Resetear formulario
  const resetForm = () => {
    setConcepto("")
    setPeriodicidad("mensual")
    setMonto("")
    setComentario("")
    setEstado("pendiente")
    setCategoriaId(undefined)
    setProximaFecha(undefined)
    setEditingGasto(null)
  }

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!concepto || !periodicidad || !monto) {
      toast.error('Por favor completa los campos obligatorios')
      return
    }
    
    try {
      const gastoData = {
        concepto,
        periodicidad,
        monto: parseFloat(monto),
        comentario,
        estado,
        categoriaId,
        proximaFecha
      }
      
      let response
      
      if (editingGasto) {
        // Actualizar gasto existente
        response = await fetch(`/api/recurrentes/${editingGasto.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(gastoData)
        })
      } else {
        // Crear nuevo gasto
        response = await fetch('/api/recurrentes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(gastoData)
        })
      }
      
      if (!response.ok) {
        throw new Error('Error al procesar la solicitud')
      }
      
      toast.success(editingGasto ? 'Gasto actualizado correctamente' : 'Gasto creado correctamente')
      fetchData()
      resetForm()
      setIsFormOpen(false)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al guardar el gasto recurrente')
    }
  }

  // Eliminar gasto
  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este gasto recurrente?')) {
      return
    }
    
    try {
      const response = await fetch(`/api/recurrentes/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Error al eliminar')
      }
      
      toast.success('Gasto eliminado correctamente')
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al eliminar el gasto')
    }
  }

  // Editar gasto
  const handleEdit = (gasto: GastoRecurrente) => {
    setEditingGasto(gasto)
    setIsFormOpen(true)
  }

  // Si está cargando, mostrar pantalla de carga
  if (status === "loading" || loading) {
    return <LoadingScreen />
  }

  // Si no está autenticado, no mostrar nada (la redirección se maneja en el efecto)
  if (status === "unauthenticated") {
    return null
  }

  // Función para formatear fechas
  const formatFecha = (fecha?: Date) => {
    if (!fecha) return "No definida"
    return format(new Date(fecha), 'dd/MM/yyyy', { locale: es })
  }

  // Obtener estado con estilo
  const getEstadoClase = (estado: string) => {
    switch (estado) {
      case 'pagado': return 'text-green-600 dark:text-green-400 font-medium'
      case 'parcial': return 'text-yellow-600 dark:text-yellow-400 font-medium'
      case 'pendiente': return 'text-red-600 dark:text-red-400 font-medium'
      case 'n/a': return 'text-gray-500 dark:text-gray-400'
      default: return ''
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gastos Recurrentes</h1>
          <div className="flex gap-4">
            <Button variant="default" onClick={() => { resetForm(); setIsFormOpen(true); }}>
              Nuevo Gasto Recurrente
            </Button>
            <Button variant="outline" onClick={() => router.push("/")}>
              Volver al Inicio
            </Button>
          </div>
        </div>

        {/* Formulario en diálogo */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>{editingGasto ? 'Editar' : 'Nuevo'} Gasto Recurrente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="concepto">Concepto *</Label>
                  <Input 
                    id="concepto" 
                    value={concepto} 
                    onChange={(e) => setConcepto(e.target.value)} 
                    placeholder="Nombre del gasto" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="periodicidad">Periodicidad *</Label>
                  <Select value={periodicidad} onValueChange={setPeriodicidad} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar periodicidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensual">Mensual</SelectItem>
                      <SelectItem value="bimestral">Bimestral</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="semestral">Semestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monto">Monto *</Label>
                  <Input 
                    id="monto" 
                    type="number" 
                    step="0.01" 
                    value={monto} 
                    onChange={(e) => setMonto(e.target.value)} 
                    placeholder="0.00" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoría</Label>
                  <Select 
                    value={categoriaId?.toString()} 
                    onValueChange={(val) => setCategoriaId(val ? parseInt(val) : undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.descripcion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select value={estado} onValueChange={setEstado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="parcial">Pago Parcial</SelectItem>
                      <SelectItem value="pagado">Pagado</SelectItem>
                      <SelectItem value="n/a">No Aplica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proximaFecha">Próxima Fecha</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {proximaFecha ? (
                          format(proximaFecha, 'PPP', { locale: es })
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={proximaFecha}
                        onSelect={setProximaFecha}
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="comentario">Comentario</Label>
                <Input 
                  id="comentario" 
                  value={comentario} 
                  onChange={(e) => setComentario(e.target.value)} 
                  placeholder="Comentario opcional" 
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => { resetForm(); setIsFormOpen(false); }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingGasto ? 'Actualizar' : 'Guardar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Tabla de gastos recurrentes */}
        <Card className="w-full bg-white dark:bg-gray-800 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="w-5 h-5" />
              <span>Gastos Recurrentes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gastos.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No tienes gastos recurrentes registrados.
                </p>
                <Button onClick={() => { resetForm(); setIsFormOpen(true); }}>
                  Agregar tu primer gasto recurrente
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableCaption>Listado de tus gastos recurrentes</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Periodicidad</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Próximo Pago</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gastos.map((gasto) => (
                      <TableRow key={gasto.id}>
                        <TableCell className="font-medium">{gasto.concepto}</TableCell>
                        <TableCell>{gasto.periodicidad}</TableCell>
                        <TableCell>
                          {new Intl.NumberFormat('es-AR', {
                            style: 'currency',
                            currency: 'ARS'
                          }).format(gasto.monto)}
                        </TableCell>
                        <TableCell>{formatFecha(gasto.proximaFecha)}</TableCell>
                        <TableCell>{gasto.categoria?.descripcion || "Sin categoría"}</TableCell>
                        <TableCell className={getEstadoClase(gasto.estado)}>
                          {gasto.estado}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEdit(gasto)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(gasto.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 