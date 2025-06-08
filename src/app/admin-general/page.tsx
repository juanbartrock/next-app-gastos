import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, CreditCard, Settings, TrendingUp, BarChart3, Shield, Database } from 'lucide-react'
import Link from 'next/link'

async function getAdminData() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Verificar que sea admin general
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true, name: true, email: true }
  })

  if (!user?.isAdmin) {
    redirect('/dashboard')
  }

  // Obtener estadísticas básicas (usando campos que existen)
  const [
    totalUsuarios,
    totalPlanes
  ] = await Promise.all([
    prisma.user.count(),
    prisma.plan.count()
  ])

  return {
    user,
    stats: {
      totalUsuarios,
      usuariosActivos: totalUsuarios, // Por ahora igual al total
      totalPlanes,
      suscripcionesActivas: 0 // Por ahora 0 hasta que se implementen
    }
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

export default async function AdminGeneralPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🚀 Administración General</h1>
          <p className="text-muted-foreground mt-1">
            Panel de control completo del sistema
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <AdminContent />
      </Suspense>
    </div>
  )
}

async function AdminContent() {
  const data = await getAdminData()
  
  return (
    <div className="space-y-6">
      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalUsuarios}</div>
            <p className="text-xs text-muted-foreground">
              Usuarios registrados en el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.usuariosActivos}</div>
            <p className="text-xs text-muted-foreground">
              Usuarios con actividad reciente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planes Disponibles</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalPlanes}</div>
            <p className="text-xs text-muted-foreground">
              Planes de suscripción configurados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suscripciones Activas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.suscripcionesActivas}</div>
            <p className="text-xs text-muted-foreground">
              Usuarios con suscripción paga
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Panel de navegación */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestión de Usuarios
            </CardTitle>
            <CardDescription>
              Administrar usuarios, roles y permisos del sistema
            </CardDescription>
            <div className="mt-4">
              <Button asChild className="w-full">
                <Link href="/admin-general/usuarios">
                  Ver Usuarios
                </Link>
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Planes y Suscripciones
            </CardTitle>
            <CardDescription>
              Configurar planes, precios y funcionalidades
            </CardDescription>
            <div className="mt-4">
              <Button asChild className="w-full">
                <Link href="/admin-general/planes">
                  Gestionar Planes
                </Link>
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics & Reportes
            </CardTitle>
            <CardDescription>
              Métricas, reportes y análisis del sistema
            </CardDescription>
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin-general/analytics">
                  Ver Analytics
                </Link>
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Auditoría & Seguridad
            </CardTitle>
            <CardDescription>
              Logs, auditoría y control de acceso
            </CardDescription>
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin-general/auditoria">
                  Ver Auditoría
                </Link>
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Base de Datos
            </CardTitle>
            <CardDescription>
              Backups, migraciones y mantenimiento
            </CardDescription>
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin-general/database">
                  Gestionar BD
                </Link>
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración Sistema
            </CardTitle>
            <CardDescription>
              Configuraciones globales y parámetros del sistema
            </CardDescription>
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin-general/configuracion">
                  Configurar
                </Link>
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Información del admin actual */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Administrador</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Nombre:</strong> {data.user.name || 'Sin nombre'}</p>
            <p><strong>Email:</strong> {data.user.email}</p>
            <p><strong>Rol:</strong> Administrador General</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 