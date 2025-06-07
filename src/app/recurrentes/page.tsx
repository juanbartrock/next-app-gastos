"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Edit, Pencil, Repeat, Trash2, ArrowLeft, Loader2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useCurrency } from "@/contexts/CurrencyContext"
import { useVisibility } from "@/contexts/VisibilityContext"
import { FinancialSummary } from "@/components/FinancialSummary"

// Tipos
type GastoRecurrente = {
  id: number
  concepto: string
  periodicidad: string
  monto: number
  comentario?: string
  estado: string
  tipoMovimiento?: string
  proximaFecha?: Date
  ultimoPago?: Date
  categoriaId?: number
  categoria?: {
    id: number
    descripcion: string
  }
  gastosGenerados?: {
    id: number
    concepto: string
    monto: number
    fecha: Date
    tipoTransaccion: string
    tipoMovimiento: string
  }[]
}

type Servicio = {
  id: number
  nombre: string
  descripcion?: string
  monto: number
  medioPago: string
  tarjeta?: string
  fechaCobro?: Date
  fechaVencimiento?: Date
}

type Categoria = {
  id: number
  descripcion: string
}

// FUNCIONES HELPER PARA FECHAS (DD/MM/YYYY)
const parseDDMMYYYY = (dateStr: string): Date | undefined => {
  if (!dateStr) return undefined;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Meses en JS son 0-indexed
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1000 && year < 3000 && day > 0 && day <= 31 && month >= 0 && month < 12) {
      const date = new Date(year, month, day);
      // Verificar si la fecha creada es válida (ej. 31/02/2023 no es válido)
      if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
        return date;
      }
    }
  }
  return undefined; // Formato inválido o fecha no válida
};

const formatDateToDDMMYYYY = (date: Date | undefined): string => {
  if (!date) return "";
  try {
    const d = new Date(date); // Asegurarse que es un objeto Date
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0'); // Meses en JS son 0-indexed
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    return ""; // En caso de fecha inválida
  }
};

// Componente de carga
function LoadingScreen() {
  return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
}

