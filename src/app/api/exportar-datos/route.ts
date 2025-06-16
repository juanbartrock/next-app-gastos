import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mes = searchParams.get('mes')
    const año = searchParams.get('año')
    const tipo = searchParams.get('tipo') || 'personal'
    const grupoId = searchParams.get('grupoId')

    if (!mes || !año) {
      return NextResponse.json({ error: 'Mes y año son requeridos' }, { status: 400 })
    }

    console.log(`🔍 Exportando datos ${tipo} para ${mes}/${año} - Usuario: ${session.user.id}`)

    // Calcular fechas del mes
    const fechaInicio = new Date(parseInt(año), parseInt(mes) - 1, 1)
    const fechaFin = new Date(parseInt(año), parseInt(mes), 0, 23, 59, 59, 999)

    console.log(`📅 Fechas: ${fechaInicio.toISOString()} a ${fechaFin.toISOString()}`)
    
    // Para ser más inclusivos, también considerar 3 meses antes y después para capturar datos relacionados
    const fechaExtendidaInicio = new Date(parseInt(año), parseInt(mes) - 4, 1)
    const fechaExtendidaFin = new Date(parseInt(año), parseInt(mes) + 3, 0, 23, 59, 59, 999)

    // Determinar usuarios a incluir
    let userIds = [session.user.id]
    
    if (tipo === 'grupo' && grupoId) {
      // Verificar que sea administrador del grupo específico
      const grupo = await prisma.grupo.findFirst({
        where: { 
          id: grupoId,
          adminId: session.user.id 
        },
        include: {
          miembros: {
            select: { userId: true }
          }
        }
      })

      if (!grupo) {
        return NextResponse.json({ error: 'No tienes permisos para este grupo' }, { status: 403 })
      }

      userIds = [session.user.id, ...grupo.miembros.map(m => m.userId)]
      console.log(`Exportando para grupo "${grupo.nombre}" con ${userIds.length} usuarios`)
    }

    // 1. MOVIMIENTOS - Simplificado
    const movimientos = await prisma.gasto.findMany({
      where: {
        userId: { in: userIds },
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: {
        categoriaRel: { select: { descripcion: true } },
        user: { select: { name: true, email: true } },
        gastoRecurrente: { select: { concepto: true } }
      },
      orderBy: { fecha: 'desc' }
    })

    console.log(`Encontrados ${movimientos.length} movimientos`)

    // 2. PRÉSTAMOS - Buscar todos los préstamos relevantes (más inclusivo)
    const prestamos = await prisma.prestamo.findMany({
      where: {
        userId: { in: userIds },
        OR: [
          // Préstamos creados en período extendido
          {
            createdAt: {
              gte: fechaExtendidaInicio,
              lte: fechaExtendidaFin
            }
          },
          // Préstamos con pagos en el período específico
          {
            pagos: {
              some: {
                fechaPago: {
                  gte: fechaInicio,
                  lte: fechaFin
                }
              }
            }
          },
          // Préstamos activos independientemente de fecha
          {
            estado: { in: ['activo', 'vigente', 'pendiente', 'en_curso'] }
          }
        ]
      },
      include: {
        user: { select: { name: true, email: true } },
        pagos: true // Incluir todos los pagos para análisis completo
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`Encontrados ${prestamos.length} préstamos`)

    // 3. SERVICIOS - Buscar todos los servicios relevantes (más inclusivo)
    const servicios = await prisma.servicio.findMany({
      where: {
        userId: { in: userIds }
        // Remover filtros de fecha - mostrar todos los servicios activos del usuario
      },
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { nombre: 'asc' }
    })

    console.log(`Encontrados ${servicios.length} servicios`)

    // 4. RECURRENTES - Buscar todos los gastos recurrentes relevantes (más inclusivo)
    const recurrentes = await prisma.gastoRecurrente.findMany({
      where: {
        userId: { in: userIds }
        // Mostrar todos los gastos recurrentes del usuario para análisis completo
      },
      include: {
        user: { select: { name: true, email: true } },
        categoria: { select: { descripcion: true } },
        gastosGenerados: {
          include: {
            user: { select: { name: true, email: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`Encontrados ${recurrentes.length} gastos recurrentes`)

    // 5. PRESUPUESTOS - Simplificado
    const presupuestos = await prisma.presupuesto.findMany({
      where: {
        userId: { in: userIds },
        mes: parseInt(mes),
        año: parseInt(año)
      },
      include: {
        user: { select: { name: true, email: true } },
        categoria: { select: { descripcion: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`Encontrados ${presupuestos.length} presupuestos`)

    // 6. INVERSIONES - Simplificado
    const inversiones = await prisma.inversion.findMany({
      where: {
        userId: { in: userIds },
        fechaInicio: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: {
        user: { select: { name: true, email: true } },
        transacciones: true
      },
      orderBy: { fechaInicio: 'desc' }
    })

    console.log(`Encontradas ${inversiones.length} inversiones`)

    // Crear workbook
    const wb = XLSX.utils.book_new()

    // HOJA 1: MOVIMIENTOS
    if (movimientos.length > 0) {
      const movimientosData = movimientos.map((mov: any) => ({
        'Fecha': mov.fecha.toLocaleDateString('es-AR'),
        'Concepto': mov.concepto,
        'Categoría': mov.categoriaRel?.descripcion || mov.categoria || 'Sin categoría',
        'Monto': mov.monto,
        'Tipo': mov.tipoTransaccion,
        'Tipo Movimiento': mov.tipoMovimiento,
        'Usuario': mov.user?.name || 'N/A',
        'Email': mov.user?.email || 'N/A',
        'Gasto Recurrente': mov.gastoRecurrente?.concepto || 'N/A'
      }))
      
      const wsMovimientos = XLSX.utils.json_to_sheet(movimientosData)
      XLSX.utils.book_append_sheet(wb, wsMovimientos, "Movimientos")
    } else {
      // Crear hoja vacía con headers
      const wsMovimientos = XLSX.utils.json_to_sheet([{
        'Fecha': '',
        'Concepto': '',
        'Categoría': '',
        'Monto': '',
        'Tipo': '',
        'Tipo Movimiento': '',
        'Usuario': '',
        'Email': '',
        'Gasto Recurrente': ''
      }])
      XLSX.utils.book_append_sheet(wb, wsMovimientos, "Movimientos")
    }

    // HOJA 2: PRÉSTAMOS
    const prestamosData: any[] = []
    prestamos.forEach((prestamo: any) => {
      prestamosData.push({
        'Tipo': 'Préstamo',
        'Fecha': prestamo.createdAt.toLocaleDateString('es-AR'),
        'Concepto': prestamo.concepto,
        'Monto Total': prestamo.montoTotal,
        'Monto Cuota': prestamo.montoCuota,
        'Cantidad Cuotas': prestamo.cantidadCuotas,
        'Estado': prestamo.estado,
        'Usuario': prestamo.user?.name || 'N/A',
        'Email': prestamo.user?.email || 'N/A'
      })
    })
    
    if (prestamosData.length === 0) {
      prestamosData.push({
        'Tipo': '',
        'Fecha': '',
        'Concepto': '',
        'Monto Total': '',
        'Monto Cuota': '',
        'Cantidad Cuotas': '',
        'Estado': '',
        'Usuario': '',
        'Email': ''
      })
    }
    
    const wsPrestamos = XLSX.utils.json_to_sheet(prestamosData)
    XLSX.utils.book_append_sheet(wb, wsPrestamos, "Préstamos")

    // HOJA 3: SERVICIOS
    const serviciosData = servicios.length > 0 ? servicios.map((servicio: any) => ({
      'Fecha Creación': servicio.createdAt.toLocaleDateString('es-AR'),
      'Nombre': servicio.nombre,
      'Descripción': servicio.descripcion || '',
      'Monto': servicio.monto || 0,
      'Medio Pago': servicio.medioPago || '',
      'Usuario': servicio.user?.name || 'N/A',
      'Email': servicio.user?.email || 'N/A'
    })) : [{
      'Fecha Creación': '',
      'Nombre': '',
      'Descripción': '',
      'Monto': '',
      'Medio Pago': '',
      'Usuario': '',
      'Email': ''
    }]
    
    const wsServicios = XLSX.utils.json_to_sheet(serviciosData)
    XLSX.utils.book_append_sheet(wb, wsServicios, "Servicios")

    // HOJA 4: RECURRENTES
    const recurrentesData: any[] = []
    if (recurrentes.length > 0) {
      recurrentes.forEach((recurrente: any) => {
        recurrentesData.push({
          'Fecha': recurrente.createdAt.toLocaleDateString('es-AR'),
          'Concepto': recurrente.concepto,
          'Monto': recurrente.monto,
          'Categoría': recurrente.categoria?.descripcion || 'Sin categoría',
          'Estado': recurrente.estado,
          'Periodicidad': recurrente.periodicidad,
          'Usuario': recurrente.user?.name || 'N/A',
          'Email': recurrente.user?.email || 'N/A'
        })
      })
    } else {
      recurrentesData.push({
        'Fecha': '',
        'Concepto': '',
        'Monto': '',
        'Categoría': '',
        'Estado': '',
        'Periodicidad': '',
        'Usuario': '',
        'Email': ''
      })
    }
    
    const wsRecurrentes = XLSX.utils.json_to_sheet(recurrentesData)
    XLSX.utils.book_append_sheet(wb, wsRecurrentes, "Recurrentes")

    // HOJA 5: PRESUPUESTOS
    const presupuestosData = presupuestos.length > 0 ? presupuestos.map((presupuesto: any) => ({
      'Mes': presupuesto.mes,
      'Año': presupuesto.año,
      'Nombre': presupuesto.nombre,
      'Descripción': presupuesto.descripcion || '',
      'Categoría': presupuesto.categoria?.descripcion || 'Sin categoría',
      'Monto': presupuesto.monto,
      'Tipo': presupuesto.tipo,
      'Estado': presupuesto.activo ? 'Activo' : 'Inactivo',
      'Usuario': presupuesto.user?.name || 'N/A',
      'Email': presupuesto.user?.email || 'N/A'
    })) : [{
      'Mes': '',
      'Año': '',
      'Nombre': '',
      'Descripción': '',
      'Categoría': '',
      'Monto': '',
      'Tipo': '',
      'Estado': '',
      'Usuario': '',
      'Email': ''
    }]
    
    const wsPresupuestos = XLSX.utils.json_to_sheet(presupuestosData)
    XLSX.utils.book_append_sheet(wb, wsPresupuestos, "Presupuestos")

    // HOJA 6: INVERSIONES
    const inversionesData = inversiones.length > 0 ? inversiones.map((inversion: any) => ({
      'Fecha': inversion.fechaInicio.toLocaleDateString('es-AR'),
      'Nombre': inversion.nombre,
      'Descripción': inversion.descripcion || '',
      'Monto Inicial': inversion.montoInicial,
      'Monto Actual': inversion.montoActual,
      'Rendimiento': inversion.rendimientoTotal,
      'Estado': inversion.estado,
      'Usuario': inversion.user?.name || 'N/A',
      'Email': inversion.user?.email || 'N/A'
    })) : [{
      'Fecha': '',
      'Nombre': '',
      'Descripción': '',
      'Monto Inicial': '',
      'Monto Actual': '',
      'Rendimiento': '',
      'Estado': '',
      'Usuario': '',
      'Email': ''
    }]
    
    const wsInversiones = XLSX.utils.json_to_sheet(inversionesData)
    XLSX.utils.book_append_sheet(wb, wsInversiones, "Inversiones")

    // Generar archivo
    const buffer = XLSX.write(wb, { 
      bookType: 'xlsx', 
      type: 'buffer'
    })

    // Headers para descarga
    const grupoSuffix = tipo === 'grupo' ? '-grupo' : ''
    const filename = `datos-financieros${grupoSuffix}-${mes}-${año}.xlsx`
    
    const headers = new Headers()
    headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

    console.log(`✅ Archivo generado: ${filename}`)

    return new NextResponse(buffer, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('❌ Error al exportar datos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
} 