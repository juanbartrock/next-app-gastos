"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Save, User, Mail, LogOut, Phone } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    
    if (session?.user) {
      setFormData({
        name: session.user.name || "",
        email: session.user.email || "",
        phoneNumber: session.user.phoneNumber || ""
      });
    }
  }, [session, status, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phoneNumber: formData.phoneNumber
        }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el perfil');
      }

      const updatedUser = await response.json();
      
      await update({
        ...session,
        user: {
          ...session?.user,
          name: formData.name,
          phoneNumber: formData.phoneNumber
        }
      });
      
      toast({
        title: "Perfil actualizado",
        description: "Tus datos han sido actualizados correctamente",
        duration: 3000
      });
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  // Mostrar una pantalla de carga mientras se verifica la sesión
  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  // Si no está autenticado, no mostrar nada (la redirección se maneja en el efecto)
  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              Volver al inicio
            </Button>
          </Link>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Mi perfil</CardTitle>
            <CardDescription>
              Administra tu información personal y configuraciones de cuenta
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      Nombre completo
                    </div>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Tu nombre"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      Correo electrónico
                    </div>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="tu@email.com"
                    disabled
                  />
                  <p className="text-xs text-gray-500">
                    El correo electrónico no se puede modificar.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      Teléfono
                    </div>
                  </Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    pattern="^\+[0-9]{10,15}$"
                    title="Ingresa el número con código de país (ej: +54911234567)"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="+54911234567"
                  />
                  <p className="text-xs text-gray-500">
                    Incluye el código de país (ej: +54 para Argentina)
                  </p>
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Guardando..." : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar cambios
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col">
            <div className="w-full pt-4 border-t">
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={async () => {
                  await signOut({ 
                    callbackUrl: '/login',
                    redirect: true
                  });
                  router.push('/login');
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 