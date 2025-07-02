# 🔄 Funcionalidad de Cierre de Períodos Anteriores - Gastos Recurrentes

## 📋 Descripción

La nueva funcionalidad del botón **"Actualizar Estados"** en la sección de gastos recurrentes permite **cerrar períodos anteriores no pagados** y avanzar automáticamente las fechas al siguiente período.

## 🎯 Casos de Uso

Esta funcionalidad es útil cuando:

1. **No se pagó un gasto recurrente** el mes anterior y se quiere cerrar ese período
2. **No correspondía pagar** ese mes específico (por ejemplo, un servicio suspendido temporalmente)
3. **Se pagó parcialmente** pero el usuario decide cerrar el período y comenzar uno nuevo
4. **Se quiere "saltar" un período** por cualquier motivo y avanzar las fechas

## 🛠️ Cómo Funciona

### Botón "Actualizar Estados"

Al presionar el botón, se presentan **dos opciones**:

#### **Opción 1: Solo Actualizar Estados** (Funcionalidad Original)
- Recalcula estados basándose en fechas y pagos asociados
- No modifica fechas existentes
- Actualiza estados: pendiente, pagado, próximo, programado

#### **Opción 2: Actualizar Estados + Cerrar Períodos** (Nueva Funcionalidad)
- **Detecta** gastos recurrentes del mes anterior no pagados
- **Cierra** esos períodos automáticamente
- **Avanza** las fechas al siguiente período según periodicidad
- **Resetea** el estado a "programado" para el nuevo período

## 🔍 Criterios de Detección

Un gasto recurrente es candidato para cierre de período si:

- ✅ Han pasado **más de 7 días** desde la fecha próxima (período de gracia)
- ✅ **No tiene pagos** asociados en el período actual
- ✅ **No está en estado "pagado"** o "n/a"

## 📅 Cálculo de Nuevas Fechas

El sistema avanza las fechas según la periodicidad:

| Periodicidad | Avance |
|-------------|---------|
| Semanal     | +7 días |
| Quincenal   | +15 días |
| Mensual     | +1 mes |
| Bimestral   | +2 meses |
| Trimestral  | +3 meses |
| Semestral   | +6 meses |
| Anual       | +1 año |

## 🎪 Ejemplo Práctico

```
Situación inicial:
📋 Gasto: "Alquiler Departamento"
💰 Monto: $50,000
📅 Próxima fecha: 15/12/2024
📊 Estado: pendiente
🔄 Periodicidad: mensual

Hoy: 20/01/2025

Al ejecutar "Cerrar Períodos":
📅 Nueva fecha: 15/01/2025 → 15/02/2025
📊 Nuevo estado: programado
💬 Razón: "Período anterior cerrado sin pago"
```

## 🌟 Beneficios

1. **Automatización**: No necesidad de editar manualmente cada gasto recurrente
2. **Flexibilidad**: Permite manejar situaciones excepcionales fácilmente
3. **Orden**: Mantiene las fechas actualizadas y relevantes
4. **Trazabilidad**: Registra qué períodos fueron cerrados y por qué

## ⚙️ Implementación Técnica

### API Modificada
```
GET /api/recurrentes/estado-automatico?cerrarPeriodosAnteriores=true
```

### Nuevos Campos en Respuesta
```json
{
  "stats": {
    "periodosCerrados": 3
  },
  "periodosCerrados": [
    {
      "id": 123,
      "concepto": "Alquiler",
      "fechaAnterior": "2024-12-15",
      "fechaNueva": "2025-01-15",
      "razon": "Período anterior cerrado sin pago"
    }
  ]
}
```

### Funciones Agregadas
- `esDelPeriodoAnteriorNoPagado()`: Detecta candidatos para cierre
- `calcularProximaFecha()`: Calcula nueva fecha según periodicidad  
- `actualizarConCierrePeriodos()`: Ejecuta cierre con feedback detallado

## 🎯 Interfaz de Usuario

### Diálogos de Confirmación
1. **Primer diálogo**: Elegir entre actualización simple o avanzada
2. **Segundo diálogo**: Confirmar cierre de períodos con explicación detallada
3. **Feedback**: Toast con resumen de cambios realizados
4. **Detalles**: Alert con lista específica de períodos cerrados

### Mensajes de Resultado
- ✅ "Estados actualizados: 2 cambios realizados"
- 🔄 "Períodos cerrados: 3 gastos recurrentes avanzados al siguiente período"
- 📋 Lista detallada: "Alquiler: 15/12/2024 → 15/01/2025"

## 🚀 Casos de Uso Avanzados

### Gestión de Servicios Suspendidos
```
Servicio de cable suspendido por 2 meses:
1. No se paga en diciembre ni enero
2. En febrero, usar "Cerrar Períodos"  
3. Avanza la fecha a marzo
4. Reactivar el servicio normalmente
```

### Ajuste de Presupuesto Familiar
```
Presupuesto ajustado a mitad de año:
1. Algunos gastos recurrentes ya no aplican
2. Usar "Cerrar Períodos" para avanzar fechas
3. Evaluar cuáles eliminar o modificar
4. Mantener historial limpio y actualizado
```

## ⚠️ Consideraciones Importantes

- **Irreversible**: El cierre de períodos modifica las fechas permanentemente
- **Confirmación**: Siempre requiere confirmación explícita del usuario
- **Gracia**: Periodo de 7 días antes de considerar un gasto para cierre
- **Estados**: Solo afecta gastos no pagados (respeta los ya pagados)

---

**Fecha de implementación**: Enero 2025  
**Desarrollado para**: Sistema de Gestión de Gastos - FinanzIA 