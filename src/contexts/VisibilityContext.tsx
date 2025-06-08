"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

// Clave para el localStorage
const VISIBILITY_STATE_KEY = 'finanzIA_valuesVisible'

// Interfaz para el contexto
interface VisibilityContextType {
  valuesVisible: boolean
  toggleVisibility: () => void
  setValuesVisible: (visible: boolean) => void
}

// Crear el contexto
const VisibilityContext = createContext<VisibilityContextType | undefined>(undefined)

// Funciones para manejar localStorage
const getVisibilityStateFromStorage = (): boolean => {
  if (typeof window === 'undefined') return true
  
  try {
    const stored = localStorage.getItem(VISIBILITY_STATE_KEY)
    return stored !== null ? JSON.parse(stored) : true
  } catch (error) {
    console.error('Error al leer visibilidad desde localStorage:', error)
    return true
  }
}

const saveVisibilityStateToStorage = (visible: boolean): void => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(VISIBILITY_STATE_KEY, JSON.stringify(visible))
  } catch (error) {
    console.error('Error al guardar visibilidad en localStorage:', error)
  }
}

// Proveedor del contexto
export function VisibilityProvider({ children }: { children: ReactNode }) {
  const [valuesVisible, setValuesVisible] = useState(true)
  
  // Cargar el estado desde localStorage solo una vez al montar
  useEffect(() => {
    const savedState = getVisibilityStateFromStorage()
    setValuesVisible(savedState)
  }, [])
  
  // Función para alternar la visibilidad
  const toggleVisibility = () => {
    setValuesVisible(prevState => {
      const newState = !prevState
      saveVisibilityStateToStorage(newState)
      return newState
    })
  }
  
  // Función para establecer directamente la visibilidad
  const setValuesVisibleWithStorage = (visible: boolean) => {
    setValuesVisible(visible)
    saveVisibilityStateToStorage(visible)
  }

  return (
    <VisibilityContext.Provider 
      value={{
        valuesVisible,
        toggleVisibility,
        setValuesVisible: setValuesVisibleWithStorage
      }}
    >
      {children}
    </VisibilityContext.Provider>
  )
}

// Hook personalizado para usar el contexto
export function useVisibility() {
  const context = useContext(VisibilityContext)
  if (context === undefined) {
    throw new Error('useVisibility must be used within a VisibilityProvider')
  }
  return context
} 