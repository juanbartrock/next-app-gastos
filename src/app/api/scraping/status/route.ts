import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { options } from '@/app/api/auth/[...nextauth]/options';
import { checkServiceAvailability, getAvailableServices, ScraperOptions } from '@/scraping';
import prisma from '@/lib/prisma';

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
    
    // Verificar el estado de cada servicio
    const resultados = await Promise.all(
      servicios.map(async (servicio) => {
        const disponible = await checkServiceAvailability(servicio);
        return { servicio, disponible };
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
    'directv.com.ar': 'directv'
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