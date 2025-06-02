import { NextRequest, NextResponse } from 'next/server'
import AlertEngine from '@/lib/alert-engine/AlertEngine'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// API para ser llamada por servicios externos de cron
export async function GET(request: NextRequest) {
  try {
    // Verificar token de autorización para cron jobs
    const authHeader = request.headers.get('Authorization')
    const expectedToken = process.env.CRON_SECRET_TOKEN || 'cron-default-token'
    
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Token de autorización inválido' }, { status: 401 })
    }

    console.log('🔄 Iniciando evaluación automática de alertas via CRON...')
    
    // Obtener todos los usuarios activos
    const usuarios = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
      },
      where: {
        // Solo usuarios que tienen datos recientes (últimos 30 días)
        OR: [
          {
            gastos: {
              some: {
                fecha: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
              }
            }
          },
          {
            presupuestos: {
              some: {
                año: new Date().getFullYear(),
                mes: {
                  gte: new Date().getMonth() + 1 - 1,
                }
              }
            }
          }
        ]
      }
    })

    console.log(`📊 Evaluando alertas para ${usuarios.length} usuarios activos`)

    const alertEngine = new AlertEngine()
    let totalAlertasCreadas = 0
    let resultados = []

    for (const usuario of usuarios) {
      try {
        const alertasCreadas = await alertEngine.runAutomaticEvaluation(usuario.id)
        
        resultados.push({
          userId: usuario.id,
          email: usuario.email,
          alertasCreadas
        })
        
        if (alertasCreadas > 0) {
          console.log(`✅ Usuario ${usuario.email}: ${alertasCreadas} nueva${alertasCreadas === 1 ? '' : 's'} alerta${alertasCreadas === 1 ? '' : 's'} creada${alertasCreadas === 1 ? '' : 's'}`)
          totalAlertasCreadas += alertasCreadas
        }
      } catch (error) {
        console.error(`❌ Error evaluando alertas para usuario ${usuario.email}:`, error)
        resultados.push({
          userId: usuario.id,
          email: usuario.email,
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
      }
    }

    // Limpiar alertas expiradas
    const alertasEliminadas = await prisma.alerta.deleteMany({
      where: {
        fechaExpiracion: {
          lt: new Date()
        }
      }
    })

    console.log(`🎉 Evaluación CRON completada: ${totalAlertasCreadas} alertas creadas en total`)
    
    if (alertasEliminadas.count > 0) {
      console.log(`🧹 Limpieza: ${alertasEliminadas.count} alertas expiradas eliminadas`)
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      totalUsuarios: usuarios.length,
      totalAlertasCreadas,
      alertasEliminadas: alertasEliminadas.count,
      resultados: process.env.NODE_ENV === 'development' ? resultados : undefined,
      mensaje: `Evaluación automática completada: ${totalAlertasCreadas} alertas creadas para ${usuarios.length} usuarios`
    })

  } catch (error) {
    console.error('❌ Error en evaluación automática de alertas (CRON):', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// También permitir POST para mayor flexibilidad
export async function POST(request: NextRequest) {
  return GET(request)
} 