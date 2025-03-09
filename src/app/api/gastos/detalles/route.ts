import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"

export async function POST(request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(options)
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    // Obtener datos de la solicitud
    const { gastoId, productos } = await request.json()
    
    if (!gastoId || !productos || !Array.isArray(productos) || productos.length === 0) {
      return NextResponse.json(
        { error: "Datos inválidos. Se requiere gastoId y un array de productos." },
        { status: 400 }
      )
    }

    // Verificar que el gasto existe y pertenece al usuario
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email || "" }
    })
    
    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }
    
    const gasto = await prisma.gasto.findUnique({
      where: { id: parseInt(gastoId) }
    })
    
    if (!gasto) {
      return NextResponse.json(
        { error: "Gasto no encontrado" },
        { status: 404 }
      )
    }
    
    // Si el gasto pertenece a un grupo, verificar que el usuario es miembro
    if (gasto.grupoId) {
      const esMiembro = await prisma.grupoMiembro.findFirst({
        where: {
          grupoId: gasto.grupoId,
          userId: usuario.id
        }
      })
      
      if (!gasto.userId && !esMiembro) {
        return NextResponse.json(
          { error: "No tienes permisos para modificar este gasto" },
          { status: 403 }
        )
      }
    } 
    // Si no es de grupo, verificar que sea del usuario
    else if (gasto.userId !== usuario.id) {
      return NextResponse.json(
        { error: "No tienes permisos para modificar este gasto" },
        { status: 403 }
      )
    }

    // Crear los detalles de productos
    const detallesCreados = []
    let totalAdicional = 0
    
    for (const producto of productos) {
      const { descripcion, cantidad, precioUnitario, subtotal } = producto
      
      // Validar datos mínimos necesarios
      if (!descripcion || !subtotal) {
        console.warn("Producto con datos incompletos:", producto)
        continue
      }
      
      const detalle = await prisma.gastoDetalle.create({
        data: {
          gastoId: parseInt(gastoId),
          descripcion,
          cantidad: cantidad || 1,
          precioUnitario: precioUnitario || null,
          subtotal
        }
      })
      
      detallesCreados.push(detalle)
      totalAdicional += subtotal
    }

    // Actualizar el monto total del gasto
    if (totalAdicional > 0) {
      // Obtener el gasto actual
      const gastoActual = await prisma.gasto.findUnique({
        where: { id: parseInt(gastoId) }
      })
      
      if (gastoActual) {
        // Actualizar el monto del gasto
        await prisma.gasto.update({
          where: { id: parseInt(gastoId) },
          data: {
            monto: gastoActual.monto + totalAdicional
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      detalles: detallesCreados
    })
  } catch (error) {
    console.error("Error al guardar detalles de gasto:", error)
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    )
  }
} 