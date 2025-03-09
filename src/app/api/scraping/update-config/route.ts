import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { options } from '@/app/api/auth/[...nextauth]/options';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

/**
 * API para actualizar la configuración de un scraper
 * POST /api/scraping/update-config
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(options);
    
    // Verificar autenticación
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    // Verificar si el usuario existe
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    // Por simplicidad, permitiremos que cualquier usuario autenticado actualice la configuración
    // En un sistema de producción, aquí deberíamos implementar una verificación de roles adecuada
    
    // Obtener datos del request
    const { serviceName, updates } = await request.json();
    
    if (!serviceName || !updates) {
      return NextResponse.json(
        { error: 'Faltan parámetros necesarios' },
        { status: 400 }
      );
    }
    
    // Leer el archivo de configuración actual
    const configFilePath = path.join(process.cwd(), 'src', 'scraping', 'config', 'services.config.ts');
    let configContent = fs.readFileSync(configFilePath, 'utf8');
    
    // Actualizar las propiedades enviadas
    Object.entries(updates).forEach(([key, value]) => {
      // Solo permitir actualizar useForRecommendations por ahora
      if (key !== 'useForRecommendations') {
        return;
      }
      
      // Actualizar el valor en el archivo (buscar y reemplazar)
      const regexPattern = new RegExp(`(${serviceName}:\\s*{[\\s\\S]*?useForRecommendations:\\s*)([a-z]+)(,[\\s\\S]*?})`, 'g');
      configContent = configContent.replace(regexPattern, `$1${value}$3`);
    });
    
    // Guardar el archivo modificado
    fs.writeFileSync(configFilePath, configContent, 'utf8');
    
    return NextResponse.json({
      success: true,
      message: `Configuración de ${serviceName} actualizada correctamente`,
      serviceName,
      updates
    });
  } catch (error) {
    console.error('Error al actualizar configuración del scraper:', error);
    
    return NextResponse.json(
      { 
        error: 'Error al actualizar configuración',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 