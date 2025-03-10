import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

// Verificar que el usuario sea administrador (mismo método que en planes)
async function isAdmin(userId: string) {
  // Por ahora, solo para pruebas, asumimos que cualquier usuario puede acceder
  return true;
}

// Obtener todas las relaciones de servicios y planes
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
    
    // Obtener todas las relaciones entre servicios y planes
    const serviciosPlanes = await prisma.servicioPlan.findMany({
      select: {
        planId: true,
        servicioId: true,
        activo: true,
      },
    });
    
    return NextResponse.json({ serviciosPlanes });
  } catch (error: any) {
    console.error("Error al obtener servicios-planes:", error);
    
    return NextResponse.json(
      { error: "Error al obtener las relaciones de servicios y planes" },
      { status: 500 }
    );
  }
}

// Actualizar las relaciones de servicios y planes
export async function PUT(request: NextRequest) {
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
    const { serviciosPlanes } = data;
    
    if (!serviciosPlanes || !Array.isArray(serviciosPlanes)) {
      return NextResponse.json(
        { error: "Formato de datos inválido" },
        { status: 400 }
      );
    }
    
    // Actualizamos cada relación una por una
    const resultados = await Promise.all(
      serviciosPlanes.map(async (sp) => {
        const { planId, servicioId, activo } = sp;
        
        // Buscar si ya existe la relación
        const existeRelacion = await prisma.servicioPlan.findFirst({
          where: {
            planId,
            servicioId,
          },
        });
        
        if (existeRelacion) {
          // Actualizar relación existente
          return prisma.servicioPlan.update({
            where: {
              id: existeRelacion.id,
            },
            data: {
              activo,
            },
          });
        } else {
          // Crear nueva relación
          return prisma.servicioPlan.create({
            data: {
              planId,
              servicioId,
              activo,
            },
          });
        }
      })
    );
    
    return NextResponse.json({ success: true, count: resultados.length });
  } catch (error: any) {
    console.error("Error al actualizar servicios-planes:", error);
    
    return NextResponse.json(
      { error: "Error al actualizar las relaciones de servicios y planes" },
      { status: 500 }
    );
  }
} 