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
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Error al obtener perfil de usuario:", error);
    
    return NextResponse.json(
      { error: "Error al obtener el perfil" },
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