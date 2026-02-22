# Repo Map (alto nivel)

## Stack observado
- Next.js 15 + React 18 + TypeScript
- Prisma + Postgres
- NextAuth
- Tailwind + Radix UI
- Integraciones: MercadoPago, Twilio, OpenAI, scraping, OCR, imports/exports

## Señales de tamaño/complejidad (snapshot inicial)
- Archivos en `src/`: ~345
- Dominios API en `src/app/api`: ~39
- Rutas de primer nivel en `src/app`: ~34
- Archivos en `prisma/`: ~13

## Estructura principal
- `src/app/*`: páginas/rutas (incluye áreas de admin y muchas funcionalidades de negocio)
- `src/app/api/*`: endpoints por dominio
- `src/components/*`: componentes de UI y por dominio
- `src/lib/*`: utilidades, AI, alert-engine, onboarding
- `src/scraping/*`: lógica de scraping por proveedor
- `prisma/*`: schema/migrations/seeds/scripts DB

## Zonas con alta probabilidad de deuda técnica
- Superposición de dominios funcionales dentro de `src/app` y `src/app/api`.
- Integraciones externas múltiples en un mismo monolito de app.
- Posible mezcla de responsabilidades (UI + acceso a datos + reglas de negocio).
- Scripts/documentación histórica extensa en raíz del repo.

## Hipótesis para refactor incremental
1. Extraer límites por dominio (transacciones, presupuestos, suscripciones, etc.).
2. Definir contratos estables entre UI, servicios y persistencia.
3. Endurecer testing en verticales críticas antes de cambios grandes.
4. Atacar primero "quick wins" de complejidad visible y bajo riesgo.
