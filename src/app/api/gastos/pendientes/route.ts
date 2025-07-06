import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options'
import prisma from "@/lib/prisma"

interface GastoRecurrente {
  id: number
  concepto: string
  monto: number
  proximaFecha: Date | null
  periodicidad: string
  estado: string
  gastosGenerados: {
    id: number
    monto: number
    fecha: Date
    fechaImputacion: Date | null
  }[]
}

interface Prestamo {
  id: number
  entidadFinanciera: string
  cuotaMensual: number
  plazoMeses: number
  fechaPrimeraCuota: Date
  estado: string
  pagos: {
    id: number
    numeroCuota: number
    fechaPago: Date
    fechaVencimiento: Date
    fechaImputacion: Date | null
  }[]
}

interface DetallePendiente {
  concepto: string
  montoPendiente: number
  montoTotal: number
  tipo: 'recurrente' | 'prestamo'
  numeroCuota?: number
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userId = session.user.id
    const ahora = new Date()
    const mesActual = ahora.getMonth()
    const anioActual = ahora.getFullYear()
    
    // Identificador único para evitar logs duplicados
    const calculoId = `${userId}-${Date.now()}`

    // console.log(`\n=== INICIO CÁLCULO GASTOS PENDIENTES [${calculoId}] ===`)
    // console.log(`👤 Usuario: ${userId}`)
    // console.log(`📅 Mes actual: ${mesActual + 1}/${anioActual}`)
    // console.log(`🕒 Fecha actual: ${ahora.toLocaleDateString('es-ES')}`)

    // Crear rango de fechas para el mes actual
    const mesActualInicio = new Date(anioActual, mesActual, 1)
    const mesActualFin = new Date(anioActual, mesActual + 1, 0)
    
    // console.log(`📅 Rango de fechas para filtrar: ${mesActualInicio.toLocaleDateString('es-ES')} a ${mesActualFin.toLocaleDateString('es-ES')}`)

    // 1. Calcular gastos recurrentes pendientes del mes actual
    const gastosRecurrentes = await prisma.gastoRecurrente.findMany({
      where: { 
        userId,
        // Filtrar por proximaFecha para que esté en el mes actual
        OR: [
          {
            // Gastos con proximaFecha en el mes actual
            proximaFecha: {
              gte: mesActualInicio,
              lte: mesActualFin
            }
          },
          {
            // Gastos sin proximaFecha pero con periodicidad mensual (legacy)
            proximaFecha: null,
            periodicidad: 'mensual'
          }
        ]
      },
      include: {
        gastosGenerados: {
          select: {
            id: true,
            monto: true,
            fecha: true,
            fechaImputacion: true
          }
        }
      }
    })

    // console.log(`\n📋 GASTOS RECURRENTES ENCONTRADOS (filtrados por proximaFecha): ${gastosRecurrentes.length}`)

    let totalGastosRecurrentes = 0
    const detalleGastosRecurrentes: DetallePendiente[] = []
    let gastosRecurrentesAnalizados = 0
    let gastosRecurrentesAgregados = 0

    gastosRecurrentes.forEach((recurrente) => {
      gastosRecurrentesAnalizados++
      
      // console.log(`\n🔄 [${gastosRecurrentesAnalizados}/${gastosRecurrentes.length}] Procesando recurrente: "${recurrente.concepto}"`)
      // console.log(`   💰 Monto total: $${recurrente.monto.toLocaleString()}`)
      // console.log(`   📊 Estado general: ${recurrente.estado}`)
      // console.log(`   📅 Periodicidad: ${recurrente.periodicidad}`)
      // console.log(`   📅 Próxima fecha: ${recurrente.proximaFecha ? new Date(recurrente.proximaFecha).toLocaleDateString('es-ES') : 'No establecida'}`)
      
      // Filtrar pagos del mes actual
      const pagosDelMesActual = recurrente.gastosGenerados.filter(pago => {
        const fechaPago = new Date(pago.fechaImputacion || pago.fecha)
        const esMesActual = fechaPago.getMonth() === mesActual && fechaPago.getFullYear() === anioActual
        
        if (esMesActual) {
          // console.log(`   ✅ Pago encontrado: $${pago.monto.toLocaleString()} el ${fechaPago.toLocaleDateString('es-ES')}`)
        }
        
        return esMesActual
      })

      const totalPagadoMesActual = pagosDelMesActual.reduce((sum: number, pago) => sum + pago.monto, 0)
      const saldoPendiente = Math.max(0, recurrente.monto - totalPagadoMesActual)

      // console.log(`   📊 Total pagado este mes: $${totalPagadoMesActual.toLocaleString()}`)
      // console.log(`   🔢 Saldo pendiente: $${saldoPendiente.toLocaleString()}`)

      // Ya filtramos por proximaFecha en la query, así que todos los gastos aquí
      // deben aplicarse al mes actual

      if (saldoPendiente > 0) {
        totalGastosRecurrentes += saldoPendiente
        detalleGastosRecurrentes.push({
          concepto: recurrente.concepto,
          montoPendiente: saldoPendiente,
          montoTotal: recurrente.monto,
          tipo: 'recurrente'
        })
        gastosRecurrentesAgregados++
        // console.log(`   ✅ AGREGADO AL TOTAL: $${saldoPendiente.toLocaleString()}`)
      } else {
        // console.log(`   ❌ No se agrega (ya pagado completamente este mes)`)
      }
    })

    // console.log(`\n💰 TOTAL GASTOS RECURRENTES PENDIENTES: $${totalGastosRecurrentes.toLocaleString()}`)
    // console.log(`📊 Gastos analizados: ${gastosRecurrentesAnalizados}, Agregados: ${gastosRecurrentesAgregados}`)

