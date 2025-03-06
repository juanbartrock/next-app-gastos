import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { downloadAudio, sendSMS } from "@/lib/twilio";
import { transcribeAudio, analyzeExpenseText } from "@/lib/voiceProcessing";
import prisma from "@/lib/prisma";

// Función para generar respuesta TwiML
function twimlResponse(message: string) {
  // Crear una respuesta TwiML
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();
  
  // Agregar un mensaje de voz
  response.say({
    voice: 'woman',
    language: 'es-ES'
  }, message);
  
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
    
    // Extraer los datos relevantes
    const from = formData.get('From') as string || '';
    const recordingUrl = formData.get('RecordingUrl') as string || '';
    const recordingSid = formData.get('RecordingSid') as string || '';
    
    console.log("Grabación recibida:", { from, recordingSid, recordingUrl });
    
    // Si no hay URL de grabación, responder con error
    if (!recordingUrl) {
      return twimlResponse(
        'No se recibió ninguna grabación. Por favor, intenta nuevamente.'
      );
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
        'Lo sentimos, no encontramos una cuenta asociada a este número de teléfono.'
      );
    }
    
    // Procesar en segundo plano para no bloquear la respuesta a Twilio
    // Esto permite responder rápidamente a Twilio mientras procesamos la grabación
    (async () => {
      try {
        // Descargar el archivo de audio
        const audioFilePath = await downloadAudio(recordingUrl);
        
        // Transcribir el audio
        const text = await transcribeAudio(audioFilePath);
        console.log("Texto transcrito:", text);
        
        // Analizar el texto para extraer información del gasto
        const gastoData = await analyzeExpenseText(text, user.id);
        
        // Crear el gasto en la base de datos
        const nuevoGasto = await prisma.gasto.create({
          data: gastoData,
          include: {
            categoriaRel: true // Incluir la información de la categoría
          }
        });
        
        console.log("Gasto creado:", nuevoGasto);
        
        // Preparar mensaje de confirmación
        const categoriaTexto = nuevoGasto.categoriaRel ? nuevoGasto.categoriaRel.descripcion : "Sin categoría";
        const tipoTexto = nuevoGasto.tipoTransaccion === "income" ? "Ingreso" : "Gasto";
        
        const confirmationMessage = `✅ ${tipoTexto} registrado por llamada:
- Concepto: ${nuevoGasto.concepto}
- Monto: $${nuevoGasto.monto}
- Categoría: ${categoriaTexto}
- Método: ${nuevoGasto.tipoMovimiento}
- Fecha: ${new Date(nuevoGasto.fecha).toLocaleDateString()}`;
        
        // Enviar SMS de confirmación
        await sendSMS(phoneNumber, confirmationMessage);
        
      } catch (error) {
        console.error("Error procesando la grabación:", error);
        
        // Enviar SMS de error
        await sendSMS(
          phoneNumber,
          "❌ Lo sentimos, hubo un problema al procesar tu gasto por voz. Por favor, intenta nuevamente o usa la aplicación web."
        );
      }
    })();
    
    // Responder inmediatamente a Twilio con un mensaje de agradecimiento
    return twimlResponse(
      'Hemos recibido tu mensaje. Procesaremos tu gasto y lo registraremos en tu cuenta. Te enviaremos un SMS con la confirmación. ¡Gracias por usar nuestro servicio!'
    );
    
  } catch (error: any) {
    console.error("Error procesando la grabación:", error);
    
    // Responder con un mensaje de error
    return twimlResponse(
      'Lo sentimos, ha ocurrido un error al procesar tu grabación. Por favor, intenta nuevamente más tarde.'
    );
  }
}

// Configurar el tamaño máximo del cuerpo de la solicitud
export const config = {
  api: {
    bodyParser: false,
  },
}; 