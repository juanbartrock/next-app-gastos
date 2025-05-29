import { PrismaClient } from '@prisma/client'
import AlertEngine from './AlertEngine'

const prisma = new PrismaClient()

export class AlertScheduler {
  private static instance: AlertScheduler | null = null
  private isRunning = false
  private intervalId: NodeJS.Timeout | null = null

  private constructor() {}

  static getInstance(): AlertScheduler {
    if (!AlertScheduler.instance) {
      AlertScheduler.instance = new AlertScheduler()
    }
    return AlertScheduler.instance
  }

  /**
   * Inicia la programación automática de evaluación de alertas
   * @param intervalMinutes Intervalo en minutos para ejecutar la evaluación (default: 60 minutos)
   */
  start(intervalMinutes: number = 60) {
    if (this.isRunning) {
      console.log('AlertScheduler ya está ejecutándose')
      return
    }

    this.isRunning = true
    const intervalMs = intervalMinutes * 60 * 1000

    console.log(`🔔 AlertScheduler iniciado - evaluará cada ${intervalMinutes} minutos`)

    // Ejecutar inmediatamente al iniciar
    this.runEvaluationForAllUsers()

    // Programar ejecuciones periódicas
    this.intervalId = setInterval(() => {
      this.runEvaluationForAllUsers()
    }, intervalMs)
  }

  /**
   * Detiene la programación automática
   */
  stop() {
    if (!this.isRunning) {
      console.log('AlertScheduler no está ejecutándose')
      return
    }

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    this.isRunning = false
    console.log('🔔 AlertScheduler detenido')
  }

  /**
   * Ejecuta la evaluación de alertas para todos los usuarios activos
   */
  private async runEvaluationForAllUsers() {
    console.log('🔄 Iniciando evaluación automática de alertas para todos los usuarios...')
    
    try {
      // Obtener todos los usuarios activos
      const usuarios = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
        },
        where: {
          // Solo usuarios que tienen datos recientes (han usado la app en los últimos 30 días)
          OR: [
            {
              gastos: {
                some: {
                  fecha: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                  }
                }
              }
            },
            {
              presupuestos: {
                some: {
                  año: new Date().getFullYear(),
                  mes: {
                    gte: new Date().getMonth() + 1 - 1, // Mes actual o anterior
                  }
                }
              }
            }
          ]
        }
      })

      console.log(`📊 Evaluando alertas para ${usuarios.length} usuarios activos`)

      const alertEngine = new AlertEngine()
      let totalAlertasCreadas = 0

      for (const usuario of usuarios) {
        try {
          const alertasCreadas = await alertEngine.runAutomaticEvaluation(usuario.id)
          
          if (alertasCreadas > 0) {
            console.log(`✅ Usuario ${usuario.email}: ${alertasCreadas} nueva${alertasCreadas === 1 ? '' : 's'} alerta${alertasCreadas === 1 ? '' : 's'} creada${alertasCreadas === 1 ? '' : 's'}`)
            totalAlertasCreadas += alertasCreadas
          }
        } catch (error) {
          console.error(`❌ Error evaluando alertas para usuario ${usuario.email}:`, error)
        }
      }

      console.log(`🎉 Evaluación automática completada: ${totalAlertasCreadas} alertas creadas en total`)

      // Opcional: Limpiar alertas expiradas
      await this.cleanupExpiredAlerts()

    } catch (error) {
      console.error('❌ Error en evaluación automática de alertas:', error)
    }
  }

  /**
   * Limpia alertas expiradas
   */
  private async cleanupExpiredAlerts() {
    try {
      const ahora = new Date()
      
      const alertasEliminadas = await prisma.alerta.deleteMany({
        where: {
          fechaExpiracion: {
            lt: ahora
          }
        }
      })

      if (alertasEliminadas.count > 0) {
        console.log(`🧹 Limpieza: ${alertasEliminadas.count} alertas expiradas eliminadas`)
      }
    } catch (error) {
      console.error('❌ Error limpiando alertas expiradas:', error)
    }
  }

  /**
   * Ejecuta evaluación manual para un usuario específico
   */
  async runEvaluationForUser(userId: string): Promise<number> {
    console.log(`🔄 Ejecutando evaluación manual para usuario ${userId}`)
    
    try {
      const alertEngine = new AlertEngine()
      const alertasCreadas = await alertEngine.runAutomaticEvaluation(userId)
      
      console.log(`✅ Evaluación manual completada: ${alertasCreadas} alertas creadas`)
      return alertasCreadas
    } catch (error) {
      console.error(`❌ Error en evaluación manual para usuario ${userId}:`, error)
      return 0
    }
  }

  /**
   * Obtiene el estado actual del scheduler
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      hasInterval: this.intervalId !== null,
    }
  }

  /**
   * Ejecuta una evaluación inmediata para todos los usuarios (sin programación)
   */
  async runOnce(): Promise<number> {
    console.log('🚀 Ejecutando evaluación inmediata (una vez)')
    
    try {
      const usuarios = await prisma.user.findMany({
        select: { id: true, email: true }
      })

      const alertEngine = new AlertEngine()
      let totalAlertas = 0

      for (const usuario of usuarios) {
        try {
          const alertas = await alertEngine.runAutomaticEvaluation(usuario.id)
          totalAlertas += alertas
        } catch (error) {
          console.error(`Error evaluando usuario ${usuario.email}:`, error)
        }
      }

      await this.cleanupExpiredAlerts()
      
      console.log(`✅ Evaluación inmediata completada: ${totalAlertas} alertas creadas`)
      return totalAlertas
    } catch (error) {
      console.error('❌ Error en evaluación inmediata:', error)
      return 0
    }
  }
}

// Función helper para iniciar el scheduler globalmente
export function startGlobalAlertScheduler(intervalMinutes: number = 60) {
  const scheduler = AlertScheduler.getInstance()
  scheduler.start(intervalMinutes)
  return scheduler
}

// Función helper para detener el scheduler globalmente
export function stopGlobalAlertScheduler() {
  const scheduler = AlertScheduler.getInstance()
  scheduler.stop()
  return scheduler
}

export default AlertScheduler 