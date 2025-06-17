"use client"

import { useState, useRef, useEffect } from "react"
import { Bot, X, Send, Loader2, User, HelpCircle, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useOnboarding } from "@/contexts/OnboardingContext"
import { motion, AnimatePresence } from "framer-motion"

// Función simple para renderizar markdown básico
function renderMarkdown(text: string): JSX.Element {
  const parts = text.split('\n');
  
  return (
    <div className="space-y-2">
      {parts.map((line, index) => {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('### ')) {
          return (
            <h3 key={index} className="text-base font-semibold mb-1 mt-3 text-current">
              {trimmedLine.replace('### ', '')}
            </h3>
          );
        }
        if (trimmedLine.startsWith('## ')) {
          return (
            <h2 key={index} className="text-lg font-bold mb-2 mt-3 text-current">
              {trimmedLine.replace('## ', '')}
            </h2>
          );
        }
        
        if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
          return (
            <div key={index} className="flex items-start ml-3 mb-1">
              <span className="text-current mr-2 mt-0.5">•</span>
              <span className="text-current break-words">{processSimpleBold(trimmedLine.slice(2))}</span>
            </div>
          );
        }
        
        if (!trimmedLine) {
          return <div key={index} className="h-1"></div>;
        }
        
        return (
          <p key={index} className="mb-1 text-current leading-relaxed break-words">
            {processSimpleBold(trimmedLine)}
          </p>
        );
      })}
    </div>
  );
}

function processSimpleBold(text: string): JSX.Element {
  const regex = /(\*\*[^*]+\*\*)/g;
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          const boldText = part.slice(2, -2);
          return (
            <strong key={i} className="font-bold text-current">
              {boldText}
            </strong>
          );
        } else {
          return (
            <span key={i} className="text-current break-words">
              {part}
            </span>
          );
        }
      })}
    </>
  );
}

interface Message {
  role: "user" | "assistant"
  content: string
  isPersonalized?: boolean
}

type AssistantMode = 'financial' | 'help'

