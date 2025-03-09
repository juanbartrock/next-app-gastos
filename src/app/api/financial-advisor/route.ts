import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { options } from "../auth/[...nextauth]/options"
import prisma from "@/lib/prisma"
import OpenAI from "openai"

// Inicializar cliente de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Tipo de mensajes
interface Message {
  role: "user" | "assistant"
  content: string
}

// Interfaces para datos contextuales
interface InversionContextData {
  id: string;
  nombre: string;
  tipo: string;
  montoInicial: number;
  montoActual: number;
  rendimientoTotal: number;
  rendimientoAnual: number;
  fechaInicio: string;
  fechaVencimiento: string | null;
  plataforma: string;
}

interface UsuarioContextData {
  gastosRecurrentes: {
    concepto: string;
    monto: number;
    periodicidad: string;
    categoria: string;
  }[];
  servicios: {
    nombre: string;
    monto: number;
    medioPago: string;
  }[];
  balanceFinanciero: {
    ingresos: number;
    gastos: number;
    balance: number;
    gastosRecurrentes: number;
    servicios: number;
  };
  gastosPorCategoria: {
    categoria: string;
    monto: number;
  }[];
  tendencias: {
    mayorGasto: string;
    montoMayorGasto: number;
  };
}

// Función para obtener datos personalizados del usuario
async function obtenerDatosUsuario(userId: string): Promise<UsuarioContextData | null> {
  try {
    console.log("Obteniendo datos personalizados para el usuario:", userId);

    // Obtener fecha de inicio y fin del mes actual
    const now = new Date();
    const primerDiaMes = new Date(now.getFullYear(), now.getMonth(), 1);
    const ultimoDiaMes = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    console.log(`Filtrando por mes actual: ${primerDiaMes.toISOString()} - ${ultimoDiaMes.toISOString()}`);

    // Obtener gastos recurrentes
    const gastosRecurrentes = await prisma.gastoRecurrente.findMany({
      where: { userId },
      include: { categoria: true },
      orderBy: { monto: 'desc' }
    });

    console.log(`Gastos recurrentes encontrados: ${gastosRecurrentes.length}`);

    // Obtener servicios contratados
    const servicios = await prisma.servicio.findMany({
      where: { userId },
      orderBy: { monto: 'desc' }
    });

    console.log(`Servicios encontrados: ${servicios.length}`);

    // Obtener gastos recientes de este mes
    const gastos = await prisma.gasto.findMany({
      where: { 
        userId,
        tipoTransaccion: 'expense',
        fecha: { 
          gte: primerDiaMes,
          lte: ultimoDiaMes
        }
      },
      include: { 
        categoriaRel: true 
      },
      orderBy: { fecha: 'desc' }
    });

    console.log(`Gastos de este mes encontrados: ${gastos.length}`);

    // Obtener ingresos recientes de este mes
    const ingresos = await prisma.gasto.findMany({
      where: { 
        userId,
        tipoTransaccion: 'income',
        fecha: { 
          gte: primerDiaMes,
          lte: ultimoDiaMes
        }
      },
      orderBy: { fecha: 'desc' }
    });

    console.log(`Ingresos de este mes encontrados: ${ingresos.length}`);

    // Calcular totales
    const totalGastos = gastos.reduce((acc, gasto) => acc + Number(gasto.monto), 0);
    const totalIngresos = ingresos.reduce((acc, ingreso) => acc + Number(ingreso.monto), 0);
    const totalGastosRecurrentes = gastosRecurrentes.reduce((acc, gasto) => acc + Number(gasto.monto), 0);
    const totalServicios = servicios.reduce((acc, servicio) => acc + Number(servicio.monto), 0);

    console.log(`Totales calculados - Gastos: ${totalGastos}, Ingresos: ${totalIngresos}, Recurrentes: ${totalGastosRecurrentes}, Servicios: ${totalServicios}`);

    // Agrupar gastos por categoría
    const gastosPorCategoria: Record<string, number> = {};
    gastos.forEach(gasto => {
      const categoria = gasto.categoriaRel?.descripcion || gasto.categoria || 'Sin categoría';
      gastosPorCategoria[categoria] = (gastosPorCategoria[categoria] || 0) + Number(gasto.monto);
    });

    // Ordenar categorías por monto total (de mayor a menor)
    const categoriasOrdenadas = Object.entries(gastosPorCategoria)
      .sort((a, b) => b[1] - a[1])
      .map(([categoria, monto]) => ({ categoria, monto }));

    console.log(`Categorías de gastos ordenadas: ${JSON.stringify(categoriasOrdenadas.slice(0, 3))}`);

    return {
      gastosRecurrentes: gastosRecurrentes.map(g => ({
        concepto: g.concepto,
        monto: Number(g.monto),
        periodicidad: g.periodicidad,
        categoria: g.categoria?.descripcion || 'Sin categoría'
      })),
      servicios: servicios.map(s => ({
        nombre: s.nombre,
        monto: Number(s.monto),
        medioPago: s.medioPago
      })),
      balanceFinanciero: {
        ingresos: totalIngresos,
        gastos: totalGastos,
        balance: totalIngresos - totalGastos,
        gastosRecurrentes: totalGastosRecurrentes,
        servicios: totalServicios
      },
      gastosPorCategoria: categoriasOrdenadas,
      tendencias: {
        mayorGasto: categoriasOrdenadas[0]?.categoria || 'Sin datos',
        montoMayorGasto: categoriasOrdenadas[0]?.monto || 0
      }
    };
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
    return null;
  }
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

    let contextData: InversionContextData | UsuarioContextData | null = null;
    let response = ""
    
    // Obtener usuario de la base de datos
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email || "" }
    })
    
    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Si hay un ID de inversión, obtener los datos para contextualizar las respuestas
    if (inversionId && context === "inversion") {
      try {
        // Obtener datos reales de la inversión desde la base de datos
        const inversion = await prisma.inversion.findUnique({
          where: { 
            id: inversionId,
            userId: usuario.id 
          },
          include: { 
            tipo: true,
            transacciones: true, 
            cotizaciones: {
              orderBy: { fecha: 'desc' },
              take: 1
            }
          }
        })
        
        if (inversion) {
          const inversionData: InversionContextData = {
            id: inversion.id,
            nombre: inversion.nombre,
            tipo: inversion.tipo?.nombre || "Inversión",
            montoInicial: Number(inversion.montoInicial),
            montoActual: inversion.cotizaciones[0] ? Number(inversion.cotizaciones[0].valor) : Number(inversion.montoInicial),
            rendimientoTotal: inversion.cotizaciones[0] ? Number(inversion.cotizaciones[0].valor) - Number(inversion.montoInicial) : 0,
            rendimientoAnual: inversion.rendimientoAnual || 0,
            fechaInicio: inversion.fechaInicio.toISOString().split('T')[0],
            fechaVencimiento: inversion.fechaVencimiento ? inversion.fechaVencimiento.toISOString().split('T')[0] : null,
            plataforma: inversion.plataforma || "No especificada"
          };
          contextData = inversionData;
        }
      } catch (error) {
        console.error("Error al obtener datos de inversión:", error)
      }
    } 
    // Para otros contextos (dashboard, recurrentes, etc.), obtener datos generales del usuario
    else if (context === "dashboard" || context === "general" || context === "recurrentes") {
      contextData = await obtenerDatosUsuario(usuario.id)
    }

    // Obtener la consulta del usuario
    let messageContent = lastMessage.content.toLowerCase()
    
    // Si es una solicitud de resumen desde el componente FinancialSummary, marcarla específicamente
    if (isResumenRequest) {
      console.log("Solicitud de resumen financiero detectada desde FinancialSummary");
      messageContent = "Por favor, genera un RESUMEN COMPLETO y DETALLADO de mi situación financiera actual, basado exclusivamente en mis datos reales. Incluye todos los datos relevantes sobre mi balance, gastos por categoría, gastos recurrentes y servicios. Muestra los números reales.";
    }

    // Generar una respuesta basada en el contexto y la consulta
    if (context === "inversion" && contextData) {
      const inversionData = contextData as InversionContextData;
      
      // Respuestas específicas para inversiones
      if (messageContent.includes("rendimiento") || messageContent.includes("ganancia") || messageContent.includes("rentabilidad")) {
        response = `Tu inversión "${inversionData.nombre}" tiene un rendimiento total de ${inversionData.rendimientoTotal} pesos, lo que representa un ${((inversionData.rendimientoTotal / inversionData.montoInicial) * 100).toFixed(2)}% sobre tu inversión inicial. El rendimiento anual estimado es de ${inversionData.rendimientoAnual}%.`
      } else if (messageContent.includes("comparar") || messageContent.includes("alternativa") || messageContent.includes("mejor opción")) {
        response = `Basándome en tu inversión actual "${inversionData.nombre}" con un rendimiento anual de ${inversionData.rendimientoAnual}%, podría sugerirte algunas alternativas:\n\n1. **Bonos soberanos indexados**: Podrían ofrecer rendimientos similares con garantía del estado.\n2. **Fondos Comunes de Inversión**: Algunos FCI tienen rendimientos superiores al ${inversionData.rendimientoAnual}% anual con riesgo moderado.\n3. **Obligaciones Negociables corporativas**: Algunas ON ofrecen tasas entre 10-15% con riesgo empresarial.\n\nRecuerda diversificar tu cartera para minimizar riesgos.`
      } else if (messageContent.includes("riesgo") || messageContent.includes("seguro") || messageContent.includes("seguridad")) {
        response = `Tu inversión en "${inversionData.nombre}" se considera de riesgo bajo a moderado. Los plazos fijos UVA están respaldados por el banco y cuentan con la garantía de depósitos hasta cierto monto. Si buscas diversificar el riesgo, podrías considerar distribuir tu capital entre distintos tipos de instrumentos y entidades financieras.`
      } else if (messageContent.includes("vencimiento") || messageContent.includes("renovar") || messageContent.includes("plazo")) {
        response = `Tu inversión vence el ${inversionData.fechaVencimiento || 'fecha no especificada'}. Al aproximarse esta fecha, tendrás que decidir si renovar en las mismas condiciones, buscar mejores tasas, o redireccionar esos fondos. Te recomendaría evaluar las tasas de interés vigentes una semana antes del vencimiento para tomar la mejor decisión.`
      } else {
        // Respuesta genérica sobre la inversión
        response = `Sobre tu inversión "${inversionData.nombre}" (${inversionData.tipo}) por un monto inicial de ${inversionData.montoInicial} pesos, puedo decirte que:\n\n- El valor actual es de ${inversionData.montoActual} pesos\n- Has generado un rendimiento de ${inversionData.rendimientoTotal} pesos (${((inversionData.rendimientoTotal / inversionData.montoInicial) * 100).toFixed(2)}%)\n- Comenzaste esta inversión el ${inversionData.fechaInicio}\n\n¿Hay algo específico que quieras saber sobre esta inversión o necesitas recomendaciones para optimizarla?`
      }
    } 
    // Si tenemos datos contextuales del usuario y es una consulta de dashboard/general
    else if ((context === "dashboard" || context === "general" || context === "recurrentes") && contextData) {
      // Usar OpenAI para generar respuestas personalizadas basadas en los datos del usuario
      try {
        // Convertir los datos del usuario a un formato que OpenAI pueda entender
        const usuarioData = contextData as UsuarioContextData;
        
        // Preparar datos para el prompt
        const datosGastosPorCategoria = usuarioData.gastosPorCategoria
          .map(cat => `${cat.categoria}: $${cat.monto.toFixed(2)}`)
          .join("\n");
        
        const datosServicios = usuarioData.servicios
          .map(s => `${s.nombre}: $${s.monto.toFixed(2)} (${s.medioPago})`)
          .join("\n");
        
        const datosGastosRecurrentes = usuarioData.gastosRecurrentes
          .map(g => `${g.concepto}: $${g.monto.toFixed(2)} (${g.periodicidad})`)
          .join("\n");
        
        const datosBalance = `
        Ingresos: $${usuarioData.balanceFinanciero.ingresos.toFixed(2)}
        Gastos: $${usuarioData.balanceFinanciero.gastos.toFixed(2)}
        Balance: $${usuarioData.balanceFinanciero.balance.toFixed(2)}
        Total gastos recurrentes: $${usuarioData.balanceFinanciero.gastosRecurrentes.toFixed(2)}
        Total servicios: $${usuarioData.balanceFinanciero.servicios.toFixed(2)}
        `;
        
        const datosContextuales = `
        === BALANCE FINANCIERO ===
        ${datosBalance}
        
        === GASTOS POR CATEGORÍA (ordenados de mayor a menor) ===
        ${datosGastosPorCategoria}
        
        === SERVICIOS CONTRATADOS ===
        ${datosServicios}
        
        === GASTOS RECURRENTES ===
        ${datosGastosRecurrentes}
        `;
        
        const systemPrompt = `
        Eres un asesor financiero personal de alto nivel. Tienes acceso a los siguientes datos financieros del usuario para el mes actual:
        
        ${datosContextuales}
        
        Tu tarea es proporcionar análisis detallados, consultas específicas y recomendaciones basadas EXCLUSIVAMENTE en estos datos reales.
        Utiliza formato markdown para estructurar tus respuestas de manera clara y profesional.
        Sé directo y específico, evitando frases genéricas cuando tengas datos concretos.
        Si te preguntan sobre información que no tienes, indícalo claramente y sugiere qué datos podrían necesitar registrar.
        Nunca inventes datos que no aparezcan en la información proporcionada arriba.
        
        Estructura tus respuestas de forma clara con encabezados, listas y/o tablas cuando sea apropiado.
        Si la respuesta contiene números, formatea las cantidades monetarias adecuadamente.
        `;

        // Hacer la consulta a OpenAI
        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: messageContent }
          ],
          temperature: 0.5
        });

        response = completion.choices[0].message.content || 
                   "Lo siento, no pude generar una respuesta. Por favor, intenta reformular tu pregunta.";
      } catch (error) {
        console.error("Error al generar respuesta con OpenAI:", error);
        
        // Seguir con la lógica actual como fallback en caso de error con OpenAI
        const usuarioData = contextData as UsuarioContextData;
        
        if (messageContent.includes("resumen") && messageContent.includes("situación financiera")) {
          // Crear un resumen estructurado con los datos del usuario
          const { balanceFinanciero, gastosPorCategoria, gastosRecurrentes, servicios } = usuarioData;
          
          let resumen = "## Resumen General\n";
          
          // Balance
          if (balanceFinanciero.ingresos > 0 || balanceFinanciero.gastos > 0) {
            const situacion = balanceFinanciero.balance >= 0 ? "positivo" : "negativo";
            resumen += `Tu balance mensual es ${situacion} con ${balanceFinanciero.ingresos.toFixed(2)} de ingresos y ${balanceFinanciero.gastos.toFixed(2)} de gastos, resultando en un balance de ${balanceFinanciero.balance.toFixed(2)}.\n\n`;
          } else {
            resumen += "No hay suficientes datos de ingresos y gastos para realizar un análisis completo.\n\n";
          }
          
          // Gastos principales
          resumen += "## Gastos Principales\n";
          if (gastosPorCategoria.length > 0) {
            resumen += "Tus principales categorías de gasto son:\n";
            gastosPorCategoria.slice(0, 3).forEach(cat => {
              resumen += `- **${cat.categoria}**: ${cat.monto.toFixed(2)}\n`;
            });
            resumen += "\n";
          } else {
            resumen += "No hay datos suficientes sobre tus gastos por categoría.\n\n";
          }
          
          // Gastos recurrentes
          resumen += "## Gastos Recurrentes y Servicios\n";
          if (gastosRecurrentes.length > 0 || servicios.length > 0) {
            resumen += `Tienes ${gastosRecurrentes.length} gastos recurrentes por un total de ${balanceFinanciero.gastosRecurrentes.toFixed(2)} y ${servicios.length} servicios contratados por ${balanceFinanciero.servicios.toFixed(2)}.\n\n`;
            
            // Mencionar los servicios más caros
            if (servicios.length > 0) {
              resumen += "Servicios destacados:\n";
              servicios.slice(0, 3).forEach(s => {
                resumen += `- **${s.nombre}**: ${s.monto.toFixed(2)}\n`;
              });
              resumen += "\n";
            }
          } else {
            resumen += "No tienes gastos recurrentes o servicios registrados.\n\n";
          }
          
          // Recomendaciones
          resumen += "## Recomendaciones\n";
          
          // Recomendaciones basadas en los datos
          if (balanceFinanciero.balance < 0) {
            resumen += "- **Reduce gastos**: Tu balance es negativo. Considera reducir gastos en " + (gastosPorCategoria[0]?.categoria || "categorías no esenciales") + ".\n";
          }
          
          if (servicios.length > 0) {
            resumen += "- **Revisa tus servicios**: Considera evaluar alternativas más económicas para " + servicios[0].nombre + ".\n";
          }
          
          if (balanceFinanciero.ingresos > 0 && balanceFinanciero.balance > 0) {
            const ahorroRecomendado = (balanceFinanciero.balance * 0.7).toFixed(2);
            resumen += `- **Ahorra e invierte**: Puedes destinar aproximadamente ${ahorroRecomendado} al ahorro o inversiones cada mes.\n`;
          }
          
          // Consejos generales
          resumen += "- **Presupuesto**: Establece límites para cada categoría de gasto.\n";
          
          response = resumen;
        } 
        // Para el contexto de gastos recurrentes específicamente
        else if (context === "recurrentes" && messageContent.includes("analiza") && messageContent.includes("servicio")) {
          // Análisis específico de servicios y gastos recurrentes
          const { servicios, gastosRecurrentes, balanceFinanciero } = usuarioData;
          
          // resto del código original para análisis de servicios...
          let analisis = "## Análisis de Servicios y Gastos Recurrentes\n\n";
          
          if (servicios.length > 0 || gastosRecurrentes.length > 0) {
            analisis += `Actualmente, dedicas ${balanceFinanciero.servicios.toFixed(2)} en servicios y ${balanceFinanciero.gastosRecurrentes.toFixed(2)} en gastos recurrentes mensualmente, representando un ${((balanceFinanciero.servicios + balanceFinanciero.gastosRecurrentes) / balanceFinanciero.ingresos * 100).toFixed(0)}% de tus ingresos.\n\n`;
            
            // Ordener servicios de mayor a menor costo para destacar los más costosos
            const serviciosOrdenados = [...servicios].sort((a, b) => b.monto - a.monto);
            
            if (serviciosOrdenados.length > 0) {
              analisis += "### Servicios con potencial de optimización:\n";
              
              // Analizar todos los servicios para encontrar los excesivos
              serviciosOrdenados.forEach(s => {
                analisis += `- **${s.nombre}** (${s.monto.toFixed(2)}): `;
                
                // Detección especial para servicios excesivamente caros (más del 15% de los ingresos o más de $25,000)
                const esCostoso = s.monto > 25000 || (balanceFinanciero.ingresos > 0 && s.monto > balanceFinanciero.ingresos * 0.15);
                
                // Sugerencias específicas por tipo de servicio
                if (s.nombre.toLowerCase().includes("telefonía") || s.nombre.toLowerCase().includes("celular") || s.nombre.toLowerCase().includes("móvil") || s.nombre.toLowerCase().includes("movil")) {
                  if (esCostoso) {
                    analisis += "**DETECTADO COSTO EXCESIVO**: Este servicio tiene un costo anormalmente alto para telefonía móvil. Te recomiendo urgentemente comparar planes de otros proveedores como Personal, Claro o Movistar que ofrecen planes completos por menos de $15,000. También puedes llamar a tu proveedor actual para negociar o consultar si hay descuentos por pago anual.\n";
                  } else {
                    analisis += "Compara planes de diferentes proveedores o negocia con tu proveedor actual para obtener un mejor precio.\n";
                  }
                } else if (s.nombre.toLowerCase().includes("streaming") || s.nombre.toLowerCase().includes("netflix") || s.nombre.toLowerCase().includes("disney") || s.nombre.toLowerCase().includes("hbo")) {
                  if (esCostoso) {
                    analisis += "**DETECTADO COSTO EXCESIVO**: Este servicio de streaming tiene un costo anormalmente alto. Considera cambiar a planes básicos o compartir cuentas familiares para reducir el costo drásticamente.\n";
                  } else {
                    analisis += "Considera compartir la cuenta con familiares o amigos para dividir el costo. También puedes alternar entre servicios de streaming mensualmente.\n";
                  }
                } else if (s.nombre.toLowerCase().includes("internet")) {
                  if (esCostoso) {
                    analisis += "**DETECTADO COSTO EXCESIVO**: Tu servicio de internet tiene un costo muy elevado. Compara con otros proveedores como Fibertel, Telecentro o Movistar que ofrecen planes de alta velocidad por menos de $20,000.\n";
                  } else {
                    analisis += "Verifica si hay promociones disponibles con tu proveedor actual o compara con otros proveedores de la zona.\n";
                  }
                } else {
                  if (esCostoso) {
                    analisis += "**DETECTADO COSTO EXCESIVO**: Este servicio representa un gasto significativo. Considera evaluar alternativas más económicas o negociar una tarifa menor.\n";
                  } else {
                    analisis += "Evalúa si estás aprovechando todo el valor de este servicio o si existe una alternativa más económica.\n";
                  }
                }
              });
              analisis += "\n";
            }
            
            // Resto del código original para gastos recurrentes...
            if (gastosRecurrentes.length > 0) {
              analisis += "### Recomendaciones para tus gastos recurrentes:\n";
              
              // Gastos de mayor valor
              const topGastos = gastosRecurrentes.slice(0, 2);
              topGastos.forEach(g => {
                analisis += `- **${g.concepto}** (${g.monto.toFixed(2)} - ${g.periodicidad}): `;
                
                if (g.periodicidad === "mensual" && g.monto > balanceFinanciero.ingresos * 0.1) {
                  analisis += "Este gasto representa una parte significativa de tus ingresos. Evalúa si puedes reducirlo o reemplazarlo.\n";
                } else {
                  analisis += "Reserva este monto con anticipación para evitar desbalances en tu presupuesto.\n";
                }
              });
              
              analisis += "\n";
            }
            
            // Conclusiones
            analisis += "### Estrategias de optimización:\n";
            analisis += "- Cancela servicios que no usas regularmente\n";
            analisis += "- Negocia mejores tarifas aprovechando promociones o descuentos\n";
            analisis += "- Considera alternativas más económicas para servicios equivalentes\n";
            analisis += "- Agrupa servicios similares con el mismo proveedor para obtener descuentos\n";
          } else {
            analisis += "No tienes servicios o gastos recurrentes registrados para analizar. Agregar esta información te permitirá recibir recomendaciones personalizadas para optimizar tus finanzas.";
          }
          
          response = analisis;
        }
        // Consultas específicas sobre servicios caros o recomendaciones de ahorro
        else if ((messageContent.includes("servicio") || messageContent.includes("servicios")) && 
                 (messageContent.includes("caro") || messageContent.includes("costoso") || messageContent.includes("ahorro") || 
                  messageContent.includes("optimizar") || messageContent.includes("telefonía") || messageContent.includes("móvil") || 
                  messageContent.includes("reducir") || messageContent.includes("alternativa"))) {
          
          // Verificar si hay servicios
          if (usuarioData.servicios && usuarioData.servicios.length > 0) {
            // Ordenar servicios de mayor a menor costo
            const serviciosOrdenados = [...usuarioData.servicios].sort((a, b) => b.monto - a.monto);
            
            let respuestaServicios = "## Análisis de tus Servicios Contratados\n\n";
            
            // Identificar servicios costosos (más del 15% de ingresos o más de $25,000)
            const serviciosCostosos = serviciosOrdenados.filter(s => 
              s.monto > 25000 || (usuarioData.balanceFinanciero.ingresos > 0 && s.monto > usuarioData.balanceFinanciero.ingresos * 0.15)
            );
            
            if (serviciosCostosos.length > 0) {
              respuestaServicios += "### Servicios con Costos Elevados Detectados:\n\n";
              
              serviciosCostosos.forEach(s => {
                const porcentajeIngreso = usuarioData.balanceFinanciero.ingresos > 0 
                  ? ((s.monto / usuarioData.balanceFinanciero.ingresos) * 100).toFixed(1) + "% de tus ingresos" 
                  : "una porción significativa de tus gastos";
                
                respuestaServicios += `**${s.nombre}** (${s.monto.toFixed(2)}): Representa ${porcentajeIngreso}\n\n`;
                
                // Recomendaciones específicas según el tipo de servicio
                if (s.nombre.toLowerCase().includes("telefonía") || s.nombre.toLowerCase().includes("celular") || s.nombre.toLowerCase().includes("móvil") || s.nombre.toLowerCase().includes("movil")) {
                  respuestaServicios += "**Recomendación urgente**: Este servicio tiene un costo anormalmente alto para telefonía móvil. Considera:\n";
                  respuestaServicios += "- Comparar planes de Claro, Personal o Movistar que ofrecen paquetes completos por $10,000-$15,000\n";
                  respuestaServicios += "- Consultar promociones por portabilidad que suelen incluir descuentos por varios meses\n";
                  respuestaServicios += "- Negociar con tu proveedor actual mencionando que estás considerando cambiarte\n";
                  respuestaServicios += "- Revisar si realmente necesitas todos los servicios incluidos en tu plan actual\n\n";
                } else if (s.nombre.toLowerCase().includes("internet")) {
                  respuestaServicios += "**Recomendación**: Este servicio de internet tiene un costo elevado. Considera:\n";
                  respuestaServicios += "- Comparar planes de Fibertel, Telecentro o Movistar Fibra\n";
                  respuestaServicios += "- Consultar promociones por nueva contratación o por pago anual\n";
                  respuestaServicios += "- Verificar si realmente necesitas la velocidad contratada\n\n";
                } else if (s.nombre.toLowerCase().includes("streaming") || s.nombre.toLowerCase().includes("netflix") || s.nombre.toLowerCase().includes("disney") || s.nombre.toLowerCase().includes("hbo")) {
                  respuestaServicios += "**Recomendación**: Este servicio de streaming tiene un costo elevado. Considera:\n";
                  respuestaServicios += "- Cambiar a un plan básico de menor costo\n";
                  respuestaServicios += "- Compartir la cuenta con familiares (planes familiares)\n";
                  respuestaServicios += "- Alternar servicios mes a mes en lugar de mantener todos activos simultáneamente\n\n";
                } else {
                  respuestaServicios += "**Recomendación**: Este servicio tiene un costo significativo. Considera:\n";
                  respuestaServicios += "- Buscar alternativas más económicas en el mercado\n";
                  respuestaServicios += "- Negociar una mejor tarifa con tu proveedor actual\n";
                  respuestaServicios += "- Evaluar si obtienes suficiente valor por el costo que pagas\n\n";
                }
              });
              
              respuestaServicios += "### Potencial ahorro mensual:\n";
              const ahorroEstimado = serviciosCostosos.reduce((total, s) => {
                // Estimar un ahorro del 40-60% en servicios con costos excesivos
                return total + (s.monto * 0.5);
              }, 0);
              
              respuestaServicios += `Si optimizas estos servicios costosos, podrías ahorrar aproximadamente ${ahorroEstimado.toFixed(2)} mensuales, lo que representa ${(ahorroEstimado * 12).toFixed(2)} anuales.\n\n`;
              
              respuestaServicios += "¿Te gustaría que te ayude a analizar opciones específicas para alguno de estos servicios?";
            } else {
              respuestaServicios += "He analizado tus servicios contratados y no detecté costos anormalmente elevados. Tus servicios actuales son:\n\n";
              
              serviciosOrdenados.slice(0, 3).forEach(s => {
                respuestaServicios += `- **${s.nombre}**: ${s.monto.toFixed(2)}\n`;
              });
              
              respuestaServicios += "\nAunque los costos no parecen excesivos, siempre es bueno revisar periódicamente tus servicios para asegurarte de que obtienes el mejor valor por tu dinero.";
            }
            
            response = respuestaServicios;
          } else {
            response = "No tengo información sobre tus servicios contratados. Para ayudarte a identificar oportunidades de ahorro, por favor registra tus servicios en la sección correspondiente.";
          }
        }
        // Consultas específicas sobre distribución de gastos por categoría
        else if ((messageContent.includes("distribución") || messageContent.includes("distribuyen") || messageContent.includes("distribuyeron") || 
                messageContent.includes("distribución") || messageContent.includes("categorías") || messageContent.includes("categorias")) && 
                (messageContent.includes("gastos") || messageContent.includes("gasto") || messageContent.includes("dinero") || messageContent.includes("plata"))) {
          // Verificar si hay datos de gastos por categoría
          if (usuarioData.gastosPorCategoria && usuarioData.gastosPorCategoria.length > 0) {
            const totalGastos = usuarioData.gastosPorCategoria.reduce((sum, cat) => sum + cat.monto, 0);
            
            // Construir una respuesta detallada con la distribución real
            let distribucionResponse = "### Distribución de tus gastos por categoría\n\n";
            
            // Tabla de distribución
            distribucionResponse += "| Categoría | Monto | % del Total |\n";
            distribucionResponse += "|-----------|-------|------------|\n";
            
            usuarioData.gastosPorCategoria.forEach(cat => {
              const porcentaje = totalGastos > 0 ? ((cat.monto / totalGastos) * 100).toFixed(1) : "0.0";
              distribucionResponse += `| ${cat.categoria} | ${cat.monto.toFixed(2)} | ${porcentaje}% |\n`;
            });
            
            distribucionResponse += "\n### Análisis de distribución\n\n";
            
            // Mencionar la categoría principal
            if (usuarioData.gastosPorCategoria.length > 0) {
              const categoriaPrincipal = usuarioData.gastosPorCategoria[0];
              const porcentajePrincipal = totalGastos > 0 ? ((categoriaPrincipal.monto / totalGastos) * 100).toFixed(1) : "0.0";
              
              distribucionResponse += `Tu categoría de mayor gasto es **${categoriaPrincipal.categoria}** con ${categoriaPrincipal.monto.toFixed(2)}, representando el ${porcentajePrincipal}% de tus gastos totales.\n\n`;
              
              // Agregar algunas recomendaciones específicas
              distribucionResponse += "### Recomendaciones basadas en tu distribución de gastos\n\n";
              
              if (parseFloat(porcentajePrincipal) > 40) {
                distribucionResponse += `- Considera revisar tus gastos en **${categoriaPrincipal.categoria}** ya que representan una proporción muy alta de tus gastos totales.\n`;
              }
              
              distribucionResponse += "- Una distribución equilibrada suele asignar no más del 30-35% a una sola categoría.\n";
              distribucionResponse += "- Revisa periódicamente esta distribución para identificar oportunidades de ahorro.\n";
            } else {
              distribucionResponse += "No hay suficientes datos para realizar un análisis detallado de la distribución de tus gastos.\n";
            }
            
            response = distribucionResponse;
          } else {
            response = "No tengo suficientes datos sobre tus gastos por categoría para mostrarte una distribución detallada. Para obtener un análisis más preciso, es importante que registres tus gastos regularmente y los asignes a categorías específicas.";
          }
        }
        // Continuando con la lógica original para otras preguntas
        else if (messageContent.includes("inversión") || messageContent.includes("invertir") || messageContent.includes("inversiones")) {
          const saldoDisponible = usuarioData.balanceFinanciero.balance > 0 ? usuarioData.balanceFinanciero.balance : 0;
          response = `Basándome en tu situación financiera actual, con un balance mensual de ${usuarioData.balanceFinanciero.balance.toFixed(2)}, podrías considerar invertir hasta ${(saldoDisponible * 0.7).toFixed(2)} mensualmente.\n\nLas opciones recomendadas según tu perfil incluyen:\n\n1. **Renta fija**: Plazos fijos tradicionales o UVA, bonos, obligaciones negociables (menor riesgo)\n2. **Renta variable**: Acciones locales o CEDEARs (mayor riesgo y potencial rendimiento)\n3. **Instrumentos indexados**: Ajustados por inflación o dólar, como bonos CER o dollar linked\n4. **Fondos Comunes de Inversión**: Diversificados según tu perfil de riesgo\n\n¿Te gustaría que profundice en alguna de estas alternativas?`;
        } else if (messageContent.includes("ahorro") || messageContent.includes("ahorrar")) {
          response = `Analizando tus finanzas, podrías ahorrar aproximadamente ${(usuarioData.balanceFinanciero.balance * 0.2).toFixed(2)} por mes siguiendo estas recomendaciones personalizadas:\n\n1. Reduce gastos en ${usuarioData.gastosPorCategoria[0]?.categoria || "tu categoría principal de gastos"}\n2. Crea un presupuesto mensual detallado con límites para cada categoría\n3. Automatiza tus ahorros mediante transferencias programadas\n4. Sigue la regla 50/30/20: 50% para necesidades, 30% para deseos y 20% para ahorros\n5. Considera reducir o renegociar el costo de tus servicios contratados\n\n¿Necesitas ayuda con alguno de estos puntos en particular?`;
        } else if (messageContent.includes("deuda") || messageContent.includes("préstamo") || messageContent.includes("crédito")) {
          response = "Para gestionar efectivamente tus deudas:\n\n1. Haz un inventario completo de todas tus deudas (montos, tasas, plazos)\n2. Prioriza pagar las deudas con tasas más altas primero\n3. Considera consolidar deudas si tienes múltiples préstamos\n4. Negocia mejores condiciones con tus acreedores\n5. Establece un plan de pagos realista\n6. Evita asumir nuevas deudas mientras reduces las existentes\n\n¿Hay algo específico sobre este tema que te gustaría consultar?";
        } else if (messageContent.includes("presupuesto") || messageContent.includes("gastos")) {
          const categoriasGasto = usuarioData.gastosPorCategoria.slice(0, 3).map(c => c.categoria).join(", ");
          response = `Basándome en tus datos, tus principales categorías de gasto son: ${categoriasGasto}. Para crear un presupuesto efectivo:\n\n1. Documenta tus ingresos mensuales de ${usuarioData.balanceFinanciero.ingresos.toFixed(2)}\n2. Asigna límites a cada categoría, especialmente a ${usuarioData.gastosPorCategoria[0]?.categoria || "tu categoría principal"}\n3. Distingue entre gastos fijos (como tus ${usuarioData.gastosRecurrentes.length} gastos recurrentes) y variables\n4. Reserva ${(usuarioData.balanceFinanciero.ingresos * 0.2).toFixed(2)} mensualmente para ahorros\n5. Revisa y ajusta tu presupuesto mensualmente\n\n¿Necesitas ayuda con algún aspecto particular?`;
        } else if (messageContent.includes("inflación") || messageContent.includes("proteger") || messageContent.includes("valor")) {
          response = "Para proteger tu dinero frente a la inflación, considera:\n\n1. Instrumentos indexados: Plazos fijos UVA, bonos ajustados por CER\n2. Inversiones en moneda extranjera o atadas al dólar\n3. Activos reales como propiedades\n4. Acciones de empresas con capacidad de ajustar precios\n5. Diversificación en múltiples clases de activos\n\nLa clave está en que el rendimiento de tus inversiones supere la tasa de inflación para mantener el poder adquisitivo de tu dinero.";
        } else {
          // Respuesta genérica sobre finanzas personales
          response = "Para mejorar tu situación financiera, te recomiendo enfocarte en estos pilares fundamentales:\n\n1. Crear un presupuesto claro y realista\n2. Establecer un fondo de emergencia (3-6 meses de gastos)\n3. Reducir y eliminar deudas, especialmente las de alto interés\n4. Ahorrar consistentemente (idealmente 20% de tus ingresos)\n5. Invertir para hacer crecer tu patrimonio y protegerlo de la inflación\n6. Protegerte con seguros adecuados\n\n¿Te gustaría que profundice en alguno de estos aspectos?";
        }
      }
    } else {
      // Si no hay datos de contexto, dar una respuesta genérica
      if (messageContent.includes("inversión") || messageContent.includes("invertir") || messageContent.includes("inversiones")) {
        response = "Para invertir de manera efectiva, es importante considerar tu perfil de riesgo, horizonte temporal y objetivos financieros. Las opciones más comunes en Argentina incluyen:\n\n1. **Renta fija**: Plazos fijos tradicionales o UVA, bonos, obligaciones negociables (menor riesgo)\n2. **Renta variable**: Acciones locales o CEDEARs (mayor riesgo y potencial rendimiento)\n3. **Instrumentos indexados**: Ajustados por inflación o dólar, como bonos CER o dollar linked\n4. **Fondos Comunes de Inversión**: Diversificados según tu perfil de riesgo\n\n¿Te gustaría que profundice en alguna de estas alternativas?";
      } else if (messageContent.includes("ahorro") || messageContent.includes("ahorrar")) {
        response = "Para mejorar tus hábitos de ahorro, te recomiendo:\n\n1. Define objetivos claros (corto, mediano y largo plazo)\n2. Crea un presupuesto mensual detallado\n3. Automatiza tus ahorros (transferencias automáticas)\n4. Sigue la regla 50/30/20: 50% para necesidades, 30% para deseos y 20% para ahorros\n5. Reduce gastos innecesarios identificando fugas de dinero\n6. Busca instrumentos que te protejan de la inflación\n\n¿Necesitas ayuda con alguno de estos puntos en particular?";
      } else if (messageContent.includes("deuda") || messageContent.includes("préstamo") || messageContent.includes("crédito")) {
        response = "Para gestionar efectivamente tus deudas:\n\n1. Haz un inventario completo de todas tus deudas (montos, tasas, plazos)\n2. Prioriza pagar las deudas con tasas más altas primero\n3. Considera consolidar deudas si tienes múltiples préstamos\n4. Negocia mejores condiciones con tus acreedores\n5. Establece un plan de pagos realista\n6. Evita asumir nuevas deudas mientras reduces las existentes\n\n¿Hay algo específico sobre este tema que te gustaría consultar?";
      } else if (messageContent.includes("presupuesto") || messageContent.includes("gastos")) {
        response = "Para crear y mantener un presupuesto efectivo:\n\n1. Documenta todos tus ingresos mensuales\n2. Registra y categoriza todos tus gastos\n3. Distingue entre gastos fijos, variables y discrecionales\n4. Establece límites realistas para cada categoría\n5. Revisa y ajusta tu presupuesto mensualmente\n6. Usa herramientas digitales o apps para facilitar el seguimiento\n\n¿Necesitas ayuda con algún aspecto particular de tu presupuesto?";
      } else if (messageContent.includes("inflación") || messageContent.includes("proteger") || messageContent.includes("valor")) {
        response = "Para proteger tu dinero frente a la inflación, considera:\n\n1. Instrumentos indexados: Plazos fijos UVA, bonos ajustados por CER\n2. Inversiones en moneda extranjera o atadas al dólar\n3. Activos reales como propiedades\n4. Acciones de empresas con capacidad de ajustar precios\n5. Diversificación en múltiples clases de activos\n\nLa clave está en que el rendimiento de tus inversiones supere la tasa de inflación para mantener el poder adquisitivo de tu dinero.";
      } else {
        // Respuesta genérica sobre finanzas personales
        response = "Para mejorar tu situación financiera, te recomiendo enfocarte en estos pilares fundamentales:\n\n1. Crear un presupuesto claro y realista\n2. Establecer un fondo de emergencia (3-6 meses de gastos)\n3. Reducir y eliminar deudas, especialmente las de alto interés\n4. Ahorrar consistentemente (idealmente 20% de tus ingresos)\n5. Invertir para hacer crecer tu patrimonio y protegerlo de la inflación\n6. Protegerte con seguros adecuados\n\n¿Te gustaría que profundice en alguno de estos aspectos?";
      }
    }

    // Devolver la respuesta
    return NextResponse.json({ 
      response,
      debug: {
        financialDataExists: contextData !== null, // Indica si hay datos financieros del usuario
        contextType: context, // Tipo de contexto utilizado
        isPersonalized: (context === "dashboard" || context === "general" || context === "recurrentes" || context === "inversion") && contextData !== null
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