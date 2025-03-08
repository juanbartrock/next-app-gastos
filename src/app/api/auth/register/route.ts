import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    console.log("Iniciando proceso de registro")
    
    const body = await req.json()
    console.log("Datos recibidos:", { ...body, password: '[REDACTED]' })
    
    const { name, email, password, phoneNumber } = body

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

    // Hash de la contraseña
    console.log("Generando hash de la contraseña")
    const hashedPassword = await bcrypt.hash(password, 12)

    // Crear el usuario
    console.log("Intentando crear usuario en la base de datos")
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phoneNumber,
      },
    })

    console.log("Usuario creado exitosamente:", { id: user.id, email: user.email })

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