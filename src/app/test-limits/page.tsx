'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { usePlanLimits, useFeatureAccess } from "@/hooks/usePlanLimits"
import { LimitWarning, LimitBadge, PlanStatusCard, CreateValidation } from "@/components/limits/LimitWarning"
import { Crown, Zap } from "lucide-react"

export default function TestLimitsPage() {
  const { plan, limits, needsUpgrade, blockedFeatures, loading, refresh } = usePlanLimits()

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🧪 Prueba del Sistema de Límites</h1>
          <p className="text-muted-foreground">
            Verificar que la validación de límites de planes funciona correctamente
          </p>
        </div>
        <Button onClick={refresh} variant="outline">
          🔄 Recargar Límites
        </Button>
      </div>

      {/* Estado del Plan */}
      <PlanStatusCard />

      {/* Información General */}
      <Card>
        <CardHeader>
          <CardTitle>Estado Actual del Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-lg p-2">
              Plan: {plan}
            </Badge>
            {needsUpgrade && (
              <Badge variant="destructive">
                {blockedFeatures.length} funcionalidades bloqueadas
              </Badge>
            )}
          </div>
          
          {blockedFeatures.length > 0 && (
            <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                Funcionalidades Bloqueadas:
              </h4>
              <div className="flex flex-wrap gap-2">
                {blockedFeatures.map(feature => (
                  <Badge key={feature} variant="outline" className="text-orange-700">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pruebas de Límites Específicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Transacciones */}
        <TestFeatureCard 
          feature="transacciones_mes"
          title="💰 Transacciones Mensuales"
          description="Límite de transacciones que puedes crear cada mes"
        />

        {/* Gastos Recurrentes */}
        <TestFeatureCard 
          feature="gastos_recurrentes"
          title="🔄 Gastos Recurrentes"
          description="Cantidad de gastos recurrentes que puedes configurar"
        />

        {/* Consultas IA */}
        <TestFeatureCard 
          feature="consultas_ia_mes"
          title="🤖 Consultas IA"
          description="Consultas mensuales al asistente de inteligencia artificial"
        />

        {/* Modo Familiar */}
        <TestFeatureCard 
          feature="modo_familiar"
          title="👨‍👩‍👧‍👦 Modo Familiar"
          description="Acceso a funcionalidades familiares compartidas"
        />

        {/* Préstamos e Inversiones */}
        <TestFeatureCard 
          feature="prestamos_inversiones"
          title="📈 Préstamos e Inversiones"
          description="Gestión avanzada de préstamos e inversiones"
        />

        {/* Exportación */}
        <TestFeatureCard 
          feature="exportacion"
          title="📊 Exportación"
          description="Exportar datos a CSV, Excel y otros formatos"
        />
      </div>

      {/* Ejemplos de Componentes */}
      <Card>
        <CardHeader>
          <CardTitle>Ejemplos de Componentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Advertencia Completa */}
          <div>
            <h4 className="font-semibold mb-2">LimitWarning - Advertencia Completa</h4>
            <LimitWarning feature="transacciones_mes" />
          </div>

          {/* Validación para Crear */}
          <div>
            <h4 className="font-semibold mb-2">CreateValidation - Validar Antes de Crear</h4>
            <CreateValidation feature="modo_familiar">
              <Button className="gap-2">
                <Crown className="h-4 w-4" />
                Activar Modo Familiar
              </Button>
            </CreateValidation>
          </div>

          {/* Validación IA */}
          <div>
            <h4 className="font-semibold mb-2">CreateValidation - Consulta IA</h4>
            <CreateValidation feature="consultas_ia_mes">
              <Button className="gap-2">
                <Zap className="h-4 w-4" />
                Hacer Consulta IA
              </Button>
            </CreateValidation>
          </div>

        </CardContent>
      </Card>

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>🔍 Debug - Información Técnica</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify({ plan, limits, needsUpgrade, blockedFeatures }, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente auxiliar para probar cada funcionalidad
function TestFeatureCard({ 
  feature, 
  title, 
  description 
}: { 
  feature: string
  title: string
  description: string
}) {
  const { allowed, limit, needsUpgrade, upgradeMessage } = useFeatureAccess(feature)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <LimitBadge feature={feature} />
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Estado */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Estado:</span>
            <Badge variant={allowed ? "default" : "destructive"} className="ml-2">
              {allowed ? "Permitido" : "Bloqueado"}
            </Badge>
          </div>
          <div>
            <span className="font-medium">Límite:</span>
            <span className="ml-2">
              {limit.limit === -1 ? "Ilimitado" : limit.limit}
            </span>
          </div>
          <div>
            <span className="font-medium">Uso:</span>
            <span className="ml-2">{limit.usage}</span>
          </div>
          <div>
            <span className="font-medium">Restante:</span>
            <span className="ml-2">
              {limit.remaining === -1 ? "Ilimitado" : limit.remaining}
            </span>
          </div>
        </div>

        {/* Mensaje de Upgrade */}
        {needsUpgrade && (
          <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded border border-orange-200">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              {upgradeMessage}
            </p>
          </div>
        )}

        {/* Advertencia Específica */}
        <LimitWarning 
          feature={feature} 
          showProgress={typeof limit.limit === 'number' && limit.limit > 0}
          showUpgradeButton={false}
        />
        
      </CardContent>
    </Card>
  )
} 