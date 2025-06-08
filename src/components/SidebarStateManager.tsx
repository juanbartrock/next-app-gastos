"use client"

import { useEffect } from "react"
import { useSidebar } from "@/contexts/SidebarContext"

// Clave para el localStorage
const SIDEBAR_STATE_KEY = 'finanzIA_sidebarOpen'

/**
 * Componente invisible que sincroniza el estado del sidebar con localStorage
 * y asegura que se mantenga entre navegaciones
 */
export function SidebarStateManager() {
  const { setSidebarOpen } = useSidebar()

  // Sincronizar con localStorage al montar
  useEffect(() => {
    // Función para obtener el estado del localStorage
    const getSavedState = () => {
      try {
        const savedState = localStorage.getItem(SIDEBAR_STATE_KEY)
        return savedState === null ? true : savedState === 'true'
      } catch (error) {
        console.error('Error al leer localStorage:', error)
        return true
      }
    }

    // Inicializar el estado desde localStorage
    const savedState = getSavedState()
    setSidebarOpen(savedState)

    // Escuchar cambios en localStorage (por si se abre en otra pestaña)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SIDEBAR_STATE_KEY && e.newValue !== null) {
        setSidebarOpen(e.newValue === 'true')
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [setSidebarOpen])

  // No renderiza nada visible
  return null
} 