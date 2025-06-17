"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CheckCircle, 
  Crown, 
  Gift, 
  Zap, 
  ArrowRight, 
  CreditCard,
  Users,
  Target,
  Sparkles,
  Info
} from "lucide-react"
import Link from "next/link"

interface Plan {
  id: string
  nombre: string
  descripcion: string
  precioMensual: number
  esPago: boolean
  colorHex: string
  features: string
  limitaciones: any
}

interface PlanWelcomeProps {
  onComplete?: () => void
  showOnce?: boolean
}

export function PlanWelcome({ onComplete, showOnce = true }: PlanWelcomeProps) {
  const { data: session } = useSession()
  const [planData, setPlanData] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Solo mostrar si es el primer login después del registro
    const firstLogin = typeof window !== 'undefined' 
      ? sessionStorage.getItem('firstLogin') 
      : null

    if (showOnce && !firstLogin) {
      setLoading(false)
      return
    }

    const fetchUserPlan = async () => {
      if (!session?.user?.id) return

      try {
        const response = await fetch('/api/user/plan')
        if (response.ok) {
          const data = await response.json()
          setPlanData(data.plan)
          setShow(true)
        }
      } catch (error) {
        console.error('Error fetching user plan:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserPlan()
  }, [session, showOnce])

  const handleComplete = () => {
    if (showOnce && typeof window !== 'undefined') {
      sessionStorage.removeItem('firstLogin')
    }
    setShow(false)
    onComplete?.()
  }

  const getPlanIcon = (planNombre: string) => {
    const nombre = planNombre?.toLowerCase() || ''
    if (nombre.includes('premium')) return <Crown className="h-6 w-6 text-amber-500" />
    if (nombre.includes('básico') || nombre.includes('basico')) return <Zap className="h-6 w-6 text-blue-500" />
    return <Gift className="h-6 w-6 text-gray-500" />
  }

  const getPlanFeatures = (plan: Plan) => {
    if (!plan.features) return []
    return plan.features.split(',').map(f => f.trim()).slice(0, 5)
  }

  const getPlanLimitations = (plan: Plan) => {
    if (!plan.limitaciones) return []
    
    const limitations = plan.limitaciones as any
    const items = []
    
    if (limitations.transacciones_mes && limitations.transacciones_mes > 0) {
      items.push(`${limitations.transacciones_mes} transacciones/mes`)
    } else if (limitations.transacciones_mes === -1) {
      items.push('Transacciones ilimitadas')
    }
    
    if (limitations.consultas_ia_mes && limitations.consultas_ia_mes > 0) {
      items.push(`${limitations.consultas_ia_mes} consultas IA/mes`)
    } else if (limitations.consultas_ia_mes === -1) {
      items.push('IA ilimitada')
    }
    
    if (limitations.modo_familiar) {
      items.push('Modo familiar habilitado')
    }
    
    if (limitations.alertas_automaticas) {
      items.push('Alertas automáticas')
    }
    
    return items
  }

  if (loading || !show || !planData) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg mx-auto shadow-2xl border-2">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Sparkles className="h-8 w-8 text-emerald-500" />
            <CardTitle className="text-2xl">¡Bienvenido a FinanzIA!</CardTitle>
          </div>
          <CardDescription className="text-base">
            Tu cuenta ha sido creada exitosamente
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Información del Plan */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              {getPlanIcon(planData.nombre)}
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  Plan {planData.nombre}
                  {planData.esPago && (
                    <Badge className="bg-amber-500">Premium</Badge>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {planData.esPago 
                    ? `$${planData.precioMensual?.toFixed(2)}/mes` 
                    : 'Completamente gratis'
                  }
                </p>
              </div>
            </div>
            
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              {planData.descripcion}
            </p>

            {/* Características principales */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Lo que incluye tu plan:</h4>
              <div className="grid gap-1">
                {getPlanLimitations(planData).map((limit, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{limit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Acciones según el tipo de plan */}
          {planData.esPago ? (
            <Alert className="border-amber-200 bg-amber-50 text-amber-800">
              <CreditCard className="h-4 w-4" />
              <AlertDescription>
                <strong>Plan de pago seleccionado:</strong> Podrás gestionar tu suscripción desde tu perfil cuando estés listo.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Plan gratuito activado:</strong> ¡Empieza a usar todas las funcionalidades básicas ahora mismo!
              </AlertDescription>
            </Alert>
          )}

          {/* Próximos pasos */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Próximos pasos sugeridos:
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>Crear tu primera transacción</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>Configurar tus categorías personalizadas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>Crear tu primer presupuesto mensual</span>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3">
            <Button onClick={handleComplete} className="flex-1">
              Empezar a usar FinanzIA
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            {planData.esPago && (
              <Link href="/planes">
                <Button variant="outline" size="sm">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Gestionar
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 