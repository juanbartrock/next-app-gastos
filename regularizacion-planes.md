# 🚀 **REGULARIZACIÓN DEL SISTEMA DE PLANES**

> **Fecha**: Enero 2025  
> **Objetivo**: Corregir y completar el sistema de planes de suscripción  
> **Prioridad**: 🔥 **CRÍTICA** - Debe completarse antes del lanzamiento público

---

## 📋 **SITUACIÓN ACTUAL**

### **🚨 PROBLEMAS CRÍTICOS IDENTIFICADOS**
1. **Asignación automática errónea**: Todos los usuarios reciben `plan-lifetime-premium`
2. **8 APIs sin validación**: Bypass masivo de restricciones de planes
3. **Datos mock en producción**: `/api/user/plan-limits` devuelve datos simulados
4. **Falta gestión de códigos promocionales**: Para usuarios VIP y amigos

### **👥 USUARIOS VIP IDENTIFICADOS**
```typescript
const USUARIOS_VIP = [
  'jpautass@gmail.com',      // Usuario VIP - Lifetime Premium
  'lealalvarez@hotmail.com', // Usuario VIP - Lifetime Premium  
  'mateo.patuasso@gmail.com' // Usuario VIP - Lifetime Premium
]
```

---

## 🎯 **HOJA DE RUTA COMPLETA**

### **🔥 FASE 1: CORRECCIONES CRÍTICAS (Semana 1)**

#### **1.1 Corregir Asignación Automática de Planes**
**Archivo**: `scripts/init-plans.js`
**Prioridad**: 🔥 **INMEDIATA**

```javascript
// CAMBIO CRÍTICO EN LÍNEA 190+
// ❌ ACTUAL (PROBLEMA):
data: { planId: 'plan-lifetime-premium' }

// ✅ NUEVO (CORRECTO):
data: { 
  planId: usuariosVIP.includes(usuario.email) 
    ? 'plan-lifetime-premium' 
    : 'plan-gratuito' 
}
```

**Implementación**:
```javascript
// Definir usuarios VIP al inicio del script
const USUARIOS_VIP = [
  'jpautass@gmail.com',
  'lealalvarez@hotmail.com', 
  'mateo.patuasso@gmail.com'
]

// Modificar la asignación de planes
for (const usuario of usuariosExistentes) {
  const planId = USUARIOS_VIP.includes(usuario.email) 
    ? 'plan-lifetime-premium'
    : 'plan-gratuito'
    
  await prisma.user.update({
    where: { id: usuario.id },
    data: { planId }
  })
  
  console.log(`✅ Usuario ${usuario.email} → Plan: ${planId}`)
}
```

#### **1.2 Implementar Sistema de Códigos Promocionales**
**Prioridad**: 🔥 **INMEDIATA**

##### **A. Crear Modelo de Códigos Promocionales**
```sql
-- Agregar a schema.prisma
model CodigoPromocional {
  id                 String   @id @default(cuid())
  codigo             String   @unique
  descripcion        String?
  planAsignado       String   // 'plan-lifetime-premium'
  activo             Boolean  @default(true)
  usoMaximo          Int?     // null = ilimitado
  usoActual          Int      @default(0)
  fechaCreacion      DateTime @default(now())
  fechaExpiracion    DateTime?
  creadoPor          String   // ID del admin que lo creó
  
  // Relaciones
  usos               UsoCodigoPromocional[]
  creador            User     @relation(fields: [creadoPor], references: [id])
  
  @@index([codigo, activo])
}

model UsoCodigoPromocional {
  id                String   @id @default(cuid())
  codigoId          String
  userId            String
  planAnterior      String?
  planNuevo         String
  fechaUso          DateTime @default(now())
  ipAddress         String?
  
  // Relaciones
  codigo            CodigoPromocional @relation(fields: [codigoId], references: [id])
  usuario           User              @relation(fields: [userId], references: [id])
  
  @@unique([codigoId, userId]) // Un usuario no puede usar el mismo código 2 veces
  @@index([userId])
}
```

