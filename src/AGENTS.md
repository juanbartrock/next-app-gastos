# src/ — Arquitectura de la Aplicación

> **Prerequisito**: Lee primero el `CLAUDE.md` raíz para el contexto global y tu rol.

## Visión Arquitectónica

FinanzIA es un **monolito Next.js 15** con App Router. Toda la lógica (frontend, API, servicios) coexiste en `src/`, organizada por responsabilidad.

## Skills Relevantes
- `next-best-practices` — Patrones de App Router, RSC, layouts
- `vercel-react-best-practices` — Eliminación de waterfalls, optimización de bundles
- `architecture-patterns` — Separación de capas, patrones de diseño

## Estructura

```
src/
├── app/              # Pages, layouts, API routes (App Router)
├── components/       # Componentes React reutilizables
├── contexts/         # React Context providers (estado global)
├── hooks/            # Custom hooks (useConfirm)
├── lib/              # Lógica de negocio, engines, utils, config servicios
├── providers/        # Wrappers de providers (NextAuth, Theme, Toast)
├── scraping/         # Motor de scraping de promociones
├── scripts/          # Scripts de utilidad
└── middleware.ts     # Middleware de autenticación (NextAuth JWT)
```

## Flujo de Autenticación

```
Request → middleware.ts → getToken(JWT)
  ├─ Sin token + ruta protegida → redirect /login
  ├─ Con token + /login|/register → redirect /home
  └─ Con token + ruta protegida → NextResponse.next()
```

- Rutas públicas: `/`, `/login`, `/register`
- Rutas excluidas del middleware: `/_next`, `/api/auth`, `/api/twilio`

## Cadena de Providers (layout.tsx)

El layout raíz anida providers en este orden (importante para dependencias):

```
NextAuthProvider
  └─ ThemeProvider (dark mode por defecto)
      └─ ToastProvider (sonner)
          └─ SidebarProvider
              └─ CurrencyProvider
                  └─ VisibilityProvider (ocultar valores $)
                      └─ PermisosFamiliaresProvider
                          └─ OnboardingProvider
                              └─ SidebarStateManager + {children}
```

> **Regla**: Nuevos providers se agregan **dentro** de este stack respetando dependencias.

## Convenciones

- **Server Components** por defecto; usar `"use client"` solo cuando sea necesario
- **Archivos route**: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
- **API routes**: `route.ts` con exports de `GET`, `POST`, `PUT`, `DELETE`
- **Imports**: Usar alias `@/` para paths relativos a `src/`
- **Next.js 15**: `await params` requerido en routes dinámicas
