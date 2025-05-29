import { Metadata } from 'next'
import { PatronesAnalisis } from '@/components/ai/PatronesAnalisis'
import { RecomendacionesIA } from '@/components/ai/RecomendacionesIA'
import { Brain, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI Financiero | Análisis Inteligente',
  description: 'Análisis financiero avanzado con inteligencia artificial',
}

export default function AIFinancieroPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
            <Brain className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              AI Financiero
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Análisis inteligente y recomendaciones personalizadas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <span className="text-sm text-purple-700 dark:text-purple-300">
            <strong>FASE 3 - Inteligencia Artificial:</strong> Powered by OpenAI
          </span>
        </div>
      </div>

      <div className="grid gap-8">
        <PatronesAnalisis />
        <RecomendacionesIA />
      </div>
    </div>
  )
} 