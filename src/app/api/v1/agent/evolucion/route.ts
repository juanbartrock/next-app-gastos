import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { validateApiKey } from '@/lib/api-key'

// Nombres de meses en español abreviados
const NOMBRES_MESES = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

// GET /api/v1/agent/evolucion — Evolución mensual de gastos/ingresos a lo largo del tiempo
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
        const categoriaParam = url.searchParams.get('categoria')
        const descripcionParam = url.searchParams.get('descripcion')
        const tipoParam = url.searchParams.get('tipo')
        const mesesParam = url.searchParams.get('meses')
        const monedaParam = url.searchParams.get('moneda')

        // Validar que al menos categoria o descripcion estén presentes
        if (!categoriaParam && !descripcionParam) {
            return NextResponse.json(
                {
                    error: 'Se requiere al menos uno de los parámetros: "categoria" o "descripcion".',
                    ejemplo: '/api/v1/agent/evolucion?categoria=salario&meses=12',
                },
                { status: 400 }
            )
        }

        // Validar y normalizar parámetro meses (default 12, max 60)
        const meses = Math.min(Math.max(Number(mesesParam) || 12, 1), 60)

        // Validar tipo
        if (tipoParam && !['ingreso', 'gasto'].includes(tipoParam)) {
            return NextResponse.json(
                { error: 'El parámetro "tipo" debe ser "ingreso" o "gasto".' },
                { status: 400 }
            )
        }

        // Validar moneda
        if (monedaParam && !['ARS', 'USD'].includes(monedaParam)) {
            return NextResponse.json(
                { error: 'El parámetro "moneda" debe ser "ARS" o "USD".' },
                { status: 400 }
            )
        }

        // Calcular rango de fechas: desde el inicio del mes más antiguo hasta el fin del mes actual
        const ahora = new Date()
        const mesActual = ahora.getMonth()   // 0-based
        const anioActual = ahora.getFullYear()

        // Inicio del primer mes del período
        const fechaInicio = new Date(anioActual, mesActual - meses + 1, 1)
        // Fin del mes actual
        const fechaFin = new Date(anioActual, mesActual + 1, 0, 23, 59, 59, 999)

        // Construir condición WHERE de Prisma
        const where: any = {
            userId: auth.user.id,
            fecha: {
                gte: fechaInicio,
                lte: fechaFin,
            },
            NOT: [{ tipoMovimiento: 'tarjeta' }],
        }

        // Filtro por categoría (sobre campo texto categoria o categoriaRel.descripcion)
        if (categoriaParam) {
            where.OR = [
                { categoria: { contains: categoriaParam, mode: 'insensitive' } },
                {
                    categoriaRel: {
                        descripcion: { contains: categoriaParam, mode: 'insensitive' },
                    },
                },
            ]
        }

        // Filtro por descripción/concepto
        if (descripcionParam) {
            const descFiltro = { concepto: { contains: descripcionParam, mode: 'insensitive' } }
            if (where.OR) {
                // Combinar con el filtro de categoría usando AND implícito de OR separados
                // Necesitamos AND(OR[cat], OR[desc]) → usamos AND explícito
                const catOR = where.OR
                delete where.OR
                where.AND = [
                    { OR: catOR },
                    descFiltro,
                ]
            } else {
                where.AND = [descFiltro]
            }
        }

        // Filtro por tipo de transacción
        // La app usa 'expense'/'income' internamente; el endpoint acepta 'gasto'/'ingreso'
        if (tipoParam) {
            const tipoInterno = tipoParam === 'ingreso' ? 'income' : 'expense'
            where.tipoTransaccion = tipoInterno
        }

        // Filtro por moneda
        if (monedaParam) {
            where.moneda = monedaParam
        }

        // Traer todos los gastos del período que cumplan los filtros
        const gastos = await prisma.gasto.findMany({
            where,
            select: {
                id: true,
                monto: true,
                moneda: true,
                fecha: true,
                tipoTransaccion: true,
            },
            orderBy: { fecha: 'asc' },
        })

        // Construir mapa mes→año de todos los meses del período
        // Ordenado del más antiguo al más reciente
        type EntradaMes = {
            año: number
            mes: number
            mes_nombre: string
            total_ars: number
            total_usd: number
            cantidad: number
        }

        const mesesMap = new Map<string, EntradaMes>()
        for (let i = 0; i < meses; i++) {
            // Calcular mes relativo (0-based desde el mes actual hacia atrás)
            const offset = meses - 1 - i
            const d = new Date(anioActual, mesActual - offset, 1)
            const anio = d.getFullYear()
            const mes = d.getMonth() + 1 // 1-based
            const key = `${anio}-${String(mes).padStart(2, '0')}`
            mesesMap.set(key, {
                año: anio,
                mes,
                mes_nombre: `${NOMBRES_MESES[mes - 1]} ${anio}`,
                total_ars: 0,
                total_usd: 0,
                cantidad: 0,
            })
        }

        // Acumular gastos en el mapa
        for (const g of gastos) {
            const d = g.fecha
            const anio = d.getFullYear()
            const mes = d.getMonth() + 1
            const key = `${anio}-${String(mes).padStart(2, '0')}`
            const entrada = mesesMap.get(key)
            if (!entrada) continue // fuera del rango (no debería ocurrir)

            if (g.moneda === 'USD') {
                entrada.total_usd += g.monto
            } else {
                // Todo lo que no sea USD se acumula en ARS
                entrada.total_ars += g.monto
            }
            entrada.cantidad++
        }

        // Construir array de evolución con promedio_ars
        const evolucion = Array.from(mesesMap.values()).map((e) => ({
            año: e.año,
            mes: e.mes,
            mes_nombre: e.mes_nombre,
            total_ars: Math.round(e.total_ars * 100) / 100,
            total_usd: Math.round(e.total_usd * 100) / 100,
            cantidad: e.cantidad,
            promedio_ars: e.cantidad > 0
                ? Math.round((e.total_ars / e.cantidad) * 100) / 100
                : 0,
        }))

        // Calcular resumen
        const periodosConDatos = evolucion.filter((e) => e.cantidad > 0).length
        const totalPeriodos = evolucion.length

        // Promedio mensual ARS sobre todos los meses (incluyendo los sin datos)
        const sumaARS = evolucion.reduce((acc, e) => acc + e.total_ars, 0)
        const promedioMensualARS = totalPeriodos > 0
            ? Math.round((sumaARS / totalPeriodos) * 100) / 100
            : 0

        // Calcular tendencia: comparar promedio últimos 3 meses vs período anterior
        let tendencia: 'sube' | 'baja' | 'estable' = 'estable'
        if (evolucion.length >= 6) {
            const ultimos3 = evolucion.slice(-3)
            const anteriores3 = evolucion.slice(-6, -3)

            const promedioUltimos3 = ultimos3.reduce((acc, e) => acc + e.total_ars, 0) / 3
            const promedioAnteriores3 = anteriores3.reduce((acc, e) => acc + e.total_ars, 0) / 3

            if (promedioAnteriores3 > 0) {
                const variacion = (promedioUltimos3 - promedioAnteriores3) / promedioAnteriores3
                if (variacion > 0.1) tendencia = 'sube'
                else if (variacion < -0.1) tendencia = 'baja'
            } else if (promedioUltimos3 > 0) {
                // Período anterior sin datos, período actual con datos → sube
                tendencia = 'sube'
            }
        }

        return NextResponse.json({
            filtros: {
                categoria: categoriaParam ?? null,
                descripcion: descripcionParam ?? null,
                tipo: tipoParam ?? null,
                meses,
                moneda: monedaParam ?? null,
            },
            evolucion,
            resumen: {
                total_periodos: totalPeriodos,
                periodos_con_datos: periodosConDatos,
                promedio_mensual_ars: promedioMensualARS,
                tendencia,
            },
        })
    } catch (error) {
        console.error('Error API Agent evolucion:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
