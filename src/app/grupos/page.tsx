"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Users, UserPlus, Settings, ArrowLeft, Edit, Trash, LogOut, Loader2 } from "lucide-react"
import { InvitarUsuarioForm } from "@/components/InvitarUsuarioForm"
import { toast } from "sonner"

// Definición de interfaces
interface Miembro {
  id: string;
  grupoId: string;
  userId: string;
  rol: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

interface Grupo {
  id: string;
  nombre: string;
  descripcion: string | null;
  adminId: string;
  admin: {
    id: string;
    name: string | null;
    email: string | null;
  };
  rol: string;
  miembros: Miembro[];
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  nombre: string;
  descripcion: string;
}

// Componente de carga
function LoadingScreen() {
  return (
    <div className="container mx-auto py-10 text-center">
      <p>Cargando...</p>
    </div>
  );
}

export default function GruposPage() {
  // Hooks de autenticación
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Estados del componente
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [invitarUsuarioDialogOpen, setInvitarUsuarioDialogOpen] = useState(false)
  const [selectedGrupoId, setSelectedGrupoId] = useState<string | null>(null)
  const [savingGroup, setSavingGroup] = useState(false)
  const [deletingGroup, setDeletingGroup] = useState<string | null>(null)
  const [leavingGroup, setLeavingGroup] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    descripcion: ""
  })
  
  // Definir fetchGrupos antes de usarlo en useEffect
  const fetchGrupos = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/grupos")
      if (response.ok) {
        const data = await response.json()
        setGrupos(data)
      }
    } catch (error) {
      console.error("Error al cargar grupos:", error)
    } finally {
      setLoading(false)
    }
  }
  
  // Efecto para redireccionar si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Efecto para cargar grupos del usuario
  useEffect(() => {
    if (status === "authenticated") {
      fetchGrupos()
    }
  }, [status])

  // Funciones del componente
  const handleCreateGrupo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/grupos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setOpenDialog(false)
        setFormData({ nombre: "", descripcion: "" })
        fetchGrupos()
      }
    } catch (error) {
      console.error("Error al crear grupo:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleInvitarUsuario = (grupoId: string) => {
    setSelectedGrupoId(grupoId)
    setInvitarUsuarioDialogOpen(true)
  }

  const handleUsuarioInvitado = () => {
    setInvitarUsuarioDialogOpen(false)
    fetchGrupos()
  }
  
  // Añadir función para editar un grupo
  const handleEditarGrupo = async (grupoId: string) => {
    // Buscar el grupo que se quiere editar
    const grupoToEdit = grupos.find(g => g.id === grupoId)
    if (!grupoToEdit) return
    
    // Establecer los datos para edición
    setFormData({
      nombre: grupoToEdit.nombre,
      descripcion: grupoToEdit.descripcion || ""
    })
    
    setSelectedGrupoId(grupoId)
    setOpenDialog(true)
  }
  
  // Añadir función para guardar los cambios de un grupo
  const handleSaveGrupo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!formData.nombre.trim()) {
      toast.error("El nombre del grupo es obligatorio")
      return
    }
    
    setSavingGroup(true)
    try {
      const method = selectedGrupoId ? "PUT" : "POST"
      const url = selectedGrupoId ? `/api/grupos/${selectedGrupoId}` : "/api/grupos"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        toast.success(selectedGrupoId 
          ? "Grupo actualizado correctamente" 
          : "Grupo creado correctamente")
        
        setOpenDialog(false)
        setFormData({ nombre: "", descripcion: "" })
        setSelectedGrupoId(null)
        fetchGrupos()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al procesar la solicitud")
      }
    } catch (error) {
      console.error("Error al guardar grupo:", error)
      toast.error("Error al procesar la solicitud")
    } finally {
      setSavingGroup(false)
    }
  }
  
  // Añadir función para eliminar un grupo
  const handleEliminarGrupo = async (grupoId: string) => {
    if (!confirm("¿Estás seguro de eliminar este grupo? Esta acción no se puede deshacer.")) {
      return
    }
    
    setDeletingGroup(grupoId)
    try {
      const response = await fetch(`/api/grupos/${grupoId}`, {
        method: "DELETE"
      })
      
      if (response.ok) {
        toast.success("Grupo eliminado correctamente")
        fetchGrupos()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al eliminar el grupo")
      }
    } catch (error) {
      console.error("Error al eliminar grupo:", error)
      toast.error("Error al procesar la solicitud")
    } finally {
      setDeletingGroup(null)
    }
  }
  
  // Añadir función para abandonar un grupo
  const handleAbandonarGrupo = async (grupoId: string) => {
    if (!confirm("¿Estás seguro de abandonar este grupo? Se perderá acceso a los gastos compartidos.")) {
      return
    }
    
    setLeavingGroup(grupoId)
    try {
      const response = await fetch(`/api/grupos/${grupoId}/miembros`, {
        method: "DELETE"
      })
      
      if (response.ok) {
        toast.success("Has abandonado el grupo correctamente")
        fetchGrupos()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al abandonar el grupo")
      }
    } catch (error) {
      console.error("Error al abandonar grupo:", error)
      toast.error("Error al procesar la solicitud")
    } finally {
      setLeavingGroup(null)
    }
  }

  // Pantalla de carga
  if (status === "loading" || (status === "authenticated" && loading)) {
    return <LoadingScreen />
  }
  
  // No mostrar nada si no está autenticado
  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push('/?dashboard=true')}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Grupos de Gastos</h1>
          </div>
          <Button onClick={() => setOpenDialog(true)}>
            Crear Grupo
          </Button>
        </div>

        {grupos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">No tienes grupos</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Crea un nuevo grupo o pide a alguien que te invite a uno existente.
              </p>
              <Button onClick={() => setOpenDialog(true)}>
                Crear mi primer grupo
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {grupos.map((grupo) => (
              <Card key={grupo.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{grupo.nombre}</span>
                    <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                      {grupo.rol === "ADMIN" ? "Administrador" : "Miembro"}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {grupo.descripcion && (
                    <p className="text-muted-foreground mb-4">{grupo.descripcion}</p>
                  )}
                  
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Miembros ({grupo.miembros?.length || 0})</h3>
                    <div className="flex -space-x-2 overflow-hidden">
                      {grupo.miembros?.slice(0, 5).map((miembro) => (
                        <div 
                          key={miembro.userId} 
                          className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium"
                          title={miembro.user?.name || "Usuario"}
                        >
                          {(miembro.user?.name || "U").charAt(0)}
                        </div>
                      ))}
                      {grupo.miembros?.length > 5 && (
                        <div className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-muted text-muted-foreground flex items-center justify-center text-xs">
                          +{grupo.miembros.length - 5}
                        </div>
                      )}
                    </div>
                  </div>

                  <Tabs defaultValue="resumen" className="w-full">
                    <TabsList className="grid grid-cols-2">
                      <TabsTrigger value="resumen">Resumen</TabsTrigger>
                      <TabsTrigger value="configuracion">
                        <Settings className="h-4 w-4 mr-1" />
                        {grupo.rol === "ADMIN" ? "Administrar" : "Detalles"}
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="resumen" className="pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total gastos:</span>
                          <span className="font-medium">$0.00</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Mi contribución:</span>
                          <span className="font-medium">$0.00</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Balance:</span>
                          <span className="font-medium text-green-600">$0.00</span>
                        </div>
                      </div>
                      <Button className="w-full mt-4" variant="outline">
                        Ver detalle de gastos
                      </Button>
                    </TabsContent>
                    <TabsContent value="configuracion" className="pt-4">
                      {grupo.rol === "ADMIN" ? (
                        <div className="space-y-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleInvitarUsuario(grupo.id)}
                            disabled={savingGroup || deletingGroup === grupo.id || leavingGroup === grupo.id}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Invitar usuarios
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleEditarGrupo(grupo.id)}
                            disabled={savingGroup || deletingGroup === grupo.id || leavingGroup === grupo.id}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar grupo
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleEliminarGrupo(grupo.id)}
                            disabled={deletingGroup === grupo.id || savingGroup || leavingGroup === grupo.id}
                          >
                            {deletingGroup === grupo.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Eliminando...
                              </>
                            ) : (
                              <>
                                <Trash className="h-4 w-4 mr-2" />
                                Eliminar grupo
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            disabled={savingGroup || deletingGroup === grupo.id || leavingGroup === grupo.id}
                          >
                            Ver todos los miembros
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleAbandonarGrupo(grupo.id)}
                            disabled={leavingGroup === grupo.id || savingGroup || deletingGroup === grupo.id}
                          >
                            {leavingGroup === grupo.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Abandonando...
                              </>
                            ) : (
                              <>
                                <LogOut className="h-4 w-4 mr-2" />
                                Abandonar grupo
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de invitación de usuarios */}
        <Dialog open={invitarUsuarioDialogOpen} onOpenChange={setInvitarUsuarioDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invitar usuario al grupo</DialogTitle>
              <DialogDescription>
                Invita a otros usuarios a formar parte de este grupo para compartir gastos
              </DialogDescription>
            </DialogHeader>
            {selectedGrupoId && (
              <InvitarUsuarioForm
                grupoId={selectedGrupoId}
                onUsuarioInvitado={handleUsuarioInvitado}
                onCancel={() => setInvitarUsuarioDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Modal para crear o editar grupo */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedGrupoId ? "Editar Grupo" : "Crear Nuevo Grupo"}</DialogTitle>
              <DialogDescription>
                {selectedGrupoId 
                  ? "Actualiza la información del grupo"
                  : "Crea un nuevo grupo para compartir gastos"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveGrupo}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nombre" className="text-right">Nombre</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    placeholder="Nombre del grupo"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="descripcion" className="text-right">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    name="descripcion"
                    placeholder="Descripción del grupo (opcional)"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full" disabled={savingGroup}>
                  {savingGroup ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {selectedGrupoId ? "Guardando..." : "Creando..."}
                    </>
                  ) : (
                    selectedGrupoId ? "Guardar Cambios" : "Crear Grupo"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 