import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/', '/login', '/register']
  
  // Verificar si la ruta actual es pública
  const isPublicPath = publicPaths.some((path) => 
    request.nextUrl.pathname.startsWith(path)
  )

  // Ignorar rutas de recursos estáticos y API de auth
  if (
    request.nextUrl.pathname.startsWith('/_next') || 
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname.startsWith('/api/twilio') ||
    request.nextUrl.pathname === '/favicon.ico' ||
    request.nextUrl.pathname === '/.well-known/appspecific/com.chrome.devtools.json'
  ) {
    return NextResponse.next()
  }

  try {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    })

    // Si el usuario no está autenticado y está intentando acceder a una ruta protegida
    if (!token && !isPublicPath) {
      // Redirigir a la página de login
      const url = new URL('/login', request.url)
      // Guardar la URL original para redirigir después del login
      url.searchParams.set('callbackUrl', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }

    // Si el usuario está autenticado y trata de acceder a login/register (NO incluir "/")
    if (token && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
      // Redirigir a la página de inicio
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Si el usuario está autenticado y está en la raíz "/", permitir que React maneje la redirección
    if (token && request.nextUrl.pathname === '/') {
      // Permitir que el componente React maneje la redirección al dashboard
      return NextResponse.next()
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Error en middleware:', error)
    // En caso de error, permitir que la solicitud continúe
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    "/((?!login|register|api/auth|api/twilio|_next/static|_next/image|favicon.ico).*)",
  ]
} 