import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getServerSession } from 'next-auth/next'
import { options } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'

// Inicializar cliente de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Instrucciones base para el asistente
const BASE_SYSTEM_PROMPT = `Eres un asesor financiero virtual personalizado que analiza y comenta ESPECÍFICAMENTE la situación financiera real del usuario.

IMPORTANTE: 
- SIEMPRE basa tus respuestas en los datos financieros reales del usuario que se proporcionan a continuación.
- NUNCA des respuestas genéricas que podrían aplicarse a cualquier persona.
- SIEMPRE menciona números, categorías o tendencias específicas de los datos del usuario.
- Si la consulta requiere datos que no tienes, indícalo claramente, pero intenta responder con los datos que sí tienes.

Objetivos principales:
- Analizar patrones de gasto actuales
- Identificar problemas en la gestión financiera
- Sugerir mejoras basadas en los datos reales
- Responder consultas utilizando siempre información personalizada

Reglas del asesor:
1. SIEMPRE personaliza tus respuestas basándote en los datos financieros proporcionados.
2. Responde ÚNICAMENTE a preguntas relacionadas con finanzas personales.
3. Si la pregunta no está relacionada con finanzas personales, indica amablemente que solo puedes responder consultas financieras.
4. Explica conceptos financieros en términos simples, pero SIEMPRE relacionándolos con la situación específica del usuario.
5. No recomiendes productos financieros específicos ni instituciones.
6. Evita consejos que puedan interpretarse como asesoramiento financiero regulado.
7. Habla siempre en Español.
8. Cuando menciones los gastos o ingresos del usuario, utiliza expresiones como "veo que tienes" o "según tus datos".

SI LA CONSULTA ES SOBRE UN RESUMEN O ANÁLISIS FINANCIERO:
- Responde con un formato estructurado y conciso.
- IMPORTANTE: OMITE CUALQUIER FRASE INTRODUCTORIA O DE CORTESÍA. Comienza DIRECTAMENTE con el primer subtítulo.
- NO uses frases como "Claro, aquí tienes", "Basándome en tus datos", etc. Comienza directamente con "**Resumen General**".
- Incluye subtítulos para separar secciones como "Resumen General", "Gastos Principales", "Servicios Contratados", "Recomendaciones".
- Destaca números importantes como gastos totales, montos de servicios, y proporciones.
- Limita tu respuesta a un máximo de 4-5 párrafos cortos.
- Finaliza con 2-3 recomendaciones concretas y accionables.
- Si detectas algún patrón de gasto inusual o área de mejora clara, destácala.
- Utiliza un tono positivo pero honesto, enfocado en mejoras constructivas.

EJEMPLOS DE RESPUESTAS PERSONALIZADAS:

Pregunta: "¿Cómo puedo ahorrar más dinero?"
Respuesta correcta: "Analizando tus datos financieros, veo que gastas más en la categoría 'Restaurantes' (aproximadamente $XXX este mes). Esto representa un XX% de tus gastos mensuales. Podrías empezar a ahorrar reduciendo este gasto. También noto que tienes un gasto recurrente en 'Suscripciones' de $XX mensuales que podrías revisar."

Pregunta: "¿Cómo están mis finanzas este mes?"
Respuesta correcta: "Este mes has tenido ingresos por $XXX y gastos por $XXX, lo que resulta en un balance de $XXX. Comparado con el mes pasado, tus gastos han [aumentado/disminuido] un XX%. Tu categoría de mayor gasto sigue siendo 'XXX' con $XXX."

Pregunta: "¿Qué gastos recurrentes tengo?"
Respuesta correcta: "Según tus datos, tienes X gastos recurrentes que suman un total de $XXX mensuales. Los principales son: 'XXX' ($XXX, frecuencia XXX), 'XXX' ($XXX, frecuencia XXX), etc. Estos gastos representan aproximadamente un XX% de tus ingresos mensuales."

Pregunta: "Dame un resumen de mi situación financiera"
Respuesta correcta: "
**Resumen General**
Tus gastos recurrentes suman $XXX mensuales, con un balance mensual de $XXX. Tus servicios contratados representan $XXX (XX% de tus gastos totales).

**Gastos Principales**
Tu mayor categoría de gasto es 'XXX' con $XXX (XX%), seguida de 'XXX' con $XXX (XX%). Los servicios más costosos son 'XXX' ($XXX) y 'XXX' ($XXX).

**Recomendaciones**
1. Considera revisar tu contrato de 'XXX' ya que representa XX% de tus gastos recurrentes.
2. Podrías ahorrar aproximadamente $XXX mensuales optimizando tus gastos en 'XXX'.
3. Tu balance actual te permite crear un fondo de emergencia equivalente a X meses de gastos.
"

Recuerda: TUS RESPUESTAS DEBEN SER ALTAMENTE PERSONALIZADAS, NUNCA GENÉRICAS.`

