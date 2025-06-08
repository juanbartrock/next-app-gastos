'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, Crown, Zap, ArrowUp } from 'lucide-react'
import { usePlanLimits, useFeatureAccess } from '@/hooks/usePlanLimits'

// ✅ COMPONENTE DE ADVERTENCIA DE LÍMITES
interface LimitWarningProps {
  feature: string
  showProgress?: boolean
  showUpgradeButton?: boolean
  className?: string
}

export function LimitWarning({ 
  feature, 
  showProgress = true, 
  showUpgradeButton = true,
  className = ""
}: LimitWarningProps) {
  const { allowed, limit, needsUpgrade, upgradeMessage, loading } = useFeatureAccess(feature)

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 h-16 rounded-lg ${className}`} />
    )
  }

  if (allowed && !needsUpgrade) {
    return null // No mostrar nada si está permitido
  }

  const progressPercentage = limit.limit > 0 ? (limit.usage / limit.limit) * 100 : 0
  const isNearLimit = progressPercentage >= 80
  const isAtLimit = progressPercentage >= 100

  return (
    <Alert className={`border-orange-200 bg-orange-50 dark:bg-orange-950 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
            {upgradeMessage}
          </span>
          <Badge variant={isAtLimit ? "destructive" : "secondary"}>
            {limit.usage}/{limit.limit === -1 ? '∞' : limit.limit}
          </Badge>
        </div>

        {showProgress && limit.limit > 0 && (
          <div className="space-y-1">
            <Progress 
              value={progressPercentage} 
              className="h-2"
              // @ts-ignore - Progress component styling
              indicatorClassName={isAtLimit ? "bg-red-500" : isNearLimit ? "bg-orange-500" : "bg-blue-500"}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Usado: {limit.usage}</span>
              <span>Restante: {limit.remaining}</span>
            </div>
          </div>
        )}

        {showUpgradeButton && (
          <div className="flex gap-2">
            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Crown className="h-3 w-3 mr-1" />
              Upgrade Plan
            </Button>
            <Button size="sm" variant="outline">
              Ver Planes
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}

// ✅ COMPONENTE COMPACTO PARA MOSTRAR EN HEADERS
interface LimitBadgeProps {
  feature: string
  showIcon?: boolean
}

export function LimitBadge({ feature, showIcon = true }: LimitBadgeProps) {
  const { allowed, limit, needsUpgrade } = useFeatureAccess(feature)

  if (allowed && !needsUpgrade) {
    return null
  }

  const progressPercentage = limit.limit > 0 ? (limit.usage / limit.limit) * 100 : 0
  const isAtLimit = progressPercentage >= 100

  return (
    <Badge 
      variant={isAtLimit ? "destructive" : "secondary"}
      className="text-xs"
    >
      {showIcon && <AlertTriangle className="h-3 w-3 mr-1" />}
      {limit.usage}/{limit.limit === -1 ? '∞' : limit.limit}
    </Badge>
  )
}

// ✅ COMPONENTE PARA MOSTRAR ESTADO GENERAL DEL PLAN
export function PlanStatusCard() {
  const { plan, needsUpgrade, blockedFeatures, loading } = usePlanLimits()

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-32 rounded-lg" />
    )
  }

  const planConfig = {
    gratuito: {
      name: 'Plan Gratuito',
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      icon: '🆓',
      nextPlan: 'Básico ($4.99/mes)'
    },
    basico: {
      name: 'Plan Básico',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      icon: '💎',
      nextPlan: 'Premium ($9.99/mes)'
    },
    premium: {
      name: 'Plan Premium',
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      icon: '🔥',
      nextPlan: null
    }
  }

  const currentPlan = planConfig[plan]

  return (
    <div className={`p-4 rounded-lg border ${currentPlan.color}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{currentPlan.icon}</span>
          <h3 className="font-semibold">{currentPlan.name}</h3>
        </div>
        {plan !== 'premium' && (
          <Button size="sm" variant="outline">
            <ArrowUp className="h-3 w-3 mr-1" />
            Upgrade
          </Button>
        )}
      </div>

      {needsUpgrade && (
        <div className="space-y-2">
          <p className="text-sm opacity-80">
            Tienes {blockedFeatures.length} funcionalidades bloqueadas
          </p>
          {currentPlan.nextPlan && (
            <p className="text-xs">
              Upgrade a {currentPlan.nextPlan} para desbloquear más funcionalidades
            </p>
          )}
        </div>
      )}

      {!needsUpgrade && plan === 'premium' && (
        <p className="text-sm opacity-80">
          ¡Tienes acceso completo a todas las funcionalidades! 🎉
        </p>
      )}
    </div>
  )
}

// ✅ COMPONENTE PARA VALIDAR ANTES DE CREAR
interface CreateValidationProps {
  feature: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function CreateValidation({ feature, children, fallback }: CreateValidationProps) {
  const { allowed, upgradeMessage } = useFeatureAccess(feature)

  if (!allowed) {
    return (
      fallback || (
        <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950">
          <Crown className="h-4 w-4 text-orange-600" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                {upgradeMessage}
              </p>
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Zap className="h-3 w-3 mr-1" />
                Upgrade Ahora
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )
    )
  }

  return <>{children}</>
} 