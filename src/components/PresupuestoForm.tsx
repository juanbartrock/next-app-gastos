'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { X, Plus, Users, User } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

interface PresupuestoFormProps {
  presupuestoId?: string
  onSuccess?: () => void
}

interface Categoria {
  id: number
  descripcion: string
  grupo_categoria?: string
}

interface Grupo {
  id: string
  nombre: string
  descripcion?: string
}

export default function PresupuestoForm({ presupuestoId, onSuccess }: PresupuestoFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [presupuesto, setPresupuesto] = useState({
    nombre: '',
    descripcion: '',
    monto: 0,
    categoriaId: -1, // Para retrocompatibilidad
    mes: new Date().getMonth() + 1,
    año: new Date().getFullYear(),
    tipo: 'personal',
    grupoId: '',
    categoriasSeleccionadas: [] as number[]
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

  // Cargar grupos del usuario
  useEffect(() => {
    const fetchGrupos = async () => {
      try {
        const response = await fetch('/api/grupos')
        if (response.ok) {
          const data = await response.json()
          setGrupos(data)
        }
      } catch (error) {
        console.error('Error al cargar grupos:', error)
      }
    }
    
    fetchGrupos()
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
              descripcion: data.descripcion || '',
              monto: data.monto,
              categoriaId: data.categoriaId || -1,
              mes: data.mes,
              año: data.año,
              tipo: data.tipo || 'personal',
              grupoId: data.grupoId || '',
              categoriasSeleccionadas: data.categorias?.map((c: any) => c.categoriaId) || []
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
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleTipoChange = (esGrupal: boolean) => {
    setPresupuesto({
      ...presupuesto,
      tipo: esGrupal ? 'grupal' : 'personal',
      grupoId: esGrupal ? presupuesto.grupoId : ''
    })
  }

  const agregarCategoria = (categoriaId: number) => {
    if (!presupuesto.categoriasSeleccionadas.includes(categoriaId)) {
      setPresupuesto({
        ...presupuesto,
        categoriasSeleccionadas: [...presupuesto.categoriasSeleccionadas, categoriaId]
      })
    }
  }

  const removerCategoria = (categoriaId: number) => {
    setPresupuesto({
      ...presupuesto,
      categoriasSeleccionadas: presupuesto.categoriasSeleccionadas.filter(id => id !== categoriaId)
    })
  }

  const getCategoriaById = (id: number) => {
    return categorias.find(cat => cat.id === id)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      // Validar datos
      if (!presupuesto.nombre || presupuesto.monto <= 0) {
        toast.error('Por favor complete el nombre y un monto válido')
        return
      }

      if (presupuesto.tipo === 'grupal' && !presupuesto.grupoId) {
        toast.error('Para presupuestos grupales debe seleccionar un grupo')
        return
      }

      // Si no hay categorías múltiples seleccionadas, usar la categoría única (retrocompatibilidad)
      const categoriasParaEnviar = presupuesto.categoriasSeleccionadas.length > 0 
        ? presupuesto.categoriasSeleccionadas.map(id => ({ categoriaId: id, porcentaje: 100 }))
        : []
      
      const datosPresupuesto = {
        nombre: presupuesto.nombre,
        descripcion: presupuesto.descripcion,
        monto: presupuesto.monto,
        categoriaId: presupuesto.categoriaId !== -1 ? presupuesto.categoriaId : null,
        mes: presupuesto.mes,
        año: presupuesto.año,
        tipo: presupuesto.tipo,
        grupoId: presupuesto.tipo === 'grupal' ? presupuesto.grupoId : null,
        categorias: categoriasParaEnviar
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
        body: JSON.stringify(datosPresupuesto),
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
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de presupuesto */}
          <div className="space-y-3">
            <Label>Tipo de Presupuesto</Label>
            <div className="flex items-center space-x-2">
              <Switch
                checked={presupuesto.tipo === 'grupal'}
                onCheckedChange={handleTipoChange}
              />
              <Label className="flex items-center gap-2">
                {presupuesto.tipo === 'grupal' ? (
                  <>
                    <Users className="h-4 w-4" />
                    Presupuesto Grupal
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4" />
                    Presupuesto Personal
                  </>
                )}
              </Label>
            </div>
          </div>

          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="monto">Monto Presupuestado</Label>
              <Input
                id="monto"
                name="monto"
                type="number"
                step="0.01"
                value={presupuesto.monto}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción (Opcional)</Label>
            <Textarea
              id="descripcion"
              name="descripcion"
              value={presupuesto.descripcion}
              onChange={handleChange}
              placeholder="Describe el propósito de este presupuesto..."
              rows={3}
            />
          </div>

          {/* Grupo (solo para presupuestos grupales) */}
          {presupuesto.tipo === 'grupal' && (
            <div className="space-y-2">
              <Label htmlFor="grupoId">Grupo</Label>
              <Select
                value={presupuesto.grupoId}
                onValueChange={(value) => handleSelectChange('grupoId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar grupo" />
                </SelectTrigger>
                <SelectContent>
                  {grupos.map((grupo) => (
                    <SelectItem key={grupo.id} value={grupo.id}>
                      {grupo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Período */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mes">Mes</Label>
              <Select
                value={presupuesto.mes.toString()}
                onValueChange={(value) => handleSelectChange('mes', value)}
              >
                <SelectTrigger>
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
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="año">Año</Label>
              <Select
                value={presupuesto.año.toString()}
                onValueChange={(value) => handleSelectChange('año', value)}
              >
                <SelectTrigger>
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
          </div>

          {/* Categoría única (retrocompatibilidad) */}
          <div className="space-y-2">
            <Label htmlFor="categoriaId">Categoría Principal (Opcional)</Label>
            <Select
              value={presupuesto.categoriaId.toString()}
              onValueChange={(value) => handleSelectChange('categoriaId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría principal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-1">Sin categoría principal</SelectItem>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.id.toString()}>
                    {categoria.descripcion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Categorías múltiples */}
          <div className="space-y-3">
            <Label>Categorías Adicionales</Label>
            <p className="text-sm text-muted-foreground">
              Selecciona categorías adicionales que se incluirán en este presupuesto
            </p>
            
            {/* Selector de categorías */}
            <Select
              value=""
              onValueChange={(value) => agregarCategoria(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Agregar categoría" />
              </SelectTrigger>
              <SelectContent>
                {categorias
                  .filter(cat => !presupuesto.categoriasSeleccionadas.includes(cat.id))
                  .map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id.toString()}>
                      {categoria.descripcion}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* Lista de categorías seleccionadas */}
            {presupuesto.categoriasSeleccionadas.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {presupuesto.categoriasSeleccionadas.map((categoriaId) => {
                  const categoria = getCategoriaById(categoriaId)
                  return categoria ? (
                    <Badge key={categoriaId} variant="secondary" className="flex items-center gap-1">
                      <span>{categoria.descripcion}</span>
                      <button
                        type="button"
                        className="ml-1 inline-flex items-center justify-center rounded-full hover:bg-destructive/20 p-0.5"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          removerCategoria(categoriaId)
                        }}
                        aria-label={`Remover ${categoria.descripcion}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null
                })}
              </div>
            )}
          </div>
        
        <div className="flex justify-between pt-6 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onSuccess ? onSuccess() : router.back()}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : (presupuestoId ? 'Actualizar' : 'Crear')}
          </Button>
        </div>
      </form>
    </div>
  )
} 