# Guía para Probar el Asesor Financiero Personalizado

Este documento explica cómo poblar tu base de datos con datos financieros de prueba y cómo utilizar estos datos para evaluar el asesor financiero personalizado.

## 1. Preparación de Datos de Prueba

Hemos creado un script que generará automáticamente datos financieros realistas para los primeros meses de 2024, siguiendo una distribución de gastos razonable en diferentes categorías.

### Datos que se generarán:

- **Transacciones** para enero, febrero y marzo de 2024
- **Gastos recurrentes** con diferentes periodicidades (80% mensuales, 15% bimestrales, 5% semestrales)
- **Presupuestos** mensuales hasta junio de 2024
- **Financiación** para una compra grande en marzo

### Para ejecutar el script:

```bash
# Desde la raíz del proyecto
node scripts/run-populate.js
```

> **IMPORTANTE**: El script limpiará los datos existentes de 2024 para los meses mencionados antes de crear los nuevos datos de prueba.

## 2. Evaluación del Asesor Financiero

Una vez que hayas poblado la base de datos con los datos de prueba, puedes evaluar el asesor financiero utilizando un conjunto de preguntas predefinidas.

### Pasos para probar:

1. **Iniciar la aplicación** (si no está en ejecución):
   ```bash
   npm run dev
   ```

2. **Abrir el asesor financiero** en tu aplicación
   - Navega a http://localhost:3000/dashboard
   - Busca el botón flotante del asesor en la esquina inferior derecha

3. **Realizar preguntas de prueba**
   - Utiliza las preguntas del archivo `set-de-prueba.md`
   - Copia y pega cada pregunta en el chat del asesor

4. **Evaluar las respuestas**
   - Observa si las respuestas son personalizadas (tendrán una marca verde)
   - Verifica si mencionan datos específicos de tu perfil financiero
   - Comprueba si los consejos están adaptados a tu situación particular

## 3. Set de Preguntas de Prueba

Hemos preparado un conjunto de 20 preguntas organizadas en categorías para evaluar diferentes aspectos del asesor. Estas preguntas están disponibles en el archivo `set-de-prueba.md`.

Las categorías incluyen:
- Preguntas básicas sobre datos financieros
- Preguntas sobre tendencias y análisis
- Preguntas sobre recomendaciones personalizadas
- Preguntas específicas para verificar la personalización

## 4. Estructura de los Datos de Prueba

### Ingresos
- Salario mensual de $3,000

### Distribución de gastos
- Vivienda: 25%
- Alimentación: 20%
- Transporte: 10%
- Servicios: 8%
- Ocio (Entretenimiento, Restaurantes, Viajes): 18%
- Otros: 19%

### Variaciones mensuales
- Enero: Nivel base de gastos
- Febrero: Reducción del 10% en gastos
- Marzo: Aumento del 10% en gastos + compra grande financiada

## 5. Interpretación de Resultados

Después de realizar las pruebas, evalúa:

1. **Precisión**: ¿El asesor refleja correctamente tus datos financieros?
2. **Personalización**: ¿Las recomendaciones están adaptadas a tu perfil?
3. **Utilidad**: ¿Los consejos son prácticos y aplicables?
4. **Comprensión**: ¿El asesor entiende correctamente tus preguntas?

Si encuentras áreas de mejora, puedes ajustar el prompt del sistema en `src/app/api/financial-advisor/route.ts` para mejorar la calidad de las respuestas.

---

¡Esperamos que disfrutes probando el asesor financiero personalizado! 