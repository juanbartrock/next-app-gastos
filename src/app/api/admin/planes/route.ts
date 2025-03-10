import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

// Verificar que el usuario sea administrador
async function isAdmin(userId: string) {
  // Aquí deberías implementar tu lógica de verificación de admin
  // Por simplicidad, podemos asumir que hay un campo admin en el usuario
  // o verificar si el usuario tiene un correo específico de administrador
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  
  // Por ahora, solo para pruebas, asumimos que cualquier usuario puede acceder
  return true;
}

// Obtener todos los planes
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
    
    // Si no hay planes, crear los planes por defecto
    const planesCount = await prisma.plan.count();
    
    if (planesCount === 0) {
      // Crear planes por defecto
      await prisma.plan.createMany({
        data: [
          {
            nombre: "Gratuito",
            descripcion: "Plan básico con funcionalidades limitadas",
            esPago: false,
          },
          {
            nombre: "Premium",
            descripcion: "Plan completo con todas las funcionalidades",
            esPago: true,
            precioMensual: 9.99,
          },
        ],
      });
    }
    
    // Obtener todos los planes
    const planes = await prisma.plan.findMany({
      orderBy: { esPago: 'asc' },
    });
    
    return NextResponse.json({ planes });
  } catch (error: any) {
    console.error("Error al obtener planes:", error);
    
    return NextResponse.json(
      { error: "Error al obtener los planes" },
      { status: 500 }
    );
  }
}

// Crear o actualizar planes
export async function POST(request: NextRequest) {
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
    const { id, nombre, descripcion, esPago, precioMensual } = data;
    
    // Validación básica
    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre del plan es obligatorio" },
        { status: 400 }
      );
    }
    
    let plan;
    
    if (id) {
      // Actualizar plan existente
      plan = await prisma.plan.update({
        where: { id },
        data: {
          nombre,
          descripcion,
          esPago,
          precioMensual: esPago ? precioMensual : null,
        },
      });
    } else {
      // Crear nuevo plan
      plan = await prisma.plan.create({
        data: {
          nombre,
          descripcion,
          esPago,
          precioMensual: esPago ? precioMensual : null,
        },
      });
    }
    
    return NextResponse.json({ plan });
  } catch (error: any) {
    console.error("Error al crear/actualizar plan:", error);
    
    return NextResponse.json(
      { error: "Error al crear o actualizar el plan" },
      { status: 500 }
    );
  }
} 