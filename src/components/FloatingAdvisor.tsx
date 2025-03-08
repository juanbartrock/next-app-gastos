"use client"

import { useState, useRef, useEffect } from "react"
import { Bot, X, Send, Loader2, User, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar } from "@/components/ui/avatar"
import { AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

// Definición del tipo para los mensajes
interface Message {
  role: "user" | "assistant"
  content: string
  isPersonalized?: boolean
}

export function FloatingAdvisor() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "¡Hola! Soy tu asesor financiero virtual. ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre ahorro, inversión, o cualquier consulta financiera."
    }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

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

  // Función para enviar un mensaje al asesor
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: "user",
      content: input
    }

    // Actualizar el estado con el mensaje del usuario
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Llamada a la API
      const response = await fetch("/api/financial-advisor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        })
      })

      if (!response.ok) {
        throw new Error("Error al comunicarse con el asesor financiero")
      }

      const data = await response.json()
      
      // Verificar si hay datos de depuración para mostrar información
      const isPersonalized = data.debug?.financialDataExists || false;
      const debugInfo = data.debug;
      
      if (debugInfo) {
        console.log("Información de depuración:", debugInfo);
      }

      // Agregar la respuesta del asistente a los mensajes
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.response,
        isPersonalized
      }])
    } catch (error) {
      console.error("Error:", error)
      // Mensaje de error en caso de fallo
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Lo siento, ha ocurrido un error al procesar tu consulta. Por favor, intenta nuevamente más tarde."
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // Manejar envío con Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Navegar a la página completa del asesor
  const navigateToFullAdvisor = () => {
    router.push('/financial-advisor')
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300",
          isOpen && "opacity-0 pointer-events-none"
        )}
        aria-label="Abrir asesor financiero"
      >
        <Bot className="h-6 w-6" />
      </button>

      {/* Ventana de chat */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 w-80 md:w-96 rounded-2xl shadow-2xl bg-background border transition-all duration-300 flex flex-col",
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        )}
        style={{ overflow: isOpen ? 'visible' : 'hidden' }}
      >
        {/* Encabezado */}
        <div className="p-3 border-b flex items-center justify-between bg-primary text-primary-foreground rounded-t-2xl">
          <div className="flex items-center">
            <Bot className="h-5 w-5 mr-2" />
            <h3 className="font-medium">Asesor Financiero</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={navigateToFullAdvisor}
              className="p-1 rounded-md hover:bg-primary/80 transition-colors"
              aria-label="Ver asesor completo"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md hover:bg-primary/80 transition-colors"
              aria-label="Cerrar chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Contenido del chat */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 max-h-[350px]">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
            >
              <div className="flex items-start max-w-[80%] space-x-2">
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className={cn(
                      "text-primary-foreground",
                      message.isPersonalized ? "bg-green-600" : "bg-primary"
                    )}>
                      {message.isPersonalized ? "P" : "G"}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={cn(
                    "p-3 rounded-xl text-sm",
                    message.role === "assistant" 
                      ? message.isPersonalized 
                        ? "bg-green-50 dark:bg-green-900/20 text-foreground rounded-tl-none border border-green-200 dark:border-green-800" 
                        : "bg-muted text-foreground rounded-tl-none"
                      : "bg-primary text-primary-foreground rounded-tr-none"
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Mostrar indicador de respuesta personalizada si aplica */}
                  {message.role === "assistant" && (
                    <span className={cn(
                      "mt-1 text-xs block",
                      message.isPersonalized
                        ? "text-green-600 dark:text-green-400 font-medium"
                        : "text-muted-foreground italic"
                    )}>
                      {message.isPersonalized 
                        ? "✓ Respuesta personalizada basada en tus datos"
                        : "ⓘ Respuesta genérica"}
                    </span>
                  )}
                </div>
                
                {message.role === "user" && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className="bg-secondary">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input y botón de envío */}
        <div className="p-3 border-t">
          <div className="flex items-center space-x-2">
            <Input
              ref={inputRef}
              placeholder="Escribe tu consulta financiera..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="mt-2 text-center">
            <button
              onClick={navigateToFullAdvisor}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Ver asesor financiero completo
            </button>
          </div>
        </div>
      </div>
    </>
  )
} 