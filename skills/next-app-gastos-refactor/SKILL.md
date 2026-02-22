---
name: next-app-gastos-refactor
description: Refactor incremental para una app Next.js grande y compleja con flujo HitL basado en issues/labels, planificación previa obligatoria y divulgación progresiva. Usar cuando se analice, planifique o ejecute mejoras en `next-app-gastos`.
---

# next-app-gastos-refactor

Seguir este flujo:
1. Confirmar estado de issue y etiqueta.
2. Si no está en `Plan accepted`, no implementar.
3. Planificar por funcionalidad, no por capa técnica abstracta.
4. Mantener PR pequeña y trazable a una issue.

## Referencias (cargar bajo demanda)
- Mapa de repo: `references/repo-map.md`
- Workflow y etiquetas: `references/workflow-issues.md`
- Plantilla de planificación: `references/plan-template.md`

## Criterios prácticos
- Priorizar reducción de complejidad accidental.
- Evitar reescrituras globales.
- Preservar comportamiento externo salvo issue explícita de cambio funcional.
- Dejar evidencia de validación en issue/PR.
