'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface PresupuestoFormProps {
  presupuestoId?: string
  onSuccess?: () => void
}

export default function PresupuestoForm({ presupuestoId, onSuccess }: PresupuestoFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categorias, setCategorias] = useState<any[]>([])
  const [presupuesto, setPresupuesto] = useState({
    nombre: '',
    monto: 0,
    categoriaId: -1,
    mes: new Date().getMonth() + 1, // 1-12 para representar el mes
    año: new Date().getFullYear(),
  })
  
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
  
  // Cargar categorías
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await fetch('/api/categorias/familiares')
        if (response.ok) {
          const data = await response.json()
          setCategorias(data.categorias || data)
        }
      } catch (error) {
        console.error('Error al cargar categorías:', error)
        toast.error('No se pudieron cargar las categorías')
      }
    }
    
    fetchCategorias()
  }, [])
  
  // Cargar presupuesto si está editando
  useEffect(() => {
    if (presupuestoId) {
      const fetchPresupuesto = async () => {
        try {
          setLoading(true)
          const response = await fetch(`/api/presupuestos/${presupuestoId}`)
          if (response.ok) {
            const data = await response.json()
            setPresupuesto({
              nombre: data.nombre,
              monto: data.monto,
              categoriaId: data.categoriaId,
              mes: data.mes,
              año: data.año,
            })
          }
        } catch (error) {
          console.error('Error al cargar presupuesto:', error)
          toast.error('No se pudo cargar el presupuesto')
        } finally {
          setLoading(false)
        }
      }
      
      fetchPresupuesto()
    }
  }, [presupuestoId])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPresupuesto({
      ...presupuesto,
      [name]: name === 'monto' ? parseFloat(value) || 0 : value,
    })
  }
  
  const handleSelectChange = (name: string, value: string) => {
    setPresupuesto({
      ...presupuesto,
      [name]: name === 'mes' || name === 'año' || name === 'categoriaId' ? parseInt(value) : value,
    })
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      // Validar datos
      if (!presupuesto.nombre || presupuesto.monto <= 0 || presupuesto.categoriaId === -1) {
        toast.error('Por favor complete todos los campos correctamente')
        return
      }
      
      // Determinar si es creación o actualización
      const url = presupuestoId
        ? `/api/presupuestos/${presupuestoId}`
        : '/api/presupuestos'
      
      const method = presupuestoId ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(presupuesto),
      })
      
      if (response.ok) {
        toast.success(presupuestoId ? 'Presupuesto actualizado' : 'Presupuesto creado')
        
        if (onSuccess) {
          onSuccess()
        } else {
          router.push('/presupuestos')
          router.refresh()
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al guardar el presupuesto')
      }
    } catch (error) {
      console.error('Error al guardar presupuesto:', error)
      toast.error('Error al guardar el presupuesto')
    } finally {
      setLoading(false)
    }
  }
  
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
      years.push(i)
    }
    return years
  }
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{presupuestoId ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Presupuesto</Label>
            <Input
              id="nombre"
              name="nombre"
              value={presupuesto.nombre}
              onChange={handleChange}
              placeholder="Ej: Presupuesto de Alimentación"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="categoriaId">Categoría</Label>
            <Select
              value={presupuesto.categoriaId.toString()}
              onValueChange={(value) => handleSelectChange('categoriaId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.id.toString()}>
                    {categoria.descripcion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="monto">Monto Presupuestado</Label>
            <Input
              id="monto"
              name="monto"
              type="number"
              step="0.01"
              min="0"
              value={presupuesto.monto}
              onChange={handleChange}
              placeholder="0.00"
              required
            />
          </div>
          
          <div className="flex gap-4">
            <div className="space-y-2 flex-1">
              <Label htmlFor="mes">Mes</Label>
              <Select
                value={presupuesto.mes.toString()}
                onValueChange={(value) => handleSelectChange('mes', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar mes" />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((mes) => (
                    <SelectItem key={mes.id} value={mes.id.toString()}>
                      {mes.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 flex-1">
              <Label htmlFor="año">Año</Label>
              <Select
                value={presupuesto.año.toString()}
                onValueChange={(value) => handleSelectChange('año', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar año" />
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
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => router.back()} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : presupuestoId ? 'Actualizar' : 'Crear'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
} 