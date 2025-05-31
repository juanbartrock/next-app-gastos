import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Tipos de alerta que coinciden con el enum del schema
export type TipoAlerta = 
  | 'PAGO_RECURRENTE'
  | 'PRESUPUESTO_80'
  | 'PRESUPUESTO_90'
  | 'PRESUPUESTO_SUPERADO'
  | 'META_PROGRESO'
  | 'INVERSION_VENCIMIENTO'
  | 'PRESTAMO_CUOTA'
  | 'GASTO_INUSUAL'
  | 'OPORTUNIDAD_AHORRO'
  | 'SALDO_BAJO'
  | 'RECOMENDACION_IA'
  | 'TAREA_VENCIMIENTO'
  | 'PROMOCION_DISPONIBLE'

export type PrioridadAlerta = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'

export interface AlertaGenerada {
  tipo: TipoAlerta
  prioridad: PrioridadAlerta
  titulo: string
  mensaje: string
  metadatos?: Record<string, any>
  fechaExpiracion?: Date
  presupuestoId?: string
  gastoRecurrenteId?: number
  inversionId?: string
  prestamoId?: string
  tareaId?: string
}

export class AlertEngine {
  /**
   * Evalúa todas las condiciones automáticas para un usuario
   */
  async evaluateConditions(userId: string): Promise<AlertaGenerada[]> {
    const alertas: AlertaGenerada[] = []

    try {
      // Evaluar alertas de presupuestos
      const alertasPresupuestos = await this.processPresupuestosAlerts(userId)
      alertas.push(...alertasPresupuestos)

      // Evaluar alertas de préstamos
      const alertasPrestamos = await this.processPrestamosAlerts(userId)
      alertas.push(...alertasPrestamos)

      // Evaluar alertas de inversiones
      const alertasInversiones = await this.processInversionesAlerts(userId)
      alertas.push(...alertasInversiones)

      // Evaluar alertas de gastos recurrentes
      const alertasRecurrentes = await this.processGastosRecurrentesAlerts(userId)
      alertas.push(...alertasRecurrentes)

      // Evaluar alertas de tareas
      const alertasTareas = await this.processTareasAlerts(userId)
      alertas.push(...alertasTareas)

      // Evaluar gastos inusuales
      const alertasGastosInusuales = await this.processGastosInusualesAlerts(userId)
      alertas.push(...alertasGastosInusuales)

      return alertas
    } catch (error) {
      console.error('Error evaluating alert conditions:', error)
      return []
    }
  }