##### **B. API para Canjear Códigos**
**Archivo**: `src/app/api/codigos-promocionales/canjear/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { codigo } = await request.json()
    
    if (!codigo || typeof codigo !== 'string') {
      return NextResponse.json({ error: 'Código inválido' }, { status: 400 })
    }

    // Buscar usuario
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { plan: true }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Buscar código promocional
    const codigoPromo = await prisma.codigoPromocional.findUnique({
      where: { codigo: codigo.toUpperCase() },
      include: {
        usos: {
          where: { userId: usuario.id }
        }
      }
    })

    if (!codigoPromo) {
      return NextResponse.json({ 
        error: 'Código promocional no válido',
        codigo: 'CODIGO_INVALIDO'
      }, { status: 400 })
    }

    // Validaciones
    if (!codigoPromo.activo) {
      return NextResponse.json({ 
        error: 'Este código promocional ya no está activo',
        codigo: 'CODIGO_INACTIVO'
      }, { status: 400 })
    }

    if (codigoPromo.fechaExpiracion && codigoPromo.fechaExpiracion < new Date()) {
      return NextResponse.json({ 
        error: 'Este código promocional ha expirado',
        codigo: 'CODIGO_EXPIRADO'
      }, { status: 400 })
    }

    if (codigoPromo.usos.length > 0) {
      return NextResponse.json({ 
        error: 'Ya has usado este código promocional',
        codigo: 'CODIGO_YA_USADO'
      }, { status: 400 })
    }

    if (codigoPromo.usoMaximo && codigoPromo.usoActual >= codigoPromo.usoMaximo) {
      return NextResponse.json({ 
        error: 'Este código promocional ha alcanzado su límite de usos',
        codigo: 'CODIGO_AGOTADO'
      }, { status: 400 })
    }

    // Canjear código
    await prisma.$transaction(async (tx) => {
      // Actualizar plan del usuario
      await tx.user.update({
        where: { id: usuario.id },
        data: { planId: codigoPromo.planAsignado }
      })

      // Registrar uso del código
      await tx.usoCodigoPromocional.create({
        data: {
          codigoId: codigoPromo.id,
          userId: usuario.id,
          planAnterior: usuario.planId,
          planNuevo: codigoPromo.planAsignado,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        }
      })

      // Incrementar contador de uso
      await tx.codigoPromocional.update({
        where: { id: codigoPromo.id },
        data: { usoActual: { increment: 1 } }
      })
    })

    return NextResponse.json({
      success: true,
      mensaje: 'Código promocional canjeado exitosamente',
      planAnterior: usuario.plan?.nombre,
      planNuevo: 'Premium de por Vida',
      descripcion: codigoPromo.descripcion
    })

  } catch (error) {
    console.error('Error canjeando código promocional:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
```

