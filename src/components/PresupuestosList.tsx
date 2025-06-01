'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Trash, PencilIcon, PlusCircle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import PresupuestoForm from './PresupuestoForm'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrency } from '@/contexts/CurrencyContext'
import { cn } from '@/lib/utils'

interface Presupuesto {
  id: string
  nombre: string
  monto: number
  categoriaId: number | null
  mes: number
  año: number
  categoria: {
    id: number
    descripcion: string
  } | null
  gastoActual: number
  porcentajeConsumido: number
  disponible: number
}

export default function PresupuestosList() {
  const router = useRouter()
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [mesActual, setMesActual] = useState(new Date().getMonth() + 1) // 1-12
  const [añoActual, setAñoActual] = useState(new Date().getFullYear())
  const [dialogOpen, setDialogOpen] = useState(false)
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
      const response = await fetch(`/api/presupuestos?mes=${mesActual}&año=${añoActual}`)
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
  }, [mesActual, añoActual])
  
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
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Presupuestos</h2>
        
        <div className="flex gap-4 items-center">
          <div className="flex gap-2">
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
            <DialogContent className="max-w-md">
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
        <div className="text-center py-6">
          No hay presupuestos configurados para este período.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {presupuestos.map((presupuesto) => (
            <Card key={presupuesto.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{presupuesto.nombre}</CardTitle>
                  <div className="flex space-x-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(presupuesto.id)}
                      disabled={deletingId === presupuesto.id}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
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
                <div className="text-sm text-muted-foreground">
                  {presupuesto.categoria?.descripcion || 'Sin categoría'}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>
                      Gastado: {formatMoney(presupuesto.gastoActual)}
                    </span>
                    <span>
                      Meta: {formatMoney(presupuesto.monto)}
                    </span>
                  </div>
                  
                  <Progress
                    value={Math.min(presupuesto.porcentajeConsumido, 100)}
                    className="h-2"
                    indicatorColor={getProgressColor(presupuesto.porcentajeConsumido)}
                  />
                  
                  <div className="flex justify-between mt-2">
                    <div>
                      <div className="text-sm text-muted-foreground">Disponible</div>
                      <div className={`font-medium ${presupuesto.disponible < 0 ? 'text-red-500' : ''}`}>
                        {formatMoney(presupuesto.disponible)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Consumido</div>
                      <div className="font-medium">
                        {presupuesto.porcentajeConsumido.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 