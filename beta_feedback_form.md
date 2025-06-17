# Frontend de Carga de Feedback para Beta Testers

> **Objetivo**: Proveer a los testers un formulario integrado en la app para reportar rápidamente bugs, sugerencias y mejoras, manteniendo la información bien estructurada y fácil de procesar.

---

## 1 · Flujo de usuario

1. **Acceso rápido**: Icono “Beta Feedback” en menú lateral / sección ajustes.
2. **Formulario único**: El tester completa campos claros y adjunta evidencias.
3. **Confirmación**: Toast/modal con ID de reporte y enlace a “Historial de feedback”.

---

## 2 · Layout del formulario (móvil + web)

| Orden | Componente                | Tipo             | Placeholder / Ejemplo                               | Validación                  |
| ----- | ------------------------- | ---------------- | --------------------------------------------------- | --------------------------- |
|  1    | **Título / Asunto**       | input text       | "No carga pantalla de login"                        | Requerido, 5‑80 chars       |
|  2    | **Descripción detallada** | textarea         | Pasos para reproducir, resultado esperado/obtenido… | Requerido, ≥ 20 chars       |
|  3    | **Tipo de feedback**      | select           | Bug • Mejora • Sugerencia                           | Requerido                   |
|  4    | **Prioridad**             | select           | Baja • Media • Alta                                 | Requerido                   |
|  5    | **Versión de la app**     | input text       | v1.2.3‑beta                                         | Autorelleno & editable      |
|  6    | **Dispositivo / SO**      | input text       | Pixel 7 – Android 14                                | Autorelleno & editable      |
|  7    | **Adjuntar captura**      | file upload      | PNG/JPG ≤ 5 MB                                      | Opcional                    |
|  8    | **Enviar logs anónimos**  | checkbox         |                                                     | Opcional, default on        |
|  9    | **Botón Enviar**          | button (primary) |                                                     | Deshabilitado hasta validar |

> **UX**: mantener todo “above‑the‑fold” (< 600 px alto); usar autocompletado donde sea posible.

---

## 3 · Interacción & feedback

- **Estado cargando** ↔ spinner en el botón + bloqueo de campos.
- **Éxito** → toast *“¡Gracias! Reporte #123 recibido”* + redirección opcional.
- **Error** → toast rojo con causa (timeout, 422, 500…).

---

## 4 · API de backend (ejemplo)

```http
POST /api/feedback
Content‑Type: application/json
Authorization: Bearer <token>
{
  "title": "No carga pantalla de login",
  "description": "Al abrir la app…",
  "category": "bug",
  "priority": "alta",
  "app_version": "1.2.3-beta",
  "device": "Pixel 7 – Android 14",
  "screenshot_url": "https://…",
  "logs": true
}
```

- **Respuesta 201**: `{ "id": 123, "created_at": "2025‑06‑16T21:05:00‑03:00" }`

---

## 5 · Integraciones opcionales

| Destino           | Método                                   | Propósito                            |
| ----------------- | ---------------------------------------- | ------------------------------------ |
| **Trello / Jira** | Webhook POST a board/proyecto específico | Alta automática de tarjeta / issue   |
| **Slack**         | Incoming Webhook                         | Notificación en canal #beta‑feedback |
| **Email**         | SMTP / SendGrid                          | Copia al equipo de soporte           |

---

## 6 · Checklist de implementación

-

---

## 7 · Accesibilidad & buenas prácticas

- Etiquetas `aria‑label` coherentes.
- Contraste ≥ 4.5:1.
- Navegación por teclado completa.
- Mensajes de error descriptivos.

---

## 8 · Próximos pasos

1. **Historial de feedback** dentro de la app con filtros (estado, prioridad).
2. **Push notifications** cuando el estado del reporte cambie (p.ej. *“Arreglado en v1.2.4”*).
3. **Panel interno** para triage rápido (asignar, comentar, cerrar).

