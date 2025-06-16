"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, CreditCard, Plus } from "lucide-react"
import { useSession } from "next-auth/react"

export default function HomePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)

  const handleNavigation = (path: string) => {
    setLoading(true)
    
    // Manejo especial para la navegación al dashboard
    if (path === '/') {
      // Usar un parámetro en la URL para que el middleware no redirija
      router.replace('/?dashboard=true')
    } else {
      router.replace(path)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 py-6 md:px-6 bg-background border-b">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">FinanzIA</h1>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
        <div className="max-w-4xl w-full mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">
              ¡Bienvenido{session?.user?.name ? `, ${session.user.name}` : ""}!
            </h2>
            <p className="text-muted-foreground">
              Administra tus finanzas de manera fácil y eficiente
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleNavigation("/transacciones/nuevo")}>
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="mb-4 p-3 rounded-full bg-primary/10">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Registrar Movimiento</h3>
                <p className="text-muted-foreground">Añade un nuevo gasto o ingreso a tu registro</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleNavigation("/")}>
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="mb-4 p-3 rounded-full bg-primary/10">
                  <CreditCard className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Dashboard</h3>
                <p className="text-muted-foreground">Visualiza tu resumen financiero y últimas transacciones</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleNavigation("/informes")}>
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="mb-4 p-3 rounded-full bg-primary/10">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Informes</h3>
                <p className="text-muted-foreground">Analiza tus gastos e ingresos con gráficos detallados</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
} 