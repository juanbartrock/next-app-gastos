"use client"

import { useState, useEffect } from "react"
import { Save, Loader2, Bell, Mail, MessageSquare, Smartphone, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"

// Tipos para las configuraciones
interface ConfiguracionAlerta {
  id?: string
  tipoAlerta: string
  habilitado: boolean
  canales: string[]
  frecuencia: string
  horarioInicio?: string
  horarioFin?: string
  diasSemana: number[]
  montoMinimo?: number
  categoriasExcluidas: string[]
  configuracionExtra?: Record<string, any>
}

interface Categoria {
  id: number
  descripcion: string
}

export function ConfiguracionAlertas() {
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionAlerta[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)

  // Tipos de alerta implementados y funcionales
  const tiposAlerta = [
    { value: "PAGO_RECURRENTE", label: "Pagos Recurrentes", descripcion: "Recordatorios de pagos que se repiten mensualmente" },
    { value: "PRESUPUESTO_80", label: "Presupuesto 80%", descripcion: "Cuando has usado el 80% de tu presupuesto" },
    { value: "PRESUPUESTO_90", label: "Presupuesto 90%", descripcion: "Cuando has usado el 90% de tu presupuesto" },
    { value: "PRESUPUESTO_SUPERADO", label: "Presupuesto Superado", descripcion: "Cuando has excedido tu presupuesto" },
    { value: "INVERSION_VENCIMIENTO", label: "Vencimiento de Inversiones", descripcion: "Cuando una inversión está próxima a vencer" },
    { value: "PRESTAMO_CUOTA", label: "Cuotas de Préstamos", descripcion: "Recordatorios de cuotas próximas a vencer" },
    { value: "GASTO_INUSUAL", label: "Gastos Inusuales", descripcion: "Detección de gastos fuera de lo normal" },
    { value: "TAREA_VENCIMIENTO", label: "Tareas Próximas", descripcion: "Recordatorios de tareas financieras pendientes" }
  ]

  const canales = [
    { value: "IN_APP", label: "En la aplicación", icon: Bell },
    { value: "EMAIL", label: "Correo electrónico", icon: Mail },
    { value: "SMS", label: "SMS", icon: MessageSquare },
    { value: "WHATSAPP", label: "WhatsApp", icon: Smartphone },
    { value: "PUSH", label: "Notificaciones Push", icon: Check }
  ]

  const frecuencias = [
    { value: "INMEDIATA", label: "Inmediata" },
    { value: "DIARIA", label: "Resumen diario" },
    { value: "SEMANAL", label: "Resumen semanal" },
    { value: "MENSUAL", label: "Resumen mensual" },
    { value: "PERSONALIZADA", label: "Personalizada" }
  ]

  const diasSemana = [
    { value: 0, label: "Dom" },
    { value: 1, label: "Lun" },
    { value: 2, label: "Mar" },
    { value: 3, label: "Mié" },
    { value: 4, label: "Jue" },
    { value: 5, label: "Vie" },
    { value: 6, label: "Sáb" }
  ]

  useEffect(() => {
    cargarConfiguraciones()
    cargarCategorias()
  }, [])

  const cargarConfiguraciones = async () => {
    try {
      const response = await fetch('/api/alertas/config')
      if (response.ok) {
        const data = await response.json()
        setConfiguraciones(data)
      }
    } catch (error) {
      console.error('Error al cargar configuraciones:', error)
      toast.error("No se pudieron cargar las configuraciones")
    } finally {
      setLoading(false)
    }
  }

  const cargarCategorias = async () => {
    try {
      const response = await fetch('/api/categorias')
      if (response.ok) {
        const data = await response.json()
        setCategorias(data.categorias || data)
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error)
    }
  }

  const actualizarConfiguracion = (tipoAlerta: string, campo: string, valor: any) => {
    setConfiguraciones(prev => {
      const index = prev.findIndex(c => c.tipoAlerta === tipoAlerta)
      if (index >= 0) {
        const updated = [...prev]
        updated[index] = { ...updated[index], [campo]: valor }
        return updated
      } else {
        // Crear nueva configuración
        const nuevaConfig: ConfiguracionAlerta = {
          tipoAlerta,
          habilitado: true,
          canales: ["IN_APP"],
          frecuencia: "INMEDIATA",
          diasSemana: [1, 2, 3, 4, 5],
          categoriasExcluidas: [],
          [campo]: valor
        }
        return [...prev, nuevaConfig]
      }
    })
  }

  const toggleCanal = (tipoAlerta: string, canal: string) => {
    setConfiguraciones(prev => {
      const index = prev.findIndex(c => c.tipoAlerta === tipoAlerta)
      if (index >= 0) {
        const updated = [...prev]
        const canalesActuales = updated[index].canales || []
        const nuevosCanales = canalesActuales.includes(canal)
          ? canalesActuales.filter(c => c !== canal)
          : [...canalesActuales, canal]
        updated[index] = { ...updated[index], canales: nuevosCanales }
        return updated
      }
      return prev
    })
  }

  const toggleDiaSemana = (tipoAlerta: string, dia: number) => {
    setConfiguraciones(prev => {
      const index = prev.findIndex(c => c.tipoAlerta === tipoAlerta)
      if (index >= 0) {
        const updated = [...prev]
        const diasActuales = updated[index].diasSemana || []
        const nuevosDias = diasActuales.includes(dia)
          ? diasActuales.filter(d => d !== dia)
          : [...diasActuales, dia]
        updated[index] = { ...updated[index], diasSemana: nuevosDias }
        return updated
      }
      return prev
    })
  }

  const guardarConfiguraciones = async () => {
    setGuardando(true)
    try {
      const response = await fetch('/api/alertas/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(configuraciones)
      })

      if (response.ok) {
        toast.success("Configuración guardada", {
          description: "Tus preferencias de alertas han sido actualizadas correctamente"
        })
      } else {
        throw new Error('Error al guardar')
      }
    } catch (error) {
      console.error('Error al guardar configuraciones:', error)
      toast.error("No se pudo guardar la configuración")
    } finally {
      setGuardando(false)
    }
  }

  const getConfiguracion = (tipoAlerta: string): ConfiguracionAlerta => {
    const config = configuraciones.find(c => c.tipoAlerta === tipoAlerta)
    return config || {
      tipoAlerta,
      habilitado: true,
      canales: ["IN_APP"],
      frecuencia: "INMEDIATA",
      diasSemana: [1, 2, 3, 4, 5],
      categoriasExcluidas: []
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando configuraciones...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con botón de guardar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Configuración de Alertas</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Personaliza cómo y cuándo quieres recibir cada tipo de alerta
          </p>
        </div>
        <Button onClick={guardarConfiguraciones} disabled={guardando}>
          {guardando ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>

      {/* Configuraciones por tipo de alerta */}
      <div className="space-y-4">
        {tiposAlerta.map((tipo) => {
          const config = getConfiguracion(tipo.value)
          
          return (
            <Card key={tipo.value} className={`transition-all ${!config.habilitado ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{tipo.label}</CardTitle>
                    <CardDescription className="text-sm">{tipo.descripcion}</CardDescription>
                  </div>
                  <Switch
                    checked={config.habilitado}
                    onCheckedChange={(checked) => 
                      actualizarConfiguracion(tipo.value, 'habilitado', checked)
                    }
                  />
                </div>
              </CardHeader>

              {config.habilitado && (
                <CardContent className="space-y-4">
                  {/* Canales de notificación */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">
                      Canales de Notificación
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {canales.map((canal) => {
                        const Icon = canal.icon
                        const isSelected = config.canales?.includes(canal.value)
                        
                        return (
                          <button
                            key={canal.value}
                            onClick={() => toggleCanal(tipo.value, canal.value)}
                            className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                              isSelected
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="text-sm">{canal.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <Separator />

                  {/* Frecuencia */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Frecuencia
                      </Label>
                      <Select
                        value={config.frecuencia}
                        onValueChange={(value) => 
                          actualizarConfiguracion(tipo.value, 'frecuencia', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {frecuencias.map((freq) => (
                            <SelectItem key={freq.value} value={freq.value}>
                              {freq.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Monto mínimo para ciertos tipos */}
                    {["GASTO_INUSUAL", "SALDO_BAJO"].includes(tipo.value) && (
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Monto Mínimo ($)
                        </Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={config.montoMinimo || ''}
                          onChange={(e) => 
                            actualizarConfiguracion(tipo.value, 'montoMinimo', Number(e.target.value))
                          }
                        />
                      </div>
                    )}
                  </div>

                  {/* Horarios para frecuencia personalizada */}
                  {config.frecuencia === "PERSONALIZADA" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium mb-2 block">
                            Horario de Inicio
                          </Label>
                          <Input
                            type="time"
                            value={config.horarioInicio || '09:00'}
                            onChange={(e) => 
                              actualizarConfiguracion(tipo.value, 'horarioInicio', e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium mb-2 block">
                            Horario de Fin
                          </Label>
                          <Input
                            type="time"
                            value={config.horarioFin || '21:00'}
                            onChange={(e) => 
                              actualizarConfiguracion(tipo.value, 'horarioFin', e.target.value)
                            }
                          />
                        </div>
                      </div>

                      {/* Días de la semana */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Días de la Semana
                        </Label>
                        <div className="flex gap-1">
                          {diasSemana.map((dia) => {
                            const isSelected = config.diasSemana?.includes(dia.value)
                            
                            return (
                              <button
                                key={dia.value}
                                onClick={() => toggleDiaSemana(tipo.value, dia.value)}
                                className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                                  isSelected
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                              >
                                {dia.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Categorías excluidas para presupuestos */}
                  {tipo.value.includes("PRESUPUESTO") && categorias.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Categorías Excluidas del Cálculo
                      </Label>
                      <p className="text-xs text-muted-foreground mb-3">
                        Las categorías marcadas NO se incluirán en el cálculo de este presupuesto. 
                        Haz clic para excluir/incluir una categoría.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {categorias.map((categoria) => {
                          const categoriaIdStr = categoria.id.toString()
                          const isExcluida = config.categoriasExcluidas?.includes(categoriaIdStr)
                          
                          return (
                            <Badge
                              key={categoria.id}
                              variant={isExcluida ? "default" : "outline"}
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => {
                                console.log('Toggle categoría:', categoria.descripcion, 'isExcluida:', isExcluida)
                                const nuevasExcluidas = isExcluida
                                  ? config.categoriasExcluidas?.filter(id => id !== categoriaIdStr) || []
                                  : [...(config.categoriasExcluidas || []), categoriaIdStr]
                                actualizarConfiguracion(tipo.value, 'categoriasExcluidas', nuevasExcluidas)
                              }}
                            >
                              {categoria.descripcion}
                              {isExcluida && <span className="ml-1">✓</span>}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Botón de guardar al final */}
      <div className="flex justify-end pt-4">
        <Button onClick={guardarConfiguraciones} disabled={guardando}>
          {guardando ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Todas las Configuraciones
            </>
          )}
        </Button>
      </div>
    </div>
  )
} 