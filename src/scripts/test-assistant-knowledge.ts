// Script para testear el conocimiento del asistente virtual de FinanzIA
// Ejecutar con: npx tsx src/scripts/test-assistant-knowledge.ts

import { NextRequest } from 'next/server'

interface TestQuestion {
  id: string
  category: string
  question: string
  expectedKeywords: string[]
  priority: 'high' | 'medium' | 'low'
  complexity: 'basic' | 'intermediate' | 'advanced'
}

interface TestResult {
  questionId: string
  category: string
  question: string
  response: string
  confidence: number
  responseTime: number
  containsExpectedKeywords: boolean
  missingKeywords: string[]
  satisfactory: boolean
  notes: string
}

// Batería de preguntas estructuradas
const TEST_QUESTIONS: TestQuestion[] = [
  // FUNCIONALIDADES BÁSICAS
  {
    id: 'basic-001',
    category: 'dashboard',
    question: '¿Cómo funciona el dashboard principal de FinanzIA?',
    expectedKeywords: ['balance', 'transacciones', 'gráficos', 'visibilidad', 'modo familiar'],
    priority: 'high',
    complexity: 'basic'
  },
  {
    id: 'basic-002',
    category: 'transacciones',
    question: '¿Cómo creo una nueva transacción?',
    expectedKeywords: ['nuevo', 'formulario', 'categoría', 'monto', 'fecha'],
    priority: 'high',
    complexity: 'basic'
  },
  {
    id: 'basic-003',
    category: 'gastos-recurrentes',
    question: '¿Qué son los gastos recurrentes y cómo funcionan?',
    expectedKeywords: ['mensual', 'automático', 'estados', 'asociación', 'pendiente', 'pagado'],
    priority: 'high',
    complexity: 'basic'
  },

  // FUNCIONALIDADES AVANZADAS - CRÍTICAS
  {
    id: 'advanced-001',
    category: 'alertas',
    question: '¿Cómo funciona el sistema de alertas automáticas?',
    expectedKeywords: ['motor', 'AlertEngine', 'evaluación', '60 minutos', 'presupuestos', 'prioridad'],
    priority: 'high',
    complexity: 'advanced'
  },
  {
    id: 'advanced-002',
    category: 'ia',
    question: '¿Qué funcionalidades de inteligencia artificial tiene FinanzIA?',
    expectedKeywords: ['OpenAI', 'patrones', 'recomendaciones', 'anomalías', 'predictivas', 'reportes'],
    priority: 'high',
    complexity: 'advanced'
  },
  {
    id: 'advanced-003',
    category: 'mercadopago',
    question: '¿Cómo funciona el sistema de pagos con MercadoPago?',
    expectedKeywords: ['suscripciones', 'webhook', 'estados', 'argentina', 'tarjeta', 'efectivo'],
    priority: 'high',
    complexity: 'advanced'
  },
  {
    id: 'advanced-004',
    category: 'modo-familiar',
    question: '¿Cómo funciona el modo familiar con permisos?',
    expectedKeywords: ['toggle', 'administrador', 'permisos', 'familiar', 'personal', 'roles'],
    priority: 'high',
    complexity: 'advanced'
  },
  {
    id: 'advanced-005',
    category: 'ocr',
    question: '¿Cómo funciona el buzón de comprobantes con OCR?',
    expectedKeywords: ['comprobantes', 'OCR', 'automático', 'foto', 'PDF', 'extracción'],
    priority: 'high',
    complexity: 'advanced'
  },

  // CASOS DE USO COMPLEJOS
  {
    id: 'complex-001',
    category: 'integration',
    question: '¿Cómo configuro alertas predictivas para no exceder mi presupuesto?',
    expectedKeywords: ['predictivas', 'presupuesto', 'IA', 'tendencias', 'configuración'],
    priority: 'medium',
    complexity: 'advanced'
  },
  {
    id: 'complex-002',
    category: 'integration',
    question: '¿Cómo el sistema detecta gastos anómalos automáticamente?',
    expectedKeywords: ['anomalías', 'automático', 'detección', 'estadísticas', 'patrones'],
    priority: 'medium',
    complexity: 'advanced'
  },
  {
    id: 'complex-003',
    category: 'scraping',
    question: '¿Qué promociones puede encontrar automáticamente el sistema?',
    expectedKeywords: ['scraping', 'promociones', 'servicios', 'argentina', 'descuentos'],
    priority: 'medium',
    complexity: 'intermediate'
  },

  // FUNCIONALIDADES TÉCNICAS
  {
    id: 'technical-001',
    category: 'api',
    question: '¿Cuáles son los principales endpoints de la API de IA?',
    expectedKeywords: ['/api/ai/', 'patrones', 'recomendaciones', 'anomalias', 'predictivas', 'reportes'],
    priority: 'low',
    complexity: 'advanced'
  },
  {
    id: 'technical-002',
    category: 'api',
    question: '¿Cómo funciona el webhook de MercadoPago?',
    expectedKeywords: ['webhook', '/api/mercadopago/webhook', 'estados', 'actualización', 'automático'],
    priority: 'medium',
    complexity: 'advanced'
  },

  // PLANES Y COMERCIAL
  {
    id: 'commercial-001',
    category: 'planes',
    question: '¿Qué diferencias hay entre los planes Free, Premium y Enterprise?',
    expectedKeywords: ['Free', 'Premium', 'Enterprise', 'límites', 'IA', 'familiar'],
    priority: 'high',
    complexity: 'intermediate'
  },

  // TAREAS Y ORGANIZACIÓN
  {
    id: 'tasks-001',
    category: 'tareas',
    question: '¿Cómo funciona el sistema de tareas financieras?',
    expectedKeywords: ['tareas', 'financieras', 'vencimientos', 'alertas', 'recordatorios'],
    priority: 'medium',
    complexity: 'intermediate'
  }
]

