import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { validateApiKey } from '@/lib/api-key'

// PUT /api/v1/agent/presupuestos/[id] — Editar un presupuesto
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

        const existente = await prisma.presupuesto.findFirst({
            where: { id, userId: auth.user.id },
        })

        if (!existente) {
            return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 })
        }

        const body = await request.json()
        const { nombre, monto, mes, año, descripcion, categoriaId } = body

        const data: Record<string, unknown> = {}
        if (nombre !== undefined) data.nombre = nombre
        if (monto !== undefined) data.monto = Number(monto)
        if (mes !== undefined) {
            const mesNum = Number(mes)
            if (isNaN(mesNum) || mesNum < 1 || mesNum > 12) {
                return NextResponse.json({ error: 'Campo "mes" inválido (1-12)' }, { status: 400 })
            }
            data.mes = mesNum
        }
        if (año !== undefined) {
            const añoNum = Number(año)
            if (isNaN(añoNum)) {
                return NextResponse.json({ error: 'Campo "año" inválido' }, { status: 400 })
            }
            data.año = añoNum
        }
        if (descripcion !== undefined) data.descripcion = descripcion
        if (categoriaId !== undefined) data.categoriaId = categoriaId === null ? null : Number(categoriaId)

        const actualizado = await prisma.presupuesto.update({
            where: { id },
            data,
        })

        return NextResponse.json(actualizado)

    } catch (error) {
        console.error('Error API Agent PUT presupuestos/[id]:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

// DELETE /api/v1/agent/presupuestos/[id] — Eliminar un presupuesto
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

        const existente = await prisma.presupuesto.findFirst({
            where: { id, userId: auth.user.id },
        })

        if (!existente) {
            return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 })
        }

        await prisma.presupuesto.delete({ where: { id } })

        return NextResponse.json({ message: 'eliminado' })

    } catch (error) {
        console.error('Error API Agent DELETE presupuestos/[id]:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