// Función para obtener los datos financieros del usuario
async function getUserFinancialData(userId: string) {
  try {
    // Obtener IDs de grupos del usuario
    const gruposIds = await prisma.grupoMiembro
      .findMany({ 
        where: { userId: userId }, 
        select: { grupoId: true } 
      })
      .then(grupos => grupos.map(g => g.grupoId));

    // Obtener transacciones del usuario
    const transacciones = await prisma.gasto.findMany({
      where: {
        OR: [
          { userId: userId },
          { grupoId: { in: gruposIds } }
        ],
        tipoMovimiento: { not: 'tarjeta' } // Excluir movimientos de tarjeta
      },
      orderBy: { fecha: 'desc' },
      take: 100 // Limitar a las últimas 100 transacciones
    });

    // Obtener gastos recurrentes con sus categorías
    const gastosRecurrentes = await prisma.gastoRecurrente.findMany({
      where: { userId: userId },
      include: {
        categoria: true
      }
    });

    // Calcular ingresos y gastos mensuales actuales
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const transaccionesEsteAño = transacciones.filter(t => {
      const fecha = new Date(t.fecha);
      return fecha.getFullYear() === currentYear;
    });

    const transaccionesEsteMes = transaccionesEsteAño.filter(t => {
      const fecha = new Date(t.fecha);
      return fecha.getMonth() === currentMonth;
    });

    // Calcular ingresos y gastos del mes actual
    let ingresosMesActual = 0;
    let gastosMesActual = 0;

    transaccionesEsteMes.forEach(t => {
      const monto = Number(t.monto);
      if (t.tipoTransaccion === 'ingreso') {
        ingresosMesActual += monto;
      } else {
        gastosMesActual += monto;
      }
    });

    // Calcular totales por tipo de movimiento
    const saldos = transacciones.reduce((acc, t) => {
      const amount = t.tipoTransaccion === 'ingreso' ? Number(t.monto) : -Number(t.monto);
      
      // Total general
      acc.total += amount;
      
      // Totales por tipo de movimiento
      if (t.tipoMovimiento === 'efectivo') {
        acc.efectivo += amount;
      } else if (t.tipoMovimiento === 'digital') {
        acc.digital += amount;
      } else if (t.tipoMovimiento === 'ahorro') {
        acc.ahorro += amount;
      }
      
      return acc;
    }, { total: 0, efectivo: 0, digital: 0, ahorro: 0 });

    // Agrupar gastos por categoría para el mes actual
    const gastosPorCategoria = transaccionesEsteMes
      .filter(t => t.tipoTransaccion === 'gasto')
      .reduce((acc, t) => {
        // Usar el campo categoria directamente
        const categoriaNombre = t.categoria || 'Sin categoría';
        
        if (!acc[categoriaNombre]) {
          acc[categoriaNombre] = 0;
        }
        
        acc[categoriaNombre] += Number(t.monto);
        return acc;
      }, {} as Record<string, number>);

    // Ordenar categorías por monto de mayor a menor
    const categoriasMasGastadas = Object.entries(gastosPorCategoria)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5); // Top 5 categorías

    // Calcular tendencias de gasto (comparar con meses anteriores)
    const mesesAnteriores = [];
    for (let i = 1; i <= 3; i++) {
      let mesAnterior = currentMonth - i;
      let añoMesAnterior = currentYear;
      
      if (mesAnterior < 0) {
        mesAnterior = 12 + mesAnterior;
        añoMesAnterior--;
      }
      
      const transaccionesMesAnterior = transaccionesEsteAño.filter(t => {
        const fecha = new Date(t.fecha);
        return fecha.getMonth() === mesAnterior && fecha.getFullYear() === añoMesAnterior;
      });
      
      let ingresosMesAnterior = 0;
      let gastosMesAnterior = 0;
      
      transaccionesMesAnterior.forEach(t => {
        const monto = Number(t.monto);
        if (t.tipoTransaccion === 'ingreso') {
          ingresosMesAnterior += monto;
        } else {
          gastosMesAnterior += monto;
        }
      });
      
      mesesAnteriores.push({
        mes: mesAnterior,
        año: añoMesAnterior,
        ingresos: ingresosMesAnterior,
        gastos: gastosMesAnterior,
        balance: ingresosMesAnterior - gastosMesAnterior
      });
    }

    // Construir y retornar objeto con datos financieros
    return {
      resumenActual: {
        ingresos: ingresosMesActual,
        gastos: gastosMesActual,
        balance: ingresosMesActual - gastosMesActual
      },
      saldos: {
        total: saldos.total,
        efectivo: saldos.efectivo,
        digital: saldos.digital,
        ahorro: saldos.ahorro
      },
      gastosPorCategoria: categoriasMasGastadas,
      tendencias: mesesAnteriores,
      gastosRecurrentes: gastosRecurrentes.map(g => ({
        concepto: g.concepto,
        monto: Number(g.monto),
        proximaFecha: g.proximaFecha,
        periodicidad: g.periodicidad,
        categoria: g.categoria?.descripcion || 'Sin categoría'
      }))
    };
  } catch (error) {
    console.error('Error al obtener datos financieros:', error);
    return null;
  }
}

