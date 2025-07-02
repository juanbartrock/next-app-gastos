'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface PermisosFamiliaresContextType {
  esAdministradorFamiliar: boolean
  loading: boolean
  error?: string
  nivel: string
  puedeVerGastosFamiliares: () => boolean
  tienePermisosFamiliares: boolean
}

const PermisosFamiliaresContext = createContext<PermisosFamiliaresContextType | undefined>(undefined)

export function PermisosFamiliaresProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [esAdministradorFamiliar, setEsAdministradorFamiliar] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'authenticated' && session?.user?.id) {
      // Por ahora, consideramos que todos los usuarios autenticados son administradores familiares
      // En el futuro esto se puede cambiar por una verificación real en la base de datos
      setEsAdministradorFamiliar(true)
    } else {
      setEsAdministradorFamiliar(false)
    }
    
    setLoading(false)
  }, [session, status])

  // Función para verificar si puede ver gastos familiares
  const puedeVerGastosFamiliares = () => {
    return esAdministradorFamiliar && status === 'authenticated'
  }

  return (
    <PermisosFamiliaresContext.Provider 
      value={{ 
        esAdministradorFamiliar, 
        loading,
        nivel: 'administrador_familiar',
        puedeVerGastosFamiliares,
        tienePermisosFamiliares: esAdministradorFamiliar
      }}
    >
      {children}
    </PermisosFamiliaresContext.Provider>
  )
}

export function usePermisosFamiliares() {
  const context = useContext(PermisosFamiliaresContext)
  if (context === undefined) {
    throw new Error('usePermisosFamiliares must be used within a PermisosFamiliaresProvider')
  }
  return context
} 