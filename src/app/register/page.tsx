"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Gift, Zap, ArrowLeft, ArrowRight } from "lucide-react"

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
}

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: Info personal, 2: Selección de plan
  const [planes, setPlanes] = useState<Plan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string>("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: ""
  })

  // Cargar planes al montar el componente
  useEffect(() => {
    const fetchPlanes = async () => {
      try {
        const response = await fetch('/api/planes')
        if (response.ok) {
          const data = await response.json()
          // Filtrar solo los planes públicos y ordenar
          const planesPublicos = data.filter((p: Plan) => 
            !p.nombre.toLowerCase().includes('lifetime') && 
            !p.nombre.toLowerCase().includes('vida')
          ).sort((a: Plan, b: Plan) => (a.ordenDisplay || 0) - (b.ordenDisplay || 0))
          
          setPlanes(planesPublicos)
          
          // Pre-seleccionar el plan gratuito por defecto
          const planGratuito = planesPublicos.find((p: Plan) => !p.esPago)
          if (planGratuito) {
            setSelectedPlan(planGratuito.id)
          }
        }
      } catch (error) {
        console.error('Error cargando planes:', error)
      }
    }

    fetchPlanes()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleStepOne = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setStep(2) // Avanzar a selección de plan
  }

  const handleSubmit = async () => {
    if (!selectedPlan) {
      setError("Debes seleccionar un plan")
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          planId: selectedPlan
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al registrar usuario")
      }

      // Redirigir al login después de un registro exitoso
      router.push("/login?registered=true")
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Ocurrió un error durante el registro")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getPlanIcon = (planNombre: string) => {
    const nombre = planNombre.toLowerCase()
    if (nombre.includes('premium')) return <Crown className="h-5 w-5" />
    if (nombre.includes('básico') || nombre.includes('basico')) return <Zap className="h-5 w-5" />
    return <Gift className="h-5 w-5" />
  }

  const getPlanFeatures = (plan: Plan) => {
    if (!plan.features) return []
    
    // Extraer características del campo features
    const features = plan.features.split(',').map(f => f.trim())
    return features.slice(0, 4) // Mostrar solo las primeras 4
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="w-full max-w-4xl space-y-8">
        
        {step === 1 ? (
          // PASO 1: Información Personal
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg max-w-md mx-auto">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Crear cuenta</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Paso 1 de 2: Información personal</p>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4">
                {error}
              </div>
            )}

            <form onSubmit={handleStepOne} className="mt-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="dark:bg-gray-700"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="dark:bg-gray-700"
                    placeholder="tu@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Teléfono (con código de país)</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    pattern="^\+[0-9]{10,15}$"
                    title="Ingresa el número con código de país (ej: +54911234567)"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="dark:bg-gray-700"
                    placeholder="+54911234567"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="dark:bg-gray-700"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="dark:bg-gray-700"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Continuar a Selección de Plan
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
              ¿Ya tienes una cuenta?{" "}
              <Button
                variant="link"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                onClick={() => router.push("/login")}
              >
                Inicia sesión
              </Button>
            </p>
          </div>
        ) : (
          // PASO 2: Selección de Plan
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Elige tu Plan</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Paso 2 de 2: Selecciona el plan que mejor se adapte a tus necesidades</p>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {planes.map((plan) => (
                <Card 
                  key={plan.id} 
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedPlan === plan.id 
                      ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg transform scale-105' 
                      : 'hover:shadow-md hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <CardHeader className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {getPlanIcon(plan.nombre)}
                      <CardTitle className="text-xl">{plan.nombre}</CardTitle>
                      {selectedPlan === plan.id && (
                        <Badge className="bg-blue-500">Seleccionado</Badge>
                      )}
                    </div>
                    <div className="text-2xl font-bold" style={{ color: plan.colorHex }}>
                      {plan.esPago ? `$${plan.precioMensual?.toFixed(2)}/mes` : 'Gratis'}
                    </div>
                    <CardDescription>{plan.descripcion}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {getPlanFeatures(plan).map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !selectedPlan}
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              >
                {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
                {!isLoading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>

            {selectedPlan && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {planes.find(p => p.id === selectedPlan)?.esPago 
                    ? "Podrás gestionar tu suscripción después del registro"
                    : "Podrás actualizar tu plan en cualquier momento desde tu perfil"
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 