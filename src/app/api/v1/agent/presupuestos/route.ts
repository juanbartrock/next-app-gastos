import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { validateApiKey } from '@/lib/api-key'
import { validateLimit, incrementUsage } from '@/lib/plan-limits'

// GET /api/v1/agent/presupuestos — Listar presupuestos del usuario con gasto actual
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
        const mesParam = url.searchParams.get('mes')
        const añoParam = url.searchParams.get('año')

        const where: Record<string, unknown> = {
            userId: auth.user.id,
        }

        if (mesParam) {
            const mes = Number(mesParam)
            if (isNaN(mes) || mes < 1 || mes > 12) {
                return NextResponse.json({ error: 'Parámetro "mes" inválido (1-12)' }, { status: 400 })
            }
            where.mes = mes
        }

        if (añoParam) {
            const año = Number(añoParam)
            if (isNaN(año)) {
                return NextResponse.json({ error: 'Parámetro "año" inválido' }, { status: 400 })
            }
            where.año = año
        }

        const presupuestos = await prisma.presupuesto.findMany({
            where,
            select: {
                id: true,
                nombre: true,
                monto: true,
                mes: true,
                año: true,
                descripcion: true,
                categoriaId: true,
                createdAt: true,
            },
            orderBy: [{ año: 'desc' }, { mes: 'desc' }, { nombre: 'asc' }],
        })

        // Calcular gastoActual para cada presupuesto
        const data = await Promise.all(
            presupuestos.map(async (p) => {
                // Rango de fechas del mes/año del presupuesto
                const fechaInicio = new Date(p.año, p.mes - 1, 1)
                const fechaFin = new Date(p.año, p.mes, 1)

                const gastoWhere: Record<string, unknown> = {
                    userId: auth.user.id,
                    tipoTransaccion: 'expense',
                    NOT: [{ tipoMovimiento: 'tarjeta' }],
                    fecha: { gte: fechaInicio, lt: fechaFin },
                }

                if (p.categoriaId) {
                    gastoWhere.categoriaId = p.categoriaId
                }

                const agg = await prisma.gasto.aggregate({
                    where: gastoWhere,
                    _sum: { monto: true },
                })

                const gastoActual = agg._sum.monto ?? 0
                const disponible = p.monto - gastoActual
                const porcentajeConsumido = p.monto > 0 ? (gastoActual / p.monto) * 100 : 0

                return {
                    id: p.id,
                    nombre: p.nombre,
                    monto: p.monto,
                    mes: p.mes,
                    año: p.año,
                    descripcion: p.descripcion,
                    categoriaId: p.categoriaId,
                    createdAt: p.createdAt,
                    gastoActual,
                    disponible,
                    porcentajeConsumido: Math.round(porcentajeConsumido * 100) / 100,
                }
            })
        )

        return NextResponse.json({
            data,
            meta: { total: data.length },
        })

    } catch (error) {
        console.error('Error API Agent GET presupuestos:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

// POST /api/v1/agent/presupuestos — Crear un nuevo presupuesto
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
        const { nombre, monto, mes, año, categoriaId, descripcion } = body

        if (!nombre || monto === undefined || mes === undefined || año === undefined) {
            return NextResponse.json(
                { error: 'Faltan campos requeridos: nombre, monto, mes, año' },
                { status: 400 }
            )
        }

        const mesNum = Number(mes)
        const añoNum = Number(año)

        if (isNaN(mesNum) || mesNum < 1 || mesNum > 12) {
            return NextResponse.json({ error: 'Campo "mes" inválido (1-12)' }, { status: 400 })
        }
        if (isNaN(añoNum)) {
            return NextResponse.json({ error: 'Campo "año" inválido' }, { status: 400 })
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

        const presupuesto = await prisma.presupuesto.create({
            data: {
                nombre,
                monto: Number(monto),
                mes: mesNum,
                año: añoNum,
                userId: auth.user.id,
                tipo: 'personal',
                ...(descripcion && { descripcion }),
                ...(categoriaId && { categoriaId: Number(categoriaId) }),
            },
        })

        await incrementUsage(auth.user.id, 'transacciones_mes')

        return NextResponse.json(presupuesto, { status: 201 })

    } catch (error) {
        console.error('Error API Agent POST presupuestos:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
