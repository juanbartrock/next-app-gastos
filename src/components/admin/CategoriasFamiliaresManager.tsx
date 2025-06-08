'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Loader2, Tags, User, Globe, Lock } from 'lucide-react'
import { toast } from 'sonner'

interface CategoriaFamiliar {
  id: number
  descripcion: string
  colorHex?: string
  icono?: string
  userId: string | null
  creadorNombre?: string
  esPrivada?: boolean
  createdAt: string
  updatedAt: string
}

export function CategoriasFamiliaresManager() {
  const [categorias, setCategorias] = useState<CategoriaFamiliar[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Estados para modal
  const [modalCategoria, setModalCategoria] = useState(false)
  
  // Estados para formulario
  const [formCategoria, setFormCategoria] = useState({
    descripcion: '',
    colorHex: '#3B82F6',
    icono: '📂',
    esPrivada: false
  })

  useEffect(() => {
    cargarCategorias()
  }, [])

  const cargarCategorias = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/categorias/familiares')

      if (response.ok) {
        const data = await response.json()
        console.log('📊 Datos de categorías familiares:', data)
        
        // El endpoint devuelve tanto genéricas como familiares
        // Filtramos solo las familiares para este componente
        const categoriasFamiliares = data.categorias?.filter((cat: any) => cat.userId !== null) || []
        setCategorias(categoriasFamiliares)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al cargar categorías')
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error)
      toast.error('Error al cargar las categorías')
    } finally {
      setLoading(false)
    }
  }

  const crearCategoria = async () => {
    if (!formCategoria.descripcion.trim()) {
      toast.error('El nombre de la categoría es requerido')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/categorias/familiares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descripcion: formCategoria.descripcion.trim(),
          colorHex: formCategoria.colorHex,
          icono: formCategoria.icono,
          esPrivada: formCategoria.esPrivada
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Categoría familiar creada con éxito')
        setModalCategoria(false)
        resetForm()
        cargarCategorias()
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

  const resetForm = () => {
    setFormCategoria({
      descripcion: '',
      colorHex: '#3B82F6',
      icono: '📂',
      esPrivada: false
    })
  }

  const abrirModal = () => {
    resetForm()
    setModalCategoria(true)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Categorías Familiares
          </CardTitle>
          <CardDescription>
            Gestiona las categorías específicas de tu familia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando categorías...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tags className="h-5 w-5" />
          Categorías Familiares
        </CardTitle>
        <CardDescription>
          Crea categorías personalizadas para organizar mejor tus gastos. Puedes hacerlas privadas (solo tú las ves) o familiares (visibles para tu grupo).
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">
              {categorias.length} categoría{categorias.length !== 1 ? 's' : ''} familiar{categorias.length !== 1 ? 'es' : ''}
            </p>
          </div>
          
          <Dialog open={modalCategoria} onOpenChange={setModalCategoria}>
            <DialogTrigger asChild>
              <Button onClick={abrirModal} className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva Categoría
              </Button>
            </DialogTrigger>
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nueva Categoría</DialogTitle>
                <DialogDescription>
                  Personaliza una nueva categoría para organizar tus gastos. Decide si será privada o compartida con tu familia.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="descripcion">Nombre de la categoría</Label>
                  <Input
                    id="descripcion"
                    value={formCategoria.descripcion}
                    onChange={(e) => setFormCategoria(prev => ({
                      ...prev,
                      descripcion: e.target.value
                    }))}
                    placeholder="Ej: Gastos del hogar"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="icono">Icono</Label>
                    <Input
                      id="icono"
                      value={formCategoria.icono}
                      onChange={(e) => setFormCategoria(prev => ({
                        ...prev,
                        icono: e.target.value
                      }))}
                      placeholder="📂"
                      maxLength={2}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="colorHex">Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="colorHex"
                        type="color"
                        value={formCategoria.colorHex}
                        onChange={(e) => setFormCategoria(prev => ({
                          ...prev,
                          colorHex: e.target.value
                        }))}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={formCategoria.colorHex}
                        onChange={(e) => setFormCategoria(prev => ({
                          ...prev,
                          colorHex: e.target.value
                        }))}
                        placeholder="#3B82F6"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="esPrivada" className="text-base font-medium">
                      Categoría Privada
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Solo tú podrás ver esta categoría, no se compartirá con tu familia o grupo
                    </p>
                  </div>
                  <Switch
                    id="esPrivada"
                    checked={formCategoria.esPrivada}
                    onCheckedChange={(checked) => setFormCategoria(prev => ({
                      ...prev,
                      esPrivada: checked
                    }))}
                  />
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
                  onClick={crearCategoria}
                  disabled={submitting}
                  className="gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Crear Categoría
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {categorias.length === 0 ? (
          <div className="text-center py-8">
            <Tags className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay categorías familiares</h3>
            <p className="text-muted-foreground mb-4">
              Crea tu primera categoría familiar personalizada
            </p>
            <Button onClick={abrirModal} className="gap-2">
              <Plus className="h-4 w-4" />
              Crear Primera Categoría
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {categorias.map((categoria) => (
              <div
                key={categoria.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: categoria.colorHex || '#3B82F6' }}
                  >
                    {categoria.icono || '📂'}
                  </div>
                  
                  <div>
                    <h4 className="font-medium">{categoria.descripcion}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>Creada por: {categoria.creadorNombre || 'Usuario'}</span>
                      {categoria.esPrivada ? (
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                          <Lock className="h-3 w-3 mr-1" />
                          Privada
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Familiar
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="border-t pt-4">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  Categorías Genéricas del Sistema
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Además de tus categorías familiares, tienes acceso a todas las categorías genéricas 
                  del sistema como Alimentación, Transporte, Hogar, etc.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 