'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Check, Crown, Zap, Gift, Star, ArrowRight, Sparkles, Users, Brain, TrendingUp, Shield, Clock } from "lucide-react"
import { toast } from "sonner"
import { usePlanLimits } from "@/hooks/usePlanLimits"

interface Plan {
  id: string
  nombre: string
  descripcion: string
  precioMensual: number
  esPago: boolean
  colorHex: string
  features: string
  limitaciones: any
  ordenDisplay: number
  popular?: boolean
  recomendado?: boolean
}

interface PlanFeature {
  nombre: string
  gratuito: string | boolean
  basico: string | boolean
  premium: string | boolean
  icono: React.ReactNode
}

export default function PlanesPage() {
  const [planes, setPlanes] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState<string | null>(null)
  const { plan: planActual, limits, needsUpgrade, refresh } = usePlanLimits()

  // Cargar planes desde la API
  useEffect(() => {
    const fetchPlanes = async () => {
      try {
        const response = await fetch('/api/planes')
        if (response.ok) {
          const data = await response.json()
          // Filtrar solo los planes públicos (excluir lifetime)
          const planesPublicos = data.filter((p: Plan) => 
            !p.nombre.toLowerCase().includes('lifetime') && 
            !p.nombre.toLowerCase().includes('vida')
          )
          setPlanes(planesPublicos)
        }
      } catch (error) {
        console.error('Error cargando planes:', error)
        toast.error('Error cargando planes')
      } finally {
        setLoading(false)
      }
    }

    fetchPlanes()
  }, [])

  // Características comparativas
  const features: PlanFeature[] = [
    {
      nombre: 'Transacciones mensuales',
      gratuito: '50',
      basico: 'Ilimitadas',
      premium: 'Ilimitadas',
      icono: <TrendingUp className="h-4 w-4" />
    },
    {
      nombre: 'Gastos recurrentes',
      gratuito: '2',
      basico: '10',
      premium: 'Ilimitados',
      icono: <Clock className="h-4 w-4" />
    },
    {
      nombre: 'Consultas IA mensuales',
      gratuito: '3',
      basico: '15',
      premium: 'Ilimitadas',
      icono: <Brain className="h-4 w-4" />
    },
    {
      nombre: 'Presupuestos activos',
      gratuito: '1',
      basico: '3',
      premium: 'Ilimitados',
      icono: <TrendingUp className="h-4 w-4" />
    },
    {
      nombre: 'Modo familiar',
      gratuito: false,
      basico: '5 miembros',
      premium: '10 miembros',
      icono: <Users className="h-4 w-4" />
    },
    {
      nombre: 'Categorías personalizadas',
      gratuito: false,
      basico: true,
      premium: true,
      icono: <Star className="h-4 w-4" />
    },
    {
      nombre: 'Alertas automáticas',
      gratuito: false,
      basico: true,
      premium: true,
      icono: <Zap className="h-4 w-4" />
    },
    {
      nombre: 'Préstamos e inversiones',
      gratuito: false,
      basico: false,
      premium: true,
      icono: <TrendingUp className="h-4 w-4" />
    },
    {
      nombre: 'Sistema de tareas',
      gratuito: false,
      basico: false,
      premium: true,
      icono: <Clock className="h-4 w-4" />
    },
    {
      nombre: 'Exportación de datos',
      gratuito: false,
      basico: 'CSV',
      premium: 'CSV, Excel, PDF',
      icono: <ArrowRight className="h-4 w-4" />
    },
    {
      nombre: 'Soporte técnico',
      gratuito: 'Comunidad',
      basico: 'Email',
      premium: 'Email + Chat',
      icono: <Shield className="h-4 w-4" />
    }
  ]

  const manejarSeleccionPlan = async (planId: string, esPago: boolean) => {
    if (!esPago) {
      toast.info('El plan gratuito se asigna automáticamente')
      return
    }

    setProcesando(planId)

    try {
      // TODO: Integrar con MercadoPago
      const response = await fetch('/api/suscripciones/crear-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.checkoutUrl) {
          // Redirigir a MercadoPago
          window.location.href = data.checkoutUrl
        } else {
          toast.success('Plan actualizado correctamente')
          refresh()
        }
      } else {
        toast.error('Error procesando el pago')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setProcesando(null)
    }
  }

  const getPlanIcon = (planNombre: string) => {
    const nombre = planNombre.toLowerCase()
    if (nombre.includes('premium')) return <Crown className="h-5 w-5" />
    if (nombre.includes('básico') || nombre.includes('basico')) return <Zap className="h-5 w-5" />
    return <Gift className="h-5 w-5" />
  }

  const isPlanActual = (planNombre: string) => {
    const nombre = planNombre.toLowerCase()
    const actual = planActual.toLowerCase()
    
    if (nombre.includes('premium') && (actual.includes('premium') || actual.includes('lifetime'))) return true
    if (nombre.includes('básico') && actual.includes('básico')) return true
    if (nombre.includes('gratuito') && actual.includes('gratuito')) return true
    
    return false
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Sparkles className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold">Elige tu Plan</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Gestiona tus finanzas personales con herramientas potentes. 
          Comienza gratis y actualiza cuando necesites más funcionalidades.
        </p>
      </div>

      {/* Estado actual del usuario */}
      {planActual && (
        <Card className="border-2 border-blue-200 bg-blue-50 dark:bg-blue-950">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-semibold">Tu plan actual: <span className="capitalize">{planActual}</span></p>
                  <p className="text-sm text-muted-foreground">
                    {needsUpgrade ? 'Tienes funcionalidades limitadas' : 'Tienes acceso completo'}
                  </p>
                </div>
              </div>
              
              {limits.transacciones_mes && limits.transacciones_mes.limit > 0 && (
                <div className="text-right space-y-1">
                  <p className="text-sm font-medium">
                    Transacciones: {limits.transacciones_mes.usage}/{limits.transacciones_mes.limit}
                  </p>
                  <Progress 
                    value={(limits.transacciones_mes.usage / limits.transacciones_mes.limit) * 100} 
                    className="w-24 h-2"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid de planes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {planes.map((plan) => {
          const esActual = isPlanActual(plan.nombre)
          const esPopular = plan.nombre.toLowerCase().includes('básico')
          const esPremium = plan.nombre.toLowerCase().includes('premium')
          
          return (
            <Card 
              key={plan.id} 
              className={`relative transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                esPremium ? 'border-2 border-yellow-300 shadow-lg' : 
                esPopular ? 'border-2 border-blue-300' :
                'border border-gray-200'
              }`}
            >
              {/* Badge superior */}
              {esPremium && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Más Popular
                  </Badge>
                </div>
              )}
              
              {esPopular && !esPremium && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-3 py-1">
                    Recomendado
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {getPlanIcon(plan.nombre)}
                  <CardTitle className="text-2xl" style={{ color: plan.colorHex }}>
                    {plan.nombre}
                  </CardTitle>
                </div>
                
                <div className="space-y-2">
                  <div className="text-4xl font-bold">
                    {plan.esPago ? (
                      <>
                        <span style={{ color: plan.colorHex }}>${plan.precioMensual}</span>
                        <span className="text-lg font-normal text-muted-foreground">/mes</span>
                      </>
                    ) : (
                      <span style={{ color: plan.colorHex }}>Gratis</span>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{plan.descripcion}</p>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                
                {/* Características principales */}
                <div className="space-y-3">
                  {features.map((feature, index) => {
                    const valor = plan.nombre.toLowerCase().includes('premium') ? feature.premium :
                                 plan.nombre.toLowerCase().includes('básico') ? feature.basico :
                                 feature.gratuito
                    
                    const esDisponible = valor !== false
                    
                    return (
                      <div key={index} className="flex items-center gap-3 text-sm">
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                          esDisponible ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {esDisponible ? <Check className="h-3 w-3" /> : '×'}
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          {feature.icono}
                          <span className={esDisponible ? '' : 'text-muted-foreground line-through'}>
                            {feature.nombre}
                          </span>
                        </div>
                        <span className="font-medium text-xs">
                          {typeof valor === 'boolean' ? (valor ? '✓' : '✗') : valor}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Botón de acción */}
                <div className="pt-4">
                  {esActual ? (
                    <Button className="w-full" variant="outline" disabled>
                      <Crown className="h-4 w-4 mr-2" />
                      Plan Actual
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={() => manejarSeleccionPlan(plan.id, plan.esPago)}
                      disabled={procesando === plan.id}
                      style={{ 
                        backgroundColor: plan.colorHex,
                        borderColor: plan.colorHex 
                      }}
                    >
                      {procesando === plan.id ? (
                        'Procesando...'
                      ) : (
                        <>
                          {plan.esPago ? 'Suscribirse' : 'Usar Gratis'}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                </div>

              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Comparación detallada */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Comparación Detallada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Característica</th>
                  <th className="text-center p-3">Gratuito</th>
                  <th className="text-center p-3">Básico</th>
                  <th className="text-center p-3">Premium</th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-3 flex items-center gap-2">
                      {feature.icono}
                      {feature.nombre}
                    </td>
                    <td className="text-center p-3">
                      {typeof feature.gratuito === 'boolean' ? 
                        (feature.gratuito ? '✓' : '✗') : 
                        feature.gratuito
                      }
                    </td>
                    <td className="text-center p-3">
                      {typeof feature.basico === 'boolean' ? 
                        (feature.basico ? '✓' : '✗') : 
                        feature.basico
                      }
                    </td>
                    <td className="text-center p-3">
                      {typeof feature.premium === 'boolean' ? 
                        (feature.premium ? '✓' : '✗') : 
                        feature.premium
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* FAQ o garantías */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Garantía de Satisfacción
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">• Cancela cuando quieras, sin compromisos</p>
            <p className="text-sm">• Reembolso completo en los primeros 7 días</p>
            <p className="text-sm">• Migración de datos garantizada</p>
            <p className="text-sm">• Soporte técnico incluido</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-blue-600" />
              ¿Tienes un código promocional?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-3">
              Si tienes un código promocional, úsalo antes de suscribirte para obtener descuentos especiales.
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="/test-promo">Usar Código Promocional</a>
            </Button>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}