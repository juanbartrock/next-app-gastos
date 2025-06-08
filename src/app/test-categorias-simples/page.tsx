'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Globe, Users, Check, User } from 'lucide-react'

interface Categoria {
  id: number
  descripcion: string
  colorHex?: string
  icono?: string
  esGenerica: boolean
  userId?: string
  creadorNombre?: string
}

interface CategoriaData {
  categoriasGenericas: Categoria[]
  categoriasFamiliares: Categoria[]
  idsFamilia: string[]
  estadisticas: {
    genericasDisponibles: number
    familiaresCreadas: number
    miembrosFamilia: number
    totalVisibles: number
  }
}

export default function TestCategoriasSimples() {
  const [data, setData] = useState<CategoriaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [creandoCategoria, setCreandoCategoria] = useState(false)
  const [dialogAbierto, setDialogAbierto] = useState(false)

  const [nuevaCategoria, setNuevaCategoria] = useState({
    descripcion: '',
    colorHex: '#3B82F6',
    icono: '📁'
  })

  const fetchCategorias = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/categorias/familiares')
      
      if (!response.ok) {
        throw new Error('Error al cargar categorías')
      }
      
      const data = await response.json()
      setData(data)
      
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar las categorías')
    } finally {
      setLoading(false)
    }
  }

  const crearCategoria = async () => {
    if (!nuevaCategoria.descripcion.trim()) {
      toast.error('La descripción es requerida')
      return
    }

    try {
      setCreandoCategoria(true)
      
      const response = await fetch('/api/categorias/familiares', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nuevaCategoria)
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Error al crear la categoría')
        return
      }

      toast.success('Categoría creada exitosamente')
      setDialogAbierto(false)
      setNuevaCategoria({
        descripcion: '',
        colorHex: '#3B82F6',
        icono: '📁'
      })
      fetchCategorias()
      
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al crear la categoría')
    } finally {
      setCreandoCategoria(false)
    }
  }

  useEffect(() => {
    fetchCategorias()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Error al cargar las categorías</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">✅ Test - Sistema Correcto de Categorías</h1>
          <p className="text-muted-foreground mt-2">
            Genéricas del sistema + Familiares (creadas por ti o tu familia)
          </p>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="gap-1">
              <Globe className="h-3 w-3" />
              {data.estadisticas.genericasDisponibles} Genéricas
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" />
              {data.estadisticas.familiaresCreadas} Familiares
            </Badge>
            <Badge variant="secondary" className="gap-1">
              {data.estadisticas.miembrosFamilia} Miembros
            </Badge>
          </div>
        </div>

        <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Categoría
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Categoría</DialogTitle>
              <DialogDescription>
                Crea una categoría que podrás usar tú y tu familia.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Input
                  id="descripcion"
                  value={nuevaCategoria.descripcion}
                  onChange={(e) => setNuevaCategoria({
                    ...nuevaCategoria,
                    descripcion: e.target.value
                  })}
                  placeholder="Ej: Farmacia, Veterinario, etc."
                />
              </div>

              <div>
                <Label htmlFor="icono">Icono (opcional)</Label>
                <Input
                  id="icono"
                  value={nuevaCategoria.icono}
                  onChange={(e) => setNuevaCategoria({
                    ...nuevaCategoria,
                    icono: e.target.value
                  })}
                  placeholder="📁"
                />
              </div>

              <div>
                <Label htmlFor="color">Color (opcional)</Label>
                <Input
                  id="color"
                  type="color"
                  value={nuevaCategoria.colorHex}
                  onChange={(e) => setNuevaCategoria({
                    ...nuevaCategoria,
                    colorHex: e.target.value
                  })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={crearCategoria}
                disabled={creandoCategoria}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {creandoCategoria ? 'Creando...' : 'Crear Categoría'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visible</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.estadisticas.totalVisibles}</div>
            <p className="text-xs text-muted-foreground">Categorías disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Genéricas</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.estadisticas.genericasDisponibles}</div>
            <p className="text-xs text-muted-foreground">Del sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Familiares</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.estadisticas.familiaresCreadas}</div>
            <p className="text-xs text-muted-foreground">Tuyas y de familia</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Miembros</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.estadisticas.miembrosFamilia}</div>
            <p className="text-xs text-muted-foreground">En tu grupo</p>
          </CardContent>
        </Card>
      </div>

      {/* Categorías Genéricas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Categorías Genéricas del Sistema
          </CardTitle>
          <CardDescription>
            Disponibles para todos los usuarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.categoriasGenericas.slice(0, 9).map((categoria) => (
              <div key={categoria.id} className="p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: categoria.colorHex || '#6B7280' }}
                  />
                  <span className="font-medium">{categoria.icono} {categoria.descripcion}</span>
                </div>
                <Badge variant="outline" className="text-xs mt-2">
                  <Globe className="h-3 w-3 mr-1" />
                  Sistema
                </Badge>
              </div>
            ))}
            {data.categoriasGenericas.length > 9 && (
              <div className="p-3 border rounded-lg bg-muted/50 flex items-center justify-center">
                <span className="text-sm text-muted-foreground">
                  Y {data.categoriasGenericas.length - 9} más...
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Categorías Familiares */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Categorías Familiares
          </CardTitle>
          <CardDescription>
            Creadas por ti o miembros de tu familia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.categoriasFamiliares.map((categoria) => (
              <div key={categoria.id} className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: categoria.colorHex || '#3B82F6' }}
                  />
                  <span className="font-medium">{categoria.icono} {categoria.descripcion}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                    <Users className="h-3 w-3 mr-1" />
                    Familiar
                  </Badge>
                  {categoria.creadorNombre && (
                    <Badge variant="outline" className="text-xs">
                      {categoria.creadorNombre}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {data.categoriasFamiliares.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay categorías familiares</p>
              <p className="text-sm">Crea tu primera categoría para ti y tu familia</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estado del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>✅ Sistema Correcto Funcionando</CardTitle>
          <CardDescription>
            Implementación simple y funcional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Categorías genéricas disponibles: {data.estadisticas.genericasDisponibles}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Categorías familiares: {data.estadisticas.familiaresCreadas}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Usuario puede crear categorías para su familia</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Total categorías visibles: {data.estadisticas.totalVisibles}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Sistema simple y funcional ✅</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 