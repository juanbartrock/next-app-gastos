import { NextResponse } from 'next/server'
import prisma, { executeWithTimeout } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'

// GET - Obtener todos los gastos recurrentes del usuario
export async function GET() {
  try {
    const session = await getServerSession(options)
    
    // Si no hay un usuario autenticado, devolver error
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    
    // Buscar al usuario por email con timeout
    const usuario = await executeWithTimeout(async () => {
      return await prisma.user.findUnique({
        where: { email: session.user.email! }
      })
    }, 10000, 3)
    
    // Si no se encuentra al usuario, devolver error
    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }
    
    // Obtener los gastos recurrentes del usuario con timeout
    const gastosRecurrentes = await executeWithTimeout(async () => {
      return await prisma.gastoRecurrente.findMany({
        where: { userId: usuario.id },
        include: {
          categoria: {
            select: {
              id: true,
              descripcion: true
            }
          },
          gastosGenerados: {
            select: {
              id: true,
              concepto: true,
              monto: true,
              fecha: true,
              tipoTransaccion: true,
              tipoMovimiento: true
            },
            orderBy: { createdAt: 'desc' },
            take: 3 // Últimos 3 gastos generados para vista previa
          }
        },
        orderBy: {
          proximaFecha: 'asc'
        },
        take: 100 // Límite de seguridad
      })
    }, 15000, 3)
    
    return NextResponse.json(gastosRecurrentes)
  } catch (error) {
    console.error('Error al obtener gastos recurrentes:', error)
    return NextResponse.json(
      { error: 'Error al obtener los gastos recurrentes' },
      { status: 500 }
    )
  }
}

// POST - Crear un nuevo gasto recurrente
export async function POST(request: Request) {
  try {
    const session = await getServerSession(options)
    
    // Si no hay un usuario autenticado, devolver error
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    
    // Buscar al usuario por email
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { plan: true }
    })
    
    // Si no se encuentra al usuario, devolver error
    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // ✅ VALIDAR LÍMITES ANTES DE CREAR
    try {
      const { validateLimit } = await import('@/lib/plan-limits')
      const validacionRecurrentes = await validateLimit(usuario.id, 'gastos_recurrentes')
      
      if (!validacionRecurrentes.allowed) {
        return NextResponse.json({
          error: 'Límite de gastos recurrentes alcanzado',
          codigo: 'LIMIT_REACHED',
          limite: validacionRecurrentes.limit,
          uso: validacionRecurrentes.usage,
          upgradeRequired: true,
          mensaje: `Has alcanzado el límite de ${validacionRecurrentes.limit} gastos recurrentes. Upgrade al Plan Básico para más gastos recurrentes.`,
          planActual: usuario.plan?.nombre || 'Sin plan'
        }, { status: 403 })
      }
    } catch (limitError) {
      console.error('Error validando límites (no crítico):', limitError)
      // Continuar con la creación si no se puede validar límites
    }
    
    // Obtener los datos del request
    const { 
      concepto, 
      periodicidad, 
      monto, 
      comentario, 
      estado, 
      categoriaId,
      proximaFecha,
      tipoMovimiento,
      esServicio,
      medioPago
    } = await request.json()
    
    // Verificar datos obligatorios
    if (!concepto || !periodicidad || !monto) {
      return NextResponse.json(
        { error: 'Faltan datos obligatorios' },
        { status: 400 }
      )
    }

    // Verificar que la categoría existe si se proporciona un ID
    if (categoriaId) {
      const categoriaExiste = await prisma.categoria.findUnique({
        where: { id: categoriaId }
      })
      
      if (!categoriaExiste) {
        return NextResponse.json(
          { error: 'La categoría seleccionada no existe' },
          { status: 400 }
        )
      }
    }
    
    // Crear el gasto recurrente directamente (sin transacción compleja para evitar timeouts)
    const gastoRecurrente = await prisma.gastoRecurrente.create({
      data: {
        concepto,
        periodicidad,
        monto: Number(monto),
        comentario,
        estado: estado || 'pendiente',
        tipoMovimiento: tipoMovimiento || 'efectivo',
        proximaFecha: proximaFecha ? new Date(proximaFecha) : null,
        userId: usuario.id,
        esServicio: esServicio || false,
        ...(categoriaId && { categoriaId: Number(categoriaId) })
      }
    })
    
    // Si se marca como servicio, crear el servicio asociado (por separado para evitar timeout)
    if (esServicio) {
      try {
        // Verificar si ya existe un servicio con el mismo nombre
        const servicioExistente = await prisma.servicio.findFirst({
          where: {
            userId: usuario.id,
            nombre: concepto,
            generaRecurrente: true
          }
        })
        
        if (!servicioExistente) {
          // Crear el servicio
          const servicio = await prisma.servicio.create({
            data: {
              nombre: concepto,
              descripcion: `Servicio generado automáticamente desde gasto recurrente: ${concepto}`,
              monto: Number(monto),
              medioPago: medioPago || "efectivo",
              fechaCobro: proximaFecha ? new Date(proximaFecha) : null,
              generaRecurrente: true,
              userId: usuario.id
            }
          })
          
          // Actualizar el gasto recurrente con la relación al servicio
          await prisma.gastoRecurrente.update({
            where: { id: gastoRecurrente.id },
            data: { servicioId: servicio.id }
          })
        }
      } catch (servicioError) {
        console.error('Error al crear servicio asociado (no crítico):', servicioError)
        // No fallar la creación del gasto recurrente por un error en el servicio
      }
    }
    
    return NextResponse.json(gastoRecurrente)
  } catch (error) {
    console.error('Error al crear gasto recurrente:', error)
    return NextResponse.json(
      { error: 'Error al crear el gasto recurrente' },
      { status: 500 }
    )
  }
} 