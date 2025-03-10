"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Crown, Package } from "lucide-react";
import Link from "next/link";
import { IconType } from "react-icons";
import * as LucideIcons from "lucide-react";

// Tipos para los datos
type Plan = {
  id: string;
  nombre: string;
  descripcion: string | null;
  esPago: boolean;
};

type Funcionalidad = {
  id: string;
  nombre: string;
  descripcion: string | null;
  slug: string;
  icono: string | null;
};

type FuncionalidadPlan = {
  planId: string;
  funcionalidadId: string;
  activo: boolean;
};

export default function PlanesPage() {
  const { toast } = useToast();
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [funcionalidades, setFuncionalidades] = useState<Funcionalidad[]>([]);
  const [funcionalidadesPlanes, setFuncionalidadesPlanes] = useState<FuncionalidadPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Cargar datos iniciales
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [planesRes, funcionalidadesRes, funcionalidadesPlanesRes] = await Promise.all([
        fetch('/api/admin/planes'),
        fetch('/api/admin/funcionalidades'),
        fetch('/api/admin/funcionalidades-planes')
      ]);

      if (!planesRes.ok || !funcionalidadesRes.ok || !funcionalidadesPlanesRes.ok) {
        throw new Error('Error al obtener los datos');
      }

      const planesData = await planesRes.json();
      const funcionalidadesData = await funcionalidadesRes.json();
      const funcionalidadesPlanesData = await funcionalidadesPlanesRes.json();

      setPlanes(planesData.planes);
      setFuncionalidades(funcionalidadesData.funcionalidades);
      setFuncionalidadesPlanes(funcionalidadesPlanesData.funcionalidadesPlanes);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (planId: string, funcionalidadId: string, checked: boolean) => {
    // Actualizar localmente el estado
    setFuncionalidadesPlanes(prev => {
      const existing = prev.find(fp => fp.planId === planId && fp.funcionalidadId === funcionalidadId);
      
      if (existing) {
        // Actualizar existente
        return prev.map(fp => 
          fp.planId === planId && fp.funcionalidadId === funcionalidadId 
            ? { ...fp, activo: checked } 
            : fp
        );
      } else {
        // Crear nuevo
        return [...prev, { planId, funcionalidadId, activo: checked }];
      }
    });
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/funcionalidades-planes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ funcionalidadesPlanes }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar los cambios');
      }

      toast({
        title: "Éxito",
        description: "Los cambios se han guardado correctamente",
      });
    } catch (error) {
      console.error('Error al guardar:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const isChecked = (planId: string, funcionalidadId: string) => {
    const relacion = funcionalidadesPlanes.find(
      fp => fp.planId === planId && fp.funcionalidadId === funcionalidadId
    );
    return relacion ? relacion.activo : false;
  };

  const getFuncionalidadIcon = (iconName: string | null) => {
    if (!iconName) return <LucideIcons.HelpCircle className="h-5 w-5" />;
    
    // @ts-ignore - Ignoramos el error de tipos porque estamos accediendo dinámicamente a los iconos
    const IconComponent = LucideIcons[iconName];
    
    if (IconComponent) {
      return <IconComponent className="h-5 w-5" />;
    }
    
    return <LucideIcons.HelpCircle className="h-5 w-5" />;
  };

  return (
    <div className="py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Gestión de Planes y Funcionalidades</h1>
          <Link href="/admin">
            <Button variant="outline">Volver al panel</Button>
          </Link>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Funcionalidades por Plan</CardTitle>
            <CardDescription>
              Configura qué funcionalidades están disponibles en cada plan. Marca las casillas para activar una funcionalidad en el plan correspondiente.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">Cargando datos...</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/4">Funcionalidades</TableHead>
                        {planes.map(plan => (
                          <TableHead key={plan.id} className="text-center">
                            <div className="flex flex-col items-center">
                              {plan.esPago ? (
                                <Crown className="h-5 w-5 text-amber-500 mb-1" />
                              ) : (
                                <Package className="h-5 w-5 text-blue-500 mb-1" />
                              )}
                              <span>{plan.nombre}</span>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    
                    <TableBody>
                      {funcionalidades.map(funcionalidad => (
                        <TableRow key={funcionalidad.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {getFuncionalidadIcon(funcionalidad.icono)}
                              <span>{funcionalidad.nombre}</span>
                            </div>
                            {funcionalidad.descripcion && (
                              <p className="text-xs text-gray-500 mt-1">{funcionalidad.descripcion}</p>
                            )}
                          </TableCell>
                          
                          {planes.map(plan => (
                            <TableCell key={`${plan.id}-${funcionalidad.id}`} className="text-center">
                              <Checkbox
                                checked={isChecked(plan.id, funcionalidad.id)}
                                onCheckedChange={(checked: boolean | 'indeterminate') => 
                                  handleCheckboxChange(plan.id, funcionalidad.id, checked === true)
                                }
                                className="mx-auto"
                                aria-label={`${funcionalidad.nombre} para ${plan.nombre}`}
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Button 
                    onClick={saveChanges} 
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 