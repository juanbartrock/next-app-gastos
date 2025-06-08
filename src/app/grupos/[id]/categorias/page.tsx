'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Palette, Users, Globe, Settings, Trash2, Edit } from 'lucide-react'

interface Categoria {
  id: number
  descripcion: string
  colorHex?: string
  icono?: string
  grupo_categoria?: string
  esGenerica: boolean
  activa: boolean
  adminCreador?: {
    id: string
    name: string
  }
  createdAt: string
}

interface CategoriaData {
  categoriasGenericas: Categoria[]
  categoriasGrupo: Categoria[]
  estadisticas: {
    genericasDisponibles: number
    grupoCreadas: number
  }
}

export default function CategoriasGrupoPage() {
  const params = useParams()
  const grupoId = params?.id as string

  const [data, setData] = useState<CategoriaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [creandoCategoria, setCreandoCategoria] = useState(false)
  const [categoriaDialog, setCategoriaDialog] = useState(false)
  const [nuevaCategoria, setNuevaCategoria] = useState({
    descripcion: '',
    colorHex: '#3B82F6',
    icono: '',
    grupo_categoria: ''
  })

  // Colores predefinidos para categorías
  const COLORES_PREDEFINIDOS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ]

  // Grupos de categorías predefinidos
  const GRUPOS_CATEGORIA = [
    'esenciales', 'entretenimiento', 'personal', 'desarrollo', 'tecnologia', 'especiales'
  ]

  const fetchCategorias = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/grupos/${grupoId}/categorias`)
      
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
      
      const response = await fetch(`/api/grupos/${grupoId}/categorias`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nuevaCategoria)
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 402) {
          toast.error(`${result.error}. Considera actualizar tu plan.`)
        } else {
          toast.error(result.error || 'Error al crear la categoría')
        }
        return
      }

      toast.success('Categoría creada exitosamente')
      setCategoriaDialog(false)
      setNuevaCategoria({
        descripcion: '',
        colorHex: '#3B82F6',
        icono: '',
        grupo_categoria: ''
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
    if (grupoId) {
      fetchCategorias()
    }
  }, [grupoId])

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
          <h1 className="text-3xl font-bold">Categorías del Grupo</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona las categorías genéricas del sistema y crea categorías específicas para tu grupo
          </p>
        </div>

        <Dialog open={categoriaDialog} onOpenChange={setCategoriaDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Categoría
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Categoría del Grupo</DialogTitle>
              <DialogDescription>
                Crea una categoría específica para este grupo. Los miembros del grupo podrán usarla en sus transacciones.
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
                  placeholder="Ej: Gastos de oficina"
                />
              </div>

              <div>
                <Label htmlFor="grupo">Grupo de Categoría</Label>
                <Select 
                  value={nuevaCategoria.grupo_categoria} 
                  onValueChange={(value) => setNuevaCategoria({
                    ...nuevaCategoria,
                    grupo_categoria: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRUPOS_CATEGORIA.map(grupo => (
                      <SelectItem key={grupo} value={grupo}>
                        {grupo.charAt(0).toUpperCase() + grupo.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-2">
                  {COLORES_PREDEFINIDOS.map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        nuevaCategoria.colorHex === color ? 'border-primary' : 'border-muted'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNuevaCategoria({
                        ...nuevaCategoria,
                        colorHex: color
                      })}
                    />
                  ))}
                </div>
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
                  placeholder="🏢"
                  maxLength={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setCategoriaDialog(false)}
                disabled={creandoCategoria}
              >
                Cancelar
              </Button>
              <Button 
                onClick={crearCategoria}
                disabled={creandoCategoria}
              >
                {creandoCategoria ? 'Creando...' : 'Crear Categoría'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{data.estadisticas.genericasDisponibles}</p>
                <p className="text-sm text-muted-foreground">Categorías Genéricas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{data.estadisticas.grupoCreadas}</p>
                <p className="text-sm text-muted-foreground">Categorías del Grupo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Palette className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {data.estadisticas.genericasDisponibles + data.estadisticas.grupoCreadas}
                </p>
                <p className="text-sm text-muted-foreground">Total Disponibles</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de categorías */}
      <Tabs defaultValue="genericas" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="genericas" className="gap-2">
            <Globe className="h-4 w-4" />
            Categorías Genéricas ({data.estadisticas.genericasDisponibles})
          </TabsTrigger>
          <TabsTrigger value="grupo" className="gap-2">
            <Users className="h-4 w-4" />
            Categorías del Grupo ({data.estadisticas.grupoCreadas})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="genericas" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Categorías Genéricas del Sistema
              </CardTitle>
              <CardDescription>
                Estas categorías están disponibles para todos los usuarios y grupos.
                No pueden ser modificadas, pero están disponibles para usar en cualquier transacción.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.categoriasGenericas.map(categoria => (
                  <div
                    key={categoria.id}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: categoria.colorHex || '#6B7280' }}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{categoria.descripcion}</p>
                      {categoria.grupo_categoria && (
                        <p className="text-xs text-muted-foreground">
                          {categoria.grupo_categoria}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Sistema
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grupo" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Categorías Específicas del Grupo
              </CardTitle>
              <CardDescription>
                Categorías creadas específicamente para este grupo.
                Solo los administradores del grupo pueden crear, editar o eliminar estas categorías.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.categoriasGrupo.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Aún no hay categorías específicas para este grupo.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4 gap-2"
                    onClick={() => setCategoriaDialog(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Crear Primera Categoría
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.categoriasGrupo.map(categoria => (
                    <div
                      key={categoria.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: categoria.colorHex || '#6B7280' }}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{categoria.descripcion}</p>
                        {categoria.grupo_categoria && (
                          <p className="text-xs text-muted-foreground">
                            {categoria.grupo_categoria}
                          </p>
                        )}
                        {categoria.adminCreador && (
                          <p className="text-xs text-muted-foreground">
                            por {categoria.adminCreador.name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          Grupo
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 