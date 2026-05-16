import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";
import { initializeDatabase } from "@/lib/dbSetup";

// Endpoint para inicializar la base de datos
export async function GET(request: NextRequest) {
  const session = await getServerSession(options);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });

  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Sin permisos de administrador" }, { status: 401 });
  }

  try {
    console.log("Iniciando configuración de la base de datos desde API");

    // Llamar a la función de inicialización
    await initializeDatabase();
    
    return NextResponse.json({ 
      success: true, 
      message: "Base de datos inicializada correctamente" 
    });
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Error al inicializar la base de datos", 
        error: String(error) 
      },
      { status: 500 }
    );
  }
} 