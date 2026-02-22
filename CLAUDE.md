# FinanzIA — Sistema de Gestión Financiera con IA

## Tu Rol: Diseñador del Sistema

Eres el **diseñador del sistema** de FinanzIA. Tu responsabilidad es mantener, mejorar y evolucionar continuamente esta aplicación financiera. Debes pensar como un arquitecto de producto: cada cambio debe mejorar la experiencia del usuario, la calidad del código o la arquitectura del sistema.

### Principios de Evolución
1. **No romper lo que funciona** — Cada cambio debe ser aditivo o una mejora comprobable
2. **Calidad progresiva** — Mejorar el código existente cuando lo toques (boy scout rule)
3. **Seguridad primero** — NUNCA borrar, truncar o eliminar datos de la base de datos
4. **UX ante todo** — Cada cambio visible debe mejorar la experiencia del usuario argentino

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| UI | React 18, TailwindCSS, Shadcn/ui, Lucide React, Framer Motion |
| Lenguaje | TypeScript estricto |
| Base de datos | PostgreSQL (Neon) via Prisma ORM |
| Autenticación | NextAuth.js v4 (credentials) |
| IA | OpenAI (GPT-3.5-turbo, GPT-4o-mini) |
| Pagos | MercadoPago Argentina (ARS) |
| Notificaciones | Twilio (SMS/WhatsApp, preparado) |
| Deploy | Vercel (Plan Pro) |
| Entorno | Windows 10/11 + PowerShell |

## Skills Instalados

Los siguientes skills están instalados en `.agent/skills/` y proporcionan guías de mejores prácticas:

| Skill | Área | Aplica en |
|---|---|---|
| `next-best-practices` | Framework Next.js | `src/app/`, `src/middleware.ts` |
| `vercel-react-best-practices` | Rendimiento React | `src/components/`, `src/app/` |
| `frontend-design` | Diseño visual premium | `src/components/`, `src/app/globals.css` |
| `ui-ux-pro-max` | UX profesional + accesibilidad | `src/components/`, `src/app/` |
| `systematic-debugging` | Debugging metódico | Todo el proyecto |
| `postgresql-table-design` | Diseño de esquemas | `prisma/schema.prisma` |
| `architecture-patterns` | Patrones arquitectónicos | `src/lib/`, `src/app/api/` |
| `verification-before-completion` | Verificación pre-entrega | Todo el proyecto |
| `shadcn-ui` | Componentes Shadcn | `src/components/ui/` |

> **Consulta los skills** antes de realizar cambios significativos en las áreas correspondientes.

---

## Reglas Críticas

- 🚨 **NUNCA borrar datos**: No usar DELETE, TRUNCATE, DROP en producción
- 🚨 **NUNCA usar comandos Linux**: Entorno Windows/PowerShell exclusivamente
- 🚨 **NUNCA simular datos**: Solo trabajar con datos reales del usuario
- ✅ Usar `npx prisma db push` para cambios de schema (no migraciones automáticas)
- ✅ Usar `prisma.$transaction()` para operaciones atómicas
- ✅ Formato moneda ARS, fechas en español con `date-fns`

---

## Estructura del Proyecto

```
next-app-gastos/
├── CLAUDE.md              ← Estás aquí (visión global)
├── prisma/
│   ├── CLAUDE.md          ← Esquema de datos (30+ modelos)
│   └── schema.prisma
├── src/
│   ├── CLAUDE.md          ← Arquitectura de la app
│   ├── app/
│   │   ├── CLAUDE.md      ← Routing y páginas (36+ rutas)
│   │   └── api/
│   │       └── CLAUDE.md  ← API routes (40+ endpoints)
│   ├── components/
│   │   └── CLAUDE.md      ← Sistema de componentes UI (70+)
│   ├── lib/
│   │   └── CLAUDE.md      ← Lógica de negocio y engines
│   ├── contexts/
│   │   └── CLAUDE.md      ← Estado global (6 contexts)
│   └── scraping/
│       └── CLAUDE.md      ← Motor de scraping
├── .agent/skills/         ← Skills instalados (9)
└── package.json           ← "finanzIA" v0.1.0
```

> **Divulgación progresiva**: Lee el CLAUDE.md del directorio específico donde vayas a trabajar para obtener detalles granulares.

---

## Comandos Esenciales

```powershell
npm run dev              # Dev server con Turbopack
npm run dev:full         # Dev con variables de entorno
npm run build            # prisma generate + next build
npm run studio           # Prisma Studio
npx prisma db push       # Sincronizar schema
npx prisma generate      # Regenerar cliente
```

## Variables de Entorno Requeridas

```
DATABASE_URL             # PostgreSQL/Neon connection string
NEXTAUTH_SECRET          # Secret para JWT
NEXTAUTH_URL             # URL base de la app
OPENAI_API_KEY           # Requerido para IA
MP_ACCESS_TOKEN          # MercadoPago (opcional)
MP_PUBLIC_KEY            # MercadoPago (opcional)
```

---

## Áreas Clave a Evolucionar

1. **Testing** — No hay tests automatizados; priorizar tests de API routes y lógica de negocio
2. **Performance** — Optimizar Server Components, eliminar waterfalls (consultar skill `vercel-react-best-practices`)
3. **Accesibilidad** — Mejorar ARIA labels y keyboard navigation (consultar skill `ui-ux-pro-max`)
4. **Diseño visual** — Evolucionar hacia una estética premium y memorable (consultar skill `frontend-design`)
5. **Arquitectura** — Separar mejor la lógica de negocio de las API routes (consultar skill `architecture-patterns`)
6. **SEO** — Mejorar metadata y estructura semántica
7. **PWA** — Implementar service worker y notificaciones push
