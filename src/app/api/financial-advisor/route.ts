import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { options } from "../auth/[...nextauth]/options"
import prisma from "@/lib/prisma"
import OpenAI from "openai"

// Configuración para evitar pre-rendering de la API
export const dynamic = 'force-dynamic'
export const maxDuration = 25 // Máximo 25 segundos en Vercel

// Verificar si OpenAI está configurado
const isOpenAIConfigured = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== ""

// Inicializar cliente de OpenAI solo si está configurado
let openai: OpenAI | null = null
if (isOpenAIConfigured) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 30000, // Aumentar a 30 segundos
    maxRetries: 2  // Agregar reintentos
  })
}

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
    const { messages, inversionId, context, isResumenRequest } = await req.json()

    // Verificar que messages sea un array válido
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Formato de mensajes inválido" }, { status: 400 })
    }

    // Obtener el último mensaje del usuario
    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role !== "user") {
      return NextResponse.json({ error: "El último mensaje debe ser del usuario" }, { status: 400 })
    }

    // Obtener usuario de la base de datos
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email || "" }
    })
    
    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Optimización: Para consultas de seguimiento cortas, evitar recargar todo el contexto
    const isShortFollowUp = messages.length > 1 && 
      lastMessage.content.length < 50 && 
      !lastMessage.content.toLowerCase().includes('vencimiento') &&
      !lastMessage.content.toLowerCase().includes('análisis') &&
      !lastMessage.content.toLowerCase().includes('resumen');

    let contextData = null;
    
    if (!isShortFollowUp || messages.length <= 2) {
      // Obtener TODOS los datos financieros del usuario para el contexto RAG
      contextData = await obtenerContextoCompleto(usuario.id, inversionId, context);
    }
    
    // Generar respuesta usando el LLM con contexto completo
    const response = await generarRespuestaInteligente(
      messages, 
      contextData, 
      lastMessage.content,
      isResumenRequest
    )

    // Devolver la respuesta
    return NextResponse.json({ 
      response,
      debug: {
        financialDataExists: contextData !== null,
        contextType: context,
        isPersonalized: contextData !== null,
        openaiConfigured: isOpenAIConfigured,
        shortFollowUpOptimization: isShortFollowUp
      }
    })
  } catch (error) {
    console.error("Error en la API del asesor financiero:", error)
    return NextResponse.json(
      { error: "Error al procesar la consulta" },
      { status: 500 }
    )
  }
}

