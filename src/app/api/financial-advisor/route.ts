import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { options } from "../auth/[...nextauth]/options"
import prisma from "@/lib/prisma"
import OpenAI from "openai"

// Configuración para evitar pre-rendering de la API
export const dynamic = 'force-dynamic'

// Verificar si OpenAI está configurado
const isOpenAIConfigured = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== ""

// Inicializar cliente de OpenAI solo si está configurado
let openai: OpenAI | null = null
if (isOpenAIConfigured) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
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

    // Obtener TODOS los datos financieros del usuario para el contexto RAG
    const contextData = await obtenerContextoCompleto(usuario.id, inversionId, context)
    
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
        isPersonalized: true,
        openaiConfigured: isOpenAIConfigured
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

// Función para obtener contexto completo del usuario (RAG)
async function obtenerContextoCompleto(userId: string, inversionId?: string, context?: string) {
  try {
    console.log("Obteniendo contexto completo para RAG del usuario:", userId);

    // Obtener fechas relevantes
    const now = new Date();
    const primerDiaMes = new Date(now.getFullYear(), now.getMonth(), 1);
    const ultimoDiaMes = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const hace3Meses = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    // 1. Gastos recurrentes
    const gastosRecurrentes = await prisma.gastoRecurrente.findMany({
      where: { userId },
      include: { categoria: true },
      orderBy: { monto: 'desc' }
    });

    // 2. Servicios contratados
    const servicios = await prisma.servicio.findMany({
      where: { userId },
      orderBy: { monto: 'desc' }
    });

    // 3. Préstamos activos
    const prestamos = await prisma.prestamo.findMany({
      where: { 
        userId,
        estado: { in: ['activo', 'vigente'] }
      },
      include: {
        pagos: {
          orderBy: { fechaVencimiento: 'desc' },
          take: 3
        }
      }
    });

    // 4. Financiaciones activas
    const financiaciones = await prisma.financiacion.findMany({
      where: { 
        userId,
        cuotasRestantes: { gt: 0 }
      },
      include: {
        gasto: true
      }
    });

    // 5. Gastos recientes (últimos 3 meses)
    const gastos = await prisma.gasto.findMany({
      where: { 
        userId,
        fecha: { 
          gte: hace3Meses,
          lte: ultimoDiaMes
        }
      },
      include: { 
        categoriaRel: true 
      },
      orderBy: { fecha: 'desc' },
      take: 100 // Limitar para no sobrecargar
    });

    // 6. Ingresos recientes
    const ingresos = await prisma.gasto.findMany({
      where: { 
        userId,
        tipoTransaccion: 'income',
        fecha: { 
          gte: hace3Meses,
          lte: ultimoDiaMes
        }
      },
      orderBy: { fecha: 'desc' }
    });

    // 7. Inversiones si es relevante
    let inversiones = [];
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
            take: 5
          }
        }
      });
    }

    // 8. Presupuestos activos
    const presupuestos = await prisma.presupuesto.findMany({
      where: { 
        userId
      },
      include: {
        categoria: true
      }
    });

    // Calcular totales y métricas
    const totalGastosRecurrentes = gastosRecurrentes.reduce((acc: number, g: any) => acc + Number(g.monto), 0);
    const totalServicios = servicios.reduce((acc: number, s: any) => acc + Number(s.monto), 0);
    const totalPrestamos = prestamos.reduce((acc: number, p: any) => acc + Number(p.cuotaMensual || 0), 0);
    const totalFinanciaciones = financiaciones.reduce((acc: number, f: any) => acc + Number(f.montoCuota), 0);
    
    const gastosUltimoMes = gastos.filter((g: any) => g.fecha >= primerDiaMes && g.tipoTransaccion === 'expense');
    const ingresosUltimoMes = ingresos.filter((i: any) => i.fecha >= primerDiaMes);
    
    const totalGastosVariables = gastosUltimoMes.reduce((acc: number, g: any) => acc + Number(g.monto), 0);
    const totalIngresos = ingresosUltimoMes.reduce((acc: number, i: any) => acc + Number(i.monto), 0);

    return {
      // Datos básicos
      gastosRecurrentes: gastosRecurrentes.map((g: any) => ({
        concepto: g.concepto,
        monto: Number(g.monto),
        periodicidad: g.periodicidad,
        categoria: g.categoria?.descripcion || 'Sin categoría'
      })),
      
      servicios: servicios.map((s: any) => ({
        nombre: s.nombre,
        monto: Number(s.monto),
        medioPago: s.medioPago,
        descripcion: s.descripcion
      })),

      // Deudas y compromisos
      prestamos: prestamos.map((p: any) => ({
        concepto: p.concepto,
        montoTotal: Number(p.montoTotal),
        cuotaMensual: Number(p.cuotaMensual || 0),
        cuotasPendientes: p.pagos?.length || 0,
        proximasCuotas: p.pagos?.map((c: any) => ({
          monto: Number(c.monto),
          fechaVencimiento: c.fechaVencimiento.toISOString().split('T')[0]
        })) || []
      })),

      financiaciones: financiaciones.map((f: any) => ({
        concepto: f.gasto?.concepto || 'Financiación',
        montoCuota: Number(f.montoCuota),
        cuotasRestantes: f.cuotasRestantes,
        montoTotal: Number(f.montoCuota) * f.cuotasRestantes
      })),

      // Métricas financieras
      resumenFinanciero: {
        totalGastosFijos: totalGastosRecurrentes + totalServicios,
        totalCompromisosMensuales: totalPrestamos + totalFinanciaciones,
        totalGastosVariables: totalGastosVariables,
        totalIngresos: totalIngresos,
        gastosFijosDetalle: {
          recurrentes: totalGastosRecurrentes,
          servicios: totalServicios,
          prestamos: totalPrestamos,
          financiaciones: totalFinanciaciones
        }
      },

      // Datos históricos para análisis
      gastosRecientes: gastosUltimoMes.slice(0, 20).map((g: any) => ({
        concepto: g.concepto,
        monto: Number(g.monto),
        fecha: g.fecha.toISOString().split('T')[0],
        categoria: g.categoriaRel?.descripcion || g.categoria || 'Sin categoría'
      })),

      // Inversiones si aplica
      inversiones: inversiones.map((i: any) => ({
        nombre: i.nombre,
        tipo: i.tipo?.nombre || 'Inversión',
        montoInicial: Number(i.montoInicial),
        valorActual: i.cotizaciones[0] ? Number(i.cotizaciones[0].valor) : Number(i.montoInicial),
        rendimiento: i.cotizaciones[0] ? Number(i.cotizaciones[0].valor) - Number(i.montoInicial) : 0
      })),

      // Presupuestos
      presupuestos: presupuestos.map((p: any) => ({
        categoria: p.categoria?.descripcion || 'General',
        limite: Number(p.limite),
        periodo: p.periodo
      }))
    };
  } catch (error) {
    console.error('Error al obtener contexto completo:', error);
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
  
  // Si no hay contexto, dar respuesta general
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
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userQuery }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      const response = completion.choices[0].message.content;
      console.log("Respuesta de OpenAI recibida:", response ? "Sí" : "No");
      return response || "Lo siento, no pude generar una respuesta. Por favor, intenta reformular tu pregunta.";
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