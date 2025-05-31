import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(options)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    const gasto = await prisma.gasto.findFirst({
      where: {
        id: parseInt(params.id),
        userId: usuario.id
      },
      include: {
        categoriaRel: {
          select: {
            id: true,
            descripcion: true,
            grupo_categoria: true
          }
        },
        financiacion: true,
        detalles: true
      }
    })

    if (!gasto) {
      return NextResponse.json(
        { error: 'Gasto no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(gasto)
  } catch (error) {
    console.error('Error al obtener gasto:', error)
    return NextResponse.json(
      { error: 'Error al obtener el gasto' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(options)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    const { 
      concepto, 
      monto, 
      categoria, 
      categoriaId, 
      tipoTransaccion, 
      tipoMovimiento, 
      fecha, 
      fechaImputacion,  // Nuevo campo para imputación contable
      incluirEnFamilia 
    } = await request.json()

    // Verificar que el gasto existe y pertenece al usuario
    const gastoExistente = await prisma.gasto.findFirst({
      where: {
        id: parseInt(params.id),
        userId: usuario.id
      }
    })

    if (!gastoExistente) {
      return NextResponse.json(
        { error: 'Gasto no encontrado o no autorizado' },
        { status: 404 }
      )
    }

    // Verificar que la categoría existe si se proporciona un ID
    let categoriaExiste = null
    let nombreCategoria = categoria;
    
    if (categoriaId) {
      categoriaExiste = await prisma.categoria.findUnique({
        where: { id: Number(categoriaId) }
      });
      
      if (!categoriaExiste) {
        return NextResponse.json(
          { error: 'La categoría seleccionada no existe' },
          { status: 400 }
        )
      }
      
      if (categoriaExiste && !categoria) {
        nombreCategoria = categoriaExiste.descripcion;
      }
    }

    // Procesar fecha de imputación
    let fechaImputacionProcessed = null;
    if (fechaImputacion) {
      try {
        fechaImputacionProcessed = new Date(fechaImputacion);
        if (isNaN(fechaImputacionProcessed.getTime())) {
          fechaImputacionProcessed = null;
        }
      } catch (error) {
        fechaImputacionProcessed = null;
      }
    }

    // Procesar fecha principal
    let fechaProcessed = gastoExistente.fecha; // Mantener la original si no se proporciona
    if (fecha) {
      try {
        fechaProcessed = new Date(fecha);
        if (isNaN(fechaProcessed.getTime())) {
          fechaProcessed = gastoExistente.fecha;
        }
      } catch (error) {
        fechaProcessed = gastoExistente.fecha;
      }
    }

    const gastoActualizado = await prisma.gasto.update({
      where: { id: parseInt(params.id) },
      data: {
        concepto: concepto || gastoExistente.concepto,
        monto: monto !== undefined ? Number(monto) : gastoExistente.monto,
        categoria: nombreCategoria || gastoExistente.categoria,
        tipoTransaccion: tipoTransaccion || gastoExistente.tipoTransaccion,
        tipoMovimiento: tipoMovimiento || gastoExistente.tipoMovimiento,
        fecha: fechaProcessed,
        fechaImputacion: fechaImputacion !== undefined ? fechaImputacionProcessed : gastoExistente.fechaImputacion,
        incluirEnFamilia: incluirEnFamilia !== undefined ? Boolean(incluirEnFamilia) : gastoExistente.incluirEnFamilia,
        updatedAt: new Date(),
        ...(categoriaId && { categoriaId: Number(categoriaId) })
      },
      include: {
        categoriaRel: {
          select: {
            id: true,
            descripcion: true,
            grupo_categoria: true
          }
        }
      }
    })

    return NextResponse.json(gastoActualizado)
  } catch (error) {
    console.error('Error al actualizar gasto:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el gasto' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(options)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el gasto existe y pertenece al usuario
    const gastoExistente = await prisma.gasto.findFirst({
      where: {
        id: parseInt(params.id),
        userId: usuario.id
      }
    })

    if (!gastoExistente) {
      return NextResponse.json(
        { error: 'Gasto no encontrado o no autorizado' },
        { status: 404 }
      )
    }

    // Eliminar el gasto (Prisma se encarga de eliminar financiaciones y detalles por cascade)
    await prisma.gasto.delete({
      where: { id: parseInt(params.id) }
    })

    return NextResponse.json({ message: 'Gasto eliminado correctamente' })
  } catch (error) {
    console.error('Error al eliminar gasto:', error)
    return NextResponse.json(
      { error: 'Error al eliminar el gasto' },
      { status: 500 }
    )
  }
} 