'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Trash2, Plus, Search, DollarSign, Calendar, User, Tag } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrency } from '@/contexts/CurrencyContext'

interface PresupuestoImputacionesProps {
  presupuestoId: string
  presupuestoNombre: string
}

interface Imputacion {
  id: string
  montoImputado: number
  porcentajeGasto: number
  comentario?: string
  fechaImputacion: string
  gasto: {
    id: number
    concepto: string
    monto: number
    fecha: string
    categoriaRel?: {
      descripcion: string
    }
    user: {
      name: string
    }
  }
  usuario: {
    name: string
  }
}

interface Gasto {
  id: number
  concepto: string
  monto: number
  fecha: string
  categoriaRel?: {
    descripcion: string
  }
}

export default function PresupuestoImputaciones({ presupuestoId, presupuestoNombre }: PresupuestoImputacionesProps) {
  const [imputaciones, setImputaciones] = useState<Imputacion[]>([])
  const [gastosDisponibles, setGastosDisponibles] = useState<Gasto[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [busquedaGasto, setBusquedaGasto] = useState('')
  const [nuevaImputacion, setNuevaImputacion] = useState({
    gastoId: '',
    montoImputado: 0,
    porcentajeGasto: 100,
    comentario: ''
  })
  const { formatMoney } = useCurrency()

  // Cargar imputaciones existentes
  const fetchImputaciones = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/presupuestos/imputaciones?presupuestoId=${presupuestoId}`)
      if (response.ok) {
        const data = await response.json()
        setImputaciones(data)
      }
    } catch (error) {
      console.error('Error al cargar imputaciones:', error)
      toast.error('Error al cargar imputaciones')
    } finally {
      setLoading(false)
    }
  }

  // Cargar gastos disponibles para imputar
  const fetchGastosDisponibles = async () => {
    try {
      const response = await fetch('/api/gastos?limit=100&tipoTransaccion=expense')
      if (response.ok) {
        const data = await response.json()
        setGastosDisponibles(data)
      }
    } catch (error) {
      console.error('Error al cargar gastos:', error)
    }
  }

  useEffect(() => {
    fetchImputaciones()
    fetchGastosDisponibles()
  }, [presupuestoId])

  const handleGastoSelect = (gastoId: string) => {
    const gasto = gastosDisponibles.find(g => g.id.toString() === gastoId)
    if (gasto) {
      setNuevaImputacion({
        ...nuevaImputacion,
        gastoId,
        montoImputado: gasto.monto // Por defecto, imputar el monto completo
      })
    }
  }

  const handleMontoChange = (monto: number) => {
    const gasto = gastosDisponibles.find(g => g.id.toString() === nuevaImputacion.gastoId)
    if (gasto) {
      const porcentaje = (monto / gasto.monto) * 100
      setNuevaImputacion({
        ...nuevaImputacion,
        montoImputado: monto,
        porcentajeGasto: Math.min(100, Math.max(0, porcentaje))
      })
    }
  }

  const handlePorcentajeChange = (porcentaje: number) => {
    const gasto = gastosDisponibles.find(g => g.id.toString() === nuevaImputacion.gastoId)
    if (gasto) {
      const monto = (gasto.monto * porcentaje) / 100
      setNuevaImputacion({
        ...nuevaImputacion,
        montoImputado: monto,
        porcentajeGasto: porcentaje
      })
    }
  }

  const handleCrearImputacion = async () => {
    try {
      if (!nuevaImputacion.gastoId || nuevaImputacion.montoImputado <= 0) {
        toast.error('Selecciona un gasto y un monto válido')
        return
      }

      setLoading(true)
      const response = await fetch('/api/presupuestos/imputaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          presupuestoId,
          gastoId: parseInt(nuevaImputacion.gastoId),
          montoImputado: nuevaImputacion.montoImputado,
          porcentajeGasto: nuevaImputacion.porcentajeGasto,
          comentario: nuevaImputacion.comentario
        }),
      })

      if (response.ok) {
        toast.success('Imputación creada correctamente')
        setDialogOpen(false)
        setNuevaImputacion({
          gastoId: '',
          montoImputado: 0,
          porcentajeGasto: 100,
          comentario: ''
        })
        fetchImputaciones()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al crear imputación')
      }
    } catch (error) {
      console.error('Error al crear imputación:', error)
      toast.error('Error al crear imputación')
    } finally {
      setLoading(false)
    }
  }

  const handleEliminarImputacion = async (imputacionId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta imputación?')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/presupuestos/imputaciones?id=${imputacionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Imputación eliminada')
        fetchImputaciones()
      } else {
        toast.error('Error al eliminar imputación')
      }
    } catch (error) {
      console.error('Error al eliminar imputación:', error)
      toast.error('Error al eliminar imputación')
    } finally {
      setLoading(false)
    }
  }

  const gastosFiltrados = gastosDisponibles.filter(gasto =>
    gasto.concepto.toLowerCase().includes(busquedaGasto.toLowerCase()) ||
    gasto.categoriaRel?.descripcion.toLowerCase().includes(busquedaGasto.toLowerCase())
  )

  const totalImputado = imputaciones.reduce((sum, imp) => sum + imp.montoImputado, 0)

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Imputaciones Manuales - {presupuestoNombre}
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Imputación
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Imputar Gasto al Presupuesto</DialogTitle>
                <DialogDescription>
                  Selecciona un gasto y el monto a imputar a este presupuesto
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Búsqueda de gastos */}
                <div className="space-y-2">
                  <Label>Buscar Gasto</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por concepto o categoría..."
                      value={busquedaGasto}
                      onChange={(e) => setBusquedaGasto(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Selector de gasto */}
                <div className="space-y-2">
                  <Label>Gasto a Imputar</Label>
                  <Select value={nuevaImputacion.gastoId} onValueChange={handleGastoSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar gasto" />
                    </SelectTrigger>
                    <SelectContent>
                      {gastosFiltrados.map((gasto) => (
                        <SelectItem key={gasto.id} value={gasto.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{gasto.concepto}</span>
                            <div className="flex items-center gap-2 ml-4">
                              {gasto.categoriaRel && (
                                <Badge variant="outline" className="text-xs">
                                  {gasto.categoriaRel.descripcion}
                                </Badge>
                              )}
                              <span className="font-medium">{formatMoney(gasto.monto)}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Monto y porcentaje */}
                {nuevaImputacion.gastoId && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Monto a Imputar</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={nuevaImputacion.montoImputado}
                        onChange={(e) => handleMontoChange(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Porcentaje del Gasto</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={nuevaImputacion.porcentajeGasto.toFixed(1)}
                        onChange={(e) => handlePorcentajeChange(parseFloat(e.target.value) || 0)}
                        placeholder="100"
                      />
                    </div>
                  </div>
                )}

                {/* Comentario */}
                <div className="space-y-2">
                  <Label>Comentario (Opcional)</Label>
                  <Textarea
                    value={nuevaImputacion.comentario}
                    onChange={(e) => setNuevaImputacion({...nuevaImputacion, comentario: e.target.value})}
                    placeholder="Razón de la imputación..."
                    rows={3}
                  />
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCrearImputacion} disabled={loading}>
                    {loading ? 'Creando...' : 'Crear Imputación'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {totalImputado > 0 && (
          <div className="text-sm text-muted-foreground">
            Total imputado manualmente: <span className="font-medium">{formatMoney(totalImputado)}</span>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {loading && imputaciones.length === 0 ? (
          <div className="text-center py-6">Cargando imputaciones...</div>
        ) : imputaciones.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay imputaciones manuales para este presupuesto</p>
            <p className="text-sm">Los gastos se calculan automáticamente por categoría</p>
          </div>
        ) : (
          <div className="space-y-4">
            {imputaciones.map((imputacion) => (
              <div key={imputacion.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{imputacion.gasto.concepto}</h4>
                      {imputacion.gasto.categoriaRel && (
                        <Badge variant="outline" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {imputacion.gasto.categoriaRel.descripcion}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span>Gasto: {formatMoney(imputacion.gasto.monto)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span>Imputado: {formatMoney(imputacion.montoImputado)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(imputacion.gasto.fecha).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{imputacion.usuario.name}</span>
                      </div>
                    </div>

                    {imputacion.porcentajeGasto < 100 && (
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {imputacion.porcentajeGasto.toFixed(1)}% del gasto
                        </Badge>
                      </div>
                    )}

                    {imputacion.comentario && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <strong>Comentario:</strong> {imputacion.comentario}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEliminarImputacion(imputacion.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 