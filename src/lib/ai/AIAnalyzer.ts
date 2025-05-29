import OpenAI from 'openai'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY no está configurada en las variables de entorno')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 25000, // 25 segundos (menor que el timeout de Vercel)
  maxRetries: 2,  // Reintentos automáticos para mayor robustez
})

export interface GastoAnalisis {
  id: number
  concepto: string
  monto: number
  fecha: Date
  categoria: string
  tipoTransaccion: string
}

export interface PatronGasto {
  categoria: string
  montoPromedio: number
  frecuencia: number
  tendencia: 'ascendente' | 'descendente' | 'estable'
  variabilidad: number
}

export interface RecomendacionIA {
  tipo: 'ahorro' | 'presupuesto' | 'inversion' | 'alerta'
  titulo: string
  descripcion: string
  impactoEconomico: number
  prioridad: 'baja' | 'media' | 'alta' | 'critica'
  categoria?: string
  metadatos: Record<string, any>
}

export interface AlertaPredictiva {
  tipo: string
  titulo: string
  descripcion: string
  probabilidad: number
  fechaPrediccion: Date
  impacto: 'bajo' | 'medio' | 'alto'
  recomendacionesPrevention: string[]
}

export interface ReporteInteligente {
  periodo: string
  resumenEjecutivo: string
  insights: string[]
  tendenciasDetectadas: string[]
  recomendacionesPrincipales: RecomendacionIA[]
  prediccionesProximoMes: string[]
  scoreFinanciero: number
  comparativaAnterior: string
}

export class AIAnalyzer {
  /**
   * Analiza patrones de gastos de un usuario usando IA
   */
  async analizarPatronesGastos(userId: string, mesesAtras: number = 6): Promise<PatronGasto[]> {
    try {
      // Obtener datos de gastos
      const fechaInicio = new Date()
      fechaInicio.setMonth(fechaInicio.getMonth() - mesesAtras)

      const gastos = await prisma.gasto.findMany({
        where: {
          userId,
          fecha: {
            gte: fechaInicio,
          },
          tipoTransaccion: 'gasto',
        },
        include: {
          categoriaRel: true,
        },
        orderBy: {
          fecha: 'desc',
        },
      })

      if (gastos.length === 0) {
        return []
      }

      // Preparar datos para análisis
      const datosAnalisis = gastos.map(gasto => ({
        concepto: gasto.concepto,
        monto: gasto.monto,
        fecha: gasto.fecha.toISOString(),
        categoria: gasto.categoriaRel?.descripcion || gasto.categoria,
        tipoMovimiento: gasto.tipoMovimiento,
      }))

      // Prompt para OpenAI
      const prompt = `
Analiza los siguientes datos de gastos financieros y identifica patrones significativos:

DATOS DE GASTOS (últimos ${mesesAtras} meses):
${JSON.stringify(datosAnalisis, null, 2)}

Por favor, analiza y devuelve un JSON con el siguiente formato exacto:
{
  "patrones": [
    {
      "categoria": "nombre_categoria",
      "montoPromedio": numero,
      "frecuencia": numero_gastos_por_mes,
      "tendencia": "ascendente|descendente|estable",
      "variabilidad": numero_0_a_1
    }
  ]
}

Instrucciones específicas:
1. Agrupa por categoría y calcula estadísticas
2. Determina tendencias basadas en evolución temporal
3. Calcula variabilidad (0 = muy estable, 1 = muy variable)
4. Solo incluye categorías con al menos 3 transacciones
5. Devuelve SOLO el JSON, sin explicaciones adicionales
`

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Eres un analista financiero experto que analiza patrones de gastos y devuelve resultados en formato JSON estructurado."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      })

      const respuestaIA = completion.choices[0]?.message?.content
      if (!respuestaIA) {
        throw new Error('No se recibió respuesta de OpenAI')
      }

      // Parsear respuesta JSON
      const resultado = JSON.parse(respuestaIA)
      return resultado.patrones || []

    } catch (error) {
      console.error('Error analizando patrones:', error)
      return []
    }
  }

  /**
   * Genera recomendaciones personalizadas usando IA
   */
  async generarRecomendaciones(userId: string): Promise<RecomendacionIA[]> {
    try {
      // Obtener datos financieros del usuario
      const [gastos, presupuestos, prestamos, inversiones] = await Promise.all([
        this.obtenerDatosGastos(userId),
        this.obtenerDatosPresupuestos(userId),
        this.obtenerDatosPrestamos(userId),
        this.obtenerDatosInversiones(userId),
      ])

      const prompt = `
Como asesor financiero experto, analiza la situación financiera y genera recomendaciones personalizadas:

DATOS FINANCIEROS:
Gastos recientes: ${JSON.stringify(gastos)}
Presupuestos: ${JSON.stringify(presupuestos)}
Préstamos: ${JSON.stringify(prestamos)}
Inversiones: ${JSON.stringify(inversiones)}

Genera recomendaciones en formato JSON:
{
  "recomendaciones": [
    {
      "tipo": "ahorro|presupuesto|inversion|alerta",
      "titulo": "Título breve",
      "descripcion": "Descripción detallada y accionable",
      "impactoEconomico": numero_estimado_en_pesos,
      "prioridad": "baja|media|alta|critica",
      "categoria": "categoria_si_aplica",
      "metadatos": {
        "clave": "valor"
      }
    }
  ]
}

Prioriza recomendaciones que:
1. Generen mayor impacto económico
2. Sean fáciles de implementar
3. Se basen en patrones detectados
4. Ayuden a optimizar presupuestos
`

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Eres un asesor financiero personal que genera recomendaciones prácticas y personalizadas en formato JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2500,
      })

