"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  CalendarIcon, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useCurrency } from "@/contexts/CurrencyContext"
import { toast } from "sonner"

interface TransaccionEjemplo {
  id: number
  concepto: string
  monto: number
  fecha: string
  fechaImputacion?: string
  categoria: string
  tipoTransaccion: string
}

export default function TestFechaImputacionPage() {
  const { data: session } = useSession()
  const { formatMoney } = useCurrency()
  const [transacciones, setTransacciones] = useState<TransaccionEjemplo[]>([])
  const [loading, setLoading] = useState(false)

  // Estados para el ejemplo de salario
  const [fechaDeposito, setFechaDeposito] = useState("31/05/2024")
  const [fechaImputacion, setFechaImputacion] = useState("01/06/2024")
  const [montoSalario, setMontoSalario] = useState("850000")

  const cargarTransacciones = async () => {
    try {
      const response = await fetch('/api/gastos')
      if (response.ok) {
        const data = await response.json()
        setTransacciones(data.slice(0, 5)) // Solo mostrar las últimas 5
      }
    } catch (error) {
      console.error('Error al cargar transacciones:', error)
    }
  }

  useEffect(() => {
    if (session) {
      cargarTransacciones()
    }
  }, [session])

  const crearEjemploSalario = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/gastos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          concepto: 'Salario - Ejemplo Fecha Imputación',
          monto: parseFloat(montoSalario),
          categoria: 'Ingreso',
          categoriaId: 1, // Asumiendo que existe una categoría con ID 1
          tipoTransaccion: 'income',
          tipoMovimiento: 'digital',
          fecha: fechaDeposito,
          fechaImputacion: fechaImputacion,
        }),
      })

      if (response.ok) {
        toast.success('Ejemplo de salario creado correctamente')
        cargarTransacciones()
      } else {
        throw new Error('Error al crear el ejemplo')
      }
    } catch (error) {
      toast.error('Error al crear el ejemplo de salario')
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="p-6">
            <p>Debes iniciar sesión para ver esta página.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Fecha de Imputación Contable</h1>
        <p className="text-muted-foreground">
          Nueva funcionalidad para manejar correctamente ingresos/gastos que se depositan en un mes pero corresponden a otro.
        </p>
      </div>

      {/* Explicación del problema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
            El Problema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-red-600">❌ Antes (Problemático)</h4>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md text-sm">
                <p><strong>31 de Mayo:</strong> Se deposita el salario</p>
                <p><strong>Registro:</strong> Ingreso en Mayo</p>
                <p><strong>Problema:</strong> Mayo se ve artificialmente alto</p>
                <p><strong>Resultado:</strong> Junio aparece sin ingresos</p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">✅ Ahora (Correcto)</h4>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md text-sm">
                <p><strong>31 de Mayo:</strong> Se deposita el salario</p>
                <p><strong>Fecha de depósito:</strong> 31/05/2024</p>
                <p><strong>Fecha de imputación:</strong> 01/06/2024</p>
                <p><strong>Resultado:</strong> Aparece correctamente en Junio</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Casos de uso comunes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-blue-500" />
            Casos de Uso Comunes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">💼 Salarios</h4>
              <p className="text-sm text-muted-foreground">
                Pagados el último día del mes pero corresponden al mes siguiente
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">🏠 Alquileres</h4>
              <p className="text-sm text-muted-foreground">
                Cobrados por adelantado pero imputados al mes correcto
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">💳 Facturas</h4>
              <p className="text-sm text-muted-foreground">
                Pagadas anticipadamente pero del período siguiente
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo interactivo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
            Ejemplo Práctico: Salario
          </CardTitle>
          <CardDescription>
            Prueba la funcionalidad creando un ingreso con fecha de imputación diferente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fechaDeposito">Fecha de depósito</Label>
              <Input
                id="fechaDeposito"
                value={fechaDeposito}
                onChange={(e) => setFechaDeposito(e.target.value)}
                placeholder="DD/MM/YYYY"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechaImputacion">Fecha de imputación</Label>
              <Input
                id="fechaImputacion"
                value={fechaImputacion}
                onChange={(e) => setFechaImputacion(e.target.value)}
                placeholder="DD/MM/YYYY"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="montoSalario">Monto del salario</Label>
              <Input
                id="montoSalario"
                type="number"
                value={montoSalario}
                onChange={(e) => setMontoSalario(e.target.value)}
                placeholder="850000"
              />
            </div>
          </div>
          
          <Button 
            onClick={crearEjemploSalario} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Creando ejemplo...' : 'Crear Ejemplo de Salario'}
          </Button>

          {/* Instrucciones para verificar */}
          <div className="mt-6 p-4 border border-blue-200 dark:border-blue-700 rounded-md bg-blue-50 dark:bg-blue-900/20">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">✅ Cómo verificar que funciona:</h4>
            <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>1. Haz clic en "Crear Ejemplo de Salario"</li>
              <li>2. Ve a <strong>/transacciones</strong> para ver la lista</li>
              <li>3. Busca la transacción creada - debe mostrar dos fechas</li>
              <li>4. Haz clic en el botón ✏️ para editarla</li>
              <li>5. Haz clic en el botón 🗑️ para eliminarla</li>
              <li>6. La fecha de imputación aparece como 📊 [fecha] en la lista</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Últimas transacciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5" />
            Últimas Transacciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transacciones.length > 0 ? (
            <div className="space-y-3">
              {transacciones.map((transaccion) => (
                <div key={transaccion.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{transaccion.concepto}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>📅 Depósito: {new Date(transaccion.fecha).toLocaleDateString('es-AR')}</span>
                      {transaccion.fechaImputacion && (
                        <span>📊 Imputación: {new Date(transaccion.fechaImputacion).toLocaleDateString('es-AR')}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transaccion.tipoTransaccion === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaccion.tipoTransaccion === 'income' ? '+' : '-'}{formatMoney(transaccion.monto)}
                    </p>
                    <Badge variant={transaccion.fechaImputacion ? "default" : "secondary"}>
                      {transaccion.fechaImputacion ? "Con imputación" : "Normal"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No hay transacciones para mostrar
            </p>
          )}
        </CardContent>
      </Card>

      {/* Verificación de cálculos mensuales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            📊 Verificación de Cálculos Mensuales
          </CardTitle>
          <CardDescription>
            Compara cómo se calculan los totales mensuales con fecha normal vs fecha de imputación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CalendarIcon className="h-4 w-4" />
            <AlertDescription>
              <strong>Prueba:</strong> Después de crear el ejemplo de salario, ve al <strong>/dashboard</strong> y cambiar al mes de Junio 2024. 
              El salario debería aparecer en Junio, no en Mayo.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2 text-green-600">✅ Con Fecha de Imputación</h4>
              <div className="text-sm space-y-1">
                <p><strong>API:</strong> <code>/api/gastos?usarFechaImputacion=true</code></p>
                <p><strong>Dashboard:</strong> Usa fechaImputacion cuando existe</p>
                <p><strong>Informes:</strong> Usa fechaImputacion cuando existe</p>
                <p><strong>Presupuestos:</strong> Usa fechaImputacion cuando existe</p>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2 text-orange-600">⚠️ Sin Fecha de Imputación</h4>
              <div className="text-sm space-y-1">
                <p><strong>API:</strong> <code>/api/gastos</code> (normal)</p>
                <p><strong>Comportamiento:</strong> Usa fecha normal siempre</p>
                <p><strong>Problema:</strong> Salarios aparecen en mes incorrecto</p>
                <p><strong>Impacto:</strong> Reportes incorrectos</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información técnica */}
      <Card>
        <CardHeader>
          <CardTitle>🔧 Información Técnica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CalendarIcon className="h-4 w-4" />
            <AlertDescription>
              <strong>Nuevo campo:</strong> Se agregó <code>fechaImputacion</code> opcional al modelo <code>Gasto</code>.
              Cuando está presente, se usa para reportes contables en lugar de <code>fecha</code>.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">📊 Para Reportes</h4>
              <p>Usar el parámetro <code>usarFechaImputacion=true</code> en la API de gastos</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🔄 Retrocompatibilidad</h4>
              <p>Las transacciones existentes funcionan igual. El campo es opcional.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 