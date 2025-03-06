"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function PerfilPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redireccionar si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Cargar datos del usuario al iniciar
  useEffect(() => {
    if (session?.user?.id) {
      fetchUserData();
    }
  }, [session]);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/user/profile");
      const data = await response.json();
      
      if (data.phoneNumber) {
        setPhoneNumber(data.phoneNumber);
      }
    } catch (error) {
      console.error("Error al cargar datos del usuario:", error);
      toast.error("Error al cargar los datos del perfil");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber,
        }),
      });

      if (response.ok) {
        toast.success("Número de teléfono actualizado correctamente");
      } else {
        const data = await response.json();
        toast.error(data.error || "Error al actualizar el perfil");
      }
    } catch (error) {
      console.error("Error al actualizar el perfil:", error);
      toast.error("Error al actualizar el perfil");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return <div className="container p-8">Cargando...</div>;
  }

  return (
    <div className="container p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">Perfil de Usuario</h1>
      
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
          <CardDescription>
            Actualiza tus datos de contacto y preferencias
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input 
                id="name" 
                value={session?.user?.name || ""} 
                disabled 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                value={session?.user?.email || ""} 
                disabled 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Número de WhatsApp</Label>
              <p className="text-sm text-gray-500">
                Introduce tu número completo con código de país 
                (ej: +34612345678, +541112345678)
              </p>
              <Input 
                id="phoneNumber" 
                value={phoneNumber} 
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+XXXXXXXXXXX" 
              />
            </div>

            <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 text-sm">
              <p className="font-semibold text-yellow-800">Instrucciones para WhatsApp:</p>
              <ol className="list-decimal ml-5 mt-2 text-yellow-700 space-y-1">
                <li>Guarda este número en tus contactos: {process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || "+12183049400"}</li>
                <li>Envía "join" al número para activar la conexión con WhatsApp</li>
                <li>Después podrás enviar mensajes de voz o texto describiendo tus gastos</li>
              </ol>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 