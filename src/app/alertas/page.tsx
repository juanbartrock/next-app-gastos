"use client"

import { useState, useEffect } from "react"
import { Bell, Settings, History, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertsList } from "@/components/alertas/AlertsList"
import { ConfiguracionAlertas } from "@/components/alertas/ConfiguracionAlertas"
import { PageLayout } from "@/components/PageLayout"

// Tipos para las alertas
interface Alerta {
  id: string
  tipo: string
  prioridad: "BAJA" | "MEDIA" | "ALTA" | "CRITICA"
  titulo: string
  mensaje: string
  leida: boolean
  accionado: boolean
  fechaCreacion: string
  fechaExpiracion?: string
  metadatos?: Record<string, any>
  gastoRecurrente?: any
  prestamo?: any
  presupuesto?: any
  tarea?: any
  promocion?: any
}

interface AlertasResponse {
  alertas: Alerta[]
  pagination: {
    total: number
    pagina: number
    limite: number
    totalPaginas: number
  }
  stats: {
    noLeidas: number
    total: number
  }
}

export default function AlertasPage() {
  const [alertasActivas, setAlertasActivas] = useState<Alerta[]>([])
  const [historialAlertas, setHistorialAlertas] = useState<Alerta[]>([])
  const [stats, setStats] = useState({ noLeidas: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState<string>("todos")
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>("todos")

  useEffect(() => {
    fetchAlertas()
  }, [])

  const fetchAlertas = async () => {
    try {
      setLoading(true)
      
      // Obtener alertas activas (no leídas)
      const responseActivas = await fetch("/api/alertas?leidas=false&limite=50")
      if (responseActivas.ok) {
        const dataActivas: AlertasResponse = await responseActivas.json()
        setAlertasActivas(dataActivas.alertas)
        setStats(dataActivas.stats)
      }
      
      // Obtener historial (leídas)
      const responseHistorial = await fetch("/api/alertas?leidas=true&limite=50")
      if (responseHistorial.ok) {
        const dataHistorial: AlertasResponse = await responseHistorial.json()
        setHistorialAlertas(dataHistorial.alertas)
      }
    } catch (error) {
      console.error("Error al obtener alertas:", error)
    } finally {
      setLoading(false)
    }
  }

  const marcarComoLeida = async (alertaId: string) => {
    try {
      const response = await fetch(`/api/alertas/${alertaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ leida: true }),
      })

      if (response.ok) {
        // Mover la alerta de activas a historial
        const alerta = alertasActivas.find(a => a.id === alertaId)
        if (alerta) {
          setAlertasActivas(prev => prev.filter(a => a.id !== alertaId))
          setHistorialAlertas(prev => [{ ...alerta, leida: true }, ...prev])
          setStats(prev => ({ 
            ...prev, 
            noLeidas: Math.max(0, prev.noLeidas - 1) 
          }))
        }
      }
    } catch (error) {
      console.error("Error al marcar alerta como leída:", error)
    }
  }

  const marcarComoAccionado = async (alertaId: string) => {
    try {
      const response = await fetch(`/api/alertas/${alertaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accionado: true }),
      })

      if (response.ok) {
        // Actualizar el estado local
        setAlertasActivas(prev => 
          prev.map(alerta => 
            alerta.id === alertaId 
              ? { ...alerta, accionado: true }
              : alerta
          )
        )
        setHistorialAlertas(prev => 
          prev.map(alerta => 
            alerta.id === alertaId 
              ? { ...alerta, accionado: true }
              : alerta
          )
        )
      }
    } catch (error) {
      console.error("Error al marcar alerta como accionado:", error)
    }
  }

  const eliminarAlerta = async (alertaId: string) => {
    try {
      const response = await fetch(`/api/alertas/${alertaId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Eliminar de ambas listas
        setAlertasActivas(prev => prev.filter(a => a.id !== alertaId))
        setHistorialAlertas(prev => prev.filter(a => a.id !== alertaId))
        setStats(prev => ({ 
          ...prev, 
          total: Math.max(0, prev.total - 1) 
        }))
      }
    } catch (error) {
      console.error("Error al eliminar alerta:", error)
    }
  }

  const filtrarAlertas = (alertas: Alerta[]) => {
    return alertas.filter(alerta => {
      const cumpleTipo = filtroTipo === "todos" || alerta.tipo === filtroTipo
      const cumplePrioridad = filtroPrioridad === "todos" || alerta.prioridad === filtroPrioridad
      return cumpleTipo && cumplePrioridad
    })
  }

  const tiposAlerta = [
    { value: "todos", label: "Todos los tipos" },
    { value: "PAGO_RECURRENTE", label: "Pagos Recurrentes" },
    { value: "PRESUPUESTO_80", label: "Presupuesto 80%" },
    { value: "PRESUPUESTO_90", label: "Presupuesto 90%" },
    { value: "PRESUPUESTO_SUPERADO", label: "Presupuesto Superado" },
    { value: "PRESTAMO_CUOTA", label: "Cuotas de Préstamo" },
    { value: "TAREA_VENCIMIENTO", label: "Tareas Vencimiento" },
    { value: "PROMOCION_DISPONIBLE", label: "Promociones" }
  ]

  const prioridades = [
    { value: "todos", label: "Todas las prioridades" },
    { value: "CRITICA", label: "Crítica" },
    { value: "ALTA", label: "Alta" },
    { value: "MEDIA", label: "Media" },
    { value: "BAJA", label: "Baja" }
  ]

  return (
    <PageLayout>
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <Bell className="h-8 w-8 text-amber-500" />
              Centro de Alertas
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gestiona todas tus notificaciones y configuraciones
            </p>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-4">
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.noLeidas}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  No leídas
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.total}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Tipo de Alerta</label>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposAlerta.map(tipo => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Prioridad</label>
                <Select value={filtroPrioridad} onValueChange={setFiltroPrioridad}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {prioridades.map(prioridad => (
                      <SelectItem key={prioridad.value} value={prioridad.value}>
                        {prioridad.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFiltroTipo("todos")
                    setFiltroPrioridad("todos")
                  }}
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="activas" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="activas" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alertas Activas
              {stats.noLeidas > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {stats.noLeidas}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="historial" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Historial
            </TabsTrigger>
            <TabsTrigger value="configuracion" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuración
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activas">
            <Card>
              <CardHeader>
                <CardTitle>Alertas Activas</CardTitle>
                <CardDescription>
                  Alertas que requieren tu atención
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertsList
                  alertas={filtrarAlertas(alertasActivas)}
                  loading={loading}
                  onMarcarLeida={marcarComoLeida}
                  onMarcarAccionado={marcarComoAccionado}
                  onEliminar={eliminarAlerta}
                  showActions={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historial">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Alertas</CardTitle>
                <CardDescription>
                  Alertas que ya han sido leídas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertsList
                  alertas={filtrarAlertas(historialAlertas)}
                  loading={loading}
                  onMarcarAccionado={marcarComoAccionado}
                  onEliminar={eliminarAlerta}
                  showActions={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuracion">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Alertas</CardTitle>
                <CardDescription>
                  Personaliza cómo y cuándo recibir notificaciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConfiguracionAlertas />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  )
} 