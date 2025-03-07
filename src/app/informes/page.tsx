"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BarChart3, LineChart, PieChart } from "lucide-react"

export default function InformesPage() {
  const router = useRouter()

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 py-6 md:px-6 bg-background border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push('/?dashboard=true')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Informes Financieros</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-muted-foreground mb-8">
            Visualiza y analiza tus finanzas a través de diferentes informes y gráficos.
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">
                  Gastos por Categoría
                </CardTitle>
                <PieChart className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="h-52 flex items-center justify-center text-muted-foreground border rounded-md">
                  Aquí se mostrará la distribución de gastos por categoría
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => alert("Funcionalidad en desarrollo")}
                >
                  Ver detalle
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">
                  Evolución Mensual
                </CardTitle>
                <LineChart className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="h-52 flex items-center justify-center text-muted-foreground border rounded-md">
                  Aquí se visualizará la evolución de ingresos y gastos
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => alert("Funcionalidad en desarrollo")}
                >
                  Ver detalle
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">
                  Análisis Comparativo
                </CardTitle>
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="h-52 flex items-center justify-center text-muted-foreground border rounded-md">
                  Aquí podrás comparar períodos financieros
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => alert("Funcionalidad en desarrollo")}
                >
                  Ver detalle
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
} 