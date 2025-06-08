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
  Users, 
  UserPlus, 
  Shield, 
  Crown,
  Mail,
  Phone
} from 'lucide-react'
import Link from 'next/link'

async function getUsersData() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Verificar que sea admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true }
  })

  if (!user?.isAdmin) {
    redirect('/dashboard')
  }

  // VERSIÓN SIMPLIFICADA - Solo campos básicos que sabemos que existen
  try {
    const usuarios = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        isAdmin: true,
        planId: true
      }
    })

    // Obtener planes por separado para evitar problemas
    const planes = await prisma.plan.findMany({
      select: {
        id: true,
        nombre: true,
        esPago: true
      }
    })

    // Enriquecer usuarios con información de planes
    const usuariosConPlan = usuarios.map(usuario => {
      const plan = planes.find(p => p.id === usuario.planId)
      return {
        ...usuario,
        plan: plan || null,
        // Contadores simulados hasta que podamos hacer las queries complejas
        _count: {
          gastos: 0,
          alertas: 0,
          grupos: 0
        }
      }
    })

    // Estadísticas por plan
    const estadisticasPorPlan = planes.map(plan => {
      const cantidad = usuarios.filter(u => u.planId === plan.id).length
      return {
        planNombre: plan.nombre,
        colorHex: '#6B7280', // Color fijo por ahora
        cantidad
      }
    })

    return {
      usuarios: usuariosConPlan,
      estadisticasPorPlan,
      totalUsuarios: usuarios.length
    }

  } catch (error) {
    console.error('Error obteniendo usuarios:', error)
    
    // Fallback con datos mínimos
    return {
      usuarios: [],
      estadisticasPorPlan: [],
      totalUsuarios: 0
    }
  }
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
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

export default async function UsuariosAdminPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">👥 Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1">
            Administrar usuarios, planes y permisos del sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin-general">
              ← Volver al Panel
            </Link>
          </Button>
          <Button variant="outline">
            <UserPlus className="h-4 w-4 mr-2" />
            Crear Usuario
          </Button>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <UsuariosContent />
      </Suspense>
    </div>
  )
}

async function UsuariosContent() {
  const data = await getUsersData()

  return (
    <div className="space-y-6">
      {/* Estadísticas de usuarios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalUsuarios}</div>
            <p className="text-xs text-muted-foreground">Usuarios registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.usuarios.filter(u => u.isAdmin).length}
            </div>
            <p className="text-xs text-muted-foreground">Con permisos admin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planes Premium</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.usuarios.filter(u => u.plan?.nombre === 'Premium').length}
            </div>
            <p className="text-xs text-muted-foreground">Usuarios Premium</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribución por planes */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución por Planes</CardTitle>
          <CardDescription>Usuarios por tipo de plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.estadisticasPorPlan.map((stat, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: stat.colorHex }}
                />
                <span className="text-sm font-medium">{stat.planNombre}</span>
                <Badge variant="secondary">{stat.cantidad}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>Todos los usuarios del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.usuarios.map((usuario) => (
              <div key={usuario.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{usuario.name || 'Sin nombre'}</h3>
                      {usuario.isAdmin && (
                        <Badge variant="destructive" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {usuario.plan?.nombre || 'Sin plan'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {usuario.email}
                        </span>
                        {usuario.phoneNumber && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {usuario.phoneNumber}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span>Gastos: {usuario._count.gastos}</span>
                        <span>Alertas: {usuario._count.alertas}</span>
                        <span>Grupos: {usuario._count.grupos}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    Editar
                  </Button>
                  <Button variant="outline" size="sm">
                    Gestionar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 