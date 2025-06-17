import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options'
import OpenAI from 'openai'
import { type KnowledgeItem } from '@/lib/onboarding/knowledge-base'

// Configuración de OpenAI
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { question, context, tourActive, currentStep } = await request.json()

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Pregunta requerida' }, { status: 400 })
    }

    // Si no hay OpenAI disponible, usar solo la base de conocimiento
    if (!openai) {
      return generateKnowledgeOnlyResponse(question, context, tourActive, currentStep)
    }

    try {
      // Crear el prompt con contexto RAG
      const systemPrompt = createSystemPrompt(context, tourActive, currentStep)
      const userPrompt = createUserPrompt(question, context)

      const completion = await Promise.race([
        openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: userPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 800,
          response_format: { type: "json_object" }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 25000)
        )
      ]) as OpenAI.Chat.Completions.ChatCompletion

      const rawResponse = completion.choices[0]?.message?.content
      if (!rawResponse) {
        throw new Error('No se recibió respuesta de OpenAI')
      }

      const parsedResponse = JSON.parse(rawResponse)
      
      return NextResponse.json({
        response: parsedResponse.response || 'No pude generar una respuesta adecuada.',
        suggestions: parsedResponse.suggestions || [],
        confidence: parsedResponse.confidence || 0.7,
        source: 'openai_rag'
      })

    } catch (aiError) {
      console.error('Error con OpenAI:', aiError)
      // Fallback a respuesta solo con base de conocimiento
      return generateKnowledgeOnlyResponse(question, context, tourActive, currentStep)
    }

  } catch (error) {
    console.error('Error en virtual assistant:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

function createSystemPrompt(context: KnowledgeItem[], tourActive: boolean, currentStep: number): string {
  const contextInfo = context.map(item => 
    `**${item.title}** (${item.category}): ${item.description}\n${item.details}`
  ).join('\n\n')

  const tourInfo = tourActive ? 
    `El usuario está actualmente en el tour de onboarding (paso ${currentStep + 1}). Proporciona ayuda contextual si es relevante.` : 
    'El usuario ya completó el onboarding o no está en un tour activo.'

  return `Eres el asistente virtual de FinanzIA, una aplicación argentina de gestión de gastos personales y familiares con inteligencia artificial.

CONTEXTO DE LA CONSULTA:
${contextInfo}

ESTADO DEL USUARIO:
${tourInfo}

INSTRUCCIONES:
1. Responde SIEMPRE en español argentino, con un tono amigable y profesional
2. Usa la información del contexto como base principal para tu respuesta
3. Complementa con tu conocimiento general sobre finanzas cuando sea apropiado
4. Si la pregunta no está relacionada con el contexto, explica qué puedes hacer en FinanzIA
5. Incluye ejemplos prácticos y específicos cuando sea posible
6. Sugiere 2-3 preguntas de seguimiento relevantes
7. Usa emojis moderadamente para hacer la respuesta más amigable
8. Si el usuario está en un tour, menciona brevemente cómo se relaciona con su paso actual

FORMATO DE RESPUESTA (JSON):
{
  "response": "Tu respuesta principal aquí",
  "suggestions": ["¿Pregunta sugerida 1?", "¿Pregunta sugerida 2?", "¿Pregunta sugerida 3?"],
  "confidence": 0.9
}

CARACTERÍSTICAS CLAVE DE FINANZAI:
- Gestión de transacciones con asociación a gastos recurrentes
- Sistema de alertas automáticas inteligentes
- Presupuestos con alertas al 80%, 90% y 100%
- Inteligencia artificial para análisis de patrones
- Modo familiar con toggle personal/familiar
- Exportación de datos y reportes automáticos
- Tema oscuro por defecto y ocultación de valores`
}

function createUserPrompt(question: string, context: KnowledgeItem[]): string {
  const relevantTags = context.flatMap(item => item.tags).slice(0, 8)
  
  return `PREGUNTA DEL USUARIO: "${question}"

INFORMACIÓN RELEVANTE ENCONTRADA:
${context.map(item => `- ${item.title}: ${item.description}`).join('\n')}

TAGS RELACIONADOS: ${relevantTags.join(', ')}

Por favor, responde usando principalmente la información del contexto proporcionado.`
}

function generateKnowledgeOnlyResponse(
  question: string, 
  context: KnowledgeItem[], 
  tourActive: boolean, 
  currentStep: number
) {
  // Respuesta de fallback usando solo la base de conocimiento
  if (!context || context.length === 0) {
    const suggestions = [
      '¿Cómo creo mi primera transacción?',
      '¿Qué son los gastos recurrentes?',
      '¿Cómo funcionan las alertas automáticas?'
    ]

    return NextResponse.json({
      response: `No encontré información específica sobre "${question}" en mi base de conocimiento. 

Sin embargo, puedo ayudarte con:
📊 Gestión de transacciones y gastos
🔄 Gastos recurrentes automáticos  
🔔 Sistema de alertas inteligentes
🤖 Funciones de inteligencia artificial
👨‍👩‍👧‍👦 Modo familiar colaborativo
📈 Presupuestos y análisis

¿Sobre cuál de estos temas te gustaría saber más?`,
      suggestions,
      confidence: 0.5,
      source: 'knowledge_base_only'
    })
  }

  const mainItem = context[0]
  const tourContext = tourActive ? 
    `\n\n💡 Como estás en el tour (paso ${currentStep + 1}), esto podría ser útil para tu aprendizaje actual.` : ''

  const response = `📋 **${mainItem.title}**

${mainItem.description}

${mainItem.details.split('\n').slice(0, 3).join('\n')}${tourContext}

${mainItem.examples ? `\n**Ejemplos:**\n${mainItem.examples.slice(0, 2).map(ex => `• ${ex}`).join('\n')}` : ''}

¿Te gustaría que profundice en algún aspecto específico?`

  const suggestions = [
    ...(mainItem.examples?.slice(0, 2).map(ex => `¿${ex}?`) || []),
    '¿Qué más puedo hacer en FinanzIA?'
  ].slice(0, 3)

  return NextResponse.json({
    response,
    suggestions,
    confidence: 0.8,
    source: 'knowledge_base_enhanced'
  })
} 