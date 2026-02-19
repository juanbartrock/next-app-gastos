# AGENTS.md — next-app-gastos

Este repositorio se trabaja con enfoque **incremental**, **HitL** (human-in-the-loop) y **riesgo controlado**.

## Objetivo
Refactorizar gradualmente una app grande/experimental sin romper producción ni frenar evolución funcional.

## Principios operativos
- Cambios chicos, reversibles y trazables.
- Una funcionalidad por vez.
- Plan antes de código.
- Evidencia antes de cerrar.
- Diseñar con **divulgación progresiva** (de alto nivel → detalle bajo demanda).

## Regla de oro
No implementar cambios de código si la issue no está en `Plan accepted`.

---

## Flujo oficial de trabajo (acordado)

1. **Setup de contexto**
   - Mantener este `AGENTS.md` y skills del repo actualizadas.
   - Mantener mapeo de referencias por dominio (arquitectura, datos, UI, APIs, pruebas).

2. **Planificar UNA funcionalidad**
   - Delimitar alcance funcional y técnico.
   - Identificar riesgos y dependencias.

3. **Crear issues de trabajo**
   - Con contexto, alcance, criterios de aceptación y riesgos.

4. **Revisión HitL inicial**
   - Juan revisa issues y etiqueta `To Fix`.

5. **Toma de issue para planificación**
   - El agente toma una issue `To Fix`.
   - Cambia etiqueta a `planning`.
   - Deja comentario: "Issue tomada para planificación".

6. **Plan y control**
   - El agente publica plan (modo /plan) en comentario.
   - Cambia etiqueta a `Review plan`.
   - Iterar:
     - Si falta ajuste: mantener/volver a `Review plan`.
     - Si aprobado por Juan: `Plan accepted`.

7. **Implementación**
   - Tomar solo issues `Plan accepted`.
   - Cambiar a `in-progress`.
   - Implementar + pruebas + validaciones.
   - Abrir PR con evidencia.
   - Cambiar a `PR ready`.

8. **Cierre**
   - Revisión conjunta y merge manual.
   - Etiqueta final `done`.

---

## Etiquetas estándar (canon)
Usar siempre este set, sin variantes:
- `To Fix`
- `planning`
- `Review plan`
- `Plan accepted`
- `in-progress`
- `PR ready`
- `done`

Etiquetas de clasificación recomendadas (complementarias):
- `refactor` (sin cambio funcional)
- `feature`
- `bug`
- `tech-debt`

---

## Definition of Ready (DoR)
Antes de planificar, la issue debe tener:
- Objetivo funcional claro.
- Alcance explícito (**in/out**).
- Criterios de aceptación verificables.
- Restricciones técnicas conocidas.
- Riesgos/dependencias relevantes.

## Definition of Done (DoD)
Para cerrar una issue:
- Implementación completa según plan aprobado.
- Pruebas relevantes ejecutadas y reportadas.
- Sin regresiones conocidas.
- Documentación mínima actualizada (si aplica).
- PR abierta con resumen técnico y evidencia.

---

## Reglas de PR
- 1 issue principal ↔ 1 PR (preferido).
- PRs pequeñas y revisables.
- Incluir:
  - Qué se cambió
  - Por qué
  - Cómo se validó
  - Riesgos/rollback

---

## Skills y mapeo (divulgación progresiva)

### Skill local del repo (orquestación principal)
- `next-app-gastos-refactor` → flujo HitL, labels, DoR/DoD y planificación por funcionalidad.

### Skills externas instaladas (especializadas)
- `github` → issues/PR/runs con `gh`.
- `skill-creator` → evolución de skills del proyecto.
- `vercel-react-best-practices` → patrones React/Next para calidad y mantenibilidad.
- `web-design-guidelines` → lineamientos de diseño web y consistencia visual.
- `frontend-design` → diseño frontend de calidad (estructura, UX, presentación).
- `vercel-composition-patterns` → composición de componentes React y reducción de acoplamiento.
- `ui-ux-pro-max` → criterio UI/UX práctico para decisiones de interfaz.
- `brainstorming` → ideación guiada para propuestas de cambio antes de implementar.
- `next-best-practices` → buenas prácticas específicas de Next.js.
- `tailwind-design-system` → sistema de diseño con Tailwind/CVA/tokens.
- `neon-postgres` → buenas prácticas de Postgres/Neon para datos y performance.

### Mapeo explícito Agent → Skills

**OpenClaw (agente principal del repo)**
- `next-app-gastos-refactor` (orquestación del workflow)
- `github`
- `skill-creator`
- `vercel-react-best-practices`
- `next-best-practices`
- `vercel-composition-patterns`
- `web-design-guidelines`
- `frontend-design`
- `ui-ux-pro-max`
- `tailwind-design-system`
- `neon-postgres`
- `brainstorming`

**Nota operativa**
- Instalación real gestionada por `skills` CLI en `.agents/skills/*`.
- Exposición en OpenClaw del workspace mediante symlinks en `skills/*`.
- Si se agrega/remueve una skill, actualizar ambos: instalación y symlink.

### Regla de carga progresiva
1) Cargar primero `next-app-gastos-refactor` para respetar workflow y estados.
2) Elegir **una** skill especializada principal según el tipo de tarea.
3) Leer referencias puntuales solo cuando hagan falta (no documentación masiva).
4) Si una tarea cruza UI + datos + arquitectura, resolver en fases (plan UI/arquitectura primero, luego datos).

---

## Política de seguridad de cambios
- No ejecutar acciones destructivas sin validación explícita.
- No mezclar refactor estructural con cambios funcionales no planificados.
- Evitar "scope creep": si aparece trabajo nuevo, crear nueva issue.

### Guardrails específicos para Neon/Postgres
- Modo por defecto: **solo lectura** para análisis (inspección, metadatos, `SELECT`).
- No ejecutar `DELETE`, `DROP`, `TRUNCATE`, ni borrado de proyectos/branches Neon sin aprobación explícita de Juan.
- Cualquier cambio en datos/esquema de producción requiere plan previo + estrategia de rollback.
- Antes de operaciones de riesgo: confirmar backup/snapshot disponible.
- Nunca exponer secretos (`NEON_API_KEY`, connection strings, tokens) en issues, PRs, logs o commits.
- Usar variables de entorno para credenciales; prohibido hardcodear secretos.

---

## Checklist rápido por issue
- [ ] ¿Tiene DoR completo?
- [ ] ¿Etiqueta actual corresponde al estado?
- [ ] ¿Hay plan vigente y aprobado?
- [ ] ¿Se validó con pruebas?
- [ ] ¿PR lista para revisión humana?
