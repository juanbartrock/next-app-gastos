import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { validateApiKey } from '@/lib/api-key'

// PUT /api/v1/agent/recurrentes/[id] — Editar un gasto recurrente
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params
        const recurrenteId = Number(id)
        if (isNaN(recurrenteId)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
        }

        const existente = await prisma.gastoRecurrente.findFirst({
            where: { id: recurrenteId, userId: auth.user.id },
        })

        if (!existente) {
            return NextResponse.json({ error: 'Gasto recurrente no encontrado' }, { status: 404 })
        }

        const body = await request.json()
        const {
            concepto,
            monto,
            periodicidad,
            estado,
            proximaFecha,
            tipoMovimiento,
            comentario,
            categoriaId,
        } = body

        const data: Record<string, unknown> = {}
        if (concepto !== undefined) data.concepto = concepto
        if (monto !== undefined) data.monto = Number(monto)
        if (periodicidad !== undefined) data.periodicidad = periodicidad
        if (estado !== undefined) data.estado = estado
        if (tipoMovimiento !== undefined) data.tipoMovimiento = tipoMovimiento
        if (comentario !== undefined) data.comentario = comentario
        if (categoriaId !== undefined) data.categoriaId = categoriaId === null ? null : Number(categoriaId)
        if (proximaFecha !== undefined) {
            if (proximaFecha === null) {
                data.proximaFecha = null
            } else {
                const d = new Date(proximaFecha)
                if (isNaN(d.getTime())) {
                    return NextResponse.json({ error: 'Formato de proximaFecha inválido. Usar ISO 8601.' }, { status: 400 })
                }
                data.proximaFecha = d
            }
        }

        const actualizado = await prisma.gastoRecurrente.update({
            where: { id: recurrenteId },
            data,
        })

        return NextResponse.json(actualizado)

    } catch (error) {
        console.error('Error API Agent PUT recurrentes/[id]:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

// DELETE /api/v1/agent/recurrentes/[id] — Eliminar un gasto recurrente
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params
        const recurrenteId = Number(id)
        if (isNaN(recurrenteId)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
        }

        const existente = await prisma.gastoRecurrente.findFirst({
            where: { id: recurrenteId, userId: auth.user.id },
        })

        if (!existente) {
            return NextResponse.json({ error: 'Gasto recurrente no encontrado' }, { status: 404 })
        }

        await prisma.gastoRecurrente.delete({ where: { id: recurrenteId } })

        return NextResponse.json({ message: 'eliminado' })

    } catch (error) {
        console.error('Error API Agent DELETE recurrentes/[id]:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
