"use client"

import { useEffect, useState, useRef } from 'react'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, ChevronRight, X, SkipForward, HelpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface TourTooltipProps {
  step: any
  stepIndex: number
  totalSteps: number
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
  onClose: () => void
  onHelp: () => void
  isLastStep: boolean
  targetElement: HTMLElement | null
}

const TourTooltip = ({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  onClose,
  onHelp,
  isLastStep,
  targetElement
}: TourTooltipProps) => {
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [placement, setPlacement] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom')
  const tooltipRef = useRef<HTMLDivElement>(null)

  const progress = ((stepIndex + 1) / totalSteps) * 100

  useEffect(() => {
    if (!targetElement || !tooltipRef.current) return

    const calculatePosition = () => {
      const targetRect = targetElement.getBoundingClientRect()
      const tooltipRect = tooltipRef.current!.getBoundingClientRect()
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight

      let newTop = 0
      let newLeft = 0
      let newPlacement: 'top' | 'bottom' | 'left' | 'right' = 'bottom'

      // Determinar la mejor posición
      const spaceBelow = windowHeight - targetRect.bottom
      const spaceAbove = targetRect.top
      const spaceRight = windowWidth - targetRect.right
      const spaceLeft = targetRect.left

      if (step.placement === 'center') {
        newTop = windowHeight / 2 - tooltipRect.height / 2
        newLeft = windowWidth / 2 - tooltipRect.width / 2
        newPlacement = 'bottom'
      } else if (spaceBelow >= 300 || step.placement === 'bottom') {
        // Posicionar abajo
        newTop = targetRect.bottom + 20
        newLeft = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2
        newPlacement = 'bottom'
      } else if (spaceAbove >= 300 || step.placement === 'top') {
        // Posicionar arriba
        newTop = targetRect.top - tooltipRect.height - 20
        newLeft = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2
        newPlacement = 'top'
      } else if (spaceRight >= 400 || step.placement === 'right') {
        // Posicionar a la derecha
        newTop = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2
        newLeft = targetRect.right + 20
        newPlacement = 'right'
      } else {
        // Posicionar a la izquierda
        newTop = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2
        newLeft = targetRect.left - tooltipRect.width - 20
        newPlacement = 'left'
      }

      // Ajustar para que no se salga de la pantalla
      if (newLeft < 20) newLeft = 20
      if (newLeft + tooltipRect.width > windowWidth - 20) {
        newLeft = windowWidth - tooltipRect.width - 20
      }
      if (newTop < 20) newTop = 20
      if (newTop + tooltipRect.height > windowHeight - 20) {
        newTop = windowHeight - tooltipRect.height - 20
      }

      setPosition({ top: newTop, left: newLeft })
      setPlacement(newPlacement)
    }

    calculatePosition()
    
    const handleResize = () => calculatePosition()
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', calculatePosition)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', calculatePosition)
    }
  }, [targetElement, step.placement])

  return (
    <motion.div
      ref={tooltipRef}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 1001,
      }}
      className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 max-w-sm overflow-hidden"
    >
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg">{step.title}</h3>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Barra de progreso */}
        {step.showProgress !== false && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Paso {stepIndex + 1} de {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-white/20" />
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-4">
        <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm leading-relaxed">
          {step.content}
        </p>

        {/* Botones de acción */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            {/* Botón de asistente */}
            <Button
              onClick={onHelp}
              variant="outline"
              size="sm"
              className="gap-1"
            >
              <HelpCircle className="h-3 w-3" />
              Ayuda
            </Button>
            
            {/* Botón saltar (solo si no es el último paso) */}
            {!isLastStep && step.showSkipButton !== false && (
              <Button
                onClick={onSkip}
                variant="outline"
                size="sm"
                className="gap-1"
              >
                <SkipForward className="h-3 w-3" />
                Saltar
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {/* Botón anterior */}
            {stepIndex > 0 && (
              <Button
                onClick={onPrev}
                variant="outline"
                size="sm"
                className="gap-1"
              >
                <ChevronLeft className="h-3 w-3" />
                Anterior
              </Button>
            )}
            
            {/* Botón siguiente/finalizar */}
            <Button
              onClick={onNext}
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 gap-1"
            >
              {isLastStep ? (
                '¡Empezar!'
              ) : (
                <>
                  Siguiente
                  <ChevronRight className="h-3 w-3" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Flecha indicadora */}
      <div 
        className={`absolute w-0 h-0 border-solid ${
          placement === 'bottom' 
            ? 'border-t-blue-500 border-l-transparent border-r-transparent border-b-0 border-l-8 border-r-8 border-t-8 -top-2 left-1/2 transform -translate-x-1/2'
            : placement === 'top'
            ? 'border-b-blue-500 border-l-transparent border-r-transparent border-t-0 border-l-8 border-r-8 border-b-8 -bottom-2 left-1/2 transform -translate-x-1/2'
            : placement === 'right'
            ? 'border-l-blue-500 border-t-transparent border-b-transparent border-r-0 border-t-8 border-b-8 border-l-8 -left-2 top-1/2 transform -translate-y-1/2'
            : 'border-r-blue-500 border-t-transparent border-b-transparent border-l-0 border-t-8 border-b-8 border-r-8 -right-2 top-1/2 transform -translate-y-1/2'
        }`}
      />
    </motion.div>
  )
}

const TourOverlay = ({ targetElement, step }: { targetElement: HTMLElement | null, step: any }) => {
  const [spotlight, setSpotlight] = useState({ top: 0, left: 0, width: 0, height: 0 })

  useEffect(() => {
    if (!targetElement) {
      setSpotlight({ top: 0, left: 0, width: 0, height: 0 })
      return
    }

    const updateSpotlight = () => {
      const rect = targetElement.getBoundingClientRect()
      const padding = step.target === 'body' ? 0 : 8
      
      setSpotlight({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      })
    }

    updateSpotlight()
    
    const handleResize = () => updateSpotlight()
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', updateSpotlight)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', updateSpotlight)
    }
  }, [targetElement, step.target])

  if (step.target === 'body') {
    return <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1000]" />
  }

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none">
      {/* Overlay con recorte para spotlight */}
      <svg className="w-full h-full">
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={spotlight.left}
              y={spotlight.top}
              width={spotlight.width}
              height={spotlight.height}
              rx="8"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.4)"
          mask="url(#spotlight-mask)"
        />
      </svg>
      
      {/* Borde del spotlight */}
      <div
        className="absolute border-2 border-blue-500 rounded-lg shadow-lg"
        style={{
          top: spotlight.top,
          left: spotlight.left,
          width: spotlight.width,
          height: spotlight.height,
        }}
      />
    </div>
  )
}

