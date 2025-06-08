'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  Crown, 
  Calendar, 
  CreditCard, 
  Download, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Gift,
  BarChart3,
  Zap,
  Users
} from "lucide-react"
import { toast } from "sonner"
import { usePlanLimits } from "@/hooks/usePlanLimits"

interface Suscripcion {
  id: string
  planId: string
  estado: string
  fechaInicio: Date
  fechaVencimiento: Date
  monto: number
  plan: {
    nombre: string
    descripcion: string
    colorHex: string
  }
}

interface PagoHistorial {
  id: string
  concepto: string
  monto: number
  fechaCreacion: Date
  fechaPago: Date | null
  estado: string
  tipoPago: string
}

export default function SuscripcionPage() {
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null)
  const [historialPagos, setHistorialPagos] = useState<PagoHistorial[]>([])
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(false)
  const { plan: planActual, limits, needsUpgrade, refresh } = usePlanLimits()

  // Cargar datos de suscripción
  useEffect(() => {
    const fetchSuscripcion = async () => {
      try {
        const [suscripcionRes, pagosRes] = await Promise.all([
          fetch('/api/suscripciones/actual'),
          fetch('/api/suscripciones/historial-pagos')
        ])

        if (suscripcionRes.ok) {
          const suscripcionData = await suscripcionRes.json()
          setSuscripcion(suscripcionData)
        }

        if (pagosRes.ok) {
          const pagosData = await pagosRes.json()
          setHistorialPagos(pagosData.pagos || [])
        }
      } catch (error) {
        console.error('Error cargando suscripción:', error)
        toast.error('Error cargando datos de suscripción')
      } finally {
        setLoading(false)
      }
    }

    fetchSuscripcion()
  }, [])

  const manejarCancelacion = async () => {
    if (!suscripcion) return
    
    const confirmacion = confirm('¿Estás seguro de que quieres cancelar tu suscripción? Perderás acceso a las funcionalidades premium al final del período actual.')
    
    if (!confirmacion) return
    
    setProcesando(true)
    
    try {
      const response = await fetch('/api/suscripciones/cancelar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suscripcionId: suscripcion.id })
      })

      if (response.ok) {
        toast.success('Suscripción cancelada correctamente')
        setSuscripcion(prev => prev ? { ...prev, estado: 'CANCELLED' } : null)
        refresh()
      } else {
        toast.error('Error cancelando suscripción')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setProcesando(false)
    }
  }

  const calcularDiasRestantes = () => {
    if (!suscripcion) return 0
    const hoy = new Date()
    const vencimiento = new Date(suscripcion.fechaVencimiento)
    const diffTime = vencimiento.getTime() - hoy.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Activa</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800">Expirada</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  const getPagoBadge = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'approved':
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Pagado</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
      case 'rejected':
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Rechazado</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Crown className="h-8 w-8 text-yellow-500" />
            Mi Suscripción
          </h1>
          <p className="text-muted-foreground">Gestiona tu plan y facturación</p>
        </div>
        
        <Button variant="outline" asChild>
          <a href="/planes">
            <Sparkles className="h-4 w-4 mr-2" />
            Ver Todos los Planes
          </a>
        </Button>
      </div>

      <Tabs defaultValue="resumen" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="pagos">Historial de Pagos</TabsTrigger>
          <TabsTrigger value="limites">Límites de Uso</TabsTrigger>
          <TabsTrigger value="configuracion">Configuración</TabsTrigger>
        </TabsList>

        {/* Tab: Resumen */}
        <TabsContent value="resumen" className="space-y-6">
          
          {/* Estado actual de la suscripción */}
          {suscripcion ? (
            <Card className="border-2 border-blue-200 bg-blue-50 dark:bg-blue-950">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2" style={{ color: suscripcion.plan.colorHex }}>
                      <Crown className="h-5 w-5" />
                      Plan {suscripcion.plan.nombre}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{suscripcion.plan.descripcion}</p>
                  </div>
                  {getEstadoBadge(suscripcion.estado)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Próximo pago */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Calendar className="h-4 w-4" />
                      Próximo Pago
                    </div>
                    <p className="text-lg font-bold">${suscripcion.monto}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(suscripcion.fechaVencimiento).toLocaleDateString('es-AR')}
                    </p>
                  </div>

                  {/* Días restantes */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="h-4 w-4" />
                      Días Restantes
                    </div>
                    <p className="text-lg font-bold">{calcularDiasRestantes()}</p>
                    <p className="text-sm text-muted-foreground">
                      {calcularDiasRestantes() <= 3 ? 'Renovación próxima' : 'días del período actual'}
                    </p>
                  </div>

                  {/* Estado del pago */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <CreditCard className="h-4 w-4" />
                      Estado
                    </div>
                    <div className="flex items-center gap-2">
                      {suscripcion.estado === 'ACTIVE' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      )}
                      <span className="font-medium">
                        {suscripcion.estado === 'ACTIVE' ? 'Todo al día' : 'Requiere atención'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones rápidas */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Factura
                  </Button>
                  
                  <Button variant="outline" size="sm" asChild>
                    <a href="/planes">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Cambiar Plan
                    </a>
                  </Button>
                  
                  {suscripcion.estado === 'ACTIVE' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={manejarCancelacion}
                      disabled={procesando}
                      className="text-red-600 hover:text-red-700"
                    >
                      {procesando ? 'Procesando...' : 'Cancelar Suscripción'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            // Sin suscripción activa
            <Card className="border-2 border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
              <CardContent className="p-6 text-center space-y-4">
                <Gift className="h-12 w-12 mx-auto text-yellow-500" />
                <div>
                  <h3 className="font-semibold text-lg">¡No tienes una suscripción activa!</h3>
                  <p className="text-muted-foreground">
                    Actualmente estás usando el plan gratuito. Actualiza para desbloquear más funcionalidades.
                  </p>
                </div>
                <Button asChild>
                  <a href="/planes">
                    <Crown className="h-4 w-4 mr-2" />
                    Ver Planes Disponibles
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Advertencias y alertas */}
          {suscripcion && calcularDiasRestantes() <= 3 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Tu suscripción vence en {calcularDiasRestantes()} días. Asegúrate de tener un método de pago válido para evitar interrupciones.
              </AlertDescription>
            </Alert>
          )}

        </TabsContent>

        {/* Tab: Historial de Pagos */}
        <TabsContent value="pagos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Pagos</CardTitle>
            </CardHeader>
            <CardContent>
              {historialPagos.length > 0 ? (
                <div className="space-y-4">
                  {historialPagos.map((pago) => (
                    <div key={pago.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{pago.concepto}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(pago.fechaCreacion).toLocaleDateString('es-AR')}
                        </p>
                        <div className="flex items-center gap-2">
                          {getPagoBadge(pago.estado)}
                          <Badge variant="outline" className="text-xs">
                            {pago.tipoPago}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">${pago.monto}</p>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay historial de pagos</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Límites de Uso */}
        <TabsContent value="limites" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Transacciones */}
            {limits.transacciones_mes && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <BarChart3 className="h-4 w-4" />
                    Transacciones Mensuales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Usadas</span>
                      <span>{limits.transacciones_mes.usage}/{limits.transacciones_mes.limit}</span>
                    </div>
                    <Progress 
                      value={(limits.transacciones_mes.usage / limits.transacciones_mes.limit) * 100} 
                    />
                    <p className="text-xs text-muted-foreground">
                      {limits.transacciones_mes.limit === -1 ? 'Ilimitadas' : 
                       `${limits.transacciones_mes.limit - limits.transacciones_mes.usage} restantes`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Consultas IA */}
            {limits.consultas_ia_mes && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4" />
                    Consultas IA Mensuales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Usadas</span>
                      <span>{limits.consultas_ia_mes.usage}/{limits.consultas_ia_mes.limit}</span>
                    </div>
                    <Progress 
                      value={(limits.consultas_ia_mes.usage / limits.consultas_ia_mes.limit) * 100} 
                    />
                    <p className="text-xs text-muted-foreground">
                      {limits.consultas_ia_mes.limit === -1 ? 'Ilimitadas' : 
                       `${limits.consultas_ia_mes.limit - limits.consultas_ia_mes.usage} restantes`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Modo Familiar */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  Modo Familiar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Estado</span>
                    <span>{needsUpgrade ? 'No disponible' : 'Disponible'}</span>
                  </div>
                  <div className={`h-2 rounded-full ${needsUpgrade ? 'bg-gray-200' : 'bg-green-200'}`} />
                  <p className="text-xs text-muted-foreground">
                    {needsUpgrade ? 'Requiere plan premium' : 'Funcionalidad activa'}
                  </p>
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* Tab: Configuración */}
        <TabsContent value="configuracion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración de Facturación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="space-y-4">
                <Button variant="outline" className="w-full">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Actualizar Método de Pago
                </Button>
                
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Todas las Facturas
                </Button>
                
                <Button variant="outline" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar Notificaciones
                </Button>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Zona de Peligro</h4>
                <Button 
                  variant="destructive" 
                  onClick={manejarCancelacion}
                  disabled={!suscripcion || suscripcion.estado !== 'ACTIVE' || procesando}
                  className="w-full"
                >
                  {procesando ? 'Procesando...' : 'Cancelar Suscripción Permanentemente'}
                </Button>
              </div>
              
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}