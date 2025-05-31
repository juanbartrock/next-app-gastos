import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(options)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener parámetros de fecha de la URL
    const url = new URL(request.url)
    const desde = url.searchParams.get('desde')
    const hasta = url.searchParams.get('hasta')
    const usarFechaImputacion = url.searchParams.get('usarFechaImputacion') === 'true'  // Nuevo parámetro
    
    // Convertir fechas si fueron proporcionadas
    const fechaDesde = desde ? new Date(desde) : null
    const fechaHasta = hasta ? new Date(hasta) : null
    
    // Verificar que las fechas sean válidas si se proporcionaron
    if ((desde && isNaN(fechaDesde?.getTime() || 0)) || (hasta && isNaN(fechaHasta?.getTime() || 0))) {
      return NextResponse.json(
        { error: 'Formato de fecha inválido' },
        { status: 400 }
      )
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

    // Obtener grupos a los que pertenece el usuario
    const gruposMiembro = await prisma.grupoMiembro.findMany({
      where: { userId: usuario.id },
      select: { grupoId: true }
    })
    
    if (gruposMiembro.length === 0) {
      // Si no pertenece a ningún grupo, devolver solo sus gastos familiares
      let whereCondition: any = {
        userId: usuario.id,
        incluirEnFamilia: true,
        NOT: { 
          tipoMovimiento: "tarjeta" 
        }
      }

      // Agregar condiciones de fecha si se proporcionaron
      if (fechaDesde || fechaHasta) {
        whereCondition.AND = []
        
        if (fechaDesde) {
          const condicionFecha = usarFechaImputacion ? {
            OR: [
              { fechaImputacion: { gte: fechaDesde } },  // Usar fechaImputacion si existe
              { 
                AND: [
                  { fechaImputacion: null },  // Si no hay fechaImputacion
                  { fecha: { gte: fechaDesde } }  // Usar fecha normal
                ]
              }
            ]
          } : {
            fecha: { gte: fechaDesde }
          }
          
          whereCondition.AND.push(condicionFecha)
        }
        
        if (fechaHasta) {
          const condicionFecha = usarFechaImputacion ? {
            OR: [
              { fechaImputacion: { lte: fechaHasta } },  // Usar fechaImputacion si existe
              { 
                AND: [
                  { fechaImputacion: null },  // Si no hay fechaImputacion
                  { fecha: { lte: fechaHasta } }  // Usar fecha normal
                ]
              }
            ]
          } : {
            fecha: { lte: fechaHasta }
          }
          
          whereCondition.AND.push(condicionFecha)
        }
      }

      const gastos = await prisma.gasto.findMany({
        where: whereCondition,
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
        orderBy: {
          fecha: 'desc'
        }
      })

      return NextResponse.json(gastos)
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

    // Construir condiciones de consulta para gastos familiares
    let whereCondition: any = {
      userId: {
        in: userIds
      },
      incluirEnFamilia: true,  // Solo gastos marcados como familiares
      NOT: { 
        tipoMovimiento: "tarjeta" 
      }
    }
    
    // Agregar condiciones de fecha si se proporcionaron
    if (fechaDesde || fechaHasta) {
      whereCondition.AND = []
      
      if (fechaDesde) {
        const condicionFecha = usarFechaImputacion ? {
          OR: [
            { fechaImputacion: { gte: fechaDesde } },  // Usar fechaImputacion si existe
            { 
              AND: [
                { fechaImputacion: null },  // Si no hay fechaImputacion
                { fecha: { gte: fechaDesde } }  // Usar fecha normal
              ]
            }
          ]
        } : {
          fecha: { gte: fechaDesde }
        }
        
        whereCondition.AND.push(condicionFecha)
      }
      
      if (fechaHasta) {
        const condicionFecha = usarFechaImputacion ? {
          OR: [
            { fechaImputacion: { lte: fechaHasta } },  // Usar fechaImputacion si existe
            { 
              AND: [
                { fechaImputacion: null },  // Si no hay fechaImputacion
                { fecha: { lte: fechaHasta } }  // Usar fecha normal
              ]
            }
          ]
        } : {
          fecha: { lte: fechaHasta }
        }
        
        whereCondition.AND.push(condicionFecha)
      }
    }
    
    // Obtener gastos familiares de todos los miembros del grupo
    const gastos = await prisma.gasto.findMany({
      where: whereCondition,
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
      orderBy: {
        fecha: 'desc'
      }
    })
    
    return NextResponse.json(gastos)
  } catch (error) {
    console.error('Error al obtener gastos familiares:', error)
    return NextResponse.json(
      { error: 'Error al obtener los gastos familiares' },
      { status: 500 }
    )
  }
} 