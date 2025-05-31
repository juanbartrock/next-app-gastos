"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronDown, ChevronUp, Edit, PackageOpen, Plus, Search, ShoppingBag, Trash, Banknote, Send, Filter, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCurrency } from "@/contexts/CurrencyContext"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

interface GastoDetalle {
  id: number
  gastoId: number
  descripcion: string
  cantidad: number
  precioUnitario: number | null
  subtotal: number
  seguimiento: boolean
  createdAt: string
  updatedAt: string
}

interface Gasto {
  id: number
  concepto: string
  monto: number
  fecha: string
  fechaImputacion?: string
  categoria: string
  tipoTransaccion: string
  tipoMovimiento: string
  incluirEnFamilia: boolean
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

export default function TransaccionesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { formatMoney } = useCurrency()
  
  const [transactions, setTransactions] = useState<Gasto[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Gasto[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [movementTypeFilter, setMovementTypeFilter] = useState("all")
  const [selectedTransaction, setSelectedTransaction] = useState<Gasto | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingDetalle, setEditingDetalle] = useState<GastoDetalle | null>(null)
  const [mostrarFormDetalle, setMostrarFormDetalle] = useState(false)
  const [nuevoDetalle, setNuevoDetalle] = useState({
    descripcion: "",
    cantidad: "1",
    precioUnitario: "",
    subtotal: "",
    seguimiento: false
  })
  
  useEffect(() => {
    if (session) {
      fetchTransactions()
    }
  }, [session])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/gastos')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
        setFilteredTransactions(data)
      } else {
        toast.error("Error al cargar las transacciones")
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
      toast.error("Error al cargar las transacciones")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = transactions

    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.categoria.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter && categoryFilter !== "all") {
      filtered = filtered.filter(t => t.categoria === categoryFilter)
    }

    if (typeFilter && typeFilter !== "all") {
      filtered = filtered.filter(t => t.tipoTransaccion === typeFilter)
    }

    if (movementTypeFilter && movementTypeFilter !== "all") {
      filtered = filtered.filter(t => t.tipoMovimiento === movementTypeFilter)
    }

