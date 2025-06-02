import { PrismaClient } from '@prisma/client'
import AlertEngine from './AlertEngine'

const prisma = new PrismaClient()

interface TriggerConfig {
  // Intervalo mínimo entre ejecuciones (en minutos)
  intervalMinutes: number
  // Solo ejecutar para usuarios activos en los últimos X días
  userActivityDays: number
  // Máximo número de ejecuciones por día
  maxExecutionsPerDay: number
}

const DEFAULT_CONFIG: TriggerConfig = {
  intervalMinutes: 60, // Mínimo 1 hora entre ejecuciones
  userActivityDays: 7,  // Solo usuarios activos en últimos 7 días
  maxExecutionsPerDay: 24 // Máximo 24 veces al día
}

export class SmartAlertTrigger {
  private static instance: SmartAlertTrigger | null = null
  private config: TriggerConfig
  private lastExecution: Date | null = null
  private executionsToday: number = 0
  private lastExecutionDate: string = ''

  private constructor(config?: Partial<TriggerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  static getInstance(config?: Partial<TriggerConfig>): SmartAlertTrigger {
    if (!SmartAlertTrigger.instance) {
      SmartAlertTrigger.instance = new SmartAlertTrigger(config)
    }
    return SmartAlertTrigger.instance
  }

  /**
   * Ejecuta evaluación de alertas si es necesario
   * Se llama desde páginas frecuentes como Dashboard
   */
  async tryExecuteAlerts(userId?: string): Promise<{
    executed: boolean
    reason: string
    alertasCreadas?: number
    lastExecution?: Date
  }> {
    try {
      // 1. Verificar si necesitamos ejecutar
      const shouldExecute = await this.shouldExecuteAlerts()
      
      if (!shouldExecute.execute) {
        return {
          executed: false,
          reason: shouldExecute.reason,
          lastExecution: this.lastExecution || undefined
        }
      }

      // 2. Registrar que vamos a ejecutar
      this.recordExecution()

      // 3. Ejecutar evaluación para todos los usuarios activos
      const alertasCreadas = await this.executeForActiveUsers()

      console.log(`🎯 Smart Trigger ejecutado: ${alertasCreadas} alertas creadas`)

      return {
        executed: true,
        reason: 'Evaluación ejecutada exitosamente',
        alertasCreadas
      }

    } catch (error) {
      console.error('❌ Error en Smart Trigger:', error)
      return {
        executed: false,
        reason: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Verifica si debemos ejecutar la evaluación de alertas
   */
  private async shouldExecuteAlerts(): Promise<{
    execute: boolean
    reason: string
  }> {
    const now = new Date()
    const today = now.toDateString()
    
    // Reset contador si es un nuevo día
    if (this.lastExecutionDate !== today) {
      this.executionsToday = 0
      this.lastExecutionDate = today
    }

    // Verificar intervalo mínimo
    if (this.lastExecution) {
      const timeSinceLastExecution = now.getTime() - this.lastExecution.getTime()
      const intervalMs = this.config.intervalMinutes * 60 * 1000
      
      if (timeSinceLastExecution < intervalMs) {
        const remainingMinutes = Math.ceil((intervalMs - timeSinceLastExecution) / (60 * 1000))
        return {
          execute: false,
          reason: `Esperando ${remainingMinutes} minutos hasta próxima ejecución`
        }
      }
    }

    // Verificar límite diario
    if (this.executionsToday >= this.config.maxExecutionsPerDay) {
      return {
        execute: false,
        reason: `Límite diario alcanzado (${this.executionsToday}/${this.config.maxExecutionsPerDay})`
      }
    }

    return {
      execute: true,
      reason: 'Condiciones cumplidas para ejecutar'
    }
  }

  /**
   * Registra una ejecución en memoria (temporal)
   */
  private recordExecution(): void {
    this.lastExecution = new Date()
    this.executionsToday++
    console.log(`📝 Smart Trigger: Ejecución #${this.executionsToday} registrada`)
  }

  /**
   * Ejecuta evaluación para usuarios activos
   */
  private async executeForActiveUsers(): Promise<number> {
    const activeUsers = await this.getActiveUsers()
    const alertEngine = new AlertEngine()
    let totalAlertas = 0

    console.log(`🎯 Ejecutando Smart Trigger para ${activeUsers.length} usuarios activos`)

    for (const user of activeUsers) {
      try {
        const alertasCreadas = await alertEngine.runAutomaticEvaluation(user.id)
        totalAlertas += alertasCreadas
        
        if (alertasCreadas > 0) {
          console.log(`✅ Usuario ${user.email}: ${alertasCreadas} alertas creadas`)
        }
      } catch (error) {
        console.error(`❌ Error evaluando usuario ${user.email}:`, error)
      }
    }

    // Limpiar alertas expiradas
    await this.cleanupExpiredAlerts()

    return totalAlertas
  }

  /**
   * Obtiene usuarios activos en los últimos X días
   */
  private async getActiveUsers() {
    const cutoffDate = new Date(Date.now() - this.config.userActivityDays * 24 * 60 * 60 * 1000)
    
    return await prisma.user.findMany({
      select: {
        id: true,
        email: true,
      },
      where: {
        OR: [
          {
            gastos: {
              some: {
                fecha: { gte: cutoffDate }
              }
            }
          },
          {
            presupuestos: {
              some: {
                año: new Date().getFullYear(),
                mes: { gte: new Date().getMonth() + 1 - 1 }
              }
            }
          },
          {
            alertas: {
              some: {
                fechaCreacion: { gte: cutoffDate }
              }
            }
          }
        ]
      }
    })
  }

  /**
   * Limpia alertas expiradas
   */
  private async cleanupExpiredAlerts(): Promise<number> {
    const result = await prisma.alerta.deleteMany({
      where: {
        fechaExpiracion: {
          lt: new Date()
        }
      }
    })

    if (result.count > 0) {
      console.log(`🧹 Smart Trigger: ${result.count} alertas expiradas eliminadas`)
    }

    return result.count
  }

  /**
   * Obtiene estadísticas del Smart Trigger
   */
  async getStats(): Promise<{
    lastExecution?: Date
    executionsToday: number
    nextPossibleExecution: Date
    isEnabled: boolean
  }> {
    const now = new Date()

    const nextPossibleExecution = this.lastExecution
      ? new Date(this.lastExecution.getTime() + this.config.intervalMinutes * 60 * 1000)
      : now

    return {
      lastExecution: this.lastExecution || undefined,
      executionsToday: this.executionsToday,
      nextPossibleExecution,
      isEnabled: true
    }
  }

  /**
   * Reinicia contadores (útil para testing)
   */
  reset(): void {
    this.lastExecution = null
    this.executionsToday = 0
    this.lastExecutionDate = ''
    console.log('🔄 Smart Trigger reiniciado')
  }
}

// Export para uso fácil
export const smartAlertTrigger = SmartAlertTrigger.getInstance()
export default SmartAlertTrigger 