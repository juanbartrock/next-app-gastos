import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { completedSteps, tourType } = await request.json()

    console.log('🎯 Completando onboarding para usuario:', session.user.email)

    // Usar raw SQL para evitar problemas de tipo
    await prisma.$executeRaw`
      UPDATE "User" 
      SET 
        "onboardingCompleted" = true,
        "onboardingCompletedAt" = NOW(),
        "onboardingSteps" = ${JSON.stringify(completedSteps || [])}::json,
        "tourPreference" = ${tourType || 'full'},
        "lastOnboardingVersion" = '1.0'
      WHERE "id" = ${session.user.id}
    `

    console.log('✅ Onboarding completado exitosamente')

    return NextResponse.json({ 
      success: true,
      message: 'Onboarding completado exitosamente'
    })
  } catch (error) {
    console.error('❌ Error al completar onboarding:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 