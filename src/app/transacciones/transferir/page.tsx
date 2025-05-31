"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, ArrowLeft, Send, Users, ArrowUpDown, CheckCircle } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useCurrency } from "@/contexts/CurrencyContext"
import { useVisibility } from "@/contexts/VisibilityContext"

interface Usuario {
  id: string
  name: string | null
  email: string
}

export default function TransferirPage() {
  const [monto, setMonto] = useState("")
  const [tipoTransferencia, setTipoTransferencia] = useState<"interna" | "externa">("externa")
  const [destinatarioUserId, setDestinatarioUserId] = useState("")
  const [destinatarioNombre, setDestinatarioNombre] = useState("")
  const [concepto, setConcepto] = useState("")
  const [tipoMovimiento, setTipoMovimiento] = useState<"efectivo" | "digital" | "ahorro">("digital")
  const [fecha, setFecha] = useState<Date>(new Date())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loadingUsuarios, setLoadingUsuarios] = useState(false)

  const router = useRouter()
  const { formatMoney } = useCurrency()
  const { valuesVisible } = useVisibility()

  // Función para parsear el monto formateado a número
  const parseMoney = (formattedAmount: string): number => {
    const cleanAmount = formattedAmount.replace(/[^\d,]/g, '')
    const normalizedAmount = cleanAmount.replace(',', '.')
    return parseFloat(normalizedAmount) || 0
  }

  // Cargar usuarios para transferencias internas
  useEffect(() => {
    if (tipoTransferencia === 'interna') {
      fetchUsuarios()
    }
  }, [tipoTransferencia])

  const fetchUsuarios = async () => {
    setLoadingUsuarios(true)
    try {
      const response = await fetch('/api/transacciones/transferir')
      if (response.ok) {
        const data = await response.json()
        setUsuarios(data)
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
    } finally {
      setLoadingUsuarios(false)
    }
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

      if (!concepto.trim()) {
        setError("El concepto es obligatorio")
        return
      }

      if (tipoTransferencia === 'interna' && !destinatarioUserId) {
        setError("Selecciona un destinatario para la transferencia interna")
        return
      }

      if (tipoTransferencia === 'externa' && !destinatarioNombre.trim()) {
        setError("Ingresa el nombre del destinatario para la transferencia externa")
        return
      }

      const response = await fetch('/api/transacciones/transferir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monto: montoNumerico,
          tipoTransferencia,
          destinatarioUserId: tipoTransferencia === 'interna' ? destinatarioUserId : undefined,
          destinatarioNombre: tipoTransferencia === 'externa' ? destinatarioNombre.trim() : undefined,
          concepto: concepto.trim(),
          tipoMovimiento,
          fecha: fecha.toISOString()
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la transferencia')
      }

      setSuccess(true)
      setResultado(data)
      
      // Limpiar formulario
      setMonto("")
      setDestinatarioUserId("")
      setDestinatarioNombre("")
      setConcepto("")
      setFecha(new Date())

    } catch (err: any) {
      setError(err.message || 'Error al procesar la transferencia')
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
          <Send className="h-8 w-8 text-green-600" />
          <h1 className="text-3xl font-bold">Transferir Dinero</h1>
        </div>
        <p className="text-muted-foreground">
          Realiza transferencias internas a otros usuarios de la app o externas a terceros.
        </p>
      </div>

      {/* Explicación del proceso */}
      <Card className="mb-6 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            Tipos de Transferencia
          </CardTitle>
        </CardHeader>
        <CardContent className="text-green-700 dark:text-green-300">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span><strong>Interna:</strong> A otro usuario de la app (registra egreso para ti e ingreso para el destinatario)</span>
            </div>
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              <span><strong>Externa:</strong> A alguien fuera de la app (solo registra tu egreso)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datos de la Transferencia</CardTitle>
          <CardDescription>
            Completa la información de tu transferencia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de Transferencia */}
            <div className="space-y-2">
              <Label>Tipo de Transferencia *</Label>
              <Select value={tipoTransferencia} onValueChange={(value: "interna" | "externa") => setTipoTransferencia(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interna">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Transferencia Interna (Usuario de la App)
                    </div>
                  </SelectItem>
                  <SelectItem value="externa">
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Transferencia Externa (Tercero)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Destinatario según tipo */}
            {tipoTransferencia === 'interna' ? (
              <div className="space-y-2">
                <Label>Destinatario (Usuario de la App) *</Label>
                <Select value={destinatarioUserId} onValueChange={setDestinatarioUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingUsuarios ? "Cargando usuarios..." : "Seleccionar usuario"} />
                  </SelectTrigger>
                  <SelectContent>
                    {usuarios.map((usuario) => (
                      <SelectItem key={usuario.id} value={usuario.id}>
                        {usuario.name || usuario.email} ({usuario.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="destinatarioNombre">Nombre del Destinatario *</Label>
                <Input
                  id="destinatarioNombre"
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  value={destinatarioNombre}
                  onChange={(e) => setDestinatarioNombre(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Monto */}
            <div className="space-y-2">
              <Label htmlFor="monto">Monto a Transferir *</Label>
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

            {/* Concepto */}
            <div className="space-y-2">
              <Label htmlFor="concepto">Concepto *</Label>
              <Input
                id="concepto"
                type="text"
                placeholder="Ej: Pago de servicios, préstamo personal, etc."
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                required
              />
            </div>

            {/* Tipo de Movimiento */}
            <div className="space-y-2">
              <Label>Tipo de Movimiento *</Label>
              <Select value={tipoMovimiento} onValueChange={(value: "efectivo" | "digital" | "ahorro") => setTipoMovimiento(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="ahorro">Ahorro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fecha */}
            <div className="space-y-2">
              <Label>Fecha de la Transferencia *</Label>
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

            {/* Botón de envío */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !monto || !concepto || (tipoTransferencia === 'interna' && !destinatarioUserId) || (tipoTransferencia === 'externa' && !destinatarioNombre)}
            >
              {loading ? "Procesando..." : "Realizar Transferencia"}
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
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between">
                          <span className="font-medium">{op.tipo.includes('egreso') ? 'Tu egreso' : 'Ingreso destinatario'}:</span>
                          <span className={op.tipo.includes('egreso') ? 'text-red-600' : 'text-green-600'}>
                            {valuesVisible ? formatMoney(op.monto) : '••••'}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">{op.concepto}</div>
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