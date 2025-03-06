import twilio from "twilio";
import fs from "fs";
import path from "path";
import os from "os";
import axios from "axios";

// Inicializar cliente de Twilio
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Función para enviar mensajes de WhatsApp a través de Twilio
export async function sendWhatsAppMessage(to: string, body: string) {
  try {
    // Asegurarse de que el número tenga el prefijo 'whatsapp:'
    if (!to.startsWith('whatsapp:')) {
      to = `whatsapp:${to}`;
    }

    await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: to,
      body: body
    });
    return true;
  } catch (error) {
    console.error("Error al enviar mensaje de WhatsApp:", error);
    return false;
  }
}

// Función para descargar audio de Twilio
export async function downloadAudio(mediaUrl: string): Promise<string> {
  try {
    // Generar nombre de archivo temporal
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `twilio_audio_${Date.now()}.ogg`);
    
    // Configurar las credenciales para la solicitud a Twilio
    const auth = {
      username: process.env.TWILIO_ACCOUNT_SID || '',
      password: process.env.TWILIO_AUTH_TOKEN || ''
    };
    
    // Descargar el archivo
    const response = await axios({
      method: 'get',
      url: mediaUrl,
      auth: auth,
      responseType: 'arraybuffer'
    });
    
    // Guardar el archivo
    fs.writeFileSync(tempFilePath, response.data);
    return tempFilePath;
  } catch (error) {
    console.error("Error al descargar audio de Twilio:", error);
    throw new Error("Error al descargar el archivo de audio");
  }
}

// Verificar que la solicitud viene de Twilio (opcional pero recomendado para producción)
export function validateTwilioRequest(url: string, params: Record<string, string>, signature: string): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return false;
  
  // En un entorno serverless como Vercel, podríamos necesitar ajustes adicionales
  // para la validación de la firma. Este es un enfoque básico.
  const validator = twilio.validateRequest;
  return validator(authToken, signature, url, params);
} 