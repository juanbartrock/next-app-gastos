import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { OpenAI } from "openai";
import fs from "fs";
import path from "path";
import os from "os";

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

    // Obtener el archivo de audio
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No se proporcionó archivo de audio" },
        { status: 400 }
      );
    }

    // Verificar el tamaño del archivo (max 10MB)
    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    if (audioFile.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "El archivo es demasiado grande (máximo 10MB)" },
        { status: 400 }
      );
    }

    // Guardar el archivo temporalmente en el sistema de archivos
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, audioFile.name);
    
    // Convertir el archivo a un buffer y guardarlo
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(tempFilePath, buffer);

    console.log("API Key:", process.env.OPENAI_API_KEY ? "Configurada" : "No configurada");
    console.log("Archivo guardado en:", tempFilePath);

    // Transcribir usando OpenAI Whisper con el archivo del sistema de archivos
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: "whisper-1",
      language: "es",
    });

    // Limpiar el archivo temporal
    try {
      fs.unlinkSync(tempFilePath);
    } catch (error) {
      console.error("Error al eliminar archivo temporal:", error);
    }

    // Devolver la transcripción
    return NextResponse.json({
      text: transcription.text
    });
  } catch (error: any) {
    console.error("Error en la transcripción:", error);
    return NextResponse.json(
      { error: error.message || "Error en el procesamiento de audio" },
      { status: 500 }
    );
  }
}

// Configurar el tamaño máximo del cuerpo de la solicitud
export const config = {
  api: {
    bodyParser: false,
  },
}; 