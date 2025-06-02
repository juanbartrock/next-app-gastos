'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Redirección desde la raíz a dashboard
export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session) {
      router.push('/login')
    } else {
      // Usuario autenticado, ejecutar Smart Trigger y redirigir a dashboard
      executeSmartTrigger()
      router.push('/dashboard')
    }
  }, [session, status, router])

  const executeSmartTrigger = async () => {
    try {
      // Llamar al Smart Trigger de forma asíncrona sin bloquear la UI
      fetch('/api/alertas/smart-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'homepage' })
      }).catch(error => {
        console.log('Smart Trigger ejecutado en background:', error.message)
      })
    } catch (error) {
      // Fallo silencioso - no afecta la experiencia del usuario
      console.log('Smart Trigger no disponible')
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return null // Se redirige automáticamente
} 