// Función para generar el prompt del sistema con datos financieros
async function generateSystemPrompt(userId: string | null) {
  // Si no hay usuario autenticado, devolver prompt base
  if (!userId) {
    return BASE_SYSTEM_PROMPT;
  }

  try {
    // Obtener datos financieros del usuario
    const financialData = await getUserFinancialData(userId);
    
    // Si no se pudieron obtener datos, devolver prompt base
    if (!financialData) {
      return BASE_SYSTEM_PROMPT;
    }

    // Crear string con el resumen financiero
    const dataString = `
DATOS FINANCIEROS DEL USUARIO:

1. RESUMEN FINANCIERO DEL MES ACTUAL:
   - Ingresos: ${financialData.resumenActual.ingresos}
   - Gastos: ${financialData.resumenActual.gastos}
   - Balance: ${financialData.resumenActual.balance}

2. SALDOS TOTALES:
   - Total: ${financialData.saldos.total}
   - Efectivo: ${financialData.saldos.efectivo}
   - Digital: ${financialData.saldos.digital}
   - Ahorro: ${financialData.saldos.ahorro}

3. PRINCIPALES CATEGORÍAS DE GASTO:
${financialData.gastosPorCategoria.length > 0 
  ? financialData.gastosPorCategoria.map(([categoria, monto], index) => 
      `   ${index + 1}. ${categoria}: ${monto}`
    ).join('\n')
  : "   No hay datos suficientes sobre categorías de gasto."
}

4. GASTOS RECURRENTES:
${financialData.gastosRecurrentes.length > 0
  ? financialData.gastosRecurrentes.map(g => 
      `   - ${g.concepto} (${g.categoria}): ${g.monto} - ${g.periodicidad}`
    ).join('\n')
  : "   No hay gastos recurrentes registrados."
}

5. TENDENCIAS DE LOS ÚLTIMOS MESES:
${financialData.tendencias.length > 0
  ? financialData.tendencias.map(m => 
      `   - Mes ${m.mes + 1}: Ingresos ${m.ingresos}, Gastos ${m.gastos}, Balance ${m.balance}`
    ).join('\n')
  : "   No hay suficientes datos históricos disponibles."
}

INSTRUCCIONES ADICIONALES:
- Usa estos datos específicos en tus respuestas para personalizar tus consejos.
- Menciona explícitamente valores concretos de los datos del usuario (ingresos, gastos, etc.)
- Si faltan datos en alguna sección, basa tus respuestas en los datos disponibles en las otras secciones.
- SIEMPRE sé específico y personalizado, nunca genérico.
`;

    // Combinar prompt base con datos financieros
    return `${BASE_SYSTEM_PROMPT}\n\n${dataString}`;
  } catch (error) {
    console.error('Error al generar prompt del sistema:', error);
    return BASE_SYSTEM_PROMPT;
  }
}