  /**
   * Evalúa alertas de presupuestos automáticas (80%, 90%, 100%)
   */
  async processPresupuestosAlerts(userId: string): Promise<AlertaGenerada[]> {
    const alertas: AlertaGenerada[] = []
    const ahora = new Date()
    const mesActual = ahora.getMonth() + 1
    const añoActual = ahora.getFullYear()

    try {
      // Obtener presupuestos del mes actual
      const presupuestos = await prisma.presupuesto.findMany({
        where: {
          userId,
          mes: mesActual,
          año: añoActual,
        },
        include: {
          categoria: true,
        },
      })

      for (const presupuesto of presupuestos) {
        // Calcular gasto actual en la categoría del presupuesto
        const gastoActual = await prisma.gasto.aggregate({
          where: {
            userId,
            categoriaId: presupuesto.categoriaId,
            fecha: {
              gte: new Date(añoActual, mesActual - 1, 1),
              lt: new Date(añoActual, mesActual, 1),
            },
            tipoTransaccion: 'gasto',
          },
          _sum: {
            monto: true,
          },
        })

        const montoGastado = gastoActual._sum.monto || 0
        const porcentajeUsado = (montoGastado / presupuesto.monto) * 100

        // Verificar si ya existe una alerta para este presupuesto en los últimos 3 días
        const alertaExistente = await prisma.alerta.findFirst({
          where: {
            userId,
            presupuestoId: presupuesto.id,
            tipo: {
              in: ['PRESUPUESTO_80', 'PRESUPUESTO_90', 'PRESUPUESTO_SUPERADO'],
            },
            fechaCreacion: {
              gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            },
          },
        })

        if (alertaExistente) continue

        // Alerta 80%
        if (porcentajeUsado >= 80 && porcentajeUsado < 90) {
          alertas.push({
            tipo: 'PRESUPUESTO_80',
            prioridad: 'MEDIA',
            titulo: `Presupuesto al 80% - ${presupuesto.categoria.descripcion}`,
            mensaje: `Has usado el 80% de tu presupuesto mensual para ${presupuesto.categoria.descripcion}. Gastado: $${montoGastado.toFixed(2)} de $${presupuesto.monto.toFixed(2)}.`,
            metadatos: {
              presupuestoId: presupuesto.id,
              categoriaId: presupuesto.categoriaId,
              nombreCategoria: presupuesto.categoria.descripcion,
              montoPresupuesto: presupuesto.monto,
              montoGastado,
              porcentajeUsado: Math.round(porcentajeUsado),
              montoRestante: presupuesto.monto - montoGastado,
            },
            presupuestoId: presupuesto.id,
          })
        }

        // Alerta 90%
        if (porcentajeUsado >= 90 && porcentajeUsado < 100) {
          alertas.push({
            tipo: 'PRESUPUESTO_90',
            prioridad: 'ALTA',
            titulo: `¡Presupuesto al 90%! - ${presupuesto.categoria.descripcion}`,
            mensaje: `¡Atención! Has usado el 90% de tu presupuesto mensual para ${presupuesto.categoria.descripcion}. Solo te quedan $${(presupuesto.monto - montoGastado).toFixed(2)}.`,
            metadatos: {
              presupuestoId: presupuesto.id,
              categoriaId: presupuesto.categoriaId,
              nombreCategoria: presupuesto.categoria.descripcion,
              montoPresupuesto: presupuesto.monto,
              montoGastado,
              porcentajeUsado: Math.round(porcentajeUsado),
              montoRestante: presupuesto.monto - montoGastado,
            },
            presupuestoId: presupuesto.id,
          })
        }

        // Alerta presupuesto superado
        if (porcentajeUsado >= 100) {
          alertas.push({
            tipo: 'PRESUPUESTO_SUPERADO',
            prioridad: 'CRITICA',
            titulo: `🚨 Presupuesto Superado - ${presupuesto.categoria.descripcion}`,
            mensaje: `Has superado tu presupuesto mensual para ${presupuesto.categoria.descripcion}. Gastado: $${montoGastado.toFixed(2)} de $${presupuesto.monto.toFixed(2)} (${Math.round(porcentajeUsado)}%).`,
            metadatos: {
              presupuestoId: presupuesto.id,
              categoriaId: presupuesto.categoriaId,
              nombreCategoria: presupuesto.categoria.descripcion,
              montoPresupuesto: presupuesto.monto,
              montoGastado,
              porcentajeUsado: Math.round(porcentajeUsado),
              exceso: montoGastado - presupuesto.monto,
            },
            presupuestoId: presupuesto.id,
          })
        }
      }
    } catch (error) {
      console.error('Error processing presupuesto alerts:', error)
    }

    return alertas
  }

  /**
   * Evalúa alertas de préstamos próximos a vencer
   */
  async processPrestamosAlerts(userId: string): Promise<AlertaGenerada[]> {
    const alertas: AlertaGenerada[] = []
    const ahora = new Date()
    const en7Dias = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    try {
      // Préstamos con cuotas próximas a vencer
      const prestamos = await prisma.prestamo.findMany({
        where: {
          userId,
          estado: 'activo',
          fechaProximaCuota: {
            lte: en7Dias,
            gte: ahora,
          },
        },
      })

      for (const prestamo of prestamos) {
        // Verificar si ya existe una alerta para este préstamo en los últimos 5 días
        const alertaExistente = await prisma.alerta.findFirst({
          where: {
            userId,
            prestamoId: prestamo.id,
            tipo: 'PRESTAMO_CUOTA',
            fechaCreacion: {
              gte: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            },
          },
        })

        if (alertaExistente) continue

        const diasRestantes = Math.ceil((prestamo.fechaProximaCuota!.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))
        
        let prioridad: PrioridadAlerta = 'MEDIA'
        if (diasRestantes <= 2) prioridad = 'CRITICA'
        else if (diasRestantes <= 5) prioridad = 'ALTA'

        alertas.push({
          tipo: 'PRESTAMO_CUOTA',
          prioridad,
          titulo: `Cuota de préstamo próxima - ${prestamo.entidadFinanciera}`,
          mensaje: `Tu cuota de préstamo ${prestamo.tipoCredito} de ${prestamo.entidadFinanciera} vence en ${diasRestantes} día${diasRestantes > 1 ? 's' : ''}. Monto: $${prestamo.cuotaMensual.toFixed(2)}.`,
          metadatos: {
            prestamoId: prestamo.id,
            entidadFinanciera: prestamo.entidadFinanciera,
            tipoCredito: prestamo.tipoCredito,
            cuotaMensual: prestamo.cuotaMensual,
            fechaVencimiento: prestamo.fechaProximaCuota,
            diasRestantes,
          },
          prestamoId: prestamo.id,
          fechaExpiracion: prestamo.fechaProximaCuota!,
        })
      }
    } catch (error) {
      console.error('Error processing prestamo alerts:', error)
    }

    return alertas
  }