// Función para testear una pregunta individual
async function testSingleQuestion(question: TestQuestion): Promise<TestResult> {
  const startTime = Date.now()
  
  try {
    const response = await fetch('http://localhost:3000/api/ai/virtual-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test_token' // En un test real, usar token válido
      },
      body: JSON.stringify({
        question: question.question,
        context: [],
        tourActive: false,
        currentStep: 0
      })
    })

    const responseTime = Date.now() - startTime
    const data = await response.json()
    
    if (!response.ok) {
      return {
        questionId: question.id,
        category: question.category,
        question: question.question,
        response: `ERROR: ${data.error || 'Unknown error'}`,
        confidence: 0,
        responseTime,
        containsExpectedKeywords: false,
        missingKeywords: question.expectedKeywords,
        satisfactory: false,
        notes: 'API Error'
      }
    }

    // Analizar la respuesta
    const responseText = data.response.toLowerCase()
    const foundKeywords = question.expectedKeywords.filter(keyword => 
      responseText.includes(keyword.toLowerCase())
    )
    const missingKeywords = question.expectedKeywords.filter(keyword => 
      !responseText.includes(keyword.toLowerCase())
    )
    
    const keywordCoverage = foundKeywords.length / question.expectedKeywords.length
    const satisfactory = keywordCoverage >= 0.6 && data.confidence > 0.7

    return {
      questionId: question.id,
      category: question.category,
      question: question.question,
      response: data.response,
      confidence: data.confidence,
      responseTime,
      containsExpectedKeywords: keywordCoverage >= 0.6,
      missingKeywords,
      satisfactory,
      notes: `Keyword coverage: ${(keywordCoverage * 100).toFixed(1)}%`
    }

  } catch (error) {
    return {
      questionId: question.id,
      category: question.category,
      question: question.question,
      response: `NETWORK ERROR: ${error}`,
      confidence: 0,
      responseTime: Date.now() - startTime,
      containsExpectedKeywords: false,
      missingKeywords: question.expectedKeywords,
      satisfactory: false,
      notes: 'Network/Connection Error'
    }
  }
}

