# Documentación de Cálculos para Panel Externo

Este documento explica cómo se deben calcular los indicadores financieros principales de FinanzIA para que puedan ser replicados o consumidos correctamente por el Panel.

## 1. Saldo Total y por Tipo de Movimiento

El saldo total representa la liquidez acumulada histórica de todos los movimientos marcados para incluir en el grupo familiar.

### Lógica de Cálculo
*   **Fuente**: Tabla `Gasto` (Transactions).
*   **Filtro Obligatorio**: `incluirEnFamilia == true`.
*   **Exclusión**: Se deben **excluir** los movimientos donde `tipoMovimiento == 'tarjeta'`. Esto es para evitar la duplicación de gastos, ya que el gasto real se contabiliza cuando se paga la tarjeta o el préstamo vinculado.
*   **Operación**:
    *   Si `tipoTransaccion == 'income'`: Sumar al total.
    *   Si `tipoTransaccion == 'expense'`: Restar al total.

### Desglose por Tipo
Los totales por categoría de cuenta se filtran por el campo `tipoMovimiento`:
*   **EFT (Efectivo)**: `tipoMovimiento == 'efectivo'`.
*   **Ahorro**: `tipoMovimiento == 'ahorro'`.
*   **Digital**: `tipoMovimiento == 'digital'`.

### Contexto de Grupo
*   Si el usuario tiene permisos familiares (`ADMINISTRADOR_FAMILIAR` o `MIEMBRO_COMPLETO`), el saldo debe incluir los movimientos de **todos los miembros del grupo**.
*   Si no tiene permisos, solo se incluyen sus propios movimientos marcados como `incluirEnFamilia`.

---

## 2. Ingresos y Gastos Familiares Mensuales

Representa el flujo de caja (Cash Flow) de un mes específico para el grupo familiar.

### Lógica de Cálculo
*   **Filtro Temporal**: Se debe filtrar por mes y año.
*   **Prioridad de Fecha**: Se debe utilizar `fechaImputacion` si está presente; de lo contrario, utilizar `fecha` (createdAt).
*   **Filtro de Grupo**: Al igual que el saldo total, solo incluye movimientos con `incluirEnFamilia == true`.
*   **Ingresos Mensuales**: Suma de montos donde `tipoTransaccion == 'income'`.
*   **Gastos Mensuales**: Suma de montos donde `tipoTransaccion == 'expense'`.

---

## 3. Gastos Pendientes

Representa los compromisos financieros del mes actual que aún no han sido cancelados. Se compone de dos fuentes: Gastos Recurrentes y Préstamos.

### A. Gastos Recurrentes Pendientes
1.  Identificar `GastoRecurrente` activos del usuario.
2.  Filtrar aquellos cuya `proximaFecha` caiga en el mes actual o tengan `periodicidad == 'mensual'`.
3.  Buscar en la tabla `Gasto` si ya existe un registro generado para este `gastoRecurrenteId` en el mes actual.
4.  **Monto Pendiente** = `montoRecurrente` - `sumaDePagosRealizadosEsteMes`.

### B. Préstamos (Cuotas) Pendientes
1.  Identificar `Prestamo` con `estado == 'activo'`.
2.  Calcular el número de cuota correspondiente al mes actual:
    *   `mesesTranscurridos = (mesActual - mesInicioPrestamo)`.
    *   `numeroCuotaActual = mesesTranscurridos + 1`.
3.  Verificar en la tabla `PagoPrestamo` si existe un pago registrado para ese `numeroCuotaActual` en el mes actual.
4.  Si no existe el pago y `numeroCuotaActual <= plazoMeses`, se suma el `cuotaMensual` al total pendiente.

### Resumen Total Pendiente
`Total Pendiente = (Sumatoria Gastos Recurrentes Pendientes) + (Sumatoria Cuotas de Préstamos Pendientes)`.

---

## Referencias Técnicas (Prisma)
*   **Modelos clave**: `Gasto`, `GastoRecurrente`, `Prestamo`, `PagoPrestamo`, `GrupoMiembro`.
*   **API Local**: `/api/gastos/familiares` y `/api/gastos/pendientes`.
