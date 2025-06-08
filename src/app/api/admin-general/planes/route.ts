import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'
import { z } from 'zod'

// Schema de validación para crear/actualizar planes
const planSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  esPago: z.boolean().default(false),
  precioMensual: z.number().optional(),
  limitaciones: z.record(z.any()).optional(),
  trialDias: z.number().default(0),
  activo: z.boolean().default(true),
  ordenDisplay: z.number().default(0),
  colorHex: z.string().optional(),
  features: z.string().optional()
})

// GET - Obtener todos los planes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que sea admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    // Obtener planes con estadísticas
    const planes = await prisma.plan.findMany({
      include: {
        usuarios: {
          select: { id: true }
        },
        funcionalidades: {
          include: {
            funcionalidad: true
          }
        },
        _count: {
          select: {
            usuarios: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(planes)
  } catch (error) {
    console.error('Error al obtener planes:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST - Crear nuevo plan
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que sea admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = planSchema.parse(body)

    // Crear el plan
    const nuevoPlan = await prisma.plan.create({
      data: validatedData,
      include: {
        funcionalidades: {
          include: {
            funcionalidad: true
          }
        },
        _count: {
          select: {
            usuarios: true
          }
        }
      }
    })

    // TODO: Registrar auditoría cuando el cliente de Prisma se actualice
    // await prisma.auditoriaAdmin.create({
    //   data: {
    //     adminId: session.user.id,
    //     accion: 'crear_plan',
    //     entidadAfectada: 'plan',
    //     entidadId: nuevoPlan.id,
    //     datosNuevos: validatedData,
    //     descripcion: `Plan creado: ${validatedData.nombre}`,
    //     ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    //   }
    // }).catch(console.error)

    return NextResponse.json(nuevoPlan, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Datos inválidos', 
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Error al crear plan:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PUT - Actualizar plan existente
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que sea admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ error: 'ID del plan requerido' }, { status: 400 })
    }

    const validatedData = planSchema.partial().parse(updateData)

    // Obtener datos anteriores para auditoría
    const planAnterior = await prisma.plan.findUnique({
      where: { id }
    })

    if (!planAnterior) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
    }

    // Actualizar el plan
    const planActualizado = await prisma.plan.update({
      where: { id },
      data: validatedData,
      include: {
        funcionalidades: {
          include: {
            funcionalidad: true
          }
        },
        _count: {
          select: {
            usuarios: true
          }
        }
      }
    })

    // TODO: Registrar auditoría cuando el cliente de Prisma se actualice
    // await prisma.auditoriaAdmin.create({
    //   data: {
    //     adminId: session.user.id,
    //     accion: 'actualizar_plan',
    //     entidadAfectada: 'plan',
    //     entidadId: id,
    //     datosAnteriores: planAnterior,
    //     datosNuevos: validatedData,
    //     descripcion: `Plan actualizado: ${planActualizado.nombre}`,
    //     ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    //   }
    // }).catch(console.error)

    return NextResponse.json(planActualizado)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Datos inválidos', 
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Error al actualizar plan:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 