export function CustomTour() {
  const {
    tourActive,
    currentStep,
    totalSteps,
    tourType,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    showAssistant
  } = useOnboarding()

  const [currentStepData, setCurrentStepData] = useState<any>(null)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!tourActive) return

    // Importar steps dinámicamente según el tipo de tour
    import('@/contexts/OnboardingContext').then(({ FULL_TOUR_STEPS, QUICK_TOUR_STEPS }) => {
      const steps = tourType === 'quick' ? QUICK_TOUR_STEPS : FULL_TOUR_STEPS
      const step = steps[currentStep]
      
      if (!step) return
      
      setCurrentStepData(step)

      // Buscar el elemento target
      const findTargetElement = () => {
        if (step.target === 'body') {
          setTargetElement(document.body)
          return
        }

        const element = document.querySelector(step.target) as HTMLElement
        if (element) {
          setTargetElement(element)
          
          // Scroll al elemento si es necesario
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'center'
          })
        } else {
          console.warn('Target not found:', step.target)
          // Continuar al siguiente paso si el target no se encuentra
          setTimeout(() => {
            nextStep()
          }, 1000)
        }
      }

      // Pequeño delay para asegurar que el DOM esté listo
      setTimeout(findTargetElement, 100)
    })
  }, [tourActive, currentStep, tourType, nextStep])

  const handleNext = () => {
    if (currentStep === totalSteps - 1) {
      completeTour()
    } else {
      nextStep()
    }
  }

  const handleHelp = () => {
    showAssistant()
  }

  if (!tourActive || !currentStepData) {
    return null
  }

  const isLastStep = currentStep === totalSteps - 1

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000]">
        {/* Overlay */}
        <TourOverlay targetElement={targetElement} step={currentStepData} />
        
        {/* Tooltip */}
        <TourTooltip
          step={currentStepData}
          stepIndex={currentStep}
          totalSteps={totalSteps}
          onNext={handleNext}
          onPrev={prevStep}
          onSkip={skipTour}
          onClose={skipTour}
          onHelp={handleHelp}
          isLastStep={isLastStep}
          targetElement={targetElement}
        />
      </div>
    </AnimatePresence>
  )
}

// CSS adicional para z-index
const tourStyles = `
  .tour-overlay {
    z-index: 1000 !important;
  }
  .tour-tooltip {
    z-index: 1001 !important;
  }
`

// Inyectar estilos globalmente
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style")
  styleSheet.innerText = tourStyles
  document.head.appendChild(styleSheet)
} 