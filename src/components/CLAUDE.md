# src/components/ — Sistema de Componentes UI

> **Prerequisito**: Lee `src/CLAUDE.md` para la arquitectura general.

## Skills Relevantes
- `frontend-design` — Estética distintiva, tipografía, color, motion
- `ui-ux-pro-max` — Accesibilidad, touch, responsive, design system
- `shadcn-ui` — Uso correcto de componentes Shadcn/ui
- `vercel-react-best-practices` — Optimización de re-renders, lazy loading

## Librería UI Base: Shadcn/ui

Los componentes base están en `ui/` y provienen de Shadcn/ui + Radix:

```
ui/
├── accordion.tsx        ├── alert-dialog.tsx
├── avatar.tsx           ├── badge.tsx
├── button.tsx           ├── calendar.tsx
├── card.tsx             ├── checkbox.tsx
├── command.tsx          ├── confirm-dialog.tsx
├── dialog.tsx           ├── dropdown-menu.tsx
├── input.tsx            ├── label.tsx
├── popover.tsx          ├── progress.tsx
├── radio-group.tsx      ├── scroll-area.tsx
├── select.tsx           ├── separator.tsx
├── skeleton.tsx         ├── slider.tsx
├── switch.tsx           ├── table.tsx
├── tabs.tsx             ├── textarea.tsx
└── toast.tsx + toaster.tsx + sonner.tsx
```

> **Regla**: No modificar los componentes en `ui/` directamente. Extenderlos mediante composition.

## Componentes de Aplicación

### Formularios y CRUD
| Componente | Descripción |
|---|---|
| `ExpenseForm.tsx` | Formulario de transacciones con selector de gastos recurrentes (29KB) |
| `PresupuestoForm.tsx` | Formulario de presupuestos |
| `PresupuestoImputaciones.tsx` | Imputaciones de presupuesto |
| `ChangePasswordForm.tsx` | Cambio de contraseña |
| `InvitarUsuarioForm.tsx` | Invitar usuario a grupo |

### Visualización y Dashboard
| Componente | Descripción |
|---|---|
| `FinancialDataWidget.tsx` | Widget de datos financieros (dólar, etc.) (25KB) |
| `MultiChartWidget.tsx` | Gráficos múltiples con Recharts (22KB) |
| `FinancialSummary.tsx` | Resumen financiero |
| `DistributionPanel.tsx` | Panel de distribución de gastos |
| `GraficoGastosCategoriaFamiliar.tsx` | Gráficos por categoría familiar (24KB) |
| `DollarIndicator.tsx` | Indicador de cotización dólar |
| `TareasWidget.tsx` | Widget de tareas |
| `TransactionsList.tsx` | Lista de transacciones |

### Layout y Navegación
| Componente | Descripción |
|---|---|
| `Sidebar.tsx` | Sidebar principal con navegación (13KB) |
| `PageLayout.tsx` | Layout estándar de página |
| `SidebarStateManager.tsx` | Gestión de estado del sidebar |
| `CurrencySelector.tsx` | Selector de moneda |
| `DatePickerWithRange.tsx` | Selector de rango de fechas |
| `TestCalendar.tsx` | Calendario de pruebas |

### IA y Asistentes
| Componente | Descripción |
|---|---|
| `UnifiedAssistant.tsx` | Asistente unificado (19KB) |
| `FinancialAdvisor.tsx` | Asesor financiero IA (12KB) |
| `FinancialAdvisorCard.tsx` | Card del asesor |
| `FloatingAdvisor.tsx` | Advisor flotante (13KB) |

### Monetización y Onboarding
| Componente | Descripción |
|---|---|
| `PlanWelcome.tsx` | Bienvenida al plan |
| `RecurringPaymentAlert.tsx` | Alerta de pagos recurrentes |
| `ClearSessionButton.tsx` | Botón limpiar sesión |

### Subdirectorios de Componentes
| Directorio | Contenido |
|---|---|
| `ai/` | Componentes de IA: PatronesAnalisis, RecomendacionesIA |
| `alertas/` | AlertsList, NotificationCenter, AlertaCard, AlertaConfigForm |
| `admin/` | Componentes de administración |
| `feedback/` | Formularios de feedback beta |
| `limits/` | Componentes de límites de plan |
| `onboarding/` | Flujo de onboarding (5 componentes) |

## Patrón de Componente Estándar

```typescript
"use client"

interface MiComponenteProps {
  data: TipoDato[]
  onAction?: (id: string) => void
}

export function MiComponente({ data, onAction }: MiComponenteProps) {
  const [loading, setLoading] = useState(false)
  const { valuesVisible } = useVisibility()  // Visibilidad de valores
  const { theme } = useTheme()               // Tema (dark por defecto)
  
  if (loading) return <Skeleton className="h-48 w-full" />
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Título</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contenido con soporte para visibilidad */}
        {valuesVisible ? `$${monto}` : '•••••'}
      </CardContent>
    </Card>
  )
}
```

## Reglas de Componentes

- ✅ Siempre integrar `useVisibility()` para valores monetarios
- ✅ Soportar tema oscuro (dark mode es el default)
- ✅ Usar componentes Shadcn/ui como base
- ✅ Iconos exclusivamente de `lucide-react`
- ✅ Animaciones con `framer-motion`
- ✅ Loading states con `Skeleton`
- ❌ No usar CSS custom; solo TailwindCSS
- ❌ No duplicar lógica de negocio en componentes (moverla a `lib/`)

## Oportunidades de Mejora

1. **Archivos muy grandes** — `ExpenseForm.tsx` (29KB), `FinancialDataWidget.tsx` (25KB), `GraficoGastosCategoriaFamiliar.tsx` (24KB) deberían descomponerse
2. **Accesibilidad** — Agregar ARIA labels y keyboard navigation (skill `ui-ux-pro-max`)
3. **Design system** — Crear tokens de diseño centralizados (skill `frontend-design`)
4. **Lazy loading** — Los componentes pesados de gráficos deben usar `React.lazy()`
