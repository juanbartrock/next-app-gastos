// 🤖 Base de Conocimiento para el Asistente Virtual FinanzIA
// Sistema RAG para responder preguntas sobre funcionalidades

export interface KnowledgeItem {
  id: string
  category: string
  title: string
  description: string
  details: string
  examples?: string[]
  relatedFeatures?: string[]
  tags: string[]
}

export const FINANZAI_KNOWLEDGE_BASE: KnowledgeItem[] = [
  // DASHBOARD Y NAVEGACIÓN
  {
    id: 'dashboard-overview',
    category: 'dashboard',
    title: 'Dashboard Principal',
    description: 'Panel de control centralizado con resumen financiero completo',
    details: `El Dashboard de FinanzIA es tu centro de control financiero. Incluye:
    - Balance total actualizado en tiempo real
    - Cards de ingresos, gastos y balance neto
    - Gráficos interactivos de tendencias
    - Últimos movimientos (expandible de 6 a 20)
    - Widget de cotizaciones del dólar
    - Centro de notificaciones inteligentes
    - Botón de visibilidad para ocultar/mostrar valores monetarios
    - Modo familiar para administradores (toggle personal/familiar)`,
    examples: [
      'Desde el dashboard puedes ver tu balance total del mes',
      'Los valores se actualizan automáticamente al agregar transacciones',
      'Puedes ocultar los montos con el botón del ojo para privacidad'
    ],
    relatedFeatures: ['transacciones', 'alertas', 'visibilidad', 'modo-familiar'],
    tags: ['dashboard', 'resumen', 'balance', 'visibilidad', 'principal']
  },

  // SISTEMA DE PAGOS MERCADOPAGO - ¡NUEVA FUNCIONALIDAD CRÍTICA!
  {
    id: 'sistema-pagos-mercadopago',
    category: 'pagos',
    title: 'Sistema de Pagos MercadoPago',
    description: 'Integración completa con MercadoPago Argentina para suscripciones y pagos',
    details: `Sistema de pagos profesional integrado con MercadoPago:
    - Integración completa con MercadoPago Argentina (Sandbox y Producción)
    - Procesamiento de suscripciones automático
    - Estados de pago: PENDING, APPROVED, REJECTED, CANCELLED
    - Webhook handler automático para actualizaciones en tiempo real
    - URLs de retorno configuradas: éxito, fallo, pendiente
    - Métodos de pago: tarjetas de crédito/débito, efectivo, transferencias, billeteras digitales
    - Configuración opcional - no afecta build si no está configurado
    - Base de datos: PagoSuscripcionMP, WebhookMercadoPago, ConfiguracionMercadoPago
    - APIs: /api/suscripciones/crear-pago, /api/suscripciones/verificar-pago, /api/mercadopago/webhook
    - Páginas de resultado: /suscripcion/exito, /suscripcion/fallo, /suscripcion/pendiente`,
    examples: [
      'Crear suscripción Premium por $5,000/mes con MercadoPago',
      'Pago aprobado automáticamente y webhook actualiza la base de datos',
      'Usuario puede pagar con tarjeta, Mercado Pago, Rapipago o PagoFácil'
    ],
    relatedFeatures: ['suscripciones', 'planes', 'webhooks'],
    tags: ['mercadopago', 'pagos', 'suscripciones', 'argentina', 'webhook', 'premium']
  },

  // TRANSACCIONES
  {
    id: 'transacciones-basico',
    category: 'transacciones',
    title: 'Gestión de Transacciones',
    description: 'Sistema completo para registrar ingresos y gastos con categorización inteligente',
    details: `Las transacciones son el corazón de FinanzIA:
    - Registro de ingresos y gastos con fecha de imputación contable
    - Categorización automática e inteligente
    - 4 tipos de movimiento: efectivo, digital, ahorro, tarjeta
    - Asociación automática con gastos recurrentes
    - Filtros avanzados por fecha, categoría, monto
    - Exportación de datos
    - Búsqueda instantánea
    - Edición completa con historial de cambios`,
    examples: [
      'Registra un gasto: "Supermercado - $15,000 - Efectivo - Categoría: Alimentación"',
      'Crea un ingreso: "Sueldo - $180,000 - Transferencia - Categoría: Salario"',
      'Asocia un pago del alquiler con tu gasto recurrente automáticamente'
    ],
    relatedFeatures: ['categorias', 'gastos-recurrentes', 'presupuestos', 'modo-familiar'],
    tags: ['transacciones', 'gastos', 'ingresos', 'categorias', 'registrar']
  },

  {
    id: 'gastos-recurrentes',
    category: 'transacciones',
    title: 'Gastos Recurrentes',
    description: 'Sistema avanzado para gestionar gastos que se repiten mensualmente',
    details: `Los Gastos Recurrentes revolucionan tu gestión financiera:
    - Creación de gastos que se repiten (alquiler, servicios, seguros)
    - Estados automáticos: pendiente (0%), pago parcial (1-99%), pagado (100%+)
    - Asociación bidireccional con transacciones
    - Generación automática de pagos
    - Cálculo en tiempo real de saldos pendientes
    - Información visual del impacto de cada pago
    - Selector inteligente en formularios de transacciones
    - Alertas automáticas de vencimientos`,
    examples: [
      'Crea "Alquiler - $50,000 - Mensual" y ve el progreso de pagos',
      'Al pagar $20,000 del alquiler, el sistema muestra "40% pagado, faltan $30,000"',
      'Asocia cualquier transacción a un gasto recurrente existente'
    ],
    relatedFeatures: ['transacciones', 'alertas', 'categorias'],
    tags: ['recurrentes', 'alquiler', 'servicios', 'mensual', 'automatico']
  },

  // SISTEMA DE ALERTAS COMPLETO - ¡ACTUALIZACIÓN CRÍTICA!
  {
    id: 'sistema-alertas-avanzado',
    category: 'alertas',
    title: 'Sistema de Alertas Avanzado (3 Fases Completas)',
    description: 'Sistema completo de notificaciones inteligentes automáticas con motor de evaluación',
    details: `El Sistema de Alertas más avanzado de FinanzIA (100% completado):
    
    **FASE 1 - Centro de Alertas:**
    - 13 tipos diferentes de alertas: presupuestos, gastos inusuales, vencimientos, préstamos, inversiones, tareas, promociones
    - 4 niveles de prioridad: info (azul), warning (amarillo), error (naranja), critical (rojo)
    - Centro de notificaciones en tiempo real en el header
    - Página dedicada /alertas con tabs: Activas, Historial, Configuración
    - Acciones completas: marcar leída, accionar, eliminar
    - Configuración granular por usuario y tipo de alerta
    
    **FASE 2 - Motor Automático:**
    - AlertEngine para evaluación automática de 8 tipos de condiciones
    - AlertScheduler con patrón Singleton para programación cada 60 minutos
    - Evaluación automática de presupuestos (80%, 90%, 100% usado)
    - Detección de gastos inusuales/anómalos basados en patrones
    - Panel de administración /admin/alertas para control total
    - APIs: /api/alertas/evaluate, /api/alertas/scheduler (start/stop/runOnce)
    - Limpieza automática de alertas expiradas
    
    **FASE 3 - Inteligencia Artificial:**
    - Alertas predictivas basadas en análisis de tendencias con OpenAI
    - Detección inteligente de anomalías usando machine learning
    - Recomendaciones contextuales automáticas
    - Integración con AIAnalyzer para análisis avanzado
    - Prompts especializados en finanzas argentinas`,
    examples: [
      'Alerta automática: "Has gastado 90% de tu presupuesto de entretenimiento"',
      'Anomalía detectada: "Gasto inusual: $25,000 en restaurantes (promedio: $8,000)"',
      'Predictiva: "Basado en tu patrón, podrías exceder el presupuesto este mes"',
      'Recordatorio: "El préstamo vence en 3 días - Cuota: $15,000"'
    ],
    relatedFeatures: ['presupuestos', 'ai-analisis', 'prestamos', 'inversiones', 'motor-automatico'],
    tags: ['alertas', 'notificaciones', 'automatico', 'inteligente', 'motor', 'ia', 'prediccion']
  },

  // INTELIGENCIA ARTIFICIAL COMPLETA - ¡ACTUALIZACIÓN CRÍTICA!
  {
    id: 'inteligencia-artificial-completa',
    category: 'ai',
    title: 'Inteligencia Artificial Financiera Completa',
    description: 'Asistente financiero inteligente con análisis avanzado usando GPT-3.5-turbo y GPT-4o-mini',
    details: `La IA de FinanzIA es tu consultor financiero personal (100% implementado):
    
    **5 MOTORES DE IA FUNCIONANDO:**
    1. **Análisis de Patrones** (/api/ai/analizar-patrones):
       - Detección de tendencias de gasto mensual
       - Identificación de categorías problemáticas
       - Análisis de comportamiento financiero con OpenAI
    
    2. **Recomendaciones Personalizadas** (/api/ai/recomendaciones):
       - Consejos de ahorro con impacto económico específico
       - Sugerencias de optimización de presupuestos
       - Recomendaciones de inversión contextuales
    
    3. **Detección de Anomalías** (/api/ai/detectar-anomalias):
       - Gastos inusuales automáticos usando algoritmos estadísticos
       - Patrones anómalos en frecuencia y montos
       - Alertas de fraude potencial
    
    4. **Alertas Predictivas** (/api/ai/alertas-predictivas):
       - Predicciones basadas en tendencias históricas
       - Alertas tempranas de exceso de presupuesto
       - Proyecciones de flujo de efectivo
    
    5. **Reportes Inteligentes** (/api/ai/reporte-inteligente):
       - Reportes ejecutivos automatizados mensuales
       - Análisis comparativo período vs período
       - Insights accionables con recomendaciones específicas
    
    **Centro de IA:** /ai-financiero con componentes especializados
    **Configuración:** Timeouts optimizados para Neon PostgreSQL
    **Prompts:** Especializados para finanzas argentinas en español`,
    examples: [
      'IA detecta: "Gastas 40% más en entretenimiento los viernes - Considera presupuesto específico"',
      'Recomendación: "Ahorrando $5,000/mes en cafeterías tendrías $60,000 extra al año"',
      'Anomalía: "Gasto $50,000 en una categoría que promedia $12,000 - ¿Es correcto?"',
      'Predicción: "Según tu patrón, excederás el presupuesto de transporte en $8,000"',
      'Reporte: "Enero vs Diciembre: -15% gastos, +25% ahorro, categoria más optimizada: Entretenimiento"'
    ],
    relatedFeatures: ['alertas', 'analisis-patrones', 'recomendaciones', 'anomalias', 'reportes'],
    tags: ['ia', 'inteligencia', 'artificial', 'analisis', 'recomendaciones', 'openai', 'gpt', 'prediccion', 'anomalias']
  },

  // SISTEMA DE TAREAS - ¡FUNCIONALIDAD FALTANTE CRÍTICA!
  {
    id: 'sistema-tareas-completo',
    category: 'tareas',
    title: 'Sistema de Tareas Personales y Financieras',
    description: 'Gestión completa de tareas relacionadas con finanzas personales',
    details: `Sistema de tareas integrado con finanzas:
    - Creación de tareas personales y financieras
    - Estados: pendiente, en_progreso, completada, cancelada
    - Tipos especializados: tarea_financiera, tarea_personal, recordatorio, meta
    - Prioridades: baja, media, alta, urgente
    - Fechas de vencimiento con alertas automáticas
    - Integración con alertas del sistema
    - Asociación opcional con transacciones, préstamos, inversiones
    - Seguimiento de progreso y métricas
    - API completa: /api/tareas con CRUD completo
    - Página dedicada: /tareas con filtros avanzados`,
    examples: [
      'Tarea: "Renovar seguro del auto - Vence 15/03 - Alta prioridad"',
      'Meta: "Ahorrar $100,000 para vacaciones - Progreso: 35%"',
      'Recordatorio: "Pagar tarjeta de crédito - Todos los 10 del mes"',
      'Financiera: "Revisar rendimiento de inversiones - Mensual"'
    ],
    relatedFeatures: ['alertas', 'transacciones', 'prestamos', 'inversiones'],
    tags: ['tareas', 'recordatorios', 'metas', 'financiero', 'personal', 'vencimientos']
  },

  // SISTEMA DE SCRAPING - ¡FUNCIONALIDAD FALTANTE!
  {
    id: 'sistema-scraping-promociones',
    category: 'scraping',
    title: 'Sistema de Scraping para Promociones',
    description: 'Búsqueda automática de promociones y descuentos en servicios argentinos',
    details: `Sistema avanzado de scraping para promociones:
    - Scrapers configurados para servicios argentinos populares
    - Sitios monitoreados: Claro, Movistar, Personal, Netflix, Spotify, MercadoLibre
    - Detección automática de ofertas y descuentos
    - Alertas de promociones relevantes basadas en tus gastos
    - Comparación de precios automática
    - Histórico de promociones perdidas vs aprovechadas
    - Integración con Puppeteer para sitios complejos
    - Respeto por robots.txt y rate limiting
    - Notificaciones push cuando hay ofertas relevantes
    - Panel administrativo para gestionar scrapers`,
    examples: [
      'Alerta: "Claro tiene 50% OFF en tu plan actual - Ahorro: $2,500/mes"',
      'Promoción detectada: "Netflix Premium 3 meses gratis - Ahorro: $3,597"',
      'Comparación: "Tu plan de Movistar cuesta $3,000, Personal ofrece similar por $2,200"'
    ],
    relatedFeatures: ['alertas', 'notificaciones', 'comparaciones'],
    tags: ['scraping', 'promociones', 'descuentos', 'servicios', 'argentina', 'automatico']
  },

  // MODO FAMILIAR AVANZADO - ¡ACTUALIZACIÓN CRÍTICA!
  {
    id: 'modo-familiar-avanzado',
    category: 'familiar',
    title: 'Modo Familiar Avanzado con Permisos',
    description: 'Sistema completo de gestión familiar con control granular de permisos',
    details: `El Modo Familiar más avanzado:
    
    **PERMISOS Y ROLES:**
    - Administrador familiar: acceso completo, toggle personal/familiar
    - Miembro completo: gestión propia + visualización familiar limitada
    - Miembro básico: solo gestión personal
    - Control granular por funcionalidad
    
    **FUNCIONALIDADES:**
    - Toggle instantáneo personal ↔ familiar para administradores
    - Vista unificada de transacciones familiares con identificación por usuario
    - Presupuestos familiares colaborativos con límites por miembro
    - Totales familiares con porcentajes individuales de contribución
    - Filtros específicos por miembro familiar
    - Alertas familiares para límites de presupuesto
    - Reportes familiares vs individuales
    - Dashboard familiar con métricas consolidadas
    
    **APIS ESPECÍFICAS:**
    - /api/gastos/familiares - Transacciones de toda la familia
    - /api/permisos/familiares - Gestión de permisos
    - Contexto PermisosFamiliaresContext para control de UI`,
    examples: [
      'Admin ve: "María gastó $15,000 en supermercado (30% del total familiar)"',
      'Toggle: "Personal (solo mis gastos) → Familiar (todos los gastos)"',
      'Filtro: "Ver solo gastos de Juan en categoría Entretenimiento"',
      'Alerta familiar: "La familia excedió 90% del presupuesto de alimentación"'
    ],
    relatedFeatures: ['transacciones', 'presupuestos', 'permisos', 'dashboard', 'alertas'],
    tags: ['familiar', 'familia', 'permisos', 'administrador', 'colaborativo', 'toggle', 'roles']
  },

  // PRESUPUESTOS
  {
    id: 'presupuestos-inteligentes',
    category: 'presupuestos',
    title: 'Presupuestos Inteligentes',
    description: 'Control automático de gastos con alertas predictivas',
    details: `Los Presupuestos de FinanzIA son inteligentes y automáticos:
    - Creación por categoría o global
    - Alertas automáticas al 80%, 90% y 100% del límite
    - Seguimiento en tiempo real del gasto vs presupuesto
    - Análisis de tendencias y proyecciones
    - Recomendaciones de ajuste automáticas
    - Presupuestos familiares para grupos
    - Histórico de cumplimiento mensual
    - Integración con IA para optimización`,
    examples: [
      'Presupuesto "Alimentación: $40,000/mes" con alertas automáticas',
      'Al gastar $32,000 recibes alerta: "Has usado 80% de tu presupuesto de alimentación"',
      'El sistema sugiere ajustes basados en patrones históricos'
    ],
    relatedFeatures: ['alertas', 'categorias', 'ai-analisis', 'modo-familiar'],
    tags: ['presupuestos', 'limites', 'alertas', 'control', 'automatico']
  },

  // FUNCIONALIDADES AVANZADAS
  {
    id: 'prestamos-avanzados',
    category: 'prestamos',
    title: 'Gestión de Préstamos',
    description: 'Control completo de préstamos con amortización francesa',
    details: `Gestión profesional de préstamos:
    - Cálculo automático con amortización francesa
    - Registro automático de cuotas como gastos
    - Estados: activo, pagado, vencido
    - Alertas automáticas de cuotas próximas
    - Simulador de pagos adelantados
    - Cronograma de pagos detallado
    - Análisis de intereses vs capital
    - Proyecciones de finalización`,
    examples: [
      'Préstamo de $500,000 a 24 cuotas con TNA 45%',
      'Alerta automática: "Cuota del préstamo vence en 3 días"',
      'Simulación: "Pagando $10,000 extra, terminas 3 meses antes"'
    ],
    relatedFeatures: ['alertas', 'transacciones', 'calculadora'],
    tags: ['prestamos', 'cuotas', 'interes', 'amortizacion', 'alertas']
  },

  {
    id: 'inversiones-tracking',
    category: 'inversiones',
    title: 'Seguimiento de Inversiones',
    description: 'Control de rendimientos y portfolio de inversiones',
    details: `Gestión profesional de inversiones:
    - Registro de depósitos, retiros y dividendos
    - Cálculo automático de rendimientos
    - Cotizaciones históricas y actuales
    - Múltiples tipos de inversión (FCI, acciones, bonos, cripto)
    - Alertas de vencimientos y oportunidades
    - Análisis de performance vs benchmarks
    - Diversificación del portfolio
    - Reportes de ganancia/pérdida`,
    examples: [
      'Inversión en FCI: $100,000 inicial, rendimiento actual 15% anual',
      'Alerta: "Tu plazo fijo vence en 5 días - Renovar o retirar?"',
      'Análisis: "Tu portfolio tiene 70% en renta fija, considera diversificar"'
    ],
    relatedFeatures: ['alertas', 'transacciones', 'analisis'],
    tags: ['inversiones', 'rendimientos', 'portfolio', 'dividendos', 'cotizaciones']
  },

  // HERRAMIENTAS COMPLEMENTARIAS
  {
    id: 'categorias-inteligentes',
    category: 'categorias',
    title: 'Categorización Inteligente',
    description: 'Sistema de categorías personalizables y sugerencias automáticas',
    details: `Categorización que aprende de tus hábitos:
    - Categorías predefinidas del sistema + personalizadas
    - Sugerencias automáticas basadas en el concepto
    - Categorías privadas por usuario
    - Iconos y colores personalizables
    - Análisis por categoría con gráficos
    - Migración masiva entre categorías
    - Subcategorías para mayor detalle
    - Importación/exportación de esquemas`,
    examples: [
      'Al escribir "Starbucks" sugiere automáticamente "Cafeterías"',
      'Categoría personal: "Inversión en cripto" con ícono personalizado',
      'Análisis: "Gastas 25% en Alimentación, 20% en Transporte"'
    ],
    relatedFeatures: ['transacciones', 'analisis', 'ai-sugerencias'],
    tags: ['categorias', 'clasificacion', 'analisis', 'personalizable', 'automatico']
  },

  {
    id: 'exportacion-reportes',
    category: 'reportes',
    title: 'Exportación y Reportes',
    description: 'Generación de reportes profesionales y exportación de datos',
    details: `Reportes y exportación de nivel profesional:
    - Exportación a Excel/CSV con filtros aplicados
    - Reportes automáticos mensuales por email
    - Gráficos interactivos personalizables
    - Comparativas período vs período
    - Reportes por categoría, miembro familiar, tipo
    - Análisis de tendencias con proyecciones
    - Formato PDF profesional para contadores
    - API para integraciones externas`,
    examples: [
      'Reporte mensual automático: "Resumen financiero de Enero 2025"',
      'Exportación: "Todos los gastos de entretenimiento del último trimestre"',
      'Análisis: "Comparación Enero 2024 vs Enero 2025: +15% ahorro"'
    ],
    relatedFeatures: ['transacciones', 'analisis', 'ai-reportes'],
    tags: ['reportes', 'exportacion', 'excel', 'pdf', 'analisis', 'automatico']
  },

  // CONFIGURACIÓN Y PERSONALIZACIÓN
  {
    id: 'personalizacion-avanzada',
    category: 'configuracion',
    title: 'Personalización Avanzada',
    description: 'Configuración completa de la aplicación según preferencias',
    details: `FinanzIA se adapta completamente a ti:
    - Tema oscuro/claro automático según preferencias
    - Ocultación de valores monetarios con un clic
    - Configuración de alertas granular por tipo
    - Personalización del dashboard (widgets, orden)
    - Formato de moneda y fechas localizado (Argentina)
    - Backup automático y manual de datos
    - Configuración de notificaciones (email, SMS, WhatsApp)
    - Integración con servicios externos`,
    examples: [
      'Tema oscuro automático desde las 20:00',
      'Alertas solo para gastos >$10,000 en categoría "Entretenimiento"',
      'Dashboard personalizado: gráficos arriba, transacciones abajo'
    ],
    relatedFeatures: ['tema', 'visibilidad', 'alertas', 'dashboard'],
    tags: ['configuracion', 'personalizacion', 'tema', 'alertas', 'dashboard']
  },

  // BUZON DE COMPROBANTES - ¡NUEVA FUNCIONALIDAD CRÍTICA!
  {
    id: 'buzon-comprobantes-ocr',
    category: 'ocr',
    title: 'Buzón de Comprobantes con OCR',
    description: 'Sistema inteligente para procesar comprobantes automáticamente',
    details: `Buzón inteligente para digitalizar comprobantes:
    - Carga de comprobantes por foto o PDF
    - OCR avanzado para extraer datos automáticamente
    - Detección de: fecha, monto, comercio, concepto, método de pago
    - Creación automática de transacciones desde comprobantes
    - Validación manual antes de confirmar
    - Histórico de comprobantes procesados
    - Integración con categorización inteligente
    - Formatos soportados: JPG, PNG, PDF
    - APIs: /api/ocr/* y /api/buzon/*
    - Página dedicada: /buzon con demo y debug`,
    examples: [
      'Foto de ticket de supermercado → Transacción automática: "Supermercado Norte $15,420"',
      'PDF de factura de luz → "EDENOR $8,500 - Servicios"',
      'Comprobante de combustible → "Shell $12,300 - Transporte"'
    ],
    relatedFeatures: ['transacciones', 'categorias', 'ocr'],
    tags: ['ocr', 'comprobantes', 'automatico', 'foto', 'pdf', 'buzon', 'inteligente']
  },

  // PLANES Y SUSCRIPCIONES - ¡FUNCIONALIDAD COMERCIAL CRÍTICA!
  {
    id: 'planes-suscripciones',
    category: 'comercial',
    title: 'Planes de Suscripción',
    description: 'Sistema comercial completo con planes Free, Premium y Enterprise',
    details: `Sistema comercial robusto:
    
    **PLANES DISPONIBLES:**
    - **Free**: Funcionalidades básicas, límites de transacciones
    - **Premium**: Acceso completo a IA, alertas avanzadas, exportación
    - **Enterprise**: Modo familiar, usuarios ilimitados, soporte prioritario
    
    **GESTIÓN DE LÍMITES:**
    - Límites automáticos por plan (transacciones/mes, alertas, etc.)
    - Validación en tiempo real antes de operaciones
    - Avisos de límite próximo a alcanzar
    - Upgrade automático sugerido cuando corresponde
    
    **ADMINISTRACIÓN:**
    - Panel admin para gestionar planes y límites
    - Métricas de uso por usuario
    - Configuración flexible de funcionalidades por plan
    - APIs: /api/planes, /api/admin/planes
    - Hook personalizado: usePlanLimits()`,
    examples: [
      'Usuario Free: "Has usado 90/100 transacciones este mes - Considera upgrade"',
      'Límite IA: "Plan Free permite 10 consultas IA/mes - Quedan 3"',
      'Funcionalidad bloqueada: "Modo familiar requiere plan Enterprise"'
    ],
    relatedFeatures: ['pagos', 'mercadopago', 'limites'],
    tags: ['planes', 'suscripcion', 'free', 'premium', 'enterprise', 'limites', 'comercial']
  },

  // FEEDBACK Y BETA - ¡FUNCIONALIDAD DE MEJORA CONTINUA!
  {
    id: 'sistema-feedback-beta',
    category: 'feedback',
    title: 'Sistema de Feedback y Beta Testing',
    description: 'Recolección de feedback y gestión de funcionalidades beta',
    details: `Sistema para mejora continua:
    - Formulario de feedback integrado con rating y comentarios
    - Categorización de feedback: bug, feature, improvement, compliment
    - Priorización automática basada en frecuencia de solicitudes
    - Panel de administración para gestionar feedback
    - Historial completo de feedback por usuario
    - Sistema de beta testing para nuevas funcionalidades
    - Notificaciones a usuarios cuando se implementan sugerencias
    - Métricas de satisfacción y NPS
    - APIs: /api/feedback con gestión completa`,
    examples: [
      'Feedback: "★★★★★ - Me encanta la IA, pero falta calculadora de inversiones"',
      'Beta feature: "Probá la nueva función de análisis predictivo"',
      'Notificación: "Tu sugerencia sobre alertas por WhatsApp fue implementada"'
    ],
    relatedFeatures: ['beta', 'mejoras', 'usuarios'],
    tags: ['feedback', 'beta', 'testing', 'mejoras', 'usuarios', 'satisfaccion']
  }
]

