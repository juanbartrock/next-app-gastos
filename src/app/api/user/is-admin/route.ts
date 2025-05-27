import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import { isAdmin } from '@/lib/auth-utils'

export async function GET() {
  try {
    const session = await getServerSession(options)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const userIsAdmin = await isAdmin(session.user.id)
    
    return NextResponse.json({
      isAdmin: userIsAdmin
    })

  } catch (error) {
    console.error('Error al verificar admin:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 