      const respuestaIA = completion.choices[0]?.message?.content
      if (!respuestaIA) {
        throw new Error('No se recibió respuesta de OpenAI')
      }

      const resultado = JSON.parse(respuestaIA)
      return resultado.recomendaciones || []

    } catch (error) {
      console.error('Error generando recomendaciones:', error)
      return []
    }
  }

  /**
   * Genera alertas predictivas basadas en tendencias
   */
  async generarAlertasPredictivas(userId: string): Promise<AlertaPredictiva[]> {
    try {
      const patrones = await this.analizarPatronesGastos(userId, 3)
      
      if (patrones.length === 0) {
        return []
      }

      const prompt = `
Basándote en estos patrones de gastos, predice posibles problemas financieros futuros:

PATRONES DETECTADOS:
${JSON.stringify(patrones, null, 2)}

Genera alertas predictivas en formato JSON:
{
  "alertas": [
    {
      "tipo": "presupuesto_superacion|gasto_excesivo|tendencia_negativa",
      "titulo": "Título de la alerta",
      "descripcion": "Descripción del riesgo predicho",
      "probabilidad": numero_0_a_100,
      "fechaPrediccion": "fecha_estimada_ISO",
      "impacto": "bajo|medio|alto",
      "recomendacionesPrevention": ["acción1", "acción2"]
    }
  ]
}

Enfócate en:
1. Tendencias ascendentes peligrosas
2. Categorías con alta variabilidad
3. Patrones que sugieren riesgos futuros
`

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Eres un analista de riesgos financieros que predice problemas futuros basándose en patrones de gasto."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000,
      })

      const respuestaIA = completion.choices[0]?.message?.content
      if (!respuestaIA) {
        throw new Error('No se recibió respuesta de OpenAI')
      }

      const resultado = JSON.parse(respuestaIA)
      const alertas = resultado.alertas || []

      // Convertir fechas string a Date
      return alertas.map((alerta: any) => ({
        ...alerta,
        fechaPrediccion: new Date(alerta.fechaPrediccion || Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días por defecto
      }))

    } catch (error) {
      console.error('Error generando alertas predictivas:', error)
      return []
    }
  }

  /**
   * Genera un reporte inteligente mensual
   */
  async generarReporteInteligente(userId: string, mes?: number, año?: number): Promise<ReporteInteligente | null> {
    try {
      const ahora = new Date()
      const mesReporte = mes || ahora.getMonth() + 1
      const añoReporte = año || ahora.getFullYear()

      // Obtener datos del mes
      const inicioMes = new Date(añoReporte, mesReporte - 1, 1)
      const finMes = new Date(añoReporte, mesReporte, 0)

      const [gastosMes, gastosAnterior, presupuestos, patrones] = await Promise.all([
        this.obtenerGastosPeriodo(userId, inicioMes, finMes),
        this.obtenerGastosPeriodo(userId, new Date(añoReporte, mesReporte - 2, 1), new Date(añoReporte, mesReporte - 1, 0)),
        this.obtenerDatosPresupuestos(userId),
        this.analizarPatronesGastos(userId, 3),
      ])

      const prompt = `
Genera un reporte financiero inteligente completo basado en estos datos:

PERÍODO: ${mesReporte}/${añoReporte}

GASTOS DEL MES:
${JSON.stringify(gastosMes)}

GASTOS MES ANTERIOR:
${JSON.stringify(gastosAnterior)}

PRESUPUESTOS:
${JSON.stringify(presupuestos)}

PATRONES DETECTADOS:
${JSON.stringify(patrones)}

Genera un reporte en formato JSON:
{
  "periodo": "${mesReporte}/${añoReporte}",
  "resumenEjecutivo": "Resumen ejecutivo de 2-3 líneas",
  "insights": ["insight1", "insight2", "insight3"],
  "tendenciasDetectadas": ["tendencia1", "tendencia2"],
  "recomendacionesPrincipales": [
    {
      "tipo": "ahorro",
      "titulo": "título",
      "descripcion": "descripción",
      "impactoEconomico": numero,
      "prioridad": "alta",
      "metadatos": {}
    }
  ],
  "prediccionesProximoMes": ["predicción1", "predicción2"],
  "scoreFinanciero": numero_0_a_100,
  "comparativaAnterior": "Comparación con mes anterior"
}

Enfócate en:
1. Análisis cuantitativo preciso
2. Insights accionables
3. Tendencias significativas
4. Recomendaciones prácticas
`

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Eres un analista financiero senior que genera reportes ejecutivos inteligentes con insights profundos y recomendaciones accionables."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 3000,
      })

      const respuestaIA = completion.choices[0]?.message?.content
      if (!respuestaIA) {
        throw new Error('No se recibió respuesta de OpenAI')
      }

      return JSON.parse(respuestaIA)

    } catch (error) {
      console.error('Error generando reporte inteligente:', error)
      return null
    }
  }

  /**
   * Detecta gastos anómalos usando IA
   */
  async detectarGastosAnomalos(userId: string): Promise<{ gastos: any[], explicacion: string }> {
    try {
      const gastos = await this.obtenerDatosGastos(userId, 30)
      
      if (gastos.length < 10) {
        return { gastos: [], explicacion: 'Insuficientes datos para análisis' }
      }

      const prompt = `
Analiza estos gastos y detecta anomalías o gastos inusuales:

GASTOS RECIENTES:
${JSON.stringify(gastos)}

Identifica gastos anómalos en formato JSON:
{
  "gastosAnomalos": [
    {
      "id": numero,
      "razonAnomalia": "descripción de por qué es anómalo",
      "nivelRiesgo": "bajo|medio|alto"
    }
  ],
  "explicacion": "Explicación general del análisis"
}

Considera anómalos gastos que:
1. Son significativamente mayores al promedio de la categoría
2. Ocurren en horarios/fechas inusuales
3. Representan patrones de compra atípicos
4. Tienen conceptos que no coinciden con el historial
`

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Eres un especialista en detección de fraudes y gastos anómalos que analiza patrones de transacciones."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      })

      const respuestaIA = completion.choices[0]?.message?.content
      if (!respuestaIA) {
        throw new Error('No se recibió respuesta de OpenAI')
      }

      const resultado = JSON.parse(respuestaIA)
      return {
        gastos: resultado.gastosAnomalos || [],
        explicacion: resultado.explicacion || 'Análisis completado'
      }

    } catch (error) {
      console.error('Error detectando gastos anómalos:', error)
      return { gastos: [], explicacion: 'Error en el análisis' }
    }
  }

  // Métodos auxiliares para obtener datos

  private async obtenerDatosGastos(userId: string, dias: number = 90) {
    const fechaInicio = new Date()
    fechaInicio.setDate(fechaInicio.getDate() - dias)

    const gastos = await prisma.gasto.findMany({
      where: {
        userId,
        fecha: { gte: fechaInicio },
        tipoTransaccion: 'gasto',
      },
      include: { categoriaRel: true },
      orderBy: { fecha: 'desc' },
      take: 100,
    })

    return gastos.map(gasto => ({
      id: gasto.id,
      concepto: gasto.concepto,
      monto: gasto.monto,
      fecha: gasto.fecha.toISOString(),
      categoria: gasto.categoriaRel?.descripcion || gasto.categoria,
      tipoMovimiento: gasto.tipoMovimiento,
    }))
  }

  private async obtenerGastosPeriodo(userId: string, inicio: Date, fin: Date) {
    const gastos = await prisma.gasto.findMany({
      where: {
        userId,
        fecha: { gte: inicio, lte: fin },
        tipoTransaccion: 'gasto',
      },
      include: { categoriaRel: true },
    })

    return gastos.map(gasto => ({
      concepto: gasto.concepto,
      monto: gasto.monto,
      categoria: gasto.categoriaRel?.descripcion || gasto.categoria,
    }))
  }

  private async obtenerDatosPresupuestos(userId: string) {
    const mesActual = new Date().getMonth() + 1
    const añoActual = new Date().getFullYear()

    const presupuestos = await prisma.presupuesto.findMany({
      where: { userId, mes: mesActual, año: añoActual },
      include: { categoria: true },
    })

    return presupuestos.map(p => ({
      categoria: p.categoria.descripcion,
      monto: p.monto,
      gastado: 0, // Se calculará después
    }))
  }

  private async obtenerDatosPrestamos(userId: string) {
    const prestamos = await prisma.prestamo.findMany({
      where: { userId, estado: 'activo' },
    })

    return prestamos.map(p => ({
      entidad: p.entidadFinanciera,
      cuotaMensual: p.cuotaMensual,
      cuotasPendientes: p.cuotasPendientes,
      fechaProximaCuota: p.fechaProximaCuota,
    }))
  }

  private async obtenerDatosInversiones(userId: string) {
    const inversiones = await prisma.inversion.findMany({
      where: { userId, estado: 'activa' },
      include: { tipo: true },
    })

    return inversiones.map(i => ({
      nombre: i.nombre,
      tipo: i.tipo.nombre,
      montoActual: i.montoActual,
      rendimientoTotal: i.rendimientoTotal,
      fechaVencimiento: i.fechaVencimiento,
    }))
  }
}

export default AIAnalyzer 