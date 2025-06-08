"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"

// Clave para el localStorage
const SIDEBAR_STATE_KEY = 'finanzIA_sidebarOpen'

// Interfaz para el contexto
interface SidebarContextType {
  isOpen: boolean
  toggle: () => void
  setSidebarOpen: (isOpen: boolean) => void
}

// Crear el contexto con un valor por defecto
const SidebarContext = createContext<SidebarContextType>({
  isOpen: true,
  toggle: () => {},
  setSidebarOpen: () => {}
})

// Hook personalizado para usar el contexto
export const useSidebar = () => {
  return useContext(SidebarContext)
}

// Función helper para obtener el estado del sidebar desde localStorage
const getSidebarStateFromStorage = (): boolean => {
  if (typeof window === 'undefined') return true
  
  try {
    const savedState = localStorage.getItem(SIDEBAR_STATE_KEY)
    return savedState === null ? true : savedState === 'true'
  } catch (error) {
    console.error('Error al leer localStorage:', error)
    return true
  }
}

// Función helper para guardar el estado del sidebar en localStorage
const saveSidebarStateToStorage = (isOpen: boolean): void => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(SIDEBAR_STATE_KEY, String(isOpen))
  } catch (error) {
    console.error('Error al escribir en localStorage:', error)
  }
}

// Proveedor del contexto
export function SidebarProvider({ children }: { children: ReactNode }) {
  // Usar un estado inicial de true (necesario para SSR)
  const [isOpen, setIsOpen] = useState(true)
  
  // Cargar el estado desde localStorage solo una vez al montar
  useEffect(() => {
    const savedState = getSidebarStateFromStorage()
    setIsOpen(savedState)
  }, [])
  
  // Función para cambiar el estado
  const toggle = useCallback(() => {
    setIsOpen(prevState => {
      const newState = !prevState
      saveSidebarStateToStorage(newState)
      return newState
    })
  }, [])
  
  // Función para establecer directamente el estado
  const setSidebarOpen = useCallback((newState: boolean) => {
    setIsOpen(newState)
    saveSidebarStateToStorage(newState)
  }, [])

  return (
    <SidebarContext.Provider 
      value={{
        isOpen,
        toggle,
        setSidebarOpen
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
} 