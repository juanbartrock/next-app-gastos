import { Metadata } from 'next'
import { AlertEngineControl } from '@/components/alertas/AlertEngineControl'

export const metadata: Metadata = {
  title: 'Motor de Alertas | Admin',
  description: 'Control del motor de alertas automático',
}

export default function AlertasAdminPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Motor de Alertas Automático</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestión y control del sistema de alertas inteligentes
        </p>
      </div>
      
      <AlertEngineControl />
    </div>
  )
} 