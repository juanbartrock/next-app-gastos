"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MessageCircle, 
  Bot, 
  Sparkles, 
  X,
  HelpCircle,
  Zap
} from 'lucide-react'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { VirtualAssistant } from './VirtualAssistant'
import { usePathname } from 'next/navigation'

export function AssistantButton() {
  const { assistantVisible, showAssistant, hideAssistant, tourActive, currentStep } = useOnboarding()
  const [pulse, setPulse] = useState(false)
  const [showTourTip, setShowTourTip] = useState(false)
  const pathname = usePathname()

  // Pulso sutil cada 30 segundos para recordar que está disponible
  useEffect(() => {
    const interval = setInterval(() => {
      if (!assistantVisible && !tourActive) {
        setPulse(true)
        setTimeout(() => setPulse(false), 2000)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [assistantVisible, tourActive])

  // Mostrar tip contextual durante el tour
  useEffect(() => {
    if (tourActive && currentStep >= 1 && !assistantVisible) {
      setShowTourTip(true)
      const timer = setTimeout(() => setShowTourTip(false), 5000)
      return () => clearTimeout(timer)
    } else {
      setShowTourTip(false)
    }
  }, [tourActive, currentStep, assistantVisible])

  // No mostrar en login/register
  if (pathname?.includes('/login') || pathname?.includes('/register')) {
    return null
  }

  const getContextualMessage = () => {
    if (tourActive) {
      const stepMessages = {
        0: '¿Necesitas ayuda con la bienvenida?',
        1: '¿Tienes preguntas sobre la navegación?',
        2: '¿Quieres saber más sobre transacciones?',
        3: '¿Te interesa conocer los gastos recurrentes?',
        4: '¿Necesitas ayuda con presupuestos?',
        5: '¿Preguntas sobre las alertas?',
        6: '¿Curiosidad sobre la IA?',
        7: '¿Dudas sobre las herramientas avanzadas?'
      }
      return stepMessages[currentStep as keyof typeof stepMessages] || '¿En qué puedo ayudarte?'
    }

    // Mensajes contextuales según la página
    if (pathname?.includes('/transacciones')) {
      return '¿Dudas sobre transacciones?'
    }
    if (pathname?.includes('/presupuestos')) {
      return '¿Ayuda con presupuestos?'
    }
    if (pathname?.includes('/recurrentes')) {
      return '¿Preguntas sobre gastos recurrentes?'
    }
    if (pathname?.includes('/ai-financiero')) {
      return '¿Dudas sobre la IA?'
    }
    if (pathname?.includes('/alertas')) {
      return '¿Ayuda con alertas?'
    }
    
    return '¿En qué puedo ayudarte?'
  }

  return (
    <>
      {/* Botón flotante */}
      <motion.div
        className="fixed bottom-6 left-6 z-40"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2, type: "spring", damping: 15 }}
      >
        <div className="relative">
          {/* Badge de notificación durante el tour */}
          {tourActive && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 z-10"
            >
              <Badge className="bg-red-500 text-white px-2 py-1 text-xs font-bold">
                Tour activo
              </Badge>
            </motion.div>
          )}

          {/* Tooltip contextual */}
          <AnimatePresence>
            {showTourTip && (
              <motion.div
                initial={{ opacity: 0, x: -10, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -10, scale: 0.8 }}
                className="absolute bottom-full left-0 mb-3 w-64"
              >
                <div className="bg-blue-600 text-white p-3 rounded-lg shadow-lg relative">
                  <div className="text-sm font-medium mb-1">💡 Asistente IA disponible</div>
                  <div className="text-xs opacity-90">{getContextualMessage()}</div>
                  <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-600"></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botón principal */}
          <motion.div
            animate={pulse ? { 
              scale: [1, 1.1, 1],
              boxShadow: [
                "0 0 0 0 rgba(59, 130, 246, 0.4)",
                "0 0 0 15px rgba(59, 130, 246, 0)",
                "0 0 0 0 rgba(59, 130, 246, 0)"
              ]
            } : {}}
            transition={{ duration: 2 }}
          >
            <Button
              onClick={assistantVisible ? hideAssistant : showAssistant}
              className={`
                h-14 w-14 rounded-full shadow-lg transition-all duration-300
                ${assistantVisible 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                }
                ${pulse ? 'animate-pulse' : ''}
              `}
            >
              <AnimatePresence mode="wait">
                {assistantVisible ? (
                  <motion.div
                    key="close"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-6 w-6 text-white" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="bot"
                    initial={{ scale: 0, rotate: 180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: -180 }}
                    transition={{ duration: 0.2 }}
                    className="relative"
                  >
                    <Bot className="h-6 w-6 text-white" />
                    {tourActive && (
                      <motion.div
                        className="absolute -top-1 -right-1"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <Sparkles className="h-3 w-3 text-yellow-300" />
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>

          {/* Efecto de ondas cuando está activo */}
          {assistantVisible && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-blue-400"
              animate={{
                scale: [1, 1.5, 2],
                opacity: [0.6, 0.3, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
          )}
        </div>

        {/* Tooltip básico */}
        {!showTourTip && !assistantVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3 }}
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap"
          >
            Asistente IA
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black/80"></div>
          </motion.div>
        )}
      </motion.div>

      {/* Asistente Virtual */}
      <VirtualAssistant 
        isVisible={assistantVisible}
        onClose={hideAssistant}
        initialContext={tourActive ? `Estás en el paso ${currentStep + 1} del tour. ${getContextualMessage()}` : undefined}
      />
    </>
  )
} 