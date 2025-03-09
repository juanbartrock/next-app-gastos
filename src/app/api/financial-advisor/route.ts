import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { options } from "../auth/[...nextauth]/options"
import prisma from "@/lib/prisma"

// Tipo de mensajes
interface Message {
  role: "user" | "assistant"
  content: string
}

export async function POST(req: NextRequest) {
  try {
    // Verificar si el usuario está autenticado
    const session = await getServerSession(options)
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener los datos de la solicitud
    const { messages, inversionId, context } = await req.json()

    // Verificar que messages sea un array válido
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Formato de mensajes inválido" }, { status: 400 })
    }

    // Obtener el último mensaje del usuario
    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role !== "user") {
      return NextResponse.json({ error: "El último mensaje debe ser del usuario" }, { status: 400 })
    }

    let contextData = null
    let response = ""

    // Si hay un ID de inversión, obtener los datos para contextualizar las respuestas
    if (inversionId && context === "inversion") {
      try {
        // Aquí obtendrías los datos reales de la inversión desde la base de datos
        // El siguente código es una simulación mientras se implementa la funcionalidad completa
        
        // Simular obtención de datos de inversión
        const inversion = {
          id: inversionId,
          nombre: "Plazo Fijo UVA",
          tipo: "Plazo Fijo UVA",
          montoInicial: 500000,
          montoActual: 530000,
          rendimientoTotal: 30000,
          rendimientoAnual: 9.5,
          fechaInicio: "2023-12-01",
          fechaVencimiento: "2024-06-01",
          plataforma: "Banco Nación"
        }

        // En una implementación real, esta información se obtendría de la base de datos:
        // const inversion = await prisma.inversion.findUnique({
        //   where: { id: inversionId, userId: session.user.id },
        //   include: { tipo: true, transacciones: true, cotizaciones: true }
        // })

        contextData = inversion
      } catch (error) {
        console.error("Error al obtener datos de inversión:", error)
      }
    }

    // Obtener la consulta del usuario
    const userQuery = lastMessage.content.toLowerCase()

    // Generar una respuesta basada en el contexto y la consulta
    if (context === "inversion" && contextData) {
      // Respuestas específicas para inversiones
      if (userQuery.includes("rendimiento") || userQuery.includes("ganancia") || userQuery.includes("rentabilidad")) {
        response = `Tu inversión "${contextData.nombre}" tiene un rendimiento total de ${contextData.rendimientoTotal} pesos, lo que representa un ${((contextData.rendimientoTotal / contextData.montoInicial) * 100).toFixed(2)}% sobre tu inversión inicial. El rendimiento anual estimado es de ${contextData.rendimientoAnual}%.`
      } else if (userQuery.includes("comparar") || userQuery.includes("alternativa") || userQuery.includes("mejor opción")) {
        response = `Basándome en tu inversión actual "${contextData.nombre}" con un rendimiento anual de ${contextData.rendimientoAnual}%, podría sugerirte algunas alternativas:\n\n1. **Bonos soberanos indexados**: Podrían ofrecer rendimientos similares con garantía del estado.\n2. **Fondos Comunes de Inversión**: Algunos FCI tienen rendimientos superiores al ${contextData.rendimientoAnual}% anual con riesgo moderado.\n3. **Obligaciones Negociables corporativas**: Algunas ON ofrecen tasas entre 10-15% con riesgo empresarial.\n\nRecuerda diversificar tu cartera para minimizar riesgos.`
      } else if (userQuery.includes("riesgo") || userQuery.includes("seguro") || userQuery.includes("seguridad")) {
        response = `Tu inversión en "${contextData.nombre}" se considera de riesgo bajo a moderado. Los plazos fijos UVA están respaldados por el banco y cuentan con la garantía de depósitos hasta cierto monto. Si buscas diversificar el riesgo, podrías considerar distribuir tu capital entre distintos tipos de instrumentos y entidades financieras.`
      } else if (userQuery.includes("vencimiento") || userQuery.includes("renovar") || userQuery.includes("plazo")) {
        response = `Tu inversión vence el ${contextData.fechaVencimiento}. Al aproximarse esta fecha, tendrás que decidir si renovar en las mismas condiciones, buscar mejores tasas, o redireccionar esos fondos. Te recomendaría evaluar las tasas de interés vigentes una semana antes del vencimiento para tomar la mejor decisión.`
      } else {
        // Respuesta genérica sobre la inversión
        response = `Sobre tu inversión "${contextData.nombre}" (${contextData.tipo}) por un monto inicial de ${contextData.montoInicial} pesos, puedo decirte que:\n\n- El valor actual es de ${contextData.montoActual} pesos\n- Has generado un rendimiento de ${contextData.rendimientoTotal} pesos (${((contextData.rendimientoTotal / contextData.montoInicial) * 100).toFixed(2)}%)\n- Comenzaste esta inversión el ${contextData.fechaInicio}\n\n¿Hay algo específico que quieras saber sobre esta inversión o necesitas recomendaciones para optimizarla?`
      }
    } else {
      // Respuestas para consultas generales de finanzas
      if (userQuery.includes("inversión") || userQuery.includes("invertir") || userQuery.includes("inversiones")) {
        response = "Para invertir de manera efectiva, es importante considerar tu perfil de riesgo, horizonte temporal y objetivos financieros. Las opciones más comunes en Argentina incluyen:\n\n1. **Renta fija**: Plazos fijos tradicionales o UVA, bonos, obligaciones negociables (menor riesgo)\n2. **Renta variable**: Acciones locales o CEDEARs (mayor riesgo y potencial rendimiento)\n3. **Instrumentos indexados**: Ajustados por inflación o dólar, como bonos CER o dollar linked\n4. **Fondos Comunes de Inversión**: Diversificados según tu perfil de riesgo\n\n¿Te gustaría que profundice en alguna de estas alternativas?"
      } else if (userQuery.includes("ahorro") || userQuery.includes("ahorrar")) {
        response = "Para mejorar tus hábitos de ahorro, te recomiendo:\n\n1. Define objetivos claros (corto, mediano y largo plazo)\n2. Crea un presupuesto mensual detallado\n3. Automatiza tus ahorros (transferencias automáticas)\n4. Sigue la regla 50/30/20: 50% para necesidades, 30% para deseos y 20% para ahorros\n5. Reduce gastos innecesarios identificando fugas de dinero\n6. Busca instrumentos que te protejan de la inflación\n\n¿Necesitas ayuda con alguno de estos puntos en particular?"
      } else if (userQuery.includes("deuda") || userQuery.includes("préstamo") || userQuery.includes("crédito")) {
        response = "Para gestionar efectivamente tus deudas:\n\n1. Haz un inventario completo de todas tus deudas (montos, tasas, plazos)\n2. Prioriza pagar las deudas con tasas más altas primero\n3. Considera consolidar deudas si tienes múltiples préstamos\n4. Negocia mejores condiciones con tus acreedores\n5. Establece un plan de pagos realista\n6. Evita asumir nuevas deudas mientras reduces las existentes\n\n¿Hay algo específico sobre este tema que te gustaría consultar?"
      } else if (userQuery.includes("presupuesto") || userQuery.includes("gastos")) {
        response = "Para crear y mantener un presupuesto efectivo:\n\n1. Documenta todos tus ingresos mensuales\n2. Registra y categoriza todos tus gastos\n3. Distingue entre gastos fijos, variables y discrecionales\n4. Establece límites realistas para cada categoría\n5. Revisa y ajusta tu presupuesto mensualmente\n6. Usa herramientas digitales o apps para facilitar el seguimiento\n\n¿Necesitas ayuda con algún aspecto particular de tu presupuesto?"
      } else if (userQuery.includes("inflación") || userQuery.includes("proteger") || userQuery.includes("valor")) {
        response = "Para proteger tu dinero frente a la inflación, considera:\n\n1. Instrumentos indexados: Plazos fijos UVA, bonos ajustados por CER\n2. Inversiones en moneda extranjera o atadas al dólar\n3. Activos reales como propiedades\n4. Acciones de empresas con capacidad de ajustar precios\n5. Diversificación en múltiples clases de activos\n\nLa clave está en que el rendimiento de tus inversiones supere la tasa de inflación para mantener el poder adquisitivo de tu dinero."
      } else {
        // Respuesta genérica sobre finanzas personales
        response = "Para mejorar tu situación financiera, te recomiendo enfocarte en estos pilares fundamentales:\n\n1. Crear un presupuesto claro y realista\n2. Establecer un fondo de emergencia (3-6 meses de gastos)\n3. Reducir y eliminar deudas, especialmente las de alto interés\n4. Ahorrar consistentemente (idealmente 20% de tus ingresos)\n5. Invertir para hacer crecer tu patrimonio y protegerlo de la inflación\n6. Protegerte con seguros adecuados\n\n¿Te gustaría que profundice en alguno de estos aspectos?"
      }
    }

    // Devolver la respuesta
    return NextResponse.json({ response })
  } catch (error) {
    console.error("Error en la API del asesor financiero:", error)
    return NextResponse.json(
      { error: "Error al procesar la consulta" },
      { status: 500 }
    )
  }
} 