import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"
import { redirect } from "next/navigation"
import { FeedbackHistory } from "@/components/feedback/FeedbackHistory"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, ArrowLeft } from "lucide-react"

export default async function FeedbackHistorialPage() {
  const session = await getServerSession(options)
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header con navegación */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/beta-feedback">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al Feedback
            </Button>
          </Link>
          
          <div>
            <h1 className="text-2xl font-bold">Mi Historial de Feedback</h1>
            <p className="text-sm text-muted-foreground">
              Revisa el estado de tus reportes y respuestas del equipo
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href="/beta-feedback">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Feedback
            </Button>
          </Link>
        </div>
      </div>

      {/* Componente principal */}
      <FeedbackHistory />
    </div>
  )
} 