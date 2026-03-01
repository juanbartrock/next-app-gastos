# Integración de Agente Externo para FinanzIA

Este documento describe cómo una aplicación externa (o agente en el mismo servidor) puede consumir los servicios de FinanzIA para consultar saldos, registrar gastos y verificar vencimientos.

## Autenticación

Todas las solicitudes deben incluir el header `Authorization` con una API Key válida.

```http
Authorization: Bearer finIA_xxxxxxxxxxxxxxxxxxxxxxxx
```

> **Nota:** Las API Keys deben ser generadas previamente en el sistema por un administrador y tener los permisos adecuados (`read` y `write`).

## Endpoints Disponibles

La URL base para el agente es: `http://localhost:3000/api/v1/agent` (ajustar puerto/dominio según corresponda).

### 1. Consultar Saldos (Total, Digital, Efectivo, Ahorro)

Obtiene los saldos acumulados históricos del usuario, desglosados por tipo de cuenta.

*   **Método:** `GET`
*   **Endpoint:** `/saldos`
*   **Respuesta Exitosa (200 OK):**

```json
{
  "moneda": "ARS",
  "total": 150000.50,
  "desglose": {
    "efectivo": 50000.00,
    "digital": 80000.50,
    "ahorro": 20000.00
  },
  "timestamp": "2024-05-20T10:00:00.000Z"
}
```

### 2. Registrar un Nuevo Gasto (o Ingreso)

Permite insertar una nueva transacción en el sistema.

*   **Método:** `POST`
*   **Endpoint:** `/gastos`
*   **Permiso requerido:** `write`
*   **Body (JSON):**

```json
{
  "concepto": "Compra Supermercado",      // Requerido
  "monto": 15000,                         // Requerido
  "tipoTransaccion": "expense",           // Opcional: "expense" (default) o "income"
  "tipoMovimiento": "digital",            // Opcional: "efectivo" (default), "digital", "ahorro"
  "categoria": "Alimentación",            // Opcional: Nombre de la categoría
  "fecha": "2024-05-20T10:00:00Z",        // Opcional: Fecha del gasto (default: ahora)
  "incluirEnFamilia": true                // Opcional: default true
}
```

*   **Respuesta Exitosa (201 Created):** Retorna el objeto del gasto creado.

### 3. Consultar Próximos Vencimientos (Recurrentes)

Obtiene la lista de gastos recurrentes (servicios, suscripciones, etc.) ordenados por fecha de vencimiento.

*   **Método:** `GET`
*   **Endpoint:** `/recurrentes`
*   **Query Params Opcionales:**
    *   `estado`: Filtra por estado (ej: `pendiente`, `pagado`).
    *   `includeGastos=true`: Incluye historial de pagos recientes.
*   **Respuesta Exitosa (200 OK):**

```json
{
  "data": [
    {
      "id": 12,
      "concepto": "Internet Fibra",
      "monto": 12000,
      "proximaFecha": "2024-05-25T00:00:00.000Z",
      "estado": "pendiente",
      "periodicidad": "mensual"
    }
    // ...
  ]
}
```

### 4. Resumen Mensual (Alternativo)

Para obtener un resumen del flujo de caja del mes actual (ingresos vs gastos del periodo).

*   **Método:** `GET`
*   **Endpoint:** `/resumen`
*   **Query Params:** `mes` (1-12), `año` (ej: 2024).

---

## Notas de Implementación

1.  **Saldos:** El endpoint `/saldos` calcula el stock histórico real (Ingresos - Egresos) de todas las transacciones históricas, excluyendo tarjetas de crédito (que se consideran pasivos hasta que se pagan).
2.  **Validaciones:** El sistema validará automáticamente los límites del plan del usuario al intentar crear gastos. Si se excede el límite, retornará error 403.
