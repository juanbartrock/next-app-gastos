'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Categoria {
  id: number
  descripcion: string
  grupo_categoria: string | null
  status: boolean
  createdAt: string
  updatedAt: string
}

export function CategoriasManager() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [grupos, setGrupos] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Estados para modales
  const [modalCategoria, setModalCategoria] = useState(false)
  const [modalGrupo, setModalGrupo] = useState(false)
  const [editandoCategoria, setEditandoCategoria] = useState<Categoria | null>(null)
  const [editandoGrupo, setEditandoGrupo] = useState<string | null>(null)
  
  // Estados para formularios
  const [formCategoria, setFormCategoria] = useState({
    descripcion: '',
    grupo_categoria: ''
  })
  const [formGrupo, setFormGrupo] = useState({
    nombre: ''
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [categoriasRes, gruposRes] = await Promise.all([
        fetch('/api/categorias'),
        fetch('/api/categorias/grupos')
      ])

      if (categoriasRes.ok) {
        const categoriasData = await categoriasRes.json()
        setCategorias(categoriasData)
      }

      if (gruposRes.ok) {
        const gruposData = await gruposRes.json()
        setGrupos(gruposData)
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
      toast.error('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  // Funciones para categorías
  const crearCategoria = async () => {
    if (!formCategoria.descripcion.trim()) {
      toast.error('El nombre de la categoría es requerido')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descripcion: formCategoria.descripcion.trim(),
          grupo_categoria: formCategoria.grupo_categoria || null
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Categoría creada con éxito')
        setModalCategoria(false)
        resetFormCategoria()
        cargarDatos()
      } else {
        toast.error(data.error || 'Error al crear la categoría')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al crear la categoría')
    } finally {
      setSubmitting(false)
    }
  }

  const actualizarCategoria = async () => {
    if (!editandoCategoria || !formCategoria.descripcion.trim()) {
      toast.error('El nombre de la categoría es requerido')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/categorias', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editandoCategoria.id,
          descripcion: formCategoria.descripcion.trim(),
          grupo_categoria: formCategoria.grupo_categoria || null
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Categoría actualizada con éxito')
        setModalCategoria(false)
        resetFormCategoria()
        cargarDatos()
      } else {
        toast.error(data.error || 'Error al actualizar la categoría')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar la categoría')
    } finally {
      setSubmitting(false)
    }
  }

  const eliminarCategoria = async (categoria: Categoria) => {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${categoria.descripcion}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/categorias?id=${categoria.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Categoría eliminada con éxito')
        cargarDatos()
      } else {
        toast.error(data.error || 'Error al eliminar la categoría')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al eliminar la categoría')
    }
  }

  // Funciones para grupos
  const crearGrupo = async () => {
    if (!formGrupo.nombre.trim()) {
      toast.error('El nombre del grupo es requerido')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/categorias/grupos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formGrupo.nombre.trim()
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Grupo creado con éxito')
        setModalGrupo(false)
        resetFormGrupo()
        cargarDatos()
      } else {
        toast.error(data.error || 'Error al crear el grupo')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al crear el grupo')
    } finally {
      setSubmitting(false)
    }
  }

  const actualizarGrupo = async () => {
    if (!editandoGrupo || !formGrupo.nombre.trim()) {
      toast.error('El nombre del grupo es requerido')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/categorias/grupos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreAnterior: editandoGrupo,
          nombreNuevo: formGrupo.nombre.trim()
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Grupo actualizado con éxito')
        setModalGrupo(false)
        resetFormGrupo()
        cargarDatos()
      } else {
        toast.error(data.error || 'Error al actualizar el grupo')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar el grupo')
    } finally {
      setSubmitting(false)
    }
  }

  const eliminarGrupo = async (grupo: string) => {
    if (!confirm(`¿Estás seguro de eliminar el grupo "${grupo}"? Esto desactivará todas las categorías del grupo.`)) {
      return
    }

    try {
      const response = await fetch(`/api/categorias/grupos?nombre=${encodeURIComponent(grupo)}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Grupo eliminado con éxito')
        cargarDatos()
      } else {
        toast.error(data.error || 'Error al eliminar el grupo')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al eliminar el grupo')
    }
  }

  // Funciones de utilidad
  const resetFormCategoria = () => {
    setFormCategoria({ descripcion: '', grupo_categoria: '' })
    setEditandoCategoria(null)
  }

  const resetFormGrupo = () => {
    setFormGrupo({ nombre: '' })
    setEditandoGrupo(null)
  }

  const iniciarEdicionCategoria = (categoria: Categoria) => {
    setFormCategoria({
      descripcion: categoria.descripcion,
      grupo_categoria: categoria.grupo_categoria || ''
    })
    setEditandoCategoria(categoria)
    setModalCategoria(true)
  }

  const iniciarEdicionGrupo = (grupo: string) => {
    setFormGrupo({ nombre: grupo })
    setEditandoGrupo(grupo)
    setModalGrupo(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gestión de Categorías</h2>
      </div>

      <Tabs defaultValue="categorias" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categorias">Categorías</TabsTrigger>
          <TabsTrigger value="grupos">Grupos</TabsTrigger>
        </TabsList>

        <TabsContent value="categorias" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Categorías</CardTitle>
                  <CardDescription>
                    Gestiona las categorías disponibles para clasificar gastos
                  </CardDescription>
                </div>
                <Dialog open={modalCategoria} onOpenChange={setModalCategoria}>
                  <DialogTrigger asChild>
                    <Button onClick={resetFormCategoria}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Categoría
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editandoCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
                      </DialogTitle>
                      <DialogDescription>
                        {editandoCategoria 
                          ? 'Modifica los datos de la categoría'
                          : 'Crea una nueva categoría para clasificar gastos'
                        }
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="descripcion">Nombre</Label>
                        <Input
                          id="descripcion"
                          value={formCategoria.descripcion}
                          onChange={(e) => setFormCategoria(prev => ({
                            ...prev,
                            descripcion: e.target.value
                          }))}
                          placeholder="Ej: Alimentación"
                        />
                      </div>
                      <div>
                        <Label htmlFor="grupo">Grupo (opcional)</Label>
                        <Select
                          value={formCategoria.grupo_categoria}
                          onValueChange={(value) => setFormCategoria(prev => ({
                            ...prev,
                            grupo_categoria: value
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar grupo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Sin grupo</SelectItem>
                            {grupos.map(grupo => (
                              <SelectItem key={grupo} value={grupo}>
                                {grupo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setModalCategoria(false)}
                        disabled={submitting}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={editandoCategoria ? actualizarCategoria : crearCategoria}
                        disabled={submitting}
                      >
                        {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {editandoCategoria ? 'Actualizar' : 'Crear'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categorias.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No hay categorías creadas
                  </p>
                ) : (
                  <div className="grid gap-4">
                    {categorias.map(categoria => (
                      <div
                        key={categoria.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{categoria.descripcion}</span>
                            {categoria.grupo_categoria && (
                              <Badge variant="secondary">
                                {categoria.grupo_categoria}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            ID: {categoria.id} • Creada: {new Date(categoria.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => iniciarEdicionCategoria(categoria)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => eliminarCategoria(categoria)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grupos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Grupos de Categorías</CardTitle>
                  <CardDescription>
                    Gestiona los grupos para organizar las categorías
                  </CardDescription>
                </div>
                <Dialog open={modalGrupo} onOpenChange={setModalGrupo}>
                  <DialogTrigger asChild>
                    <Button onClick={resetFormGrupo}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Grupo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editandoGrupo ? 'Editar Grupo' : 'Nuevo Grupo'}
                      </DialogTitle>
                      <DialogDescription>
                        {editandoGrupo 
                          ? 'Modifica el nombre del grupo'
                          : 'Crea un nuevo grupo para organizar categorías'
                        }
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="nombre">Nombre del Grupo</Label>
                        <Input
                          id="nombre"
                          value={formGrupo.nombre}
                          onChange={(e) => setFormGrupo(prev => ({
                            ...prev,
                            nombre: e.target.value
                          }))}
                          placeholder="Ej: Gastos Básicos"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setModalGrupo(false)}
                        disabled={submitting}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={editandoGrupo ? actualizarGrupo : crearGrupo}
                        disabled={submitting}
                      >
                        {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {editandoGrupo ? 'Actualizar' : 'Crear'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {grupos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No hay grupos creados
                  </p>
                ) : (
                  <div className="grid gap-4">
                    {grupos.map(grupo => {
                      const categoriasDelGrupo = categorias.filter(c => c.grupo_categoria === grupo)
                      return (
                        <div
                          key={grupo}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{grupo}</span>
                              <Badge variant="outline">
                                {categoriasDelGrupo.length} categorías
                              </Badge>
                            </div>
                            {categoriasDelGrupo.length > 0 && (
                              <p className="text-sm text-muted-foreground">
                                Categorías: {categoriasDelGrupo.map(c => c.descripcion).join(', ')}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => iniciarEdicionGrupo(grupo)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => eliminarGrupo(grupo)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 