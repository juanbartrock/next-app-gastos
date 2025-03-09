"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Camera, Mic, PencilLine } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExpenseForm } from "@/components/ExpenseForm"

export default function NuevoRegistroPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<string>("manual")

  const handleTransactionAdded = () => {
    // Podríamos hacer algo después de agregar una transacción
    // Por ejemplo, mostrar un mensaje de éxito
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 py-6 md:px-6 bg-background border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push('/?dashboard=true')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Registrar Movimiento</h1>
          </div>
        </div>
      </header>
      
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          <Tabs defaultValue="manual" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <PencilLine className="h-4 w-4" />
                <span>Ingreso Manual</span>
              </TabsTrigger>
              <TabsTrigger value="voz" className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                <span>Ingreso por Voz</span>
              </TabsTrigger>
              <TabsTrigger value="foto" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                <span>Foto de Ticket</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="manual" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Formulario de Registro</CardTitle>
                </CardHeader>
                <CardContent>
                  <ExpenseForm onTransactionAdded={handleTransactionAdded} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="voz" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Asistente de Voz</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <p className="text-center text-muted-foreground mb-6">
                    Utiliza el asistente de voz para registrar tus movimientos de forma rápida y sencilla.
                  </p>
                  <Button 
                    size="lg" 
                    onClick={() => router.push('/voz')}
                    className="gap-2"
                  >
                    <Mic className="h-5 w-5" />
                    Iniciar Asistente de Voz
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="foto" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Captura de Ticket</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <p className="text-center text-muted-foreground mb-6">
                    Toma una foto de tu ticket para registrar automáticamente los detalles de la compra.
                  </p>
                  <Button 
                    size="lg" 
                    onClick={() => router.push('/transacciones/foto')}
                    className="gap-2"
                  >
                    <Camera className="h-5 w-5" />
                    Escanear Ticket
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
} 