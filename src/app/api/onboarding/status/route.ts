import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        onboardingCompleted: true,
        onboardingStep: true,
        onboardingSkipped: true,
        onboardingStartedAt: true,
        onboardingCompletedAt: true,
        onboardingSteps: true,
        tourPreference: true,
        lastOnboardingVersion: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Determinar si es primera vez basado en varios factores
    const isFirstTime = !user.onboardingCompleted && !user.onboardingSkipped

    return NextResponse.json({
      onboardingCompleted: user.onboardingCompleted || false,
      onboardingSkipped: user.onboardingSkipped || false,
      currentStep: user.onboardingStep || 0,
      completedSteps: user.onboardingSteps ? (user.onboardingSteps as string[]) : [],
      tourPreference: user.tourPreference || 'full',
      isFirstTime,
      onboardingStartedAt: user.onboardingStartedAt,
      onboardingCompletedAt: user.onboardingCompletedAt,
      lastOnboardingVersion: user.lastOnboardingVersion
    })

  } catch (error) {
    console.error('Error obteniendo estado de onboarding:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 