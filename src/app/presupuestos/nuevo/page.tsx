"use client"

import { useRouter } from "next/navigation"
import PresupuestoForm from '@/components/PresupuestoForm'
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function NuevoPresupuestoPage() {
  const router = useRouter()

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 py-6 md:px-6 bg-background border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push('/presupuestos')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Crear Nuevo Presupuesto</h1>
          </div>
        </div>
      </header>
      
      <main className="flex-1 p-4">
        <PresupuestoForm />
      </main>
    </div>
  )
} 