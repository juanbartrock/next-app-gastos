import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"
import prisma from "@/lib/prisma"

// GET - Obtener todos los préstamos del usuario autenticado
export async function GET() {
  try {
    const session = await getServerSession(options)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Buscar al usuario por email
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Obtener todos los préstamos del usuario con sus pagos
    const prestamos = await prisma.prestamo.findMany({
      where: { userId: usuario.id },
      include: {
        pagos: {
          orderBy: { numeroCuota: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(prestamos)
  } catch (error) {
    console.error('Error al obtener préstamos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear un nuevo préstamo
export async function POST(request: Request) {
  try {
    const session = await getServerSession(options)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Buscar al usuario por email
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Obtener los datos del request
    const data = await request.json()
    
    const {
      entidadFinanciera,
      tipoCredito,
      montoSolicitado,
      montoAprobado,
      montoDesembolsado,
      tasaInteres,
      plazoMeses,
      fechaDesembolso,
      fechaPrimeraCuota,
      diaPago,
      proposito,
      garantia,
      seguroVida,
      seguroDesempleo,
      comisiones,
      gastosNotariales,
      numeroCredito,
      observaciones
    } = data

    // Validaciones básicas
    if (!entidadFinanciera || !tipoCredito || !montoAprobado || !tasaInteres || !plazoMeses) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      )
    }

    // Calcular cuota mensual usando fórmula de amortización francesa
    const tasaMensual = tasaInteres / 100 / 12
    const cuotaBase = montoAprobado * (tasaMensual * Math.pow(1 + tasaMensual, plazoMeses)) / 
                     (Math.pow(1 + tasaMensual, plazoMeses) - 1)
    // Agregar 21% de IVA a la cuota
    const cuotaMensual = cuotaBase * 1.21

    // Calcular fecha de vencimiento
    const fechaVencimiento = new Date(fechaPrimeraCuota)
    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + plazoMeses)

    // Crear el préstamo
    const prestamo = await prisma.prestamo.create({
      data: {
        entidadFinanciera,
        tipoCredito,
        montoSolicitado: montoSolicitado || montoAprobado,
        montoAprobado,
        montoDesembolsado: montoDesembolsado || montoAprobado,
        saldoActual: montoAprobado,
        tasaInteres,
        plazoMeses,
        cuotaMensual: Math.round(cuotaMensual * 100) / 100,
        cuotasPagadas: 0,
        cuotasPendientes: plazoMeses,
        fechaDesembolso: new Date(fechaDesembolso),
        fechaPrimeraCuota: new Date(fechaPrimeraCuota),
        fechaProximaCuota: new Date(fechaPrimeraCuota),
        fechaVencimiento,
        diaPago,
        proposito,
        garantia,
        seguroVida: seguroVida || false,
        seguroDesempleo: seguroDesempleo || false,
        comisiones: comisiones || 0,
        gastosNotariales: gastosNotariales || 0,
        numeroCredito,
        observaciones,
        userId: usuario.id
      }
    })

    return NextResponse.json(prestamo, { status: 201 })
  } catch (error) {
    console.error('Error al crear préstamo:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 