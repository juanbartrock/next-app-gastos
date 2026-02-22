# src/lib/ — Lógica de Negocio y Utilidades

> **Prerequisito**: Lee `src/CLAUDE.md` para la arquitectura general.

## Skills Relevantes
- `architecture-patterns` — Patrones de diseño, separación de capas
- `systematic-debugging` — Debugging de engines y servicios
- `postgresql-table-design` — Diseño de queries eficientes

## Estructura

```
lib/
├── ai/                    # Motor de Inteligencia Artificial
│   └── ai-analyzer.ts     # AIAnalyzer: patrones, recomendaciones, anomalías
├── alert-engine/          # Motor de Alertas Automático
│   ├── AlertEngine.ts     # Evaluación de condiciones (8 tipos)
│   ├── AlertScheduler.ts  # Scheduler singleton (cada 60 min)
│   └── types.ts          # Tipos del sistema de alertas
├── prisma.ts              # Cliente Prisma singleton (Next.js 15)
├── auth-utils.ts          # Utilidades de autenticación
├── mercadopago.ts         # Configuración MercadoPago Argentina
├── twilio.ts              # Configuración Twilio (SMS/WhatsApp)
├── plan-limits.ts         # Control de límites por plan
├── plan-restrictions.ts   # Restricciones por plan de suscripción
├── gastos-recurrentes-utils.ts  # Utils para gastos recurrentes
├── encryption.ts          # Encriptación de datos sensibles
├── encryption-middleware.ts # Middleware de encriptación
├── db-utils.ts            # Utilidades de base de datos + timeouts
├── db-health.ts           # Health check de la BD
├── dbSetup.ts             # Setup inicial de base de datos
├── voiceProcessing.ts     # Procesamiento de entrada por voz
├── utils.ts               # Utilidades generales (cn de tailwind-merge)
└── onboarding/
    └── steps.ts           # Definición de pasos de onboarding
```

## Engines Principales

### AIAnalyzer (`ai/ai-analyzer.ts`)
Motor de IA con OpenAI para análisis financiero:
- `analizarPatrones(userId, meses)` → Patrones de gasto
- `generarRecomendaciones(userId)` → Recomendaciones de ahorro
- `detectarAnomalias(userId)` → Gastos inusuales
- `generarReporte(userId)` → Reporte ejecutivo inteligente
- `predecirAlertas(userId)` → Alertas predictivas

```typescript
// Patrón de uso de OpenAI
const response = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [{ role: "system", content: "Asistente financiero..." }, ...],
  temperature: 0.3,
  response_format: { type: "json_object" }
})
```

### AlertEngine (`alert-engine/AlertEngine.ts`)
Motor automático de evaluación de alertas (8 tipos de condiciones):
- Presupuestos excedidos (80%, 90%, 100%)
- Gastos inusuales/anómalos
- Préstamos próximos a vencer
- Inversiones con rendimiento bajo
- Gastos recurrentes pendientes

### AlertScheduler (`alert-engine/AlertScheduler.ts`)
Scheduler singleton que ejecuta AlertEngine cada 60 minutos:
- `start()` / `stop()` / `runOnce()`
- Limpieza automática de alertas expiradas
- **Patrón Singleton** para evitar múltiples instancias

## Cliente Prisma (`prisma.ts`)
Singleton optimizado para Next.js 15 con hot reload:
```typescript
const globalForPrisma = global as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

## Utilidades Clave

- `plan-limits.ts` — Verifica y enforce límites por plan de suscripción
- `plan-restrictions.ts` — Restricciones de funcionalidades por plan
- `gastos-recurrentes-utils.ts` — Cálculo de estados, porcentajes, asociaciones
- `db-utils.ts` — Queries con timeout (15s) para Neon, retry logic
- `mercadopago.ts` — Config de MercadoPago: client, preferences, pagos, webhooks
- `encryption.ts` — Encriptación AES de datos sensibles

## Oportunidades de Mejora

1. **Separation of concerns** — Las API routes contienen mucha lógica de negocio que debería estar en `lib/`
2. **Service layer** — Crear servicios entre API routes y Prisma
3. **Error handling** — Unificar manejo de errores con clases custom
4. **Caching** — Implementar capa de caché para queries frecuentes
