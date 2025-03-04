"use client"

import { SessionProvider } from "next-auth/react"

export function NextAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      refetchInterval={5 * 60} // Recargar la sesión cada 5 minutos
      refetchOnWindowFocus={true} // Recargar cuando la ventana recupera el foco
    >
      {children}
    </SessionProvider>
  )
} 