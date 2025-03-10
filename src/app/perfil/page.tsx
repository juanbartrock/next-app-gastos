"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Save, User, Mail, LogOut, Phone, Package, Crown } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Tipo para el plan del usuario
type Plan = {
  id: string;
  nombre: string;
  descripcion: string | null;
  esPago: boolean;
  precioMensual: number | null;
};

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: ""
  });
  
  const [planUsuario, setPlanUsuario] = useState<Plan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
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
      
      // Cargar el plan del usuario
      fetchUserPlan();
    }
  }, [session, status, router]);
  
  const fetchUserPlan = async () => {
    try {
      setLoadingPlan(true);
      const response = await fetch('/api/user/plan');
      
      if (!response.ok) {
        throw new Error('Error al obtener el plan');
      }
      
      const data = await response.json();
      setPlanUsuario(data.plan);
    } catch (error) {
      console.error("Error al cargar el plan:", error);
      setPlanUsuario(null);
    } finally {
      setLoadingPlan(false);
    }
  };

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
        
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="personal">Datos Personales</TabsTrigger>
            <TabsTrigger value="plan">Mi Plan</TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal">
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
            </Card>
          </TabsContent>
          
          <TabsContent value="plan">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Mi Plan</CardTitle>
                <CardDescription>
                  Información sobre tu plan actual y opciones disponibles
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {loadingPlan ? (
                  <div className="py-8 text-center">Cargando información del plan...</div>
                ) : planUsuario ? (
                  <div className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                      <div className="flex items-center gap-3 mb-2">
                        {planUsuario.esPago ? (
                          <Crown className="h-6 w-6 text-amber-500" />
                        ) : (
                          <Package className="h-6 w-6 text-blue-500" />
                        )}
                        <h3 className="text-lg font-semibold">
                          Plan {planUsuario.nombre}
                          {planUsuario.esPago && <span className="ml-2 text-sm bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full">Premium</span>}
                        </h3>
                      </div>
                      
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {planUsuario.descripcion || 'Sin descripción disponible'}
                      </p>
                      
                      {planUsuario.esPago && planUsuario.precioMensual ? (
                        <div className="text-lg font-semibold">
                          ${planUsuario.precioMensual.toFixed(2)} <span className="text-sm font-normal text-gray-600">/mes</span>
                        </div>
                      ) : (
                        <div className="text-lg font-semibold text-green-600">Gratis</div>
                      )}
                    </div>
                    
                    {!planUsuario.esPago && (
                      <div className="text-center space-y-4">
                        <h3 className="text-lg font-medium">¿Quieres desbloquear todas las funcionalidades?</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Actualiza a nuestro plan Premium para acceder a todas las herramientas sin limitaciones.
                        </p>
                        <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                          <Crown className="mr-2 h-4 w-4" />
                          Actualizar a Premium
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-red-500 mb-4">No se pudo cargar la información del plan</p>
                    <Button variant="outline" onClick={fetchUserPlan}>Reintentar</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          <Card>
            <CardFooter className="flex flex-col py-4">
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
    </div>
  );
} 