import prisma from '@/lib/prisma'

// ✅ LÍMITES POR PLAN DEFINIDOS
export const PLAN_LIMITS = {
  gratuito: {
    transacciones_mes: 50,
    gastos_recurrentes: 2,
    consultas_ia_mes: 3,
    presupuestos_activos: 1,
    categorias_personalizadas: false,
    modo_familiar: false,
    alertas_automaticas: false,
    prestamos_inversiones: false,
    exportacion: false,
    tareas: false,
    miembros_familia: 0
  },
  basico: {
    transacciones_mes: -1, // Ilimitado
    gastos_recurrentes: 10,
    consultas_ia_mes: 15,
    presupuestos_activos: 3,
    categorias_personalizadas: true,
    modo_familiar: true,
    alertas_automaticas: true,
    prestamos_inversiones: false,
    exportacion: true,
    tareas: false,
    miembros_familia: 5
  },
  premium: {
    transacciones_mes: -1, // Ilimitado
    gastos_recurrentes: -1, // Ilimitado
    consultas_ia_mes: -1, // Ilimitado
    presupuestos_activos: -1, // Ilimitado
    categorias_personalizadas: true,
    modo_familiar: true,
    alertas_automaticas: true,
    prestamos_inversiones: true,
    exportacion: true,
    tareas: true,
    miembros_familia: 10
  }
} as const

export type PlanType = keyof typeof PLAN_LIMITS
export type LimitKey = keyof typeof PLAN_LIMITS['gratuito']

// ✅ OBTENER PLAN ACTUAL DEL USUARIO
export async function getUserPlan(userId: string): Promise<PlanType> {
  try {
    const suscripcion = await prisma.suscripcion.findFirst({
      where: {
        userId: userId,
        estado: 'activa'
      },
      include: {
        plan: true
      },
      orderBy: {
        fechaCreacion: 'desc'
      }
    })

    if (suscripcion?.plan) {
      const planNombre = suscripcion.plan.nombre.toLowerCase()
      if (planNombre.includes('premium')) return 'premium'
      if (planNombre.includes('basico') || planNombre.includes('básico')) return 'basico'
    }

    return 'gratuito' // Por defecto
  } catch (error) {
    console.error('Error obteniendo plan del usuario:', error)
    return 'gratuito' // Fallback seguro
  }
}

// ✅ OBTENER LÍMITES DEL USUARIO
export async function getUserLimits(userId: string) {
  const plan = await getUserPlan(userId)
  return PLAN_LIMITS[plan]
}

// ✅ VALIDAR LÍMITE ESPECÍFICO
export async function validateLimit(
  userId: string, 
  limitType: LimitKey, 
  currentUsage?: number
): Promise<{ allowed: boolean; limit: number; usage: number; remaining: number }> {
  try {
    const limits = await getUserLimits(userId)
    const limit = limits[limitType]
    
    // Si es ilimitado (-1), siempre permitir
    if (limit === -1) {
      return {
        allowed: true,
        limit: -1,
        usage: currentUsage || 0,
        remaining: -1
      }
    }
    
    // Si es booleano, devolver directamente
    if (typeof limit === 'boolean') {
      return {
        allowed: limit,
        limit: limit ? 1 : 0,
        usage: 0,
        remaining: limit ? 1 : 0
      }
    }
    
    // Para límites numéricos, calcular uso actual si no se proporciona
    let usage = currentUsage
    if (usage === undefined) {
      usage = await getCurrentUsage(userId, limitType)
    }
    
    const remaining = Math.max(0, limit - usage)
    const allowed = usage < limit
    
    return {
      allowed,
      limit,
      usage,
      remaining
    }
    
  } catch (error) {
    console.error('Error validando límite:', error)
    return {
      allowed: false,
      limit: 0,
      usage: 0,
      remaining: 0
    }
  }
}

