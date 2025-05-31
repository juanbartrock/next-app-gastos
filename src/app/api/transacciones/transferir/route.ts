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

    // Buscar usuario emisor por email
    const usuarioEmisor = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!usuarioEmisor) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    const { 
      monto, 
      tipoTransferencia, 
      destinatarioUserId, 
      destinatarioNombre, 
      concepto, 
      tipoMovimiento, 
      fecha 
    } = await request.json()

    // Validaciones
    if (!monto || monto <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser mayor a 0' },
        { status: 400 }
      )
    }

    if (!tipoTransferencia || !['interna', 'externa'].includes(tipoTransferencia)) {
      return NextResponse.json(
        { error: 'Tipo de transferencia inválido' },
        { status: 400 }
      )
    }

    if (!concepto || concepto.trim() === '') {
      return NextResponse.json(
        { error: 'El concepto es obligatorio' },
        { status: 400 }
      )
    }

    if (!tipoMovimiento || !['efectivo', 'digital', 'ahorro'].includes(tipoMovimiento)) {
      return NextResponse.json(
        { error: 'Tipo de movimiento inválido' },
        { status: 400 }
      )
    }

    // Validaciones específicas para transferencia interna
    if (tipoTransferencia === 'interna') {
      if (!destinatarioUserId) {
        return NextResponse.json(
          { error: 'Para transferencias internas se requiere el ID del destinatario' },
          { status: 400 }
        )
      }

      // Verificar que el destinatario existe y no es el mismo emisor
      const usuarioDestinatario = await prisma.user.findUnique({
        where: { id: destinatarioUserId }
      })

      if (!usuarioDestinatario) {
        return NextResponse.json(
          { error: 'Usuario destinatario no encontrado' },
          { status: 404 }
        )
      }

      if (destinatarioUserId === usuarioEmisor.id) {
        return NextResponse.json(
          { error: 'No puedes transferir a ti mismo' },
          { status: 400 }
        )
      }
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

    // Usar transacción de Prisma para atomicidad
    const resultado = await prisma.$transaction(async (tx) => {
      const operaciones = []

      // SIEMPRE registrar el EGRESO para el emisor
      const egresoEmisor = await tx.gasto.create({
        data: {
          concepto: `Transferencia ${tipoTransferencia}: ${concepto}`,
          monto: monto,
          categoria: categoriaTransferencias.descripcion,
          categoriaId: categoriaTransferencias.id,
          tipoTransaccion: "expense",
          tipoMovimiento: tipoMovimiento,
          fecha: fechaOperacion,
          userId: usuarioEmisor.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      operaciones.push({
        id: egresoEmisor.id,
        tipo: "egreso_emisor",
        userId: usuarioEmisor.id,
        userName: usuarioEmisor.name,
        monto: egresoEmisor.monto,
        concepto: egresoEmisor.concepto
      })

      // Si es transferencia INTERNA, también registrar el INGRESO para el destinatario
      if (tipoTransferencia === 'interna' && destinatarioUserId) {
        const usuarioDestinatario = await tx.user.findUnique({
          where: { id: destinatarioUserId }
        })

        const ingresoDestinatario = await tx.gasto.create({
          data: {
            concepto: `Transferencia recibida de ${usuarioEmisor.name || usuarioEmisor.email}: ${concepto}`,
            monto: monto,
            categoria: categoriaTransferencias.descripcion,
            categoriaId: categoriaTransferencias.id,
            tipoTransaccion: "income",
            tipoMovimiento: tipoMovimiento,
            fecha: fechaOperacion,
            userId: destinatarioUserId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })

        operaciones.push({
          id: ingresoDestinatario.id,
          tipo: "ingreso_destinatario",
          userId: destinatarioUserId,
          userName: usuarioDestinatario?.name,
          monto: ingresoDestinatario.monto,
          concepto: ingresoDestinatario.concepto
        })
      }

      return operaciones
    })

    const response = {
      success: true,
      message: tipoTransferencia === 'interna' 
        ? "Transferencia interna registrada exitosamente" 
        : "Transferencia externa registrada exitosamente",
      tipoTransferencia,
      destinatario: tipoTransferencia === 'interna' ? null : destinatarioNombre,
      operaciones: resultado
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error en transferencia:', error)
    return NextResponse.json(
      { error: 'Error al procesar la transferencia' },
      { status: 500 }
    )
  }
}

// Endpoint GET para obtener usuarios disponibles para transferencias internas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener todos los usuarios excepto el actual
    const usuarios = await prisma.user.findMany({
      where: {
        NOT: {
          email: session.user.email
        }
      },
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(usuarios)

  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    return NextResponse.json(
      { error: 'Error al obtener la lista de usuarios' },
      { status: 500 }
    )
  }
} 