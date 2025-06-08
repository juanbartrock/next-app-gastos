'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowRight, 
  TrendingUp, 
  Brain, 
  Shield, 
  Users, 
  Zap, 
  Crown,
  Check,
  Star,
  Clock,
  PiggyBank,
  CreditCard,
  BarChart3,
  Smartphone,
  Gift
} from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Flujo Smart: Usuario logueado → dashboard
  useEffect(() => {
    if (status === 'loading') return
    
    if (session) {
      router.push('/dashboard')
    }
  }, [session, status, router])

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Si hay sesión, no mostrar nada (redirigiendo)
  if (session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <PiggyBank className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">FinanzIA</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link href="#features" className="transition-colors hover:text-foreground/80 text-gray-600 hover:text-purple-600">
                Características
              </Link>
              <Link href="/planes" className="transition-colors hover:text-foreground/80 text-gray-600 hover:text-purple-600">
                Planes
              </Link>
            </nav>
            <div className="flex items-center space-x-2">
              {session ? (
                <Link href="/dashboard">
                  <Button>Ir al Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost">Iniciar Sesión</Button>
                  </Link>
                  <Link href="/register">
                    <Button>Registrarse</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container grid place-items-center gap-10 py-20 md:py-32 lg:grid-cols-2">
        <div className="text-center lg:text-start space-y-6">
          <div className="space-y-2">
            <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0 text-sm px-4 py-1">
              🤖 IA Financiera
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Tu futuro financiero
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent"> inteligente</span>
            </h1>
            <p className="mx-auto max-w-[600px] text-xl text-gray-600 dark:text-gray-300 lg:mx-0 leading-relaxed">
              FinanzIA usa inteligencia artificial para transformar cómo manejas tu dinero. 
              Predicciones precisas, alertas inteligentes, decisiones más acertadas.
            </p>
          </div>
          <div className="flex flex-col gap-4 min-[400px]:flex-row lg:justify-start">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 px-8 py-3 text-lg font-semibold shadow-xl">
                Empezar Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="border-2 border-purple-200 text-purple-700 hover:bg-purple-50 px-6 py-3 text-lg">
                Ver Demo
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-6 text-center lg:text-left mt-8">
            <div className="space-y-1">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">+1K</div>
              <div className="text-sm text-gray-500">Usuarios</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">98%</div>
              <div className="text-sm text-gray-500">Precisión IA</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">24/7</div>
              <div className="text-sm text-gray-500">Análisis</div>
            </div>
          </div>
        </div>
        <div className="lg:order-last">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl" />
            <Card className="relative overflow-hidden border-2 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Dashboard Financiero
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Balance este mes</span>
                    <span className="font-bold text-green-600">+$45,230</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Gastos totales</span>
                    <span className="font-bold">$234,560</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Objetivo de ahorro</span>
                      <span>75%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '75%' }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Brain className="h-3 w-3" />
                    IA sugiere: Reduce gastos en entretenimiento
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-24">
        <div className="text-center space-y-6 mb-20">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Potenciado por
            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent"> Inteligencia Artificial</span>
          </h2>
          <p className="mx-auto max-w-[700px] text-xl text-gray-600 dark:text-gray-300">
            Tecnología avanzada que aprende de tus hábitos y te ayuda a tomar mejores decisiones financieras.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {/* Feature 1 */}
          <div className="text-center space-y-4 group hover:scale-105 transition-transform duration-300">
            <div className="relative">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-shadow">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">IA Predictiva</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Algoritmos avanzados que predicen tus gastos futuros y detectan patrones ocultos en tus finanzas.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="text-center space-y-4 group hover:scale-105 transition-transform duration-300">
            <div className="relative">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-shadow">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Alertas Inteligentes</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Notificaciones proactivas que te alertan sobre gastos inusuales, límites de presupuesto y oportunidades de ahorro.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="text-center space-y-4 group hover:scale-105 transition-transform duration-300">
            <div className="relative">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-shadow">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Control Total</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Gestión familiar completa, gastos recurrentes automatizados y seguridad bancaria para proteger tus datos.
            </p>
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section className="container py-24">
        <div className="text-center space-y-8 max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Comienza tu revolución
            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent"> financiera</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
            Únete a la nueva generación de argentinos que gestiona sus finanzas con inteligencia artificial.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 px-10 py-4 text-lg font-semibold shadow-xl">
                Empezar Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-sm text-gray-500">
              ✨ Sin tarjeta de crédito · 100% gratis para siempre
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="container flex flex-col items-center justify-center gap-6 py-16">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <PiggyBank className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                FinanzIA
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              El futuro de las finanzas personales ya llegó
            </p>
          </div>
          <div className="flex items-center space-x-8 text-sm">
            <span className="text-gray-500">© 2025</span>
            <Link href="/privacy" className="text-gray-500 hover:text-purple-600 transition-colors">
              Privacidad
            </Link>
            <Link href="/terms" className="text-gray-500 hover:text-purple-600 transition-colors">
              Términos
            </Link>
            <Link href="/contact" className="text-gray-500 hover:text-purple-600 transition-colors">
              Contacto
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
} 