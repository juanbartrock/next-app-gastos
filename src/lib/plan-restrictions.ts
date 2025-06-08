import prisma from '@/lib/prisma'

// Tipos para las limitaciones de planes
export interface PlanLimitations {
  transacciones_mes: number
  usuarios_grupo: number
  alertas_activas: number
  categorias_personalizadas: number
  exportaciones_mes: number
  analisis_ia: boolean | string
  gastos_recurrentes: number
  storage_comprobantes_mb: number
}

// Límites por defecto para casos de error
const DEFAULT_LIMITS: PlanLimitations = {
  transacciones_mes: 10,
  usuarios_grupo: 1,
  alertas_activas: 1,
  categorias_personalizadas: 3,
  exportaciones_mes: 1,
  analisis_ia: false,
  gastos_recurrentes: 1,
  storage_comprobantes_mb: 5
}

/**
 * Obtiene las limitaciones del plan de un usuario
 */
export async function getUserPlanLimitations(userId: string): Promise<PlanLimitations> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        planId: true,
        plan: {
          select: {
            nombre: true,
            limitaciones: true
          }
        }
      }
    })

    if (!user?.plan?.limitaciones) {
      // Si no tiene plan o limitaciones, usar límites por defecto
      return DEFAULT_LIMITS
    }

    const limitations = user.plan.limitaciones as any
    
    return {
      transacciones_mes: limitations.transacciones_mes ?? DEFAULT_LIMITS.transacciones_mes,
      usuarios_grupo: limitations.usuarios_grupo ?? DEFAULT_LIMITS.usuarios_grupo,
      alertas_activas: limitations.alertas_activas ?? DEFAULT_LIMITS.alertas_activas,
      categorias_personalizadas: limitations.categorias_personalizadas ?? DEFAULT_LIMITS.categorias_personalizadas,
      exportaciones_mes: limitations.exportaciones_mes ?? DEFAULT_LIMITS.exportaciones_mes,
      analisis_ia: limitations.analisis_ia ?? DEFAULT_LIMITS.analisis_ia,
      gastos_recurrentes: limitations.gastos_recurrentes ?? DEFAULT_LIMITS.gastos_recurrentes,
      storage_comprobantes_mb: limitations.storage_comprobantes_mb ?? DEFAULT_LIMITS.storage_comprobantes_mb
    }
  } catch (error) {
    console.error('Error al obtener limitaciones del plan:', error)
    return DEFAULT_LIMITS
  }
}

/**
 * Verifica si un usuario puede realizar una acción específica
 */
export async function checkUserPermission(
  userId: string, 
  action: keyof PlanLimitations,
  currentUsage?: number
): Promise<{ allowed: boolean; limit: number; current: number; message?: string }> {
  
  const limitations = await getUserPlanLimitations(userId)
  const limit = limitations[action] as number | boolean
  
  // Si es -1 (ilimitado) o true, permitir
  if (limit === -1 || limit === true || limit === 'completo' || limit === 'basico') {
    return {
      allowed: true,
      limit: typeof limit === 'number' ? limit : -1,
      current: currentUsage ?? 0
    }
  }

  // Si es false o 0, no permitir
  if (limit === false || limit === 0) {
    return {
      allowed: false,
      limit: 0,
      current: currentUsage ?? 0,
      message: `Esta funcionalidad no está disponible en tu plan actual`
    }
  }

  // Para límites numéricos, verificar uso actual
  if (typeof limit === 'number' && currentUsage !== undefined) {
    const allowed = currentUsage < limit
    
    return {
      allowed,
      limit,
      current: currentUsage,
      message: allowed 
        ? undefined 
        : `Has alcanzado el límite de ${limit} para esta funcionalidad`
    }
  }

  // Por defecto, permitir si no hay información suficiente
  return {
    allowed: true,
    limit: typeof limit === 'number' ? limit : -1,
    current: currentUsage ?? 0
  }
}

/**
 * Obtiene el uso actual de un usuario para una métrica específica
 */
export async function getCurrentUsage(
  userId: string, 
  metric: keyof PlanLimitations,
  year?: number,
  month?: number
): Promise<number> {
  
  const currentYear = year ?? new Date().getFullYear()
  const currentMonth = month ?? new Date().getMonth() + 1

  try {
    switch (metric) {
      case 'transacciones_mes':
        return await prisma.gasto.count({
          where: {
            userId,
            fecha: {
              gte: new Date(currentYear, currentMonth - 1, 1),
              lt: new Date(currentYear, currentMonth, 1)
            }
          }
        })

      case 'alertas_activas':
        return await prisma.alerta.count({
          where: {
            userId,
            leida: false,
            fechaExpiracion: {
              gte: new Date()
            }
          }
        })

      case 'categorias_personalizadas':
        return await prisma.categoria.count({
          where: {
            adminCreadorId: userId,
            tipo: 'grupo'
          }
        })

      case 'gastos_recurrentes':
        return await prisma.gastoRecurrente.count({
          where: {
            userId,
            estado: {
              in: ['pendiente', 'pago_parcial']
            }
          }
        })

      case 'usuarios_grupo':
        const gruposAdmin = await prisma.grupo.findMany({
          where: { adminId: userId },
          include: {
            _count: {
              select: { miembros: true }
            }
          }
        })
        return gruposAdmin.reduce((total, grupo) => total + grupo._count.miembros, 0)

      // Para métricas que requieren tracking mensual
      case 'exportaciones_mes':
        // TODO: Implementar tracking de exportaciones en UsoMensual
        return 0

      case 'storage_comprobantes_mb':
        // TODO: Implementar cálculo de storage usado
        return 0

      default:
        return 0
    }
  } catch (error) {
    console.error(`Error al obtener uso actual para ${metric}:`, error)
    return 0
  }
}

/**
 * Valida si un usuario puede realizar una acción y devuelve resultado con detalles
 */
export async function validateUserAction(
  userId: string,
  action: keyof PlanLimitations,
  additionalUsage: number = 1
): Promise<{
  allowed: boolean
  limit: number
  current: number
  afterAction: number
  message?: string
  planName?: string
}> {
  
  const currentUsage = await getCurrentUsage(userId, action)
  const afterAction = currentUsage + additionalUsage
  
  const permission = await checkUserPermission(userId, action, afterAction)
  
  // Obtener nombre del plan
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: {
        select: { nombre: true }
      }
    }
  })

  return {
    ...permission,
    current: currentUsage,
    afterAction,
    planName: user?.plan?.nombre
  }
}

/**
 * Middleware para validar restricciones en API routes
 */
export function createPlanMiddleware(action: keyof PlanLimitations) {
  return async (userId: string, additionalUsage: number = 1) => {
    const validation = await validateUserAction(userId, action, additionalUsage)
    
    if (!validation.allowed) {
      return {
        error: true,
        status: 403,
        message: validation.message || 'Acción no permitida en tu plan actual',
        details: {
          limit: validation.limit,
          current: validation.current,
          planName: validation.planName
        }
      }
    }

    return { error: false, validation }
  }
}

/**
 * Verifica si un usuario tiene acceso a funcionalidades de IA
 */
export async function checkAIAccess(userId: string): Promise<{
  hasBasicAI: boolean
  hasFullAI: boolean
  planName?: string
}> {
  
  const limitations = await getUserPlanLimitations(userId)
  const aiAccess = limitations.analisis_ia
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: { select: { nombre: true } }
    }
  })

  return {
    hasBasicAI: aiAccess === 'basico' || aiAccess === 'completo' || aiAccess === true,
    hasFullAI: aiAccess === 'completo' || aiAccess === true,
    planName: user?.plan?.nombre
  }
} 