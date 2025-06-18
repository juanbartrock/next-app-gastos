"use client"

import { useState, useEffect, Suspense } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle } from "lucide-react"
import { FcGoogle } from "react-icons/fc"

// Componente interno que usa useSearchParams
function LoginForm() {
  const router = useRouter()
  const { status } = useSession()
  const searchParams = useSearchParams()
  
  // Asegurarnos de que callbackUrl sea una ruta válida comenzando con "/"
  const callbackParam = searchParams.get("callbackUrl")
  const callbackUrl = callbackParam && callbackParam.startsWith("/") 
    ? callbackParam 
    : "/home"
    
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Verificar si viene del registro exitoso
  const registered = searchParams.get("registered")
  const needsPayment = searchParams.get("needsPayment")
  const planId = searchParams.get("planId")
  const emailFromParams = searchParams.get("email")

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (status === "authenticated") {
      router.push(callbackUrl)
    }
  }, [status, router, callbackUrl])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    let result: any = null; // Declaramos result fuera del try para usarlo en finally

    try {
      // Establecer indicador de que viene del login
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('fromLogin', 'true')
      }
      
      result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      })
      
      // Si es un login exitoso, marcar como primer login para mostrar bienvenida
      if (!result?.error && registered) {
        sessionStorage.setItem('firstLogin', 'true')
      }

      if (result?.error) {
        if (result.error === 'Usuario no encontrado') {
          setError("El usuario no existe. Por favor, regístrate primero.")
        } else if (result.error === 'Contraseña incorrecta') {
          setError("La contraseña es incorrecta. Inténtalo de nuevo.")
        } else {
          setError(result.error)
        }
      } else if (result?.ok) {
        // Login exitoso
        console.log("Login exitoso, redirigiendo a:", callbackUrl);
        setIsLoading(true) // Mantener el estado de carga durante la redirección
        
        // Si necesita pago, iniciar flujo de pago
        if (needsPayment && planId) {
          try {
            const pagoResponse = await fetch('/api/suscripciones/crear-pago', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                planId: planId,
                tipoPago: 'inicial'
              })
            })

            if (pagoResponse.ok) {
              const pagoData = await pagoResponse.json()
              
              if (pagoData.init_point) {
                // Redirigir a MercadoPago para completar el pago
                window.location.href = pagoData.init_point
                return
              }
            } else {
              console.error('Error iniciando pago:', await pagoResponse.text())
              // Si falla el pago, redirigir a planes
              router.replace("/planes?newUser=true&error=payment_failed")
              return
            }
          } catch (pagoError) {
            console.error('Error iniciando pago:', pagoError)
            // Si falla el pago, redirigir a planes
            router.replace("/planes?newUser=true&error=payment_failed")
            return
          }
        }
        
        // Redirigir normalmente si no necesita pago
        router.replace(callbackUrl);
        
        // Forzar refresh del estado de la sesión
        setTimeout(() => {
          window.location.href = callbackUrl;
        }, 200);
      }
    } catch (error) {
      console.error("Error durante login:", error);
      setError("Ocurrió un error al iniciar sesión")
    } finally {
      if (!result?.ok) {
        setIsLoading(false)
      }
    }
  }

  const handleGoogleLogin = () => {
    // Establecer indicador de que viene del login
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('fromLogin', 'true')
    }
    
    signIn("google", { callbackUrl })
  }

  // Si está cargando la sesión, mostrar un estado de carga
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Bienvenido</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Inicia sesión en tu cuenta</p>
        </div>

        {registered && needsPayment && (
          <Alert className="border-blue-200 bg-blue-50 text-blue-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              ¡Cuenta creada! Inicia sesión para completar el pago de tu plan seleccionado.
            </AlertDescription>
          </Alert>
        )}

        {registered && !needsPayment && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              ¡Cuenta creada exitosamente! Ya puedes iniciar sesión con tu plan seleccionado.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="dark:bg-gray-700"
                placeholder="tu@email.com"
                defaultValue={emailFromParams || ""}
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="dark:bg-gray-700"
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">O continúa con</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="mt-4 w-full"
            onClick={handleGoogleLogin}
          >
            <FcGoogle className="w-5 h-5 mr-2" />
            Google
          </Button>
        </div>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          ¿No tienes una cuenta?{" "}
          <Button
            variant="link"
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            onClick={() => router.push("/register")}
          >
            Regístrate
          </Button>
        </p>
      </div>
    </div>
  )
}

// Componente principal envuelto en Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <LoginForm />
    </Suspense>
  )
} 