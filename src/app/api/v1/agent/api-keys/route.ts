import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'
import { generateApiKey, listApiKeys, revokeApiKey } from '@/lib/api-key'

// POST /api/v1/agent/api-keys — Generar una nueva API key (requiere sesión)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(options)

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'No autorizado. Debes estar logueado para crear una API key.' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const nombre = body.nombre || 'API Key'
        const permisos = body.permisos || ['read']
        const expiracionDias = body.expiracionDias || undefined

        // Validar permisos
        const permisosValidos = ['read', 'write']
        for (const p of permisos) {
            if (!permisosValidos.includes(p)) {
                return NextResponse.json(
                    { error: `Permiso inválido: ${p}. Permisos válidos: ${permisosValidos.join(', ')}` },
                    { status: 400 }
                )
            }
        }

        // Verificar límite de keys activas (máximo 5)
        const keysActivas = await prisma.apiKey.count({
            where: { userId: session.user.id, activa: true },
        })

        if (keysActivas >= 5) {
            return NextResponse.json(
                { error: 'Límite alcanzado. Máximo 5 API keys activas. Revoca una key existente primero.' },
                { status: 400 }
            )
        }

        const result = await generateApiKey(session.user.id, nombre, permisos, expiracionDias)

        return NextResponse.json({
            message: '⚠️ Esta es la ÚNICA vez que verás la API key completa. Guárdala en un lugar seguro.',
            apiKey: result,
        })
    } catch (error) {
        console.error('Error creando API key:', error)
        return NextResponse.json(
            { error: 'Error al crear la API key' },
            { status: 500 }
        )
    }
}

// GET /api/v1/agent/api-keys — Listar API keys del usuario (requiere sesión)
export async function GET() {
    try {
        const session = await getServerSession(options)

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            )
        }

        const keys = await listApiKeys(session.user.id)

        return NextResponse.json({ apiKeys: keys })
    } catch (error) {
        console.error('Error listando API keys:', error)
        return NextResponse.json(
            { error: 'Error al listar las API keys' },
            { status: 500 }
        )
    }
}

// DELETE /api/v1/agent/api-keys — Revocar una API key (requiere sesión)
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(options)

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            )
        }

        const url = new URL(request.url)
        const keyId = url.searchParams.get('id')

        if (!keyId) {
            return NextResponse.json(
                { error: 'Se requiere el parámetro "id" de la API key a revocar' },
                { status: 400 }
            )
        }

        const result = await revokeApiKey(keyId, session.user.id)

        if (!result) {
            return NextResponse.json(
                { error: 'API key no encontrada o no pertenece a tu usuario' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            message: 'API key revocada exitosamente',
            keyId: result.id,
            nombre: result.nombre,
        })
    } catch (error) {
        console.error('Error revocando API key:', error)
        return NextResponse.json(
            { error: 'Error al revocar la API key' },
            { status: 500 }
        )
    }
}
