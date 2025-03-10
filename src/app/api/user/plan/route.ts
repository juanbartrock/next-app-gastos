import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

// Obtener plan del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(options);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }
    
    // Buscar el usuario con su plan
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        plan: true,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }
    
    // Si el usuario no tiene un plan asignado, asignarle el plan gratuito por defecto
    if (!user.plan) {
      // Buscar el plan gratuito (asumiendo que existe)
      const planGratuito = await prisma.plan.findFirst({
        where: { esPago: false },
      });
      
      // Si no existe, crearlo
      if (!planGratuito) {
        const nuevoPlanGratuito = await prisma.plan.create({
          data: {
            nombre: "Gratuito",
            descripcion: "Plan básico con funcionalidades limitadas",
            esPago: false,
          },
        });
        
        // Asignar el plan gratuito al usuario
        await prisma.user.update({
          where: { id: user.id },
          data: { planId: nuevoPlanGratuito.id },
        });
        
        return NextResponse.json({ plan: nuevoPlanGratuito });
      }
      
      // Asignar el plan gratuito existente al usuario
      await prisma.user.update({
        where: { id: user.id },
        data: { planId: planGratuito.id },
      });
      
      return NextResponse.json({ plan: planGratuito });
    }
    
    return NextResponse.json({ plan: user.plan });
  } catch (error: any) {
    console.error("Error al obtener el plan del usuario:", error);
    
    return NextResponse.json(
      { error: "Error al obtener el plan" },
      { status: 500 }
    );
  }
}

// Actualizar plan del usuario
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
    const { planId } = data;
    
    if (!planId) {
      return NextResponse.json(
        { error: "Se requiere un ID de plan válido" },
        { status: 400 }
      );
    }
    
    // Verificar que el plan exista
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });
    
    if (!plan) {
      return NextResponse.json(
        { error: "Plan no encontrado" },
        { status: 404 }
      );
    }
    
    // Actualizar el plan del usuario
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { planId },
      include: {
        plan: true,
      },
    });
    
    return NextResponse.json({ plan: updatedUser.plan });
  } catch (error: any) {
    console.error("Error al actualizar el plan del usuario:", error);
    
    return NextResponse.json(
      { error: "Error al actualizar el plan" },
      { status: 500 }
    );
  }
} 