"use client"

import { FinancialAdvisor } from "@/components/FinancialAdvisor"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect } from "react"

export default function FinancialAdvisorPage() {
  const router = useRouter()
  const { status } = useSession()

  // Redireccionar si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Función para volver al dashboard
  const goBack = () => {
    router.back()
  }

  if (status === "loading") {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-300"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 h-screen flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-1" 
          onClick={goBack}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver</span>
        </Button>
        <h1 className="text-2xl font-bold flex items-center">
          <Bot className="h-6 w-6 mr-2 text-primary" />
          Asesor Financiero
        </h1>
        <div className="w-24"></div> {/* Espacio para centrar el título */}
      </div>

      <Card className="flex-1 shadow-lg">
        <CardHeader className="bg-primary/5 dark:bg-primary/10 rounded-t-lg">
          <CardTitle className="text-xl">Consulta con tu asesor financiero personal</CardTitle>
          <CardDescription>
            Pregunta sobre finanzas personales, ahorro, inversiones, presupuestos y más
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[calc(100vh-280px)] md:h-[calc(100vh-240px)]">
            <FinancialAdvisor />
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>Recuerda que este asesor proporciona información general sobre finanzas.</p>
        <p>Para asesoramiento financiero personalizado, consulta con un profesional.</p>
      </div>
    </div>
  )
} 