// Función principal de testing
async function runKnowledgeTest() {
  console.log('🧠 Iniciando test de conocimiento del asistente virtual...\n')
  
  const results: TestResult[] = []
  const categories = new Set(TEST_QUESTIONS.map(q => q.category))
  
  // Ejecutar tests
  for (const question of TEST_QUESTIONS) {
    console.log(`Testing: ${question.id} - ${question.question.substring(0, 60)}...`)
    const result = await testSingleQuestion(question)
    results.push(result)
    
    // Delay para no sobrecargar la API
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // Análisis de resultados
  console.log('\n📊 ANÁLISIS DE RESULTADOS:\n')
  
  // Estadísticas generales
  const totalQuestions = results.length
  const satisfactoryResponses = results.filter(r => r.satisfactory).length
  const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / totalQuestions
  const averageResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / totalQuestions
  
  console.log(`Total de preguntas: ${totalQuestions}`)
  console.log(`Respuestas satisfactorias: ${satisfactoryResponses} (${(satisfactoryResponses/totalQuestions*100).toFixed(1)}%)`)
  console.log(`Confidence promedio: ${averageConfidence.toFixed(2)}`)
  console.log(`Tiempo de respuesta promedio: ${averageResponseTime.toFixed(0)}ms`)
  
  // Análisis por categoría
  console.log('\n📋 ANÁLISIS POR CATEGORÍA:\n')
  for (const category of categories) {
    const categoryResults = results.filter(r => r.category === category)
    const categoryScore = categoryResults.filter(r => r.satisfactory).length / categoryResults.length
    
    console.log(`${category.toUpperCase()}:`)
    console.log(`  Score: ${(categoryScore * 100).toFixed(1)}% (${categoryResults.filter(r => r.satisfactory).length}/${categoryResults.length})`)
    
    const gaps = categoryResults.filter(r => !r.satisfactory)
    if (gaps.length > 0) {
      console.log(`  Gaps críticos:`)
      gaps.forEach(gap => {
        console.log(`    - ${gap.questionId}: ${gap.question}`)
        console.log(`      Missing: ${gap.missingKeywords.join(', ')}`)
      })
    }
    console.log('')
  }

  // Identificar gaps más críticos
  console.log('🚨 TOP 5 GAPS MÁS CRÍTICOS:\n')
  const criticalGaps = results
    .filter(r => !r.satisfactory && TEST_QUESTIONS.find(q => q.id === r.questionId)?.priority === 'high')
    .sort((a, b) => a.confidence - b.confidence)
    .slice(0, 5)
    
  criticalGaps.forEach((gap, index) => {
    console.log(`${index + 1}. ${gap.questionId} (Confidence: ${gap.confidence.toFixed(2)})`)
    console.log(`   Pregunta: ${gap.question}`)
    console.log(`   Falta: ${gap.missingKeywords.join(', ')}`)
    console.log('')
  })

  // Recomendaciones
  console.log('💡 RECOMENDACIONES:\n')
  if (satisfactoryResponses / totalQuestions < 0.8) {
    console.log('❌ El asistente necesita expansión significativa de conocimiento')
    console.log('   - Priorizar funcionalidades avanzadas marcadas como gaps críticos')
    console.log('   - Agregar más detalles técnicos y ejemplos específicos')
  } else if (satisfactoryResponses / totalQuestions < 0.9) {
    console.log('⚠️  El asistente tiene buen conocimiento base pero necesita mejoras')
    console.log('   - Enfocarse en los gaps específicos identificados')
    console.log('   - Mejorar casos de uso complejos')
  } else {
    console.log('✅ El asistente tiene excelente conocimiento')
    console.log('   - Continuar con mantenimiento regular')
    console.log('   - Agregar funcionalidades nuevas cuando se implementen')
  }

  // Generar reporte JSON
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalQuestions,
      satisfactoryResponses,
      satisfactionRate: satisfactoryResponses / totalQuestions,
      averageConfidence,
      averageResponseTime
    },
    categoryBreakdown: Object.fromEntries(
      Array.from(categories).map(category => {
        const categoryResults = results.filter(r => r.category === category)
        return [category, {
          total: categoryResults.length,
          satisfactory: categoryResults.filter(r => r.satisfactory).length,
          score: categoryResults.filter(r => r.satisfactory).length / categoryResults.length
        }]
      })
    ),
    criticalGaps: criticalGaps.map(gap => ({
      id: gap.questionId,
      category: gap.category,
      question: gap.question,
      confidence: gap.confidence,
      missingKeywords: gap.missingKeywords
    })),
    detailedResults: results
  }

  // Guardar reporte
  const fs = require('fs')
  const reportPath = `knowledge-test-report-${Date.now()}.json`
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\n📄 Reporte detallado guardado en: ${reportPath}`)
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runKnowledgeTest().catch(console.error)
}

export { runKnowledgeTest, TEST_QUESTIONS, type TestResult } 