    setFilteredTransactions(filtered)
  }, [searchTerm, categoryFilter, typeFilter, movementTypeFilter, transactions])

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

  // Manejar click en fila
  const handleRowClick = async (transaction: Gasto) => {
    if (selectedTransaction?.id === transaction.id) {
      setSelectedTransaction(null)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/gastos/${transaction.id}?includeDetails=true`)
      if (response.ok) {
        const data = await response.json()
        setSelectedTransaction(data)
      } else {
        toast.error("Error al cargar los detalles")
      }
    } catch (error) {
      console.error("Error fetching transaction details:", error)
      toast.error("Error al cargar los detalles")
    } finally {
      setLoading(false)
    }
  }

  // Función para eliminar transacción
  const eliminarTransaccion = async (transactionId: number, event: React.MouseEvent) => {
    event.stopPropagation() // Evitar que se abra el detalle
    
    if (!confirm("¿Estás seguro de que deseas eliminar esta transacción?")) {
      return
    }

    try {
      const response = await fetch(`/api/gastos/${transactionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success("Transacción eliminada correctamente")
        fetchTransactions() // Recargar la lista
        if (selectedTransaction?.id === transactionId) {
          setSelectedTransaction(null) // Cerrar detalle si era la seleccionada
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Error al eliminar la transacción")
      }
    } catch (error) {
      console.error("Error al eliminar transacción:", error)
      toast.error("Error al eliminar la transacción")
    }
  }

  // Función para ir a editar
  const editarTransaccion = (transactionId: number, event: React.MouseEvent) => {
    event.stopPropagation() // Evitar que se abra el detalle
    router.push(`/transacciones/${transactionId}/editar`)
  }

  // Agregar detalle
  const agregarDetalle = async () => {
    if (!selectedTransaction) return
    
    if (!nuevoDetalle.descripcion || !nuevoDetalle.subtotal) {
      toast.error("Por favor completa al menos la descripción y el subtotal")
      return
    }
    
    try {
      setLoading(true)
      
      const producto = {
        descripcion: nuevoDetalle.descripcion,
        cantidad: parseFloat(nuevoDetalle.cantidad) || 1,
        precioUnitario: nuevoDetalle.precioUnitario ? parseFloat(nuevoDetalle.precioUnitario.replace(/[^\d.]/g, "")) : null,
        subtotal: parseFloat(nuevoDetalle.subtotal.replace(/[^\d.]/g, "")) || 0,
        seguimiento: nuevoDetalle.seguimiento
      }
      
      const response = await fetch('/api/gastos/detalles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gastoId: selectedTransaction.id,
          productos: [producto]
        }),
      })
      
      if (!response.ok) {
        throw new Error("Error al guardar el detalle")
      }
      
      // Recargar los detalles
      const gastoActualizado = await fetch(`/api/gastos/${selectedTransaction.id}?includeDetails=true`)
      const data = await gastoActualizado.json()
      setSelectedTransaction(data)
      
      // Resetear formulario
      setNuevoDetalle({
        descripcion: "",
        cantidad: "1",
        precioUnitario: "",
        subtotal: "",
        seguimiento: false
      })
      
      setMostrarFormDetalle(false)
      
      toast.success("Detalle agregado correctamente")
    } catch (error) {
      console.error("Error al guardar detalle:", error)
      toast.error("No se pudo guardar el detalle")
    } finally {
      setLoading(false)
    }
  }

  // Eliminar detalle
  const eliminarDetalle = async (detalleId: number) => {
    if (!selectedTransaction) return
    
    try {
      const response = await fetch(`/api/gastos/detalles/${detalleId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error("Error al eliminar el detalle")
      }
      
      // Recargar los detalles
      const gastoActualizado = await fetch(`/api/gastos/${selectedTransaction.id}?includeDetails=true`)
      const data = await gastoActualizado.json()
      setSelectedTransaction(data)
      
      toast.success("Detalle eliminado correctamente")
    } catch (error) {
      console.error("Error al eliminar detalle:", error)
      toast.error("No se pudo eliminar el detalle")
    }
  }

  // Función para editar un detalle
  const iniciarEdicionDetalle = (detalle: GastoDetalle) => {
    setEditingDetalle(detalle)
    setNuevoDetalle({
      descripcion: detalle.descripcion,
      cantidad: detalle.cantidad.toString(),
      precioUnitario: detalle.precioUnitario ? detalle.precioUnitario.toString() : "",
      subtotal: detalle.subtotal.toString(),
      seguimiento: detalle.seguimiento
    })
    setMostrarFormDetalle(true)
  }
  
  // Guardar cambios de edición
  const guardarEdicionDetalle = async () => {
    if (!selectedTransaction || !editingDetalle) return
    
    if (!nuevoDetalle.descripcion || !nuevoDetalle.subtotal) {
      toast.error("Por favor completa al menos la descripción y el subtotal")
      return
    }
    
    try {
      setLoading(true);
      
      // Obtener el monto original del detalle antes de eliminarlo
      const montoOriginal = editingDetalle.subtotal;
      
      // Calcular el nuevo subtotal
      const nuevoSubtotal = parseFloat(nuevoDetalle.subtotal.replace(/[^\d.]/g, "")) || 0;
      
      // Calcular la diferencia para ajustar el total del gasto
      const diferencia = nuevoSubtotal - montoOriginal;
      
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
        subtotal: nuevoSubtotal,
        seguimiento: nuevoDetalle.seguimiento
      }
      
      const createResponse = await fetch('/api/gastos/detalles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gastoId: selectedTransaction.id,
          productos: [producto]
        }),
      })
      
      if (!createResponse.ok) {
        throw new Error("Error al crear el nuevo detalle")
      }
      
      // Actualizar el monto total del gasto
      const nuevoMontoGasto = selectedTransaction.monto + diferencia;
      
      const updateGastoResponse = await fetch(`/api/gastos/${selectedTransaction.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monto: nuevoMontoGasto
        }),
      });
      
      if (!updateGastoResponse.ok) {
        console.warn("No se pudo actualizar el monto total del gasto");
      }
      
      // Recargar los detalles y el gasto actualizado
      const gastoActualizado = await fetch(`/api/gastos/${selectedTransaction.id}?includeDetails=true`);
      const data = await gastoActualizado.json();
      
      // Actualizar tanto en el gasto seleccionado como en la lista de transacciones
      setSelectedTransaction(data);
      setTransactions(transactions.map(t => 
        t.id === data.id ? {...t, monto: data.monto} : t
      ));
      
      // Resetear estado
      setEditingDetalle(null);
      setNuevoDetalle({
        descripcion: "",
        cantidad: "1",
        precioUnitario: "",
        subtotal: "",
        seguimiento: false
      });
      setMostrarFormDetalle(false);
      
      toast.success("Detalle actualizado correctamente");
    } catch (error) {
      console.error("Error al editar detalle:", error);
      toast.error("No se pudo actualizar el detalle");
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar el seguimiento de un producto
  const actualizarSeguimiento = async (detalleId: number, seguimiento: boolean) => {
    try {
      console.log(`Actualizando seguimiento del detalle ${detalleId} a ${seguimiento}`);
      
      const response = await fetch(`/api/gastos/detalles/${detalleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ seguimiento }),
      });

      const responseData = await response.json();
      console.log('Respuesta del servidor:', responseData);

      if (response.ok) {
        // Actualizar el estado local
        if (selectedTransaction && selectedTransaction.detalles) {
          const updatedDetalles = selectedTransaction.detalles.map(d => 
            d.id === detalleId ? { ...d, seguimiento } : d
          );
          setSelectedTransaction({
            ...selectedTransaction,
            detalles: updatedDetalles
          });
          
          toast.success(seguimiento 
            ? "Producto agregado al seguimiento de precios" 
            : "Producto eliminado del seguimiento de precios"
          );
        }
      } else {
        console.error('Error en la respuesta:', responseData);
        toast.error(`No se pudo actualizar el seguimiento: ${responseData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error("Error al actualizar seguimiento:", error);
      toast.error("Error al actualizar el seguimiento");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              className="gap-2"
              onClick={() => router.push("/?dashboard=true")}
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <h1 className="text-2xl font-bold dark:text-white">Historial de Transacciones</h1>
          </div>
          
          {/* Botones de acciones rápidas */}
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              className="gap-2"
              onClick={() => router.push('/transacciones/extraccion-cajero')}
            >
              <Banknote className="w-4 h-4" />
              Extraer Cajero
            </Button>
            <Button 
              variant="outline"
              className="gap-2"
              onClick={() => router.push('/transacciones/transferir')}
            >
              <Send className="w-4 h-4" />
              Transferir
            </Button>
            <Button 
              className="gap-2"
              onClick={() => router.push('/transacciones/nuevo')}
            >
              <Plus className="w-4 h-4" />
              Nueva Transacción
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="search"
                    placeholder="Buscar por concepto o categoría"
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Categoría</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="Alimentación">Alimentación</SelectItem>
                    <SelectItem value="Transporte">Transporte</SelectItem>
                    <SelectItem value="Servicios">Servicios</SelectItem>
                    <SelectItem value="Ocio">Ocio</SelectItem>
                    <SelectItem value="Otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de Transacción</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="income">Ingresos</SelectItem>
                    <SelectItem value="expense">Egresos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de Movimiento</Label>
                <Select value={movementTypeFilter} onValueChange={setMovementTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los movimientos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                    <SelectItem value="ahorro">Ahorro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transacciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
                    <th className="pb-3 font-normal">Fecha</th>
                    <th className="pb-3 font-normal">Categoría</th>
                    <th className="pb-3 font-normal">Concepto</th>
                    <th className="pb-3 font-normal text-right">Tipo Transacción</th>
                    <th className="pb-3 font-normal text-right">Tipo Movimiento</th>
                    <th className="pb-3 font-normal text-right">Monto</th>
                    <th className="pb-3 font-normal text-right">Acciones</th>
                    <th className="pb-3 font-normal text-right">Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr 
                      key={transaction.id} 
                      className={`border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${selectedTransaction?.id === transaction.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                      onClick={() => handleRowClick(transaction)}
                    >
                      <td className="py-3 text-sm">
                        <div className="flex flex-col">
                          <span>{format(new Date(transaction.fecha), "dd MMM yyyy", { locale: es })}</span>
                          {transaction.fechaImputacion && (
                            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                              📊 {format(new Date(transaction.fechaImputacion), "dd MMM yyyy", { locale: es })}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-sm capitalize">{transaction.categoria}</td>
                      <td className="py-3 text-sm">{transaction.concepto}</td>
                      <td className="text-right">
                        <Badge 
                          className={transaction.tipoTransaccion === "income" 
                            ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300" 
                            : "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300"
                          }
                        >
                          {transaction.tipoTransaccion === "income" ? "Ingreso" : "Egreso"}
                        </Badge>
                      </td>
                      <td className="text-right">
                        <Badge variant="outline" className="capitalize">
                          {transaction.tipoMovimiento}
                        </Badge>
                      </td>
                      <td className="text-right text-sm font-medium">
                        {formatMoney(transaction.monto)}
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={(e) => editarTransaccion(transaction.id, e)}
                            title="Editar transacción"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => eliminarTransaccion(transaction.id, e)}
                            title="Eliminar transacción"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                      <td className="text-right">
                        {selectedTransaction?.id === transaction.id ? (
                          <ChevronUp className="h-4 w-4 ml-auto" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Detalle de transacción */}
        {selectedTransaction && (
          <Card className="mt-6 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Detalle de Productos
                </CardTitle>
                <div className="space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push(`/transacciones/${selectedTransaction.id}/editar`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Transacción
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setMostrarFormDetalle(!mostrarFormDetalle)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Producto
                  </Button>
                </div>
              </div>
              <Separator className="my-2" />
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold">{selectedTransaction.concepto}</span>
                <span className="mx-2">•</span>
                <span>{format(new Date(selectedTransaction.fecha), "d 'de' MMMM 'de' yyyy", { locale: es })}</span>
                {selectedTransaction.fechaImputacion && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="text-amber-600 dark:text-amber-400">
                      Imputación: {format(new Date(selectedTransaction.fechaImputacion), "d 'de' MMMM 'de' yyyy", { locale: es })}
                    </span>
                  </>
                )}
                <span className="mx-2">•</span>
                <span className="font-semibold">{formatMoney(selectedTransaction.monto)}</span>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="h-24 flex items-center justify-center">
                  <div className="animate-spin h-6 w-6 border-t-2 border-b-2 border-primary rounded-full"></div>
                </div>
              ) : (
                <>
                  {/* Formulario para agregar nuevo detalle */}
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
                      
                      <div className="mb-3">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="seguimiento-nuevo"
                            checked={nuevoDetalle.seguimiento}
                            onChange={(e) => setNuevoDetalle({...nuevoDetalle, seguimiento: e.target.checked})}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor="seguimiento-nuevo" className="ml-2 text-sm font-medium">
                            Seguir precio de este producto
                          </label>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Recibirás alertas si encontramos este producto a un precio menor
                        </p>
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setMostrarFormDetalle(false)
                            setEditingDetalle(null)
                            setNuevoDetalle({
                              descripcion: "",
                              cantidad: "1",
                              precioUnitario: "",
                              subtotal: "",
                              seguimiento: false
                            })
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

                  {selectedTransaction.detalles && selectedTransaction.detalles.length > 0 ? (
                    <div className="space-y-4">
                      {selectedTransaction.detalles.map((detalle) => (
                        <div key={detalle.id} className="border-b pb-3 last:border-0 last:pb-0">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                <span>{detalle.descripcion}</span>
                                <div className="flex items-center ml-2">
                                  <input
                                    type="checkbox"
                                    id={`seguimiento-${detalle.id}`}
                                    checked={detalle.seguimiento}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      actualizarSeguimiento(detalle.id, e.target.checked);
                                    }}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                  />
                                  <label htmlFor={`seguimiento-${detalle.id}`} className="ml-1 text-xs text-muted-foreground">
                                    Seguir precio
                                  </label>
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {detalle.cantidad} {detalle.cantidad > 1 ? "unidades" : "unidad"}
                                {detalle.precioUnitario ? ` × ${formatMoney(detalle.precioUnitario)}` : ""}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{formatMoney(detalle.subtotal)}</span>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    iniciarEdicionDetalle(detalle);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    eliminarDetalle(detalle.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingBag className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>No hay productos registrados en esta transacción</p>
                      <p className="text-sm">Haz clic en "Agregar Producto" para empezar</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 