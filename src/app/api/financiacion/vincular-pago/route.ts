import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'

// POST - Vincular un pago de tarjeta a múltiples cuotas
export async function POST(request: Request) {
  try {
    const session = await getServerSession(options)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
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
    
    const { pagoGastoId, financiacionIds } = await request.json()
    
    if (!pagoGastoId || !financiacionIds || !Array.isArray(financiacionIds)) {
      return NextResponse.json(
        { error: 'Datos incompletos. Se requiere pagoGastoId y financiacionIds' },
        { status: 400 }
      )
    }
    
    // Validar que el pago existe y pertenece al usuario
    const pagoGasto = await prisma.gasto.findUnique({
      where: { id: pagoGastoId }
    })
    
    if (!pagoGasto) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      )
    }
    
    if (pagoGasto.userId !== usuario.id) {
      return NextResponse.json(
        { error: 'El pago no pertenece al usuario actual' },
        { status: 403 }
      )
    }
    
    // Validar que todas las financiaciones existen y pertenecen al usuario
    const financiaciones = await prisma.financiacion.findMany({
      where: {
        id: { in: financiacionIds },
        userId: usuario.id,
        cuotasRestantes: { gt: 0 } // Solo financiaciones con cuotas pendientes
      },
      include: {
        gasto: true,
        tarjetaInfo: true
      }
    })
    
    if (financiaciones.length !== financiacionIds.length) {
      return NextResponse.json(
        { error: 'Algunas financiaciones no son válidas o no tienen cuotas pendientes' },
        { status: 400 }
      )
    }
    
    // Detectar tarjeta específica del pago
    let tarjetaEspecifica = 'Tarjeta Genérica'
    const concepto = pagoGasto.concepto.toLowerCase()
    
    if (concepto.includes('visa')) {
      if (concepto.includes('macro')) tarjetaEspecifica = 'Visa Macro'
      else if (concepto.includes('ciudad')) tarjetaEspecifica = 'Visa Ciudad'
      else tarjetaEspecifica = 'Visa'
    } else if (concepto.includes('mastercard')) {
      if (concepto.includes('bbva')) tarjetaEspecifica = 'Mastercard BBVA'
      else if (concepto.includes('galicia')) tarjetaEspecifica = 'Mastercard Galicia'
      else tarjetaEspecifica = 'Mastercard'
    } else if (concepto.includes('american express')) {
      tarjetaEspecifica = 'American Express'
    } else if (concepto.includes('naranja')) {
      tarjetaEspecifica = 'Naranja'
    } else if (concepto.includes('cabal')) {
      tarjetaEspecifica = 'Cabal'
    }
    
    // Ejecutar transacción para vincular el pago
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Crear o actualizar el registro de PagoTarjeta
      const pagoTarjeta = await tx.pagoTarjeta.upsert({
        where: { gastoId: pagoGastoId },
        update: {
          concepto: pagoGasto.concepto,
          monto: pagoGasto.monto,
          fecha: pagoGasto.fecha,
          tarjetaEspecifica: tarjetaEspecifica
        },
        create: {
          concepto: pagoGasto.concepto,
          monto: pagoGasto.monto,
          fecha: pagoGasto.fecha,
          tipoMovimiento: pagoGasto.tipoMovimiento,
          tarjetaEspecifica: tarjetaEspecifica,
          userId: usuario.id,
          gastoId: pagoGastoId
        }
      })
      
      // 2. Crear las vinculaciones de cuotas
      const vinculaciones = []
      for (const financiacion of financiaciones) {
        // Verificar que no existe ya una vinculación para esta financiación
        const vinculacionExistente = await tx.cuotaVinculada.findFirst({
          where: {
            financiacionId: financiacion.id,
            pagoTarjetaId: pagoTarjeta.id
          }
        })
        
        if (!vinculacionExistente) {
          const vinculacion = await tx.cuotaVinculada.create({
            data: {
              financiacionId: financiacion.id,
              pagoTarjetaId: pagoTarjeta.id,
              montoCuota: financiacion.montoCuota
            }
          })
          vinculaciones.push(vinculacion)
          
          // 3. Actualizar contadores de la financiación
          await tx.financiacion.update({
            where: { id: financiacion.id },
            data: {
              cuotasPagadas: { increment: 1 },
              cuotasRestantes: { decrement: 1 },
              fechaProximoPago: financiacion.cuotasRestantes > 1 
                ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 días
                : null
            }
          })
        }
      }
      
      return { pagoTarjeta, vinculaciones }
    })
    
    return NextResponse.json({
      message: `Pago vinculado exitosamente a ${resultado.vinculaciones.length} cuotas`,
      pagoTarjeta: resultado.pagoTarjeta,
      vinculaciones: resultado.vinculaciones.length
    })
    
  } catch (error: any) {
    console.error('Error al vincular pago:', error)
    return NextResponse.json(
      { 
        error: 'Error al vincular el pago',
        details: error.message || 'Error desconocido'
      },
      { status: 500 }
    )
  }
} 