##### **C. Página para Canjear Códigos**
**Archivo**: `src/app/codigo-promocional/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Gift, CheckCircle, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function CodigoPromocionalPage() {
  const [codigo, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const router = useRouter()

  const canjearCodigo = async () => {
    if (!codigo.trim()) {
      toast.error('Por favor ingresa un código')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/codigos-promocionales/canjear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: codigo.trim().toUpperCase() })
      })

      const data = await response.json()

      if (response.ok) {
        setResultado(data)
        toast.success('¡Código canjeado exitosamente!')
        setTimeout(() => router.push('/dashboard'), 2000)
      } else {
        toast.error(data.error || 'Error al canjear código')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <Gift className="h-12 w-12 mx-auto text-purple-600 mb-2" />
          <CardTitle>Código Promocional</CardTitle>
          <p className="text-sm text-muted-foreground">
            ¿Tienes un código especial? Canjealo aquí
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!resultado ? (
            <>
              <div>
                <Input
                  placeholder="Ingresa tu código"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  className="text-center font-mono text-lg"
                  maxLength={20}
                />
              </div>
              <Button 
                onClick={canjearCodigo}
                disabled={loading || !codigo.trim()}
                className="w-full"
              >
                {loading ? 'Canjeando...' : 'Canjear Código'}
              </Button>
            </>
          ) : (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="space-y-2">
                  <p className="font-semibold">{resultado.mensaje}</p>
                  {resultado.descripcion && (
                    <p className="text-sm">{resultado.descripcion}</p>
                  )}
                  <p className="text-xs">
                    Plan anterior: {resultado.planAnterior} → {resultado.planNuevo}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

#### **1.3 Script para Crear Códigos Iniciales**
**Archivo**: `scripts/crear-codigos-promocionales.js`

```javascript
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function crearCodigosPromocionales() {
  console.log('🎁 Creando códigos promocionales...')

  const codigos = [
    {
      codigo: 'FRIENDS2025',
      descripcion: 'Código especial para amigos - Premium de por vida',
      planAsignado: 'plan-lifetime-premium',
      usoMaximo: 10, // Máximo 10 usos
      fechaExpiracion: new Date('2025-12-31')
    },
    {
      codigo: 'EARLYBIRD',
      descripcion: 'Early adopter - Premium de por vida',
      planAsignado: 'plan-lifetime-premium',
      usoMaximo: 5
    },
    {
      codigo: 'VIPACCESS',
      descripcion: 'Acceso VIP - Premium de por vida',
      planAsignado: 'plan-lifetime-premium',
      usoMaximo: 3
    }
  ]

  // Buscar un admin para asignar como creador
  const admin = await prisma.user.findFirst({
    where: { isAdmin: true }
  })

  if (!admin) {
    console.log('❌ No se encontró un administrador')
    return
  }

  for (const codigoData of codigos) {
    try {
      const codigo = await prisma.codigoPromocional.create({
        data: {
          ...codigoData,
          creadoPor: admin.id
        }
      })
      console.log(`✅ Código creado: ${codigo.codigo}`)
    } catch (error) {
      console.log(`❌ Error creando código ${codigoData.codigo}:`, error.message)
    }
  }

  console.log('✅ Códigos promocionales creados')
}

crearCodigosPromocionales()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

#### **1.4 Reemplazar Datos Mock por Datos Reales**
**Archivo**: `src/app/api/user/plan-limits/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import { getLimitsStatus } from '@/lib/plan-limits'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // ✅ REEMPLAZAR DATOS MOCK POR DATOS REALES
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const realStatus = await getLimitsStatus(usuario.id)
    return NextResponse.json(realStatus)

  } catch (error) {
    console.error('Error obteniendo límites del plan:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
```

### **⚡ FASE 2: IMPLEMENTAR VALIDACIONES CRÍTICAS (Semana 1-2)**

#### **2.1 API de Gastos Recurrentes**
**Archivo**: `src/app/api/recurrentes/route.ts`

```typescript
// ✅ AGREGAR VALIDACIÓN AL INICIO DEL POST
export async function POST(request: NextRequest) {
  const session = await getServerSession(options)
  // ... código existente para obtener usuario ...

  // ✅ VALIDAR LÍMITES ANTES DE CREAR
  const validacionRecurrentes = await validateLimit(usuario.id, 'gastos_recurrentes')
  if (!validacionRecurrentes.allowed) {
    return NextResponse.json({
      error: 'Límite de gastos recurrentes alcanzado',
      codigo: 'LIMIT_REACHED',
      limite: validacionRecurrentes.limit,
      uso: validacionRecurrentes.usage,
      upgradeRequired: true,
      mensaje: getUpgradeMessage('gratuito', 'gastos_recurrentes')
    }, { status: 403 })
  }

  // Continuar con la lógica normal...
}
```

