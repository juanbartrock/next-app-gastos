"use client"

import { useEffect, useState } from 'react'
import Joyride, { CallBackProps, EVENTS, STATUS, ACTIONS, Placement } from 'react-joyride'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, ChevronRight, X, SkipForward, HelpCircle } from 'lucide-react'

interface CustomTooltipProps {
  continuous: boolean
  index: number
  step: any
  backProps: any
  closeProps: any
  primaryProps: any
  skipProps: any
  size: number
  tooltipProps: any
  isLastStep: boolean
}

// Componente personalizado del tooltip
const CustomTooltip = ({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  size,
  tooltipProps,
  isLastStep
}: CustomTooltipProps) => {
  const { showAssistant } = useOnboarding()
  
  const progress = ((index + 1) / size) * 100

  return (
    <div
      {...tooltipProps}
      className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 max-w-sm p-0 overflow-hidden"
    >
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg">{step.title}</h3>
          <Button
            {...closeProps}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Barra de progreso */}
        {step.showProgress && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Paso {index + 1} de {size}</span>
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
              onClick={showAssistant}
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
                {...skipProps}
                variant="outline"
                size="sm"
                className="gap-1"
              >
                <SkipForward className="h-3 w-3" />
                Saltar Tour
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {/* Botón anterior */}
            {index > 0 && (
              <Button
                {...backProps}
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
              {...primaryProps}
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 gap-1"
            >
              {isLastStep ? (
                <>¡Empezar!</>
              ) : continuous ? (
                <>
                  Siguiente
                  <ChevronRight className="h-3 w-3" />
                </>
              ) : (
                'Entendido'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function InteractiveTour() {
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

  const [joyrideSteps, setJoyrideSteps] = useState<any[]>([])
  const [run, setRun] = useState(false)

  // Convertir steps del contexto a formato joyride
  useEffect(() => {
    if (tourActive) {
      // Importar steps dinámicamente según el tipo de tour
      import('@/contexts/OnboardingContext').then(({ FULL_TOUR_STEPS, QUICK_TOUR_STEPS }) => {
        const steps = tourType === 'quick' ? QUICK_TOUR_STEPS : FULL_TOUR_STEPS
        
        const joyrideSteps = steps.map(step => ({
          target: step.target,
          content: step.content,
          title: step.title,
          placement: step.placement as Placement || 'auto',
          disableBeacon: step.disableBeacon || false,
          spotlightClicks: step.spotlightClicks || false,
          hideCloseButton: step.hideCloseButton || false,
          showProgress: step.showProgress !== false,
          showSkipButton: step.showSkipButton !== false,
          // Configuraciones adicionales para mejorar UX
          styles: {
            options: {
              primaryColor: '#3b82f6',
            }
          }
        }))
        
        setJoyrideSteps(joyrideSteps)
        setRun(true)
      })
    } else {
      setRun(false)
    }
  }, [tourActive, tourType])

  // Manejar eventos del tour
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { action, index, status, type } = data

    console.log('Tour event:', { action, index, status, type })

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      // Tour completado o saltado
      setRun(false)
      if (status === STATUS.FINISHED) {
        completeTour()
      } else {
        skipTour()
      }
    } else if (type === EVENTS.STEP_AFTER) {
      // Paso completado, pasar al siguiente
      if (action === ACTIONS.NEXT) {
        nextStep()
      } else if (action === ACTIONS.PREV) {
        prevStep()
      }
    } else if (type === EVENTS.TARGET_NOT_FOUND) {
      // Target no encontrado, pasar al siguiente paso
      console.warn('Target not found for step:', index)
      nextStep()
    }
  }

  // No renderizar si el tour no está activo
  if (!tourActive || !run) {
    return null
  }

  return (
    <Joyride
      steps={joyrideSteps}
      run={run}
      stepIndex={currentStep}
      continuous={true}
      showProgress={false}
      showSkipButton={false}
      disableOverlayClose={true}
      disableCloseOnEsc={false}
      hideBackButton={false}
      spotlightPadding={4}
      callback={handleJoyrideCallback}
      tooltipComponent={CustomTooltip}
      locale={{
        back: 'Anterior',
        close: 'Cerrar',
        last: 'Finalizar',
        next: 'Siguiente',
        nextLabelWithProgress: 'Siguiente ({step} de {totalSteps})',
        open: 'Abrir diálogo',
        skip: 'Saltar tour'
      }}
      styles={{
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
        },
        spotlight: {
          borderRadius: '8px',
        },
        beacon: {
          inner: '#3b82f6',
          outer: '#3b82f6'
        }
      }}
    />
  )
} 