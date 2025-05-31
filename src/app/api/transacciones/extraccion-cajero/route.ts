import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Buscar usuario por email
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    const { monto, fecha, descripcion } = await request.json()

    if (!monto || monto <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser mayor a 0' },
        { status: 400 }
      )
    }

    // Verificar que existe la categoría "Transferencias" o crearla
    let categoriaTransferencias = await prisma.categoria.findFirst({
      where: { descripcion: "Transferencias" }
    })

    if (!categoriaTransferencias) {
      categoriaTransferencias = await prisma.categoria.create({
        data: {
          descripcion: "Transferencias",
          grupo_categoria: "Operaciones Bancarias",
          status: true
        }
      })
    }

    const fechaOperacion = fecha ? new Date(fecha) : new Date()
    const conceptoBase = descripcion || "Extracción de Cajero"

    // Usar transacción de Prisma para atomicidad
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Registrar EGRESO en Digital (dinero que sale del banco)
      const egresoDigital = await tx.gasto.create({
        data: {
          concepto: `${conceptoBase} - Debito Digital`,
          monto: monto,
          categoria: categoriaTransferencias.descripcion,
          categoriaId: categoriaTransferencias.id,
          tipoTransaccion: "expense",
          tipoMovimiento: "digital",
          fecha: fechaOperacion,
          userId: usuario.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // 2. Registrar INGRESO en Efectivo (dinero físico recibido)
      const ingresoEfectivo = await tx.gasto.create({
        data: {
          concepto: `${conceptoBase} - Efectivo Recibido`,
          monto: monto,
          categoria: categoriaTransferencias.descripcion,
          categoriaId: categoriaTransferencias.id,
          tipoTransaccion: "income",
          tipoMovimiento: "efectivo",
          fecha: fechaOperacion,
          userId: usuario.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      return { egresoDigital, ingresoEfectivo }
    })

    return NextResponse.json({
      success: true,
      message: "Extracción de cajero registrada exitosamente",
      operaciones: [
        {
          id: resultado.egresoDigital.id,
          tipo: "egreso_digital",
          monto: resultado.egresoDigital.monto,
          concepto: resultado.egresoDigital.concepto
        },
        {
          id: resultado.ingresoEfectivo.id,
          tipo: "ingreso_efectivo", 
          monto: resultado.ingresoEfectivo.monto,
          concepto: resultado.ingresoEfectivo.concepto
        }
      ]
    })

  } catch (error) {
    console.error('Error en extracción de cajero:', error)
    return NextResponse.json(
      { error: 'Error al procesar la extracción de cajero' },
      { status: 500 }
    )
  }
} 