#### **2.2 API de Consultas IA**
**Archivos**: `src/app/api/ai/*/route.ts` (5 archivos)

```typescript
// ✅ PATRÓN A APLICAR EN TODAS LAS APIS DE IA
export async function GET(request: NextRequest) {
  const session = await getServerSession(options)
  // ... código existente para obtener usuario ...

  // ✅ VALIDAR LÍMITES DE IA
  const validacionIA = await validateLimit(usuario.id, 'consultas_ia_mes')
  if (!validacionIA.allowed) {
    return NextResponse.json({
      error: 'Límite de consultas IA alcanzado',
      codigo: 'LIMIT_REACHED',
      limite: validacionIA.limit,
      uso: validacionIA.usage,
      upgradeRequired: true,
      mensaje: getUpgradeMessage(planActual, 'consultas_ia_mes')
    }, { status: 403 })
  }

  // ✅ INCREMENTAR CONTADOR DESPUÉS DE USAR IA
  try {
    // ... lógica de IA existente ...
    
    // Incrementar uso solo si la consulta fue exitosa
    await incrementUsage(usuario.id, 'consultas_ia_mes', 1)
    
    return NextResponse.json(resultado)
  } catch (error) {
    // No incrementar si hubo error
    throw error
  }
}
```

#### **2.3 API de Presupuestos**
**Archivo**: `src/app/api/presupuestos/route.ts`

```typescript
// ✅ AGREGAR VALIDACIÓN AL POST
export async function POST(request: NextRequest) {
  // ... código existente ...

  // ✅ VALIDAR LÍMITES DE PRESUPUESTOS
  const validacionPresupuestos = await validateLimit(usuario.id, 'presupuestos_activos')
  if (!validacionPresupuestos.allowed) {
    return NextResponse.json({
      error: 'Límite de presupuestos alcanzado',
      codigo: 'LIMIT_REACHED',
      limite: validacionPresupuestos.limit,
      uso: validacionPresupuestos.usage,
      upgradeRequired: true,
      mensaje: getUpgradeMessage(planActual, 'presupuestos_activos')
    }, { status: 403 })
  }

  // Continuar con la lógica normal...
}
```

### **🔧 FASE 3: VALIDACIONES SECUNDARIAS (Semana 2)**

#### **3.1 API de Grupos (Modo Familiar)**
```typescript
// src/app/api/grupos/route.ts
const validacionFamiliar = await checkFeatureAccess(usuario.id, 'modo_familiar')
if (!validacionFamiliar.allowed) {
  return NextResponse.json({
    error: 'El modo familiar requiere Plan Básico o superior',
    codigo: 'FEATURE_BLOCKED',
    upgradeRequired: true
  }, { status: 403 })
}
```

#### **3.2 API de Préstamos e Inversiones**
```typescript
// src/app/api/prestamos/route.ts y src/app/api/inversiones/route.ts
const validacionPrestamos = await checkFeatureAccess(usuario.id, 'prestamos_inversiones')
if (!validacionPrestamos.allowed) {
  return NextResponse.json({
    error: 'Préstamos e inversiones requieren Plan Premium',
    codigo: 'FEATURE_BLOCKED',
    upgradeRequired: true
  }, { status: 403 })
}
```

#### **3.3 API de Exportación**
```typescript
// src/app/api/exportar-datos/route.ts
const validacionExportacion = await checkFeatureAccess(usuario.id, 'exportacion')
if (!validacionExportacion.allowed) {
  return NextResponse.json({
    error: 'La exportación requiere Plan Básico o superior',
    codigo: 'FEATURE_BLOCKED',
    upgradeRequired: true
  }, { status: 403 })
}
```

#### **3.4 API de Tareas**
```typescript
// src/app/api/tareas/route.ts
const validacionTareas = await checkFeatureAccess(usuario.id, 'tareas')
if (!validacionTareas.allowed) {
  return NextResponse.json({
    error: 'El sistema de tareas requiere Plan Premium',
    codigo: 'FEATURE_BLOCKED',
    upgradeRequired: true
  }, { status: 403 })
}
```

