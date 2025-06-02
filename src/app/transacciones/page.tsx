"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function TransaccionesRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect inmediato a la nueva ubicación
    router.replace('/transacciones/nuevo')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-lg font-medium">Redirigiendo...</h1>
        <p className="text-sm text-muted-foreground">Te estamos llevando a la página de transacciones</p>
      </div>
    </div>
  )
} 