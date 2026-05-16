import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { validateApiKey } from '@/lib/api-key'
import { validateLimit, incrementUsage } from '@/lib/plan-limits'

// GET /api/v1/agent/recurrentes — Gastos recurrentes del usuario
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
        const estado = url.searchParams.get('estado')
        const includeGastos = url.searchParams.get('includeGastos') === 'true'

        // Construir condición
        const where: any = {
            userId: auth.user.id,
        }

        if (estado) {
            where.estado = estado
        }

        const recurrentes = await prisma.gastoRecurrente.findMany({
            where,
            include: {
                categoria: {
                    select: {
                        id: true,
                        descripcion: true,
                        grupo_categoria: true,
                    },
                },
                ...(includeGastos && {
                    gastosGenerados: {
                        select: {
                            id: true,
                            concepto: true,
                            monto: true,
                            fecha: true,
                            tipoTransaccion: true,
                            tipoMovimiento: true,
                        },
                        orderBy: { createdAt: 'desc' as const },
                        take: 5,
                    },
                }),
            },
            orderBy: { proximaFecha: 'asc' },
        })

        const data = recurrentes.map((r) => ({
            id: r.id,
            concepto: r.concepto,
            periodicidad: r.periodicidad,
            monto: r.monto,
            estado: r.estado,
            comentario: r.comentario,
            proximaFecha: r.proximaFecha,
            ultimoPago: r.ultimoPago,
            tipoMovimiento: r.tipoMovimiento,
            esServicio: r.esServicio,
            categoria: r.categoria
                ? {
                    id: r.categoria.id,
                    nombre: r.categoria.descripcion,
                    grupo: r.categoria.grupo_categoria,
                }
                : null,
            ...(includeGastos && {
                ultimosGastos: (r as any).gastosGenerados || [],
            }),
            createdAt: r.createdAt,
        }))

        return NextResponse.json({
            data,
            meta: {
                total: data.length,
            },
        })
    } catch (error) {
        console.error('Error API Agent recurrentes:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

// POST /api/v1/agent/recurrentes — Crear un nuevo gasto recurrente
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
            periodicidad,
            monto,
            proximaFecha,
            tipoMovimiento = 'efectivo',
            categoriaId,
            comentario,
        } = body

        if (!concepto || !periodicidad || monto === undefined) {
            return NextResponse.json(
                { error: 'Faltan campos requeridos: concepto, periodicidad, monto' },
                { status: 400 }
            )
        }

        if (categoriaId) {
            const cat = await prisma.categoria.findUnique({ where: { id: Number(categoriaId) } })
            if (!cat) {
                return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 400 })
            }
        }

        const validacion = await validateLimit(auth.user.id, 'transacciones_mes')
        if (!validacion.allowed) {
            return NextResponse.json({
                error: 'Límite de transacciones alcanzado',
                detalles: validacion
            }, { status: 403 })
        }

        let proximaFechaDate: Date | undefined = undefined
        if (proximaFecha) {
            const d = new Date(proximaFecha)
            if (isNaN(d.getTime())) {
                return NextResponse.json({ error: 'Formato de proximaFecha inválido. Usar ISO 8601.' }, { status: 400 })
            }
            proximaFechaDate = d
        }

        const recurrente = await prisma.gastoRecurrente.create({
            data: {
                concepto,
                periodicidad,
                monto: Number(monto),
                tipoMovimiento,
                estado: 'pendiente',
                userId: auth.user.id,
                ...(proximaFechaDate && { proximaFecha: proximaFechaDate }),
                ...(categoriaId && { categoriaId: Number(categoriaId) }),
                ...(comentario && { comentario }),
            },
        })

        await incrementUsage(auth.user.id, 'transacciones_mes')

        return NextResponse.json(recurrente, { status: 201 })

    } catch (error) {
        console.error('Error API Agent POST recurrentes:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
