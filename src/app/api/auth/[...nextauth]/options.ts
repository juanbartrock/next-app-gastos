import { PrismaAdapter } from "@auth/prisma-adapter"
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

// Extender los tipos de NextAuth para incluir el id en el usuario
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
}

// Exportar las opciones de autenticación
export const options: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Por favor, ingresa todos los campos')
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (!user || !user.password) {
            throw new Error('Usuario no encontrado')
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            throw new Error('Contraseña incorrecta')
          }

          return user
        } catch (error) {
          console.error("Error en authorize:", error);
          throw error;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login', // Error code passed in query string as ?error=
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      try {
        // Validar y simplificar la redirección
        // Por defecto, redirigir a la raíz si no hay URL o es inválida
        if (!url || typeof url !== 'string') {
          return baseUrl
        }
        
        // Si la URL empieza con /, es una ruta relativa
        if (url.startsWith('/')) {
          return `${baseUrl}${url}`
        }
        
        // Si es la misma URL base, usarla
        if (url.startsWith(baseUrl)) {
          return url
        }
        
        // Por defecto, redirigir a la raíz
        return baseUrl
      } catch (error) {
        console.error("Error en redirect callback:", error);
        return baseUrl;
      }
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          session.user.id = token.sub!
        }
        return session
      } catch (error) {
        console.error("Error en session callback:", error);
        return session;
      }
    },
    async jwt({ token, user }) {
      try {
        if (user) {
          token.id = user.id
        }
        return token
      } catch (error) {
        console.error("Error en jwt callback:", error);
        return token;
      }
    }
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
  // Configuraciones adicionales para producción
  trustHost: true,
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    }
  }
} 