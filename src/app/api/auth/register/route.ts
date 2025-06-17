import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    console.log("Iniciando proceso de registro")
    
    const body = await req.json()
    console.log("Datos recibidos:", { ...body, password: '[REDACTED]' })
    
    const { name, email, password, phoneNumber, planId } = body

    if (!name || !email || !password) {
      console.log("Faltan campos requeridos:", { name: !!name, email: !!email, password: !!password })
      return NextResponse.json(
        { message: "Faltan campos requeridos" },
        { status: 400 }
      )
    }

    // Verificar si el email ya está registrado
    console.log("Verificando si el email existe:", email)
    console.log("Estado de prisma:", { prismaExists: !!prisma, prismaUser: !!(prisma as any)?.user })
    
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.log("Email ya registrado")
      return NextResponse.json(
        { message: "El email ya está registrado" },
        { status: 400 }
      )
    }

    // Validar y obtener el plan seleccionado
    let planFinal = planId
    if (planId) {
      console.log("Verificando plan seleccionado:", planId)
      const planExists = await prisma.plan.findUnique({
        where: { id: planId }
      })
      
      if (!planExists) {
        console.log("Plan seleccionado no existe, usando plan gratuito por defecto")
        // Si el plan no existe, buscar el plan gratuito
        const planGratuito = await prisma.plan.findFirst({
          where: { esPago: false }
        })
        planFinal = planGratuito?.id || null
      }
    } else {
      console.log("No se especificó plan, buscando plan gratuito por defecto")
      // Si no se especificó plan, asignar el plan gratuito
      const planGratuito = await prisma.plan.findFirst({
        where: { esPago: false }
      })
      planFinal = planGratuito?.id || null
    }

    // Hash de la contraseña
    console.log("Generando hash de la contraseña")
    const hashedPassword = await bcrypt.hash(password, 12)

    // Crear el usuario con el plan asignado
    console.log("Intentando crear usuario en la base de datos con plan:", planFinal)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phoneNumber,
        planId: planFinal,
      },
    })

    console.log("Usuario creado exitosamente:", { id: user.id, email: user.email, planId: user.planId })

    // Si el usuario seleccionó un plan de pago, crear una suscripción pendiente
    if (planFinal) {
      const plan = await prisma.plan.findUnique({
        where: { id: planFinal }
      })

      if (plan?.esPago) {
        console.log("Creando suscripción pendiente para plan de pago")
        await prisma.suscripcion.create({
          data: {
            userId: user.id,
            planId: planFinal,
            estado: 'pendiente',
            metodoPago: 'pendiente_pago',
            referenciaPago: 'registro_inicial',
            autoRenovacion: false,
            montoMensual: plan.precioMensual || 0,
            montoTotal: plan.precioMensual || 0,
            observaciones: 'Suscripción creada durante el registro - Pendiente de pago'
          }
        })
      } else {
        console.log("Creando suscripción activa para plan gratuito")
        await prisma.suscripcion.create({
          data: {
            userId: user.id,
            planId: planFinal,
            estado: 'activa',
            metodoPago: 'gratuito',
            referenciaPago: 'plan_gratuito',
            autoRenovacion: false,
            montoMensual: 0,
            montoTotal: 0,
            observaciones: 'Plan gratuito activado automáticamente'
          }
        })
      }
    }

    // Eliminar la contraseña del objeto de respuesta
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      {
        message: "Usuario registrado correctamente",
        user: userWithoutPassword,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error detallado al registrar usuario:", {
      error,
      message: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // Manejar errores específicos de Prisma
    if (error instanceof Error && error.message.includes('Prisma')) {
      return NextResponse.json(
        { message: "Error de base de datos al registrar usuario" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: "Error al registrar usuario" },
      { status: 500 }
    )
  }
} 