### **🎨 FASE 4: MEJORAS DE UX (Semana 3)**

#### **4.1 Componentes de Validación en Frontend**
```typescript
// Aplicar en todos los formularios críticos
<CreateValidation feature="gastos_recurrentes">
  <Button onClick={crearGastoRecurrente}>
    Crear Gasto Recurrente
  </Button>
</CreateValidation>

<CreateValidation feature="consultas_ia_mes">
  <Button onClick={consultarIA}>
    Consultar IA
  </Button>
</CreateValidation>
```

#### **4.2 Alertas Proactivas**
```typescript
// Mostrar advertencias al 80% del límite
{limits.transacciones_mes.usage / limits.transacciones_mes.limit >= 0.8 && (
  <Alert className="border-orange-200 bg-orange-50">
    <AlertTriangle className="h-4 w-4" />
    <AlertDescription>
      Estás cerca del límite de transacciones ({limits.transacciones_mes.usage}/{limits.transacciones_mes.limit})
    </AlertDescription>
  </Alert>
)}
```

### **📊 FASE 5: ADMINISTRACIÓN Y MONITOREO (Semana 3-4)**

#### **5.1 Panel de Administración de Códigos**
**Archivo**: `src/app/admin/codigos-promocionales/page.tsx`

```typescript
'use client'

export default function AdminCodigosPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Códigos Promocionales</h1>
        <Button onClick={crearCodigo}>Crear Código</Button>
      </div>
      
      {/* Tabla de códigos existentes */}
      <CodigosTable />
      
      {/* Estadísticas de uso */}
      <CodigosStats />
    </div>
  )
}
```

#### **5.2 Dashboard de Métricas de Planes**
- Usuarios por plan
- Códigos promocionales usados
- Límites alcanzados por funcionalidad
- Conversiones potenciales

#### **5.3 Notificaciones Automáticas**
```typescript
// Integrar con sistema de alertas existente
await createAlert({
  userId,
  tipo: 'limite_alcanzado',
  titulo: 'Límite de transacciones alcanzado',
  mensaje: 'Has alcanzado tu límite mensual. Considera upgrade al Plan Básico.',
  prioridad: 'alta'
})
```

---

## 🎯 **CRONOGRAMA DETALLADO**

### **Semana 1: CRÍTICO**
- [ ] **Día 1-2**: Corregir asignación automática + usuarios VIP
- [ ] **Día 2-3**: Implementar sistema de códigos promocionales
- [ ] **Día 3-4**: Validaciones en gastos recurrentes y IA
- [ ] **Día 4-5**: Reemplazar datos mock por datos reales

### **Semana 2: ALTA PRIORIDAD**
- [ ] **Día 1-2**: Validaciones en presupuestos y modo familiar
- [ ] **Día 2-3**: Validaciones en préstamos e inversiones
- [ ] **Día 4-5**: Validaciones en exportación y tareas

### **Semana 3: CONSOLIDACIÓN**
- [ ] **Día 1-2**: Componentes UI de validación
- [ ] **Día 2-3**: Alertas proactivas
- [ ] **Día 4-5**: Testing exhaustivo

### **Semana 4: OPTIMIZACIÓN**
- [ ] **Día 1-2**: Panel de administración
- [ ] **Día 2-3**: Métricas y monitoreo
- [ ] **Día 4-5**: Documentación y deployment

---

## 🛡️ **CONFIGURACIÓN DE USUARIOS VIP**

