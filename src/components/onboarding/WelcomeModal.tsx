"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Sparkles, 
  Zap, 
  Clock, 
  Users, 
  Brain, 
  Shield,
  CheckCircle,
  Play,
  SkipForward,
  X,
  Lightbulb,
  Rocket
} from 'lucide-react'
import { useOnboarding } from '@/contexts/OnboardingContext'

interface WelcomeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const { startTour, skipTour } = useOnboarding()
  const [selectedTour, setSelectedTour] = useState<'full' | 'quick'>('full')

  const handleStartTour = (type: 'full' | 'quick') => {
    // Cerrar modal primero
    onClose()
    
    // Pequeño delay para asegurar que el modal se cierre antes del tour
    setTimeout(() => {
      startTour(type)
    }, 300) // 300ms delay para animación de cierre
  }

  const handleSkip = () => {
    skipTour()
    onClose()
  }

  const tourOptions = [
    {
      id: 'full',
      title: 'Tour Completo',
      subtitle: 'Recomendado para nuevos usuarios',
      duration: '8-10 minutos',
      description: 'Conoce todas las funcionalidades principales paso a paso',
      features: [
        'Dashboard y navegación',
        'Crear tu primera transacción',
        'Gastos recurrentes automáticos',
        'Presupuestos inteligentes',
        'Sistema de alertas',
        'Inteligencia artificial',
        'Herramientas avanzadas',
        'Configuración personalizada'
      ],
      icon: Sparkles,
      color: 'bg-gradient-to-r from-blue-500 to-purple-600',
      recommended: true
    },
    {
      id: 'quick',
      title: 'Tour Rápido',
      subtitle: 'Lo esencial para empezar',
      duration: '3-4 minutos',
      description: 'Solo las funciones básicas para comenzar rápidamente',
      features: [
        'Dashboard principal',
        'Crear transacciones',
        'Navegación básica',
        'Primeros pasos'
      ],
      icon: Zap,
      color: 'bg-gradient-to-r from-green-500 to-teal-600',
      recommended: false
    }
  ]

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="w-full max-w-4xl my-8 mx-auto"
        >
          <Card className="border-0 shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <CardHeader className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white p-8 flex-shrink-0">
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                      <Rocket className="h-8 w-8" />
                    </div>
                    <div>
                      <CardTitle className="text-3xl font-bold">
                        ¡Bienvenido a FinanzIA! 🎉
                      </CardTitle>
                      <p className="text-blue-100 text-lg mt-1">
                        Tu nueva herramienta de gestión financiera inteligente
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onClose}
                    className="text-white hover:bg-white/20 h-10 w-10 p-0"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  <div className="flex items-center gap-2 justify-center">
                    <Brain className="h-5 w-5" />
                    <span className="text-sm">IA Integrada</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <Users className="h-5 w-5" />
                    <span className="text-sm">Modo Familiar</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <Shield className="h-5 w-5" />
                    <span className="text-sm">100% Seguro</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <Lightbulb className="h-5 w-5" />
                    <span className="text-sm">Alertas Inteligentes</span>
                  </div>
                </div>
              </div>

              {/* Efecto de partículas */}
              <div className="absolute inset-0 opacity-30">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-white rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -10, 0],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}
              </div>
            </CardHeader>

            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-semibold mb-3">
                    ¿Cómo te gustaría conocer FinanzIA?
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    Elige la experiencia que mejor se adapte a tu tiempo disponible
                  </p>
                </div>

                {/* Opciones de tour */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {tourOptions.map((option) => {
                    const Icon = option.icon
                    const isSelected = selectedTour === option.id
                    
                    return (
                      <motion.div
                        key={option.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="relative"
                      >
                        <Card 
                          className={`cursor-pointer transition-all duration-300 ${
                            isSelected 
                              ? 'ring-2 ring-blue-500 shadow-lg' 
                              : 'hover:shadow-md border-gray-200 dark:border-gray-700'
                          }`}
                          onClick={() => setSelectedTour(option.id as 'full' | 'quick')}
                        >
                          {option.recommended && (
                            <div className="absolute -top-3 -right-3 z-10">
                              <Badge className="bg-green-500 text-white px-3 py-1 text-xs font-bold">
                                Recomendado
                              </Badge>
                            </div>
                          )}
                          
                          <CardHeader className="pb-4">
                            <div className="flex items-start gap-4">
                              <div className={`p-3 rounded-full ${option.color} text-white`}>
                                <Icon className="h-6 w-6" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <CardTitle className="text-xl">{option.title}</CardTitle>
                                  {isSelected && (
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                  )}
                                </div>
                                <p className="text-muted-foreground text-sm mb-2">
                                  {option.subtitle}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-blue-500" />
                                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                    {option.duration}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="pt-0">
                            <p className="text-sm text-muted-foreground mb-4">
                              {option.description}
                            </p>
                            
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Incluye:</p>
                              <div className="grid grid-cols-1 gap-1">
                                {option.features.map((feature, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-sm">
                                    <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                                    <span>{feature}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>

                <Separator className="my-6" />

                {/* Acciones */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button
                    onClick={() => handleStartTour(selectedTour)}
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    {selectedTour === 'full' ? 'Comenzar Tour Completo' : 'Comenzar Tour Rápido'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleSkip}
                    size="lg"
                    className="w-full sm:w-auto px-6 py-3"
                  >
                    <SkipForward className="h-4 w-4 mr-2" />
                    Saltar por ahora
                  </Button>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    💡 Tip: Puedes reactivar el tour en cualquier momento desde el menú de ayuda
                  </p>
                </div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
} 