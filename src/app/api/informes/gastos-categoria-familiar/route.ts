import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"
import { startOfMonth, endOfMonth, format } from "date-fns"
import { es } from "date-fns/locale"

interface GastoCategoriaFamiliar {
  categoria: string
  grupoCategoria: string | null
  totalGasto: number
  cantidadTransacciones: number
  promedioTransaccion: number
  participacionPorcentual: number
  usuarios: Array<{
    usuario: string
    totalGasto: number
    cantidadTransacciones: number
    participacionEnCategoria: number
  }>
}

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
    const montoMinimo = parseFloat(url.searchParams.get('montoMinimo') || '0')
    const montoMaximo = parseFloat(url.searchParams.get('montoMaximo') || '999999999')
    const categoriasSeleccionadas = url.searchParams.get('categorias')?.split(',').filter(Boolean)
    const incluirSinCategoria = url.searchParams.get('incluirSinCategoria') === 'true'
    

    
    // Parsear el mes de forma segura
    let fechaMes: Date
    try {
      const [año, mesNum] = mes.split('-')
      const añoInt = parseInt(año)
      const mesInt = parseInt(mesNum) - 1
      
      if (isNaN(añoInt) || isNaN(mesInt) || mesInt < 0 || mesInt > 11) {
        throw new Error('Formato de fecha inválido')
      }
      
      fechaMes = new Date(añoInt, mesInt, 1)
      
      if (isNaN(fechaMes.getTime())) {
        throw new Error('Fecha inválida generada')
      }
    } catch (error) {
      console.error('Error al parsear mes:', error)
      fechaMes = new Date()
      fechaMes.setDate(1)
    }

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
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    const userIds = [...new Set(usuariosDeGrupos.map(u => u.userId))]
    const userNameMap = new Map(usuariosDeGrupos.map(u => [u.userId, u.user.name || 'Usuario']))

    // Calcular fechas del mes
    const inicioMes = startOfMonth(fechaMes)
    const finMes = endOfMonth(fechaMes)
    


    // Construir filtros de categoría
    let whereCategorias: any = {}
    if (categoriasSeleccionadas && categoriasSeleccionadas.length > 0) {
      if (incluirSinCategoria) {
        whereCategorias = {
          OR: [
            {
              categoriaRel: {
                descripcion: {
                  in: categoriasSeleccionadas
                }
              }
            },
            {
              categoriaRel: null
            }
          ]
        }
      } else {
        whereCategorias = {
          categoriaRel: {
            descripcion: {
              in: categoriasSeleccionadas
            }
          }
        }
      }
    }
    // Si no hay categorías seleccionadas, NO aplicar filtro de categoría
    // (incluirSinCategoria solo aplica cuando hay categorías seleccionadas)

    // Obtener gastos familiares con filtros
    const gastosFamiliares = await prisma.gasto.findMany({
      where: {
        userId: { in: userIds },
        incluirEnFamilia: true,
        tipoTransaccion: 'expense', // Solo gastos, no ingresos
        monto: {
          gte: montoMinimo,
          lte: montoMaximo
        },
        OR: [
          {
            fechaImputacion: {
              not: null,
              gte: inicioMes,
              lte: finMes
            }
          },
          {
            fechaImputacion: null,
            fecha: {
              gte: inicioMes,
              lte: finMes
            }
          }
        ],
        NOT: [
          { tipoMovimiento: "tarjeta" }
        ],
        ...whereCategorias
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
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
        {
          fechaImputacion: 'desc'
        },
        {
          fecha: 'desc'
        }
      ]
    })
    


    // Agrupar gastos por categoría
    const gastosPorCategoria = new Map<string, {
      categoria: string
      grupoCategoria: string | null
      gastos: Array<{
        monto: number
        usuario: string
        userId: string
      }>
    }>()

    gastosFamiliares.forEach(gasto => {
      const categoria = gasto.categoriaRel?.descripcion || 'Sin categoría'
      const grupoCategoria = gasto.categoriaRel?.grupo_categoria || null
      
      if (!gastosPorCategoria.has(categoria)) {
        gastosPorCategoria.set(categoria, {
          categoria,
          grupoCategoria,
          gastos: []
        })
      }
      
      gastosPorCategoria.get(categoria)!.gastos.push({
        monto: gasto.monto,
        usuario: userNameMap.get(gasto.userId) || 'Usuario',
        userId: gasto.userId
      })
    })

    // Calcular estadísticas por categoría
    const totalGeneralGastos = gastosFamiliares.reduce((sum, g) => sum + g.monto, 0)
    
    const estadisticasPorCategoria: GastoCategoriaFamiliar[] = Array.from(gastosPorCategoria.entries())
      .map(([categoria, data]) => {
        const totalGasto = data.gastos.reduce((sum, g) => sum + g.monto, 0)
        const cantidadTransacciones = data.gastos.length
        const promedioTransaccion = cantidadTransacciones > 0 ? totalGasto / cantidadTransacciones : 0
        const participacionPorcentual = totalGeneralGastos > 0 ? (totalGasto / totalGeneralGastos) * 100 : 0

        // Agrupar por usuario dentro de la categoría
        const gastosPorUsuario = new Map<string, {
          usuario: string
          gastos: number[]
        }>()

        data.gastos.forEach(gasto => {
          if (!gastosPorUsuario.has(gasto.userId)) {
            gastosPorUsuario.set(gasto.userId, {
              usuario: gasto.usuario,
              gastos: []
            })
          }
          gastosPorUsuario.get(gasto.userId)!.gastos.push(gasto.monto)
        })

        const usuarios = Array.from(gastosPorUsuario.entries()).map(([userId, userData]) => {
          const totalUsuario = userData.gastos.reduce((sum, monto) => sum + monto, 0)
          const cantidadUsuario = userData.gastos.length
          const participacionEnCategoria = totalGasto > 0 ? (totalUsuario / totalGasto) * 100 : 0

          return {
            usuario: userData.usuario,
            totalGasto: totalUsuario,
            cantidadTransacciones: cantidadUsuario,
            participacionEnCategoria
          }
        }).sort((a, b) => b.totalGasto - a.totalGasto)

        return {
          categoria,
          grupoCategoria: data.grupoCategoria,
          totalGasto,
          cantidadTransacciones,
          promedioTransaccion,
          participacionPorcentual,
          usuarios
        }
      })
      .sort((a, b) => b.totalGasto - a.totalGasto)

    // Obtener categorías disponibles para filtros
    const categoriasDisponibles = await prisma.categoria.findMany({
      where: {
        gastos: {
          some: {
            userId: { in: userIds },
            incluirEnFamilia: true,
            tipoTransaccion: 'expense',
            OR: [
              {
                fechaImputacion: {
                  not: null,
                  gte: inicioMes,
                  lte: finMes
                }
              },
              {
                fechaImputacion: null,
                fecha: {
                  gte: inicioMes,
                  lte: finMes
                }
              }
            ]
          }
        }
      },
      select: {
        descripcion: true,
        grupo_categoria: true
      },
      orderBy: {
        descripcion: 'asc'
      }
    })

    // Estadísticas generales
    const estadisticasGenerales = {
      totalGastado: totalGeneralGastos,
      totalTransacciones: gastosFamiliares.length,
      promedioTransaccion: gastosFamiliares.length > 0 ? totalGeneralGastos / gastosFamiliares.length : 0,
      cantidadCategorias: estadisticasPorCategoria.length,
      categoriaTopGasto: estadisticasPorCategoria.length > 0 ? estadisticasPorCategoria[0] : null,
      mes: format(fechaMes, 'MMMM yyyy', { locale: es }),
      periodo: {
        inicio: inicioMes.toISOString(),
        fin: finMes.toISOString()
      }
    }

    return NextResponse.json({
      estadisticasPorCategoria,
      estadisticasGenerales,
      categoriasDisponibles: categoriasDisponibles.map(c => ({
        descripcion: c.descripcion,
        grupo_categoria: c.grupo_categoria
      })),
      filtrosAplicados: {
        mes,
        montoMinimo,
        montoMaximo,
        categoriasSeleccionadas: categoriasSeleccionadas || [],
        incluirSinCategoria
      }
    })

  } catch (error) {
    console.error('Error en API gastos-categoria-familiar:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 