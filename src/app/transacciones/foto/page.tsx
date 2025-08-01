"use client"

import { useState, useRef, ChangeEvent, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Camera, 
  Upload, 
  Loader2, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Plus, 
  Trash,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useCurrency } from "@/contexts/CurrencyContext"
import { format } from "date-fns"
import Image from "next/image"

// Interfaces para categorías y productos extraídos
interface Categoria {
  id: number
  descripcion: string
  grupo_categoria: string | null
  status: boolean
}

interface ProductoDetectado {
  descripcion: string
  cantidad: number
  precioUnitario?: number
  subtotal: number
}

export default function FotoTicketPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { formatMoney } = useCurrency()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [imagen, setImagen] = useState<string | null>(null)
  const [cargandoImagen, setCargandoImagen] = useState(false)
  const [procesandoTexto, setProcesandoTexto] = useState(false)
  const [esVistaPrevia, setEsVistaPrevia] = useState(true)
  
  const [procesado, setProcesado] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>("")
  const [concepto, setConcepto] = useState<string>("")
  const [fecha, setFecha] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [total, setTotal] = useState<number>(0)
  const [productos, setProductos] = useState<ProductoDetectado[]>([])
  const [enviando, setEnviando] = useState(false)

  // Estados para fecha de imputación contable
  const [mostrarFechaImputacion, setMostrarFechaImputacion] = useState(false)
  const [fechaImputacion, setFechaImputacion] = useState<string>("")
  const [fechaImputacionStr, setFechaImputacionStr] = useState<string>("")

  // Estados para información de validación OCR
  const [notaValidacion, setNotaValidacion] = useState<string>("")
  const [totalOriginalTicket, setTotalOriginalTicket] = useState<number | undefined>(undefined)
  const [totalCalculadoProductos, setTotalCalculadoProductos] = useState<number>(0)

  // Estados para agregar producto manualmente
  const [mostrarFormProducto, setMostrarFormProducto] = useState(false)
  const [nuevoProducto, setNuevoProducto] = useState<{
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

  // Estados para edición post-OCR
  const [mostrarEdicionOCR, setMostrarEdicionOCR] = useState(false)
  const [conceptoOriginalOCR, setConceptoOriginalOCR] = useState<string>("")
  const [categoriasSugeridas, setCategoriasSugeridas] = useState<Categoria[]>([])

  // Cargar categorías al iniciar
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const res = await fetch("/api/categorias/unificadas")
        if (res.ok) {
          const data = await res.json()
          const categoriasArray = data.categorias || []
          setCategorias(categoriasArray)
          // Seleccionar por defecto la categoría de Alimentación o la primera si no existe
          const alimentacion = categoriasArray.find((cat: Categoria) => 
            cat.descripcion.toLowerCase() === "alimentación" || 
            cat.descripcion.toLowerCase() === "alimentacion")
          
          if (alimentacion) {
            setCategoriaSeleccionada(alimentacion.id.toString())
          } else if (categoriasArray.length > 0) {
            setCategoriaSeleccionada(categoriasArray[0].id.toString())
          }
        }
      } catch (error) {
        console.error("Error al cargar categorías:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las categorías",
          variant: "destructive"
        })
      }
    }
    
    cargarCategorias()
  }, [toast])

  // Función para seleccionar una imagen
  const seleccionarImagen = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Función para manejar la carga de una imagen
  const handleImagenCargada = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    
    if (!files || files.length === 0) {
      return
    }
    
    setCargandoImagen(true)
    
    // Limpiar todo el estado previo
    setProcesado(false)
    setEsVistaPrevia(true)
    setConcepto("")
    setTotal(0)
    setProductos([])
    setCategoriaSeleccionada("")
    
    const file = files[0]
    
    // Verificar que el archivo sea una imagen
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Por favor, selecciona una imagen válida",
        variant: "destructive"
      })
      setCargandoImagen(false)
      return
    }
    
    // Verificar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen es demasiado grande. El tamaño máximo es 5MB",
        variant: "destructive"
      })
      setCargandoImagen(false)
      return
    }
    
    // Cargar la imagen
    const reader = new FileReader()
    
    reader.onload = (event) => {
      if (event.target?.result) {
        // No añadir timestamp a la cadena base64, ya que rompe el formato
        // Simplemente usar la imagen tal como viene
        setImagen(event.target.result.toString())
        setCargandoImagen(false)
        
        // Notificar al usuario que la imagen se cargó correctamente
        toast({
          title: "Imagen cargada",
          description: "La imagen se ha cargado correctamente. Haz clic en 'Procesar' para continuar.",
        })
      }
    }
    
    reader.onerror = () => {
      toast({
        title: "Error",
        description: "No se pudo cargar la imagen",
        variant: "destructive"
      })
      setCargandoImagen(false)
      
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
    
    reader.readAsDataURL(file)
  }

  // Función para procesar la imagen y extraer el texto
  const procesarImagen = async () => {
    if (!imagen) {
      toast({
        title: "Error",
        description: "Por favor, selecciona una imagen primero",
        variant: "destructive"
      })
      return
    }
    
    // Verificar que la imagen está en formato base64 válido
    if (!imagen.startsWith('data:image/')) {
      toast({
        title: "Error",
        description: "El formato de la imagen no es válido",
        variant: "destructive"
      })
      return
    }
    
    setProcesandoTexto(true)
    
    try {
      console.log("Enviando imagen para procesamiento OCR...");
      
      // Llamar a la API para procesar la imagen
      const response = await fetch("/api/ocr/ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          imagen,
          timestamp: new Date().getTime() // Añadir timestamp para evitar cacheo
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error del servidor:", errorText)
        throw new Error(`Error del servidor (${response.status}): ${errorText || "No hay detalles disponibles"}`)
      }
      
      const resultado = await response.json()
      console.log("Resultado OCR recibido:", resultado);
      
      // Verificar si estamos usando datos de ejemplo
      if (resultado.esDatoEjemplo) {
        toast({
          title: "¡Atención!",
          description: "Se están usando datos de ejemplo porque no se pudo procesar la imagen correctamente. Los datos mostrados NO corresponden a tu ticket real.",
          variant: "destructive",
          duration: 10000 // Mostrar por 10 segundos para que el usuario lo note
        });
      }
      
      // Mostrar información de validación si está disponible
      if (resultado.notaValidacion) {
        setNotaValidacion(resultado.notaValidacion)
        setTotalOriginalTicket(resultado.totalOriginalTicket)
        setTotalCalculadoProductos(resultado.totalCalculadoProductos || resultado.total)
        
        // Mostrar toast informativo sobre el cálculo
        if (resultado.notaValidacion.includes("recalculado")) {
          toast({
            title: "Total recalculado",
            description: "El total se calculó automáticamente sumando los productos detectados.",
            duration: 5000
          });
        } else if (resultado.notaValidacion.includes("calculado automáticamente")) {
          toast({
            title: "Total calculado",
            description: "El total se calculó automáticamente ya que no se detectó en el ticket.",
            duration: 5000
          });
        }
      }
      
      // Actualizar estado con los datos obtenidos
      setConcepto(resultado.nombreComercio || "Compra")
      setTotal(resultado.total || 0)
      
      // Guardar el concepto original para permitir edición
      setConceptoOriginalOCR(resultado.nombreComercio || "Compra")
      
      // Aplicar sugerencia automática de categoría
      if (resultado.nombreComercio) {
        aplicarSugerenciasCategoria(resultado.nombreComercio)
        setMostrarEdicionOCR(true) // Permitir edición después del OCR
      }
      
      // Verificar que los productos tengan el formato correcto
      if (Array.isArray(resultado.productos) && resultado.productos.length > 0) {
        console.log(`Se detectaron ${resultado.productos.length} productos`);
        setProductos(resultado.productos.map((p: any) => ({
          descripcion: p.descripcion || "Producto sin descripción",
          cantidad: p.cantidad || 1,
          precioUnitario: p.precioUnitario,
          subtotal: p.subtotal || 0
        })));
      } else {
        console.warn("No se detectaron productos en el ticket");
        setProductos([]);
        toast({
          title: "Información parcial",
          description: "No se detectaron productos individuales. Puedes agregarlos manualmente."
        });
      }
      
      // Si se detectó una fecha, usarla. De lo contrario, mantener la fecha actual
      if (resultado.fecha) {
        try {
          const fechaDetectada = new Date(resultado.fecha);
          if (!isNaN(fechaDetectada.getTime())) {
            setFecha(format(fechaDetectada, "yyyy-MM-dd"));
            console.log("Fecha detectada:", format(fechaDetectada, "yyyy-MM-dd"));
          }
        } catch (err) {
          console.warn("Error al procesar la fecha detectada:", err);
        }
      }
      
      setProcesado(true)
      setEsVistaPrevia(false)
      
      toast({
        title: "¡Éxito!",
        description: `Imagen procesada correctamente. Se detectaron ${resultado.productos?.length || 0} productos.`,
      })
    } catch (error) {
      console.error("Error al procesar imagen:", error)
      let mensaje = "No se pudo procesar la imagen. Intenta con otra imagen o ingresa los datos manualmente."
      
      if (error instanceof Error) {
        mensaje = error.message
      }
      
      toast({
        title: "Error al procesar",
        description: mensaje,
        variant: "destructive"
      })
      
      // Si hay un error, permitir al usuario cambiar a modo manual
      cambiarAModoManual()
    } finally {
      setProcesandoTexto(false)
    }
  }

  // Función para guardar la transacción
  const guardarTransaccion = async () => {
    if (!categoriaSeleccionada || !concepto || total <= 0) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      })
      return
    }
    
    setEnviando(true)
    
    try {
      // Preparar datos para enviar
      const datosTransaccion = {
        concepto,
        monto: total,
        fecha: new Date(fecha),
        categoriaId: parseInt(categoriaSeleccionada),
        categoria: categorias.find(c => c.id.toString() === categoriaSeleccionada)?.descripcion,
        tipoTransaccion: "expense",
        tipoMovimiento: "efectivo"
      } as any

      // Agregar fecha de imputación si está configurada
      if (mostrarFechaImputacion && fechaImputacion) {
        datosTransaccion.fechaImputacion = new Date(fechaImputacion)
      }

      // 1. Crear el gasto principal
      const respuestaGasto = await fetch("/api/gastos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(datosTransaccion)
      })
      
      if (!respuestaGasto.ok) {
        throw new Error("Error al crear el gasto")
      }
      
      const gastoCreado = await respuestaGasto.json()
      
      // 2. Crear los detalles del gasto
      if (productos.length > 0) {
        const respuestaDetalles = await fetch("/api/gastos/detalles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            gastoId: gastoCreado.id,
            productos
          })
        })
        
        if (!respuestaDetalles.ok) {
          console.error("Error al guardar los detalles")
          // No interrumpimos el flujo ya que el gasto principal se guardó correctamente
        }
      }

      let mensajeExito = "El gasto y sus detalles se guardaron correctamente"
      if (mostrarFechaImputacion && fechaImputacion) {
        mensajeExito += ` con fecha de imputación: ${convertirFechaParaMostrar(fechaImputacion)}`
      }
      
      toast({
        title: "¡Gasto registrado!",
        description: mensajeExito
      })
      
      // Redirigir al dashboard
      router.push('/?dashboard=true')
    } catch (error) {
      console.error("Error al guardar la transacción:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la transacción. Intenta de nuevo.",
        variant: "destructive"
      })
    } finally {
      setEnviando(false)
    }
  }

  // Función para volver a la vista previa
  const volverAVistaPrevia = () => {
    setEsVistaPrevia(true)
    setProcesado(false)
  }

  // Función para cambiar a modo manual
  const cambiarAModoManual = () => {
    setProcesado(true)
    setEsVistaPrevia(false)
    
    // Establecer valores predeterminados
    if (!concepto) setConcepto("Compra")
    
    toast({
      title: "Modo manual activado",
      description: "Ahora puedes ingresar los detalles manualmente",
    })
  }

  // Función para sugerir categoría basada en el nombre del comercio
  const sugerirCategoria = (nombreComercio: string): string => {
    const nombre = nombreComercio.toLowerCase()
    
    // Supermercados y alimentación
    if (nombre.includes('super') || nombre.includes('mercado') || nombre.includes('carrefour') || 
        nombre.includes('coto') || nombre.includes('dia') || nombre.includes('disco') || 
        nombre.includes('jumbo') || nombre.includes('vea') || nombre.includes('walmart') ||
        nombre.includes('almacen') || nombre.includes('despensa') || nombre.includes('panaderia') ||
        nombre.includes('carniceria') || nombre.includes('verduleria') || nombre.includes('farmacia')) {
      return "Alimentación"
    }
    
    // Transporte
    if (nombre.includes('ypf') || nombre.includes('shell') || nombre.includes('axion') || 
        nombre.includes('puma') || nombre.includes('estacion') || nombre.includes('combustible') ||
        nombre.includes('subte') || nombre.includes('colectivo') || nombre.includes('taxi') ||
        nombre.includes('uber') || nombre.includes('cabify') || nombre.includes('peaje')) {
      return "Transporte"
    }
    
    // Servicios
    if (nombre.includes('edenor') || nombre.includes('edesur') || nombre.includes('gas') ||
        nombre.includes('agua') || nombre.includes('telecom') || nombre.includes('fibertel') ||
        nombre.includes('personal') || nombre.includes('movistar') || nombre.includes('claro') ||
        nombre.includes('banco') || nombre.includes('cajero') || nombre.includes('atm')) {
      return "Servicios"
    }
    
    // Ocio
    if (nombre.includes('cine') || nombre.includes('teatro') || nombre.includes('restaurant') ||
        nombre.includes('bar') || nombre.includes('cafe') || nombre.includes('mcdonald') ||
        nombre.includes('burger') || nombre.includes('pizza') || nombre.includes('helado') ||
        nombre.includes('gym') || nombre.includes('gimnasio') || nombre.includes('club')) {
      return "Ocio"
    }
    
    // Ropa y calzado
    if (nombre.includes('ropa') || nombre.includes('calzado') || nombre.includes('zapateria') ||
        nombre.includes('nike') || nombre.includes('adidas') || nombre.includes('zara') ||
        nombre.includes('h&m') || nombre.includes('gap') || nombre.includes('uniqlo')) {
      return "Ropa y calzado"
    }
    
    // Por defecto, si no se puede categorizar
    return "Otros"
  }

  // Función para aplicar sugerencias de categoría
  const aplicarSugerenciasCategoria = (nombreComercio: string) => {
    const categoriaSugerida = sugerirCategoria(nombreComercio)
    
    // Buscar la categoría en la lista y seleccionarla automáticamente
    const categoriaEncontrada = categorias.find(cat => 
      cat.descripcion.toLowerCase() === categoriaSugerida.toLowerCase()
    )
    
    if (categoriaEncontrada) {
      setCategoriaSeleccionada(categoriaEncontrada.id.toString())
      console.log(`Categoría sugerida automáticamente: ${categoriaSugerida}`)
      
      // Mostrar las categorías sugeridas para que el usuario pueda cambiar si quiere
      setCategoriasSugeridas([
        categoriaEncontrada,
        ...categorias.filter(cat => cat.id !== categoriaEncontrada.id).slice(0, 3)
      ])
    } else {
      // Si no se encuentra la categoría exacta, mostrar opciones relacionadas
      setCategoriasSugeridas(categorias.slice(0, 4))
    }
  }

  // Función para calcular el subtotal al cambiar cantidad o precio unitario
  useEffect(() => {
    const cantidad = parseFloat(nuevoProducto.cantidad) || 0
    const precioUnitario = parseFloat(nuevoProducto.precioUnitario.replace(/[^\d.]/g, "")) || 0
    
    if (cantidad > 0 && precioUnitario > 0) {
      const subtotal = cantidad * precioUnitario
      setNuevoProducto({
        ...nuevoProducto,
        subtotal: subtotal.toFixed(2)
      })
    }
  }, [nuevoProducto.cantidad, nuevoProducto.precioUnitario])

  // Función para agregar un producto manualmente
  const agregarProducto = () => {
    if (!nuevoProducto.descripcion || !nuevoProducto.subtotal) {
      toast({
        title: "Error",
        description: "Por favor completa al menos la descripción y el subtotal",
        variant: "destructive"
      })
      return
    }
    
    const producto: ProductoDetectado = {
      descripcion: nuevoProducto.descripcion,
      cantidad: parseFloat(nuevoProducto.cantidad) || 1,
      precioUnitario: nuevoProducto.precioUnitario ? parseFloat(nuevoProducto.precioUnitario.replace(/[^\d.]/g, "")) : undefined,
      subtotal: parseFloat(nuevoProducto.subtotal.replace(/[^\d.]/g, "")) || 0
    }
    
    setProductos([...productos, producto])
    
    // Recalcular el total
    const nuevoTotal = productos.reduce((sum, prod) => sum + prod.subtotal, 0) + producto.subtotal
    setTotal(nuevoTotal)
    
    // Resetear formulario
    setNuevoProducto({
      descripcion: "",
      cantidad: "1",
      precioUnitario: "",
      subtotal: ""
    })
    
    setMostrarFormProducto(false)
    
    toast({
      title: "Producto agregado",
      description: "El producto se ha agregado a la lista"
    })
  }

  // Función para eliminar un producto
  const eliminarProducto = (index: number) => {
    const productoAEliminar = productos[index]
    const nuevosProductos = [...productos]
    nuevosProductos.splice(index, 1)
    
    setProductos(nuevosProductos)
    
    // Recalcular el total
    const nuevoTotal = total - productoAEliminar.subtotal
    setTotal(nuevoTotal > 0 ? nuevoTotal : 0)
    
    toast({
      title: "Producto eliminado",
      description: "El producto se ha eliminado de la lista"
    })
  }

  // Función para convertir fecha de DD/MM/YYYY a YYYY-MM-DD
  const convertirFechaParaInput = (fechaStr: string): string => {
    try {
      // Si ya está en formato YYYY-MM-DD, devolverla tal como está
      if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
        return fechaStr
      }
      
      // Si está en formato DD/MM/YYYY, convertirla
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaStr)) {
        const [dia, mes, año] = fechaStr.split('/')
        return `${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
      }
      
      // Si no coincide con ningún formato, devolver fecha actual
      return format(new Date(), "yyyy-MM-dd")
    } catch (error) {
      console.error("Error al convertir fecha:", error)
      return format(new Date(), "yyyy-MM-dd")
    }
  }

  // Función para convertir fecha de YYYY-MM-DD a DD/MM/YYYY para mostrar
  const convertirFechaParaMostrar = (fechaStr: string): string => {
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
        const [año, mes, dia] = fechaStr.split('-')
        return `${dia}/${mes}/${año}`
      }
      return fechaStr
    } catch (error) {
      console.error("Error al convertir fecha para mostrar:", error)
      return fechaStr
    }
  }

  // Manejar cambio en fecha de imputación (formato DD/MM/YYYY)
  const handleFechaImputacionChange = (valor: string) => {
    setFechaImputacionStr(valor)
    
    // Convertir a formato YYYY-MM-DD para el estado interno
    const fechaConvertida = convertirFechaParaInput(valor)
    setFechaImputacion(fechaConvertida)
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
            <h1 className="text-2xl font-bold">Capturar Ticket</h1>
          </div>
        </div>
      </header>
      
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{esVistaPrevia ? "Selecciona una imagen del ticket" : "Detalle del ticket"}</CardTitle>
            </CardHeader>
            <CardContent>
              {!imagen ? (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/50">
                  <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-center text-muted-foreground mb-4">
                    Haz clic para seleccionar o tomar una foto del ticket
                  </p>
                  <Button onClick={seleccionarImagen} disabled={cargandoImagen}>
                    {cargandoImagen ? "Cargando..." : "Seleccionar imagen"}
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImagenCargada}
                  />
                </div>
              ) : esVistaPrevia ? (
                <div className="flex flex-col items-center">
                  <div className="relative h-[400px] w-full mb-4">
                    {procesandoTexto && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10 rounded-lg">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                        <p className="text-center text-primary font-medium">
                          Procesando imagen...
                        </p>
                        <p className="text-center text-muted-foreground text-sm mt-2">
                          Esto puede tomar unos segundos
                        </p>
                      </div>
                    )}
                    <Image
                      src={imagen}
                      alt="Vista previa del ticket"
                      className="object-contain rounded-lg"
                      fill
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      onClick={seleccionarImagen} 
                      disabled={cargandoImagen || procesandoTexto}
                    >
                      <Upload className="h-4 w-4 mr-2" /> 
                      Cambiar imagen
                    </Button>
                    <Button 
                      onClick={procesarImagen} 
                      disabled={cargandoImagen || procesandoTexto}
                      className="flex-1 min-w-32"
                    >
                      {procesandoTexto ? "Procesando..." : "Procesar imagen"}
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={cambiarAModoManual} 
                      disabled={cargandoImagen || procesandoTexto}
                    >
                      Ingresar manualmente
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="concepto">Concepto</Label>
                      <Input 
                        id="concepto" 
                        value={concepto} 
                        onChange={(e) => setConcepto(e.target.value)} 
                        placeholder="Nombre del comercio o descripción"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fecha">Fecha</Label>
                      <Input 
                        id="fecha" 
                        type="date" 
                        value={fecha} 
                        onChange={(e) => setFecha(e.target.value)} 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoría</Label>
                    <Select 
                      value={categoriaSeleccionada} 
                      onValueChange={setCategoriaSeleccionada}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
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

                  {/* Sección de edición post-OCR */}
                  {mostrarEdicionOCR && conceptoOriginalOCR && (
                    <div className="space-y-3 p-4 border rounded-lg bg-green-50/50 dark:bg-green-900/10">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <Label className="font-medium text-green-700 dark:text-green-300">
                          Información detectada automáticamente
                        </Label>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="text-sm">
                          <strong>Comercio detectado:</strong> {conceptoOriginalOCR}
                        </div>
                        
                        {categoriasSugeridas.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Categorías sugeridas:</Label>
                            <div className="flex flex-wrap gap-2">
                              {categoriasSugeridas.map((cat) => (
                                <Button
                                  key={cat.id}
                                  variant={categoriaSeleccionada === cat.id.toString() ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setCategoriaSeleccionada(cat.id.toString())}
                                  className="text-xs"
                                >
                                  {cat.descripcion}
                                  {categoriaSeleccionada === cat.id.toString() && (
                                    <CheckCircle className="h-3 w-3 ml-1" />
                                  )}
                                </Button>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Selecciona una categoría sugerida o elige otra del menú desplegable
                            </p>
                          </div>
                        )}
                        
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            Puedes modificar el concepto arriba y seleccionar una categoría diferente si lo detectado no es correcto.
                          </AlertDescription>
                        </Alert>
                      </div>
                    </div>
                  )}

                  {/* Sección de fecha de imputación contable */}
                  <div className="space-y-3 p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-900/10">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="mostrarFechaImputacion"
                        checked={mostrarFechaImputacion}
                        onCheckedChange={(checked) => setMostrarFechaImputacion(checked === true)}
                      />
                      <Label htmlFor="mostrarFechaImputacion" className="flex items-center cursor-pointer">
                        <Calendar className="h-4 w-4 mr-2" />
                        Usar fecha de imputación contable diferente
                      </Label>
                    </div>
                    
                    {mostrarFechaImputacion && (
                      <div className="space-y-3 ml-6">
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            <strong>¿Cuándo usar esto?</strong><br />
                            • Salarios pagados el último día pero correspondientes al mes siguiente<br />
                            • Alquileres cobrados por adelantado<br />
                            • Facturas pagadas anticipadamente
                          </AlertDescription>
                        </Alert>
                        
                        <div className="space-y-2">
                          <Label htmlFor="fechaImputacion">Fecha de imputación (DD/MM/YYYY)</Label>
                          <Input
                            id="fechaImputacion"
                            value={fechaImputacionStr}
                            onChange={(e) => handleFechaImputacionChange(e.target.value)}
                            placeholder="DD/MM/YYYY (ej: 01/06/2024)"
                            className="max-w-xs"
                          />
                          <p className="text-xs text-muted-foreground">
                            Esta transacción aparecerá en los reportes del mes correspondiente a esta fecha
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Total</Label>
                    <div className="text-2xl font-bold">{formatMoney(total)}</div>
                    
                    {/* Información de validación OCR */}
                    {notaValidacion && (
                      <div className="mt-2">
                        {notaValidacion.includes("recalculado") ? (
                          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/10">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="text-sm">
                              <strong>Total recalculado automáticamente</strong><br />
                              {totalOriginalTicket && (
                                <>
                                  Total detectado en ticket: {formatMoney(totalOriginalTicket)}<br />
                                </>
                              )}
                              Total calculado sumando productos: {formatMoney(totalCalculadoProductos)}<br />
                              <span className="text-xs text-muted-foreground mt-1 block">
                                Se usó el total calculado para mayor precisión
                              </span>
                            </AlertDescription>
                          </Alert>
                        ) : notaValidacion.includes("calculado automáticamente") ? (
                          <Alert className="border-green-200 bg-green-50 dark:bg-green-900/10">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-sm">
                              <strong>Total calculado automáticamente</strong><br />
                              No se detectó total en el ticket, se calculó sumando todos los productos<br />
                              <span className="text-xs text-muted-foreground mt-1 block">
                                Total: {formatMoney(totalCalculadoProductos)}
                              </span>
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <Alert className="border-green-200 bg-green-50 dark:bg-green-900/10">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-sm">
                              <strong>Total validado correctamente</strong><br />
                              El total del ticket coincide con la suma de productos
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {productos.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Detalle de productos ({productos.length})</Label>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setMostrarFormProducto(!mostrarFormProducto)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar producto
                        </Button>
                      </div>
                      
                      {mostrarFormProducto && (
                        <div className="border rounded-md p-3 space-y-3 bg-muted/30 mb-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label htmlFor="descripcion">Descripción</Label>
                              <Input 
                                id="descripcion" 
                                value={nuevoProducto.descripcion}
                                onChange={(e) => setNuevoProducto({...nuevoProducto, descripcion: e.target.value})}
                                placeholder="Ej: Leche 1L"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="cantidad">Cantidad</Label>
                              <Input 
                                id="cantidad" 
                                value={nuevoProducto.cantidad}
                                onChange={(e) => setNuevoProducto({...nuevoProducto, cantidad: e.target.value})}
                                type="number"
                                min="1"
                                step="1"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label htmlFor="precioUnitario">Precio unitario (opcional)</Label>
                              <Input 
                                id="precioUnitario" 
                                value={nuevoProducto.precioUnitario}
                                onChange={(e) => setNuevoProducto({...nuevoProducto, precioUnitario: e.target.value})}
                                placeholder="Ej: 120.50"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="subtotal">Subtotal</Label>
                              <Input 
                                id="subtotal" 
                                value={nuevoProducto.subtotal}
                                onChange={(e) => setNuevoProducto({...nuevoProducto, subtotal: e.target.value})}
                                placeholder="Ej: 120.50"
                              />
                            </div>
                          </div>
                          
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setMostrarFormProducto(false)}
                            >
                              Cancelar
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={agregarProducto}
                            >
                              Agregar
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <div className="border rounded-md divide-y">
                        {productos.map((prod, index) => (
                          <div key={index} className="p-3 flex justify-between items-center">
                            <div>
                              <div className="font-medium">{prod.descripcion}</div>
                              <div className="text-sm text-muted-foreground">
                                {prod.cantidad} {prod.cantidad > 1 ? "unidades" : "unidad"}
                                {prod.precioUnitario ? ` × ${formatMoney(prod.precioUnitario)}` : ""}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="font-medium">{formatMoney(prod.subtotal)}</div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive"
                                onClick={() => eliminarProducto(index)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            {procesado && (
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={volverAVistaPrevia}
                  disabled={enviando}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a la imagen
                </Button>
                <Button 
                  onClick={guardarTransaccion}
                  disabled={enviando}
                >
                  {enviando ? "Guardando..." : "Guardar transacción"}
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
} 