// Función para obtener contexto completo del usuario (RAG) - OPTIMIZADA
async function obtenerContextoCompleto(userId: string, inversionId?: string, context?: string) {
  try {
    console.log("Obteniendo contexto completo para RAG del usuario:", userId);

    // Obtener fechas relevantes - solo el mes actual y anterior
    const now = new Date();
    const primerDiaMesActual = new Date(now.getFullYear(), now.getMonth(), 1);
    const primerDiaMesAnterior = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Ejecutar consultas en paralelo para optimizar tiempo
    const [
      gastosRecurrentes,
      servicios,
      prestamos,
      financiaciones,
      gastosRecientes,
      ingresos,
      presupuestos
    ] = await Promise.all([
      // 1. Gastos recurrentes - solo los más importantes
      prisma.gastoRecurrente.findMany({
        where: { userId },
        include: { categoria: true },
        orderBy: { monto: 'desc' },
        take: 15 // Limitar a 15 más importantes
      }),

      // 2. Servicios contratados - solo los más importantes
      prisma.servicio.findMany({
        where: { userId },
        orderBy: { monto: 'desc' },
        take: 15 // Limitar a 15 más importantes
      }),

      // 3. Préstamos activos
      prisma.prestamo.findMany({
        where: { 
          userId,
          estado: { in: ['activo', 'vigente'] }
        },
        include: {
          pagos: {
            orderBy: { fechaVencimiento: 'desc' },
            take: 2 // Solo últimos 2 pagos
          }
        },
        take: 10 // Máximo 10 préstamos
      }),

      // 4. Financiaciones activas
      prisma.financiacion.findMany({
        where: { 
          userId,
          cuotasRestantes: { gt: 0 }
        },
        include: {
          gasto: true
        },
        take: 15 // Máximo 15 financiaciones
      }),

      // 5. Gastos recientes (solo últimos 2 meses, limitados)
      prisma.gasto.findMany({
        where: { 
          userId,
          fechaImputacion: { 
            gte: primerDiaMesAnterior
          }
        },
        include: { 
          categoriaRel: true 
        },
        orderBy: { createdAt: 'desc' },
        take: 50 // Reducir a 50 gastos más recientes
      }),

      // 6. Ingresos recientes (solo últimos 2 meses)
      prisma.gasto.findMany({
        where: { 
          userId,
          tipoTransaccion: 'income',
          fechaImputacion: { 
            gte: primerDiaMesAnterior
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20 // Máximo 20 ingresos
      }),

      // 7. Presupuestos activos - solo los más importantes
      prisma.presupuesto.findMany({
        where: { userId },
        include: { categoria: true },
        take: 10 // Máximo 10 presupuestos
      })
    ]);

    // 8. Inversiones solo si es relevante (consulta condicional)
    let inversiones: any[] = [];
    if (context === "inversion" || inversionId) {
      inversiones = await prisma.inversion.findMany({
        where: inversionId ? { id: inversionId, userId } : { userId },
        include: {
          tipo: true,
          cotizaciones: {
            orderBy: { fecha: 'desc' },
            take: 1
          },
          transacciones: {
            orderBy: { fecha: 'desc' },
            take: 3 // Solo últimas 3 transacciones
          }
        },
        take: 5 // Máximo 5 inversiones
      });
    }

    // Calcular totales y métricas
    const totalGastosRecurrentes = gastosRecurrentes.reduce((acc: number, g: any) => acc + Number(g.monto), 0);
    const totalServicios = servicios.reduce((acc: number, s: any) => acc + Number(s.monto), 0);
    const totalPrestamos = prestamos.reduce((acc: number, p: any) => acc + Number(p.cuotaMensual || 0), 0);
    const totalFinanciaciones = financiaciones.reduce((acc: number, f: any) => acc + Number(f.montoCuota), 0);
    
    const gastosUltimoMes = gastosRecientes.filter((g: any) => g.fechaImputacion >= primerDiaMesActual && g.tipoTransaccion === 'expense');
    const ingresosUltimoMes = ingresos.filter((i: any) => i.fechaImputacion >= primerDiaMesActual);
    
    const totalGastosVariables = gastosUltimoMes.reduce((acc: number, g: any) => acc + Number(g.monto), 0);
    const totalIngresos = ingresosUltimoMes.reduce((acc: number, i: any) => acc + Number(i.monto), 0);

    const resumenFinanciero = {
      totalGastosFijos: totalGastosRecurrentes + totalServicios,
      totalCompromisosMensuales: totalPrestamos + totalFinanciaciones,
      totalGastosVariables,
      totalIngresos,
      gastosRecurrientesCount: gastosRecurrentes.length,
      serviciosCount: servicios.length,
      prestamosActivos: prestamos.length,
      financiacionesActivas: financiaciones.length,
      gastosFijosDetalle: {
        recurrentes: totalGastosRecurrentes,
        servicios: totalServicios,
        prestamos: totalPrestamos,
        financiaciones: totalFinanciaciones
      }
    };

    return {
      resumenFinanciero,
      gastosRecurrentes: gastosRecurrentes.map((g: any) => ({
        concepto: g.concepto,
        monto: Number(g.monto),
        periodicidad: g.periodicidad,
        categoria: g.categoria?.nombre || 'Sin categoría'
      })),
      servicios: servicios.map((s: any) => ({
        nombre: s.nombre,
        monto: Number(s.monto),
        medioPago: s.medioPago,
        estado: s.estado
      })),
      prestamos: prestamos.map((p: any) => ({
        concepto: p.concepto,
        cuotaMensual: Number(p.cuotaMensual),
        cuotasPendientes: p.cuotasPendientes,
        fechaVencimiento: p.fechaVencimiento
      })),
      financiaciones: financiaciones.map((f: any) => ({
        concepto: f.gasto?.concepto || f.concepto || 'Sin concepto',
        montoCuota: Number(f.montoCuota),
        cuotasRestantes: f.cuotasRestantes,
        totalFinanciacion: Number(f.totalFinanciacion)
      })),
      presupuestos: presupuestos.map((p: any) => ({
        nombre: p.nombre,
        montoLimite: Number(p.montoLimite),
        categoria: p.categoria?.nombre || 'Sin categoría',
        periodo: p.periodo
      })),
      // Datos históricos para análisis
      gastosRecientes: gastosRecientes.slice(0, 20).map((g: any) => ({
        concepto: g.concepto,
        monto: Number(g.monto),
        fecha: g.fechaImputacion ? g.fechaImputacion.toISOString() : g.fecha.toISOString(),
        categoria: g.categoriaRel?.nombre || 'Sin categoría',
        tipoMovimiento: g.tipoMovimiento
      })),
      ingresos: ingresos.slice(0, 10).map((i: any) => ({
        concepto: i.concepto,
        monto: Number(i.monto),
        fecha: i.fechaImputacion ? i.fechaImputacion.toISOString() : i.fecha.toISOString()
      })),
      inversiones: inversiones.map((inv: any) => ({
        nombre: inv.nombre,
        tipo: inv.tipo?.nombre,
        montoInvertido: Number(inv.montoInvertido),
        valorActual: Number(inv.valorActual),
        rendimiento: inv.rendimiento
      }))
    };

  } catch (error) {
    console.error("Error al obtener contexto financiero:", error);
    return null;
  }
}

// Función principal para generar respuesta inteligente usando LLM
async function generarRespuestaInteligente(
  messages: Message[], 
  contextData: any, 
  userQuery: string,
  isResumenRequest: boolean = false
): Promise<string> {
  
  console.log("=== DEBUG ASESOR FINANCIERO ===");
  console.log("OpenAI configurado:", isOpenAIConfigured);
  console.log("Contexto disponible:", contextData !== null);
  console.log("Query del usuario:", userQuery);
  console.log("Número de mensajes:", messages.length);
  
  // Para consultas de seguimiento sin contexto, usar el historial
  if (!contextData && messages.length > 1) {
    console.log("Consulta de seguimiento sin contexto - usando historial");
    return generarRespuestaSeguimiento(userQuery, messages);
  }
  
  // Si no hay contexto en primera consulta, dar respuesta general
  if (!contextData) {
    console.log("Sin contexto - usando respuesta general");
    return generarRespuestaGeneral(userQuery);
  }

  // Preparar el contexto para el LLM
  const contextoFinanciero = prepararContextoParaLLM(contextData);
  console.log("Contexto preparado:", contextoFinanciero.substring(0, 200) + "...");
  
  // Preparar el historial de conversación
  const historialConversacion = messages.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n');

  const systemPrompt = `Eres un asesor financiero personal experto y conversacional. Tienes acceso a los datos financieros completos del usuario.

DATOS FINANCIEROS DEL USUARIO:
${contextoFinanciero}

HISTORIAL DE CONVERSACIÓN RECIENTE:
${historialConversacion}

INSTRUCCIONES:
1. Responde de manera conversacional y natural, como un asesor financiero humano
2. Usa EXCLUSIVAMENTE los datos proporcionados arriba
3. Si el usuario menciona cifras (como "7 millones de ingresos"), úsalas en tu análisis
4. Sé específico con números y porcentajes basados en los datos reales
5. Proporciona recomendaciones prácticas y accionables
6. Usa formato markdown para estructurar tu respuesta
7. Si no tienes información suficiente, dilo claramente y sugiere qué datos necesitas
8. Mantén el contexto de la conversación anterior

IMPORTANTE: No inventes datos. Solo usa la información proporcionada.`;

  try {
    // Intentar usar OpenAI si está configurado
    if (isOpenAIConfigured && openai) {
      console.log("Intentando usar OpenAI...");
      
      // Crear una promesa con timeout manual adicional
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout de OpenAI')), 25000); // Aumentar a 25 segundos
      });
      
      const openaiPromise = openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userQuery }
        ],
        temperature: 0.7,
        max_tokens: 800, // Reducir tokens para respuesta más rápida
        presence_penalty: 0.6,
        frequency_penalty: 0.3
      });

      try {
        const completion = await Promise.race([openaiPromise, timeoutPromise]) as any;
        const response = completion.choices[0].message.content;
        console.log("Respuesta de OpenAI recibida:", response ? "Sí" : "No");
        return response || "Lo siento, no pude generar una respuesta. Por favor, intenta reformular tu pregunta.";
      } catch (error) {
        console.error("Error específico de OpenAI:", error);
        console.log("Usando fallback por error de OpenAI");
        return generarRespuestaContextual(userQuery, contextData, messages);
      }
    } else {
      console.log("OpenAI no configurado - usando fallback contextual");
      // Fallback a respuestas predefinidas pero inteligentes
      return generarRespuestaContextual(userQuery, contextData, messages);
    }
  } catch (error) {
    console.error("Error al generar respuesta con LLM:", error);
    console.log("Usando fallback por error");
    return generarRespuestaContextual(userQuery, contextData, messages);
  }
}

