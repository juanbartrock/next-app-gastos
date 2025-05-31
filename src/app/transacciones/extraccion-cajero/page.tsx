"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalendarIcon, ArrowLeft, Banknote, CreditCard, CheckCircle } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useCurrency } from "@/contexts/CurrencyContext"
import { useVisibility } from "@/contexts/VisibilityContext"

export default function ExtraccionCajeroPage() {
  const [monto, setMonto] = useState("")
  const [fecha, setFecha] = useState<Date>(new Date())
  const [descripcion, setDescripcion] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [resultado, setResultado] = useState<any>(null)

  const router = useRouter()
  const { formatMoney } = useCurrency()
  const { valuesVisible } = useVisibility()

  // Función para parsear el monto formateado a número
  const parseMoney = (formattedAmount: string): number => {
    // Remover símbolos de moneda y separadores de miles
    const cleanAmount = formattedAmount.replace(/[^\d,]/g, '')
    // Reemplazar la coma decimal por punto
    const normalizedAmount = cleanAmount.replace(',', '.')
    return parseFloat(normalizedAmount) || 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setLoading(true)

    try {
      const montoNumerico = parseMoney(monto)
      
      if (!montoNumerico || montoNumerico <= 0) {
        setError("El monto debe ser mayor a 0")
        return
      }

      const response = await fetch('/api/transacciones/extraccion-cajero', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monto: montoNumerico,
          fecha: fecha.toISOString(),
          descripcion: descripcion.trim() || undefined
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la extracción')
      }

      setSuccess(true)
      setResultado(data)
      
      // Limpiar formulario
      setMonto("")
      setDescripcion("")
      setFecha(new Date())

    } catch (err: any) {
      setError(err.message || 'Error al procesar la extracción de cajero')
    } finally {
      setLoading(false)
    }
  }

  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "")
    if (value) {
      const formattedValue = formatMoney(parseInt(value) / 100)
      setMonto(formattedValue)
    } else {
      setMonto("")
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        
        <div className="flex items-center gap-3 mb-2">
          <Banknote className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Extracción de Cajero</h1>
        </div>
        <p className="text-muted-foreground">
          Registra una extracción de cajero automático. Se registrará automáticamente el débito digital y el ingreso en efectivo.
        </p>
      </div>

      {/* Explicación del proceso */}
      <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            ¿Cómo funciona?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700 dark:text-blue-300">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Se registra un <strong>egreso digital</strong> (dinero que sale de tu cuenta bancaria)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Se registra un <strong>ingreso en efectivo</strong> (dinero físico que recibes)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datos de la Extracción</CardTitle>
          <CardDescription>
            Completa la información de tu extracción de cajero
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Monto */}
            <div className="space-y-2">
              <Label htmlFor="monto">Monto Extraído *</Label>
              <Input
                id="monto"
                type="text"
                placeholder="$0"
                value={monto}
                onChange={handleMontoChange}
                className="text-lg font-medium"
                required
              />
            </div>

            {/* Fecha */}
            <div className="space-y-2">
              <Label>Fecha de la Extracción *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(fecha, "PPP", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fecha}
                    onSelect={(date) => date && setFecha(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción (Opcional)</Label>
              <Textarea
                id="descripcion"
                placeholder="Ej: Extracción para gastos del fin de semana"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>

            {/* Botón de envío */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !monto}
            >
              {loading ? "Procesando..." : "Registrar Extracción"}
            </Button>
          </form>

          {/* Mensajes de error y éxito */}
          {error && (
            <Alert className="mt-4 border-red-200 bg-red-50 dark:bg-red-950">
              <AlertDescription className="text-red-800 dark:text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && resultado && (
            <Alert className="mt-4 border-green-200 bg-green-50 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <div>
                  <p className="font-medium mb-2">{resultado.message}</p>
                  <div className="space-y-1 text-sm">
                    {resultado.operaciones?.map((op: any, index: number) => (
                      <div key={index} className="flex justify-between">
                        <span>{op.concepto}</span>
                        <span className={op.tipo.includes('egreso') ? 'text-red-600' : 'text-green-600'}>
                          {valuesVisible ? formatMoney(op.monto) : '••••'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 