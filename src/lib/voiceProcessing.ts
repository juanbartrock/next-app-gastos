import { OpenAI } from "openai";
import fs from "fs";
import prisma from "@/lib/prisma";

// Verificar si OpenAI está configurado
const isOpenAIConfigured = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== ""

// Inicializar OpenAI solo si está configurado
let openai: OpenAI | null = null
if (isOpenAIConfigured) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Función para transcribir audio
export async function transcribeAudio(filePath: string): Promise<string> {
  if (!openai) {
    throw new Error("OpenAI no está configurado para transcripción de audio");
  }

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
      language: "es",
    });
    
    // Limpiar archivo temporal después de usarlo
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.error("Error al eliminar archivo temporal:", e);
    }
    
    return transcription.text;
  } catch (error) {
    console.error("Error en la transcripción:", error);
    throw new Error("Error en la transcripción del audio");
  }
}

// Función para analizar texto y extraer información del gasto
export async function analyzeExpenseText(text: string, userId: string): Promise<any> {
  if (!openai) {
    throw new Error("OpenAI no está configurado para análisis de texto");
  }

  try {
    // Obtener las categorías disponibles
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
    Necesito extraer información de un mensaje que describe un gasto. El texto es:
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

    // Procesar respuesta
    const analysisText = completion.choices[0].message.content;
    const analysisData = JSON.parse(analysisText || "{}");

    // Preparar datos del gasto
    return {
      monto: Number(analysisData.MONTO) || 0,
      tipoTransaccion: analysisData.TIPO_TRANSACCION || "expense",
      tipoMovimiento: analysisData.TIPO_MOVIMIENTO || "efectivo",
      concepto: analysisData.DESCRIPCION || "Gasto por WhatsApp",
      categoriaId: Number(analysisData.CATEGORIA_ID) || null,
      categoria: await getCategoriaDescripcion(Number(analysisData.CATEGORIA_ID)),
      fecha: new Date(),
      userId: userId,
    };
  } catch (error) {
    console.error("Error en el análisis del texto:", error);
    throw new Error("Error al analizar el texto");
  }
}

// Función auxiliar para obtener la descripción de la categoría
async function getCategoriaDescripcion(categoriaId: number | null): Promise<string> {
  if (!categoriaId) return "Sin categoría";
  
  try {
    const categoria = await prisma.categoria.findUnique({
      where: { id: categoriaId },
      select: { descripcion: true }
    });
    
    return categoria?.descripcion || "Sin categoría";
  } catch (error) {
    console.error("Error al obtener la categoría:", error);
    return "Sin categoría";
  }
} 