// Función para preparar el contexto en formato legible para el LLM
function prepararContextoParaLLM(contextData: any): string {
  const { resumenFinanciero, gastosRecurrentes, servicios, prestamos, financiaciones, gastosRecientes, inversiones } = contextData;
  
  let contexto = `=== RESUMEN FINANCIERO ===\n`;
  contexto += `• Total gastos fijos mensuales: $${resumenFinanciero.totalGastosFijos.toLocaleString('es-AR')}\n`;
  contexto += `  - Gastos recurrentes: $${resumenFinanciero.gastosFijosDetalle.recurrentes.toLocaleString('es-AR')}\n`;
  contexto += `  - Servicios: $${resumenFinanciero.gastosFijosDetalle.servicios.toLocaleString('es-AR')}\n`;
  contexto += `• Total compromisos de deuda mensual: $${resumenFinanciero.totalCompromisosMensuales.toLocaleString('es-AR')}\n`;
  contexto += `  - Préstamos: $${resumenFinanciero.gastosFijosDetalle.prestamos.toLocaleString('es-AR')}\n`;
  contexto += `  - Financiaciones: $${resumenFinanciero.gastosFijosDetalle.financiaciones.toLocaleString('es-AR')}\n`;
  contexto += `• Gastos variables último mes: $${resumenFinanciero.totalGastosVariables.toLocaleString('es-AR')}\n`;
  contexto += `• Ingresos registrados último mes: $${resumenFinanciero.totalIngresos.toLocaleString('es-AR')}\n\n`;

  if (gastosRecurrentes.length > 0) {
    contexto += `=== GASTOS RECURRENTES (${gastosRecurrentes.length} conceptos) ===\n`;
    gastosRecurrentes.slice(0, 10).forEach((g: any) => {
      contexto += `• ${g.concepto}: $${g.monto.toLocaleString('es-AR')} (${g.periodicidad}) - ${g.categoria}\n`;
    });
    contexto += `\n`;
  }

  if (servicios.length > 0) {
    contexto += `=== SERVICIOS CONTRATADOS (${servicios.length} servicios) ===\n`;
    servicios.slice(0, 10).forEach((s: any) => {
      contexto += `• ${s.nombre}: $${s.monto.toLocaleString('es-AR')} (${s.medioPago})\n`;
    });
    contexto += `\n`;
  }

  if (prestamos.length > 0) {
    contexto += `=== PRÉSTAMOS ACTIVOS ===\n`;
    prestamos.forEach((p: any) => {
      contexto += `• ${p.concepto}: Cuota mensual $${p.cuotaMensual.toLocaleString('es-AR')}, ${p.cuotasPendientes} cuotas pendientes\n`;
    });
    contexto += `\n`;
  }

  if (financiaciones.length > 0) {
    contexto += `=== FINANCIACIONES ACTIVAS ===\n`;
    financiaciones.forEach((f: any) => {
      contexto += `• ${f.concepto}: $${f.montoCuota.toLocaleString('es-AR')} x ${f.cuotasRestantes} cuotas restantes\n`;
    });
    contexto += `\n`;
  }

  return contexto;
}

