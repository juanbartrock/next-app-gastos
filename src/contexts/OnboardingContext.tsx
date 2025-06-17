"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useSession } from "next-auth/react"

// Clave para el localStorage
const ONBOARDING_STATE_KEY = 'finanzIA_onboarding'

// Tipos para los pasos del onboarding
export interface OnboardingStep {
  id: string
  title: string
  content: string
  target: string
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  disableBeacon?: boolean
  spotlightClicks?: boolean
  hideCloseButton?: boolean
  showProgress?: boolean
  showSkipButton?: boolean
}

// Interfaz para el contexto
interface OnboardingContextType {
  // Estado del tour
  isFirstTime: boolean
  tourActive: boolean
  currentStep: number
  totalSteps: number
  completedSteps: string[]
  tourType: 'full' | 'quick' | 'custom'
  
  // Acciones del tour
  startTour: (type?: 'full' | 'quick') => void
  nextStep: () => void
  prevStep: () => void
  completeStep: (stepId: string) => void
  skipTour: () => void
  pauseTour: () => void
  resumeTour: () => void
  resetTour: () => void
  completeTour: () => void
  
  // Asistente virtual
  assistantVisible: boolean
  showAssistant: () => void
  hideAssistant: () => void
  toggleAssistant: () => void
  
  // Configuración
  setTourType: (type: 'full' | 'quick' | 'custom') => void
  updateUserProgress: () => Promise<void>
  
  // Estado de carga
  loading: boolean
}

// Crear el contexto
const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

// Funciones para manejar localStorage
const getOnboardingStateFromStorage = () => {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(ONBOARDING_STATE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.error('Error al leer onboarding desde localStorage:', error)
    return null
  }
}

const saveOnboardingStateToStorage = (state: any) => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(ONBOARDING_STATE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Error al guardar onboarding en localStorage:', error)
  }
}

// Pasos del tour completo
export const FULL_TOUR_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido a FinanzIA! 🎉',
    content: 'Te vamos a mostrar cómo usar todas las funcionalidades de tu nueva aplicación de finanzas inteligente.',
    target: 'body',
    placement: 'center',
    disableBeacon: true,
    showProgress: true
  },
  {
    id: 'sidebar',
    title: 'Navegación Principal 🧭',
    content: 'Aquí está tu menú principal. Desde aquí puedes acceder a todas las funcionalidades: dashboard, transacciones, presupuestos y más.',
    target: '[data-tour="sidebar"]',
    placement: 'right',
    showProgress: true
  },
  {
    id: 'dashboard-balance',
    title: 'Tu Balance Financiero 💰',
    content: 'Este es tu resumen financiero. Aquí ves tus ingresos, gastos y balance total. Puedes ocultar los valores con el botón del ojo.',
    target: '[data-tour="balance-cards"]',
    placement: 'bottom',
    showProgress: true
  },
  {
    id: 'notification-center',
    title: 'Centro de Alertas 🔔',
    content: 'Tu centro de notificaciones inteligentes. Aquí recibirás alertas automáticas sobre presupuestos, gastos inusuales y más.',
    target: '[data-tour="notifications"]',
    placement: 'bottom',
    showProgress: true
  },
  {
    id: 'first-transaction',
    title: 'Tu Primera Transacción 📝',
    content: 'Vamos a crear tu primera transacción para que veas cómo funciona el sistema.',
    target: '[data-tour="add-transaction"]',
    placement: 'left',
    showProgress: true,
    spotlightClicks: true
  },
  {
    id: 'recurring-expenses',
    title: 'Gastos Recurrentes 🔄',
    content: 'Gestiona gastos que se repiten cada mes como alquiler, servicios, etc. El sistema puede asociarlos automáticamente.',
    target: '[data-tour="recurring"]',
    placement: 'right',
    showProgress: true
  },
  {
    id: 'budgets',
    title: 'Presupuestos Inteligentes 📊',
    content: 'Crea presupuestos y recibe alertas automáticas cuando te acerques a los límites (80%, 90%, 100%).',
    target: '[data-tour="budgets"]',
    placement: 'right',
    showProgress: true
  },
  {
    id: 'ai-features',
    title: 'Inteligencia Artificial 🤖',
    content: 'Tu asistente financiero inteligente puede analizar patrones, generar recomendaciones y detectar anomalías.',
    target: '[data-tour="ai"]',
    placement: 'right',
    showProgress: true
  },
  {
    id: 'completion',
    title: '¡Felicitaciones! 🎊',
    content: 'Ya conoces las funcionalidades principales de FinanzIA. ¡Ahora puedes empezar a gestionar tus finanzas de forma inteligente!',
    target: 'body',
    placement: 'center',
    disableBeacon: true,
    hideCloseButton: true
  }
]

// Tour rápido (solo lo esencial)
export const QUICK_TOUR_STEPS: OnboardingStep[] = [
  {
    id: 'welcome-quick',
    title: '¡Bienvenido! Tour Rápido ⚡',
    content: 'Te mostraremos solo lo esencial para empezar.',
    target: 'body',
    placement: 'center',
    disableBeacon: true
  },
  {
    id: 'dashboard-quick',
    title: 'Tu Dashboard 📊',
    content: 'Aquí ves tu resumen financiero y puedes crear transacciones rápidamente.',
    target: '[data-tour="dashboard-main"]',
    placement: 'center'
  },
  {
    id: 'transactions-quick',
    title: 'Crear Transacciones 💸',
    content: 'Registra tus gastos e ingresos desde aquí.',
    target: '[data-tour="add-transaction"]',
    placement: 'left',
    spotlightClicks: true
  },
  {
    id: 'menu-quick',
    title: 'Menú Principal 🧭',
    content: 'Explora más funcionalidades desde el menú lateral.',
    target: '[data-tour="sidebar"]',
    placement: 'right'
  },
  {
    id: 'done-quick',
    title: '¡Listo! 🎉',
    content: '¡Ya puedes empezar a usar FinanzIA!',
    target: 'body',
    placement: 'center',
    hideCloseButton: true
  }
]

