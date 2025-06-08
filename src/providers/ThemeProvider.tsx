"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

// Clave para el localStorage
const THEME_STORAGE_KEY = 'finanzIA_theme'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Funciones para manejar localStorage
const getThemeFromStorage = (): Theme => {
  if (typeof window === 'undefined') return 'dark'
  
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return (stored as Theme) || 'dark'
  } catch (error) {
    console.error('Error al leer tema desde localStorage:', error)
    return 'dark'
  }
}

const saveThemeToStorage = (theme: Theme): void => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch (error) {
    console.error('Error al guardar tema en localStorage:', error)
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  // Cargar el tema desde localStorage al montar
  useEffect(() => {
    const savedTheme = getThemeFromStorage()
    setTheme(savedTheme)
  }, [])

  // Aplicar el tema al documento
  useEffect(() => {
    const root = window.document.documentElement
    
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }, [theme])

  const setThemeWithStorage = (newTheme: Theme) => {
    setTheme(newTheme)
    saveThemeToStorage(newTheme)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setThemeWithStorage(newTheme)
  }

  return (
    <ThemeContext.Provider 
      value={{
        theme,
        setTheme: setThemeWithStorage,
        toggleTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
} 