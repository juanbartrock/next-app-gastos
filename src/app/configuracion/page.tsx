"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Save, LightbulbIcon, Bell, Settings, Shield } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { CategoriasManager } from "@/components/admin/CategoriasManager";

export default function ConfiguracionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    notificacionesRecomendaciones: true,
    notificacionesRecurrentes: true,
    notificacionesGrupos: true,
    recomendacionesAutomaticas: false,
    recomendacionesSimilares: true
  });
  
  const [loading, setLoading] = useState(false);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    
    // Verificar si el usuario es admin
    const checkAdminStatus = async () => {
      try {
        setLoadingAdmin(true);
        const response = await fetch('/api/user/is-admin');
        
        if (response.ok) {
          const data = await response.json();
          setUserIsAdmin(data.isAdmin);
        } else {
          setUserIsAdmin(false);
        }
      } catch (error) {
        console.error('Error verificando admin:', error);
        setUserIsAdmin(false);
      } finally {
        setLoadingAdmin(false);
      }
    };

    if (session?.user?.id) {
      checkAdminStatus();
    }
    
    // Aquí se cargarían las preferencias del usuario desde la API
    // Por ahora usamos valores por defecto
  }, [status, router, session?.user?.id]);

  const handleSwitchChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: !prev[name as keyof typeof prev]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Aquí se enviarían las preferencias a una API para guardarlas
      // Por ahora solo simulamos el guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Configuración guardada correctamente");
    } catch (error) {
      console.error("Error al guardar configuración:", error);
      toast.error("No se pudo guardar la configuración");
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
    <div className="container mx-auto p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              Volver al inicio
            </Button>
          </Link>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Configuración</CardTitle>
            <CardDescription>
              Personaliza tu experiencia y configura tus preferencias
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="notificaciones">
              <TabsList className="w-full mb-6">
                <TabsTrigger value="notificaciones" className="flex-1">Notificaciones</TabsTrigger>
                <TabsTrigger value="recomendaciones" className="flex-1">Recomendaciones</TabsTrigger>
                <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
              </TabsList>
              
              <TabsContent value="notificaciones">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="notificacionesRecomendaciones" className="text-base">
                          <div className="flex items-center gap-2">
                            <LightbulbIcon className="h-4 w-4 text-yellow-500" />
                            Notificaciones de recomendaciones de ahorro
                          </div>
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Recibe notificaciones cuando encontremos nuevas oportunidades de ahorro
                        </p>
                      </div>
                      <Switch
                        id="notificacionesRecomendaciones"
                        checked={formData.notificacionesRecomendaciones}
                        onCheckedChange={() => handleSwitchChange("notificacionesRecomendaciones")}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="notificacionesRecurrentes" className="text-base">
                          <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            Recordatorios de pagos recurrentes
                          </div>
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Recibe notificaciones sobre tus gastos recurrentes próximos a vencer
                        </p>
                      </div>
                      <Switch
                        id="notificacionesRecurrentes"
                        checked={formData.notificacionesRecurrentes}
                        onCheckedChange={() => handleSwitchChange("notificacionesRecurrentes")}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="notificacionesGrupos" className="text-base">
                          <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            Notificaciones de grupos
                          </div>
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Recibe notificaciones sobre actividad en tus grupos
                        </p>
                      </div>
                      <Switch
                        id="notificacionesGrupos"
                        checked={formData.notificacionesGrupos}
                        onCheckedChange={() => handleSwitchChange("notificacionesGrupos")}
                      />
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
              </TabsContent>
              
              <TabsContent value="recomendaciones">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="recomendacionesAutomaticas" className="text-base">
                          <div className="flex items-center gap-2">
                            <LightbulbIcon className="h-4 w-4 text-yellow-500" />
                            Búsquedas automáticas
                          </div>
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Buscar automáticamente recomendaciones de ahorro semanalmente
                        </p>
                      </div>
                      <Switch
                        id="recomendacionesAutomaticas"
                        checked={formData.recomendacionesAutomaticas}
                        onCheckedChange={() => handleSwitchChange("recomendacionesAutomaticas")}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="recomendacionesSimilares" className="text-base">
                          <div className="flex items-center gap-2">
                            <LightbulbIcon className="h-4 w-4 text-yellow-500" />
                            Mostrar servicios similares
                          </div>
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Incluir servicios alternativos al buscar recomendaciones de ahorro
                        </p>
                      </div>
                      <Switch
                        id="recomendacionesSimilares"
                        checked={formData.recomendacionesSimilares}
                        onCheckedChange={() => handleSwitchChange("recomendacionesSimilares")}
                      />
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
              </TabsContent>
              
              <TabsContent value="general">
                <div className="space-y-6">
                  {loadingAdmin ? (
                    <div className="py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Verificando permisos...</p>
                    </div>
                  ) : userIsAdmin ? (
                    <>
                      <div className="flex items-center gap-2 mb-4">
                        <Shield className="h-5 w-5 text-amber-500" />
                        <span className="text-lg font-semibold">Panel de Administración</span>
                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                          Solo Administradores
                        </span>
                      </div>
                      <CategoriasManager />
                    </>
                  ) : (
                    <div className="py-8 text-center">
                      <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Configuración General</h3>
                      <p className="text-muted-foreground mb-4">
                        Las opciones de configuración general estarán disponibles próximamente.
                      </p>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-700">
                          💡 <strong>¿Eres administrador?</strong> Si deberías tener acceso a funciones administrativas, 
                          contacta al administrador del sistema para que verifique tus permisos.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 