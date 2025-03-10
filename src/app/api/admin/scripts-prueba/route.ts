import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Verificar que el usuario sea administrador
async function isAdmin(userId: string) {
  // Por ahora, asumimos que cualquier usuario puede acceder
  return true;
}

// Obtener la lista de scripts disponibles
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(options);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }
    
    // Verificar si el usuario es administrador
    const esAdmin = await isAdmin(session.user.id);
    if (!esAdmin) {
      return NextResponse.json(
        { error: "No tienes permisos de administrador" },
        { status: 403 }
      );
    }
    
    // Obtener la ruta absoluta del directorio de scripts
    const scriptsDir = path.join(process.cwd(), 'GeneracionDatosPrueba');
    
    // Leer los archivos del directorio
    const archivos = fs.readdirSync(scriptsDir);
    
    // Filtrar solo los archivos JavaScript
    const scripts = archivos
      .filter(archivo => 
        archivo.endsWith('.js') && 
        fs.statSync(path.join(scriptsDir, archivo)).isFile()
      )
      .map(archivo => {
        // Intentar leer la primera línea del archivo para obtener una descripción
        const filePath = path.join(scriptsDir, archivo);
        let descripcion = '';
        
        try {
          const contenido = fs.readFileSync(filePath, 'utf-8');
          const lineas = contenido.split('\n');
          
          // Buscar una línea de comentario que podría servir como descripción
          for (const linea of lineas.slice(0, 10)) {
            if (linea.trim().startsWith('//') || linea.trim().startsWith('/*')) {
              descripcion = linea.trim().replace(/^\/\/\s*|^\/\*\s*|\s*\*\/$/g, '');
              break;
            }
          }
          
          if (!descripcion) {
            descripcion = 'Script para generar datos de prueba';
          }
        } catch (error) {
          console.error(`Error al leer el archivo ${archivo}:`, error);
          descripcion = 'Script para generar datos de prueba';
        }
        
        return {
          nombre: archivo,
          ruta: filePath,
          descripcion,
          ejecutado: false,
          exitoso: null,
          ultimaSalida: '',
          ultimaEjecucion: null
        };
      });
    
    return NextResponse.json({ scripts });
  } catch (error: any) {
    console.error("Error al obtener scripts:", error);
    
    return NextResponse.json(
      { error: "Error al obtener la lista de scripts" },
      { status: 500 }
    );
  }
}

// Ejecutar un script específico
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(options);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }
    
    // Verificar si el usuario es administrador
    const esAdmin = await isAdmin(session.user.id);
    if (!esAdmin) {
      return NextResponse.json(
        { error: "No tienes permisos de administrador" },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    const { scriptNombre } = data;
    
    if (!scriptNombre) {
      return NextResponse.json(
        { error: "Nombre de script no especificado" },
        { status: 400 }
      );
    }
    
    // Validar que el script existe y que es un archivo JS
    const scriptPath = path.join(process.cwd(), 'GeneracionDatosPrueba', scriptNombre);
    
    if (!fs.existsSync(scriptPath) || !scriptPath.endsWith('.js')) {
      return NextResponse.json(
        { error: "Script no encontrado o inválido" },
        { status: 404 }
      );
    }
    
    // Ejecutar el script
    try {
      console.log(`Ejecutando script: ${scriptPath}`);
      const { stdout, stderr } = await execPromise(`node "${scriptPath}"`);
      
      const exitoso = !stderr;
      const salida = exitoso ? stdout : stderr;
      
      return NextResponse.json({
        exitoso,
        salida,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error(`Error al ejecutar script ${scriptNombre}:`, error);
      
      return NextResponse.json({
        exitoso: false,
        salida: error.message || 'Error desconocido al ejecutar el script',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error: any) {
    console.error("Error al ejecutar script:", error);
    
    return NextResponse.json(
      { error: "Error al ejecutar el script" },
      { status: 500 }
    );
  }
} 