### **Usuarios con Acceso Lifetime Premium**
```typescript
const USUARIOS_VIP = [
  {
    email: 'jpautass@gmail.com',
    nombre: 'JP',
    razon: 'Fundador/Desarrollador',
    plan: 'plan-lifetime-premium'
  },
  {
    email: 'lealalvarez@hotmail.com', 
    nombre: 'Leal',
    razon: 'Early supporter',
    plan: 'plan-lifetime-premium'
  },
  {
    email: 'mateo.patuasso@gmail.com',
    nombre: 'Mateo', 
    razon: 'Early supporter',
    plan: 'plan-lifetime-premium'
  }
]
```

### **Códigos Promocionales Sugeridos**
```typescript
const CODIGOS_INICIALES = [
  {
    codigo: 'FRIENDS2025',
    descripcion: 'Código especial para amigos cercanos',
    usoMaximo: 10,
    planAsignado: 'plan-lifetime-premium'
  },
  {
    codigo: 'EARLYBIRD',
    descripcion: 'Para early adopters',
    usoMaximo: 5,
    planAsignado: 'plan-lifetime-premium'
  },
  {
    codigo: 'VIPACCESS',
    descripcion: 'Acceso VIP limitado',
    usoMaximo: 3,
    planAsignado: 'plan-lifetime-premium'
  }
]
```

---

## ✅ **CHECKLIST DE IMPLEMENTACIÓN**

### **🔥 Crítico (Semana 1)**
- [ ] Modificar `scripts/init-plans.js` para asignación correcta
- [ ] Crear modelo `CodigoPromocional` en schema.prisma
- [ ] Implementar API `/api/codigos-promocionales/canjear`
- [ ] Crear página `/codigo-promocional`
- [ ] Ejecutar script de códigos iniciales
- [ ] Validación en `/api/recurrentes`
- [ ] Validación en `/api/ai/*` (5 APIs)
- [ ] Validación en `/api/presupuestos`
- [ ] Reemplazar datos mock en `/api/user/plan-limits`

### **⚡ Alto (Semana 2)**
- [ ] Validación en `/api/grupos`
- [ ] Validación en `/api/prestamos`
- [ ] Validación en `/api/inversiones`
- [ ] Validación en `/api/exportar-datos`
- [ ] Validación en `/api/tareas`
- [ ] Componentes `CreateValidation` en formularios

### **💡 Medio (Semana 3-4)**
- [ ] Panel admin de códigos promocionales
- [ ] Métricas y analytics
- [ ] Alertas proactivas
- [ ] Testing completo
- [ ] Documentación actualizada

---

## 🚨 **COMANDOS DE EJECUCIÓN**

### **1. Actualizar Base de Datos**
```powershell
npx prisma db push
npx prisma generate
```

### **2. Corregir Asignación de Planes**
```powershell
node scripts/init-plans.js
```

### **3. Crear Códigos Promocionales**
```powershell
node scripts/crear-codigos-promocionales.js
```

### **4. Verificar Estado**
```powershell
# Verificar usuarios VIP
# Verificar códigos creados
# Verificar validaciones en APIs
```

---

## 📈 **MÉTRICAS DE ÉXITO**

### **KPIs Técnicos**
- ✅ 0% usuarios con plan incorrecto
- ✅ 100% APIs con validación implementada
- ✅ 0% datos mock en producción
- ✅ 3 códigos promocionales activos

### **KPIs de Negocio**
- 📊 Conversión de gratuito → básico
- 📊 Conversión de básico → premium  
- 📊 Uso de códigos promocionales
- 📊 Límites alcanzados por funcionalidad

---

## 🏁 **RESULTADO ESPERADO**

Al completar esta hoja de ruta:

1. **✅ Sistema de planes funcional al 100%**
2. **✅ Usuarios VIP configurados correctamente**
3. **✅ Códigos promocionales operativos**
4. **✅ Todas las APIs con validaciones**
5. **✅ UX clara para limitaciones**
6. **✅ Administración completa**

**Tiempo total estimado**: **3-4 semanas**  
**Riesgo**: **Bajo** (arquitectura ya existe)  
**Impacto**: **Alto** (modelo de negocio funcional) 