# Fecha de Imputación Contable

## 📅 Descripción del Problema

En Argentina es muy común que los salarios se depositen el último día del mes (ej: 31 de mayo) pero en realidad corresponden al mes siguiente (junio). Esta situación genera problemas contables:

- **Mayo aparece artificialmente alto** en ingresos
- **Junio aparece sin ingresos** del salario
- **Los reportes mensuales son incorrectos**
- **Los presupuestos se ven afectados**

## ✅ Solución Implementada

Se agregó un nuevo campo opcional `fechaImputacion` al modelo `Gasto` que permite:

1. **Registrar la fecha real del depósito** (fecha contable/bancaria)
2. **Asignar una fecha de imputación diferente** (mes al que realmente corresponde)
3. **Mantener transparencia total** (se ven ambas fechas)
4. **Reportes contables correctos** usando la fecha de imputación

## 🏗️ Cambios Técnicos Implementados

### 1. Modelo de Base de Datos

```typescript
model Gasto {
  id              Int             @id @default(autoincrement())
  concepto        String
  monto           Float
  fecha           DateTime        @default(now()) // Fecha real de la transacción/depósito
  fechaImputacion DateTime?       // Fecha para imputación contable (mes al que corresponde)
  categoria       String
  tipoTransaccion String          @default("expense")
  // ... otros campos
}
```

### 2. API Routes Actualizada

**GET `/api/gastos`**
- Nuevo parámetro: `usarFechaImputacion=true`
- Cuando está activo, usa `fechaImputacion` para filtros de fecha
- Si no hay `fechaImputacion`, usa `fecha` como fallback

**POST `/api/gastos`**
- Acepta el nuevo campo `fechaImputacion` opcional
- Validación automática del formato de fecha

### 3. Formulario Mejorado

El `ExpenseForm` ahora incluye:
- Checkbox para activar fecha de imputación
- Campo separado para fecha de imputación
- Explicación visual del caso de uso
- Validación de ambas fechas

## 🎯 Casos de Uso Principales

### 1. Salarios 💼
```
Fecha de depósito:    31/05/2024
Fecha de imputación:  01/06/2024
Resultado: Aparece en reportes de junio
```

### 2. Alquileres 🏠
```
Fecha de cobro:       25/04/2024 (adelantado)
Fecha de imputación:  01/05/2024
Resultado: Se imputa al mes correcto
```

### 3. Facturas de Servicios 💳
```
Fecha de pago:        28/03/2024 (anticipado)
Fecha de imputación:  01/04/2024
Resultado: Gasto del período correcto
```

## 🛠️ Uso de la API

### Crear Transacción con Fecha de Imputación

```javascript
const response = await fetch('/api/gastos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    concepto: 'Salario Mayo 2024',
    monto: 850000,
    categoria: 'Ingreso',
    categoriaId: 1,
    tipoTransaccion: 'income',
    tipoMovimiento: 'digital',
    fecha: '2024-05-31T00:00:00.000Z',        // Fecha de depósito
    fechaImputacion: '2024-06-01T00:00:00.000Z'  // Fecha de imputación
  })
})
```

### Consultar con Fecha de Imputación

```javascript
// Para reportes contables
const response = await fetch('/api/gastos?usarFechaImputacion=true&desde=2024-06-01&hasta=2024-06-30')

// Para consultas normales (fecha de transacción)
const response = await fetch('/api/gastos?desde=2024-06-01&hasta=2024-06-30')
```

## 📊 Impacto en Reportes

### Informes Mensuales
Los informes pueden usar el parámetro `usarFechaImputacion=true` para mostrar datos contables correctos.

### Presupuestos
Los presupuestos automáticamente consideran la fecha de imputación cuando está disponible para cálculos más precisos.

### Dashboard
El dashboard puede mostrar tanto la fecha de depósito como la de imputación para transparencia total.

## 🔄 Retrocompatibilidad

- **100% compatible** con transacciones existentes
- Las transacciones sin `fechaImputacion` funcionan exactamente igual
- No se requieren migraciones de datos
- Los reportes existentes siguen funcionando

## 🧪 Página de Pruebas

Se creó una página dedicada para probar la funcionalidad:

**URL**: `/test-fecha-imputacion`

**Incluye**:
- Explicación visual del problema
- Casos de uso comunes
- Demo interactivo para crear ejemplos
- Visualización de transacciones con ambas fechas
- Información técnica

## 📝 Ejemplos de Implementación

### En Formularios
```typescript
// Estados necesarios
const [fechaImputacion, setFechaImputacion] = useState<Date | undefined>(undefined)
const [fechaImputacionStr, setFechaImputacionStr] = useState<string>("")
const [mostrarFechaImputacion, setMostrarFechaImputacion] = useState<boolean>(false)

// En el JSX
{mostrarFechaImputacion && (
  <div className="space-y-2">
    <Label htmlFor="fechaImputacion">Fecha de imputación contable</Label>
    <Input
      type="text"
      id="fechaImputacion"
      value={fechaImputacionStr}
      onChange={(e) => setFechaImputacionStr(e.target.value)}
      placeholder="DD/MM/YYYY"
    />
  </div>
)}
```

### En Reportes
```typescript
// Hook personalizado para fechas contables
const useFechaContable = (transaccion: Gasto) => {
  return transaccion.fechaImputacion || transaccion.fecha
}

// En componentes de reporte
const fechaParaReporte = useFechaContable(gasto)
```

## 🚀 Beneficios Inmediatos

1. **Reportes más precisos** - Los ingresos aparecen en el mes correcto
2. **Presupuestos realistas** - No más meses artificialmente altos o bajos  
3. **Transparencia total** - Se pueden ver ambas fechas cuando es necesario
4. **Flexibilidad** - Campo opcional, no afecta operaciones existentes
5. **Casos específicos de Argentina** - Maneja correctamente los pagos anticipados

## 🔮 Próximas Mejoras

1. **Alertas inteligentes** - Detectar automáticamente patrones de salarios
2. **Configuración por usuario** - Preferencias de imputación por defecto  
3. **Reportes duales** - Mostrar ambas perspectivas simultáneamente
4. **Integración con IA** - Sugerir fechas de imputación automáticamente
5. **Dashboard mejorado** - Indicadores visuales de diferencias de imputación

---

## 📞 Soporte

Para consultas sobre esta funcionalidad, revisar:
- Página de pruebas: `/test-fecha-imputacion`
- Documentación de API: `/api/gastos`
- Ejemplos en el formulario de transacciones 