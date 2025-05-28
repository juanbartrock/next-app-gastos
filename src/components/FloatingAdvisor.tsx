"use client"

import { useState, useRef, useEffect } from "react"
import { Bot, X, Send, Loader2, User, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar } from "@/components/ui/avatar"
import { AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

// Función super simple para renderizar markdown básico - GARANTIZADO QUE FUNCIONA
function renderMarkdown(text: string): JSX.Element {
  const parts = text.split('\n');
  
  return (
    <div className="space-y-2">
      {parts.map((line, index) => {
        const trimmedLine = line.trim();
        
        // Headers
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
        if (trimmedLine.startsWith('# ')) {
          return (
            <h1 key={index} className="text-xl font-bold mb-2 mt-2 text-current">
              {trimmedLine.replace('# ', '')}
            </h1>
          );
        }
        
        // Lista con viñetas
        if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
          return (
            <div key={index} className="flex items-start ml-3 mb-1">
              <span className="text-current mr-2 mt-0.5">•</span>
              <span className="text-current">{processSimpleBold(trimmedLine.slice(2))}</span>
            </div>
          );
        }
        
        // Lista numerada
        if (trimmedLine.match(/^\d+\. /)) {
          const number = trimmedLine.match(/^(\d+)\./)?.[1] || '1';
          const content = trimmedLine.replace(/^\d+\. /, '');
          return (
            <div key={index} className="flex items-start ml-3 mb-1">
              <span className="text-current mr-2 font-medium">{number}.</span>
              <span className="text-current">{processSimpleBold(content)}</span>
            </div>
          );
        }
        
        // Línea vacía
        if (!trimmedLine) {
          return <div key={index} className="h-1"></div>;
        }
        
        // Párrafo normal
        return (
          <p key={index} className="mb-1 text-current leading-relaxed">
            {processSimpleBold(trimmedLine)}
          </p>
        );
      })}
    </div>
  );
}

// Función súper simple para procesar negrita
function processSimpleBold(text: string): JSX.Element {
  // Dividir el texto por patrones de negrita **texto**
  const regex = /(\*\*[^*]+\*\*)/g;
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          // Es texto en negrita
          const boldText = part.slice(2, -2);
          return (
            <strong key={i} className="font-bold text-current">
              {boldText}
            </strong>
          );
        } else {
          // Es texto normal
          return (
            <span key={i} className="text-current">
              {part}
            </span>
          );
        }
      })}
    </>
  );
}

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
      content: "¡Hola! Soy tu asesor financiero virtual. ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre ahorro, inversión, o cualquier consulta financiera.",
      isPersonalized: false
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
          messages: [...messages, userMessage],
          context: "dashboard"
        })
      })

      if (!response.ok) {
        throw new Error("Error al comunicarse con el asesor financiero")
      }

      const data = await response.json()
      
      // Determinar si la respuesta es personalizada usando la información de depuración
      let isPersonalized = false;
      
      // Si la API proporciona información de depuración, la usamos
      if (data.debug) {
        isPersonalized = data.debug.isPersonalized;
        console.log("Información de depuración:", data.debug);
      } else {
        // Fallback: Determinamos por patrones en el texto
        const responseText = data.response;
        const hasSpecificNumbers = /\d{2,}\.00|\d{3,}/.test(responseText);
        const hasPersonalPhrases = /(tus finanzas|tu situación|tus gastos|tus ingresos|tus datos|tu balance)/i.test(responseText);
        isPersonalized = hasSpecificNumbers || hasPersonalPhrases;
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
                  {message.role === "assistant" ? (
                    renderMarkdown(message.content)
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                  
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