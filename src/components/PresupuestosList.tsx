'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Trash, PencilIcon, PlusCircle, Loader2, Users, User, DollarSign, Target } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import PresupuestoForm from './PresupuestoForm'
import PresupuestoImputaciones from './PresupuestoImputaciones'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useCurrency } from '@/contexts/CurrencyContext'
import { cn } from '@/lib/utils'

interface ComparacionMesAnterior {
  gastoMesAnterior: number
  presupuestoActual: number
  diferencia: number
  color: 'red' | 'green'
  añoMesAnterior: number
  numeroMesAnterior: number
}

interface Presupuesto {
  id: string
  nombre: string
  descripcion?: string
  monto: number
  categoriaId: number | null
  mes: number
  año: number
  tipo: string
  categoria: {
    id: number
    descripcion: string
  } | null
  gastoActual: number
  porcentajeConsumido: number
  disponible: number
  esGrupal: boolean
  tipoDescripcion: string
  comparacionMesAnterior?: ComparacionMesAnterior | null
}

export default function PresupuestosList() {
  const router = useRouter()
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [imputacionesId, setImputacionesId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [mesActual, setMesActual] = useState(new Date().getMonth() + 1) // 1-12
  const [añoActual, setAñoActual] = useState(new Date().getFullYear())
  const [tipoFiltro, setTipoFiltro] = useState('all') // 'all', 'personal', 'grupal'
  const [dialogOpen, setDialogOpen] = useState(false)
  const [imputacionesDialogOpen, setImputacionesDialogOpen] = useState(false)
  const { formatMoney } = useCurrency()
  
  // Opciones de meses
  const meses = [
    { id: 1, nombre: 'Enero' },
    { id: 2, nombre: 'Febrero' },
    { id: 3, nombre: 'Marzo' },
    { id: 4, nombre: 'Abril' },
    { id: 5, nombre: 'Mayo' },
    { id: 6, nombre: 'Junio' },
    { id: 7, nombre: 'Julio' },
    { id: 8, nombre: 'Agosto' },
    { id: 9, nombre: 'Septiembre' },
    { id: 10, nombre: 'Octubre' },
    { id: 11, nombre: 'Noviembre' },
    { id: 12, nombre: 'Diciembre' },
  ]
  
  const fetchPresupuestos = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        mes: mesActual.toString(),
        año: añoActual.toString()
      })
      
      if (tipoFiltro !== 'all') {
        params.append('tipo', tipoFiltro)
      }
      
      const response = await fetch(`/api/presupuestos?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPresupuestos(data)
      }
    } catch (error) {
      console.error('Error al cargar presupuestos:', error)
      toast.error('Error al cargar presupuestos')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchPresupuestos()
  }, [mesActual, añoActual, tipoFiltro])
  
  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este presupuesto?')) {
      return
    }
    
    setDeletingId(id)
    try {
      const response = await fetch(`/api/presupuestos/${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        toast.success('Presupuesto eliminado')
        fetchPresupuestos()
      } else {
        toast.error('Error al eliminar presupuesto')
      }
    } catch (error) {
      console.error('Error al eliminar presupuesto:', error)
      toast.error('Error al eliminar presupuesto')
    } finally {
      setDeletingId(null)
    }
  }
  
  const handleEdit = (id: string) => {
    setEditingId(id)
    setDialogOpen(true)
  }

  const handleImputaciones = (id: string) => {
    setImputacionesId(id)
    setImputacionesDialogOpen(true)
  }
  
  const handleFormSuccess = () => {
    setEditingId(null)
    setDialogOpen(false)
    fetchPresupuestos()
  }
  
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
      years.push(i)
    }
    return years
  }
  
  const getProgressColor = (porcentaje: number) => {
    if (porcentaje <= 70) return 'bg-green-500'
    if (porcentaje <= 90) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getStatusBadge = (presupuesto: Presupuesto) => {
    if (presupuesto.porcentajeConsumido >= 100) {
      return <Badge variant="destructive">Excedido</Badge>
    } else if (presupuesto.porcentajeConsumido >= 90) {
      return <Badge variant="secondary">Casi agotado</Badge>
    } else if (presupuesto.porcentajeConsumido >= 70) {
      return <Badge variant="outline">En progreso</Badge>
    } else {
      return <Badge variant="default">Disponible</Badge>
    }
  }

  const presupuestoSeleccionado = presupuestos.find(p => p.id === imputacionesId)
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Presupuestos</h2>
        
        <div className="flex gap-4 items-center">
          <div className="flex gap-2">
            {/* Filtro por tipo */}
            <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="personal">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Personal
                  </div>
                </SelectItem>
                <SelectItem value="grupal">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Grupal
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={mesActual.toString()} onValueChange={(v) => setMesActual(parseInt(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {meses.map((mes) => (
                  <SelectItem key={mes.id} value={mes.id.toString()}>
                    {mes.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={añoActual.toString()} onValueChange={(v) => setAñoActual(parseInt(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {generateYearOptions().map((año) => (
                  <SelectItem key={año} value={año.toString()}>
                    {año}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nuevo Presupuesto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
                </DialogTitle>
                <DialogDescription>
                  {editingId 
                    ? 'Modifica los datos del presupuesto seleccionado'
                    : 'Crea un nuevo presupuesto mensual para controlar tus gastos'
                  }
                </DialogDescription>
              </DialogHeader>
              <PresupuestoForm
                presupuestoId={editingId || undefined}
                onSuccess={handleFormSuccess}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-6">Cargando presupuestos...</div>
      ) : presupuestos.length === 0 ? (
        <div className="text-center py-12">
          <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No hay presupuestos</h3>
          <p className="text-muted-foreground mb-4">
            Crea tu primer presupuesto para comenzar a controlar tus gastos
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Presupuesto
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {presupuestos.map((presupuesto) => (
            <Card key={presupuesto.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {presupuesto.esGrupal ? (
                        <Users className="h-4 w-4 text-blue-500" />
                      ) : (
                        <User className="h-4 w-4 text-green-500" />
                      )}
                      {presupuesto.nombre}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={presupuesto.esGrupal ? "default" : "secondary"} className="text-xs">
                        {presupuesto.tipoDescripcion}
                      </Badge>
                      {getStatusBadge(presupuesto)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleImputaciones(presupuesto.id)}
                      title="Gestionar imputaciones"
                    >
                      <DollarSign className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(presupuesto.id)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(presupuesto.id)}
                      disabled={deletingId === presupuesto.id}
                    >
                      {deletingId === presupuesto.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                {presupuesto.descripcion && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {presupuesto.descripcion}
                  </p>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                {presupuesto.categoria && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Categoría:</span>
                    <Badge variant="outline">{presupuesto.categoria.descripcion}</Badge>
                  </div>
                )}
                
                {/* Comparación con mes anterior */}
                {presupuesto.comparacionMesAnterior && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">
                        {meses.find(m => m.id === presupuesto.comparacionMesAnterior!.numeroMesAnterior)?.nombre} {presupuesto.comparacionMesAnterior.añoMesAnterior}
                      </h4>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-xs",
                          presupuesto.comparacionMesAnterior.color === 'green' && "bg-green-100 text-green-800 border-green-200",
                          presupuesto.comparacionMesAnterior.color === 'red' && "bg-red-100 text-red-800 border-red-200"
                        )}
                      >
                        {presupuesto.comparacionMesAnterior.color === 'green' ? "Dentro del presupuesto" : "Excedió"}
                      </Badge>
                    </div>
                    
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gastado mes anterior:</span>
                        <span className={cn(
                          "font-medium",
                          presupuesto.comparacionMesAnterior.color === 'green' ? "text-green-600" : "text-red-600"
                        )}>
                          {formatMoney(presupuesto.comparacionMesAnterior.gastoMesAnterior)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Presupuesto actual:</span>
                        <span className="font-medium">{formatMoney(presupuesto.comparacionMesAnterior.presupuestoActual)}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progreso</span>
                    <span>{presupuesto.porcentajeConsumido.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={Math.min(100, presupuesto.porcentajeConsumido)} 
                    className="h-2"
                  />
                  <div className={cn("h-2 rounded-full", getProgressColor(presupuesto.porcentajeConsumido))} 
                       style={{ width: `${Math.min(100, presupuesto.porcentajeConsumido)}%` }} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Presupuestado</p>
                    <p className="font-medium">{formatMoney(presupuesto.monto)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gastado</p>
                    <p className="font-medium">{formatMoney(presupuesto.gastoActual)}</p>
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Disponible</span>
                    <span className={cn(
                      "font-medium",
                      presupuesto.disponible >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {formatMoney(presupuesto.disponible)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para gestionar imputaciones */}
      <Dialog open={imputacionesDialogOpen} onOpenChange={setImputacionesDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestionar Imputaciones</DialogTitle>
            <DialogDescription>
              Imputa gastos manualmente a este presupuesto
            </DialogDescription>
          </DialogHeader>
          {presupuestoSeleccionado && (
            <PresupuestoImputaciones
              presupuestoId={presupuestoSeleccionado.id}
              presupuestoNombre={presupuestoSeleccionado.nombre}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 