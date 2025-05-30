"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Bot, User, Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar } from "@/components/ui/avatar"
import { AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useCurrency } from "@/contexts/CurrencyContext"
import { cn } from "@/lib/utils"

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

interface FinancialAdvisorProps {
  className?: string;
  containerClassName?: string;
  showHeader?: boolean;
  maxHeight?: string;
  inversionId?: string; // ID de la inversión para contextualizar
}

export function FinancialAdvisor({
  className,
  containerClassName,
  showHeader = true,
  maxHeight = "400px",
  inversionId
}: FinancialAdvisorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: inversionId 
        ? "¡Hola! Veo que estás consultando sobre una de tus inversiones. ¿En qué puedo ayudarte? Puedo analizar su rendimiento, compararlo con otras alternativas, o sugerirte estrategias para optimizar tu cartera."
        : "¡Hola! Soy tu asesor financiero virtual. ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre estrategias de ahorro, gestión de deudas, consejos para invertir, o cualquier otra consulta financiera.",
      isPersonalized: false // El mensaje inicial siempre es genérico
    }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Usar try-catch para evitar errores durante el renderizado si el contexto no está disponible
  let formatMoney;
  try {
    const { formatMoney: formatMoneyFunc } = useCurrency();
    formatMoney = formatMoneyFunc;
  } catch (e) {
    formatMoney = (val: number) => `$${val.toFixed(2)}`;
  }

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
      // Llamada a la API con el contexto de inversión si está disponible
      const response = await fetch("/api/financial-advisor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          inversionId: inversionId || null, // Incluir el ID de inversión si existe
          context: inversionId ? "inversion" : "general"
        })
      })

      if (!response.ok) {
        throw new Error("Error al comunicarse con el asesor financiero")
      }

      const data = await response.json()

      // Determinar si la respuesta es personalizada
      let isPersonalized = false;
      let openaiConfigured = true;
      
      // Si la API proporciona información de depuración, la usamos
      if (data.debug) {
        isPersonalized = data.debug.isPersonalized;
        openaiConfigured = data.debug.openaiConfigured;
      }

      // Agregar la respuesta del asistente a los mensajes
      let responseContent = data.response;
      
      // Si OpenAI no está configurado, agregar una nota informativa
      if (!openaiConfigured) {
        responseContent += "\n\n---\n\n*Nota: El asistente IA avanzado no está configurado. Las respuestas se basan en análisis predefinidos de tus datos financieros. Para obtener respuestas más inteligentes y personalizadas, contacta al administrador para configurar la integración con OpenAI.*";
      }

      setMessages(prev => [...prev, {
        role: "assistant",
        content: responseContent,
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

  // Auto-scroll cuando se agregan nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <Card className={cn("w-full h-full flex flex-col border-0", className)}>
      {showHeader && (
        <CardHeader className="py-3">
          <CardTitle className="flex items-center text-lg">
            <Bot className="mr-2 h-5 w-5 text-primary" />
            Asesor Financiero Virtual
          </CardTitle>
          <CardDescription>
            Consulta sobre finanzas personales, inversiones y consejos de ahorro
          </CardDescription>
        </CardHeader>
      )}
      
      <CardContent className={cn("flex-grow overflow-hidden pb-0", containerClassName)}>
        <ScrollArea className="pr-4" style={{ height: maxHeight }}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
              >
                <div className="flex items-start max-w-[80%] space-x-2">
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">AF</AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={cn(
                      "p-3 rounded-lg",
                      message.role === "assistant"
                        ? message.isPersonalized 
                          ? "bg-green-50 dark:bg-green-900/20 text-foreground border border-green-200 dark:border-green-800"
                          : "bg-secondary text-secondary-foreground"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <div className="text-sm">
                        {renderMarkdown(message.content)}
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-muted">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="pt-3">
        <div className="flex w-full items-center space-x-2">
          <Input
            placeholder="Escribe tu consulta financiera..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-grow"
          />
          <Button 
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            size="icon"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
} 