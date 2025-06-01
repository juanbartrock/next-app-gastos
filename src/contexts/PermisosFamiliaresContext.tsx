"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface PermisosFamiliares {
  usuarioId: string | null
  esAdmin: boolean
  puedeVerInformacionFamiliar: boolean
  puedeEditarConfiguracionFamiliar: boolean
  esAdministradorFamiliar: boolean
  nivel: 'PERSONAL' | 'MIEMBRO_LIMITADO' | 'MIEMBRO_COMPLETO' | 'ADMINISTRADOR_FAMILIAR' | 'SIN_GRUPO'
  gruposFamiliares: any[]
  loading: boolean
  error: string | null
}

interface PermisosFamiliaresContextType extends PermisosFamiliares {
  refetchPermisos: () => Promise<void>
  tienePermisosFamiliares: () => boolean
  esAdminOCompleto: () => boolean
  puedeVerGastosFamiliares: () => boolean
}

const PermisosFamiliaresContext = createContext<PermisosFamiliaresContextType | undefined>(undefined)

export function PermisosFamiliaresProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [permisos, setPermisos] = useState<PermisosFamiliares>({
    usuarioId: null,
    esAdmin: false,
    puedeVerInformacionFamiliar: false,
    puedeEditarConfiguracionFamiliar: false,
    esAdministradorFamiliar: false,
    nivel: 'PERSONAL',
    gruposFamiliares: [],
    loading: true,
    error: null
  })

  const fetchPermisos = async () => {
    if (status !== 'authenticated' || !session?.user?.email) {
      setPermisos(prev => ({ ...prev, loading: false }))
      return
    }

    try {
      setPermisos(prev => ({ ...prev, loading: true, error: null }))
      
      const response = await fetch('/api/user/permisos-familia')
      
      if (!response.ok) {
        throw new Error('Error al obtener permisos')
      }

      const data = await response.json()
      
      setPermisos({
        usuarioId: data.usuarioId,
        esAdmin: data.esAdmin,
        puedeVerInformacionFamiliar: data.puedeVerInformacionFamiliar,
        puedeEditarConfiguracionFamiliar: data.puedeEditarConfiguracionFamiliar,
        esAdministradorFamiliar: data.esAdministradorFamiliar,
        nivel: data.nivel,
        gruposFamiliares: data.gruposFamiliares,
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Error al cargar permisos familiares:', error)
      setPermisos(prev => ({
        ...prev,
        loading: false,
        error: 'Error al cargar permisos familiares'
      }))
    }
  }

  // Cargar permisos cuando el usuario se autentique
  useEffect(() => {
    fetchPermisos()
  }, [status, session?.user?.email])

  // Funciones de utilidad
  const tienePermisosFamiliares = () => {
    return permisos.puedeVerInformacionFamiliar || permisos.esAdministradorFamiliar
  }

  const esAdminOCompleto = () => {
    return permisos.nivel === 'ADMINISTRADOR_FAMILIAR' || permisos.nivel === 'MIEMBRO_COMPLETO'
  }

  const puedeVerGastosFamiliares = () => {
    return tienePermisosFamiliares()
  }

  const contextValue: PermisosFamiliaresContextType = {
    ...permisos,
    refetchPermisos: fetchPermisos,
    tienePermisosFamiliares,
    esAdminOCompleto,
    puedeVerGastosFamiliares
  }

  return (
    <PermisosFamiliaresContext.Provider value={contextValue}>
      {children}
    </PermisosFamiliaresContext.Provider>
  )
}

export function usePermisosFamiliares() {
  const context = useContext(PermisosFamiliaresContext)
  if (context === undefined) {
    throw new Error('usePermisosFamiliares debe ser usado dentro de un PermisosFamiliaresProvider')
  }
  return context
} 