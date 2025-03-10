"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { 
  Play, 
  AlertCircle, 
  CheckCircle2, 
  Timer, 
  Command, 
  Clock,
  Download
} from "lucide-react";

// Tipo para los scripts
type Script = {
  nombre: string;
  ruta: string;
  descripcion: string;
  ejecutado: boolean;
  exitoso: boolean | null;
  ultimaSalida: string;
  ultimaEjecucion: string | null;
};

export default function ScriptsPruebaPage() {
  const { toast } = useToast();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [scriptsProcesados, setScriptsProcesados] = useState<{[key: string]: Script}>({});
  const [loading, setLoading] = useState(true);
  const [ejecutando, setEjecutando] = useState<string | null>(null);
  const [salidaActual, setSalidaActual] = useState<string>('');
  const [mostrarSalida, setMostrarSalida] = useState(false);

  useEffect(() => {
    // Cargar los scripts al montar el componente
    fetchScripts();
  }, []);

  const fetchScripts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/scripts-prueba');
      
      if (!response.ok) {
        throw new Error('Error al obtener los scripts');
      }
      
      const data = await response.json();
      setScripts(data.scripts);
      
      // Inicializar el estado de los scripts procesados
      const procesados: {[key: string]: Script} = {};
      data.scripts.forEach((script: Script) => {
        procesados[script.nombre] = script;
      });
      setScriptsProcesados(procesados);
    } catch (error) {
      console.error('Error al cargar los scripts:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los scripts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const ejecutarScript = async (nombre: string) => {
    if (ejecutando) {
      toast({
        title: "Error",
        description: "Ya hay un script en ejecución",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setEjecutando(nombre);
      setSalidaActual('');
      setMostrarSalida(true);
      
      const response = await fetch('/api/admin/scripts-prueba', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scriptNombre: nombre }),
      });
      
      const resultado = await response.json();
      
      // Actualizar el estado del script
      setScriptsProcesados(prev => ({
        ...prev,
        [nombre]: {
          ...prev[nombre],
          ejecutado: true,
          exitoso: resultado.exitoso,
          ultimaSalida: resultado.salida,
          ultimaEjecucion: resultado.timestamp,
        }
      }));
      
      setSalidaActual(resultado.salida);
      
      if (resultado.exitoso) {
        toast({
          title: "Éxito",
          description: `Script '${nombre}' ejecutado correctamente`,
        });
      } else {
        toast({
          title: "Error",
          description: `Error al ejecutar el script '${nombre}'`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(`Error al ejecutar script ${nombre}:`, error);
      toast({
        title: "Error",
        description: "No se pudo ejecutar el script",
        variant: "destructive"
      });
    } finally {
      setEjecutando(null);
    }
  };

  const formatearFecha = (fechaStr: string | null) => {
    if (!fechaStr) return "Nunca";
    
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleString();
    } catch (error) {
      return "Fecha inválida";
    }
  };

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Generación de Datos de Prueba</h1>
          <Link href="/admin">
            <Button variant="outline">Volver al panel</Button>
          </Link>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Scripts de Datos de Prueba</CardTitle>
            <CardDescription>
              Ejecuta cualquiera de los scripts disponibles para generar datos de prueba en la aplicación.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">Cargando scripts...</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[20%]">Nombre</TableHead>
                        <TableHead className="w-[40%]">Descripción</TableHead>
                        <TableHead className="w-[15%]">Última Ejecución</TableHead>
                        <TableHead className="w-[10%]">Estado</TableHead>
                        <TableHead className="w-[15%]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    
                    <TableBody>
                      {scripts.map((script) => (
                        <TableRow key={script.nombre}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Command className="h-4 w-4 text-blue-500" />
                              {script.nombre}
                            </div>
                          </TableCell>
                          
                          <TableCell>{script.descripcion}</TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              {formatearFecha(scriptsProcesados[script.nombre]?.ultimaEjecucion || null)}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            {!scriptsProcesados[script.nombre]?.ejecutado ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                <Timer className="mr-1 h-3 w-3" />
                                Pendiente
                              </span>
                            ) : scriptsProcesados[script.nombre]?.exitoso ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Exitoso
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <AlertCircle className="mr-1 h-3 w-3" />
                                Fallido
                              </span>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => ejecutarScript(script.nombre)}
                                disabled={ejecutando !== null}
                                className={ejecutando === script.nombre ? "animate-pulse" : ""}
                              >
                                <Play className="mr-1 h-4 w-4" />
                                {ejecutando === script.nombre ? "Ejecutando..." : "Ejecutar"}
                              </Button>
                              
                              {scriptsProcesados[script.nombre]?.ejecutado && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSalidaActual(scriptsProcesados[script.nombre]?.ultimaSalida || '');
                                    setMostrarSalida(true);
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {mostrarSalida && (
                  <div className="mt-8">
                    <CardHeader className="px-0 py-3">
                      <CardTitle className="text-lg">Salida del Script</CardTitle>
                      <CardDescription>
                        Resultado de la última ejecución
                      </CardDescription>
                    </CardHeader>
                    
                    <div className="mt-2 p-4 bg-black text-white font-mono text-sm rounded-md h-64 overflow-auto">
                      <pre>{salidaActual || 'No hay salida disponible'}</pre>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 