// Función de fallback para respuestas contextuales sin LLM
function generarRespuestaContextual(userQuery: string, contextData: any, messages: Message[]): string {
  const { resumenFinanciero, gastosRecurrentes, servicios, prestamos, financiaciones } = contextData;
  
  console.log("=== GENERANDO RESPUESTA CONTEXTUAL ===");
  console.log("Gastos recurrentes:", gastosRecurrentes?.length || 0);
  console.log("Servicios:", servicios?.length || 0);
  console.log("Préstamos:", prestamos?.length || 0);
  console.log("Financiaciones:", financiaciones?.length || 0);
  
  // Detectar si menciona ingresos en la consulta actual o en el historial
  const mencionaIngresos = /(\d+)\s*(millones?|mill?)/i.test(userQuery);
  let ingresosEstimados = 0;
  
  if (mencionaIngresos) {
    const match = userQuery.match(/(\d+)\s*(millones?|mill?)/i);
    if (match) {
      ingresosEstimados = parseInt(match[1]) * 1000000;
      console.log("Ingresos detectados en consulta:", ingresosEstimados);
    }
  } else {
    // Buscar en el historial de mensajes
    for (const message of messages) {
      if (message.role === "user") {
        const matchHistorial = message.content.match(/(\d+)\s*(millones?|mill?)/i);
        if (matchHistorial) {
          ingresosEstimados = parseInt(matchHistorial[1]) * 1000000;
          console.log("Ingresos detectados en historial:", ingresosEstimados);
          break;
        }
      }
    }
  }

  const totalCompromisos = resumenFinanciero.totalGastosFijos + resumenFinanciero.totalCompromisosMensuales;
  console.log("Total compromisos calculado:", totalCompromisos);
  
  let respuesta = `## Análisis de tu Situación Financiera\n\n`;
  
  if (ingresosEstimados > 0) {
    const porcentajeCompromisos = ((totalCompromisos / ingresosEstimados) * 100).toFixed(1);
    const disponible = ingresosEstimados - totalCompromisos;
    
    respuesta += `Basándome en tus ingresos de **$${ingresosEstimados.toLocaleString('es-AR')}** mensuales y analizando tus datos:\n\n`;
    
    respuesta += `### 📊 Tu Situación Actual\n`;
    respuesta += `- **Gastos fijos**: $${resumenFinanciero.totalGastosFijos.toLocaleString('es-AR')}\n`;
    respuesta += `  - Gastos recurrentes: $${resumenFinanciero.gastosFijosDetalle.recurrentes.toLocaleString('es-AR')} (${gastosRecurrentes?.length || 0} conceptos)\n`;
    respuesta += `  - Servicios: $${resumenFinanciero.gastosFijosDetalle.servicios.toLocaleString('es-AR')} (${servicios?.length || 0} servicios)\n`;
    
    if (resumenFinanciero.totalCompromisosMensuales > 0) {
      respuesta += `- **Compromisos de deuda**: $${resumenFinanciero.totalCompromisosMensuales.toLocaleString('es-AR')}\n`;
      if (prestamos?.length > 0) {
        respuesta += `  - Préstamos: $${resumenFinanciero.gastosFijosDetalle.prestamos.toLocaleString('es-AR')} (${prestamos.length} préstamos)\n`;
      }
      if (financiaciones?.length > 0) {
        respuesta += `  - Financiaciones: $${resumenFinanciero.gastosFijosDetalle.financiaciones.toLocaleString('es-AR')} (${financiaciones.length} financiaciones)\n`;
      }
    }
    
    respuesta += `- **Total comprometido**: $${totalCompromisos.toLocaleString('es-AR')} (**${porcentajeCompromisos}%** de tus ingresos)\n`;
    respuesta += `- **Disponible**: $${disponible.toLocaleString('es-AR')} (**${(100 - parseFloat(porcentajeCompromisos)).toFixed(1)}%**)\n\n`;
    
    // Análisis de la situación
    if (parseFloat(porcentajeCompromisos) > 70) {
      respuesta += `🚨 **Situación crítica**: Tus compromisos fijos representan ${porcentajeCompromisos}% de tus ingresos.\n\n`;
      respuesta += `### ⚠️ Recomendaciones Urgentes:\n`;
      respuesta += `- Revisar inmediatamente todos los gastos no esenciales\n`;
      respuesta += `- Considerar renegociar términos de préstamos si es posible\n`;
      respuesta += `- Evaluar cancelar servicios menos prioritarios\n`;
    } else if (parseFloat(porcentajeCompromisos) > 50) {
      respuesta += `⚡ **Situación ajustada**: Tus compromisos representan ${porcentajeCompromisos}% de tus ingresos.\n\n`;
      respuesta += `### 💡 Recomendaciones:\n`;
      respuesta += `- Mantener control estricto de gastos variables\n`;
      respuesta += `- Buscar oportunidades de optimización en servicios\n`;
      respuesta += `- Crear un fondo de emergencia gradualmente\n`;
    } else {
      respuesta += `✅ **Buena situación**: Tienes un margen saludable del ${(100 - parseFloat(porcentajeCompromisos)).toFixed(1)}%.\n\n`;
      respuesta += `### 🎯 Oportunidades:\n`;
      respuesta += `- Potencial de ahorro: $${(disponible * 0.3).toLocaleString('es-AR')} mensuales\n`;
      respuesta += `- Considera inversiones para hacer crecer tu dinero\n`;
      respuesta += `- Establece metas de ahorro específicas\n`;
    }
    
    respuesta += `\n### 📝 Consideraciones Importantes\n`;
    respuesta += `- Este análisis se basa en tus gastos fijos registrados\n`;
    respuesta += `- Los gastos variables (supermercado, ocio) no están incluidos en este cálculo\n`;
    respuesta += `- Considera reservar al menos $${(disponible * 0.2).toLocaleString('es-AR')} para emergencias\n`;
    
    // Análisis específico de los gastos más altos
    if (gastosRecurrentes?.length > 0) {
      const gastoMasAlto = gastosRecurrentes[0];
      respuesta += `\n### 🔍 Análisis Detallado\n`;
      respuesta += `- Tu gasto recurrente más alto es **${gastoMasAlto.concepto}**: $${gastoMasAlto.monto.toLocaleString('es-AR')}\n`;
      respuesta += `- Esto representa el ${((gastoMasAlto.monto / ingresosEstimados) * 100).toFixed(1)}% de tus ingresos\n`;
    }
    
  } else {
    respuesta += `### 📋 Compromisos Mensuales Registrados\n`;
    respuesta += `- **Gastos fijos**: $${resumenFinanciero.totalGastosFijos.toLocaleString('es-AR')}\n`;
    if (resumenFinanciero.totalCompromisosMensuales > 0) {
      respuesta += `- **Compromisos de deuda**: $${resumenFinanciero.totalCompromisosMensuales.toLocaleString('es-AR')}\n`;
    }
    respuesta += `- **Total**: $${totalCompromisos.toLocaleString('es-AR')}\n\n`;
    respuesta += `Para un análisis completo de tu situación, menciona tus ingresos mensuales aproximados.\n`;
  }
  
  return respuesta;
}

