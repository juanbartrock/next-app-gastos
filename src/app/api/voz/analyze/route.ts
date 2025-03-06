import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { OpenAI } from "openai";
import prisma from "@/lib/prisma";

// Inicializar OpenAI con la clave API directamente
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el texto transcrito
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: "No se proporcionó texto para analizar" },
        { status: 400 }
      );
    }

    console.log("API Key (analyze):", process.env.OPENAI_API_KEY ? "Configurada" : "No configurada");
    console.log("Texto a analizar:", text);

    // Obtener las categorías disponibles para referenciarlas en el prompt
    const categorias = await prisma.categoria.findMany({
      where: { status: true },
      select: { id: true, descripcion: true, grupo_categoria: true },
    });

    // Construir lista de categorías para el prompt
    const categoriasTexto = categorias
      .map((cat) => `${cat.id}: ${cat.descripcion} (${cat.grupo_categoria || "General"})`)
      .join("\n");

    // Prompt para GPT
    const prompt = `
    Necesito extraer información de un mensaje de voz que describe un gasto. El texto transcrito es:
    "${text}"
    
    Por favor, identifica los siguientes elementos:
    1. MONTO: El valor numérico del gasto (solo números, sin símbolos)
    2. TIPO_TRANSACCION: Si es un ingreso ("income") o un gasto ("expense"). Por defecto, asumir "expense" si no está explícito.
    3. TIPO_MOVIMIENTO: Puede ser "efectivo", "digital", "ahorro" o "tarjeta". Por defecto, asumir "efectivo" si no está explícito.
    4. DESCRIPCION: Breve descripción del gasto
    5. CATEGORIA_ID: El ID de la categoría que mejor corresponda al gasto.
    
    Categorías disponibles:
    ${categoriasTexto}
    
    Por favor, responde SOLO con un objeto JSON con los campos anteriores, sin explicaciones adicionales.
    `;

    // Llamar a la API de OpenAI para analizar el texto
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125",
      messages: [
        { 
          role: "system", 
          content: "Eres un asistente especializado en extraer información financiera de texto y convertirla a formato estructurado."
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
    });

    // Extraer y analizar la respuesta
    const analysisText = completion.choices[0].message.content;
    console.log("Respuesta del análisis:", analysisText);
    
    const analysisData = JSON.parse(analysisText || "{}");

    // Preparar los datos para la creación del gasto
    const gastoData = {
      monto: Number(analysisData.MONTO) || 0,
      tipoTransaccion: analysisData.TIPO_TRANSACCION || "expense",
      tipoMovimiento: analysisData.TIPO_MOVIMIENTO || "efectivo",
      concepto: analysisData.DESCRIPCION || "Gasto por voz",
      categoriaId: Number(analysisData.CATEGORIA_ID) || null,
      fecha: new Date(),
      userId: session.user.id,
    };

    console.log("Datos del gasto preparados:", gastoData);

    // Devolver los datos analizados
    return NextResponse.json({
      analysis: analysisData,
      gastoData: gastoData
    });
  } catch (error: any) {
    console.error("Error en el análisis:", error);
    return NextResponse.json(
      { error: error.message || "Error en el análisis del texto" },
      { status: 500 }
    );
  }
} 