// Proveedor del contexto
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  
  // Estados del tour
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [tourActive, setTourActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [tourType, setTourType] = useState<'full' | 'quick' | 'custom'>('full')
  const [loading, setLoading] = useState(true)
  
  // Estados del asistente virtual
  const [assistantVisible, setAssistantVisible] = useState(false)
  
  // Cargar estado inicial
  useEffect(() => {
    const loadOnboardingState = async () => {
      if (status === 'loading') return
      
      setLoading(true)
      
      try {
        // Verificar si es la primera vez del usuario
        if (session?.user?.id) {
          const response = await fetch('/api/onboarding/status')
          const data = await response.json()
          
          setIsFirstTime(!data.onboardingCompleted)
          setCompletedSteps(data.completedSteps || [])
          setCurrentStep(data.currentStep || 0)
          
          // Si es primera vez, NO iniciar tour automáticamente
          // El tour se inicia desde el modal de bienvenida
          if (!data.onboardingCompleted && !data.onboardingSkipped) {
            // No hacer nada aquí, el modal se maneja desde el dashboard
          }
        } else {
          // Usuario no logueado, usar localStorage
          const savedState = getOnboardingStateFromStorage()
          if (savedState) {
            setCompletedSteps(savedState.completedSteps || [])
            setCurrentStep(savedState.currentStep || 0)
            setTourType(savedState.tourType || 'full')
          }
        }
      } catch (error) {
        console.error('Error cargando estado de onboarding:', error)
      }
      
      setLoading(false)
    }
    
    loadOnboardingState()
  }, [session, status])
  
  // Obtener pasos del tour según el tipo
  const getTourSteps = () => {
    switch (tourType) {
      case 'quick':
        return QUICK_TOUR_STEPS
      case 'full':
      default:
        return FULL_TOUR_STEPS
    }
  }
  
  const totalSteps = getTourSteps().length
  
  // Iniciar tour
  const startTour = (type: 'full' | 'quick' = 'full') => {
    setTourType(type)
    setCurrentStep(0)
    setTourActive(true)
    updateUserProgress()
  }
  
  // Siguiente paso
  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      completeTour()
    }
  }
  
  // Paso anterior
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }
  
  // Completar paso específico
  const completeStep = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      const newCompletedSteps = [...completedSteps, stepId]
      setCompletedSteps(newCompletedSteps)
      updateUserProgress()
      
      // Guardar en localStorage
      saveOnboardingStateToStorage({
        completedSteps: newCompletedSteps,
        currentStep,
        tourType
      })
    }
  }
  
  // Saltar tour
  const skipTour = async () => {
    setTourActive(false)
    setIsFirstTime(false)
    
    if (session?.user?.id) {
      try {
        await fetch('/api/onboarding/skip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      } catch (error) {
        console.error('Error al saltar onboarding:', error)
      }
    }
  }
  
  // Pausar tour
  const pauseTour = () => {
    setTourActive(false)
    updateUserProgress()
  }
  
  // Reanudar tour
  const resumeTour = () => {
    setTourActive(true)
  }
  
  // Resetear tour
  const resetTour = () => {
    setCurrentStep(0)
    setCompletedSteps([])
    setTourActive(false)
    setIsFirstTime(true)
  }
  
  // Completar tour
  const completeTour = async () => {
    setTourActive(false)
    setIsFirstTime(false)
    
    if (session?.user?.id) {
      try {
        await fetch('/api/onboarding/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            completedSteps: [...completedSteps, ...getTourSteps().map(s => s.id)],
            tourType
          })
        })
      } catch (error) {
        console.error('Error al completar onboarding:', error)
      }
    }
  }
  
  // Actualizar progreso del usuario
  const updateUserProgress = async () => {
    if (!session?.user?.id) return
    
    try {
      await fetch('/api/onboarding/progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStep,
          completedSteps,
          tourType
        })
      })
    } catch (error) {
      console.error('Error actualizando progreso:', error)
    }
  }
  
  // Funciones del asistente virtual
  const showAssistant = () => setAssistantVisible(true)
  const hideAssistant = () => setAssistantVisible(false)
  const toggleAssistant = () => setAssistantVisible(prev => !prev)

  const value: OnboardingContextType = {
    // Estado del tour
    isFirstTime,
    tourActive,
    currentStep,
    totalSteps,
    completedSteps,
    tourType,
    
    // Acciones del tour
    startTour,
    nextStep,
    prevStep,
    completeStep,
    skipTour,
    pauseTour,
    resumeTour,
    resetTour,
    completeTour,
    
    // Asistente virtual
    assistantVisible,
    showAssistant,
    hideAssistant,
    toggleAssistant,
    
    // Configuración
    setTourType,
    updateUserProgress,
    
    // Estado de carga
    loading
  }

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  )
}

// Hook personalizado para usar el contexto
export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
} 