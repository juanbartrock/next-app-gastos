import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { name, phone, timezone, currency, dateFormat, language } = await request.json()

    // Validaciones básicas
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ 
        error: 'El nombre es requerido' 
      }, { status: 400 })
    }

    if (phone && !/^[\+]?[\d\s\-\(\)]*$/.test(phone)) {
      return NextResponse.json({ 
        error: 'Formato de teléfono inválido' 
      }, { status: 400 })
    }

    // Actualizar información del usuario
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        phoneNumber: phone || null,
        // timezone, currency, dateFormat, language se almacenarán en el futuro
        // cuando agreguemos estos campos al schema
        ultimaActividad: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        image: true,
        fechaRegistro: true,
        ultimaActividad: true
      }
    })

    console.log(`✅ Perfil actualizado para usuario: ${updatedUser.email}`)

    return NextResponse.json({
      message: 'Perfil actualizado correctamente',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phoneNumber || '',
        timezone: timezone || 'America/Argentina/Buenos_Aires',
        currency: currency || 'ARS',
        dateFormat: dateFormat || 'DD/MM/YYYY',
        language: language || 'es-AR',
        image: updatedUser.image,
        updatedAt: updatedUser.ultimaActividad
      }
    })

  } catch (error) {
    console.error('Error actualizando perfil:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 