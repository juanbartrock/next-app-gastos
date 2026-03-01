import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { validateApiKey } from '@/lib/api-key'
import { validateLimit, incrementUsage } from '@/lib/plan-limits'
import { calcularEstadoRecurrente } from '@/lib/gastos-recurrentes-utils'

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

// POST /api/v1/agent/gastos — Crear nuevo gasto
export async function POST(request: NextRequest) {
    try {
        const auth = await validateApiKey(request)

        if (!auth) {
            return NextResponse.json(
                { error: 'No autorizado. Se requiere API key válida en header Authorization: Bearer <key>' },
                { status: 401 }
            )
        }

        if (!auth.apiKey.permisos.includes('write')) {
            return NextResponse.json(
                { error: 'API key sin permiso de escritura' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const {
            concepto,
            monto,
            categoria,
            categoriaId,
            tipoTransaccion = 'expense',
            tipoMovimiento = 'efectivo',
            fecha,
            fechaImputacion,
            incluirEnFamilia = true,
            gastoRecurrenteId
        } = body

        // Validaciones básicas
        if (!concepto || !monto) {
            return NextResponse.json(
                { error: 'Faltan campos requeridos: concepto, monto' },
                { status: 400 }
            )
        }

        // Verificar categoría si se provee ID
        let nombreCategoria = categoria
        if (categoriaId) {
            const cat = await prisma.categoria.findUnique({
                where: { id: Number(categoriaId) }
            })
            if (!cat) {
                return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 400 })
            }
            if (!nombreCategoria) nombreCategoria = cat.descripcion
        }

        // Verificar gasto recurrente si se provee ID
        let gastoRecurrente = null
        if (gastoRecurrenteId) {
            gastoRecurrente = await prisma.gastoRecurrente.findFirst({
                where: {
                    id: Number(gastoRecurrenteId),
                    userId: auth.user.id
                }
            })
            if (!gastoRecurrente) {
                return NextResponse.json({ error: 'Gasto recurrente no encontrado' }, { status: 400 })
            }
        }

        // Validar límites del plan
        const validacion = await validateLimit(auth.user.id, 'transacciones_mes')
        if (!validacion.allowed) {
            return NextResponse.json({
                error: 'Límite de transacciones alcanzado',
                detalles: validacion
            }, { status: 403 })
        }

        // Procesar fechas
        const fechaReal = fecha ? new Date(fecha) : new Date()
        let fechaImputacionReal = null
        if (fechaImputacion) {
            const d = new Date(fechaImputacion)
            if (!isNaN(d.getTime())) fechaImputacionReal = d
        }

        // Crear transacción
        const resultado = await prisma.$transaction(async (tx) => {
            const gasto = await tx.gasto.create({
                data: {
                    concepto,
                    monto: Number(monto),
                    categoria: nombreCategoria || 'Sin categoría',
                    tipoTransaccion,
                    tipoMovimiento,
                    fecha: fechaReal,
                    fechaImputacion: fechaImputacionReal,
                    userId: auth.user.id,
                    incluirEnFamilia: Boolean(incluirEnFamilia),
                    ...(categoriaId && { categoriaId: Number(categoriaId) }),
                    ...(gastoRecurrenteId && { gastoRecurrenteId: Number(gastoRecurrenteId) })
                }
            })

            // Actualizar recurrente si corresponde
            if (gastoRecurrente) {
                const todosPagos = await tx.gasto.findMany({
                    where: { gastoRecurrenteId: gastoRecurrente.id },
                    select: { id: true, monto: true, fecha: true, fechaImputacion: true }
                })

                const estadoCalculado = calcularEstadoRecurrente(gastoRecurrente, todosPagos)

                await tx.gastoRecurrente.update({
                    where: { id: gastoRecurrente.id },
                    data: {
                        estado: estadoCalculado.estado,
                        ultimoPago: new Date(),
                        updatedAt: new Date()
                    }
                })
            }

            return gasto
        })

        // Incrementar uso del plan
        await incrementUsage(auth.user.id, 'transacciones_mes')

        return NextResponse.json(resultado, { status: 201 })

    } catch (error) {
        console.error('Error API Agent POST gastos:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
