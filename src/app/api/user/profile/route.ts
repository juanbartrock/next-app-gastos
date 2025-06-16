import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

// Obtener perfil del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(options);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }
    
    // Obtener información del usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        image: true,
        fechaRegistro: true
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }
    
    console.log(`✅ Perfil obtenido para usuario: ${user.email}`);
    
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phoneNumber || '',
      timezone: 'America/Argentina/Buenos_Aires', // Por defecto
      currency: 'ARS', // Por defecto
      dateFormat: 'DD/MM/YYYY', // Por defecto
      language: 'es-AR', // Por defecto
      image: user.image,
      createdAt: user.fechaRegistro,
      updatedAt: user.fechaRegistro
    });
  } catch (error: any) {
    console.error("Error obteniendo perfil:", error);
    
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Actualizar perfil del usuario
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(options);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    const { name, phoneNumber } = data;
    
    // Validación básica
    if (phoneNumber && !phoneNumber.match(/^\+[0-9]{10,15}$/)) {
      return NextResponse.json(
        { error: "Formato de número inválido. Debe incluir código de país con '+' (ej: +34612345678)" },
        { status: 400 }
      );
    }
    
    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        name,
        phoneNumber 
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
      },
    });
    
    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("Error al actualizar perfil de usuario:", error);
    
    return NextResponse.json(
      { error: "Error al actualizar el perfil" },
      { status: 500 }
    );
  }
} 