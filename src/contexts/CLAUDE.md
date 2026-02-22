# src/contexts/ — Estado Global

> **Prerequisito**: Lee `src/CLAUDE.md` para el orden de providers.

## Skills Relevantes
- `vercel-react-best-practices` — Optimización de re-renders con Context
- `architecture-patterns` — Patrones de estado global

## Contexts Disponibles (6)

| Context | Archivo | Propósito |
|---|---|---|
| `CurrencyContext` | `CurrencyContext.tsx` | Moneda activa (ARS por defecto), conversión, formato |
| `VisibilityContext` | `VisibilityContext.tsx` | Ocultar/mostrar valores monetarios (botón ojo) |
| `SidebarContext` | `SidebarContext.tsx` | Estado abierto/cerrado del sidebar |
| `PermisosFamiliaresContext` | `PermisosFamiliaresContext.tsx` | Permisos de grupo familiar, rol admin |
| `PermisosGrupalesContext` | `PermisosGrupalesContext.tsx` | Permisos de gastos grupales |
| `OnboardingContext` | `OnboardingContext.tsx` | Estado del onboarding del usuario (13KB) |

## Providers (en `/providers/`)

| Provider | Archivo | Propósito |
|---|---|---|
| `NextAuthProvider` | `NextAuthProvider.tsx` | Wrapper de SessionProvider de NextAuth |
| `ThemeProvider` | `ThemeProvider.tsx` | next-themes con dark mode por defecto |
| `ToastProvider` | `ToastProvider.tsx` | Sonner toaster |

## Orden de Anidamiento (layout.tsx)

```
NextAuthProvider → ThemeProvider → ToastProvider → SidebarProvider
→ CurrencyProvider → VisibilityProvider → PermisosFamiliaresProvider
→ OnboardingProvider → {children}
```

> **Regla**: Respetar este orden. Los providers interiores pueden depender de los exteriores.

## Uso en Componentes

```typescript
// Siempre importar hooks, no los providers
import { useVisibility } from '@/contexts/VisibilityContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { usePermisosFamiliares } from '@/contexts/PermisosFamiliaresContext'
import { useOnboarding } from '@/contexts/OnboardingContext'
```

## Oportunidades de Mejora

1. **OnboardingContext** es muy grande (13KB) — considerar split
2. **CurrencyContext** podría beneficiarse de server-side data fetching
3. Evaluar migración a Zustand o Jotai para estado complejo si los re-renders se vuelven problema
