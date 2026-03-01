import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { validateApiKey } from '@/lib/api-key'

// GET /api/v1/agent/saldos — Saldos acumulados (Total, Efectivo, Digital, Ahorro)
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

        const userId = auth.user.id

        // Determinar si el usuario pertenece a grupos familiares
        const gruposMiembro = await prisma.grupoMiembro.findMany({
            where: { userId },
            include: {
                grupo: { select: { id: true, adminId: true } }
            }
        })

        // Construir lista de userIds a incluir en el cálculo
        let userIds: string[] = [userId]
        let incluirEnFamiliaFilter: boolean | undefined = undefined

        if (gruposMiembro.length > 0) {
            const puedeVerFamiliar = gruposMiembro.some(m =>
                m.grupo.adminId === userId || m.rol === 'administrador'
            )

            if (puedeVerFamiliar) {
                // Incluir todos los miembros de los grupos del usuario
                const grupoIds = gruposMiembro.map(g => g.grupoId)
                const miembrosDeGrupos = await prisma.grupoMiembro.findMany({
                    where: { grupoId: { in: grupoIds } },
                    select: { userId: true }
                })
                userIds = [...new Set(miembrosDeGrupos.map(m => m.userId))]
            } else {
                // Solo sus propias transacciones marcadas como familiares
                incluirEnFamiliaFilter = true
            }

            // Ambos casos filtran por incluirEnFamilia para coincidir con el dashboard
            incluirEnFamiliaFilter = true
        }

        // Obtener transacciones para calcular saldos históricos
        // Se excluyen movimientos de tarjeta de crédito ya que son deuda, no saldo líquido
        const transacciones = await prisma.gasto.findMany({
            where: {
                userId: userIds.length === 1 ? userId : { in: userIds },
                ...(incluirEnFamiliaFilter !== undefined && { incluirEnFamilia: incluirEnFamiliaFilter }),
                NOT: [{ tipoMovimiento: 'tarjeta' }]
            },
            select: {
                monto: true,
                tipoTransaccion: true, // 'income' | 'expense'
                tipoMovimiento: true   // 'efectivo' | 'digital' | 'ahorro'
            }
        })

        // Inicializar acumuladores
        const saldos = {
            total: 0,
            efectivo: 0,
            digital: 0,
            ahorro: 0
        }

        // Calcular saldos
        for (const t of transacciones) {
            // Si es ingreso suma, si es gasto resta
            const monto = t.tipoTransaccion === 'income' ? t.monto : -t.monto

            // Actualizar total general
            saldos.total += monto

            // Actualizar saldo específico según tipo de movimiento
            if (t.tipoMovimiento === 'efectivo') {
                saldos.efectivo += monto
            } else if (t.tipoMovimiento === 'digital') {
                saldos.digital += monto
            } else if (t.tipoMovimiento === 'ahorro') {
                saldos.ahorro += monto
            }
        }

        // Redondear a 2 decimales para evitar errores de punto flotante
        const round = (num: number) => Math.round(num * 100) / 100

        return NextResponse.json({
            moneda: 'ARS',
            total: round(saldos.total),
            desglose: {
                efectivo: round(saldos.efectivo),
                digital: round(saldos.digital),
                ahorro: round(saldos.ahorro)
            },
            timestamp: new Date().toISOString()
        })

    } catch (error) {
        console.error('Error API Agent saldos:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
