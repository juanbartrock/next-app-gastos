import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'

// ✅ VALIDAR Y APLICAR CÓDIGO PROMOCIONAL
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { codigo } = body

    if (!codigo || typeof codigo !== 'string') {
      return NextResponse.json({ 
        error: 'Código promocional requerido',
        valido: false
      }, { status: 400 })
    }

    // Buscar el código promocional
    const codigoPromocional = await prisma.codigoPromocional.findUnique({
      where: { codigo: codigo.toUpperCase() },
      include: {
        plan: true,
        usos: {
          where: { userId: session.user.id }
        }
      }
    })

    if (!codigoPromocional) {
      return NextResponse.json({
        error: 'Código promocional no encontrado',
        valido: false
      }, { status: 404 })
    }

    // Validaciones del código
    const ahora = new Date()

    // 1. Verificar si está activo
    if (!codigoPromocional.activo) {
      return NextResponse.json({
        error: 'Este código promocional no está activo',
        valido: false
      }, { status: 400 })
    }

    // 2. Verificar si ha expirado
    if (codigoPromocional.fechaVencimiento && codigoPromocional.fechaVencimiento < ahora) {
      return NextResponse.json({
        error: 'Este código promocional ha expirado',
        valido: false,
        fechaVencimiento: codigoPromocional.fechaVencimiento
      }, { status: 400 })
    }

    // 3. Verificar si ya fue usado por este usuario
    if (codigoPromocional.usos.length > 0) {
      return NextResponse.json({
        error: 'Ya has usado este código promocional anteriormente',
        valido: false
      }, { status: 400 })
    }

    // 4. Verificar límite de usos
    if (codigoPromocional.usosMaximos && codigoPromocional.usosActuales >= codigoPromocional.usosMaximos) {
      return NextResponse.json({
        error: 'Este código promocional ha alcanzado su límite de usos',
        valido: false,
        usosRestantes: 0
      }, { status: 400 })
    }

    // 5. Verificar si el usuario ya tiene una suscripción activa al mismo plan
    const suscripcionExistente = await prisma.suscripcion.findFirst({
      where: {
        userId: session.user.id,
        planId: codigoPromocional.planId,
        estado: 'activa'
      }
    })

    if (suscripcionExistente) {
      return NextResponse.json({
        error: `Ya tienes una suscripción activa al plan ${codigoPromocional.plan.nombre}`,
        valido: false
      }, { status: 400 })
    }

    // ✅ El código es válido - APLICAR
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Crear suscripción
      const fechaInicio = new Date()
      let fechaVencimiento = null
      
      if (codigoPromocional.duracionMeses) {
        fechaVencimiento = new Date()
        fechaVencimiento.setMonth(fechaVencimiento.getMonth() + codigoPromocional.duracionMeses)
      }

      const nuevaSuscripcion = await tx.suscripcion.create({
        data: {
          userId: session.user.id,
          planId: codigoPromocional.planId,
          fechaInicio,
          fechaVencimiento,
          estado: 'activa',
          metodoPago: 'codigo_promocional',
          referenciaPago: codigo.toUpperCase(),
          autoRenovacion: !codigoPromocional.esPermanente,
          montoMensual: 0, // Gratuito por el código
          montoTotal: 0,
          observaciones: `Aplicado código promocional: ${codigo.toUpperCase()} - ${codigoPromocional.descripcion}`
        }
      })

      // 2. Actualizar plan del usuario
      await tx.user.update({
        where: { id: session.user.id },
        data: { planId: codigoPromocional.planId }
      })

      // 3. Registrar uso del código
      await tx.usoCodigoPromocional.create({
        data: {
          codigoPromocionalId: codigoPromocional.id,
          userId: session.user.id,
          suscripcionId: nuevaSuscripcion.id,
          ipAddress: request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      })

      // 4. Incrementar contador de usos
      await tx.codigoPromocional.update({
        where: { id: codigoPromocional.id },
        data: { usosActuales: { increment: 1 } }
      })

      return { nuevaSuscripcion, codigoPromocional }
    })

    // Respuesta exitosa
    return NextResponse.json({
      valido: true,
      aplicado: true,
      mensaje: `¡Código aplicado exitosamente! Ahora tienes acceso al plan ${codigoPromocional.plan.nombre}`,
      detalles: {
        planNombre: codigoPromocional.plan.nombre,
        planId: codigoPromocional.planId,
        duracionMeses: codigoPromocional.duracionMeses,
        esPermanente: codigoPromocional.esPermanente,
        fechaVencimiento: resultado.nuevaSuscripcion.fechaVencimiento,
        descripcion: codigoPromocional.descripcion
      },
      suscripcionId: resultado.nuevaSuscripcion.id
    })

  } catch (error) {
    console.error('Error validando código promocional:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      valido: false
    }, { status: 500 })
  }
}

// ✅ VERIFICAR CÓDIGO SIN APLICAR (solo validación)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const url = new URL(request.url)
    const codigo = url.searchParams.get('codigo')

    if (!codigo) {
      return NextResponse.json({ 
        error: 'Código promocional requerido',
        valido: false
      }, { status: 400 })
    }

    // Buscar y validar el código
    const codigoPromocional = await prisma.codigoPromocional.findUnique({
      where: { codigo: codigo.toUpperCase() },
      include: {
        plan: true,
        usos: {
          where: { userId: session.user.id }
        }
      }
    })

    if (!codigoPromocional) {
      return NextResponse.json({
        valido: false,
        error: 'Código no encontrado'
      })
    }

    const ahora = new Date()
    let esValido = true
    let razonInvalido = null

    // Validaciones
    if (!codigoPromocional.activo) {
      esValido = false
      razonInvalido = 'Código inactivo'
    } else if (codigoPromocional.fechaVencimiento && codigoPromocional.fechaVencimiento < ahora) {
      esValido = false
      razonInvalido = 'Código expirado'
    } else if (codigoPromocional.usos.length > 0) {
      esValido = false
      razonInvalido = 'Ya utilizado por este usuario'
    } else if (codigoPromocional.usosMaximos && codigoPromocional.usosActuales >= codigoPromocional.usosMaximos) {
      esValido = false
      razonInvalido = 'Límite de usos alcanzado'
    }

    return NextResponse.json({
      valido: esValido,
      ...(esValido ? {
        planNombre: codigoPromocional.plan.nombre,
        descripcion: codigoPromocional.descripcion,
        duracionMeses: codigoPromocional.duracionMeses,
        esPermanente: codigoPromocional.esPermanente,
        usosRestantes: codigoPromocional.usosMaximos ? 
          (codigoPromocional.usosMaximos - codigoPromocional.usosActuales) : 
          null,
        fechaVencimiento: codigoPromocional.fechaVencimiento
      } : {
        error: razonInvalido
      })
    })

  } catch (error) {
    console.error('Error verificando código promocional:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      valido: false
    }, { status: 500 })
  }
} 