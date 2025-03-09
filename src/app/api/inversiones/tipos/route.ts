import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options';
import prisma from '@/lib/prisma';

// GET /api/inversiones/tipos - Obtener todos los tipos de inversión
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener tipos de inversión predefinidos (userId = null) y personalizados del usuario
    const tiposInversion = await prisma.tipoInversion.findMany({
      where: {
        OR: [
          { userId: null },             // Tipos predefinidos del sistema
          { userId: session.user.id }   // Tipos personalizados del usuario
        ]
      },
      orderBy: [
        { userId: 'asc' },       // Primero los predefinidos (null), luego los personalizados 
        { nombre: 'asc' }        // Ordenados alfabéticamente
      ]
    });

    return NextResponse.json({ tiposInversion });
  } catch (error) {
    console.error('Error al obtener tipos de inversión:', error);
    return NextResponse.json(
      { error: 'Error al obtener tipos de inversión' },
      { status: 500 }
    );
  }
} 