    // 2. Calcular préstamos con cuotas pendientes del mes actual
    const prestamos = await prisma.prestamo.findMany({
      where: {
        userId,
        estado: 'activo'
      },
      include: {
        pagos: {
          select: {
            id: true,
            numeroCuota: true,
            fechaPago: true,
            fechaVencimiento: true
          }
        }
      }
    })

    // console.log(`\n💳 PRÉSTAMOS ACTIVOS ENCONTRADOS: ${prestamos.length}`)

    let totalPrestamos = 0
    const detallePrestamos: DetallePendiente[] = []
    let prestamosAnalizados = 0
    let prestamosAgregados = 0

    for (const prestamo of prestamos) {
      prestamosAnalizados++
      
      // console.log(`\n🏦 [${prestamosAnalizados}/${prestamos.length}] Procesando préstamo: "${prestamo.entidadFinanciera}"`)
      // console.log(`   💰 Cuota mensual: $${prestamo.cuotaMensual.toLocaleString()}`)
      // console.log(`   📅 Fecha primera cuota: ${new Date(prestamo.fechaPrimeraCuota).toLocaleDateString('es-ES')}`)
      // console.log(`   📊 Plazo: ${prestamo.plazoMeses} meses`)

      // Calcular qué número de cuota corresponde al mes actual
      const fechaInicio = new Date(prestamo.fechaPrimeraCuota)
      const mesesTranscurridos = (anioActual - fechaInicio.getFullYear()) * 12 + (mesActual - fechaInicio.getMonth())
      const numeroCuotaActual = mesesTranscurridos + 1

      // console.log(`   🔢 Cuota que corresponde al mes actual: ${numeroCuotaActual}`)

      // Verificar si esta cuota ya fue pagada
      const cuotaPagada = prestamo.pagos.some(pago => {
        const fechaPago = new Date(pago.fechaPago)
        const esMesActual = fechaPago.getMonth() === mesActual && fechaPago.getFullYear() === anioActual
        const esCuotaCorrecta = pago.numeroCuota === numeroCuotaActual
        
        if (esMesActual && esCuotaCorrecta) {
          // console.log(`   ✅ Cuota ya pagada: Cuota ${pago.numeroCuota} el ${fechaPago.toLocaleDateString('es-ES')}`)
        }
        
        return esMesActual && esCuotaCorrecta
      })

      // console.log(`   📋 Pagos registrados en este préstamo: ${prestamo.pagos.length}`)
      prestamo.pagos.forEach(pago => {
        const fechaPago = new Date(pago.fechaPago)
        // console.log(`     - Cuota ${pago.numeroCuota}: $${prestamo.cuotaMensual.toLocaleString()} el ${fechaPago.toLocaleDateString('es-ES')}`)
      })

      // Si la cuota no está pagada y corresponde al mes actual
      if (!cuotaPagada && numeroCuotaActual <= prestamo.plazoMeses && numeroCuotaActual > 0) {
        totalPrestamos += prestamo.cuotaMensual
        detallePrestamos.push({
          concepto: `${prestamo.entidadFinanciera} - Cuota ${numeroCuotaActual}`,
          montoPendiente: prestamo.cuotaMensual,
          montoTotal: prestamo.cuotaMensual,
          tipo: 'prestamo',
          numeroCuota: numeroCuotaActual
        })
        prestamosAgregados++
        // console.log(`   ✅ AGREGADO AL TOTAL: $${prestamo.cuotaMensual.toLocaleString()} (Cuota ${numeroCuotaActual})`)
      } else {
        if (cuotaPagada) {
          // console.log(`   ❌ No se agrega (cuota ya pagada)`)
        } else if (numeroCuotaActual <= 0) {
          // console.log(`   ❌ No se agrega (aún no inicia el período de pago)`)
        } else if (numeroCuotaActual > prestamo.plazoMeses) {
          // console.log(`   ❌ No se agrega (préstamo ya terminado)`)
        }
      }
    }

    // console.log(`\n💰 TOTAL PRÉSTAMOS PENDIENTES: $${totalPrestamos.toLocaleString()}`)
    // console.log(`📊 Préstamos analizados: ${prestamosAnalizados}, Agregados: ${prestamosAgregados}`)

    // 3. Calcular total general
    const totalPendiente = totalGastosRecurrentes + totalPrestamos

    // console.log(`\n📊 RESUMEN FINAL [${calculoId}]:`)
    // console.log(`   💰 Total gastos recurrentes: $${totalGastosRecurrentes.toLocaleString()}`)
    // console.log(`   💳 Total préstamos: $${totalPrestamos.toLocaleString()}`)
    // console.log(`   🎯 TOTAL PENDIENTE: $${totalPendiente.toLocaleString()}`)
    // console.log(`   📋 Cantidad total de gastos: ${detalleGastosRecurrentes.length + detallePrestamos.length}`)
    // console.log(`=== FIN CÁLCULO GASTOS PENDIENTES [${calculoId}] ===\n`)

    return NextResponse.json({
      totalPendiente,
      gastosRecurrentes: {
        total: totalGastosRecurrentes,
        cantidad: detalleGastosRecurrentes.length,
        detalle: detalleGastosRecurrentes
      },
      prestamos: {
        total: totalPrestamos,
        cantidad: detallePrestamos.length,
        detalle: detallePrestamos
      },
      resumen: {
        totalGeneral: totalPendiente,
        cantidadTotal: detalleGastosRecurrentes.length + detallePrestamos.length,
        mes: ahora.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      }
    })

  } catch (error) {
    // console.error('❌ ERROR al obtener gastos pendientes:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
} 