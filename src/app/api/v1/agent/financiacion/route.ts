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
