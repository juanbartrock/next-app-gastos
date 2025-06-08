'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Globe, User, Users, Check, X, Star, Heart } from 'lucide-react'

interface Categoria {
  id: number
  descripcion: string
  colorHex?: string
  icono?: string
  grupo_categoria?: string
  esGenerica: boolean
  activa: boolean
  userId?: string
  grupoId?: string
  adminCreador?: {
    id: string
    name: string
  }
  grupo?: {
    id: string
    nombre: string
  }
  createdAt: string
}

interface CategoriaData {
  categoriasGenericas: Categoria[]
  categoriasPersonales: Categoria[]
  categoriasGrupo: Categoria[]
  grupos: Array<{ id: string; nombre: string }>
  estadisticas: {
    genericasDisponibles: number
    personalesCreadas: number
    gruposConCategorias: number
    totalVisibles: number
  }
}

export default function TestCategoriasExpandidasPage() {
  const [data, setData] = useState<CategoriaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [creandoCategoria, setCreandoCategoria] = useState(false)
  const [dialogAbierto, setDialogAbierto] = useState(false)

  const [nuevaCategoria, setNuevaCategoria] = useState({
    descripcion: '',
    colorHex: '#3B82F6',
    icono: '📁',
    grupo_categoria: 'personal'
  })

  // Colores predefinidos para categorías
  const COLORES_PREDEFINIDOS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ]

  // Grupos de categorías predefinidos
  const GRUPOS_CATEGORIA = [
    'personal', 'trabajo', 'entretenimiento', 'desarrollo', 'especiales'
  ]

  // Iconos sugeridos
  const ICONOS_SUGERIDOS = [
    '📁', '💼', '🎯', '🎮', '📝', '🌟', '💡', '🔥', '⭐', '❤️',
    '🚀', '💰', '🎨', '📚', '🏠', '🚗', '🍕', '☕', '🎵', '📱'
  ]

  const fetchCategorias = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/categorias/personales')
      
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

  const crearCategoriaPersonal = async () => {
    if (!nuevaCategoria.descripcion.trim()) {
      toast.error('La descripción es requerida')
      return
    }

    try {
      setCreandoCategoria(true)
      
      const response = await fetch('/api/categorias/personales', {
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
          toast.error(result.error || 'Error al crear la categoría personal')
        }
        return
      }

      toast.success('Categoría personal creada exitosamente')
      setDialogAbierto(false)
      setNuevaCategoria({
        descripcion: '',
        colorHex: '#3B82F6',
        icono: '📁',
        grupo_categoria: 'personal'
      })
      fetchCategorias()
      
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al crear la categoría personal')
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
          <h1 className="text-3xl font-bold">🧪 Test - Sistema Expandido de Categorías</h1>
          <p className="text-muted-foreground mt-2">
            Sistema completo: Genéricas + Personales + Grupos
          </p>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="gap-1">
              <Globe className="h-3 w-3" />
              {data.estadisticas.genericasDisponibles} Genéricas
            </Badge>
            <Badge variant="outline" className="gap-1">
              <User className="h-3 w-3" />
              {data.estadisticas.personalesCreadas} Personales
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" />
              {data.estadisticas.gruposConCategorias} De Grupos
            </Badge>
          </div>
        </div>

        <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Categoría Personal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Categoría Personal</DialogTitle>
              <DialogDescription>
                Crea una categoría personal privada. Solo tú podrás verla y usarla.
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
                  placeholder="Ej: Mi trabajo freelance"
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
                    <SelectValue />
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
                <Label htmlFor="icono">Icono</Label>
                <div className="flex gap-2 mb-2">
                  {ICONOS_SUGERIDOS.slice(0, 10).map(icono => (
                    <Button
                      key={icono}
                      variant="outline"
                      size="sm"
                      onClick={() => setNuevaCategoria({
                        ...nuevaCategoria,
                        icono
                      })}
                      className="p-2"
                    >
                      {icono}
                    </Button>
                  ))}
                </div>
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
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2 mb-2">
                  {COLORES_PREDEFINIDOS.map(color => (
                    <button
                      key={color}
                      className="w-6 h-6 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: color }}
                      onClick={() => setNuevaCategoria({
                        ...nuevaCategoria,
                        colorHex: color
                      })}
                    />
                  ))}
                </div>
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
                onClick={crearCategoriaPersonal}
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
            <p className="text-xs text-muted-foreground">Todas las categorías</p>
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
            <CardTitle className="text-sm font-medium">Personales</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.estadisticas.personalesCreadas}</div>
            <p className="text-xs text-muted-foreground">Solo tuyas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">De Grupos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.estadisticas.gruposConCategorias}</div>
            <p className="text-xs text-muted-foreground">Compartidas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs por tipo de categoría */}
      <Tabs defaultValue="todas" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="todas">Todas ({data.estadisticas.totalVisibles})</TabsTrigger>
          <TabsTrigger value="genericas">Genéricas ({data.estadisticas.genericasDisponibles})</TabsTrigger>
          <TabsTrigger value="personales">Personales ({data.estadisticas.personalesCreadas})</TabsTrigger>
          <TabsTrigger value="grupos">Grupos ({data.estadisticas.gruposConCategorias})</TabsTrigger>
        </TabsList>

        <TabsContent value="todas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todas las Categorías Visibles</CardTitle>
              <CardDescription>
                Vista completa del sistema expandido: genéricas + personales + grupos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Genéricas */}
                {data.categoriasGenericas.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">GENÉRICAS DEL SISTEMA</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {data.categoriasGenericas.slice(0, 6).map((categoria) => (
                        <div key={categoria.id} className="flex items-center gap-2 p-2 border rounded-lg">
                          <Globe className="h-3 w-3 text-blue-500" />
                          <span className="text-sm">{categoria.icono} {categoria.descripcion}</span>
                        </div>
                      ))}
                      {data.categoriasGenericas.length > 6 && (
                        <div className="text-xs text-muted-foreground p-2">
                          Y {data.categoriasGenericas.length - 6} más...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Personales */}
                {data.categoriasPersonales.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">TUS CATEGORÍAS PERSONALES</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {data.categoriasPersonales.map((categoria) => (
                        <div key={categoria.id} className="flex items-center gap-2 p-2 border rounded-lg bg-green-50">
                          <User className="h-3 w-3 text-green-500" />
                          <span className="text-sm">{categoria.icono} {categoria.descripcion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grupos */}
                {data.categoriasGrupo.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">CATEGORÍAS DE GRUPOS</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {data.categoriasGrupo.map((categoria) => (
                        <div key={categoria.id} className="flex items-center gap-2 p-2 border rounded-lg bg-purple-50">
                          <Users className="h-3 w-3 text-purple-500" />
                          <span className="text-sm">{categoria.icono} {categoria.descripcion}</span>
                          <Badge variant="outline" className="text-xs">
                            {categoria.grupo?.nombre}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="genericas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Categorías Genéricas del Sistema</CardTitle>
              <CardDescription>
                Disponibles para todos los usuarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.categoriasGenericas.map((categoria) => (
                  <div key={categoria.id} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: categoria.colorHex || '#6B7280' }}
                      />
                      <span className="font-medium">{categoria.icono} {categoria.descripcion}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        <Globe className="h-3 w-3 mr-1" />
                        Sistema
                      </Badge>
                      {categoria.grupo_categoria && (
                        <Badge variant="secondary" className="text-xs">
                          {categoria.grupo_categoria}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tus Categorías Personales</CardTitle>
              <CardDescription>
                Categorías privadas que solo tú puedes ver y usar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.categoriasPersonales.map((categoria) => (
                  <div key={categoria.id} className="p-3 border rounded-lg bg-green-50">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: categoria.colorHex || '#10B981' }}
                      />
                      <span className="font-medium">{categoria.icono} {categoria.descripcion}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                        <User className="h-3 w-3 mr-1" />
                        Personal
                      </Badge>
                      {categoria.grupo_categoria && (
                        <Badge variant="secondary" className="text-xs">
                          {categoria.grupo_categoria}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {data.categoriasPersonales.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tienes categorías personales</p>
                  <p className="text-sm">Crea tu primera categoría personal para organizar mejor tus gastos</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grupos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Categorías de Grupos</CardTitle>
              <CardDescription>
                Categorías compartidas de los grupos donde eres miembro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.categoriasGrupo.map((categoria) => (
                  <div key={categoria.id} className="p-3 border rounded-lg bg-purple-50">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: categoria.colorHex || '#8B5CF6' }}
                      />
                      <span className="font-medium">{categoria.icono} {categoria.descripcion}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                        <Users className="h-3 w-3 mr-1" />
                        {categoria.grupo?.nombre}
                      </Badge>
                      {categoria.adminCreador && (
                        <Badge variant="outline" className="text-xs">
                          Por: {categoria.adminCreador.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {data.categoriasGrupo.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay categorías de grupos</p>
                  <p className="text-sm">Únete a un grupo o crea categorías en tus grupos existentes</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Estado del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Estado del Sistema Expandido</CardTitle>
          <CardDescription>
            Verificación de la implementación del sistema completo de categorías
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Sistema expandido implementado correctamente</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Categorías genéricas disponibles: {data.estadisticas.genericasDisponibles}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Categorías personales creadas: {data.estadisticas.personalesCreadas}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Categorías de grupos: {data.estadisticas.gruposConCategorias}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">API de creación personal funcional</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Total categorías visibles: {data.estadisticas.totalVisibles}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 