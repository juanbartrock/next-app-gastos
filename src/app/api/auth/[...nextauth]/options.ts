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
      phoneNumber?: string | null;
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
        // Si es una redirección de signOut, ir a /login
        if (url.includes('signOut=true') || url.includes('/login')) {
          return `${baseUrl}/login`;
        }
        
        // Si hay un callbackUrl específico que no sea la raíz, respetarlo
        if (url.includes('callbackUrl=')) {
          const callbackUrl = new URL(url).searchParams.get('callbackUrl');
          
          if (callbackUrl && callbackUrl !== '/' && callbackUrl !== '') {
            return `${baseUrl}${callbackUrl}`
          }
        }
        
        // Para todos los demás casos, redirigir a /home
        return `${baseUrl}/home`
      } catch (error) {
        return `${baseUrl}/home`;
      }
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          session.user.id = token.sub!
          
          // Obtener datos actualizados del usuario
          const user = await prisma.user.findUnique({
            where: { id: token.sub },
            select: {
              name: true,
              email: true,
              phoneNumber: true,
            }
          });

          if (user) {
            session.user.name = user.name;
            session.user.email = user.email;
            session.user.phoneNumber = user.phoneNumber;
          }
        }
        return session
      } catch (error) {
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
        return token;
      }
    }
  },
  debug: false,
  secret: process.env.NEXTAUTH_SECRET,
  // Configuración de cookies
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === "production"
      }
    }
  }
} 