  /**
   * Evalúa alertas de inversiones próximas a vencer
   */
  async processInversionesAlerts(userId: string): Promise<AlertaGenerada[]> {
    const alertas: AlertaGenerada[] = []
    const ahora = new Date()
    const en30Dias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    try {
      // Inversiones próximas a vencer
      const inversiones = await prisma.inversion.findMany({
        where: {
          userId,
          estado: 'activa',
          fechaVencimiento: {
            lte: en30Dias,
            gte: ahora,
          },
        },
        include: {
          tipo: true,
        },
      })

      for (const inversion of inversiones) {
        // Verificar si ya existe una alerta para esta inversión en los últimos 7 días
        const alertaExistente = await prisma.alerta.findFirst({
          where: {
            userId,
            inversionId: inversion.id,
            tipo: 'INVERSION_VENCIMIENTO',
            fechaCreacion: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        })

        if (alertaExistente) continue

        const diasRestantes = Math.ceil((inversion.fechaVencimiento!.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))
        
        let prioridad: PrioridadAlerta = 'BAJA'
        if (diasRestantes <= 7) prioridad = 'ALTA'
        else if (diasRestantes <= 15) prioridad = 'MEDIA'

        alertas.push({
          tipo: 'INVERSION_VENCIMIENTO',
          prioridad,
          titulo: `Inversión próxima a vencer - ${inversion.nombre}`,
          mensaje: `Tu inversión "${inversion.nombre}" (${inversion.tipo.nombre}) vence en ${diasRestantes} día${diasRestantes > 1 ? 's' : ''}. Valor actual: $${inversion.montoActual.toFixed(2)}.`,
          metadatos: {
            inversionId: inversion.id,
            nombreInversion: inversion.nombre,
            tipoInversion: inversion.tipo.nombre,
            montoActual: inversion.montoActual,
            rendimientoTotal: inversion.rendimientoTotal,
            fechaVencimiento: inversion.fechaVencimiento,
            diasRestantes,
          },
          inversionId: inversion.id,
          fechaExpiracion: inversion.fechaVencimiento!,
        })
      }
    } catch (error) {
      console.error('Error processing inversion alerts:', error)
    }

    return alertas
  }

  /**
   * Evalúa alertas de gastos recurrentes próximos a vencer
   */
  async processGastosRecurrentesAlerts(userId: string): Promise<AlertaGenerada[]> {
    const alertas: AlertaGenerada[] = []
    const ahora = new Date()
    const en3Dias = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

    try {
      // Gastos recurrentes próximos a vencer
      const gastosRecurrentes = await prisma.gastoRecurrente.findMany({
        where: {
          userId,
          proximaFecha: {
            lte: en3Dias,
            gte: ahora,
          },
          estado: {
            in: ['pendiente', 'parcial'],
          },
        },
        include: {
          categoria: true,
        },
      })

      for (const gastoRecurrente of gastosRecurrentes) {
        // Verificar si ya existe una alerta para este gasto recurrente en los últimos 2 días
        const alertaExistente = await prisma.alerta.findFirst({
          where: {
            userId,
            gastoRecurrenteId: gastoRecurrente.id,
            tipo: 'PAGO_RECURRENTE',
            fechaCreacion: {
              gte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            },
          },
        })

        if (alertaExistente) continue

        const diasRestantes = Math.ceil((gastoRecurrente.proximaFecha!.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))
        
        let prioridad: PrioridadAlerta = 'MEDIA'
        if (diasRestantes <= 1) prioridad = 'ALTA'

        alertas.push({
          tipo: 'PAGO_RECURRENTE',
          prioridad,
          titulo: `Pago recurrente próximo - ${gastoRecurrente.concepto}`,
          mensaje: `Tu pago recurrente "${gastoRecurrente.concepto}" ${gastoRecurrente.categoria ? `(${gastoRecurrente.categoria.descripcion})` : ''} vence en ${diasRestantes} día${diasRestantes > 1 ? 's' : ''}. Monto: $${gastoRecurrente.monto.toFixed(2)}.`,
          metadatos: {
            gastoRecurrenteId: gastoRecurrente.id,
            concepto: gastoRecurrente.concepto,
            categoria: gastoRecurrente.categoria?.descripcion,
            monto: gastoRecurrente.monto,
            periodicidad: gastoRecurrente.periodicidad,
            fechaVencimiento: gastoRecurrente.proximaFecha,
            diasRestantes,
          },
          gastoRecurrenteId: gastoRecurrente.id,
          fechaExpiracion: gastoRecurrente.proximaFecha!,
        })
      }
    } catch (error) {
      console.error('Error processing gastos recurrentes alerts:', error)
    }

    return alertas
  }

  /**
   * Evalúa alertas de tareas (próximas y vencidas)
   */
  async processTareasAlerts(userId: string): Promise<AlertaGenerada[]> {
    const alertas: AlertaGenerada[] = []
    const ahora = new Date()
    const mañana = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const en3Dias = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

    try {
      // 1. TAREAS PRÓXIMAS A VENCER (1-3 días)
      const tareasProximas = await prisma.tarea.findMany({
        where: {
          userId,
          estado: 'pendiente',
          fechaVencimiento: {
            gte: ahora,
            lte: en3Dias,
          },
        },
      })

      for (const tarea of tareasProximas) {
        // Verificar si ya existe una alerta para esta tarea en los últimos 2 días
        const alertaExistente = await prisma.alerta.findFirst({
          where: {
            userId,
            tareaId: tarea.id,
            tipo: 'TAREA_VENCIMIENTO',
            fechaCreacion: {
              gte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            },
          },
        })

        if (alertaExistente) continue

        const diasHastaVencimiento = Math.ceil((tarea.fechaVencimiento!.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))
        
        let prioridad: PrioridadAlerta = 'MEDIA'
        let emoji = '📅'
        
        if (tarea.prioridad === 'alta') prioridad = 'ALTA'
        if (tarea.esFinanciera) {
          prioridad = 'ALTA'
          emoji = '💰'
        }
        if (diasHastaVencimiento <= 1) {
          prioridad = 'ALTA'
          emoji = '⚠️'
        }

        let mensaje = `${emoji} La tarea "${tarea.titulo}"`
        
        if (diasHastaVencimiento === 0) {
          mensaje += ` vence HOY.`
        } else if (diasHastaVencimiento === 1) {
          mensaje += ` vence MAÑANA.`
        } else {
          mensaje += ` vence en ${diasHastaVencimiento} días.`
        }
        
        if (tarea.esFinanciera) {
          mensaje += ' 💰 Es una tarea financiera importante.'
        }
        
        if (tarea.descripcion) {
          mensaje += ` Descripción: ${tarea.descripcion}`
        }

        alertas.push({
          tipo: 'TAREA_VENCIMIENTO',
          prioridad,
          titulo: diasHastaVencimiento <= 1 ? `${emoji} Tarea urgente - ${tarea.titulo}` : `📅 Tarea próxima - ${tarea.titulo}`,
          mensaje,
          metadatos: {
            tareaId: tarea.id,
            titulo: tarea.titulo,
            descripcion: tarea.descripcion,
            prioridadTarea: tarea.prioridad,
            esFinanciera: tarea.esFinanciera,
            categoria: tarea.categoria,
            fechaVencimiento: tarea.fechaVencimiento,
            diasHastaVencimiento,
            esProxima: true,
          },
          tareaId: tarea.id,
        })
      }

      // 2. TAREAS YA VENCIDAS
      const tareasVencidas = await prisma.tarea.findMany({
        where: {
          userId,
          estado: 'pendiente',
          fechaVencimiento: {
            lt: ahora,
          },
        },
      })

      for (const tarea of tareasVencidas) {
        // Verificar si ya existe una alerta para esta tarea en los últimos 2 días
        const alertaExistente = await prisma.alerta.findFirst({
          where: {
            userId,
            tareaId: tarea.id,
            tipo: 'TAREA_VENCIMIENTO',
            fechaCreacion: {
              gte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            },
          },
        })

        if (alertaExistente) continue

        const diasVencida = Math.ceil((ahora.getTime() - tarea.fechaVencimiento!.getTime()) / (1000 * 60 * 60 * 24))
        
        let prioridad: PrioridadAlerta = 'MEDIA'
        if (tarea.prioridad === 'alta') prioridad = 'ALTA'
        if (tarea.esFinanciera) prioridad = 'ALTA'
        if (diasVencida > 7) prioridad = 'CRITICA'

        alertas.push({
          tipo: 'TAREA_VENCIMIENTO',
          prioridad,
          titulo: `🚨 Tarea vencida - ${tarea.titulo}`,
          mensaje: `La tarea "${tarea.titulo}" venció hace ${diasVencida} día${diasVencida > 1 ? 's' : ''}. ${tarea.esFinanciera ? '💰 Es una tarea financiera.' : ''}`,
          metadatos: {
            tareaId: tarea.id,
            titulo: tarea.titulo,
            descripcion: tarea.descripcion,
            prioridadTarea: tarea.prioridad,
            esFinanciera: tarea.esFinanciera,
            categoria: tarea.categoria,
            fechaVencimiento: tarea.fechaVencimiento,
            diasVencida,
            esProxima: false,
          },
          tareaId: tarea.id,
        })
      }
    } catch (error) {
      console.error('Error processing tareas alerts:', error)
    }

    return alertas
  }

  /**
   * Evalúa gastos inusuales o anómalos
   */
  async processGastosInusualesAlerts(userId: string): Promise<AlertaGenerada[]> {
    const alertas: AlertaGenerada[] = []
    const ahora = new Date()
    const hace7Dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    try {
      // Calcular promedio de gastos de los últimos 30 días (excluyendo los últimos 7)
      const gastosHistoricos = await prisma.gasto.findMany({
        where: {
          userId,
          tipoTransaccion: 'gasto',
          fecha: {
            gte: hace30Dias,
            lt: hace7Dias,
          },
        },
      })

      if (gastosHistoricos.length === 0) return alertas

      const promedioHistorico = gastosHistoricos.reduce((sum, gasto) => sum + gasto.monto, 0) / gastosHistoricos.length
      const umbralAlerta = promedioHistorico * 3 // 300% del promedio

      // Verificar gastos recientes que superen el umbral
      const gastosRecientes = await prisma.gasto.findMany({
        where: {
          userId,
          tipoTransaccion: 'gasto',
          fecha: {
            gte: hace7Dias,
            lte: ahora,
          },
          monto: {
            gte: umbralAlerta,
          },
        },
        include: {
          categoriaRel: true,
        },
      })

      for (const gasto of gastosRecientes) {
        // Verificar si ya existe una alerta para gastos inusuales en los últimos 3 días
        const alertaExistente = await prisma.alerta.findFirst({
          where: {
            userId,
            tipo: 'GASTO_INUSUAL',
            fechaCreacion: {
              gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            },
            metadatos: {
              path: ['gastoId'],
              equals: gasto.id,
            },
          },
        })

        if (alertaExistente) continue

        const multiplicador = Math.round(gasto.monto / promedioHistorico * 10) / 10

        alertas.push({
          tipo: 'GASTO_INUSUAL',
          prioridad: 'ALTA',
          titulo: `Gasto inusual detectado - ${gasto.categoriaRel?.descripcion || 'Sin categoría'}`,
          mensaje: `Se detectó un gasto de $${gasto.monto.toFixed(2)} en "${gasto.concepto}", que es ${multiplicador}x mayor que tu promedio habitual ($${promedioHistorico.toFixed(2)}).`,
          metadatos: {
            gastoId: gasto.id,
            concepto: gasto.concepto,
            monto: gasto.monto,
            categoria: gasto.categoriaRel?.descripcion,
            promedioHistorico: Math.round(promedioHistorico * 100) / 100,
            multiplicador,
            fecha: gasto.fecha,
          },
        })
      }
    } catch (error) {
      console.error('Error processing gastos inusuales alerts:', error)
    }

    return alertas
  }

  /**
   * Crea las alertas en la base de datos
   */
  async createAlertas(userId: string, alertas: AlertaGenerada[]): Promise<void> {
    try {
      for (const alerta of alertas) {
        await prisma.alerta.create({
          data: {
            userId,
            tipo: alerta.tipo,
            prioridad: alerta.prioridad,
            titulo: alerta.titulo,
            mensaje: alerta.mensaje,
            metadatos: alerta.metadatos,
            fechaExpiracion: alerta.fechaExpiracion,
            canales: ['IN_APP'], // Por defecto solo in-app
            gastoRecurrenteId: alerta.gastoRecurrenteId,
            prestamoId: alerta.prestamoId,
            inversionId: alerta.inversionId,
            presupuestoId: alerta.presupuestoId,
            tareaId: alerta.tareaId,
          },
        })
      }
    } catch (error) {
      console.error('Error creating alertas:', error)
      throw error
    }
  }

  /**
   * Ejecuta evaluación completa y crea alertas automáticamente
   */
  async runAutomaticEvaluation(userId: string): Promise<number> {
    try {
      const alertasGeneradas = await this.evaluateConditions(userId)
      
      if (alertasGeneradas.length > 0) {
        await this.createAlertas(userId, alertasGeneradas)
      }

      return alertasGeneradas.length
    } catch (error) {
      console.error('Error running automatic evaluation:', error)
      return 0
    }
  }
}

export default AlertEngine 