export async function POST(request: Request) {
  // Objeto para almacenar información de depuración
  const debugInfo: {
    hasSession: boolean;
    userId: string | null;
    financialDataExists: boolean;
    dataPoints: number;
    error: string | null;
  } = {
    hasSession: false,
    userId: null,
    financialDataExists: false,
    dataPoints: 0,
    error: null
  };

  try {
    // Obtener la sesión del usuario
    const session = await getServerSession(options);
    debugInfo.hasSession = !!session;
    debugInfo.userId = session?.user?.id || null;

    console.log("Información de sesión:", {
      tieneSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email
    });

    // Obtener los mensajes del cuerpo de la solicitud
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Se requiere un array de mensajes' },
        { status: 400 }
      );
    }

    // Generar prompt del sistema con datos financieros
    let financialData = null;
    let systemPrompt = BASE_SYSTEM_PROMPT;
    
    if (debugInfo.userId) {
      try {
        // Intentar obtener datos financieros
        financialData = await getUserFinancialData(debugInfo.userId);
        debugInfo.financialDataExists = !!financialData;
        
        if (financialData) {
          // Contar puntos de datos para debugging
          debugInfo.dataPoints = 
            + (financialData.resumenActual ? 1 : 0)
            + (financialData.saldos ? 1 : 0)
            + (financialData.gastosPorCategoria?.length || 0)
            + (financialData.gastosRecurrentes?.length || 0)
            + (financialData.tendencias?.length || 0);
          
          console.log("Datos financieros recuperados:", {
            tieneResumenActual: !!financialData.resumenActual,
            tieneSaldos: !!financialData.saldos,
            categoriasGasto: financialData.gastosPorCategoria?.length || 0,
            gastosRecurrentes: financialData.gastosRecurrentes?.length || 0,
            mesesTendencia: financialData.tendencias?.length || 0
          });
        } else {
          console.log("No se pudieron obtener datos financieros para el usuario:", debugInfo.userId);
        }
        
        systemPrompt = await generateSystemPrompt(debugInfo.userId);
      } catch (dataError: any) {
        console.error("Error al obtener datos financieros:", dataError);
        debugInfo.error = "Error al obtener datos financieros: " + (dataError?.message || String(dataError));
      }
    } else {
      console.log("No hay userId disponible en la sesión");
    }

    // Crear el historial de mensajes para OpenAI, incluyendo el sistema inicial
    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    // Log del tamaño del prompt para verificar si se añadieron los datos
    console.log("Tamaño del prompt del sistema:", systemPrompt.length, 
                "Base:", BASE_SYSTEM_PROMPT.length,
                "Diferencia:", systemPrompt.length - BASE_SYSTEM_PROMPT.length);

    // Llamar a la API de OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 800,
    });

    // Obtener la respuesta del asistente
    const response = completion.choices[0]?.message?.content || 
      'Lo siento, no he podido procesar tu consulta. Por favor, intenta nuevamente.';

    // En entorno de desarrollo, incluir información de depuración
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ 
        response,
        debug: debugInfo
      });
    }

    // En producción, solo devolver la respuesta
    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('Error al procesar la consulta:', error);
    debugInfo.error = error?.message || String(error);
    
    // En desarrollo, incluir información de depuración con el error
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        { 
          error: 'Error al procesar la consulta',
          debug: debugInfo
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al procesar la consulta' },
      { status: 500 }
    );
  }
} 