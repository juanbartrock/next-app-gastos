import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Verificar sesión
    const session = await getServerSession(options)
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { params } = context
    const detalleId = parseInt(params.id)
    
    if (isNaN(detalleId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      )
    }

    // Obtener el detalle para verificar el gasto al que pertenece
    const detalle = await prisma.gastoDetalle.findUnique({
      where: { id: detalleId },
      include: { gasto: true }
    })
    
    if (!detalle) {
      return NextResponse.json(
        { error: "Detalle no encontrado" },
        { status: 404 }
      )
    }

    // Verificar si el usuario tiene permisos para modificar este gasto
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email || "" }
    })
    
    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }
    
    // Si el gasto pertenece a un grupo, verificar que el usuario es miembro
    if (detalle.gasto.grupoId) {
      const esMiembro = await prisma.grupoMiembro.findFirst({
        where: {
          grupoId: detalle.gasto.grupoId,
          userId: usuario.id
        }
      })
      
      if (!detalle.gasto.userId && !esMiembro) {
        return NextResponse.json(
          { error: "No tienes permisos para modificar este gasto" },
          { status: 403 }
        )
      }
    } 
    // Si no es de grupo, verificar que sea del usuario
    else if (detalle.gasto.userId !== usuario.id) {
      return NextResponse.json(
        { error: "No tienes permisos para modificar este gasto" },
        { status: 403 }
      )
    }

    // Eliminar el detalle y actualizar el monto del gasto
    try {
      // Primero, guardamos el monto del detalle que vamos a eliminar
      const montoDetalle = detalle.subtotal || 0;

      // Eliminar el detalle
      await prisma.gastoDetalle.delete({
        where: { id: detalleId }
      });

      // Actualizar el monto del gasto restando el monto del detalle eliminado
      if (montoDetalle > 0) {
        const nuevoMonto = Math.max(0, detalle.gasto.monto - montoDetalle);
        await prisma.gasto.update({
          where: { id: detalle.gastoId },
          data: {
            monto: nuevoMonto
          }
        });
      }

      return NextResponse.json({
        success: true,
        message: "Detalle eliminado correctamente"
      });
    } catch (error) {
      console.error("Error al eliminar detalle:", error);
      return NextResponse.json(
        { error: "Error al eliminar el detalle" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error al eliminar detalle:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
} 