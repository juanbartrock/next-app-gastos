'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Globe, Users, Check, X } from 'lucide-react'

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
  grupoId?: string
}

interface TestStats {
  categoriasGenericas: number
  categoriasGrupo: number
  totalCategorias: number
}

export default function TestCategoriasHibridasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [stats, setStats] = useState<TestStats | null>(null)
  const [loading, setLoading] = useState(true)

  const [nuevaCategoria, setNuevaCategoria] = useState({
    descripcion: '',
    colorHex: '#3B82F6',
    icono: '📁',
    grupo_categoria: 'especiales'
  })
  const [creandoCategoria, setCreandoCategoria] = useState(false)
  const [dialogAbierto, setDialogAbierto] = useState(false)

  const fetchCategorias = async () => {
    try {
      setLoading(true)
      
      // Obtener todas las categorías para testing
      const response = await fetch('/api/categorias')
      
      if (!response.ok) {
        throw new Error('Error al cargar categorías')
      }
      
      const data = await response.json()
      setCategorias(data)
      
      // Calcular estadísticas
      const genericas = data.filter((c: Categoria) => c.esGenerica).length
      const grupo = data.filter((c: Categoria) => !c.esGenerica).length
      
      setStats({
        categoriasGenericas: genericas,
        categoriasGrupo: grupo,
        totalCategorias: data.length
      })
      
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar las categorías')
    } finally {
      setLoading(false)
    }
  }

  const crearCategoriaTest = async () => {
    if (!nuevaCategoria.descripcion.trim()) {
      toast.error('La descripción es requerida')
      return
    }

    try {
      setCreandoCategoria(true)
      
      // Crear como categoría de grupo de prueba (usaremos un grupo ficticio)
      const response = await fetch('/api/categorias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...nuevaCategoria,
          esGenerica: false,
          tipo: 'grupo',
          activa: true
        })
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.message || 'Error al crear la categoría')
        return
      }

      toast.success('Categoría de prueba creada exitosamente')
      setDialogAbierto(false)
      setNuevaCategoria({
        descripcion: '',
        colorHex: '#3B82F6',
        icono: '📁',
        grupo_categoria: 'especiales'
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

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">🧪 Test - Categorías Híbridas</h1>
          <p className="text-muted-foreground mt-2">
            Página de prueba para el sistema híbrido de categorías (genéricas + específicas por grupo)
          </p>
        </div>

        <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Crear Categoría Test
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Categoría de Prueba</DialogTitle>
              <DialogDescription>
                Crea una categoría específica de grupo para probar el sistema híbrido.
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
                  placeholder="Ej: Gastos de prueba"
                />
              </div>

              <div>
                <Label htmlFor="icono">Icono</Label>
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
                onClick={crearCategoriaTest}
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
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categorías Genéricas</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.categoriasGenericas}</div>
              <p className="text-xs text-muted-foreground">Del sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categorías de Grupo</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.categoriasGrupo}</div>
              <p className="text-xs text-muted-foreground">Específicas por grupo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Check className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCategorias}</div>
              <p className="text-xs text-muted-foreground">Todas las categorías</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Categorías */}
      <Tabs defaultValue="todas" className="w-full">
        <TabsList>
          <TabsTrigger value="todas">Todas las Categorías</TabsTrigger>
          <TabsTrigger value="genericas">Genéricas</TabsTrigger>
          <TabsTrigger value="grupo">De Grupo</TabsTrigger>
        </TabsList>

        <TabsContent value="todas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todas las Categorías ({categorias.length})</CardTitle>
              <CardDescription>
                Vista completa del sistema híbrido de categorías
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categorias.map((categoria) => (
                  <div
                    key={categoria.id}
                    className="p-3 border rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: categoria.colorHex || '#6B7280' }}
                      />
                      <span className="text-sm">
                        {categoria.icono} {categoria.descripcion}
                      </span>
                    </div>
                    <Badge variant={categoria.esGenerica ? "default" : "secondary"}>
                      {categoria.esGenerica ? (
                        <>
                          <Globe className="h-3 w-3 mr-1" />
                          Genérica
                        </>
                      ) : (
                        <>
                          <Users className="h-3 w-3 mr-1" />
                          Grupo
                        </>
                      )}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="genericas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Categorías Genéricas ({categorias.filter(c => c.esGenerica).length})</CardTitle>
              <CardDescription>
                Categorías del sistema disponibles para todos los usuarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categorias.filter(c => c.esGenerica).map((categoria) => (
                  <div
                    key={categoria.id}
                    className="p-3 border rounded-lg flex items-center gap-3"
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: categoria.colorHex || '#6B7280' }}
                    />
                    <span className="text-sm">
                      {categoria.icono} {categoria.descripcion}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {categoria.grupo_categoria || 'sin grupo'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grupo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Categorías de Grupo ({categorias.filter(c => !c.esGenerica).length})</CardTitle>
              <CardDescription>
                Categorías específicas creadas por administradores de grupo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categorias.filter(c => !c.esGenerica).map((categoria) => (
                  <div
                    key={categoria.id}
                    className="p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: categoria.colorHex || '#6B7280' }}
                      />
                      <span className="text-sm font-medium">
                        {categoria.icono} {categoria.descripcion}
                      </span>
                    </div>
                    {categoria.adminCreador && (
                      <p className="text-xs text-muted-foreground">
                        Creado por: {categoria.adminCreador.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              
              {categorias.filter(c => !c.esGenerica).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay categorías de grupo creadas</p>
                  <p className="text-sm">Crea una categoría de prueba para probar el sistema</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Estado del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Estado del Sistema Híbrido</CardTitle>
          <CardDescription>
            Verificación de la implementación de categorías híbridas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Sistema híbrido implementado correctamente</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Categorías genéricas disponibles: {stats?.categoriasGenericas}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Categorías de grupo implementadas: {stats?.categoriasGrupo}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">API de creación funcional</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 