// Función para buscar en la base de conocimiento
export function searchKnowledge(query: string): KnowledgeItem[] {
  const searchTerms = query.toLowerCase().split(' ')
  
  return FINANZAI_KNOWLEDGE_BASE
    .map(item => {
      let score = 0
      
      // Buscar en título (peso: 3)
      searchTerms.forEach(term => {
        if (item.title.toLowerCase().includes(term)) score += 3
      })
      
      // Buscar en descripción (peso: 2)
      searchTerms.forEach(term => {
        if (item.description.toLowerCase().includes(term)) score += 2
      })
      
      // Buscar en tags (peso: 2)
      searchTerms.forEach(term => {
        if (item.tags.some(tag => tag.includes(term))) score += 2
      })
      
      // Buscar en detalles (peso: 1)
      searchTerms.forEach(term => {
        if (item.details.toLowerCase().includes(term)) score += 1
      })
      
      // Buscar en ejemplos (peso: 1)
      searchTerms.forEach(term => {
        if (item.examples?.some(example => example.toLowerCase().includes(term))) score += 1
      })
      
      return { ...item, score }
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5) // Top 5 resultados
}

// Función para obtener información por categoría
export function getKnowledgeByCategory(category: string): KnowledgeItem[] {
  return FINANZAI_KNOWLEDGE_BASE.filter(item => item.category === category)
}

// Función para obtener funcionalidades relacionadas
export function getRelatedFeatures(featureId: string): KnowledgeItem[] {
  const feature = FINANZAI_KNOWLEDGE_BASE.find(item => item.id === featureId)
  if (!feature?.relatedFeatures) return []
  
  return FINANZAI_KNOWLEDGE_BASE.filter(item => 
    feature.relatedFeatures!.includes(item.id)
  )
}

// Categorías disponibles
export const KNOWLEDGE_CATEGORIES = [
  'dashboard',
  'transacciones', 
  'presupuestos',
  'alertas',
  'ai',
  'prestamos',
  'inversiones',
  'familiar',
  'categorias',
  'reportes',
  'configuracion'
] as const 