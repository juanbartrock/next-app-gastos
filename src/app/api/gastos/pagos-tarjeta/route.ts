import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'

// GET - Obtener transacciones que podrían ser pagos de tarjeta
export async function GET() {
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
    
    // Buscar transacciones que contengan palabras clave de pago de tarjeta
    const pagosTarjeta = await prisma.gasto.findMany({
      where: {
        userId: usuario.id,
        OR: [
          { concepto: { contains: 'pago tarjeta', mode: 'insensitive' } },
          { concepto: { contains: 'visa', mode: 'insensitive' } },
          { concepto: { contains: 'mastercard', mode: 'insensitive' } },
          { concepto: { contains: 'american express', mode: 'insensitive' } },
          { concepto: { contains: 'naranja', mode: 'insensitive' } },
          { concepto: { contains: 'cabal', mode: 'insensitive' } },
          { tipoMovimiento: 'digital' } // Pagos digitales podrían ser de tarjeta
        ]
      },
      select: {
        id: true,
        concepto: true,
        monto: true,
        fecha: true,
        tipoMovimiento: true
      },
      orderBy: {
        fecha: 'desc'
      },
      take: 50 // Limitar resultados
    })
    
    // Enriquecer con información de tarjeta específica deducida del concepto
    const pagosEnriquecidos = pagosTarjeta.map(pago => {
      let tarjetaEspecifica = 'Tarjeta Genérica'
      
      const concepto = pago.concepto.toLowerCase()
      
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
      
      return {
        gastoId: pago.id,
        concepto: pago.concepto,
        monto: pago.monto,
        fecha: pago.fecha,
        tarjetaEspecifica
      }
    })
    
    return NextResponse.json(pagosEnriquecidos)
  } catch (error: any) {
    console.error('Error al obtener pagos de tarjeta:', error)
    return NextResponse.json(
      { 
        error: 'Error al obtener los pagos de tarjeta',
        details: error.message || 'Error desconocido'
      },
      { status: 500 }
    )
  }
} 