import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

// Verificar que el usuario sea administrador (mismo método que en planes)
async function isAdmin(userId: string) {
  // Por ahora, solo para pruebas, asumimos que cualquier usuario puede acceder
  return true;
}

// Obtener todas las funcionalidades
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
    
    // Obtener todas las funcionalidades
    const funcionalidades = await prisma.funcionalidad.findMany({
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        slug: true,
        icono: true,
      },
      orderBy: { nombre: 'asc' },
    });
    
    return NextResponse.json({ funcionalidades });
  } catch (error: any) {
    console.error("Error al obtener funcionalidades:", error);
    
    return NextResponse.json(
      { error: "Error al obtener las funcionalidades" },
      { status: 500 }
    );
  }
} 