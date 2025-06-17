"use client"

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  MessageCircle, 
  Send, 
  X, 
  Bot, 
  User, 
  Lightbulb, 
  ChevronDown,
  ChevronUp,
  Sparkles,
  HelpCircle,
  Brain,
  Zap,
  Search
} from 'lucide-react'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { searchKnowledge, getKnowledgeByCategory, KNOWLEDGE_CATEGORIES, type KnowledgeItem } from '@/lib/onboarding/knowledge-base'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  relatedKnowledge?: KnowledgeItem[]
  suggestions?: string[]
}

interface VirtualAssistantProps {
  isVisible: boolean
  onClose: () => void
  initialContext?: string // Para contexto específico
}

export function VirtualAssistant({ isVisible, onClose, initialContext }: VirtualAssistantProps) {
  const { tourActive, currentStep } = useOnboarding()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [expandedKnowledge, setExpandedKnowledge] = useState<string | null>(null)
  const [suggestedQuestions] = useState([
    '¿Cómo creo mi primera transacción?',
    '¿Qué son los gastos recurrentes?',
    '¿Cómo funcionan las alertas automáticas?',
    '¿Qué hace la inteligencia artificial?',
    '¿Cómo uso el modo familiar?',
    '¿Cómo exporto mis datos?'
  ])
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Mensaje de bienvenida
  useEffect(() => {
    if (isVisible && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'system',
        content: initialContext || '¡Hola! 👋 Soy el asistente virtual de FinanzIA. Puedo ayudarte a entender cualquier funcionalidad de la aplicación. ¿En qué puedo ayudarte hoy?',
        timestamp: new Date(),
        suggestions: suggestedQuestions.slice(0, 3)
      }
      setMessages([welcomeMessage])
    }
  }, [isVisible, initialContext, messages.length, suggestedQuestions])

  // Auto-scroll al final
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages])

  // Focus en input cuando se abre
  useEffect(() => {
    if (isVisible && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isVisible])

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputValue.trim()
    if (!text || isLoading) return

    setInputValue('')
    setIsLoading(true)

    // Agregar mensaje del usuario
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: text,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    // Buscar en la base de conocimiento
    const knowledgeResults = searchKnowledge(text)
    
    try {
      // Generar respuesta usando RAG + IA
      const response = await fetch('/api/ai/virtual-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          context: knowledgeResults,
          tourActive,
          currentStep
        })
      })

      const data = await response.json()

      if (response.ok) {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          content: data.response,
          timestamp: new Date(),
          relatedKnowledge: knowledgeResults.slice(0, 3),
          suggestions: data.suggestions || []
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(data.error || 'Error al procesar la pregunta')
      }
    } catch (error) {
      // Fallback sin IA - solo usar la base de conocimiento
      const fallbackResponse = generateFallbackResponse(text, knowledgeResults)
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: fallbackResponse.content,
        timestamp: new Date(),
        relatedKnowledge: knowledgeResults.slice(0, 2),
        suggestions: fallbackResponse.suggestions
      }
      setMessages(prev => [...prev, assistantMessage])
    }

    setIsLoading(false)
  }

  const generateFallbackResponse = (question: string, knowledge: KnowledgeItem[]) => {
    if (knowledge.length === 0) {
      return {
        content: `No encontré información específica sobre "${question}". Sin embargo, puedo ayudarte con temas como transacciones, presupuestos, alertas, gastos recurrentes, inteligencia artificial y más. ¿Sobre qué te gustaría saber?`,
        suggestions: suggestedQuestions.slice(0, 3)
      }
    }

    const mainItem = knowledge[0]
    const content = `📋 **${mainItem.title}**\n\n${mainItem.description}\n\n${mainItem.details.split('\n')[0]}...\n\n¿Te gustaría saber más detalles sobre esto?`
    
    const suggestions = mainItem.examples?.slice(0, 2).map(ex => `¿${ex}?`) || []
    
    return { content, suggestions }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleKnowledgeExpansion = (knowledgeId: string) => {
    setExpandedKnowledge(prev => prev === knowledgeId ? null : knowledgeId)
  }

  const getContextualHelp = () => {
    if (!tourActive) return null
    
    const stepHelp = {
      0: '¿Necesitas ayuda con el tour de bienvenida?',
      1: '¿Tienes preguntas sobre la navegación?',
      2: '¿Quieres saber más sobre las transacciones?',
      3: '¿Te interesa conocer los gastos recurrentes?',
      4: '¿Necesitas ayuda con los presupuestos?'
    }
    
    return stepHelp[currentStep as keyof typeof stepHelp]
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300, y: 20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, x: 300, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)]"
      >
                  <Card className="shadow-2xl border-blue-200 dark:border-blue-800 h-full flex flex-col">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-full">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Asistente FinanzIA</CardTitle>
                  <p className="text-xs opacity-90">Powered by IA + RAG</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {getContextualHelp() && (
              <div className="mt-2 p-2 bg-white/10 rounded text-xs">
                <div className="flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />
                  <span>{getContextualHelp()}</span>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            {/* Área de mensajes */}
            <ScrollArea ref={scrollAreaRef} className="h-80 p-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div key={message.id}>
                    <div className={`flex items-start gap-2 ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}>
                      {message.type !== 'user' && (
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-full mt-1 flex-shrink-0">
                          <Bot className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                      
                      <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white rounded-br-sm'
                          : message.type === 'system'
                          ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                          : 'bg-gray-100 dark:bg-gray-800 rounded-bl-sm'
                      }`}>
                        <div className="whitespace-pre-wrap break-words overflow-wrap-anywhere">
                          {message.content}
                        </div>
                        
                        {/* Sugerencias rápidas */}
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="mt-3 space-y-1">
                            <p className="text-xs opacity-70 font-medium">Preguntas sugeridas:</p>
                            {message.suggestions.map((suggestion, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                className="w-full text-left justify-start text-xs h-auto py-1 px-2"
                                onClick={() => handleSendMessage(suggestion)}
                              >
                                <HelpCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {message.type === 'user' && (
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-full mt-1 flex-shrink-0">
                          <User className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                    </div>

                    {/* Conocimiento relacionado */}
                    {message.relatedKnowledge && message.relatedKnowledge.length > 0 && (
                      <div className="mt-3 ml-8 space-y-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Brain className="h-3 w-3" />
                          <span>Información relacionada:</span>
                        </div>
                        
                        {message.relatedKnowledge.map((item) => (
                          <div key={item.id} className="border rounded-lg overflow-hidden">
                            <Button
                              variant="ghost"
                              className="w-full p-3 h-auto justify-between text-left"
                              onClick={() => toggleKnowledgeExpansion(item.id)}
                            >
                              <div>
                                <div className="font-medium text-sm">{item.title}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {item.description}
                                </div>
                                <div className="flex gap-1 mt-2">
                                  {item.tags.slice(0, 3).map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              {expandedKnowledge === item.id ? (
                                <ChevronUp className="h-4 w-4 flex-shrink-0" />
                              ) : (
                                <ChevronDown className="h-4 w-4 flex-shrink-0" />
                              )}
                            </Button>
                            
                            {expandedKnowledge === item.id && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-3 pt-0 text-sm text-muted-foreground border-t">
                                  <div className="whitespace-pre-wrap">{item.details}</div>
                                  
                                  {item.examples && item.examples.length > 0 && (
                                    <div className="mt-3">
                                      <p className="font-medium text-xs mb-2">Ejemplos:</p>
                                      {item.examples.map((example, idx) => (
                                        <div key={idx} className="text-xs bg-blue-50 dark:bg-blue-950 p-2 rounded mb-1">
                                          💡 {example}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {index < messages.length - 1 && <Separator className="my-4" />}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex items-start gap-2">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-full mt-1">
                      <Bot className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg rounded-bl-sm">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                        <span>Pensando...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input de mensaje */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Pregunta sobre FinanzIA..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button 
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isLoading}
                  size="sm"
                  className="px-3"
                >
                  {isLoading ? (
                    <Zap className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>IA + Base de conocimiento</span>
                </div>
                <div className="flex items-center gap-1">
                  <Search className="h-3 w-3" />
                  <span>Enter para enviar</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
} 