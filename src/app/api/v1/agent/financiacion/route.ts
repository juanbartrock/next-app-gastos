import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { validateApiKey } from '@/lib/api-key'

// GET /api/v1/agent/financiacion — Financiaciones (compras en cuotas) del usuario
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
        const estado = url.searchParams.get('estado') // activa | completada
        const includeGasto = url.searchParams.get('includeGasto') !== 'false' // true por defecto

        // Construir condición
        const where: any = {
            userId: auth.user.id,
        }

        // Filtrar por estado (activa = tiene cuotas restantes, completada = no tiene)
        if (estado === 'activa') {
            where.cuotasRestantes = { gt: 0 }
        } else if (estado === 'completada') {
            where.cuotasRestantes = 0
        }

        const financiaciones = await prisma.financiacion.findMany({
            where,
            include: {
                ...(includeGasto && {
                    gasto: {
                        select: {
                            id: true,
                            concepto: true,
                            monto: true,
                            fecha: true,
                            categoria: true,
                        },
                    },
                }),
                tarjetaInfo: true,
            },
            orderBy: { fechaProximoPago: 'asc' },
        })

        const data = financiaciones.map((f) => ({
            id: f.id,
            cantidadCuotas: f.cantidadCuotas,
            cuotasPagadas: f.cuotasPagadas,
            cuotasRestantes: f.cuotasRestantes,
            montoCuota: f.montoCuota,
            montoTotal: f.cantidadCuotas * f.montoCuota,
            fechaPrimerPago: f.fechaPrimerPago,
            fechaProximoPago: f.fechaProximoPago,
            diaPago: f.diaPago,
            estado: f.cuotasRestantes > 0 ? 'activa' : 'completada',
            tarjeta: f.tarjetaInfo?.tarjetaEspecifica || null,
            ...(includeGasto && f.gasto && {
                gasto: {
                    id: f.gasto.id,
                    concepto: f.gasto.concepto,
                    montoOriginal: f.gasto.monto,
                    fecha: f.gasto.fecha,
                    categoria: f.gasto.categoria,
                },
            }),
            createdAt: f.createdAt,
        }))

        return NextResponse.json({
            data,
            meta: {
                total: data.length,
                activas: data.filter(f => f.estado === 'activa').length,
                completadas: data.filter(f => f.estado === 'completada').length,
            },
        })
    } catch (error) {
        console.error('Error API Agent financiacion:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

// POST /api/v1/agent/financiacion — Crear una financiación asociada a un gasto existente
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

        const {
            gastoId,
            cantidadCuotas,
            montoCuota,
            fechaPrimerPago,
            diaPago,
            tarjetaEspecifica,
        } = await request.json()

        if (!gastoId) {
            return NextResponse.json(
                { error: 'El ID del gasto es obligatorio' },
                { status: 400 }
            )
        }

        if (!cantidadCuotas || Number(cantidadCuotas) < 1) {
            return NextResponse.json(
                { error: 'La cantidad de cuotas debe ser al menos 1' },
                { status: 400 }
            )
        }

        if (!montoCuota || Number(montoCuota) <= 0) {
            return NextResponse.json(
                { error: 'El monto de la cuota debe ser mayor a 0' },
                { status: 400 }
            )
        }

        const gasto = await prisma.gasto.findUnique({
            where: { id: Number(gastoId) },
        })

        if (!gasto) {
            return NextResponse.json(
                { error: `Gasto con ID ${gastoId} no encontrado` },
                { status: 404 }
            )
        }

        if (gasto.userId !== auth.user.id) {
            return NextResponse.json(
                { error: 'El gasto no pertenece al usuario de la API key' },
                { status: 403 }
            )
        }

        const financiacionExistente = await prisma.financiacion.findUnique({
            where: { gastoId: Number(gastoId) },
        })

        if (financiacionExistente) {
            return NextResponse.json(
                { error: 'Este gasto ya tiene una financiación asociada' },
                { status: 400 }
            )
        }

        let fechaPrimerPagoDate: Date | null = null
        if (fechaPrimerPago) {
            fechaPrimerPagoDate = new Date(fechaPrimerPago)
            if (Number.isNaN(fechaPrimerPagoDate.getTime())) {
                return NextResponse.json(
                    { error: 'Formato de fecha primer pago inválido' },
                    { status: 400 }
                )
            }
        }

        const resultado = await prisma.$transaction(async (tx) => {
            const financiacion = await tx.financiacion.create({
                data: {
                    gastoId: Number(gastoId),
                    userId: auth.user.id,
                    cantidadCuotas: Number(cantidadCuotas),
                    cuotasPagadas: 0,
                    cuotasRestantes: Number(cantidadCuotas),
                    montoCuota: Number(montoCuota),
                    fechaPrimerPago: fechaPrimerPagoDate,
                    fechaProximoPago: fechaPrimerPagoDate,
                    diaPago: diaPago ? Number(diaPago) : null,
                },
            })

            let tarjetaInfo = null
            if (tarjetaEspecifica) {
                tarjetaInfo = await tx.financiacionTarjeta.create({
                    data: {
                        financiacionId: financiacion.id,
                        tarjetaEspecifica,
                    },
                })
            }

            return { financiacion, tarjetaInfo }
        })

        return NextResponse.json({
            ...resultado.financiacion,
            tarjetaInfo: resultado.tarjetaInfo,
        })
    } catch (error) {
        console.error('Error API Agent crear financiacion:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
