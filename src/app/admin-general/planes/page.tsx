import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  CreditCard, 
  Plus, 
  Users, 
  DollarSign,
  Settings,
  Edit,
  Check
} from 'lucide-react'
import Link from 'next/link'

async function getPlanesData() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true }
  })

  if (!user?.isAdmin) {
    redirect('/dashboard')
  }

      // VERSIÓN SIMPLIFICADA - Obtener planes y contar usuarios por separado
    const planes = await prisma.plan.findMany({
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        esPago: true,
        precioMensual: true
      }
    })

    // Contar usuarios por plan manualmente
    const planesConUsuarios = await Promise.all(
      planes.map(async (plan) => {
        const usuariosCount = await prisma.user.count({
          where: { planId: plan.id }
        })
        return {
          ...plan,
          _count: { usuarios: usuariosCount }
        }
      })
    )

      const revenueMensual = planesConUsuarios.reduce((total, plan) => {
    if (plan.esPago && plan.precioMensual) {
      return total + (plan.precioMensual * plan._count.usuarios)
    }
    return total
  }, 0)

      const totalUsuariosPago = planesConUsuarios
      .filter(plan => plan.esPago)
      .reduce((total, plan) => total + plan._count.usuarios, 0)

      return {
      planes: planesConUsuarios,
      stats: {
        totalPlanes: planesConUsuarios.length,
        usuariosPago: totalUsuariosPago,
        revenueMensual
      }
    }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount)
}

export default async function PlanesAdminPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">💳 Gestión de Planes</h1>
          <p className="text-muted-foreground mt-1">
            Administrar planes, precios y funcionalidades
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin-general">
              ← Volver al Panel
            </Link>
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Crear Plan
          </Button>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <PlanesContent />
      </Suspense>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

async function PlanesContent() {
  const data = await getPlanesData()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Planes</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalPlanes}</div>
            <p className="text-xs text-muted-foreground">Planes configurados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios de Pago</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.usuariosPago}</div>
            <p className="text-xs text-muted-foreground">Con planes pagos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Mensual</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.stats.revenueMensual)}
            </div>
            <p className="text-xs text-muted-foreground">Ingresos estimados</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.planes.map((plan) => {
          const revenuePlan = plan.esPago && plan.precioMensual 
            ? plan.precioMensual * plan._count.usuarios 
            : 0

          return (
            <Card key={plan.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {plan.nombre}
                  </CardTitle>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  {plan.descripcion || 'Sin descripción'}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {plan.esPago 
                        ? formatCurrency(plan.precioMensual || 0)
                        : 'GRATIS'
                      }
                    </div>
                    {plan.esPago && (
                      <p className="text-sm text-muted-foreground">por mes</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{plan._count.usuarios}</div>
                      <p className="text-xs text-muted-foreground">Usuarios</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">
                        {formatCurrency(revenuePlan)}
                      </div>
                      <p className="text-xs text-muted-foreground">Revenue/mes</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {plan.esPago ? (
                      <Badge variant="default">Pago</Badge>
                    ) : (
                      <Badge variant="secondary">Gratuito</Badge>
                    )}
                    
                    {plan.nombre === 'Premium' && (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                        Más Popular
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
} 