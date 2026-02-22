import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { validateApiKey } from '@/lib/api-key'

// GET /api/v1/agent/resumen — Resumen financiero consolidado del usuario
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
        const now = new Date()
        const mes = Number(url.searchParams.get('mes')) || now.getMonth() + 1
        const año = Number(url.searchParams.get('año') || url.searchParams.get('anio')) || now.getFullYear()

        // Calcular rango del mes
        const inicioMes = new Date(año, mes - 1, 1)
        const finMes = new Date(año, mes, 0, 23, 59, 59, 999)

        const userId = auth.user.id

        // Ejecutar todas las consultas en paralelo
        const [gastos, recurrentes, financiaciones] = await Promise.all([
            // Gastos del mes (excluyendo tarjeta)
            prisma.gasto.findMany({
                where: {
                    userId,
                    fecha: { gte: inicioMes, lte: finMes },
                    NOT: [{ tipoMovimiento: 'tarjeta' }],
                },
                include: {
                    categoriaRel: {
                        select: { descripcion: true },
                    },
                },
            }),

            // Gastos recurrentes activos
            prisma.gastoRecurrente.findMany({
                where: { userId },
                include: {
                    categoria: {
                        select: { descripcion: true },
                    },
                },
            }),

            // Financiaciones activas
            prisma.financiacion.findMany({
                where: {
                    userId,
                    cuotasRestantes: { gt: 0 },
                },
                include: {
                    gasto: {
                        select: { concepto: true, monto: true },
                    },
                },
            }),
        ])

        // Procesar gastos
        const gastosExpenses = gastos.filter(g => g.tipoTransaccion === 'expense')
        const gastosIncome = gastos.filter(g => g.tipoTransaccion === 'income')

        const totalGastos = gastosExpenses.reduce((sum, g) => sum + g.monto, 0)
        const totalIngresos = gastosIncome.reduce((sum, g) => sum + g.monto, 0)

        // Agrupar por categoría
        const porCategoria: Record<string, number> = {}
        for (const g of gastosExpenses) {
            const cat = g.categoriaRel?.descripcion || g.categoria || 'Sin categoría'
            porCategoria[cat] = (porCategoria[cat] || 0) + g.monto
        }

        // Ordenar categorías por monto (mayor a menor)
        const categoriasOrdenadas = Object.entries(porCategoria)
            .sort((a, b) => b[1] - a[1])
            .map(([nombre, monto]) => ({ nombre, monto }))

        // Días del mes para promedio
        const diasMes = finMes.getDate()
        const diasTranscurridos = Math.min(
            Math.ceil((now.getTime() - inicioMes.getTime()) / (1000 * 60 * 60 * 24)),
            diasMes
        )

        // Procesar recurrentes
        const recurrentesActivos = recurrentes.filter(r => r.estado !== 'cancelado')
        const recurrentesPendientes = recurrentes.filter(r => r.estado === 'pendiente')
        const totalRecurrentes = recurrentesActivos.reduce((sum, r) => sum + r.monto, 0)

        // Procesar financiaciones
        const totalMensualFinanciaciones = financiaciones.reduce((sum, f) => sum + f.montoCuota, 0)
        const cuotasRestantesTotal = financiaciones.reduce((sum, f) => sum + f.cuotasRestantes, 0)

        return NextResponse.json({
            periodo: {
                mes,
                año,
                desde: inicioMes.toISOString().split('T')[0],
                hasta: finMes.toISOString().split('T')[0],
            },
            gastos: {
                total: Math.round(totalGastos * 100) / 100,
                cantidad: gastosExpenses.length,
                porCategoria: categoriasOrdenadas,
                promedioDiario: diasTranscurridos > 0
                    ? Math.round((totalGastos / diasTranscurridos) * 100) / 100
                    : 0,
            },
            ingresos: {
                total: Math.round(totalIngresos * 100) / 100,
                cantidad: gastosIncome.length,
            },
            recurrentes: {
                totalMensual: Math.round(totalRecurrentes * 100) / 100,
                activos: recurrentesActivos.length,
                pendientesPago: recurrentesPendientes.length,
                detalle: recurrentesActivos.map(r => ({
                    id: r.id,
                    concepto: r.concepto,
                    monto: r.monto,
                    periodicidad: r.periodicidad,
                    estado: r.estado,
                    proximaFecha: r.proximaFecha,
                    categoria: r.categoria?.descripcion || null,
                })),
            },
            financiaciones: {
                totalMensual: Math.round(totalMensualFinanciaciones * 100) / 100,
                activas: financiaciones.length,
                cuotasRestantesTotal,
                detalle: financiaciones.map(f => ({
                    id: f.id,
                    concepto: f.gasto?.concepto || 'Sin concepto',
                    montoCuota: f.montoCuota,
                    cuotasPagadas: f.cuotasPagadas,
                    cuotasRestantes: f.cuotasRestantes,
                    cantidadCuotas: f.cantidadCuotas,
                    fechaProximoPago: f.fechaProximoPago,
                })),
            },
            balance: Math.round((totalIngresos - totalGastos) * 100) / 100,
            moneda: 'ARS',
        })
    } catch (error) {
        console.error('Error API Agent resumen:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
