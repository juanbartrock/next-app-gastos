"use client"

import { ConfiguracionAlertas } from "@/components/alertas/ConfiguracionAlertas"
import { PageLayout } from "@/components/PageLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings } from "lucide-react"

export default function TestConfigAlertasPage() {
  return (
    <PageLayout>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Test - Configuración de Alertas
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Página de prueba para verificar la configuración de alertas
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuración de Alertas</CardTitle>
            <CardDescription>
              Test del componente de configuración de alertas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConfiguracionAlertas />
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
} 