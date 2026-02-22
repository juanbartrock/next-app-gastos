# src/app/api/ — API Routes

> **Prerequisito**: Lee `src/CLAUDE.md` para la arquitectura general.

## Skills Relevantes
- `architecture-patterns` — Separación de capas, manejo de errores, validación
- `next-best-practices` — Route handlers, caching, streaming
- `systematic-debugging` — Debugging metódico de API errors
- `verification-before-completion` — Verificación pre-entrega

## Estructura: 40+ Grupos de Endpoints

### Core Financiero
| Grupo | Endpoints | Descripción |
|---|---|---|
| `gastos/` | CRUD + `familiares`, `recurrentes-disponibles`, `[id]/*` | Transacciones principales |
| `recurrentes/` | CRUD + `[id]/generar-pago` | Gastos recurrentes con asociación automática |
| `presupuestos/` | CRUD + imputaciones | Presupuestos por categoría |
| `prestamos/` | CRUD + pagos | Préstamos con amortización francesa |
| `inversiones/` | CRUD + cotizaciones + transacciones | Gestión de inversiones |
| `financiacion/` | CRUD + cuotas | Financiación de compras |
| `tareas/` | CRUD | Tareas personales y financieras |
| `categorias/` | CRUD + categorías personales + grupales | Categorización flexible |
| `grupos/` | CRUD + miembros | Gastos compartidos |

### IA y Alertas
| Grupo | Endpoints | Descripción |
|---|---|---|
| `ai/` | `analizar-patrones`, `recomendaciones`, `alertas-predictivas`, `reporte-inteligente`, `detectar-anomalias` | Motor de IA con OpenAI |
| `alertas/` | CRUD + `config`, `evaluate`, `scheduler`, `test` | Sistema completo de alertas |
| `financial-advisor/` | POST consulta | Asesor financiero IA |

### Pagos y Suscripciones
| Grupo | Endpoints | Descripción |
|---|---|---|
| `suscripciones/` | CRUD + `crear-pago`, `verificar-pago` | Gestión de suscripciones |
| `mercadopago/` | `webhook` | Webhook de MercadoPago |
| `planes/` | GET | Planes disponibles |
| `codigos-promocionales/` | Validar/aplicar | Códigos promo |

### Administración y Utilidades
| Grupo | Endpoints | Descripción |
|---|---|---|
| `admin/` | Usuarios, planes, auditoría | Panel de administración |
| `admin-general/` | Estadísticas globales | Admin general |
| `user/` | Perfil, configuración, preferencias | Gestión de usuario |
| `auth/` | NextAuth handlers | Autenticación |
| `onboarding/` | Estado + progreso | Onboarding de usuarios |
| `feedback/` | CRUD | Feedback beta |
| `buzon/` | CRUD | Buzón de mensajes |

### Datos y Exportación
| Grupo | Endpoints | Descripción |
|---|---|---|
| `exportar-datos/` | CSV/Excel | Exportación de datos |
| `importar-datos/` | CSV upload + parse | Importación de datos |
| `informes/` | Generación de reportes | Informes financieros |
| `ocr/` | Procesamiento de imágenes | OCR de comprobantes |

### Scraping y Market Data
| Grupo | Endpoints | Descripción |
|---|---|---|
| `scraping/` | Ejecutar + resultados | Motor de scraping |
| `promociones/` | GET | Promociones activas |
| `financial-data/` | Market data | Datos financieros (dólar, etc.) |
| `price-search/` | Búsqueda de precios | Seguimiento de precios |
| `servicios/` | CRUD | Gestión de servicios |

## Patrón Estándar de API Route

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const data = await prisma.gasto.findMany({
      where: { userId: session.user.id },
      orderBy: { fecha: 'desc' }
    })
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
```

## Patrón para Rutas Dinámicas (Next.js 15)

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params  // ⚠️ await requerido en Next.js 15
  // ...
}
```

## Patrón de Transacciones Atómicas

```typescript
const resultado = await prisma.$transaction(async (tx) => {
  const gasto = await tx.gasto.create({ data: {...} })
  await tx.gastoRecurrente.update({ where: {...}, data: {...} })
  return gasto
})
```

## Reglas de API

- ✅ Siempre validar sesión con `getServerSession(authOptions)`
- ✅ Filtrar datos por `userId` (nunca exponer datos de otros usuarios)
- ✅ Usar try-catch con respuestas de error consistentes
- ✅ Validar input con Zod cuando sea posible
- ✅ Usar `prisma.$transaction()` para operaciones multi-tabla
- ✅ Implementar timeouts para consultas a Neon (15s max)
- ❌ Nunca confiar en datos del cliente sin validar
- ❌ Nunca exponer API keys o secrets en respuestas
