'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Logo } from "@/components/ui/logo"
import { 
  ArrowRight, 
  TrendingUp, 
  DollarSign, 
  Shield, 
  Users, 
  Clock, 
  Crown,
  Check,
  Star,
  BarChart3,
  Target,
  Calendar,
  Bell,
  CreditCard,
  PiggyBank,
  Smartphone,
  Zap,
  Gift,
  ChevronRight,
  Eye,
  AlertCircle,
  Calculator
} from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Flujo Smart: Usuario logueado → home
  useEffect(() => {
    if (status === 'loading') return
    
    if (session) {
      // Verificar si viene de login para redirigir al home
      const fromLogin = typeof window !== 'undefined' ? sessionStorage.getItem('fromLogin') : null
      if (fromLogin) {
        sessionStorage.removeItem('fromLogin')
        router.replace('/home')
      } else {
        // Si no viene de login pero está logueado, ir al dashboard directamente
        router.replace('/dashboard')
      }
    }
  }, [session, status, router])

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  // Si hay sesión, no mostrar nada (redirigiendo)
  if (session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <Logo size="md" showText={false} />
              <span className="font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">FinanzIA</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link href="#funcionalidades" className="transition-colors hover:text-foreground/80 text-gray-600 hover:text-emerald-600">
                Funcionalidades
              </Link>
              <Link href="#beneficios" className="transition-colors hover:text-foreground/80 text-gray-600 hover:text-emerald-600">
                Beneficios
              </Link>
              <Link href="/planes" className="transition-colors hover:text-foreground/80 text-gray-600 hover:text-emerald-600">
                Planes
              </Link>
            </nav>
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost">Iniciar Sesión</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700">
                  Empezar Gratis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container px-4 py-2 md:py-3 lg:py-4">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="text-center lg:text-left space-y-8">
            <div className="space-y-4">
              <Badge className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white border-0 text-sm px-4 py-2">
                🚀 Control Total de tus Finanzas
              </Badge>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Toma control total
                <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent"> de tu dinero</span>
              </h1>
              <p className="mx-auto max-w-[600px] text-xl text-gray-600 dark:text-gray-300 lg:mx-0 leading-relaxed">
                La herramienta más completa para gestionar tus gastos, presupuestos y finanzas familiares. 
                <strong> Sin sorpresas, sin estrés, con total control.</strong>
              </p>
            </div>

            <div className="flex flex-col gap-4 min-[400px]:flex-row lg:justify-start">
              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white border-0 px-8 py-3 text-lg font-semibold shadow-xl">
                  Empezar Gratis Ahora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#funcionalidades">
                <Button variant="outline" size="lg" className="border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-6 py-3 text-lg">
                  Ver Funcionalidades
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Formas de Carga */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4 text-center lg:text-left">Carga tus gastos como más te convenga:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center lg:text-left">
                <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                  <span className="text-lg">💬</span>
                  <span className="text-sm font-medium text-green-700">WhatsApp</span>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                  <span className="text-lg">🎤</span>
                  <span className="text-sm font-medium text-blue-700">Por Voz</span>
                </div>
                <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg">
                  <span className="text-lg">📸</span>
                  <span className="text-sm font-medium text-purple-700">Foto Ticket</span>
                </div>
                <div className="flex items-center gap-2 bg-orange-50 px-3 py-2 rounded-lg">
                  <span className="text-lg">⌨️</span>
                  <span className="text-sm font-medium text-orange-700">Manual</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="lg:order-last">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-blue-400/20 blur-3xl" />
              <Card className="relative overflow-hidden border-2 shadow-2xl bg-white/90 backdrop-blur">
                <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-b">
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <PiggyBank className="h-5 w-5 text-emerald-600" />
                    Tu Dashboard Personal
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Balance Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg">
                      <div className="text-sm text-emerald-700 font-medium">Balance Actual</div>
                      <div className="text-2xl font-bold text-emerald-600">$125,450</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                      <div className="text-sm text-blue-700 font-medium">Ahorrado este mes</div>
                      <div className="text-2xl font-bold text-blue-600">$18,200</div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Presupuesto de Enero</span>
                      <span className="text-emerald-600 font-medium">67% usado</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-gradient-to-r from-emerald-500 to-blue-500 h-3 rounded-full" style={{ width: '67%' }} />
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-700">Últimas transacciones</div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">🛒 Supermercado</span>
                        <span className="font-medium">-$4,500</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">💰 Sueldo</span>
                        <span className="font-medium text-emerald-600">+$75,000</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">🏠 Alquiler</span>
                        <span className="font-medium">-$45,000</span>
                      </div>
                    </div>
                  </div>

                  {/* Smart Alert */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-amber-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">¡Te quedan $8,500 para gastos variables!</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="container px-4 py-16 bg-gray-50 dark:bg-gray-900 rounded-3xl mx-auto my-16">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-gray-800 dark:text-white">
            ¿Te suena familiar?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="text-center space-y-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Se te acaba la plata</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                "No sabía que había gastado tanto este mes"
              </p>
            </div>

            <div className="text-center space-y-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Gastos sorpresa</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                "Se me olvidó pagar el seguro del auto"
              </p>
            </div>

            <div className="text-center space-y-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <Calculator className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Planificar es difícil</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                "No sé cuánto puedo gastar en vacaciones"
              </p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl text-white">
            <h3 className="text-xl font-bold mb-2">¡Ya no más!</h3>
            <p className="text-emerald-100">
              Con FinanzIA tienes control total sobre tu dinero, sabes exactamente cuánto puedes gastar y recibes alertas antes de que sea tarde.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funcionalidades" className="container px-4 py-16">
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Todo lo que necesitas en
            <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent"> una sola app</span>
          </h2>
          <p className="mx-auto max-w-[700px] text-xl text-gray-600 dark:text-gray-300">
            Desde gastos diarios hasta planificación familiar. Sin complicaciones, sin configuraciones eternas.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {/* Feature 1 */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-emerald-200">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-xl">Control de Gastos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Registra gastos en segundos. Ve exactamente en qué gastas tu dinero con categorías automáticas.
              </p>
              <div className="flex items-center text-sm text-emerald-600 font-medium">
                <Check className="h-4 w-4 mr-2" />
                Registro súper rápido
              </div>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-xl">Presupuestos Inteligentes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Crea presupuestos que realmente funcionen. Te avisamos antes de que te pases del límite.
              </p>
              <div className="flex items-center text-sm text-blue-600 font-medium">
                <Check className="h-4 w-4 mr-2" />
                Alertas automáticas
              </div>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-200">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-xl">Gastos Recurrentes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Nunca más olvides pagar el alquiler, seguros o servicios. Todo automatizado y bajo control.
              </p>
              <div className="flex items-center text-sm text-purple-600 font-medium">
                <Check className="h-4 w-4 mr-2" />
                Seguimiento automático
              </div>
            </CardContent>
          </Card>

          {/* Feature 4 */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-emerald-200">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-xl">Finanzas Familiares</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Comparte gastos con tu familia. Ve quién gasta qué y mantén todo organizado.
              </p>
              <div className="flex items-center text-sm text-emerald-600 font-medium">
                <Check className="h-4 w-4 mr-2" />
                Modo familiar completo
              </div>
            </CardContent>
          </Card>

          {/* Feature 5 */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-orange-200">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-xl">Alertas Inteligentes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Te avisamos antes de que te quedes sin dinero, cuando lleguen vencimientos importantes.
              </p>
              <div className="flex items-center text-sm text-orange-600 font-medium">
                <Check className="h-4 w-4 mr-2" />
                Prevención de problemas
              </div>
            </CardContent>
          </Card>

          {/* Feature 6 */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-indigo-200">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-xl">Análisis y Reportes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Entiende tus patrones de gasto. Reportes claros que te ayudan a tomar mejores decisiones.
              </p>
              <div className="flex items-center text-sm text-indigo-600 font-medium">
                <Check className="h-4 w-4 mr-2" />
                Insights automáticos
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="container px-4 py-16 bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl mx-auto my-16">
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Lo que lograrás con
            <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent"> FinanzIA</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Eye className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Transparencia Total</h3>
                <p className="text-gray-600">Sabes exactamente dónde va cada peso. No más "¿en qué gasté tanto?"</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Cero Sorpresas</h3>
                <p className="text-gray-600">Alertas antes de que se venza algo importante o antes de quedarte sin presupuesto.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <PiggyBank className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Ahorro Automático</h3>
                <p className="text-gray-600">Identifica automáticamente oportunidades de ahorro y optimiza tus gastos.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Ahorra Tiempo</h3>
                <p className="text-gray-600">5 minutos por semana vs. horas calculando con Excel. Tu tiempo vale más.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <h3 className="text-2xl font-bold mb-6 text-center">Tu situación antes vs. después</h3>
            
            <div className="space-y-6">
              <div className="border-l-4 border-red-500 pl-4 bg-red-50 p-4 rounded-r-lg">
                <h4 className="font-semibold text-red-800">😰 Antes</h4>
                <p className="text-red-700 text-sm">Estrés por no saber cuánto dinero tienes disponible</p>
              </div>
              
              <div className="border-l-4 border-emerald-500 pl-4 bg-emerald-50 p-4 rounded-r-lg">
                <h4 className="font-semibold text-emerald-800">😌 Después</h4>
                <p className="text-emerald-700 text-sm">Tranquilidad total sabiendo tu situación financiera en tiempo real</p>
              </div>

              <div className="border-l-4 border-red-500 pl-4 bg-red-50 p-4 rounded-r-lg">
                <h4 className="font-semibold text-red-800">😱 Antes</h4>
                <p className="text-red-700 text-sm">Sorpresas de gastos que olvidaste presupuestar</p>
              </div>
              
              <div className="border-l-4 border-emerald-500 pl-4 bg-emerald-50 p-4 rounded-r-lg">
                <h4 className="font-semibold text-emerald-800">🎯 Después</h4>
                <p className="text-emerald-700 text-sm">Todo planificado y bajo control con alertas automáticas</p>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section className="container px-4 py-16">
        <div className="text-center space-y-8 max-w-3xl mx-auto bg-gradient-to-r from-emerald-500 to-blue-500 rounded-3xl p-12 text-white">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Empieza a tener control total
            <span className="block">de tu dinero HOY</span>
          </h2>
          <p className="text-xl text-emerald-100 leading-relaxed">
            No esperes a fin de mes para darte cuenta de que gastaste de más. 
            <strong>Toma control ahora mismo.</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50 border-0 px-10 py-4 text-lg font-semibold shadow-xl">
                Registrarme Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-sm text-emerald-100">
              ✨ Sin tarjeta de crédito · Sin configuración compleja · Sin letra chica
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="container flex flex-col items-center justify-center gap-6 py-16">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Logo size="md" showText={false} />
              <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                FinanzIA
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              Control total de tus finanzas personales
            </p>
          </div>
          <div className="flex items-center space-x-8 text-sm">
            <span className="text-gray-500">© 2025</span>
            <Link href="/privacy" className="text-gray-500 hover:text-emerald-600 transition-colors">
              Privacidad
            </Link>
            <Link href="/terms" className="text-gray-500 hover:text-emerald-600 transition-colors">
              Términos
            </Link>
            <Link href="/contact" className="text-gray-500 hover:text-emerald-600 transition-colors">
              Contacto
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
} 