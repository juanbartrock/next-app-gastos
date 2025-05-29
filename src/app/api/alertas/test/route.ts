import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"
import prisma from "@/lib/prisma"

// Función para agregar headers CORS
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

// Manejar preflight requests
export async function OPTIONS(request: NextRequest) {
  return addCorsHeaders(new NextResponse(null, { status: 200 }))
}

// POST /api/alertas/test - Crear alertas de prueba
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    
    // Para pruebas, si no hay sesión, crear alertas para un usuario demo
    let userId = session?.user?.id
    
    if (!userId) {
      // Buscar un usuario existente para las pruebas
      const usuariDemo = await prisma.user.findFirst({
        where: {
          email: { not: null }
        }
      })
      
      if (!usuariDemo) {
        const response = NextResponse.json(
          { 
            error: "No hay usuarios en la base de datos para crear alertas de prueba",
            sugerencia: "Inicia sesión primero o crea un usuario"
          }, 
          { status: 400 }
        )
        return addCorsHeaders(response)
      }
      
      userId = usuariDemo.id
    }

    // Crear algunas alertas de prueba
    const alertasPrueba = [
      {
        userId: userId,
        tipo: "PAGO_RECURRENTE",
        prioridad: "ALTA",
        titulo: "Pago recurrente próximo a vencer",
        mensaje: "Tu suscripción de Netflix vence mañana. Recuerda tener fondos suficientes.",
        canales: ["IN_APP"],
        metadatos: {
          monto: 2500,
          servicio: "Netflix"
        }
      },
      {
        userId: userId,
        tipo: "PRESUPUESTO_90",
        prioridad: "MEDIA",
        titulo: "Presupuesto al 90%",
        mensaje: "Has gastado el 90% de tu presupuesto mensual en Entretenimiento.",
        canales: ["IN_APP"],
        metadatos: {
          categoria: "Entretenimiento",
          porcentaje: 90,
          montoGastado: 18000,
          presupuesto: 20000
        }
      },
      {
        userId: userId,
        tipo: "OPORTUNIDAD_AHORRO",
        prioridad: "BAJA",
        titulo: "Oportunidad de ahorro detectada",
        mensaje: "Encontramos una promoción en tu servicio de telefonía que podría ahorrarte $500 mensuales.",
        canales: ["IN_APP"],
        metadatos: {
          ahorroMensual: 500,
          servicio: "Telefonía"
        }
      },
      {
        userId: userId,
        tipo: "TAREA_VENCIMIENTO",
        prioridad: "CRITICA",
        titulo: "Tarea financiera vencida",
        mensaje: "La tarea 'Revisar estado de inversiones' venció hace 2 días.",
        canales: ["IN_APP"],
        metadatos: {
          diasVencido: 2,
          tarea: "Revisar estado de inversiones"
        }
      }
    ]

    // Crear las alertas en la base de datos
    const alertasCreadas = await Promise.all(
      alertasPrueba.map(alerta => 
        prisma.alerta.create({
          data: alerta as any
        })
      )
    )

    const response = NextResponse.json({
      message: "Alertas de prueba creadas exitosamente",
      alertas: alertasCreadas,
      usuario: userId,
      nota: session ? "Creadas para tu usuario autenticado" : "Creadas para usuario demo"
    })
    
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Error al crear alertas de prueba:", error)
    const response = NextResponse.json(
      { error: "Error interno del servidor", detalle: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
} 