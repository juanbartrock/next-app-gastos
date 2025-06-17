import { PrismaClient } from '@prisma/client'
import AlertEngine from './AlertEngine'

const prisma = new PrismaClient()

export class AlertScheduler {
  private static instance: AlertScheduler | null = null
  private isRunning = false
  private intervalId: NodeJS.Timeout | null = null
  private lastSubscriptionTasksDate: string = ''

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

      // ✨ NUEVA FUNCIONALIDAD: Ejecutar tareas de suscripciones una vez por día
      await this.runDailySubscriptionTasks()

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
   * Ejecuta tareas de suscripciones una vez por día
   * Se ejecuta junto con las alertas pero con control diario
   */
  private async runDailySubscriptionTasks() {
    try {
      const today = new Date().toDateString()
      
      // Solo ejecutar una vez por día
      if (this.lastSubscriptionTasksDate === today) {
        console.log('💳 Tareas de suscripciones ya ejecutadas hoy, omitiendo...')
        return
      }

      console.log('💳 Iniciando tareas diarias de suscripciones...')
      
      // 1. Procesar renovaciones automáticas
      const renovaciones = await this.processSubscriptionRenewals()
      
      // 2. Limpiar suscripciones vencidas (downgrade)
      const downgrades = await this.processExpiredSubscriptions()
      
      // Marcar como ejecutado hoy
      this.lastSubscriptionTasksDate = today
      
      console.log(`✅ Tareas de suscripciones completadas:`)
      console.log(`   - Renovaciones procesadas: ${renovaciones.procesadas}`)
      console.log(`   - Downgrades realizados: ${downgrades.downgrades}`)
      
    } catch (error) {
      console.error('❌ Error en tareas diarias de suscripciones:', error)
    }
  }

  /**
   * Procesa renovaciones automáticas de suscripciones
   */
  private async processSubscriptionRenewals() {
    try {
      console.log('🔄 Procesando renovaciones automáticas...')
      
      const hoy = new Date()
      const mañana = new Date(hoy)
      mañana.setDate(mañana.getDate() + 1)

      // Buscar suscripciones que necesitan renovación
      const suscripcionesARenovar = await prisma.suscripcion.findMany({
        where: {
          estado: 'activa',
          autoRenovacion: true,
          fechaVencimiento: {
            lte: mañana // Vencen hoy o mañana
          }
        },
        include: {
          plan: {
            select: {
              nombre: true,
              esPago: true,
              precioMensual: true
            }
          }
        }
      })

      let renovacionesExitosas = 0
      
      for (const suscripcion of suscripcionesARenovar) {
        try {
          // Solo procesar planes de pago con precio
          if (suscripcion.plan.esPago && suscripcion.plan.precioMensual) {
            // Dar período de gracia de 7 días
            const nuevaFechaVencimiento = new Date(hoy)
            nuevaFechaVencimiento.setDate(nuevaFechaVencimiento.getDate() + 7)

            await prisma.suscripcion.update({
              where: { id: suscripcion.id },
              data: {
                fechaVencimiento: nuevaFechaVencimiento,
                estado: 'pendiente_renovacion',
                intentosFallidos: (suscripcion.intentosFallidos || 0) + 1,
                observaciones: `Renovación automática iniciada el ${hoy.toLocaleString('es-AR')} - Período de gracia hasta ${nuevaFechaVencimiento.toLocaleString('es-AR')}`,
                updatedAt: new Date()
              }
            })
            
            renovacionesExitosas++
            console.log(`💳 Renovación iniciada: ${suscripcion.plan.nombre} - Usuario ID: ${suscripcion.userId}`)
          } else {
            // Planes gratuitos/lifetime se renuevan automáticamente
            const nuevaFechaVencimiento = new Date(hoy)
            nuevaFechaVencimiento.setFullYear(nuevaFechaVencimiento.getFullYear() + 1)

            await prisma.suscripcion.update({
              where: { id: suscripcion.id },
              data: {
                fechaVencimiento: nuevaFechaVencimiento,
                updatedAt: new Date()
              }
            })
            
            renovacionesExitosas++
          }
        } catch (error) {
          console.error(`❌ Error renovando suscripción ${suscripcion.id}:`, error)
        }
      }

      return {
        procesadas: suscripcionesARenovar.length,
        exitosas: renovacionesExitosas
      }
      
    } catch (error) {
      console.error('❌ Error procesando renovaciones:', error)
      return { procesadas: 0, exitosas: 0 }
    }
  }

  /**
   * Procesa suscripciones vencidas (downgrade a plan gratuito)
   */
  private async processExpiredSubscriptions() {
    try {
      console.log('⬇️ Procesando suscripciones vencidas (downgrade)...')
      
      const hoy = new Date()

      // Buscar suscripciones vencidas
      const suscripcionesVencidas = await prisma.suscripcion.findMany({
        where: {
          estado: {
            in: ['activa', 'pendiente_renovacion']
          },
          fechaVencimiento: {
            lt: hoy // Vencidas
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true
            }
          },
          plan: {
            select: {
              nombre: true,
              esPago: true
            }
          }
        }
      })

      // Buscar plan gratuito para downgrade
      const planGratuito = await prisma.plan.findFirst({
        where: {
          nombre: {
            contains: 'Gratuito',
            mode: 'insensitive'
          },
          activo: true
        }
      })

      if (!planGratuito) {
        console.error('❌ No se encontró plan gratuito para downgrade')
        return { procesadas: 0, downgrades: 0 }
      }

      let downgradesRealizados = 0

      for (const suscripcion of suscripcionesVencidas) {
        try {
          // Solo hacer downgrade de planes de pago
          if (suscripcion.plan.esPago) {
            // Marcar suscripción como expirada
            await prisma.suscripcion.update({
              where: { id: suscripcion.id },
              data: {
                estado: 'expirada',
                observaciones: `Suscripción expirada y usuario downgradeado a plan gratuito el ${hoy.toLocaleString('es-AR')}`,
                updatedAt: new Date()
              }
            })

            // Cambiar usuario a plan gratuito
            await prisma.user.update({
              where: { id: suscripcion.user.id },
              data: {
                planId: planGratuito.id
              }
            })

            // Crear nueva suscripción gratuita
            await prisma.suscripcion.create({
              data: {
                userId: suscripcion.user.id,
                planId: planGratuito.id,
                estado: 'activa',
                fechaInicio: hoy,
                fechaVencimiento: new Date(hoy.getFullYear() + 1, hoy.getMonth(), hoy.getDate()),
                metodoPago: 'gratuito',
                referenciaPago: 'downgrade_automatico',
                autoRenovacion: false,
                montoMensual: 0,
                montoTotal: 0,
                observaciones: `Downgrade automático desde ${suscripcion.plan.nombre} por expiración`
              }
            })

            downgradesRealizados++
            console.log(`⬇️ Downgrade realizado: ${suscripcion.user.email} de ${suscripcion.plan.nombre} a ${planGratuito.nombre}`)
          }
        } catch (error) {
          console.error(`❌ Error downgradeando suscripción ${suscripcion.id}:`, error)
        }
      }

      return {
        procesadas: suscripcionesVencidas.length,
        downgrades: downgradesRealizados
      }
      
    } catch (error) {
      console.error('❌ Error procesando suscripciones vencidas:', error)
      return { procesadas: 0, downgrades: 0 }
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
      lastSubscriptionTasksDate: this.lastSubscriptionTasksDate,
      subscriptionTasksExecutedToday: this.lastSubscriptionTasksDate === new Date().toDateString()
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