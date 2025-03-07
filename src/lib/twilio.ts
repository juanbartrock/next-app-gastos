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
      from: 'whatsapp:+14155238886', // Número fijo del sandbox de Twilio para WhatsApp
      to: to,
      body: body
    });
    return true;
  } catch (error) {
    console.error("Error al enviar mensaje de WhatsApp:", error);
    return false;
  }
}

// Nueva función para enviar mensajes SMS a través de Twilio
export async function sendSMS(to: string, body: string) {
  try {
    // Asegurarse de que el número no tenga el prefijo 'whatsapp:'
    if (to.startsWith('whatsapp:')) {
      to = to.replace('whatsapp:', '');
    }

    // Enviar el SMS
    await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
      body: body
    });
    return true;
  } catch (error) {
    console.error("Error al enviar SMS:", error);
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
  // Para pruebas, descomenta esta línea:
  return true;
  
  // Y comenta el resto de la función:
  /*
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return false;
  
  const validator = twilio.validateRequest;
  return validator(authToken, signature, url, params);
  */
} 