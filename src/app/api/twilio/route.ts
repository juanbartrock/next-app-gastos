import { NextRequest, NextResponse } from "next/server";
import { downloadAudio, validateTwilioRequest, sendWhatsAppMessage } from "@/lib/twilio";
import { transcribeAudio, analyzeExpenseText } from "@/lib/voiceProcessing";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Obtener los datos del formulario de Twilio
    const formData = await request.formData();
    
    // Extraer datos principales
    const from = formData.get('From') as string || ''; // Número de WhatsApp del remitente
    const body = formData.get('Body') as string || ''; // Texto del mensaje (si es mensaje de texto)
    const numMedia = Number(formData.get('NumMedia') as string || '0'); // Número de archivos adjuntos
    
    console.log("Recibido mensaje de WhatsApp:", { from, body, numMedia });

    // Verificar si es un desafío de verificación de Twilio
    if (request.nextUrl.searchParams.get('hub.challenge')) {
      const challenge = request.nextUrl.searchParams.get('hub.challenge');
      return new Response(challenge, { status: 200 });
    }
    
    // Verificar si es una solicitud legítima de Twilio (opcional en desarrollo, recomendado en producción)
    
    const signature = request.headers.get('X-Twilio-Signature') || '';
    const url = request.url;
    const params: Record<string, string> = {};
    
    formData.forEach((value, key) => {
      if (typeof value === 'string') {
        params[key] = value;
      }
    });
    
    if (!validateTwilioRequest(url, params, signature)) {
      console.error("Firma de Twilio inválida");
      return NextResponse.json({ error: "Firma inválida" }, { status: 403 });
    }
    
    // Extraer número de teléfono sin el prefijo "whatsapp:"
    const phoneNumber = from.replace('whatsapp:', '');
    
    // Buscar el usuario asociado a este número
    const user = await prisma.user.findFirst({
      where: { 
        phoneNumber: phoneNumber 
      }
    });

    if (!user) {
      // Usuario no encontrado, enviar mensaje de registro
      await sendWhatsAppMessage(
        from,
        "No estás registrado en el sistema. Por favor regístrate primero en la aplicación."
      );
      
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    let text = "";
    
    // Procesar según si es mensaje de voz o texto
    if (numMedia > 0) {
      // Mensaje con archivos adjuntos (potencialmente audio)
      const mediaUrl = formData.get('MediaUrl0') as string;
      const contentType = formData.get('MediaContentType0') as string;
      
      console.log("Media recibido:", { mediaUrl, contentType });
      
      // Verificar si es un archivo de audio
      if (contentType && (
          contentType.includes('audio') || 
          contentType.includes('ogg') || 
          contentType.includes('mp3') || 
          contentType.includes('m4a'))) {
        
        // Descargar el archivo de audio
        const audioFilePath = await downloadAudio(mediaUrl);
        
        // Transcribir el audio
        text = await transcribeAudio(audioFilePath);
        console.log("Texto transcrito:", text);
      } else {
        // No es un archivo de audio soportado
        await sendWhatsAppMessage(
          from,
          "Por favor envía un mensaje de voz o texto describiendo tu gasto."
        );
        
        return new NextResponse(
          `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
          { headers: { 'Content-Type': 'text/xml' } }
        );
      }
    } else if (body && body.trim() !== '') {
      // Es un mensaje de texto
      text = body.trim();
      console.log("Procesando mensaje de texto:", text);
    } else {
      // Ni audio ni texto válido
      await sendWhatsAppMessage(
        from,
        "Por favor envía un mensaje de voz o texto describiendo tu gasto."
      );
      
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }
    
    // Ya sea de voz o texto, analizamos el contenido
    const gastoData = await analyzeExpenseText(text, user.id);
    
    // Crear el gasto en la base de datos
    const nuevoGasto = await prisma.gasto.create({
      data: gastoData,
      include: {
        categoriaRel: true // Incluir la información de la categoría
      }
    });
    
    // Preparar mensaje de confirmación
    const categoriaTexto = nuevoGasto.categoriaRel ? nuevoGasto.categoriaRel.descripcion : "Sin categoría";
    const tipoTexto = nuevoGasto.tipoTransaccion === "income" ? "Ingreso" : "Gasto";
    
    const confirmationMessage = `✅ ${tipoTexto} registrado correctamente:
- Concepto: ${nuevoGasto.concepto}
- Monto: $${nuevoGasto.monto}
- Categoría: ${categoriaTexto}
- Método: ${nuevoGasto.tipoMovimiento}
- Fecha: ${new Date(nuevoGasto.fecha).toLocaleDateString()}`;
    
    // Enviar confirmación al usuario
    await sendWhatsAppMessage(from, confirmationMessage);
    
    // Responder a Twilio con una respuesta vacía
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    );
  } catch (error: any) {
    console.error("Error en el webhook de Twilio:", error);
    
    // Responder con un mensaje de error
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Error al procesar el mensaje: ${error.message}</Message></Response>`,
      { headers: { 'Content-Type': 'text/xml' }, status: 500 }
    );
  }
}

// Configurar el tamaño máximo del cuerpo de la solicitud
export const config = {
  api: {
    bodyParser: false,
  },
}; 