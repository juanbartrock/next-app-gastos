"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, 
  Construction, 
  AlertTriangle,
  ArrowLeft,
  Clock,
  Database
} from "lucide-react"
import Link from "next/link"

export default function InformesDesactivados() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 py-6 md:px-6 bg-background border-b">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              Informes Financieros
            </h1>
            <p className="text-muted-foreground mt-1">
              Módulo temporalmente desactivado
            </p>
          </div>
          
          <Link href="/dashboard">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-orange-100 dark:bg-orange-900">
                  <Construction className="h-12 w-12 text-orange-600" />
                </div>
              </div>
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <Clock className="h-6 w-6" />
                Funcionalidad Temporalmente Desactivada
              </CardTitle>
              <CardDescription className="text-base mt-2">
                El módulo de informes ha sido desactivado temporalmente debido a problemas de rendimiento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Motivo de la desactivación */}
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 border rounded-lg bg-card">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-amber-700 dark:text-amber-300">
                      Problemas Identificados
                    </h3>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• Rediseño demasiado ambicioso con múltiples llamadas API simultáneas</li>
                      <li>• Problemas de timeout con base de datos Neon PostgreSQL</li>
                      <li>• Rendimiento deficiente en la carga de datos</li>
                      <li>• Múltiples gráficos complejos afectando la experiencia del usuario</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 border rounded-lg bg-card">
                  <Database className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-700 dark:text-blue-300">
                      Errores de Conexión
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Se detectaron múltiples errores de conexión con PostgreSQL y timeouts en las consultas, 
                      especialmente con las funciones de análisis complejas y carga de datos masivos.
                    </p>
                  </div>
                </div>
              </div>

              {/* Estado actual */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Estado Actual</h3>
                <div className="grid gap-2 md:grid-cols-2">
                  <Badge variant="destructive" className="justify-center py-2">
                    Informes Desactivados
                  </Badge>
                  <Badge variant="secondary" className="justify-center py-2">
                    En Planificación
                  </Badge>
                </div>
              </div>

              {/* Alternativas disponibles */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Alternativas Disponibles</h3>
                <div className="space-y-2">
                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full justify-start">
                      📊 Dashboard Principal - Métricas básicas
                    </Button>
                  </Link>
                  <Link href="/transacciones">
                    <Button variant="outline" className="w-full justify-start">
                      💰 Lista de Transacciones - Análisis manual
                    </Button>
                  </Link>
                  <Link href="/recurrentes">
                    <Button variant="outline" className="w-full justify-start">
                      🔄 Gastos Recurrentes - Seguimiento especializado
                    </Button>
                  </Link>
                  <Link href="/prestamos">
                    <Button variant="outline" className="w-full justify-start">
                      🏦 Préstamos - Análisis de deudas
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Cronograma futuro */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Próximos Pasos</h3>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    <strong>Enero 2025:</strong> Análisis de la solución óptima para informes
                  </p>
                  <p>
                    <strong>Futuro:</strong> Rediseño con enfoque en rendimiento y simplicidad
                  </p>
                  <p>
                    <strong>Consideraciones:</strong> Evaluación de alternativas de base de datos o optimización de consultas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 