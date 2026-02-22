# prisma/ — Esquema de Datos

> **Prerequisito**: Lee el `CLAUDE.md` raíz para el contexto global.

## Skills Relevantes
- `postgresql-table-design` — Diseño de tablas, índices, relaciones, normalización
- `architecture-patterns` — Patrones de modelado de datos

## Base de Datos

- **Motor**: PostgreSQL (Neon serverless)
- **ORM**: Prisma 6.8.2
- **Migraciones**: Usar `npx prisma db push` (NO migraciones automáticas)
- **Cliente**: `npx prisma generate` para regenerar tipos

## Modelos (30+)

### Autenticación y Usuarios
| Modelo | Descripción |
|---|---|
| `User` | Usuario con plan, roles, onboarding, permisos |
| `Account` | Cuentas OAuth (NextAuth) |
| `Session` | Sesiones activas |
| `VerificationToken` | Tokens de verificación |

### Core Financiero
| Modelo | Descripción |
|---|---|
| `Gasto` | Transacción principal (ingreso/gasto) con categoría, tipo, datos |
| `GastoDetalle` | Detalles item-level de un gasto |
| `GastoRecurrente` | Suscripciones y pagos recurrentes con estado automático |
| `Categoria` | Categorías de gastos (sistema + personales) |
| `Financiacion` | Financiación de compras en cuotas |
| `FinanciacionTarjeta` | Info de tarjeta asociada |
| `PagoTarjeta` | Pagos con tarjeta |
| `CuotaVinculada` | Cuotas vinculadas a pagos |

### Presupuestos
| Modelo | Descripción |
|---|---|
| `Presupuesto` | Presupuesto mensual por categoría/usuario/grupo |
| `PresupuestoCategoria` | Categorías dentro de un presupuesto |
| `PresupuestoImputacion` | Imputación de gastos a presupuestos |

### Préstamos e Inversiones
| Modelo | Descripción |
|---|---|
| `Prestamo` | Préstamos con amortización francesa |
| `PagoPrestamo` | Pagos de cuotas de préstamos |
| `Inversion` | Inversiones con rendimiento |
| `TransaccionInversion` | Movimientos de inversión |
| `CotizacionInversion` | Cotizaciones históricas |
| `TipoInversion` | Tipos de inversión |

### Alertas y Notificaciones
| Modelo | Descripción |
|---|---|
| `Alerta` | Alerta con tipo, prioridad, canales, acciones |
| `ConfiguracionAlerta` | Configuración por tipo/usuario |
| `AlertaExecution` | Registro de ejecuciones del scheduler |

### Social y Grupos
| Modelo | Descripción |
|---|---|
| `Grupo` | Grupo de gastos compartidos |
| `GrupoMiembro` | Miembros con roles y permisos familiares |

### Servicios y Scraping
| Modelo | Descripción |
|---|---|
| `Servicio` | Servicios contratados |
| `Promocion` | Promociones encontradas por scraping |
| `ServicioAlternativo` | Alternativas más baratas |

### Monetización
| Modelo | Descripción |
|---|---|
| `Plan` | Planes de suscripción |
| `Funcionalidad` / `FuncionalidadPlan` | Features por plan |
| `LimitePlan` | Límites numéricos por plan |
| `Suscripcion` | Suscripciones de usuarios |
| `PagoSuscripcionMP` | Pagos via MercadoPago |
| `ConfiguracionMercadoPago` | Config MP por usuario |
| `WebhookMercadoPago` | Registro de webhooks |
| `CodigoPromocional` / `UsoCodigoPromocional` | Códigos promo |

### Administración y Feedback
| Modelo | Descripción |
|---|---|
| `AuditoriaAdmin` | Registro de acciones admin |
| `UsoMensual` | Métricas de uso por usuario/mes |
| `FeedbackBeta` | Feedback de usuarios beta |
| `ComprobantePendiente` | Comprobantes para OCR |
| `ComprobanteTransferencia` | Comprobantes procesados |
| `Tarea` | Tareas personales/financieras |

## Enums

```prisma
enum TipoAlerta { GASTO_INUSUAL, PRESUPUESTO_EXCEDIDO, META_ALCANZADA, ... (13 tipos) }
enum PrioridadAlerta { BAJA, MEDIA, ALTA, CRITICA }
enum CanalNotificacion { IN_APP, EMAIL, SMS, WHATSAPP, PUSH }
enum FrecuenciaNotificacion { INMEDIATA, DIARIA, SEMANAL }
enum RolFamiliar { ADMINISTRADOR, MIEMBRO_PLENO, MIEMBRO_LIMITADO }
enum EstadoPagoMP { PENDING, APPROVED, REJECTED, CANCELLED, ... }
enum TipoPagoMP { SUSCRIPCION, UPGRADE, RENOVACION }
enum TipoFeedback { BUG, SUGERENCIA, MEJORA, QUEJA, FELICITACION }
enum PrioridadFeedback { BAJA, MEDIA, ALTA, CRITICA }
enum EstadoFeedback { PENDIENTE, EN_REVISION, RESUELTO, DESCARTADO }
```

## Índices Clave

- `Alerta`: `[userId, fechaCreacion]`, `[userId, leida]`, `[tipo, fechaCreacion]`
- `Suscripcion`: `[userId, estado]`, `[estado, fechaVencimiento]`
- `ComprobanteTransferencia`: `[userId, estadoProcesamiento]`

## Reglas de Schema

- 🚨 **NUNCA eliminar columnas o modelos existentes** sin migración de datos
- ✅ Agregar `@default()` a nuevas columnas para compatibilidad backwards
- ✅ Usar `@relation(onDelete: Cascade)` para dependencias fuertes
- ✅ Crear índices para campos usados en filtros frecuentes
- ✅ Usar `@@unique` para restricciones de negocio
- ✅ Usar `@@map` para nombres de tabla SQL custom
