"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Save, Settings, Shield, Crown, CreditCard, ExternalLink, Eye, EyeOff, Lock, Trash2, AlertTriangle, User, Camera, MapPin, Globe, Calendar, DollarSign } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategoriasFamiliaresManager } from "@/components/admin/CategoriasFamiliaresManager";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ConfiguracionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Estado para perfil del usuario
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    timezone: "America/Argentina/Buenos_Aires",
    currency: "ARS",
    dateFormat: "DD/MM/YYYY",
    language: "es-AR"
  });

  // Estado para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(true);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

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
      loadUserProfile();
    }
  }, [status, router, session?.user?.id]);

  const loadUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const userData = await response.json();
        setProfileData({
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          timezone: userData.timezone || "America/Argentina/Buenos_Aires",
          currency: userData.currency || "ARS",
          dateFormat: userData.dateFormat || "DD/MM/YYYY",
          language: userData.language || "es-AR"
        });
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validaciones
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error("Las contraseñas nuevas no coinciden");
        return;
      }
      
      if (passwordData.newPassword.length < 6) {
        toast.error("La nueva contraseña debe tener al menos 6 caracteres");
        return;
      }
      
      // TODO: Implementar API para cambio de contraseña
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      
      if (response.ok) {
        toast.success("Contraseña cambiada correctamente");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      } else {
        const error = await response.json();
        toast.error(error.message || "Error al cambiar la contraseña");
      }
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      toast.error("No se pudo cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "ELIMINAR") {
      toast.error("Debe escribir 'ELIMINAR' para confirmar");
      return;
    }
    
    setLoading(true);
    
    try {
      // TODO: Implementar API para eliminar cuenta
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        toast.success("Cuenta eliminada correctamente");
        // Redireccionar al login después de eliminar
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        const error = await response.json();
        toast.error(error.message || "Error al eliminar la cuenta");
      }
    } catch (error) {
      console.error("Error al eliminar cuenta:", error);
      toast.error("No se pudo eliminar la cuenta");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    
    try {
      const response = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      
      if (response.ok) {
        toast.success("Perfil actualizado correctamente");
      } else {
        const error = await response.json();
        toast.error(error.message || "Error al actualizar el perfil");
      }
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      toast.error("No se pudo actualizar el perfil");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
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
            <Tabs defaultValue="general">
              <TabsList className="w-full mb-6">
                <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
                <TabsTrigger value="perfil" className="flex-1">Perfil</TabsTrigger>
                <TabsTrigger value="seguridad" className="flex-1">Seguridad</TabsTrigger>
                <TabsTrigger value="suscripcion" className="flex-1">Suscripción</TabsTrigger>
              </TabsList>
              
              <TabsContent value="perfil">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-5 w-5 text-blue-500" />
                    <span className="text-lg font-semibold">Información Personal</span>
                  </div>
                  
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Información Básica */}
                      <div className="space-y-4">
                        <h3 className="text-base font-semibold">Datos Básicos</h3>
                        
                        <div className="space-y-2">
                          <Label htmlFor="name">Nombre Completo</Label>
                          <Input
                            id="name"
                            value={profileData.name}
                            onChange={(e) => handleProfileChange('name', e.target.value)}
                            placeholder="Tu nombre completo"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={profileData.email}
                            disabled
                            className="bg-muted"
                          />
                          <p className="text-xs text-muted-foreground">
                            El email no puede modificarse por seguridad
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="phone">Teléfono de Contacto</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={profileData.phone}
                            onChange={(e) => handleProfileChange('phone', e.target.value)}
                            placeholder="+54 9 11 1234-5678"
                          />
                          <p className="text-xs text-muted-foreground">
                            Usado para alertas por SMS (opcional)
                          </p>
                        </div>
                      </div>
                      
                      {/* Configuración Regional */}
                      <div className="space-y-4">
                        <h3 className="text-base font-semibold">Configuración Regional</h3>
                        
                        <div className="space-y-2">
                          <Label>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              Zona Horaria
                            </div>
                          </Label>
                          <Select value={profileData.timezone} onValueChange={(value) => handleProfileChange('timezone', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="America/Argentina/Buenos_Aires">Buenos Aires (UTC-3)</SelectItem>
                              <SelectItem value="America/Argentina/Cordoba">Córdoba (UTC-3)</SelectItem>
                              <SelectItem value="America/Argentina/Mendoza">Mendoza (UTC-3)</SelectItem>
                              <SelectItem value="America/Argentina/Ushuaia">Ushuaia (UTC-3)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Moneda Preferida
                            </div>
                          </Label>
                          <Select value={profileData.currency} onValueChange={(value) => handleProfileChange('currency', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ARS">Peso Argentino (ARS)</SelectItem>
                              <SelectItem value="USD">Dólar Estadounidense (USD)</SelectItem>
                              <SelectItem value="EUR">Euro (EUR)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Para futuras expansiones internacionales
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Formato de Fecha
                            </div>
                          </Label>
                          <Select value={profileData.dateFormat} onValueChange={(value) => handleProfileChange('dateFormat', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (Argentina)</SelectItem>
                              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (Estados Unidos)</SelectItem>
                              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              Idioma
                            </div>
                          </Label>
                          <Select value={profileData.language} onValueChange={(value) => handleProfileChange('language', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="es-AR">Español (Argentina)</SelectItem>
                              <SelectItem value="en-US">English (United States)</SelectItem>
                              <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Para futuras expansiones regionales
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Información Visual */}
                    <div className="border-t pt-6">
                      <h3 className="text-base font-semibold mb-4">Foto de Perfil</h3>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-10 w-10 text-primary/60" />
                        </div>
                        <div className="space-y-2">
                          <Button type="button" variant="outline" size="sm" className="gap-2">
                            <Camera className="h-4 w-4" />
                            Cambiar Foto
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            JPG, PNG hasta 2MB (próximamente disponible)
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <Button type="submit" disabled={profileLoading} className="w-full">
                      {profileLoading ? "Guardando..." : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Guardar Cambios
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              </TabsContent>

              <TabsContent value="general">
                <div className="space-y-6">
                  {loadingAdmin ? (
                    <div className="py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Cargando configuración...</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-4">
                        <Settings className="h-5 w-5 text-blue-500" />
                        <span className="text-lg font-semibold">Gestión de Categorías</span>
                      </div>
                      <CategoriasFamiliaresManager />
                      
                      {userIsAdmin && (
                        <>
                          <div className="border-t pt-6">
                            <div className="flex items-center gap-2 mb-4">
                              <Shield className="h-5 w-5 text-amber-500" />
                              <span className="text-lg font-semibold">Panel de Administración</span>
                              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                                Solo Administradores
                              </span>
                            </div>
                            <div className="bg-amber-50 p-4 rounded-lg">
                              <p className="text-sm text-amber-700">
                                🚧 <strong>Panel de Administración General</strong> estará disponible próximamente.
                                Incluirá gestión de usuarios, planes y analytics del sistema.
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="seguridad">
                <div className="space-y-8">
                  {/* Cambio de Contraseña */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Lock className="h-5 w-5 text-green-500" />
                      <span className="text-lg font-semibold">Cambiar Contraseña</span>
                    </div>
                    
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Contraseña Actual</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showPasswords.current ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({
                              ...prev,
                              currentPassword: e.target.value
                            }))}
                            placeholder="Ingresa tu contraseña actual"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                            onClick={() => togglePasswordVisibility('current')}
                          >
                            {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Nueva Contraseña</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showPasswords.new ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({
                              ...prev,
                              newPassword: e.target.value
                            }))}
                            placeholder="Ingresa tu nueva contraseña"
                            required
                            minLength={6}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                            onClick={() => togglePasswordVisibility('new')}
                          >
                            {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Mínimo 6 caracteres
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showPasswords.confirm ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData(prev => ({
                              ...prev,
                              confirmPassword: e.target.value
                            }))}
                            placeholder="Confirma tu nueva contraseña"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                            onClick={() => togglePasswordVisibility('confirm')}
                          >
                            {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <Button type="submit" disabled={loading} className="w-full">
                        {loading ? "Cambiando..." : (
                          <>
                            <Lock className="mr-2 h-4 w-4" />
                            Cambiar Contraseña
                          </>
                        )}
                      </Button>
                    </form>
                  </div>
                  
                  <Separator />
                  
                  {/* Eliminar Cuenta */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <span className="text-lg font-semibold text-red-600">Zona Peligrosa</span>
                    </div>
                    
                    <div className="border border-red-200 rounded-lg p-4 bg-red-50 dark:bg-red-950/30">
                      <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                        Eliminar Cuenta Permanentemente
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                        Esta acción no se puede deshacer. Se eliminarán todos tus datos:
                        transacciones, presupuestos, inversiones, préstamos y configuraciones.
                      </p>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="gap-2">
                            <Trash2 className="h-4 w-4" />
                            Eliminar Mi Cuenta
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-red-600">
                              ¿Estás completamente seguro?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="space-y-3">
                              <p>
                                Esta acción eliminará permanentemente tu cuenta y todos los datos asociados.
                                Esto incluye:
                              </p>
                              <ul className="list-disc list-inside text-sm space-y-1">
                                <li>Todas tus transacciones y gastos</li>
                                <li>Presupuestos e inversiones</li>
                                <li>Préstamos y gastos recurrentes</li>
                                <li>Alertas y configuraciones</li>
                                <li>Datos de grupos familiares</li>
                              </ul>
                              <p className="font-semibold text-red-600">
                                Esta acción NO se puede deshacer.
                              </p>
                              <div className="space-y-2">
                                <Label htmlFor="deleteConfirm">
                                  Para confirmar, escribe <strong>ELIMINAR</strong> en el campo:
                                </Label>
                                <Input
                                  id="deleteConfirm"
                                  value={deleteConfirmText}
                                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                                  placeholder="Escribe ELIMINAR"
                                />
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteAccount}
                              disabled={deleteConfirmText !== "ELIMINAR" || loading}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {loading ? "Eliminando..." : "Eliminar Cuenta"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="suscripcion">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="h-5 w-5 text-blue-500" />
                    <span className="text-lg font-semibold">Gestión de Suscripción</span>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Ver Planes */}
                    <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer" 
                          onClick={() => router.push('/planes')}>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                          <Crown className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">Ver Planes</h3>
                          <p className="text-sm text-muted-foreground">
                            Explora los planes disponibles y sus características
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Card>

                    {/* Mi Suscripción */}
                    <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer" 
                          onClick={() => router.push('/suscripcion')}>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">Mi Suscripción</h3>
                          <p className="text-sm text-muted-foreground">
                            Gestiona tu suscripción actual y métodos de pago
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Card>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                          Gestión de Suscripción
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Desde aquí puedes ver los planes disponibles, administrar tu suscripción actual, 
                          actualizar métodos de pago y revisar tu historial de facturación.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 