// ✅ OBTENER USO ACTUAL DEL USUARIO
export async function getCurrentUsage(userId: string, limitType: LimitKey): Promise<number> {
  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  
  try {
    switch (limitType) {
      case 'transacciones_mes':
        return await prisma.gasto.count({
          where: {
            userId: userId,
            fecha: { gte: inicioMes }
          }
        })
        
      case 'gastos_recurrentes':
        return await prisma.gastoRecurrente.count({
          where: {
            userId: userId
          }
        })
        
      case 'consultas_ia_mes':
        const usoMensual = await prisma.usoMensual.findUnique({
          where: {
            userId_año_mes: {
              userId: userId,
              año: ahora.getFullYear(),
              mes: ahora.getMonth() + 1
            }
          }
        })
        return usoMensual?.consultasIA || 0
        
      case 'presupuestos_activos':
        return await prisma.presupuesto.count({
          where: {
            userId: userId,
            año: ahora.getFullYear(),
            mes: { gte: ahora.getMonth() + 1 } // Presupuestos actuales y futuros
          }
        })
        
      case 'miembros_familia':
        const grupo = await prisma.grupo.findFirst({
          where: {
            adminId: userId
          },
          include: {
            _count: {
              select: { miembros: true }
            }
          }
        })
        return grupo?._count.miembros || 0
        
      default:
        return 0
    }
  } catch (error) {
    console.error('Error obteniendo uso actual:', error)
    return 0
  }
}

// ✅ VALIDAR MÚLTIPLES LÍMITES A LA VEZ
export async function validateMultipleLimits(
  userId: string, 
  limitTypes: LimitKey[]
): Promise<Record<LimitKey, { allowed: boolean; limit: number; usage: number; remaining: number }>> {
  const results = {} as any
  
  for (const limitType of limitTypes) {
    results[limitType] = await validateLimit(userId, limitType)
  }
  
  return results
}

// ✅ INCREMENTAR USO DE LÍMITE
export async function incrementUsage(userId: string, limitType: LimitKey, amount: number = 1): Promise<void> {
  const ahora = new Date()
  
  try {
    switch (limitType) {
      case 'consultas_ia_mes':
        // Incrementar contador de consultas IA
        await prisma.usoMensual.upsert({
          where: {
            userId_año_mes: {
              userId: userId,
              año: ahora.getFullYear(),
              mes: ahora.getMonth() + 1
            }
          },
          update: {
            consultasIA: { increment: amount },
            fechaUltimaActividad: ahora
          },
          create: {
            userId: userId,
            año: ahora.getFullYear(),
            mes: ahora.getMonth() + 1,
            consultasIA: amount,
            fechaUltimaActividad: ahora
          }
        })
        break
        
      case 'transacciones_mes':
        // Incrementar contador de transacciones
        await prisma.usoMensual.upsert({
          where: {
            userId_año_mes: {
              userId: userId,
              año: ahora.getFullYear(),
              mes: ahora.getMonth() + 1
            }
          },
          update: {
            transaccionesCreadas: { increment: amount },
            fechaUltimaActividad: ahora
          },
          create: {
            userId: userId,
            año: ahora.getFullYear(),
            mes: ahora.getMonth() + 1,
            transaccionesCreadas: amount,
            fechaUltimaActividad: ahora
          }
        })
        break
        
      // Para otros límites, el incremento es automático al crear/eliminar registros
      default:
        break
    }
  } catch (error) {
    console.error('Error incrementando uso:', error)
  }
}

// ✅ OBTENER RESUMEN COMPLETO DE LÍMITES
export async function getLimitsStatus(userId: string) {
  const plan = await getUserPlan(userId)
  const limits = PLAN_LIMITS[plan]
  
  const status = {
    plan,
    limits: {} as any,
    needsUpgrade: false,
    blockedFeatures: [] as string[]
  }
  
  // Verificar cada límite
  for (const [key, limit] of Object.entries(limits)) {
    const validation = await validateLimit(userId, key as LimitKey)
    status.limits[key] = validation
    
    if (!validation.allowed) {
      status.needsUpgrade = true
      status.blockedFeatures.push(key)
    }
  }
  
  return status
}

// ✅ HELPER PARA COMPONENTES
export function formatLimitDisplay(limit: number | boolean): string {
  if (limit === -1) return 'Ilimitado'
  if (typeof limit === 'boolean') return limit ? 'Incluido' : 'No incluido'
  return limit.toString()
}

// ✅ VERIFICAR SI PUEDE USAR FUNCIONALIDAD
export async function canUseFeature(userId: string, feature: LimitKey): Promise<boolean> {
  const validation = await validateLimit(userId, feature)
  return validation.allowed
}

// ✅ OBTENER MENSAJE DE UPGRADE
export function getUpgradeMessage(currentPlan: PlanType, feature: LimitKey): string {
  const messages = {
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
    },
    premium: {
      // No debería llegar aquí, pero por completitud
    }
  } as any
  
  return messages[currentPlan]?.[feature] || 'Esta funcionalidad requiere un plan superior.'
} 