// Función para generar respuestas generales sin datos específicos
function generarRespuestaGeneral(messageContent: string): string {
  const textoLower = messageContent.toLowerCase();
  
  if (textoLower.includes('presupuesto')) {
    return `## Cómo crear un presupuesto efectivo\n\n### 📊 Regla 50/30/20:\n- **50%** para necesidades (alquiler, comida, servicios)\n- **30%** para deseos (entretenimiento, compras)\n- **20%** para ahorro e inversión\n\n### 📝 Pasos a seguir:\n1. Registra todos tus ingresos mensuales\n2. Lista todos tus gastos fijos\n3. Establece límites para gastos variables\n4. Revisa y ajusta mensualmente\n\n¿Te gustaría que profundice en algún aspecto específico?`;
  }
  
  if (textoLower.includes('ahorro') || textoLower.includes('ahorrar')) {
    return `## Estrategias de ahorro efectivas\n\n### 🎯 Métodos probados:\n- **Pago automático**: Transfiere a ahorro apenas cobres\n- **Regla de las 24 horas**: Espera un día antes de compras grandes\n- **Método de sobres**: Asigna efectivo para cada categoría\n- **Desafío 52 semanas**: Ahorra incrementalmente cada semana\n\n### 💡 Tips específicos:\n- Cancela suscripciones que no uses\n- Compara precios antes de comprar\n- Cocina más en casa\n- Usa transporte público cuando sea posible\n\n¿Hay alguna área específica donde quieras ahorrar más?`;
  }
  
  if (textoLower.includes('inversión') || textoLower.includes('invertir')) {
    return `## Guía de inversión para principiantes\n\n### 🏗️ Antes de invertir:\n1. **Fondo de emergencia**: 3-6 meses de gastos\n2. **Deudas de alto interés**: Págalas primero\n3. **Objetivos claros**: Define para qué inviertes\n\n### 📈 Opciones en Argentina:\n- **Conservador**: Plazos fijos UVA, LECAP\n- **Moderado**: Fondos comunes, ONs\n- **Agresivo**: Acciones, CEDEARs\n\n### ⚠️ Principios clave:\n- Diversifica siempre\n- Invierte solo lo que puedas permitirte perder\n- Piensa a largo plazo\n- Edúcate constantemente\n\n¿Te interesa algún tipo de inversión en particular?`;
  }
  
  // Respuesta conversacional general
  return `Entiendo tu consulta sobre finanzas personales. Te puedo ayudar con:\n\n### 💰 Áreas de especialidad:\n- **Presupuestos**: Cómo crear y mantener un presupuesto efectivo\n- **Ahorro**: Estrategias para ahorrar más dinero\n- **Inversiones**: Opciones de inversión según tu perfil\n- **Deudas**: Cómo manejar y eliminar deudas\n- **Planificación**: Objetivos financieros a corto y largo plazo\n\n### 📊 Para análisis personalizados:\nRegistra tus gastos recurrentes y servicios en la aplicación para obtener recomendaciones específicas basadas en tu situación real.\n\n¿Hay algún tema específico en el que te gustaría que profundice?`;
}

