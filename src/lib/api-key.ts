import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// Prefijo para identificar las API keys de FinanzIA
const API_KEY_PREFIX = 'finIA_'

interface ApiKeyValidationResult {
    user: {
        id: string
        email: string | null
        name: string | null
    }
    apiKey: {
        id: string
        nombre: string
        permisos: string[]
    }
}

/**
 * Valida una API key extraída del header Authorization: Bearer <key>
 * Retorna el usuario y la key si es válida, null si no.
 */
export async function validateApiKey(
    request: NextRequest
): Promise<ApiKeyValidationResult | null> {
    try {
        const authHeader = request.headers.get('authorization')

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null
        }

        const rawKey = authHeader.slice(7).trim()

        if (!rawKey || !rawKey.startsWith(API_KEY_PREFIX)) {
            return null
        }

        // Buscar todas las API keys activas (filtrar por prefix para reducir scope)
        const keyPrefix = rawKey.slice(0, 8)
        const candidates = await prisma.apiKey.findMany({
            where: {
                keyPrefix: keyPrefix,
                activa: true,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
        })

        // Verificar el hash contra cada candidata
        for (const candidate of candidates) {
            const isMatch = await bcrypt.compare(rawKey, candidate.keyHash)

            if (isMatch) {
                // Verificar expiración
                if (candidate.expiracion && new Date() > candidate.expiracion) {
                    return null
                }

                // Actualizar último uso (fire-and-forget)
                prisma.apiKey.update({
                    where: { id: candidate.id },
                    data: { ultimoUso: new Date() },
                }).catch(() => { }) // No falla si no puede actualizar

                return {
                    user: candidate.user,
                    apiKey: {
                        id: candidate.id,
                        nombre: candidate.nombre,
                        permisos: candidate.permisos,
                    },
                }
            }
        }

        return null
    } catch (error) {
        console.error('Error validando API key:', error)
        return null
    }
}

/**
 * Genera una nueva API key para un usuario.
 * Retorna la key en texto plano (solo visible una vez) y el registro guardado.
 */
export async function generateApiKey(
    userId: string,
    nombre: string,
    permisos: string[] = ['read'],
    expiracionDias?: number
) {
    // Generar key random: finIA_ + 40 chars hex
    const randomPart = crypto.randomBytes(20).toString('hex')
    const rawKey = `${API_KEY_PREFIX}${randomPart}`
    const keyPrefix = rawKey.slice(0, 8)

    // Hashear con bcrypt
    const keyHash = await bcrypt.hash(rawKey, 10)

    // Calcular expiración
    let expiracion: Date | null = null
    if (expiracionDias) {
        expiracion = new Date()
        expiracion.setDate(expiracion.getDate() + expiracionDias)
    }

    // Guardar en DB
    const apiKeyRecord = await prisma.apiKey.create({
        data: {
            nombre,
            keyHash,
            keyPrefix,
            userId,
            permisos,
            expiracion,
        },
    })

    return {
        // La key en texto plano SOLO se muestra una vez
        key: rawKey,
        id: apiKeyRecord.id,
        nombre: apiKeyRecord.nombre,
        keyPrefix: apiKeyRecord.keyPrefix,
        permisos: apiKeyRecord.permisos,
        expiracion: apiKeyRecord.expiracion,
        createdAt: apiKeyRecord.createdAt,
    }
}

/**
 * Revoca una API key (soft-delete: marca como inactiva).
 */
export async function revokeApiKey(keyId: string, userId: string) {
    const apiKey = await prisma.apiKey.findFirst({
        where: {
            id: keyId,
            userId: userId,
        },
    })

    if (!apiKey) {
        return null
    }

    return await prisma.apiKey.update({
        where: { id: keyId },
        data: { activa: false },
    })
}

/**
 * Lista las API keys de un usuario (sin mostrar hashes).
 */
export async function listApiKeys(userId: string) {
    return await prisma.apiKey.findMany({
        where: { userId },
        select: {
            id: true,
            nombre: true,
            keyPrefix: true,
            permisos: true,
            activa: true,
            ultimoUso: true,
            expiracion: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
    })
}
