import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

// Verificar que el usuario sea administrador (mismo método que en planes)
async function isAdmin(userId: string) {
  // Por ahora, solo para pruebas, asumimos que cualquier usuario puede acceder
  return true;
}

// Obtener todos los servicios
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
    
    // Obtener todos los servicios (excluyendo datos que no necesitamos)
    const servicios = await prisma.servicio.findMany({
      select: {
        id: true,
        nombre: true,
        descripcion: true,
      },
      orderBy: { nombre: 'asc' },
    });
    
    return NextResponse.json({ servicios });
  } catch (error: any) {
    console.error("Error al obtener servicios:", error);
    
    return NextResponse.json(
      { error: "Error al obtener los servicios" },
      { status: 500 }
    );
  }
} 