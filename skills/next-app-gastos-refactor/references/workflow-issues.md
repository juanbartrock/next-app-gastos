# Workflow de Issues y Labels

## Estados permitidos
- `To Fix`
- `planning`
- `Review plan`
- `Plan accepted`
- `in-progress`
- `PR ready`
- `done`

## Reglas de transición
1. Juan etiqueta `To Fix`.
2. Agente toma issue -> `planning` + comentario de toma.
3. Agente publica plan -> `Review plan`.
4. Iteración de plan:
   - si falta ajuste -> `Review plan`
   - si plan aprobado -> `Plan accepted`
5. Implementación -> `in-progress`.
6. PR con evidencia -> `PR ready`.
7. Merge/revisión final -> `done`.

## Tipos complementarios
- `refactor`
- `feature`
- `bug`
- `tech-debt`

## Plantillas rápidas de comentario

### Toma de issue
"Tomo esta issue para planificación. Cambio a `planning` y preparo propuesta en modo /plan."

### Entrega de plan
"Plan de implementación publicado. Cambio a `Review plan` para validación HitL."

### Inicio de implementación
"Plan aprobado. Inicio implementación y validaciones. Cambio a `in-progress`."

### Entrega PR
"Implementación finalizada. PR abierta con evidencia y pruebas. Cambio a `PR ready`."