// Nueva función para manejar consultas de seguimiento
function generarRespuestaSeguimiento(userQuery: string, messages: Message[]): string {
  console.log("=== GENERANDO RESPUESTA DE SEGUIMIENTO ===");
  
  const textoLower = userQuery.toLowerCase();
  
  // Detectar si es una aclaración sobre ingresos
  if (textoLower.includes('ingreso') || textoLower.includes('comienzo') || textoLower.includes('registr')) {
    return `Perfecto, entiendo que comenzarás a registrar tus ingresos desde el 1 de junio. Eso explica por qué no aparecen ingresos en el sistema actualmente.

Una vez que registres tus ingresos, podremos hacer un análisis mucho más preciso de tu situación financiera y darte recomendaciones específicas sobre:

📊 **Análisis que podremos hacer:**
- Porcentaje real de gastos fijos vs ingresos
- Capacidad de ahorro disponible
- Optimización de gastos según tus prioridades
- Planificación para objetivos específicos

💡 **Tip**: Cuando registres tus ingresos, incluye:
- Sueldo neto
- Ingresos extra (freelance, ventas, etc.)
- Cualquier ingreso recurrente

¿Hay algo específico de tus gastos actuales que te gustaría optimizar mientras tanto?`;
  }
  
  // Buscar en el historial si se mencionaron ingresos antes
  let ingresosEstimados = 0;
  for (const message of messages) {
    if (message.role === "user") {
      const match = message.content.match(/(\d+)\s*(millones?|mill?)/i);
      if (match) {
        ingresosEstimados = parseInt(match[1]) * 1000000;
        break;
      }
    }
  }
  
  if (ingresosEstimados > 0) {
    return `Teniendo en cuenta los ingresos de $${ingresosEstimados.toLocaleString('es-AR')} que mencionaste anteriormente, y considerando que comenzarás a registrarlos formalmente en junio:

### 📝 Recomendaciones para el registro:
- Registra todos los ingresos desde el 1 de junio
- Categoriza bien cada tipo de ingreso
- Incluye fechas exactas para un mejor seguimiento

### 🎯 Una vez que tengas los datos completos:
- Podremos calcular tu capacidad real de ahorro
- Identificar oportunidades de optimización
- Crear un plan financiero personalizado

¿Te interesa que analice algún aspecto específico de tus gastos fijos actuales?`;
  }
  
  // Respuesta general de seguimiento
  return `Entiendo tu consulta. Para darte una respuesta más específica, necesitaría acceder a tus datos financieros actualizados.

### 💡 Mientras tanto, puedo ayudarte con:
- Análisis de gastos fijos que ya tienes registrados
- Recomendaciones generales de optimización
- Estrategias de ahorro y planificación

¿Hay algún aspecto específico de tus finanzas que te preocupe o en el que quieras trabajar?`;
} 