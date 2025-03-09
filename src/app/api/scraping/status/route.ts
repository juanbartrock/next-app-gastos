import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { options } from '@/app/api/auth/[...nextauth]/options';
import { checkServiceAvailability, getAvailableServices, ScraperOptions } from '@/scraping';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

// Función para obtener la configuración de los servicios
function getServicesConfig() {
  try {
    const configFilePath = path.join(process.cwd(), 'src', 'scraping', 'config', 'services.config.ts');
    const configContent = fs.readFileSync(configFilePath, 'utf8');
    
    console.log("======= DEPURACIÓN DE STATUS =======");
    console.log("Leyendo configuración de servicios");
    
    // Método simplificado: buscar servicios y su configuración
    const servicesConfig: Record<string, { useForRecommendations: boolean }> = {};
    
    // Primero, encontrar todos los nombres de servicios
    const serviceNames: string[] = [];
    const serviceStartRegex = /(\w+):\s*{/g;
    let match;
    
    while ((match = serviceStartRegex.exec(configContent)) !== null) {
      serviceNames.push(match[1]);
    }
    
    console.log("Servicios encontrados en el archivo:", serviceNames);
    
    // Para cada servicio, verificar su configuración
    for (const serviceName of serviceNames) {
      // Buscar la sección del servicio
      const serviceStartIndex = configContent.indexOf(`${serviceName}: {`);
      if (serviceStartIndex === -1) continue;
      
      // Buscar el final de la sección (la siguiente llave de cierre)
      const serviceEndIndex = configContent.indexOf('},', serviceStartIndex);
      if (serviceEndIndex === -1) continue;
      
      // Extraer la sección del servicio
      const serviceSection = configContent.substring(serviceStartIndex, serviceEndIndex);
      
      // Verificar si tiene useForRecommendations: true
      const isForRecommendations = serviceSection.includes('useForRecommendations: true');
      
      servicesConfig[serviceName] = {
        useForRecommendations: isForRecommendations
      };
      
      console.log(`${serviceName} - useForRecommendations: ${isForRecommendations}`);
    }
    
    console.log("Configuración de servicios:", servicesConfig);
    console.log("=================================");
    
    return servicesConfig;
  } catch (error) {
    console.error("Error al obtener configuración de servicios:", error);
    return {};
  }
}

/**
 * API para verificar el estado de los scrapers
 * GET /api/scraping/status
 */
export async function GET() {
  try {
    const session = await getServerSession(options);
    
    // Verificar autenticación
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    // Verificar si el usuario es administrador
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    // Obtener todos los servicios disponibles
    const servicios = getAvailableServices();
    
    // Obtener configuración de los servicios
    const servicesConfig = getServicesConfig();
    
    // Verificar el estado de cada servicio
    const resultados = await Promise.all(
      servicios.map(async (servicio) => {
        const disponible = await checkServiceAvailability(servicio);
        return { 
          servicio, 
          disponible,
          useForRecommendations: servicesConfig[servicio]?.useForRecommendations || false
        };
      })
    );
    
    // Obtener resultados históricos de la base de datos si están disponibles
    const historial = await obtenerHistorialEjecuciones();
    
    return NextResponse.json({
      servicios: resultados,
      historial
    });
  } catch (error) {
    console.error('Error al verificar estado de scrapers:', error);
    
    return NextResponse.json(
      { 
        error: 'Error al verificar estado de scrapers',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * Obtiene el historial de ejecuciones de scrapers
 */
async function obtenerHistorialEjecuciones() {
  try {
    // Obtener los últimos registros de promociones creadas, agrupados por serviceName
    const promociones = await prisma.$queryRaw<any[]>`
      SELECT 
        SUBSTRING("urlOrigen" FROM '^https?://(?:www\\.)?([^/]+)') AS dominio,
        MAX("fechaCreacion") AS ultima_ejecucion,
        COUNT(*) AS total_promociones
      FROM "Promocion"
      WHERE "urlOrigen" IS NOT NULL
      GROUP BY dominio
      ORDER BY ultima_ejecucion DESC
    `;
    
    return promociones.map(promo => ({
      servicio: mapearDominioAServicio(promo.dominio || ''),
      ultimaEjecucion: promo.ultima_ejecucion,
      totalPromociones: Number(promo.total_promociones)
    }));
  } catch (error) {
    console.error('Error al obtener historial de ejecuciones:', error);
    return [];
  }
}

/**
 * Mapea un dominio a un nombre de servicio
 */
function mapearDominioAServicio(dominio: string): string {
  const mapeo: Record<string, string> = {
    'netflix.com': 'netflix',
    'spotify.com': 'spotify',
    'personal.com.ar': 'personal',
    'claro.com.ar': 'claro',
    'movistar.com.ar': 'movistar',
    'directv.com.ar': 'directv',
    'ratoneando.ar': 'ratoneando',
    'precialo.com.ar': 'precialo'
  };
  
  // Buscar el dominio en el mapeo
  for (const [domain, service] of Object.entries(mapeo)) {
    if (dominio.includes(domain)) {
      return service;
    }
  }
  
  // Si no se encuentra, devolver el dominio original
  return dominio;
} 