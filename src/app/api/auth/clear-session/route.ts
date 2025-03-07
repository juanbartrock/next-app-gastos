import { NextResponse } from "next/server";

/**
 * Endpoint para limpiar sesiones inconsistentes
 * Útil durante desarrollo cuando se reinicia la base de datos
 */
export async function GET() {
  try {
    // Generar respuesta que elimine las cookies de sesión mediante headers
    const response = NextResponse.redirect(new URL('/login', 'http://localhost:3000'));
    
    // Eliminar cookies de autenticación de Next.js
    const cookiesToDelete = [
      'next-auth.session-token',
      'next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.session-token',
      '__Secure-next-auth.csrf-token', 
      '__Secure-next-auth.callback-url',
      '__Host-next-auth.csrf-token'
    ];
    
    // Agregar los headers para eliminar las cookies
    cookiesToDelete.forEach(cookieName => {
      response.cookies.set({
        name: cookieName,
        value: '',
        expires: new Date(0),
        path: '/',
      });
      
      // Para mayor seguridad, también enviamos header Set-Cookie explícito
      const existingHeader = response.headers.get('Set-Cookie') || '';
      const newCookieHeader = `${cookieName}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`;
      
      if (existingHeader) {
        response.headers.set('Set-Cookie', `${existingHeader}, ${newCookieHeader}`);
      } else {
        response.headers.set('Set-Cookie', newCookieHeader);
      }
    });
    
    console.log("Sesión limpiada, redirigiendo a login...");
    return response;
  } catch (error) {
    console.error("Error al limpiar la sesión:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Error al limpiar la sesión", 
        error: String(error) 
      },
      { status: 500 }
    );
  }
} 