'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

// ✅ TIPOS PARA EL HOOK
export interface PlanLimitsStatus {
  plan: 'gratuito' | 'basico' | 'premium'
  limits: Record<string, {
    allowed: boolean
    limit: number
    usage: number
    remaining: number
  }>
  needsUpgrade: boolean
  blockedFeatures: string[]
  loading: boolean
  error: string | null
}

// ✅ HOOK PARA GESTIONAR LÍMITES DE PLANES
export function usePlanLimits() {
  const { data: session } = useSession()
  const [status, setStatus] = useState<PlanLimitsStatus>({
    plan: 'gratuito',
    limits: {},
    needsUpgrade: false,
    blockedFeatures: [],
    loading: true,
    error: null
  })

  // Cargar estado de límites
  const loadLimitsStatus = async () => {
    if (!session?.user?.id) {
      setStatus(prev => ({ ...prev, loading: false }))
      return
    }

    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }))
      
      const response = await fetch('/api/user/plan-limits')
      const data = await response.json()

      if (response.ok) {
        setStatus({
          ...data,
          loading: false,
          error: null
        })
      } else {
        setStatus(prev => ({
          ...prev,
          loading: false,
          error: data.error || 'Error cargando límites'
        }))
      }
    } catch (error) {
      console.error('Error cargando límites:', error)
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: 'Error de conexión'
      }))
    }
  }

  // Cargar al montar y cuando cambie la sesión
  useEffect(() => {
    loadLimitsStatus()
  }, [session?.user?.id])

  // Verificar si puede usar una funcionalidad específica
  const canUse = (feature: string): boolean => {
    return status.limits[feature]?.allowed ?? false
  }

  // Obtener información de un límite específico
  const getLimit = (feature: string) => {
    return status.limits[feature] || {
      allowed: false,
      limit: 0,
      usage: 0,
      remaining: 0
    }
  }

  // Verificar si necesita upgrade para una funcionalidad
  const needsUpgradeFor = (feature: string): boolean => {
    return !canUse(feature)
  }

  // Obtener mensaje de upgrade
  const getUpgradeMessage = (feature: string): string => {
    const messages: Record<string, Record<string, string>> = {
      gratuito: {
        transacciones_mes: 'Alcanzaste el límite de 50 transacciones. Upgrade al Plan Básico para transacciones ilimitadas.',
        gastos_recurrentes: 'Puedes tener hasta 2 gastos recurrentes. Upgrade al Plan Básico para 10 gastos recurrentes.',
        consultas_ia_mes: 'Alcanzaste las 3 consultas IA mensuales. Upgrade al Plan Básico para 15 consultas.',
        modo_familiar: 'El modo familiar requiere Plan Básico o superior.',
        prestamos_inversiones: 'Préstamos e inversiones requieren Plan Premium.',
        exportacion: 'La exportación requiere Plan Básico o superior.'
      },
      basico: {
        gastos_recurrentes: 'Alcanzaste el límite de 10 gastos recurrentes. Upgrade al Plan Premium para gastos ilimitados.',
        consultas_ia_mes: 'Alcanzaste las 15 consultas IA mensuales. Upgrade al Plan Premium para consultas ilimitadas.',
        prestamos_inversiones: 'Préstamos e inversiones requieren Plan Premium.',
        tareas: 'El sistema de tareas requiere Plan Premium.'
      }
    }

    return messages[status.plan]?.[feature] || 'Esta funcionalidad requiere un plan superior.'
  }

  // Formatear límite para mostrar
  const formatLimit = (limit: number | boolean): string => {
    if (limit === -1) return 'Ilimitado'
    if (typeof limit === 'boolean') return limit ? 'Incluido' : 'No incluido'
    return limit.toString()
  }

  // Recargar límites (útil después de crear transacciones, etc.)
  const refresh = () => {
    loadLimitsStatus()
  }

  return {
    ...status,
    canUse,
    getLimit,
    needsUpgradeFor,
    getUpgradeMessage,
    formatLimit,
    refresh
  }
}

// ✅ HOOK ESPECÍFICO PARA VERIFICAR UNA FUNCIONALIDAD
export function useFeatureAccess(feature: string) {
  const { canUse, getLimit, needsUpgradeFor, getUpgradeMessage, loading } = usePlanLimits()

  return {
    allowed: canUse(feature),
    limit: getLimit(feature),
    needsUpgrade: needsUpgradeFor(feature),
    upgradeMessage: getUpgradeMessage(feature),
    loading
  }
}

// ✅ HOOK PARA VALIDAR ANTES DE CREAR ALGO
export function useCreateValidation(feature: string) {
  const { canUse, getLimit, getUpgradeMessage, refresh } = usePlanLimits()

  const validateCreate = (): { allowed: boolean; message?: string } => {
    if (!canUse(feature)) {
      return {
        allowed: false,
        message: getUpgradeMessage(feature)
      }
    }

    const limit = getLimit(feature)
    if (limit.limit > 0 && limit.usage >= limit.limit) {
      return {
        allowed: false,
        message: getUpgradeMessage(feature)
      }
    }

    return { allowed: true }
  }

  return {
    validateCreate,
    refresh
  }
} 