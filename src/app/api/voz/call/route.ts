import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import prisma from "@/lib/prisma";

// Función para generar respuesta TwiML
function twimlResponse(message: string, recordingOptions = {}) {
  // Crear una respuesta TwiML
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();
  
  // Agregar un mensaje de voz
  response.say({
    voice: 'woman',
    language: 'es-ES'
  }, message);
  
  // Si hay opciones de grabación, agregar instrucciones para grabar
  if (Object.keys(recordingOptions).length > 0) {
    // Grabar la respuesta del usuario
    response.record({
      action: '/api/voz/recording',
      method: 'POST',
      maxLength: 30,
      timeout: 5,
      transcribe: false,
      playBeep: true,
      ...recordingOptions
    });
    
    // Mensaje de despedida después de la grabación
    response.say({
      voice: 'woman',
      language: 'es-ES'
    }, 'Gracias por tu mensaje. Procesaremos tu gasto y te enviaremos una confirmación.');
  }
  
  // Devolver la respuesta TwiML como XML
  return new NextResponse(response.toString(), {
    headers: {
      'Content-Type': 'text/xml'
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    // Obtener los datos del formulario de Twilio
    const formData = await request.formData();
    
    // Extraer los datos de la llamada
    const from = formData.get('From') as string || '';
    const callSid = formData.get('CallSid') as string || '';
    const callStatus = formData.get('CallStatus') as string || '';
    
    console.log("Llamada recibida:", { from, callSid, callStatus });
    
    // Verificar si es un desafío de verificación de Twilio
    if (request.nextUrl.searchParams.get('hub.challenge')) {
      const challenge = request.nextUrl.searchParams.get('hub.challenge');
      return new Response(challenge, { status: 200 });
    }
    
    // Extraer número de teléfono
    const phoneNumber = from;
    
    // Buscar el usuario asociado a este número
    const user = await prisma.user.findFirst({
      where: { 
        phoneNumber: phoneNumber.replace('+', '') 
      }
    });

    if (!user) {
      // Usuario no encontrado, informar al usuario
      return twimlResponse(
        'Lo sentimos, no encontramos una cuenta asociada a este número de teléfono. Por favor, regístrate primero en la aplicación web.'
      );
    }
    
    // Usuario encontrado, dar instrucciones para grabar el gasto
    return twimlResponse(
      'Hola. Bienvenido al sistema de registro de gastos por voz. Por favor, después del tono, describe tu gasto incluyendo el monto, la categoría y el método de pago.',
      {
        finishOnKey: '#',
        maxLength: 60
      }
    );
    
  } catch (error: any) {
    console.error("Error en la llamada de voz:", error);
    
    // Responder con un mensaje de error
    return twimlResponse(
      'Lo sentimos, ha ocurrido un error al procesar tu llamada. Por favor, intenta nuevamente más tarde.'
    );
  }
}

// Configurar el tamaño máximo del cuerpo de la solicitud
export const config = {
  api: {
    bodyParser: false,
  },
}; 