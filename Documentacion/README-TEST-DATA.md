# Generador de Datos Financieros para Pruebas

Este script genera un conjunto completo de datos financieros para probar todas las funcionalidades de la aplicación, incluyendo el asesor financiero personalizado.

## Características principales

- **Datos para los últimos 6 meses**: Genera automáticamente datos históricos para los últimos 6 meses hasta el mes actual
- **Datos realistas**: Incluye variaciones mensuales, tendencias y eventos especiales para simular un uso real
- **Conjunto completo de datos**: Crea transacciones, gastos recurrentes, presupuestos y financiaciones
- **Perfiles financieros coherentes**: Mantiene una distribución realista de gastos por categoría

## Cómo ejecutar el script

1. Asegúrate de tener Node.js instalado
2. Abre una terminal y navega a la raíz de tu proyecto
3. Ejecuta el siguiente comando:

```bash
node generate-test-data.js
```

## Datos que se generan

### 1. Transacciones
- Ingreso mensual (salario) con pequeñas variaciones
- Gastos distribuidos entre diferentes categorías:
  - Vivienda (25%)
  - Alimentación (20%)
  - Transporte (10%)
  - Servicios (8%)
  - Y más...
- Tipos de movimiento: efectivo, digital, ahorro y tarjeta
- Conceptos realistas para cada categoría (ej: "Supermercado", "Electricidad", etc.)

### 2. Gastos Recurrentes
- Distribuidos según periodicidad:
  - 80% mensuales (alquiler, suscripciones, servicios)
  - 15% bimestrales (mantenimiento, impuestos)
  - 5% semestrales (seguros)

### 3. Presupuestos
- Creados para cada grupo de categorías y cada mes
- Ajustados automáticamente según los ingresos esperados

### 4. Eventos Especiales
- Compras grandes ocasionales (viajes, tecnología)
- Financiación para compras importantes
- Bonos semestrales de ingresos

### 5. Tendencias
- Evolución de ingresos a lo largo del tiempo
- Patrones de gasto con pequeñas variaciones mensuales

## Estructura de Datos

### Ingresos
- Salario mensual base de $3,000
- Bonificaciones semestrales (50% del salario)

### Conceptos de Gastos
El script utiliza conceptos realistas para cada categoría:
- **Vivienda**: Alquiler, Hipoteca, Mantenimiento, etc.
- **Alimentación**: Supermercado, Verdulería, Carnicería, etc.
- **Transporte**: Gasolina, Transporte público, Taxi, etc.
- **Servicios**: Electricidad, Agua, Gas, Internet, etc.
- **Salud**: Farmacia, Consulta médica, Dentista, etc.
- Y muchos más...

## Qué hacer después de ejecutar el script

1. **Reinicia el servidor de desarrollo** (si está en ejecución)
2. **Navega al dashboard** para ver los nuevos datos
3. **Prueba el asesor financiero** utilizando las preguntas en `set-de-prueba.md`
4. **Explora los reportes y gráficos** para ver cómo se visualizan los datos históricos

## Personalización

Puedes modificar estos parámetros al inicio del script:

```javascript
// Configuración principal
const MESES = 6;                // Número de meses a generar
const INGRESO_BASE = 3000;      // Ingreso mensual base
const USUARIO_EMAIL = null;     // Email específico o null para usar el primer usuario
```

---

¡Disfruta explorando tu aplicación con datos financieros realistas! 