export default function RecurrentesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { formatMoney } = useCurrency()
  const { valuesVisible } = useVisibility()
  
  // Estado para gastos recurrentes
  const [gastosRecurrentes, setGastosRecurrentes] = useState<GastoRecurrente[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingGasto, setEditingGasto] = useState<GastoRecurrente | null>(null)
  const [totalMesActual, setTotalMesActual] = useState(0)
  
  // Estado para servicios
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [isServicioFormOpen, setIsServicioFormOpen] = useState(false)
  const [servicioActual, setServicioActual] = useState<Servicio | null>(null)
  const [totalServicios, setTotalServicios] = useState(0)
  const [mostrarTodosServicios, setMostrarTodosServicios] = useState(false)
  
  // Estado para mostrar todos los gastos recurrentes
  const [mostrarTodosGastos, setMostrarTodosGastos] = useState(false)
  
  // Filtros
  const [filtroConcepto, setFiltroConcepto] = useState("")
  const [filtroCategoria, setFiltroCategoria] = useState<number | undefined>(undefined)
  const [filtroEstado, setFiltroEstado] = useState<string | undefined>(undefined)
  
  // Estados para el formulario
  const [concepto, setConcepto] = useState("")
  const [periodicidad, setPeriodicidad] = useState("mensual")
  const [monto, setMonto] = useState("")
  const [comentario, setComentario] = useState("")
  const [estado, setEstado] = useState("pendiente")
  const [tipoMovimiento, setTipoMovimiento] = useState("efectivo")
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined)
  const [proximaFecha, setProximaFecha] = useState<Date | undefined>(undefined)
  const [proximaFechaStr, setProximaFechaStr] = useState<string>("")
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | undefined>(undefined)
  
  // Estados de loading
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [deletingServicioId, setDeletingServicioId] = useState<number | null>(null)
  const [submittingServicio, setSubmittingServicio] = useState(false)
  // NUEVOS ESTADOS para funcionalidades de pago
  const [generandoPagoId, setGenerandoPagoId] = useState<number | null>(null)
  const [actualizandoEstados, setActualizandoEstados] = useState(false)

  // Formulario para servicios
  const [servicioNombre, setServicioNombre] = useState("")
  const [servicioDescripcion, setServicioDescripcion] = useState("")
  const [servicioMonto, setServicioMonto] = useState("")
  const [servicioMedioPago, setServicioMedioPago] = useState("Tarjeta de crédito")
  const [servicioTarjeta, setServicioTarjeta] = useState("")
  const [servicioFechaCobro, setServicioFechaCobro] = useState<Date | undefined>(undefined)
  const [servicioFechaCobroStr, setServicioFechaCobroStr] = useState<string>("")
  const [generaRecurrente, setGeneraRecurrente] = useState(true)

  // Dialog para editar gastos
  useEffect(() => {
    if (editingGasto) {
      setConcepto(editingGasto.concepto || "")
      setMonto(editingGasto.monto.toString())
      setPeriodicidad(editingGasto.periodicidad || "")
      setComentario(editingGasto.comentario || "")
      setEstado(editingGasto.estado || "")
      setTipoMovimiento(editingGasto.tipoMovimiento || "efectivo")
      setCategoriaSeleccionada(editingGasto.categoriaId?.toString() || "")
      
      if (editingGasto.proximaFecha) {
        const fecha = new Date(editingGasto.proximaFecha)
        setProximaFecha(fecha)
        setProximaFechaStr(formatDateToDDMMYYYY(fecha))
      } else {
        setProximaFecha(undefined)
        setProximaFechaStr("")
      }
    } else {
      resetForm()
    }
  }, [editingGasto])

  // Resetear formulario de servicio
  const resetServicioForm = () => {
    setServicioNombre("")
    setServicioDescripcion("")
    setServicioMonto("")
    setServicioMedioPago("Tarjeta de crédito")
    setServicioTarjeta("")
    setServicioFechaCobro(undefined)
    setServicioFechaCobroStr("")
    setServicioActual(null)
    setGeneraRecurrente(true)
  }

  // Cargar datos en el formulario cuando se edita un servicio
  useEffect(() => {
    if (servicioActual) {
      setServicioNombre(servicioActual.nombre || "")
      setServicioDescripcion(servicioActual.descripcion || "")
      setServicioMonto(servicioActual.monto.toString())
      setServicioMedioPago(servicioActual.medioPago || "Tarjeta de crédito")
      setServicioTarjeta(servicioActual.tarjeta || "")
      
      if (servicioActual.fechaCobro) {
        const fecha = new Date(servicioActual.fechaCobro)
        setServicioFechaCobro(fecha)
        setServicioFechaCobroStr(formatDateToDDMMYYYY(fecha))
      } else {
        setServicioFechaCobro(undefined)
        setServicioFechaCobroStr("")
      }
    }
  }, [servicioActual])

  // Manejar envío del formulario de servicio
  const handleServicioSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!servicioNombre || !servicioMonto || !servicioMedioPago) {
      toast.error("Por favor completa los campos obligatorios")
      return
    }
    
    setSubmittingServicio(true)
    try {
      const parsedDate = parseDDMMYYYY(servicioFechaCobroStr)
      if (servicioFechaCobroStr && !parsedDate) {
        toast.error("Formato de Fecha de Cobro inválido. Usar DD/MM/YYYY")
        setSubmittingServicio(false)
        return
      }
      const nuevoServicio = {
        nombre: servicioNombre,
        descripcion: servicioDescripcion,
        monto: parseFloat(servicioMonto),
        medioPago: servicioMedioPago,
        tarjeta: servicioTarjeta,
        fechaCobro: parsedDate,
        generaRecurrente: generaRecurrente
      }
      
      let exito = false
      
      if (servicioActual) {
        // Editar servicio existente
        exito = await editarServicio(servicioActual.id, nuevoServicio)
      } else {
        // Crear nuevo servicio
        exito = await agregarServicio(nuevoServicio)
      }
      
      if (exito) {
        resetServicioForm()
        setIsServicioFormOpen(false)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al procesar el servicio')
    } finally {
      setSubmittingServicio(false)
    }
  }

  // Calcular el total de gastos recurrentes del mes actual
  useEffect(() => {
    if (gastosRecurrentes.length > 0) {
      const fechaActual = new Date();
      const mesActual = fechaActual.getMonth();
      const anioActual = fechaActual.getFullYear();
      
      const gastosMesActual = gastosRecurrentes.filter(gasto => {
        if (!gasto.proximaFecha) return false;
        const fechaProx = new Date(gasto.proximaFecha);
        return fechaProx.getMonth() === mesActual && fechaProx.getFullYear() === anioActual;
      });
      
      const suma = gastosMesActual.reduce((total, gasto) => total + gasto.monto, 0);
      setTotalMesActual(suma);
    }
  }, [gastosRecurrentes]);

  // Cargar datos iniciales
  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Obtener categorías
      const respCategorias = await fetch('/api/categorias')
      if (respCategorias.ok) {
        const datos = await respCategorias.json()
        setCategorias(datos)
      }
      
      // Obtener gastos recurrentes
      const respGastos = await fetch('/api/recurrentes')
      if (respGastos.ok) {
        const datos = await respGastos.json()
        setGastosRecurrentes(datos)
      }
      
      // Obtener servicios
      await fetchServicios()
    } catch (error) {
      console.error('Error al cargar datos:', error)
      toast.error('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  // Función para obtener el equivalente mensual de un servicio
  const getEquivalenteMensual = (servicio: Servicio): number => {
    const medioPago = servicio.medioPago.toLowerCase()
    if (medioPago.includes("anual")) {
      return servicio.monto / 12
    } else if (medioPago.includes("trimestral")) {
      return servicio.monto / 3
    } else if (medioPago.includes("semestral")) {
      return servicio.monto / 6
    } else if (medioPago.includes("bimestral")) {
      return servicio.monto / 2
    }
    return servicio.monto // Mensual por defecto
  }

  // Función para obtener la periodicidad de un servicio
  const getPeriodicidadServicio = (medioPago: string): string => {
    const medioLower = medioPago.toLowerCase()
    if (medioLower.includes("anual")) return "anual"
    if (medioLower.includes("trimestral")) return "trimestral"
    if (medioLower.includes("semestral")) return "semestral"
    if (medioLower.includes("bimestral")) return "bimestral"
    return "mensual"
  }

  // Calcular total mensual equivalente de servicios
  const totalServiciosMensual = servicios.reduce((acc, servicio) => acc + getEquivalenteMensual(servicio), 0)

  // Función para obtener servicios
  const fetchServicios = async () => {
    try {
      const response = await fetch('/api/servicios')
      if (response.ok) {
        const datos = await response.json()
        setServicios(datos)
        
        // Calcular total usando equivalentes mensuales
        const total = datos.reduce((acc: number, servicio: Servicio) => acc + getEquivalenteMensual(servicio), 0)
        setTotalServicios(total)
      }
    } catch (error) {
      console.error('Error al cargar servicios:', error)
      // Usar datos de prueba si hay error (API aún no implementada)
      const datosPrueba: Servicio[] = [
        { id: 1, nombre: 'Netflix', monto: 3490, medioPago: 'Tarjeta de crédito', tarjeta: 'Visa', fechaCobro: new Date(2024, 2, 15) },
        { id: 2, nombre: 'Amazon Prime', monto: 1390, medioPago: 'Tarjeta de crédito', tarjeta: 'Mastercard', fechaCobro: new Date(2024, 2, 10) },
        { id: 3, nombre: 'Disney+', monto: 2900, medioPago: 'Débito automático', fechaCobro: new Date(2024, 2, 5) },
        { id: 4, nombre: 'ChatGPT', monto: 8000, medioPago: 'Tarjeta de crédito', tarjeta: 'Visa', fechaCobro: new Date(2024, 2, 20) },
        { id: 5, nombre: 'Spotify', monto: 1590, medioPago: 'Débito automático', fechaCobro: new Date(2024, 2, 28) }
      ]
      setServicios(datosPrueba)
      const total = datosPrueba.reduce((acc, servicio) => acc + getEquivalenteMensual(servicio), 0)
      setTotalServicios(total)
    }
  }

  // Agregar un nuevo servicio
  const agregarServicio = async (servicio: Omit<Servicio, 'id'>) => {
    try {
      const response = await fetch('/api/servicios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(servicio),
      })
      
      if (response.ok) {
        const nuevoServicio = await response.json()
        const serviciosActualizados = [...servicios, nuevoServicio]
        setServicios(serviciosActualizados)
        
        // Calcular total usando equivalentes mensuales
        const nuevoTotal = serviciosActualizados.reduce((acc, s) => acc + getEquivalenteMensual(s), 0)
        setTotalServicios(nuevoTotal)
        toast.success('Servicio agregado con éxito')
        return true
      } else {
        throw new Error('Error al agregar servicio')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al agregar el servicio')
      
      // Simular adición mientras no exista la API
      const nuevoServicio: Servicio = {
        id: Date.now(),
        ...servicio
      }
      const serviciosActualizados = [...servicios, nuevoServicio]
      setServicios(serviciosActualizados)
      
      // Calcular total usando equivalentes mensuales
      const nuevoTotal = serviciosActualizados.reduce((acc, s) => acc + getEquivalenteMensual(s), 0)
      setTotalServicios(nuevoTotal)
      
      toast.success('Servicio agregado con éxito (simulado)')
      return true
    }
  }

  // Editar un servicio existente
  const editarServicio = async (id: number, servicioActualizado: Partial<Servicio>) => {
    try {
      const response = await fetch(`/api/servicios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(servicioActualizado),
      })
      
      if (response.ok) {
        const datosActualizados = await response.json()
        const serviciosActualizados = servicios.map(s => s.id === id ? datosActualizados : s)
        setServicios(serviciosActualizados)
        
        // Recalcular total usando equivalentes mensuales
        const nuevoTotal = serviciosActualizados.reduce((acc, s) => acc + getEquivalenteMensual(s), 0)
        setTotalServicios(nuevoTotal)
        
        toast.success('Servicio actualizado con éxito')
        return true
      } else {
        throw new Error('Error al actualizar servicio')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar el servicio')
      
      // Simular actualización mientras no exista la API
      const serviciosActualizados = servicios.map(s => {
        if (s.id === id) {
          const updated = { ...s, ...servicioActualizado }
          return updated
        }
        return s
      })
      
      setServicios(serviciosActualizados)
      
      // Recalcular total usando equivalentes mensuales
      const nuevoTotal = serviciosActualizados.reduce((acc, s) => acc + getEquivalenteMensual(s), 0)
      setTotalServicios(nuevoTotal)
      
      toast.success('Servicio actualizado con éxito (simulado)')
      return true
    }
  }

  // Eliminar un servicio
  const eliminarServicio = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este servicio?')) {
      return
    }
    
    setDeletingServicioId(id)
    try {
      const response = await fetch(`/api/servicios/${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        const servicioEliminado = servicios.find(s => s.id === id)
        const serviciosRestantes = servicios.filter(s => s.id !== id)
        
        // Recalcular total usando equivalentes mensuales
        const nuevoTotal = serviciosRestantes.reduce((acc, s) => acc + getEquivalenteMensual(s), 0)
        setTotalServicios(nuevoTotal)
        
        setServicios(serviciosRestantes)
        toast.success('Servicio eliminado con éxito')
      } else {
        throw new Error('Error al eliminar servicio')
      }
    } catch (error) {
      console.error('Error:', error)
      
      // Simular eliminación mientras no exista la API
      const servicioEliminado = servicios.find(s => s.id === id)
      const serviciosRestantes = servicios.filter(s => s.id !== id)
      
      // Recalcular total usando equivalentes mensuales
      const nuevoTotal = serviciosRestantes.reduce((acc, s) => acc + getEquivalenteMensual(s), 0)
      setTotalServicios(nuevoTotal)
      
      setServicios(serviciosRestantes)
      toast.success('Servicio eliminado con éxito (simulado)')
    } finally {
      setDeletingServicioId(null)
    }
  }

  // NUEVA FUNCIÓN: Generar pago desde gasto recurrente
  const generarPago = async (recurrenteId: number) => {
    if (!confirm('¿Generar pago para este gasto recurrente? Esto creará un gasto real en tu lista de transacciones.')) {
      return
    }
    
    setGenerandoPagoId(recurrenteId)
    try {
      const response = await fetch(`/api/recurrentes/${recurrenteId}/generar-pago`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        const resultado = await response.json()
        toast.success('¡Pago generado exitosamente!')
        
        // Actualizar la lista de gastos recurrentes
        await fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al generar el pago')
      }
    } catch (error) {
      console.error('Error al generar pago:', error)
      toast.error('Error al generar el pago')
    } finally {
      setGenerandoPagoId(null)
    }
  }

  // NUEVA FUNCIÓN: Actualizar estados automáticos
  const actualizarEstadosAutomaticos = async () => {
    setActualizandoEstados(true)
    try {
      const response = await fetch('/api/recurrentes/estado-automatico', {
        method: 'GET'
      })
      
      if (response.ok) {
        const resultado = await response.json()
        toast.success(`Estados actualizados: ${resultado.stats.actualizados} cambios realizados`)
        
        // Actualizar la lista de gastos recurrentes
        await fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al actualizar estados')
      }
    } catch (error) {
      console.error('Error al actualizar estados:', error)
      toast.error('Error al actualizar estados automáticos')
    } finally {
      setActualizandoEstados(false)
    }
  }

  // NUEVA FUNCIÓN: Calcular estado visual basado en datos locales
  const calcularEstadoVisual = (gasto: GastoRecurrente): string => {
    const ahora = new Date()
    const proximaFecha = gasto.proximaFecha ? new Date(gasto.proximaFecha) : null
    
    // Si tiene gastos generados, calcular total pagado
    if (gasto.gastosGenerados && gasto.gastosGenerados.length > 0) {
      const totalPagado = gasto.gastosGenerados.reduce((sum, pago) => sum + pago.monto, 0)
      const porcentajePagado = (totalPagado / gasto.monto) * 100
      
      // Si está completamente pagado
      if (porcentajePagado >= 100) {
        return 'pagado'
      }
      
      // Si tiene pagos parciales
      if (porcentajePagado > 0) {
        return 'pago_parcial'
      }
    }
    
    // Si no hay fecha próxima
    if (!proximaFecha) {
      return gasto.estado
    }
    
    // Si ya pasó la fecha y no hay pago
    if (ahora > proximaFecha) {
      return 'pendiente'
    }
    
    // Si está próximo (próximos 7 días)
    const diferenciaDias = Math.ceil((proximaFecha.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))
    if (diferenciaDias <= 7 && diferenciaDias > 0) {
      return 'proximo'
    }
    
    // Si está programado para el futuro
    return 'programado'
  }

  // Efecto para redireccionar si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      fetchData()
    }
  }, [status, router])

  // Resetear formulario
  const resetForm = () => {
    setConcepto("")
    setPeriodicidad("mensual")
    setMonto("")
    setComentario("")
    setEstado("pendiente")
    setTipoMovimiento("efectivo")
    setCategoriaId(undefined)
    setCategoriaSeleccionada(undefined)
    setProximaFecha(undefined)
    setProximaFechaStr("")
    setEditingGasto(null)
  }

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!concepto || !periodicidad || !monto) {
      toast.error('Por favor completa los campos obligatorios')
      return
    }
    
    setSubmitting(true)
    try {
      const parsedDate = parseDDMMYYYY(proximaFechaStr)
      if (proximaFechaStr && !parsedDate) {
        toast.error("Formato de Próxima Fecha inválido. Usar DD/MM/YYYY")
        setSubmitting(false)
        return
      }
      const gastoData = {
        concepto,
        periodicidad,
        monto: parseFloat(monto),
        comentario,
        estado,
        tipoMovimiento,
        categoriaId,
        proximaFecha: parsedDate
      }
      
      let response
      
      if (editingGasto) {
        // Actualizar gasto existente
        response = await fetch(`/api/recurrentes/${editingGasto.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(gastoData)
        })
      } else {
        // Crear nuevo gasto
        response = await fetch('/api/recurrentes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(gastoData)
        })
      }
      
      if (!response.ok) {
        throw new Error('Error al procesar la solicitud')
      }
      
      toast.success(editingGasto ? 'Gasto actualizado correctamente' : 'Gasto creado correctamente')
      fetchData()
      resetForm()
      setIsFormOpen(false)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al guardar el gasto recurrente')
    } finally {
      setSubmitting(false)
    }
  }

  // Eliminar gasto
  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este gasto recurrente?')) {
      return
    }
    
    setDeletingId(id)
    try {
      const response = await fetch(`/api/recurrentes/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Error al eliminar')
      }
      
      toast.success('Gasto eliminado correctamente')
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al eliminar el gasto')
    } finally {
      setDeletingId(null)
    }
  }

  // Editar gasto
  const handleEdit = (gasto: GastoRecurrente) => {
    setEditingGasto(gasto)
    setIsFormOpen(true)
  }

  // Si está cargando, mostrar pantalla de carga
  if (status === "loading" || loading) {
    return <LoadingScreen />
  }

  // Si no está autenticado, no mostrar nada (la redirección se maneja en el efecto)
  if (status === "unauthenticated") {
    return null
  }

  // Función para formatear fechas
  const formatFecha = (fecha?: Date) => {
    if (!fecha) return "No definida"
    return formatDateToDDMMYYYY(new Date(fecha))
  }

  // Formatear tipo de movimiento
  const formatTipoMovimiento = (tipo?: string) => {
    if (!tipo) return "Efectivo"
    switch (tipo) {
      case 'efectivo': return 'Efectivo'
      case 'digital': return 'Digital'
      case 'tarjeta': return 'Tarjeta'
      case 'debito_automatico': return 'Débito Automático'
      case 'ahorro': return 'Ahorro/Inversión'
      default: return tipo
    }
  }

  // Obtener estado con estilo
  const getEstadoClase = (estado: string) => {
    switch (estado) {
      case 'pagado': return 'text-green-600 dark:text-green-400 font-medium'
      case 'parcial': return 'text-yellow-600 dark:text-yellow-400 font-medium'
      case 'pendiente': return 'text-red-600 dark:text-red-400 font-medium'
      case 'proximo': return 'text-orange-600 dark:text-orange-400 font-medium'
      case 'programado': return 'text-blue-600 dark:text-blue-400 font-medium'
      case 'n/a': return 'text-gray-500 dark:text-gray-400'
      default: return ''
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gastos Recurrentes</h1>
          <div className="flex gap-4">
            <Button 
              variant="secondary" 
              onClick={actualizarEstadosAutomaticos}
              disabled={actualizandoEstados}
            >
              {actualizandoEstados ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <Repeat className="mr-2 h-4 w-4" />
                  Actualizar Estados
                </>
              )}
            </Button>
            <Button variant="default" onClick={() => { resetForm(); setIsFormOpen(true); }}>
              Nuevo Gasto Recurrente
            </Button>
            <Button variant="outline" onClick={() => { setServicioActual(null); setIsServicioFormOpen(true); }}>
              Nuevo Servicio
            </Button>
            <Button variant="outline" onClick={() => router.push("/?dashboard=true")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Button>
          </div>
        </div>

        {/* Total de gastos del mes actual y Servicios Contratados */}
        <Card className="w-full bg-white dark:bg-gray-800 shadow-lg mb-6">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">
              {/* Columna izquierda: Total gastos recurrentes y Análisis Financiero */}
              <div className="md:col-span-5 flex flex-col">
                {/* Total de gastos recurrentes */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Total gastos recurrentes</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="text-3xl font-bold text-primary">
                      {valuesVisible ? formatMoney(totalMesActual) : "***"}
                    </div>
                  </div>
                </div>
                
                {/* Análisis Financiero Personalizado */}
                <div className="p-4 flex-grow">
                  <FinancialSummary className="shadow-sm h-full" context="recurrentes" />
                </div>
              </div>
              
              {/* Columna derecha: Servicios contratados */}
              <div className="md:col-span-7 p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Servicios contratados</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Equivalente mensual</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">
                      {valuesVisible ? formatMoney(totalServiciosMensual) : "***"}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {servicios.length} servicio{servicios.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4">
                  {servicios.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-gray-500 dark:text-gray-400">No hay servicios registrados</p>
                    </div>
                  ) : (
                    <div>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Servicio</TableHead>
                              <TableHead>Monto Real</TableHead>
                              <TableHead>Equiv. Mensual</TableHead>
                              <TableHead>Periodicidad</TableHead>
                              <TableHead>Fecha de Cobro</TableHead>
                              <TableHead className="w-[100px]">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(mostrarTodosServicios ? servicios : servicios.slice(0, 3)).map((servicio) => {
                              const periodicidad = getPeriodicidadServicio(servicio.medioPago)
                              const equivalenteMensual = getEquivalenteMensual(servicio)
                              
                              return (
                                <TableRow key={servicio.id}>
                                  <TableCell className="font-medium">
                                    {servicio.nombre}
                                    {servicio.tarjeta && (
                                      <span className="text-xs text-gray-500 block">
                                        {servicio.tarjeta}
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-right">
                                      <div className="font-medium">{valuesVisible ? formatMoney(servicio.monto) : "***"}</div>
                                      <div className="text-xs text-gray-500 capitalize">
                                        {periodicidad}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-right">
                                      <div className="font-medium text-blue-600">
                                        {valuesVisible ? formatMoney(equivalenteMensual) : "***"}
                                      </div>
                                      {valuesVisible && periodicidad !== 'mensual' && (
                                        <div className="text-xs text-gray-500">
                                          ÷ {periodicidad === 'anual' ? '12' : periodicidad === 'trimestral' ? '3' : periodicidad === 'semestral' ? '6' : '2'}
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                      periodicidad === 'anual' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                      periodicidad === 'trimestral' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                      periodicidad === 'semestral' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                      periodicidad === 'bimestral' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                    }`}>
                                      {periodicidad}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {servicio.fechaCobro ? formatDateToDDMMYYYY(new Date(servicio.fechaCobro)) : 'No especificada'}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => {
                                          setServicioActual(servicio)
                                          setIsServicioFormOpen(true)
                                        }}
                                        disabled={deletingServicioId === servicio.id || submittingServicio}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => eliminarServicio(servicio.id)}
                                        disabled={deletingServicioId === servicio.id || submittingServicio}
                                      >
                                        {deletingServicioId === servicio.id ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                      
                      {servicios.length > 3 && (
                        <div className="flex justify-center mt-3">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setMostrarTodosServicios(!mostrarTodosServicios)}
                          >
                            {mostrarTodosServicios ? "Ver menos" : `Ver todos (${servicios.length})`}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Filtros de búsqueda */}
        <Card className="w-full bg-white dark:bg-gray-800 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filtros de búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filtro-concepto">Concepto</Label>
                <Input
                  id="filtro-concepto"
                  placeholder="Buscar por concepto"
                  value={filtroConcepto}
                  onChange={(e) => setFiltroConcepto(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filtro-categoria">Categoría</Label>
                <Select value={filtroCategoria?.toString()} onValueChange={(value) => setFiltroCategoria(value !== "all" ? parseInt(value) : undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id.toString()}>
                        {categoria.descripcion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filtro-estado">Estado</Label>
                <Select value={filtroEstado || "all"} onValueChange={(value) => setFiltroEstado(value !== "all" ? value : undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="pagado">Pagado</SelectItem>
                    <SelectItem value="parcial">Parcial</SelectItem>
                    <SelectItem value="n/a">N/A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulario en diálogo */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingGasto ? "Editar Gasto Recurrente" : "Nuevo Gasto Recurrente"}</DialogTitle>
              <DialogDescription>
                {editingGasto ? "Modifica los datos del gasto recurrente" : "Completa la información para registrar un nuevo gasto recurrente"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="concepto">Concepto *</Label>
                  <Input 
                    id="concepto" 
                    value={concepto} 
                    onChange={(e) => setConcepto(e.target.value)} 
                    placeholder="Nombre del gasto" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="periodicidad">Periodicidad *</Label>
                  <Select value={periodicidad} onValueChange={setPeriodicidad} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar periodicidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensual">Mensual</SelectItem>
                      <SelectItem value="bimestral">Bimestral</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="semestral">Semestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monto">Monto *</Label>
                  <div className="relative">
                    <Input
                      id="monto"
                      type="text"
                      value={monto}
                      onChange={(e) => {
                        // Solo permitir números y un punto decimal
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        // Evitar múltiples puntos decimales
                        const parts = value.split('.');
                        if (parts.length > 2) {
                          return;
                        }
                        setMonto(value);
                      }}
                      placeholder="0.00"
                      required
                      className="pl-8"
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    {monto && valuesVisible && (
                      <div className="mt-1 text-sm text-gray-500">
                        {formatMoney(parseFloat(monto) || 0)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoría</Label>
                  <Select 
                    value={categoriaSeleccionada} 
                    onValueChange={(val) => setCategoriaSeleccionada(val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.descripcion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select value={estado} onValueChange={setEstado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="parcial">Pago Parcial</SelectItem>
                      <SelectItem value="pagado">Pagado</SelectItem>
                      <SelectItem value="n/a">No Aplica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipoMovimiento">Tipo de Movimiento *</Label>
                  <Select value={tipoMovimiento} onValueChange={setTipoMovimiento} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="digital">Digital/Transferencia</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="debito_automatico">Débito Automático</SelectItem>
                      <SelectItem value="ahorro">Ahorro/Inversión</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="proximaFecha">Próxima Fecha (DD/MM/YYYY)</Label>
                  <Input
                    type="text"
                    id="proximaFecha"
                    value={proximaFechaStr}
                    onChange={(e) => setProximaFechaStr(e.target.value)}
                    placeholder="DD/MM/YYYY"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comentario">Comentario</Label>
                  <Input 
                    id="comentario" 
                    value={comentario} 
                    onChange={(e) => setComentario(e.target.value)} 
                    placeholder="Comentario opcional" 
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => { resetForm(); setIsFormOpen(false); }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingGasto ? 'Actualizando...' : 'Guardando...'}
                    </>
                  ) : (
                    editingGasto ? 'Actualizar' : 'Guardar'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Diálogo para crear/editar servicios */}
        <Dialog open={isServicioFormOpen} onOpenChange={setIsServicioFormOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{servicioActual ? "Editar Servicio" : "Nuevo Servicio"}</DialogTitle>
              <DialogDescription>
                {servicioActual ? "Modifica los datos del servicio contratado" : "Registra un nuevo servicio contratado"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleServicioSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre del servicio *</Label>
                <Input
                  id="nombre"
                  value={servicioNombre}
                  onChange={(e) => setServicioNombre(e.target.value)}
                  placeholder="Ej. Netflix, Spotify, Disney+"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Input
                  id="descripcion"
                  value={servicioDescripcion}
                  onChange={(e) => setServicioDescripcion(e.target.value)}
                  placeholder="Descripción opcional del servicio"
                />
              </div>
              
              <div>
                <Label htmlFor="monto">Monto *</Label>
                <div className="relative">
                  <Input
                    id="monto"
                    type="text"
                    value={servicioMonto}
                    onChange={(e) => {
                      // Solo permitir números y un punto decimal
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      // Evitar múltiples puntos decimales
                      const parts = value.split('.');
                      if (parts.length > 2) {
                        return;
                      }
                      setServicioMonto(value);
                    }}
                    placeholder={servicioMedioPago.toLowerCase().includes("anual") ? "Importe anual" : servicioMedioPago.toLowerCase().includes("trimestral") ? "Importe trimestral" : "Importe mensual"}
                    required
                    className="pl-8"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  {servicioMonto && valuesVisible && (
                    <div className="mt-1 text-sm text-gray-500">
                      {formatMoney(parseFloat(servicioMonto) || 0)}
                      {servicioMedioPago.toLowerCase().includes("anual") && (
                        <span className="text-blue-600 ml-2">
                          ({formatMoney((parseFloat(servicioMonto) || 0) / 12)} mensual)
                        </span>
                      )}
                      {servicioMedioPago.toLowerCase().includes("trimestral") && (
                        <span className="text-blue-600 ml-2">
                          ({formatMoney((parseFloat(servicioMonto) || 0) / 3)} mensual)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="medioPago">Medio de Pago / Frecuencia *</Label>
                <Select
                  value={servicioMedioPago}
                  onValueChange={(value) => {
                    setServicioMedioPago(value)
                    // Si no es tarjeta, limpiar el campo de tarjeta
                    if (!value.toLowerCase().includes("tarjeta")) {
                      setServicioTarjeta("")
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un medio de pago y frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Opciones Mensuales */}
                    <SelectItem value="Tarjeta de crédito">Tarjeta de crédito (mensual)</SelectItem>
                    <SelectItem value="Tarjeta de débito">Tarjeta de débito (mensual)</SelectItem>
                    <SelectItem value="Débito automático">Débito automático (mensual)</SelectItem>
                    <SelectItem value="Transferencia bancaria">Transferencia bancaria (mensual)</SelectItem>
                    <SelectItem value="Efectivo">Efectivo (mensual)</SelectItem>
                    
                    {/* Opciones Trimestrales */}
                    <SelectItem value="Tarjeta de crédito trimestral">Tarjeta de crédito (trimestral)</SelectItem>
                    <SelectItem value="Tarjeta de débito trimestral">Tarjeta de débito (trimestral)</SelectItem>
                    <SelectItem value="Débito automático trimestral">Débito automático (trimestral)</SelectItem>
                    <SelectItem value="Transferencia bancaria trimestral">Transferencia bancaria (trimestral)</SelectItem>
                    <SelectItem value="Efectivo trimestral">Efectivo (trimestral)</SelectItem>
                    
                    {/* Opciones Anuales */}
                    <SelectItem value="Tarjeta de crédito anual">Tarjeta de crédito (anual)</SelectItem>
                    <SelectItem value="Tarjeta de débito anual">Tarjeta de débito (anual)</SelectItem>
                    <SelectItem value="Débito automático anual">Débito automático (anual)</SelectItem>
                    <SelectItem value="Transferencia bancaria anual">Transferencia bancaria (anual)</SelectItem>
                    <SelectItem value="Efectivo anual">Efectivo (anual)</SelectItem>
                    
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {servicioMedioPago.toLowerCase().includes("tarjeta") && (
                <div>
                  <Label htmlFor="tarjeta">Tarjeta</Label>
                  <Select
                    value={servicioTarjeta}
                    onValueChange={setServicioTarjeta}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una tarjeta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Visa">Visa</SelectItem>
                      <SelectItem value="Mastercard">Mastercard</SelectItem>
                      <SelectItem value="American Express">American Express</SelectItem>
                      <SelectItem value="Otra">Otra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div>
                <Label htmlFor="fechaCobro">Fecha de Cobro (DD/MM/YYYY)</Label>
                <Input
                  type="text"
                  id="fechaCobro"
                  value={servicioFechaCobroStr}
                  onChange={(e) => setServicioFechaCobroStr(e.target.value)}
                  placeholder="DD/MM/YYYY"
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsServicioFormOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submittingServicio}>
                  {submittingServicio ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {servicioActual ? "Guardando..." : "Creando..."}
                    </>
                  ) : (
                    servicioActual ? "Guardar Cambios" : "Crear Servicio"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Tabla de gastos recurrentes */}
        <Card className="w-full bg-white dark:bg-gray-800 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="w-5 h-5" />
              <span>Gastos Recurrentes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gastosRecurrentes.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No tienes gastos recurrentes registrados.
                </p>
                <Button onClick={() => { resetForm(); setIsFormOpen(true); }}>
                  Agregar tu primer gasto recurrente
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableCaption>Listado de tus gastos recurrentes</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Periodicidad</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Tipo Movimiento</TableHead>
                      <TableHead>Pagos</TableHead>
                      <TableHead>Próximo Pago</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(mostrarTodosGastos ? gastosRecurrentes : gastosRecurrentes.slice(0, 3))
                      .filter(gasto => {
                        // Filtrar por concepto (case insensitive)
                        const conceptoMatch = !filtroConcepto || 
                          gasto.concepto.toLowerCase().includes(filtroConcepto.toLowerCase())
                        
                        // Filtrar por categoría
                        const categoriaMatch = !filtroCategoria || 
                          gasto.categoriaId === filtroCategoria
                        
                        // Filtrar por estado
                        const estadoMatch = !filtroEstado || 
                          gasto.estado === filtroEstado
                        
                        return conceptoMatch && categoriaMatch && estadoMatch
                      })
                      .map((gasto) => {
                        const estadoVisual = calcularEstadoVisual(gasto)
                        const puedeGenerarPago = estadoVisual === 'pendiente' || estadoVisual === 'proximo' || estadoVisual === 'programado' || estadoVisual === 'pago_parcial'
                        
                        return (
                          <TableRow key={gasto.id}>
                            <TableCell className="font-medium">
                              {gasto.concepto}
                              {gasto.gastosGenerados && gasto.gastosGenerados.length > 0 && (
                                <div className="text-xs text-gray-500">
                                  {gasto.gastosGenerados.length} pago{gasto.gastosGenerados.length !== 1 ? 's' : ''} generado{gasto.gastosGenerados.length !== 1 ? 's' : ''}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{gasto.periodicidad}</TableCell>
                            <TableCell>
                              {valuesVisible ? formatMoney(gasto.monto) : "***"}
                            </TableCell>
                            <TableCell>{formatTipoMovimiento(gasto.tipoMovimiento)}</TableCell>
                            <TableCell>
                              {gasto.gastosGenerados && gasto.gastosGenerados.length > 0 ? (
                                (() => {
                                  const totalPagado = gasto.gastosGenerados.reduce((sum, pago) => sum + pago.monto, 0)
                                  const saldoPendiente = gasto.monto - totalPagado
                                  const porcentajePagado = (totalPagado / gasto.monto) * 100
                                  
                                  return (
                                    <div className="space-y-1">
                                      <div className="text-sm font-medium">
                                        {valuesVisible ? `${formatMoney(totalPagado)} / ${formatMoney(gasto.monto)}` : "*** / ***"}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {gasto.gastosGenerados.length} pago{gasto.gastosGenerados.length !== 1 ? 's' : ''}
                                      </div>
                                      {valuesVisible && porcentajePagado > 0 && porcentajePagado < 100 && (
                                        <div className="text-xs text-amber-600 font-medium">
                                          {porcentajePagado.toFixed(1)}% pagado
                                        </div>
                                      )}
                                      {valuesVisible && saldoPendiente > 0 && (
                                        <div className="text-xs text-red-600">
                                          Resta: {formatMoney(saldoPendiente)}
                                        </div>
                                      )}
                                      {!valuesVisible && (
                                        <div className="text-xs text-gray-400">
                                          (Valores ocultos)
                                        </div>
                                      )}
                                    </div>
                                  )
                                })()
                              ) : (
                                <div className="text-xs text-gray-400">
                                  Sin pagos
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{formatFecha(gasto.proximaFecha)}</TableCell>
                            <TableCell>{gasto.categoria?.descripcion || "Sin categoría"}</TableCell>
                            <TableCell>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                estadoVisual === 'pagado' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                estadoVisual === 'pago_parcial' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' :
                                estadoVisual === 'pendiente' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                estadoVisual === 'proximo' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                estadoVisual === 'programado' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                              }`}>
                                {estadoVisual === 'proximo' ? 'Próximo' :
                                 estadoVisual === 'programado' ? 'Programado' :
                                 estadoVisual === 'pagado' ? 'Pagado' :
                                 estadoVisual === 'pago_parcial' ? 'Pago Parcial' :
                                 estadoVisual === 'pendiente' ? 'Pendiente' :
                                 estadoVisual}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {puedeGenerarPago && (
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    onClick={() => generarPago(gasto.id)}
                                    disabled={generandoPagoId === gasto.id}
                                    className="text-xs"
                                  >
                                    {generandoPagoId === gasto.id ? (
                                      <>
                                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                        Generando...
                                      </>
                                    ) : (
                                      'Generar Pago'
                                    )}
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleEdit(gasto)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleDelete(gasto.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
                
                {gastosRecurrentes.length > 3 && (
                  <div className="flex justify-center mt-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setMostrarTodosGastos(!mostrarTodosGastos)}
                    >
                      {mostrarTodosGastos ? "Ver menos" : `Ver todos (${gastosRecurrentes.length})`}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 