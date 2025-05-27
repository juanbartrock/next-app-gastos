"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { ArrowLeft, CalendarIcon, Info, Loader2, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/contexts/CurrencyContext"
import { toast } from "sonner"

// FUNCIONES HELPER PARA FECHAS (DD/MM/YYYY)
const parseDDMMYYYY = (dateStr: string): Date | undefined => {
  if (!dateStr) return undefined;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1000 && year < 3000 && day > 0 && day <= 31 && month >= 0 && month < 12) {
      const date = new Date(year, month, day);
      if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
        return date;
      }
    }
  }
  return undefined;
};

const formatDateToDDMMYYYY = (date: Date | undefined): string => {
  if (!date) return "";
  try {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    return "";
  }
};

// Esquema de validación del formulario
const formSchema = z.object({
  nombre: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres."
  }),
  descripcion: z.string().optional(),
  montoInicial: z.coerce.number().positive({
    message: "El monto debe ser positivo."
  }),
  rendimientoAnual: z.coerce.number().optional(),
  fechaInicio: z.string().refine((val) => !!parseDDMMYYYY(val), {
    message: "Fecha de inicio inválida (DD/MM/YYYY)",
  }),
  fechaVencimiento: z.string().optional().refine((val) => !val || !!parseDDMMYYYY(val), {
    message: "Fecha de vencimiento inválida (DD/MM/YYYY)",
  }),
  tipoId: z.string({
    required_error: "Selecciona un tipo de inversión."
  }),
  plataforma: z.string().optional(),
  notas: z.string().optional()
})

export default function NuevaInversionPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [tiposInversion, setTiposInversion] = useState<{id: string, nombre: string}[]>([])
  const { formatMoney } = useCurrency()
  const { status } = useSession()
  const router = useRouter()

  // Redireccionar si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Cargar tipos de inversión
  useEffect(() => {
    const cargarTiposInversion = async () => {
      try {
        const response = await fetch('/api/inversiones/tipos')
        
        if (!response.ok) {
          throw new Error('Error al cargar tipos de inversión')
        }
        
        const data = await response.json()
        console.log("Tipos de inversión recibidos:", data)
        setTiposInversion(data.tiposInversion || [])
      } catch (error) {
        console.error("Error al cargar tipos de inversión:", error)
        toast.error("Error al cargar tipos de inversión")
      }
    }

    if (status === "authenticated") {
      cargarTiposInversion()
    }
  }, [status])

  // Configuración del formulario
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      montoInicial: undefined,
      rendimientoAnual: undefined,
      fechaInicio: formatDateToDDMMYYYY(new Date()),
      fechaVencimiento: "",
      tipoId: "",
      plataforma: "",
      notas: ""
    }
  })

  // Función para manejar el envío del formulario
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    try {
      const parsedFechaInicio = parseDDMMYYYY(values.fechaInicio)
      const parsedFechaVencimiento = values.fechaVencimiento ? parseDDMMYYYY(values.fechaVencimiento) : undefined

      // No es estrictamente necesario validar aquí de nuevo si Zod lo hace, pero es una doble verificación.
      if (!parsedFechaInicio) {
        toast.error("Formato de Fecha de Inicio inválido.")
        setIsLoading(false)
        return
      }
      if (values.fechaVencimiento && !parsedFechaVencimiento) {
        toast.error("Formato de Fecha de Vencimiento inválido.")
        setIsLoading(false)
        return
      }

      const datosParaAPI = {
        ...values,
        fechaInicio: parsedFechaInicio,
        fechaVencimiento: parsedFechaVencimiento,
      }
      console.log("Enviando datos de inversión:", datosParaAPI)
      
      const response = await fetch('/api/inversiones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosParaAPI),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error("Error de la API:", error)
        throw new Error(error.error || 'Error al registrar la inversión')
      }

      const data = await response.json()
      toast.success(data.message || "Inversión registrada con éxito")
      router.push("/inversiones")
    } catch (error) {
      console.error("Error al registrar inversión:", error)
      toast.error("Error al registrar la inversión. Inténtalo nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  // Función para volver
  const goBack = () => {
    router.back()
  }

  if (status === "loading") {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-1 mr-4" 
          onClick={goBack}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver</span>
        </Button>
        <h1 className="text-2xl font-bold flex items-center">
          <TrendingUp className="h-6 w-6 mr-2 text-primary" />
          Nueva Inversión
        </h1>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Registra una nueva inversión</CardTitle>
          <CardDescription>
            Completa los detalles de tu inversión para comenzar a monitorear su rendimiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre de la inversión */}
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Nombre de la inversión</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Plazo Fijo Banco Nación" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tipo de inversión */}
                <FormField
                  control={form.control}
                  name="tipoId"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Tipo de inversión</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tiposInversion.map((tipo) => (
                            <SelectItem key={tipo.id} value={tipo.id}>
                              {tipo.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Descripción */}
              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Descripción (opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Breve descripción de la inversión" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Monto inicial */}
                <FormField
                  control={form.control}
                  name="montoInicial"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Monto inicial</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          value={field.value || ''} 
                          onChange={e => {
                            const value = e.target.value === '' ? undefined : Number(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Rendimiento anual estimado */}
                <FormField
                  control={form.control}
                  name="rendimientoAnual"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>
                        Rendimiento anual estimado (%)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Ej: 10.5" 
                          value={field.value || ''} 
                          onChange={e => {
                            const value = e.target.value === '' ? undefined : Number(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Fecha de inicio */}
                <FormField
                  control={form.control}
                  name="fechaInicio"
                  render={({ field }: { field: any }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de inicio (DD/MM/YYYY)</FormLabel>
                      <FormControl>
                        <Input 
                          type="text" 
                          placeholder="DD/MM/YYYY" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fecha de vencimiento */}
                <FormField
                  control={form.control}
                  name="fechaVencimiento"
                  render={({ field }: { field: any }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de vencimiento (opcional, DD/MM/YYYY)</FormLabel>
                      <FormControl>
                        <Input 
                          type="text" 
                          placeholder="DD/MM/YYYY" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Para inversiones a plazo fijo o con fecha de finalización
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Plataforma */}
              <FormField
                control={form.control}
                name="plataforma"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Plataforma o entidad (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Banco, Broker, Exchange..." {...field} />
                    </FormControl>
                    <FormDescription>
                      Ingresa el banco, broker, exchange o entidad donde realizaste la inversión
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notas adicionales */}
              <FormField
                control={form.control}
                name="notas"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Notas adicionales (opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Información adicional sobre la inversión"
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={goBack}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>Guardar Inversión</>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 