"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Edit, Plus, ShoppingBag, Trash } from "lucide-react"
import { useCurrency } from "@/contexts/CurrencyContext"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface GastoDetalle {
  id: number
  gastoId: number
  descripcion: string
  cantidad: number
  precioUnitario: number | null
  subtotal: number
  createdAt: string
  updatedAt: string
}

interface Gasto {
  id: number
  concepto: string
  monto: number
  fecha: string
  categoria: string
  tipoTransaccion: string
  tipoMovimiento: string
  createdAt: string
  updatedAt: string
  userId: string | null
  grupoId: string | null
  categoriaId: number | null
  user?: {
    name: string | null
    email: string | null
  }
  grupo?: {
    nombre: string
  }
  detalles?: GastoDetalle[]
}

// Este componente cliente recibe el ID como prop en lugar de extraerlo de params
export default function DetalleGastoClient({ gastoId }: { gastoId: string }) {
  const router = useRouter()
  const { formatMoney } = useCurrency()
  const [gasto, setGasto] = useState<Gasto | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingDetalle, setEditingDetalle] = useState<GastoDetalle | null>(null)
  const [mostrarFormDetalle, setMostrarFormDetalle] = useState(false)
  const [nuevoDetalle, setNuevoDetalle] = useState<{
    descripcion: string,
    cantidad: string,
    precioUnitario: string,
    subtotal: string
  }>({
    descripcion: "",
    cantidad: "1",
    precioUnitario: "",
    subtotal: ""
  })
  
  useEffect(() => {
    const cargarGasto = async () => {
      try {
        setCargando(true)
        setError(null)
        
        const response = await fetch(`/api/gastos/${gastoId}?includeDetails=true`)
        
        if (!response.ok) {
          throw new Error(`Error al cargar el gasto: ${response.statusText}`)
        }
        
        const data = await response.json()
        setGasto(data)
      } catch (error) {
        console.error("Error al cargar gasto:", error)
        setError("No se pudo cargar el detalle del gasto")
      } finally {
        setCargando(false)
      }
    }
    
    if (gastoId) {
      cargarGasto()
    }
  }, [gastoId])

  // Efecto para calcular el subtotal del nuevo detalle
  useEffect(() => {
    const cantidad = parseFloat(nuevoDetalle.cantidad) || 0
    const precioUnitario = parseFloat(nuevoDetalle.precioUnitario.replace(/[^\d.]/g, "")) || 0
    
    if (cantidad > 0 && precioUnitario > 0) {
      const subtotal = cantidad * precioUnitario
      setNuevoDetalle({
        ...nuevoDetalle,
        subtotal: subtotal.toFixed(2)
      })
    }
  }, [nuevoDetalle.cantidad, nuevoDetalle.precioUnitario])

  const formatoFecha = (fecha: string) => {
    return format(new Date(fecha), "d 'de' MMMM 'de' yyyy", { locale: es })
  }

  const tieneDetalles = gasto?.detalles && gasto.detalles.length > 0
  
  // Función para iniciar la edición de un detalle
  const iniciarEdicionDetalle = (detalle: GastoDetalle) => {
    setEditingDetalle(detalle)
    setNuevoDetalle({
      descripcion: detalle.descripcion,
      cantidad: detalle.cantidad.toString(),
      precioUnitario: detalle.precioUnitario ? detalle.precioUnitario.toString() : "",
      subtotal: detalle.subtotal.toString()
    })
    setMostrarFormDetalle(true)
  }
  
  // Función para guardar la edición de un detalle
  const guardarEdicionDetalle = async () => {
    if (!gasto || !editingDetalle) return
    
    if (!nuevoDetalle.descripcion || !nuevoDetalle.subtotal) {
      toast.error("Por favor completa al menos la descripción y el subtotal")
      return
    }
    
    try {
      // Primero eliminamos el detalle existente
      const deleteResponse = await fetch(`/api/gastos/detalles/${editingDetalle.id}`, {
        method: 'DELETE'
      })
      
      if (!deleteResponse.ok) {
        throw new Error("Error al actualizar el detalle")
      }
      
      // Luego creamos uno nuevo con los datos actualizados
      const producto = {
        descripcion: nuevoDetalle.descripcion,
        cantidad: parseFloat(nuevoDetalle.cantidad) || 1,
        precioUnitario: nuevoDetalle.precioUnitario ? parseFloat(nuevoDetalle.precioUnitario.replace(/[^\d.]/g, "")) : null,
        subtotal: parseFloat(nuevoDetalle.subtotal.replace(/[^\d.]/g, "")) || 0
      }
      
      const createResponse = await fetch('/api/gastos/detalles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gastoId: gasto.id,
          productos: [producto]
        }),
      })
      
      if (!createResponse.ok) {
        throw new Error("Error al crear el nuevo detalle")
      }
      
      // Recargar los detalles
      const gastoActualizado = await fetch(`/api/gastos/${gastoId}?includeDetails=true`)
      const data = await gastoActualizado.json()
      setGasto(data)
      
      // Resetear estado
      setEditingDetalle(null)
      setNuevoDetalle({
        descripcion: "",
        cantidad: "1",
        precioUnitario: "",
        subtotal: ""
      })
      setMostrarFormDetalle(false)
      
      toast.success("Detalle actualizado correctamente")
    } catch (error) {
      console.error("Error al editar detalle:", error)
      toast.error("No se pudo actualizar el detalle")
    }
  }
  
  // Función para agregar un nuevo detalle
  const agregarDetalle = async () => {
    if (!gasto) return
    
    if (!nuevoDetalle.descripcion || !nuevoDetalle.subtotal) {
      toast.error("Por favor completa al menos la descripción y el subtotal")
      return
    }
    
    try {
      const producto = {
        descripcion: nuevoDetalle.descripcion,
        cantidad: parseFloat(nuevoDetalle.cantidad) || 1,
        precioUnitario: nuevoDetalle.precioUnitario ? parseFloat(nuevoDetalle.precioUnitario.replace(/[^\d.]/g, "")) : null,
        subtotal: parseFloat(nuevoDetalle.subtotal.replace(/[^\d.]/g, "")) || 0
      }
      
      const response = await fetch('/api/gastos/detalles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gastoId: gasto.id,
          productos: [producto]
        }),
      })
      
      if (!response.ok) {
        throw new Error("Error al guardar el detalle")
      }
      
      // Recargar los detalles
      const gastoActualizado = await fetch(`/api/gastos/${gastoId}?includeDetails=true`)
      const data = await gastoActualizado.json()
      setGasto(data)
      
      // Resetear formulario
      setNuevoDetalle({
        descripcion: "",
        cantidad: "1",
        precioUnitario: "",
        subtotal: ""
      })
      
      setMostrarFormDetalle(false)
      
      toast.success("Detalle agregado correctamente")
    } catch (error) {
      console.error("Error al guardar detalle:", error)
      toast.error("No se pudo guardar el detalle")
    }
  }
  
  // Función para eliminar un detalle
  const eliminarDetalle = async (detalleId: number) => {
    try {
      const response = await fetch(`/api/gastos/detalles/${detalleId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error("Error al eliminar el detalle")
      }
      
      // Recargar los detalles
      const gastoActualizado = await fetch(`/api/gastos/${gastoId}?includeDetails=true`)
      const data = await gastoActualizado.json()
      setGasto(data)
      
      toast.success("Detalle eliminado correctamente")
    } catch (error) {
      console.error("Error al eliminar detalle:", error)
      toast.error("No se pudo eliminar el detalle")
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 py-6 md:px-6 bg-background border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push('/transacciones/nuevo')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Detalle de Gasto</h1>
          </div>
        </div>
      </header>
      
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          {cargando ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-6 w-1/4" />
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{error}</p>
              </CardContent>
              <CardFooter>
                <Button onClick={() => router.push('/transacciones/nuevo')}>
                  Volver a Transacciones
                </Button>
              </CardFooter>
            </Card>
          ) : gasto ? (
            <>
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle>{gasto.concepto}</CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-1 h-4 w-4" />
                    {formatoFecha(gasto.fecha)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Categoría</p>
                      <p>{gasto.categoria}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                      <p className="capitalize">{gasto.tipoMovimiento}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{formatMoney(gasto.monto)}</p>
                  </div>
                  
                  {gasto.grupo && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Grupo</p>
                      <p>{gasto.grupo.nombre}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <ShoppingBag className="mr-2 h-5 w-5" />
                      Detalle de Productos
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-muted-foreground">
                        {gasto.detalles?.length || 0} {(gasto.detalles?.length || 0) === 1 ? "producto" : "productos"}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingDetalle(null)
                          setNuevoDetalle({
                            descripcion: "",
                            cantidad: "1",
                            precioUnitario: "",
                            subtotal: ""
                          })
                          setMostrarFormDetalle(!mostrarFormDetalle)
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Producto
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Formulario para agregar/editar detalles */}
                  {mostrarFormDetalle && (
                    <div className="border rounded-md p-4 mb-4 bg-muted/30">
                      <h3 className="text-sm font-medium mb-2">
                        {editingDetalle ? "Editar producto" : "Agregar nuevo producto"}
                      </h3>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="space-y-1">
                          <Label htmlFor="descripcion">Descripción</Label>
                          <Input 
                            id="descripcion" 
                            value={nuevoDetalle.descripcion}
                            onChange={(e) => setNuevoDetalle({...nuevoDetalle, descripcion: e.target.value})}
                            placeholder="Ej: Leche 1L"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="cantidad">Cantidad</Label>
                          <Input 
                            id="cantidad" 
                            value={nuevoDetalle.cantidad}
                            onChange={(e) => setNuevoDetalle({...nuevoDetalle, cantidad: e.target.value})}
                            type="number"
                            min="1"
                            step="1"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="space-y-1">
                          <Label htmlFor="precioUnitario">Precio unitario (opcional)</Label>
                          <Input 
                            id="precioUnitario" 
                            value={nuevoDetalle.precioUnitario}
                            onChange={(e) => setNuevoDetalle({...nuevoDetalle, precioUnitario: e.target.value})}
                            placeholder="Ej: 120.50"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="subtotal">Subtotal</Label>
                          <Input 
                            id="subtotal" 
                            value={nuevoDetalle.subtotal}
                            onChange={(e) => setNuevoDetalle({...nuevoDetalle, subtotal: e.target.value})}
                            placeholder="Ej: 120.50"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setMostrarFormDetalle(false)
                            setEditingDetalle(null)
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={editingDetalle ? guardarEdicionDetalle : agregarDetalle}
                        >
                          {editingDetalle ? "Guardar cambios" : "Guardar"}
                        </Button>
                      </div>
                    </div>
                  )}
                
                  {tieneDetalles ? (
                    <div className="space-y-3 divide-y">
                      {gasto.detalles?.map((detalle) => (
                        <div key={detalle.id} className="pt-3 first:pt-0">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{detalle.descripcion}</span>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold">{formatMoney(detalle.subtotal)}</span>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                                  onClick={() => iniciarEdicionDetalle(detalle)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => eliminarDetalle(detalle.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {detalle.cantidad} {detalle.cantidad > 1 ? "unidades" : "unidad"}
                            {detalle.precioUnitario ? ` a ${formatMoney(detalle.precioUnitario)}` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingBag className="mx-auto mb-3 h-10 w-10 opacity-50" />
                      <p>No hay detalles de productos para este gasto</p>
                      <p className="text-sm mt-1">Puedes añadir productos usando el botón "Agregar Producto"</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </main>
    </div>
  )
} 