import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener parámetro para verificar si queremos cerrar períodos anteriores
    const url = new URL(request.url)
    const cerrarPeriodosAnteriores = url.searchParams.get('cerrarPeriodosAnteriores') === 'true'

    // Obtener todos los gastos recurrentes del usuario con sus gastos generados
    const gastosRecurrentes = await prisma.gastoRecurrente.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        categoria: true,
        gastosGenerados: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    // Función para verificar si hay pago en el período actual
    const tieneGastoEnPeriodoActual = (recurrente: any): boolean => {
      if (!recurrente.proximaFecha) return false
      
      const ahora = new Date()
      const proximaFecha = new Date(recurrente.proximaFecha)
      
      // SOLO considerar gastos del MES/AÑO ACTUAL
      const mesActual = ahora.getMonth()
      const anioActual = ahora.getFullYear()
      
      console.log(`   🔍 Verificando pagos para: ${recurrente.concepto}`)
      console.log(`   📅 Mes/Año actual: ${mesActual + 1}/${anioActual}`)
      
      // Buscar gastos que tengan fechaImputacion del mes actual
      const gastosFiltrados = recurrente.gastosGenerados.filter((gasto: any) => {
        const fechaGasto = new Date(gasto.fechaImputacion || gasto.fecha)
        const mesGasto = fechaGasto.getMonth()
        const anioGasto = fechaGasto.getFullYear()
        
        console.log(`   💰 Pago: $${gasto.monto} - Fecha: ${mesGasto + 1}/${anioGasto} (${fechaGasto.toLocaleDateString()})`)
        
        // SOLO gastos del mes y año actual
        const coincide = mesGasto === mesActual && anioGasto === anioActual
        console.log(`   ${coincide ? '✅' : '❌'} Coincide con mes actual: ${coincide}`)
        return coincide
      })
      
      console.log(`   📊 Pagos del mes actual encontrados: ${gastosFiltrados.length}`)
      return gastosFiltrados.length > 0
    }

    // Función para detectar gastos del mes anterior que se deben cerrar
    const esDelMesAnterior = (recurrente: any): boolean => {
      if (!recurrente.proximaFecha) return false
      
      const ahora = new Date()
      const proximaFecha = new Date(recurrente.proximaFecha)
      
      // Verificar si la fecha es de un mes anterior al actual
      const mesActual = ahora.getMonth()
      const anioActual = ahora.getFullYear()
      const mesProximo = proximaFecha.getMonth()
      const anioProximo = proximaFecha.getFullYear()
      
      // Es del mes anterior si:
      // 1. Es del mismo año pero mes anterior
      // 2. Es de un año anterior
      return (anioProximo === anioActual && mesProximo < mesActual) || 
             (anioProximo < anioActual)
    }

    // Función para calcular la próxima fecha basada en periodicidad
    const calcularProximaFecha = (fechaActual: Date, periodicidad: string): Date => {
      const nuevaFecha = new Date(fechaActual)
      
      switch (periodicidad.toLowerCase()) {
        case 'semanal':
          nuevaFecha.setDate(nuevaFecha.getDate() + 7)
          break
        case 'quincenal':
          nuevaFecha.setDate(nuevaFecha.getDate() + 15)
          break
        case 'mensual':
          nuevaFecha.setMonth(nuevaFecha.getMonth() + 1)
          break
        case 'bimestral':
          nuevaFecha.setMonth(nuevaFecha.getMonth() + 2)
          break
        case 'trimestral':
          nuevaFecha.setMonth(nuevaFecha.getMonth() + 3)
          break
        case 'semestral':
          nuevaFecha.setMonth(nuevaFecha.getMonth() + 6)
          break
        case 'anual':
          nuevaFecha.setFullYear(nuevaFecha.getFullYear() + 1)
          break
        default:
          nuevaFecha.setMonth(nuevaFecha.getMonth() + 1) // Default mensual
      }
      
      return nuevaFecha
    }

    // Calcular estado automático para cada recurrente
    const calcularEstadoAutomatico = (recurrente: any): string => {
      const ahora = new Date()
      const proximaFecha = recurrente.proximaFecha ? new Date(recurrente.proximaFecha) : null
      
      // Si no tiene fecha próxima, mantener estado actual
      if (!proximaFecha) {
        return recurrente.estado
      }
      
      // PRIMERO: Verificar si tiene pago en el período actual
      const tienePagoEnPeriodo = tieneGastoEnPeriodoActual(recurrente)
      
      if (tienePagoEnPeriodo) {
        // Si tiene pago, verificar si es completo o parcial
        const mesActual = ahora.getMonth()
        const anioActual = ahora.getFullYear()
        
        const totalPagado = recurrente.gastosGenerados
          .filter((gasto: any) => {
            const fechaGasto = new Date(gasto.fechaImputacion || gasto.fecha)
            const mesGasto = fechaGasto.getMonth()
            const anioGasto = fechaGasto.getFullYear()
            
            // SOLO gastos del mes y año actual
            return mesGasto === mesActual && anioGasto === anioActual
          })
          .reduce((total: number, gasto: any) => total + gasto.monto, 0)
        
        if (totalPagado >= recurrente.monto) {
          return 'pagado'
        } else {
          return 'pago_parcial'
        }
      }
      
      // SEGUNDO: Si NO tiene pago, calcular estado según fecha
      // Si ya pasó la fecha y no hay pago → PENDIENTE
      if (ahora > proximaFecha) {
        return 'pendiente'
      }
      
      // Si la fecha está próxima (próximos 7 días)
      const diferenciaDias = Math.ceil((proximaFecha.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))
      if (diferenciaDias <= 7 && diferenciaDias > 0) {
        return 'proximo'
      }
      
      // Si está programado para el futuro
      return 'programado'
    }

    // Procesar cada recurrente y actualizar estados si es necesario
    const estadosActualizados = []
    const periodosCerrados = []
    
    for (const recurrente of gastosRecurrentes) {
      console.log(`\n🔍 PROCESANDO: ${recurrente.concepto}`)
      console.log(`📅 Fecha actual: ${recurrente.proximaFecha}`)
      console.log(`📊 Estado actual en BD: ${recurrente.estado}`)
      console.log(`💰 Pagos generados: ${recurrente.gastosGenerados?.length || 0}`)
      
      let fechaActualizada = recurrente.proximaFecha
      let periodoFueCerrado = false
      let estadoCalculado = recurrente.estado
      
      // PRIMERO: CERRAR PERÍODO (si se solicita)
      if (cerrarPeriodosAnteriores && esDelMesAnterior(recurrente)) {
        console.log(`🔄 CERRANDO PERÍODO para: ${recurrente.concepto}`)
        // Avanzar fecha 1 mes
        if (recurrente.proximaFecha) {
          fechaActualizada = calcularProximaFecha(new Date(recurrente.proximaFecha), recurrente.periodicidad)
          periodoFueCerrado = true
          
          // ESTADO = PENDIENTE (como pidió el usuario)
          estadoCalculado = 'pendiente'
          console.log(`✅ Fecha actualizada: ${fechaActualizada}`)
          console.log(`✅ Estado forzado a: ${estadoCalculado}`)
          
          // Determinar razón según el estado anterior
          let razon = 'Período anterior cerrado'
          switch(recurrente.estado) {
            case 'pendiente':
              razon = 'Período anterior cerrado sin pago'
              break
            case 'pago_parcial':
              razon = 'Período anterior cerrado con pago parcial'
              break
            case 'pagado':
              razon = 'Período anterior cerrado - reiniciando para nuevo período'
              break
            default:
              razon = 'Período anterior cerrado'
          }
          
          periodosCerrados.push({
            id: recurrente.id,
            concepto: recurrente.concepto,
            fechaAnterior: recurrente.proximaFecha,
            fechaNueva: fechaActualizada,
            estadoAnterior: recurrente.estado,
            razon
          })
        }
      } else {
        console.log(`📊 NO se cierra período. Calculando estado normal...`)
        // SEGUNDO: Si NO se cerró período, calcular estado normalmente
        estadoCalculado = calcularEstadoAutomatico(recurrente)
        console.log(`📊 Estado calculado automáticamente: ${estadoCalculado}`)
      }
      
      // Calcular si tiene gasto en período (para información)
      const tieneGasto = tieneGastoEnPeriodoActual(recurrente)
      
      // Actualizar en base de datos si hay cambios
      if (estadoCalculado !== recurrente.estado || periodoFueCerrado) {
        console.log(`💾 ACTUALIZANDO BD: ${recurrente.concepto}`)
        console.log(`   - Estado anterior: ${recurrente.estado}`)
        console.log(`   - Estado nuevo: ${estadoCalculado}`)
        console.log(`   - Fecha anterior: ${recurrente.proximaFecha}`)
        console.log(`   - Fecha nueva: ${fechaActualizada}`)
        
        await prisma.gastoRecurrente.update({
          where: { id: recurrente.id },
          data: { 
            estado: estadoCalculado,
            ...(periodoFueCerrado && { proximaFecha: fechaActualizada })
          }
        })
        console.log(`✅ BD actualizada correctamente`)
      } else {
        console.log(`⚪ Sin cambios para: ${recurrente.concepto}`)
      }
      
      estadosActualizados.push({
        id: recurrente.id,
        concepto: recurrente.concepto,
        estadoAnterior: recurrente.estado,
        estadoNuevo: estadoCalculado,
        tieneGastoEnPeriodo: tieneGasto,
        proximaFecha: fechaActualizada,
        proximaFechaAnterior: recurrente.proximaFecha,
        periodoFueCerrado,
        cantidadGastosGenerados: recurrente.gastosGenerados.length
      })
    }

    // Calcular estadísticas
    const stats = {
      total: gastosRecurrentes.length,
      pagados: estadosActualizados.filter(e => e.estadoNuevo === 'pagado').length,
      pago_parcial: estadosActualizados.filter(e => e.estadoNuevo === 'pago_parcial').length,
      pendientes: estadosActualizados.filter(e => e.estadoNuevo === 'pendiente').length,
      proximos: estadosActualizados.filter(e => e.estadoNuevo === 'proximo').length,
      programados: estadosActualizados.filter(e => e.estadoNuevo === 'programado').length,
      actualizados: estadosActualizados.filter(e => e.estadoAnterior !== e.estadoNuevo).length,
      periodosCerrados: periodosCerrados.length
    }

    return NextResponse.json({
      success: true,
      message: cerrarPeriodosAnteriores 
        ? `Estados actualizados y ${periodosCerrados.length} períodos cerrados` 
        : 'Estados calculados exitosamente',
      data: estadosActualizados,
      periodosCerrados,
      stats
    })

  } catch (error) {
    console.error('Error al calcular estados automáticos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { recurrenteId } = await request.json()

    if (!recurrenteId) {
      return NextResponse.json({ error: 'ID de recurrente requerido' }, { status: 400 })
    }

    // Obtener el recurrente específico
    const recurrente = await prisma.gastoRecurrente.findFirst({
      where: {
        id: parseInt(recurrenteId),
        userId: session.user.id
      },
      include: {
        gastosGenerados: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!recurrente) {
      return NextResponse.json({ error: 'Gasto recurrente no encontrado' }, { status: 404 })
    }

    // Misma lógica de cálculo pero para un solo recurrente
    const ahora = new Date()
    const proximaFecha = recurrente.proximaFecha ? new Date(recurrente.proximaFecha) : null
    
    let estadoCalculado = recurrente.estado
    let tieneGasto = false
    
    if (proximaFecha) {
      // Verificar si tiene gasto en período
      let diasTolerancia = 30
      switch (recurrente.periodicidad.toLowerCase()) {
        case 'mensual': diasTolerancia = 30; break
        case 'bimestral': diasTolerancia = 60; break
        case 'trimestral': diasTolerancia = 90; break
        case 'semestral': diasTolerancia = 180; break
        case 'anual': diasTolerancia = 365; break
      }
      
      const fechaLimiteInferior = new Date(proximaFecha)
      fechaLimiteInferior.setDate(fechaLimiteInferior.getDate() - diasTolerancia)
      
      const gastosFiltrados = recurrente.gastosGenerados.filter(gasto => {
        const fechaGasto = new Date(gasto.fechaImputacion || gasto.fecha)
        return fechaGasto >= fechaLimiteInferior && fechaGasto <= ahora
      })
      
      tieneGasto = gastosFiltrados.length > 0
      
      if (tieneGasto) {
        estadoCalculado = 'pagado'
      } else if (ahora > proximaFecha) {
        estadoCalculado = 'pendiente'
      } else {
        const diferenciaDias = Math.ceil((proximaFecha.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))
        if (diferenciaDias <= 7 && diferenciaDias > 0) {
          estadoCalculado = 'proximo'
        } else {
          estadoCalculado = 'programado'
        }
      }
    }

    // Actualizar si cambió
    if (estadoCalculado !== recurrente.estado) {
      await prisma.gastoRecurrente.update({
        where: { id: recurrente.id },
        data: { estado: estadoCalculado }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Estado calculado exitosamente',
      data: {
        id: recurrente.id,
        concepto: recurrente.concepto,
        estadoAnterior: recurrente.estado,
        estadoNuevo: estadoCalculado,
        tieneGastoEnPeriodo: tieneGasto,
        proximaFecha: recurrente.proximaFecha,
        cantidadGastosGenerados: recurrente.gastosGenerados.length
      }
    })

  } catch (error) {
    console.error('Error al calcular estado automático individual:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 