export function UnifiedAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<AssistantMode>('financial')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  
  const { tourActive, currentStep, assistantVisible, hideAssistant } = useOnboarding()

  // Inicializar mensajes según el modo
  useEffect(() => {
    const initialMessages = {
      financial: [
        {
          role: "assistant" as const,
          content: "¡Hola! Soy tu asesor financiero virtual. ¿En qué puedo ayudarte hoy? Puedo ayudarte con ahorro, inversión, análisis de gastos y cualquier consulta financiera.",
          isPersonalized: false
        }
      ],
      help: [
        {
          role: "assistant" as const,
          content: "¡Hola! 👋 Soy el asistente de ayuda de FinanzIA. Puedo explicarte cómo usar cualquier funcionalidad de la aplicación. ¿En qué puedo ayudarte?",
          isPersonalized: false
        }
      ]
    }
    
    setMessages(initialMessages[mode])
  }, [mode])

  // Auto-scroll cuando se agregan nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus en el input cuando se abre el chat
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Abrir automáticamente si el asistente está activado desde onboarding
  useEffect(() => {
    if (assistantVisible && !isOpen) {
      setIsOpen(true)
      setMode('help')
    }
  }, [assistantVisible, isOpen])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: "user",
      content: input
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      let response
      
      if (mode === 'financial') {
        // Usar el endpoint financiero existente
        response = await fetch("/api/financial-advisor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            context: "dashboard"
          })
        })
      } else {
        // Usar el nuevo endpoint de ayuda
        response = await fetch('/api/ai/virtual-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: input,
            context: [],
            tourActive,
            currentStep
          })
        })
      }

      if (!response.ok) {
        throw new Error("Error al comunicarse con el asistente")
      }

      const data = await response.json()
      
      // Agregar respuesta del asistente
      setMessages(prev => [...prev, {
        role: "assistant",
        content: mode === 'financial' ? data.response : data.response,
        isPersonalized: mode === 'financial' ? (data.debug?.isPersonalized || false) : false
      }])

    } catch (error) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Lo siento, hubo un problema al procesar tu consulta. Por favor, intenta de nuevo.",
        isPersonalized: false
      }])
    }

    setIsLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const switchMode = (newMode: AssistantMode) => {
    setMode(newMode)
    setMessages([]) // Limpiar mensajes al cambiar modo
  }

  const handleClose = () => {
    setIsOpen(false)
    if (mode === 'help' && assistantVisible) {
      hideAssistant()
    }
  }

  const getModeConfig = (currentMode: AssistantMode) => {
    return {
      financial: {
        title: 'Asesor Financiero',
        icon: <Calculator className="h-4 w-4" />,
        gradient: 'from-green-500 to-emerald-600',
        description: 'Análisis financiero personalizado'
      },
      help: {
        title: 'Ayuda de la App',
        icon: <HelpCircle className="h-4 w-4" />,
        gradient: 'from-blue-500 to-purple-600',
        description: 'Guía de funcionalidades'
      }
    }[currentMode]
  }

  return (
    <>
      {/* Botón flotante */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className={cn(
            "rounded-full w-14 h-14 shadow-xl transition-all duration-300",
            mode === 'financial' 
              ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700" 
              : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          )}
        >
          <div className="relative">
            {mode === 'financial' ? (
              <Calculator className="h-6 w-6 text-white" />
            ) : (
              <HelpCircle className="h-6 w-6 text-white" />
            )}
            
            {/* Indicador de modo activo */}
            {assistantVisible && mode === 'help' && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
        </Button>
      </motion.div>

      {/* Ventana del chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 300, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]"
          >
            <Card className="shadow-2xl border-gray-200 dark:border-gray-800 max-h-[calc(100vh-8rem)] flex flex-col">
              {/* Header con selector de modo */}
              <CardHeader className={cn(
                "pb-3 text-white rounded-t-lg bg-gradient-to-r",
                getModeConfig(mode).gradient
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-full">
                      {getModeConfig(mode).icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{getModeConfig(mode).title}</CardTitle>
                      <p className="text-xs opacity-90">{getModeConfig(mode).description}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleClose}
                    className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Selector de modo */}
                <div className="mt-3 flex gap-2">
                  <Button
                    variant={mode === 'financial' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => switchMode('financial')}
                    className="flex-1 text-xs h-8"
                  >
                    <Calculator className="h-3 w-3 mr-1" />
                    Financiero
                  </Button>
                  <Button
                    variant={mode === 'help' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => switchMode('help')}
                    className="flex-1 text-xs h-8"
                  >
                    <HelpCircle className="h-3 w-3 mr-1" />
                    Ayuda
                  </Button>
                </div>
              </CardHeader>

              {/* Área de mensajes */}
              <CardContent className="p-0 flex-1 overflow-hidden">
                <div className="h-80 overflow-y-auto p-4 space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-start gap-2",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.role === "assistant" && (
                        <div className={cn(
                          "p-1.5 rounded-full mt-1 flex-shrink-0",
                          mode === 'financial' 
                            ? "bg-green-100 dark:bg-green-900" 
                            : "bg-blue-100 dark:bg-blue-900"
                        )}>
                          <Bot className={cn(
                            "h-3 w-3",
                            mode === 'financial' 
                              ? "text-green-600 dark:text-green-400" 
                              : "text-blue-600 dark:text-blue-400"
                          )} />
                        </div>
                      )}
                      
                      <div className={cn(
                        "max-w-[80%] p-3 rounded-lg text-sm",
                        message.role === "user"
                          ? mode === 'financial'
                            ? "bg-green-500 text-white rounded-br-sm"
                            : "bg-blue-500 text-white rounded-br-sm"
                          : "bg-gray-100 dark:bg-gray-800 rounded-bl-sm"
                      )}>
                        <div className="break-words hyphens-auto leading-relaxed overflow-hidden">
                          {renderMarkdown(message.content)}
                        </div>
                        
                        {message.isPersonalized && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            <User className="h-3 w-3 mr-1" />
                            Análisis personalizado
                          </Badge>
                        )}
                      </div>
                      
                      {message.role === "user" && (
                        <div className={cn(
                          "p-1.5 rounded-full mt-1 flex-shrink-0",
                          mode === 'financial' 
                            ? "bg-green-100 dark:bg-green-900" 
                            : "bg-blue-100 dark:bg-blue-900"
                        )}>
                          <User className={cn(
                            "h-3 w-3",
                            mode === 'financial' 
                              ? "text-green-600 dark:text-green-400" 
                              : "text-blue-600 dark:text-blue-400"
                          )} />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className={cn(
                        "p-1.5 rounded-full flex-shrink-0",
                        mode === 'financial' 
                          ? "bg-green-100 dark:bg-green-900" 
                          : "bg-blue-100 dark:bg-blue-900"
                      )}>
                        <Bot className={cn(
                          "h-3 w-3",
                          mode === 'financial' 
                            ? "text-green-600 dark:text-green-400" 
                            : "text-blue-600 dark:text-blue-400"
                        )} />
                      </div>
                      <div className="ml-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg rounded-bl-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Input area */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        mode === 'financial' 
                          ? "Pregunta sobre finanzas..." 
                          : "¿Cómo puedo ayudarte con la app?"
                      }
                      className="flex-1 text-sm"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!input.trim() || isLoading}
                      size="sm"
                      className={cn(
                        mode === 'financial' 
                          ? "bg-green-500 hover:bg-green-600" 
                          : "bg-blue-500 hover:bg-blue-600"
                      )}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    {mode === 'financial' 
                      ? "Análisis basado en tus datos financieros reales" 
                      : "Ayuda contextual sobre funcionalidades de FinanzIA"
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
} 