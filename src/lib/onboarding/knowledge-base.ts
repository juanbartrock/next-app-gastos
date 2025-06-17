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
      'Asocia un pago al alquiler con tu gasto recurrente automáticamente'
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

  // ALERTAS E INTELIGENCIA
  {
    id: 'sistema-alertas',
    category: 'alertas',
    title: 'Sistema de Alertas Avanzado',
    description: 'Notificaciones inteligentes automáticas para control financiero',
    details: `El Sistema de Alertas es tu copiloto financiero:
    - 13 tipos diferentes de alertas (presupuestos, gastos inusuales, vencimientos)
    - 4 niveles de prioridad (info, warning, error, critical)
    - Motor automático que evalúa condiciones cada 60 minutos
    - Alertas predictivas basadas en IA
    - Centro de notificaciones en tiempo real
    - Configuración granular por usuario
    - Acciones rápidas: marcar leída, accionar, eliminar
    - Integración con todas las funcionalidades`,
    examples: [
      'Alerta automática: "Has gastado 90% de tu presupuesto de entretenimiento"',
      'Notificación: "Gasto inusual detectado: $25,000 en restaurantes (promedio: $8,000)"',
      'Recordatorio: "El préstamo vence en 3 días - Cuota: $15,000"'
    ],
    relatedFeatures: ['presupuestos', 'ai-analisis', 'prestamos', 'inversiones'],
    tags: ['alertas', 'notificaciones', 'automatico', 'inteligente', 'control']
  },

  {
    id: 'inteligencia-artificial',
    category: 'ai',
    title: 'Inteligencia Artificial Financiera',
    description: 'Asistente financiero inteligente con análisis avanzado',
    details: `La IA de FinanzIA es tu consultor financiero personal:
    - Análisis de patrones de gasto con OpenAI (GPT-3.5-turbo, GPT-4o-mini)
    - Recomendaciones personalizadas de ahorro con impacto económico
    - Detección automática de anomalías y gastos inusuales
    - Alertas predictivas basadas en tendencias históricas
    - Reportes inteligentes ejecutivos automatizados
    - Centro de IA dedicado (/ai-financiero)
    - Análisis multimodal de patrones complejos
    - Consejos contextuales en tiempo real`,
    examples: [
      'IA detecta: "Gastas 40% más en entretenimiento los viernes - Considera presupuesto específico"',
      'Recomendación: "Ahorrando $5,000/mes en cafeterías podrías tener $60,000 extra al año"',
      'Predicción: "Basado en tu patrón, es probable que excedas el presupuesto de transporte este mes"'
    ],
    relatedFeatures: ['alertas', 'analisis-patrones', 'recomendaciones', 'anomalias'],
    tags: ['ia', 'inteligencia', 'artificial', 'analisis', 'recomendaciones', 'openai']
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

  // MODO FAMILIAR
  {
    id: 'modo-familiar',
    category: 'familiar',
    title: 'Modo Familiar Avanzado',
    description: 'Gestión familiar completa con permisos y control',
    details: `El Modo Familiar transforma FinanzIA en una herramienta de gestión doméstica:
    - Toggle personal/familiar para administradores
    - Vista unificada de transacciones familiares
    - Control de permisos granular por miembro
    - Identificación visual de quién hizo cada transacción
    - Totales familiares con porcentajes individuales
    - Presupuestos familiares colaborativos
    - Roles: administrador, miembro limitado, miembro completo
    - Filtros específicos por miembro de la familia`,
    examples: [
      'Administrador ve: "María gastó $15,000 en supermercado (30% del total familiar)"',
      'Toggle rápido: Personal → Familiar con un clic',
      'Filtro: "Ver solo gastos de Juan en categoría Entretenimiento"'
    ],
    relatedFeatures: ['transacciones', 'presupuestos', 'permisos', 'dashboard'],
    tags: ['familiar', 'familia', 'permisos', 'administrador', 'colaborativo']
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