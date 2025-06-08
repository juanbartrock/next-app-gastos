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
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign,
  Activity,
  Calendar,
  ArrowUp
} from 'lucide-react'
import Link from 'next/link'

async function getAnalyticsData() {
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

  const fechaHace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [
    usuariosTotales,
    gastosUltimos30Dias,
    alertasGeneradas,
    planesDistribucion
  ] = await Promise.all([
    prisma.user.count(),
    
    prisma.gasto.aggregate({
      where: { fecha: { gte: fechaHace30Dias } },
      _sum: { monto: true },
      _count: { id: true }
    }),
    
    prisma.alerta.count({
      where: { fechaCreacion: { gte: fechaHace30Dias } }
    }).catch(() => 0),
    
    prisma.plan.findMany({
      select: {
        nombre: true,
        esPago: true,
        precioMensual: true,
        _count: { select: { usuarios: true } }
      }
    })
  ])

  const ingresosMensuales = planesDistribucion.reduce((total, plan) => {
    if (plan.esPago && plan.precioMensual) {
      return total + (plan.precioMensual * plan._count.usuarios)
    }
    return total
  }, 0)

  return {
    usuarios: { total: usuariosTotales },
    actividad: {
      gastosUltimos30Dias: {
        total: gastosUltimos30Dias._sum.monto || 0,
        cantidad: gastosUltimos30Dias._count.id || 0
      },
      alertasGeneradas
    },
    ingresos: { mensual: ingresosMensuales },
    planes: planesDistribucion
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0
  }).format(amount)
}

export default async function AnalyticsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📊 Analytics & Reportes</h1>
          <p className="text-muted-foreground mt-1">
            Métricas y análisis del sistema
          </p>
        </div>
        <Button asChild>
          <Link href="/admin-general">← Volver al Panel</Link>
        </Button>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <AnalyticsContent />
      </Suspense>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
            <CardContent><Skeleton className="h-8 w-16" /></CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

async function AnalyticsContent() {
  const data = await getAnalyticsData()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.usuarios.total}</div>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <ArrowUp className="h-3 w-3" />
              12.5%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actividad (30d)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.actividad.gastosUltimos30Dias.cantidad}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(data.actividad.gastosUltimos30Dias.total)} en gastos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Mensual</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.ingresos.mensual)}</div>
            <p className="text-xs text-muted-foreground">Ingresos por suscripciones</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas (30d)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{typeof data.actividad.alertasGeneradas === 'number' ? data.actividad.alertasGeneradas : 0}</div>
            <p className="text-xs text-muted-foreground">Alertas generadas</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Distribución de Usuarios por Plan</CardTitle>
          <CardDescription>Análisis de suscripciones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.planes.map((plan, index) => {
              const porcentaje = data.usuarios.total > 0 
                ? (plan._count.usuarios / data.usuarios.total) * 100 
                : 0
              const revenue = plan.esPago && plan.precioMensual 
                ? plan.precioMensual * plan._count.usuarios 
                : 0

              return (
                <div key={`plan-${index}`} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{plan.nombre || 'Sin nombre'}</span>
                      {plan.esPago ? (
                        <Badge variant="default">Pago</Badge>
                      ) : (
                        <Badge variant="secondary">Gratuito</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {plan._count?.usuarios || 0} usuarios ({porcentaje.toFixed(1)}%)
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {revenue > 0 ? formatCurrency(revenue) : 'Gratis'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {revenue > 0 ? 'Revenue/mes' : 'Sin ingresos'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 