import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"
import { startOfMonth, endOfMonth, format } from "date-fns"
import { es } from "date-fns/locale"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(options)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const mes = url.searchParams.get('mes') || format(new Date(), 'yyyy-MM')
    
    // Corregir la creación de fechaMes para asegurar interpretación correcta
    console.log('Parámetro mes recibido:', mes)
    
    // Parsear el mes de forma más segura con validaciones
    let fechaMes: Date
    try {
      const [año, mesNum] = mes.split('-')
      const añoInt = parseInt(año)
      const mesInt = parseInt(mesNum) - 1 // Mes 0-indexed en JS
      
      // Validaciones
      if (isNaN(añoInt) || isNaN(mesInt) || mesInt < 0 || mesInt > 11) {
        throw new Error('Formato de fecha inválido')
      }
      
      fechaMes = new Date(añoInt, mesInt, 1)
      
      // Verificar que la fecha sea válida
      if (isNaN(fechaMes.getTime())) {
        throw new Error('Fecha inválida generada')
      }
    } catch (error) {
      console.error('Error al parsear mes:', error)
      // Fallback al mes actual
      fechaMes = new Date()
      fechaMes.setDate(1) // Primer día del mes actual
    }
    
    console.log('Fecha mes parseada:', fechaMes)
    console.log('Mes formateado:', format(fechaMes, 'MMMM yyyy', { locale: es }))

    // Buscar usuario por email
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar permisos familiares del usuario
    const permisosFamiliares = await prisma.grupoMiembro.findMany({
      where: { userId: usuario.id },
      include: {
        grupo: {
          select: {
            id: true,
            adminId: true,
            nombre: true
          }
        }
      }
    })

    // Verificar si es administrador familiar
    const esAdministradorFamiliar = permisosFamiliares.some(m => 
      m.grupo.adminId === usuario.id || 
      m.rol === 'administrador'
    )

    if (!esAdministradorFamiliar) {
      return NextResponse.json(
        { error: 'No tienes permisos de administrador familiar para ver estos informes' },
        { status: 403 }
      )
    }

    // Obtener grupos familiares del usuario
    const gruposMiembro = await prisma.grupoMiembro.findMany({
      where: { userId: usuario.id },
      select: { grupoId: true }
    })

    if (gruposMiembro.length === 0) {
      return NextResponse.json({
        error: 'No perteneces a ningún grupo familiar'
      }, { status: 404 })
    }

    // Obtener todos los usuarios de los grupos familiares
    const usuariosDeGrupos = await prisma.grupoMiembro.findMany({
      where: {
        grupoId: {
          in: gruposMiembro.map(g => g.grupoId)
        }
      },
      select: { userId: true }
    })

    const userIds = [...new Set(usuariosDeGrupos.map(u => u.userId))]

    // Calcular fechas del mes
    const inicioMes = startOfMonth(fechaMes)
    const finMes = endOfMonth(fechaMes)

    // 1. INFORME DE MOVIMIENTOS DE LA FAMILIA (INGRESOS Y EGRESOS)
    // Usar fechaImputacion cuando esté disponible, sino fecha normal
    const movimientosFamiliares = await prisma.gasto.findMany({
      where: {
        userId: { in: userIds },
        incluirEnFamilia: true,
        OR: [
          // Si tiene fechaImputacion, usar esa fecha para el filtro
          {
            fechaImputacion: {
              not: null,
              gte: inicioMes,
              lte: finMes
            }
          },
          // Si no tiene fechaImputacion, usar fecha normal
          {
            fechaImputacion: null,
            fecha: {
              gte: inicioMes,
              lte: finMes
            }
          }
        ],
        NOT: [
          { tipoMovimiento: "tarjeta" },
          {
            AND: [
              { categoria: "Transferencias" },
              {
                OR: [
                  { concepto: { contains: "Transferencia interna:" } },
                  { concepto: { contains: "Transferencia recibida de" } }
                ]
              }
            ]
          }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        categoriaRel: {
          select: {
            id: true,
            descripcion: true,
            grupo_categoria: true
          }
        }
      },
      orderBy: [
        // Ordenar primero por fechaImputacion si existe, sino por fecha
        {
          fechaImputacion: 'desc'
        },
        {
          fecha: 'desc'
        }
      ]
    })

    // Separar ingresos y egresos
    const ingresos = movimientosFamiliares.filter(m => m.tipoTransaccion === 'income')
    const egresos = movimientosFamiliares.filter(m => m.tipoTransaccion === 'expense')

    const totalIngresos = ingresos.reduce((sum, m) => sum + m.monto, 0)
    const totalEgresos = egresos.reduce((sum, m) => sum + m.monto, 0)

    // Agrupar movimientos por usuario para vista familiar
    const movimientosPorUsuario = new Map()
    
    movimientosFamiliares.forEach(movimiento => {
      const userId = movimiento.user.id
      const userName = movimiento.user.name
      
      if (!movimientosPorUsuario.has(userId)) {
        movimientosPorUsuario.set(userId, {
          usuario: { id: userId, name: userName },
          ingresos: [],
          egresos: [],
          totalIngresos: 0,
          totalEgresos: 0,
          balance: 0,
          cantidadMovimientos: 0
        })
      }
      
      const userStats = movimientosPorUsuario.get(userId)
      userStats.cantidadMovimientos++
      
      if (movimiento.tipoTransaccion === 'income') {
        userStats.ingresos.push(movimiento)
        userStats.totalIngresos += movimiento.monto
      } else {
        userStats.egresos.push(movimiento)
        userStats.totalEgresos += movimiento.monto
      }
      
      userStats.balance = userStats.totalIngresos - userStats.totalEgresos
    })
    
    const movimientosFamiliaresPorUsuario = Array.from(movimientosPorUsuario.values())
      .sort((a, b) => b.cantidadMovimientos - a.cantidadMovimientos) // Ordenar por cantidad de movimientos

    // 2. GASTOS DIARIOS FAMILIARES (PARA GRÁFICO DE BARRAS)
    // Para los gastos diarios, necesitamos hacer un query más complejo porque groupBy no soporta campos calculados
    const gastosParaDiarios = await prisma.gasto.findMany({
      where: {
        userId: { in: userIds },
        incluirEnFamilia: true,
        tipoTransaccion: 'expense',
        OR: [
          // Si tiene fechaImputacion, usar esa fecha para el filtro
          {
            fechaImputacion: {
              not: null,
              gte: inicioMes,
              lte: finMes
            }
          },
          // Si no tiene fechaImputacion, usar fecha normal
          {
            fechaImputacion: null,
            fecha: {
              gte: inicioMes,
              lte: finMes
            }
          }
        ],
        NOT: [
          { tipoMovimiento: "tarjeta" },
          {
            AND: [
              { categoria: "Transferencias" },
              {
                OR: [
                  { concepto: { contains: "Transferencia interna:" } },
                  { concepto: { contains: "Transferencia recibida de" } }
                ]
              }
            ]
          }
        ]
      },
      select: {
        monto: true,
        fecha: true,
        fechaImputacion: true
      }
    })

    // Procesar gastos diarios usando fechaImputacion cuando esté disponible
    const gastosPorDiaMap = new Map<string, number>()
    
    gastosParaDiarios.forEach(gasto => {
      // Usar fechaImputacion si existe, sino usar fecha
      const fechaAUsar = gasto.fechaImputacion || gasto.fecha
      const fechaStr = format(new Date(fechaAUsar), 'yyyy-MM-dd')
      
      const montoExistente = gastosPorDiaMap.get(fechaStr) || 0
      gastosPorDiaMap.set(fechaStr, montoExistente + gasto.monto)
    })

    // Convertir a array y formatear para el gráfico
    const gastosPorDia = Array.from(gastosPorDiaMap.entries())
      .map(([fechaStr, monto]) => ({
        fecha: format(new Date(fechaStr), 'dd/MM', { locale: es }),
        fechaCompleta: fechaStr,
        monto: monto
      }))
      .sort((a, b) => new Date(a.fechaCompleta).getTime() - new Date(b.fechaCompleta).getTime())

    // Obtener categorías únicas para filtros
    const categoriasDisponibles = [...new Set(
      movimientosFamiliares
        .filter(m => m.tipoTransaccion === 'expense')
        .map(m => m.categoriaRel?.descripcion || m.categoria)
        .filter(Boolean)
    )].sort()

    // Estadísticas de gastos para filtros
    const montosGastos = movimientosFamiliares
      .filter(m => m.tipoTransaccion === 'expense')
      .map(m => m.monto)
    
    const estadisticasGastos = {
      minimo: montosGastos.length > 0 ? Math.min(...montosGastos) : 0,
      maximo: montosGastos.length > 0 ? Math.max(...montosGastos) : 0,
      promedio: montosGastos.length > 0 ? montosGastos.reduce((a, b) => a + b, 0) / montosGastos.length : 0
    }

    // 3. PRÓXIMOS PAGOS FAMILIARES
    const fechaLimite = new Date()
    fechaLimite.setDate(fechaLimite.getDate() + 30) // Próximos 30 días

    const proximosPagos = await prisma.gastoRecurrente.findMany({
      where: {
        userId: { in: userIds },
        estado: {
          in: ['pendiente', 'pago_parcial', 'proximo']
        },
        proximaFecha: {
          lte: fechaLimite
        }
      },
      include: {
        categoria: {
          select: {
            id: true,
            descripcion: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        gastosGenerados: {
          select: {
            id: true,
            monto: true,
            fecha: true
          },
          take: 5
        }
      },
      orderBy: {
        proximaFecha: 'asc'
      }
    })

    // Calcular información adicional para próximos pagos
    const proximosPagosConInfo = proximosPagos.map(recurrente => {
      const totalPagado = recurrente.gastosGenerados.reduce((sum, pago) => sum + pago.monto, 0)
      const saldoPendiente = recurrente.monto - totalPagado
      const porcentajePagado = (totalPagado / recurrente.monto) * 100
      
      // Calcular días hasta el vencimiento
      const ahora = new Date()
      const diasHastaVencimiento = recurrente.proximaFecha 
        ? Math.ceil((new Date(recurrente.proximaFecha).getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))
        : null

      return {
        ...recurrente,
        totalPagado,
        saldoPendiente,
        porcentajePagado,
        diasHastaVencimiento
      }
    })

    // Resumen estadístico
    const resumen = {
      mes: format(fechaMes, 'MMMM yyyy', { locale: es }),
      totalIngresos,
      totalEgresos,
      balance: totalIngresos - totalEgresos,
      cantidadIngresos: ingresos.length,
      cantidadEgresos: egresos.length,
      cantidadProximosPagos: proximosPagos.length,
      montoProximosPagos: proximosPagos.reduce((sum, p) => {
        const totalPagado = p.gastosGenerados.reduce((s, g) => s + g.monto, 0)
        return sum + (p.monto - totalPagado)
      }, 0)
    }

    return NextResponse.json({
      success: true,
      data: {
        resumen,
        movimientos: {
          ingresos,
          egresos,
          totalIngresos,
          totalEgresos,
          porUsuario: movimientosFamiliaresPorUsuario
        },
        gastosDiarios: gastosPorDia,
        proximosPagos: proximosPagosConInfo,
        filtros: {
          categorias: categoriasDisponibles,
          estadisticasGastos
        }
      },
      permisos: {
        nivel: 'ADMINISTRADOR_FAMILIAR',
        gruposFamiliares: permisosFamiliares.map(p => p.grupo.nombre)
      }
    })

  } catch (error) {
    console.error('Error al obtener informes familiares:', error)
    return NextResponse.json(
      { error: 'Error al obtener los informes familiares' },
      { status: 500 }
    )
  }
} 