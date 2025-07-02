"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface PermisosGrupales {
  usuarioId: string | null
  esAdmin: boolean
  puedeVerInformacionGrupal: boolean
  puedeEditarConfiguracionGrupal: boolean
  esAdministradorGrupal: boolean
  nivel: 'PERSONAL' | 'MIEMBRO_LIMITADO' | 'MIEMBRO_COMPLETO' | 'ADMINISTRADOR_GRUPAL' | 'SIN_GRUPO'
  gruposPertenece: any[]
  loading: boolean
  error: string | null
}

interface PermisosGrupalesContextType extends PermisosGrupales {
  refetchPermisos: () => Promise<void>
  tienePermisosGrupales: () => boolean
  esAdminOCompleto: () => boolean
  puedeVerGastosGrupales: () => boolean
}

const PermisosGrupalesContext = createContext<PermisosGrupalesContextType | undefined>(undefined)

export function PermisosGrupalesProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [permisos, setPermisos] = useState<PermisosGrupales>({
    usuarioId: null,
    esAdmin: false,
    puedeVerInformacionGrupal: false,
    puedeEditarConfiguracionGrupal: false,
    esAdministradorGrupal: false,
    nivel: 'PERSONAL',
    gruposPertenece: [],
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
      
      const response = await fetch('/api/user/permisos-grupo')
      
      if (!response.ok) {
        throw new Error('Error al obtener permisos')
      }

      const data = await response.json()
      
      setPermisos({
        usuarioId: data.usuarioId,
        esAdmin: data.esAdmin,
        puedeVerInformacionGrupal: data.puedeVerInformacionGrupal,
        puedeEditarConfiguracionGrupal: data.puedeEditarConfiguracionGrupal,
        esAdministradorGrupal: data.esAdministradorGrupal,
        nivel: data.nivel,
        gruposPertenece: data.gruposPertenece,
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Error al cargar permisos grupales:', error)
      setPermisos(prev => ({
        ...prev,
        loading: false,
        error: 'Error al cargar permisos grupales'
      }))
    }
  }

  // Cargar permisos cuando el usuario se autentique
  useEffect(() => {
    fetchPermisos()
  }, [status, session?.user?.email])

  // Funciones de utilidad
  const tienePermisosGrupales = () => {
    return permisos.puedeVerInformacionGrupal || permisos.esAdministradorGrupal
  }

  const esAdminOCompleto = () => {
    return permisos.nivel === 'ADMINISTRADOR_GRUPAL' || permisos.nivel === 'MIEMBRO_COMPLETO'
  }

  const puedeVerGastosGrupales = () => {
    return tienePermisosGrupales()
  }

  const contextValue: PermisosGrupalesContextType = {
    ...permisos,
    refetchPermisos: fetchPermisos,
    tienePermisosGrupales,
    esAdminOCompleto,
    puedeVerGastosGrupales
  }

  return (
    <PermisosGrupalesContext.Provider value={contextValue}>
      {children}
    </PermisosGrupalesContext.Provider>
  )
}

export function usePermisosGrupales() {
  const context = useContext(PermisosGrupalesContext)
  if (context === undefined) {
    throw new Error('usePermisosGrupales debe ser usado dentro de un PermisosGrupalesProvider')
  }
  return context
} 