import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { validateApiKey } from '@/lib/api-key'

// GET /api/v1/agent/gastos — Gastos del usuario con filtros y paginación
export async function GET(request: NextRequest) {
    try {
        const auth = await validateApiKey(request)

        if (!auth) {
            return NextResponse.json(
                { error: 'No autorizado. Se requiere API key válida en header Authorization: Bearer <key>' },
                { status: 401 }
            )
        }

        if (!auth.apiKey.permisos.includes('read')) {
            return NextResponse.json(
                { error: 'API key sin permiso de lectura' },
                { status: 403 }
            )
        }

        const url = new URL(request.url)
        const desde = url.searchParams.get('desde')
        const hasta = url.searchParams.get('hasta')
        const categoria = url.searchParams.get('categoria')
        const tipo = url.searchParams.get('tipo') // expense | income
        const limit = Math.min(Number(url.searchParams.get('limit')) || 100, 500)
        const offset = Number(url.searchParams.get('offset')) || 0

        // Construir condición de consulta
        const where: any = {
            userId: auth.user.id,
            NOT: [{ tipoMovimiento: 'tarjeta' }], // Excluir pagos tarjeta (igual que la UI)
        }

        // Filtro por fechas
        if (desde) {
            const fechaDesde = new Date(desde)
            if (isNaN(fechaDesde.getTime())) {
                return NextResponse.json({ error: 'Formato de fecha "desde" inválido. Usar ISO 8601.' }, { status: 400 })
            }
            where.fecha = { ...where.fecha, gte: fechaDesde }
        }
        if (hasta) {
            const fechaHasta = new Date(hasta)
            if (isNaN(fechaHasta.getTime())) {
                return NextResponse.json({ error: 'Formato de fecha "hasta" inválido. Usar ISO 8601.' }, { status: 400 })
            }
            where.fecha = { ...where.fecha, lte: fechaHasta }
        }

        // Filtro por categoría
        if (categoria) {
            where.categoria = { contains: categoria, mode: 'insensitive' }
        }

        // Filtro por tipo de transacción
        if (tipo && ['expense', 'income'].includes(tipo)) {
            where.tipoTransaccion = tipo
        }

        // Consultar total y datos en paralelo
        const [total, gastos] = await Promise.all([
            prisma.gasto.count({ where }),
            prisma.gasto.findMany({
                where,
                include: {
                    categoriaRel: {
                        select: {
                            id: true,
                            descripcion: true,
                            grupo_categoria: true,
                        },
                    },
                },
                orderBy: { fecha: 'desc' },
                take: limit,
                skip: offset,
            }),
        ])

        // Formatear respuesta
        const data = gastos.map((g) => ({
            id: g.id,
            concepto: g.concepto,
            monto: g.monto,
            fecha: g.fecha,
            categoria: g.categoria,
            categoriaDetalle: g.categoriaRel
                ? {
                    id: g.categoriaRel.id,
                    nombre: g.categoriaRel.descripcion,
                    grupo: g.categoriaRel.grupo_categoria,
                }
                : null,
            tipoTransaccion: g.tipoTransaccion,
            tipoMovimiento: g.tipoMovimiento,
            fechaImputacion: g.fechaImputacion,
            gastoRecurrenteId: g.gastoRecurrenteId,
            createdAt: g.createdAt,
        }))

        return NextResponse.json({
            data,
            meta: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total,
            },
        })
    } catch (error) {
        console.error('Error API Agent gastos:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
