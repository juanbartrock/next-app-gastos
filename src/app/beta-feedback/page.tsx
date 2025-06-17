import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"
import { redirect } from "next/navigation"
import { FeedbackForm } from "@/components/feedback/FeedbackForm"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { History, ArrowLeft } from "lucide-react"

export default async function BetaFeedbackPage() {
  const session = await getServerSession(options)
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header con navegación */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al Dashboard
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href="/beta-feedback/historial">
            <Button variant="outline" className="gap-2">
              <History className="h-4 w-4" />
              Ver Historial
            </Button>
          </Link>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="space-y-8">
        {/* Header informativo */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">
            🚀 FinanzIA Beta Feedback
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tu opinión es fundamental para mejorar FinanzIA. Comparte tus experiencias, 
            reporta problemas o sugiere nuevas funcionalidades.
          </p>
        </div>

        {/* Formulario principal */}
        <FeedbackForm />

        {/* Footer informativo */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
            ¿Qué tipo de feedback nos ayuda más?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-700 dark:text-blue-300">
            <div>
              <strong>🐛 Bugs:</strong> Errores específicos con pasos para reproducir
            </div>
            <div>
              <strong>💡 Mejoras:</strong> Ideas para optimizar funcionalidades existentes
            </div>
            <div>
              <strong>✨ Sugerencias:</strong> Nuevas características que te gustaría ver
            </div>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-4">
            Todos los reportes son revisados por nuestro equipo. Recibirás notificaciones sobre el progreso.
          </p>
        </div>
      </div>
    </div>
  )
} 