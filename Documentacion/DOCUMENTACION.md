# 📋 Documentación Técnica: Sistema de Gestión de Gastos

## 🎯 Descripción General
Sistema integral de gestión financiera personal y grupal desarrollado con tecnologías modernas y **Inteligencia Artificial integrada**. Permite el control completo de finanzas personales incluyendo transacciones, inversiones, préstamos, presupuestos, **alertas inteligentes automáticas** y **análisis financiero con IA**.

**✅ Características destacadas**:
- **3 FASES IMPLEMENTADAS**: Sistema de Alertas + Motor Automático + Inteligencia Artificial
- Datos reales únicamente (sin simulaciones)
- Arquitectura escalable y moderna con OpenAI
- Integración con APIs externas y scraping automatizado
- Análisis financiero inteligente y predictivo
- Multi-dispositivo y responsive con tema oscuro

## 🛠️ Stack Tecnológico

### Backend
- **Next.js 15** - Framework React con App Router y Server Components optimizado
- **TypeScript** - Tipado estático completo para mayor robustez y mantenibilidad
- **Prisma 6.8** - ORM moderno con type safety para PostgreSQL (30+ modelos)
- **NextAuth.js 4.24** - Autenticación segura y flexible con JWT
- **PostgreSQL/Neon** - Base de datos relacional serverless en la nube
- **Zod** - Validación de esquemas y tipos en APIs
- **OpenAI API** - Inteligencia artificial para análisis financiero avanzado

### Frontend
- **React 18** - Biblioteca de interfaces con Concurrent Features y Server Components
- **TailwindCSS 4** - Framework CSS utilitario de última generación
- **Shadcn/ui** - Sistema de componentes accesibles y modernos
- **Recharts 2.15** - Visualización de datos interactiva y responsive
- **React Hook Form** - Gestión eficiente de formularios complejos
- **Lucide React** - Iconografía consistente y optimizada

### Integraciones y APIs
- **OpenAI API** - GPT-3.5-turbo y GPT-4o-mini para análisis inteligente
- **Asistente financiero inteligente** con prompts especializados en español
- **Twilio** - Notificaciones SMS y WhatsApp (preparado)
- **Puppeteer** - Web scraping automatizado para promociones
- **Cheerio** - Parsing y manipulación de HTML
- **Axios** - Cliente HTTP para APIs externas

## 📁 Arquitectura del Proyecto

### 🏗️ Estructura de Directorios
```
next-app-gastos/
├── src/
│   ├── app/                    # App Router de Next.js 15
│   │   ├── api/               # API Routes (Server-side)
│   │   │   ├── ai/            # ✅ APIs de Inteligencia Artificial (FASE 3)
│   │   │   ├── alertas/       # ✅ Sistema de alertas completo (FASE 1+2)
│   │   │   ├── gastos/        # Gestión de transacciones
│   │   │   ├── prestamos/     # Gestión de préstamos
│   │   │   ├── inversiones/   # Portfolio de inversiones
│   │   │   ├── tareas/        # Sistema de tareas
│   │   │   └── ...           # Otras APIs
│   │   ├── dashboard/         # Dashboard principal con widgets inteligentes
│   │   ├── ai-financiero/     # ✅ Centro de IA (FASE 3)
│   │   ├── alertas/           # ✅ Gestión de alertas (FASE 1)
│   │   ├── test-fase2/        # ✅ Pruebas motor automático (FASE 2)
│   │   ├── test-fase3/        # ✅ Pruebas inteligencia artificial (FASE 3)
│   │   ├── transacciones/     # Gestión de transacciones
│   │   ├── grupos/            # Gastos grupales
│   │   ├── prestamos/         # Gestión de préstamos
│   │   ├── inversiones/       # Portfolio de inversiones
│   │   ├── tareas/            # Sistema de tareas
│   │   ├── admin/             # Panel de administración
│   │   └── ...               # Otras rutas
│   ├── components/            # Componentes reutilizables
│   │   ├── ui/               # Componentes UI de Shadcn
│   │   ├── alertas/          # ✅ Componentes de alertas (FASE 1)
│   │   └── ai/               # ✅ Componentes de IA (FASE 3)
│   ├── lib/                  # Utilidades y configuraciones
│   │   ├── alert-engine/     # ✅ Motor de alertas automático (FASE 2)
│   │   └── ai/               # ✅ Motor de inteligencia artificial (FASE 3)
│   ├── contexts/             # Contextos de React
│   ├── providers/            # Proveedores de la aplicación
│   └── scraping/             # Sistema de web scraping
├── prisma/                   # Configuración de base de datos
│   ├── schema.prisma         # Esquema con 30+ modelos
│   └── migrations/           # Migraciones de BD
├── public/                   # Archivos estáticos
├── scripts/                  # Scripts de utilidades
└── docs/                     # Documentación del proyecto
```

### 🎯 Patrones de Arquitectura
- **App Router**: Utilización completa del nuevo sistema de rutas de Next.js 15
- **Server Components**: Renderizado del lado del servidor por defecto
- **Client Components**: Solo cuando se requiere interactividad
- **API Routes**: Endpoints RESTful con validación de tipos y OpenAI
- **Middleware**: Protección de rutas y autenticación
- **Contexts**: Gestión de estado global (Currency, Sidebar, Visibility, Theme)
- **Custom Hooks**: Lógica reutilizable encapsulada
- **AI Integration**: Motor de IA personalizado con OpenAI

### Rutas Principales
- `/`: Página principal (dashboard con widgets inteligentes)
- `/login`: Autenticación de usuarios
- `/register`: Registro de nuevos usuarios
- `/dashboard`: Panel principal con resumen financiero y alertas
- `/ai-financiero`: **✅ Centro de Inteligencia Artificial (FASE 3)**
- `/alertas`: **✅ Centro de alertas con gestión completa (FASE 1)**
- `/test-fase2`: **✅ Pruebas del motor automático de alertas (FASE 2)**
- `/test-fase3`: **✅ Pruebas de inteligencia artificial (FASE 3)**
- `/transacciones`: Gestión de transacciones
- `/grupos`: Gestión de grupos de gastos compartidos
- `/recurrentes`: Gestión de gastos recurrentes
- `/financiacion`: Gestión de financiaciones con tarjeta
- `/inversiones`: Gestión de inversiones y seguimiento de rendimientos
- `/prestamos`: Gestión de préstamos y créditos bancarios
- `/tareas`: **✅ Gestión de tareas personales y financieras**
  - `/tareas/nueva`: Formulario para crear nuevas tareas
- `/voz`: Reconocimiento de voz para registro de gastos
- `/presupuestos`: Gestión de presupuestos mensuales
- `/perfil`: Gestión del perfil de usuario y planes
- `/configuracion`: Configuración de la aplicación
- `/recomendaciones-ahorro`: Sugerencias para ahorrar dinero
- `/informes`: ❌ **TEMPORALMENTE DESACTIVADO** - Módulo de informes completo
  - **Motivo**: Problemas de rendimiento y diseño excesivamente ambicioso
  - **Ver**: `INFORMES_DESACTIVADOS_ENERO_2025.md` para detalles completos
  - **Alternativas**: Dashboard principal, transacciones, recurrentes, préstamos
- `/financial-advisor`: Asistente financiero inteligente
- `/admin`: Panel de administración
  - `/admin/categorias`: Gestión de categorías
  - `/admin/scraping`: Gestión de scrapers
  - `/admin/planes`: Gestión de planes y funcionalidades
  - `/admin/scripts-prueba`: Ejecución de scripts de datos de prueba
  - `/admin/alertas`: **✅ Control del motor de alertas automático (FASE 2)**
- `/home`: Página de inicio para usuarios no autenticados
- `/welcome`: Página de bienvenida para nuevos usuarios

## Modelos de Datos

### **✅ NUEVOS MODELOS - SISTEMA DE ALERTAS (FASE 1)**

### Alerta
Almacena todas las alertas del sistema (manuales y automáticas).
- ID único, userId, tipo de alerta, prioridad
- Título, mensaje, estado (leída, accionada)
- Fechas de creación y expiración
- Metadatos JSON para información adicional
- Relaciones opcionales con entidades (préstamos, inversiones, etc.)

### ConfiguracionAlerta
Configuración personalizable de alertas por usuario.
- Tipos de alerta habilitados/deshabilitados
- Canales de notificación (in-app, email, SMS, WhatsApp)
- Frecuencia de notificaciones
- Configuración granular por tipo de alerta

### Usuario (User) - **ACTUALIZADO**
Almacena información de usuarios, incluyendo autenticación y perfiles.
- ID, nombre, email, contraseña, etc.
- **NUEVAS relaciones**:
  - Relación con alertas personales
  - Relación con configuraciones de alertas
  - Relación con gastos recurrentes, financiaciones y presupuestos
  - Relación con servicios contratados e inversiones
  - Relación con tipos de inversión personalizados
  - Relación con plan de suscripción
  - **Relación con tareas personales y financieras**

### Gasto (Gasto)
Registra las transacciones financieras.
- Concepto, monto, fecha, categoría
- Tipo de transacción: ingreso o gasto
- Tipo de movimiento: efectivo, digital, ahorro, tarjeta
- Asociación con usuario y/o grupo
- Relación con financiación (para gastos con tarjeta)
- **Campo**: `incluirEnFamilia` para control de visibilidad familiar
- Detalles del gasto (para tickets con múltiples ítems)

### Detalle de Gasto (GastoDetalle)
Almacena detalles individuales de un gasto (como productos en un ticket).
- Descripción del producto/servicio
- Cantidad y precio unitario
- Subtotal
- Relación con el gasto principal

### Grupo (Grupo)
Para gestión de gastos compartidos.
- Nombre, descripción
- Administrador y miembros
- Gastos asociados al grupo

### Categoría (Categoria)
Clasificación para los gastos.
- Descripción, estado
- Grupo de categoría (hogar, transporte, etc.)
- Relación con gastos y gastos recurrentes

### Gasto Recurrente (GastoRecurrente) - **ACTUALIZADO**
Para gestión de gastos que se repiten periódicamente.
- Concepto, monto, periodicidad
- Estado (pagado, pendiente, parcial, n/a)
- Fechas de próximo pago y último pago
- **NUEVA relación**: Con alertas automáticas
- **NUEVA relación**: Con tareas de seguimiento
- Relación con categoría y usuario

### Financiación (Financiacion)
Para gestión de gastos financiados con tarjeta de crédito.
- Relación con el gasto asociado
- Cantidad total de cuotas y cuotas pagadas
- Monto de cada cuota
- Fechas de pago y día de pago mensual
- Relación con usuario

### Presupuesto (Presupuesto) - **ACTUALIZADO**
Para gestión de presupuestos mensuales por categoría.
- Nombre, monto, categoría
- Mes y año de aplicación
- **NUEVA funcionalidad**: Alertas automáticas al 80%, 90% y 100%
- **NUEVA relación**: Con alertas automáticas
- **NUEVA relación**: Con tareas de seguimiento
- Relación con usuario

### Servicio (Servicio)
Para gestión de servicios contratados (suscripciones, servicios mensuales, etc.).
- Nombre, descripción, monto
- Medio de pago y tarjeta utilizada
- Fechas de cobro y vencimiento
- Relación con usuario
- Asociación con promociones

### Promoción (Promocion)
Para gestión de promociones y ofertas de servicios.
- Título, descripción, URL de origen
- Descuento y porcentaje de ahorro
- Fechas de vencimiento
- Estado (activa, expirada, utilizada)
- **NUEVA relación**: Con alertas de promociones
- Relación con servicio
- Servicios alternativos asociados

### Servicio Alternativo (ServicioAlternativo)
Para comparación de servicios y promociones.
- Nombre, descripción, monto
- URL de origen
- Relación con promoción

### Tipo de Inversión (TipoInversion)
Clasifica los diferentes tipos de inversiones disponibles.
- Nombre, descripción, icono
- Sistema predefinido o personalizado por usuario
- Relación con inversiones y usuario

### Inversión (Inversion) - **ACTUALIZADO**
Registra y hace seguimiento de inversiones financieras.
- Nombre, descripción, monto inicial y actual
- Rendimiento total y anual estimado
- Fechas de inicio y vencimiento
- Estado (activa, cerrada, vencida)
- Plataforma (banco, broker, exchange)
- **NUEVA funcionalidad**: Alertas automáticas de vencimiento
- **NUEVA relación**: Con alertas automáticas
- **NUEVA relación**: Con tareas de seguimiento
- Relación con usuario y tipo de inversión
- Transacciones y cotizaciones asociadas

### Transacción de Inversión (TransaccionInversion)
Registra movimientos relacionados con una inversión.
- Tipo (depósito, retiro, dividendo, interés, comisión)
- Monto y fecha
- Descripción y comprobante
- Relación con la inversión principal

### Cotización de Inversión (CotizacionInversion)
Registra valores históricos de una inversión.
- Valor/precio de la inversión
- Fecha y fuente de la cotización
- Relación con la inversión principal

### Préstamo (Prestamo) - **ACTUALIZADO**
Gestiona préstamos obtenidos de entidades financieras.
- Información de la entidad financiera y tipo de crédito
- Montos (solicitado, aprobado, desembolsado, saldo actual)
- Tasa de interés y plazo en meses
- Cuota mensual y seguimiento de pagos
- Fechas de desembolso, primera cuota y vencimiento
- Estado del préstamo (activo, pagado, vencido, refinanciado)
- **NUEVA funcionalidad**: Alertas automáticas de cuotas próximas
- **NUEVA relación**: Con alertas automáticas
- **NUEVA relación**: Con tareas de seguimiento
- Propósito, garantías y seguros asociados
- Relación con usuario y pagos realizados

### Pago de Préstamo (PagoPrestamo)
Registra los pagos realizados a préstamos.
- Número de cuota y montos pagados (capital, interés, seguros)
- Fechas de pago y vencimiento
- Control de mora y métodos de pago
- Comprobantes y observaciones
- Relación con el préstamo principal

### Plan
Gestiona los planes de suscripción disponibles.
- Nombre, descripción
- Tipo de plan (gratuito o pago)
- Precio mensual (para planes de pago)
- Relación con usuarios
- Relación con funcionalidades disponibles

### **✅ NUEVO MODELO - SISTEMA DE TAREAS**

### Tarea (Tarea) - **IMPLEMENTADO**
Gestiona tareas personales y financieras del usuario.
- Título, descripción detallada
- Fecha de vencimiento y prioridad (alta, media, baja)
- Estado (pendiente, en_progreso, completada, cancelada)
- Categorización (personal, financiera, trabajo, otros)
- Recordatorio configurado
- **Vinculación inteligente** con elementos financieros:
  - Préstamos (seguimiento de pagos y vencimientos)
  - Gastos recurrentes (recordatorios de pago)
  - Inversiones (fechas de vencimiento y revisiones)
  - Presupuestos (alertas de seguimiento mensual)
- **NUEVA funcionalidad**: Alertas automáticas de vencimiento
- **NUEVA relación**: Con alertas automáticas
- Fecha de finalización
- Relación con usuario

### Funcionalidad
Define las funcionalidades disponibles en la aplicación.
- Nombre, descripción, slug (identificador único)
- Icono para representación visual
- Relación con planes que la incluyen

### FuncionalidadPlan
Relación entre funcionalidades y planes.
- Define qué funcionalidades están disponibles en cada plan
- Control de activación/desactivación de funcionalidades por plan

## 🚀 **FUNCIONALIDADES IMPLEMENTADAS - 3 FASES COMPLETAS**

### **✅ FASE 1 - Sistema de Alertas Avanzado**

#### Gestión de Alertas Completa
- **13 tipos de alerta** diferentes con iconos y colores
- **4 niveles de prioridad**: Baja, Media, Alta, Crítica
- **Centro de notificaciones** persistente en el header
- **Página dedicada** `/alertas` con tabs (Activas, Historial, Configuración)
- **Configuración granular** por usuario, tipo y canal
- **Acciones completas**: marcar leída, accionar, eliminar

#### Tipos de Alerta Implementados
1. **PRESUPUESTO_80**: Alerta al usar 80% del presupuesto
2. **PRESUPUESTO_90**: Alerta al usar 90% del presupuesto  
3. **PRESUPUESTO_SUPERADO**: Alerta al superar 100% del presupuesto
4. **PRESTAMO_CUOTA**: Próximas cuotas de préstamos
5. **INVERSION_VENCIMIENTO**: Vencimientos de inversiones
6. **PAGO_RECURRENTE**: Próximos pagos recurrentes
7. **TAREA_VENCIMIENTO**: Tareas vencidas
8. **GASTO_INUSUAL**: Gastos anómalos detectados
9. **PROMOCION_DISPONIBLE**: Promociones disponibles
10. **SERVICIOS_CAROS**: Servicios con alternativas más baratas
11. **META_ALCANZADA**: Metas financieras logradas
12. **RECORDATORIO_PAGO**: Recordatorios personalizados
13. **SISTEMA**: Alertas del sistema y mantenimiento

### **✅ FASE 2 - Motor Automático de Alertas**

#### AlertEngine - Motor de Evaluación
- **Evaluación automática** de 8 tipos de condiciones financieras
- **Prevención de duplicados** con validación temporal
- **Lógica inteligente** de prioridades y umbrales
- **Metadatos enriquecidos** para cada alerta
- **Sistema escalable** para agregar nuevas condiciones

#### AlertScheduler - Programador Automático
- **Patrón Singleton** para gestión global
- **Ejecución programada** configurable (default: 60 minutos)
- **Evaluación selectiva** solo para usuarios activos
- **Limpieza automática** de alertas expiradas
- **Control completo**: start/stop/runOnce

#### APIs de Control del Motor
- `POST /api/alertas/evaluate` - Ejecuta evaluación manual
- `GET /api/alertas/evaluate` - Estadísticas de evaluación
- `GET /api/alertas/scheduler` - Estado del scheduler
- `POST /api/alertas/scheduler` - Control del scheduler

#### Panel de Administración
- **Control manual** del motor para el usuario actual
- **Control del scheduler** automático con feedback visual
- **Estadísticas en tiempo real** de condiciones detectadas
- **Dashboard completo** en `/admin/alertas`

### **✅ FASE 3 - Inteligencia Artificial Completa**

#### AIAnalyzer - Motor Principal de IA
- **Análisis de patrones** de gastos con tendencias
- **Recomendaciones personalizadas** con impacto económico
- **Alertas predictivas** basadas en comportamiento histórico
- **Reportes inteligentes** mensuales automáticos
- **Detección de anomalías** y gastos inusuales

#### APIs de Inteligencia Artificial
- `GET /api/ai/analizar-patrones` - Análisis de patrones de gastos
- `GET /api/ai/recomendaciones` - Recomendaciones personalizadas
- `GET /api/ai/alertas-predictivas` - Predicciones de riesgos
- `GET /api/ai/reporte-inteligente` - Reportes ejecutivos automáticos  
- `GET /api/ai/detectar-anomalias` - Detección de gastos anómalos

#### Integración con OpenAI
- **GPT-3.5-turbo**: Para análisis de patrones y detección de anomalías
- **GPT-4o-mini**: Para recomendaciones y reportes inteligentes
- **Prompts especializados**: Diseñados para análisis financiero en español
- **Respuestas estructuradas**: JSON tipado y validado
- **Error handling robusto**: Manejo de errores de API

#### Centro de IA (`/ai-financiero`)
- **Dashboard integrado** con todas las funcionalidades de IA
- **Componentes especializados**: PatronesAnalisis, RecomendacionesIA
- **Análisis configurable**: Períodos de 3 a 24 meses
- **Visualización inteligente**: Badges dinámicos y colores por prioridad

### Gestión de Gastos
- Registro de gastos e ingresos
- Categorización automática e inteligente
- Filtrado por fecha, categoría, tipo
- Visualización en gráficos y tablas interactivas
- Registro detallado de ítems para tickets con múltiples productos
- **Control de visibilidad familiar** con campo `incluirEnFamilia`

### Gestión de Grupos
- Creación y administración de grupos
- Invitación de miembros con notificaciones
- Gastos compartidos con divisiones justas
- Distribución automática de gastos entre miembros

### Autenticación y Seguridad
- Registro de usuarios con validación
- Inicio de sesión seguro con JWT
- Gestión de sesiones robusta
- **Rate limiting** en APIs sensibles

### Reportes y Análisis
- Visualización de gastos por categoría con gráficos interactivos
- Tendencias de gastos por período temporal
- Distribución de ingresos vs gastos
- Balance general de finanzas personal
- **Análisis de IA** con patrones y recomendaciones
- **Reportes inteligentes** automáticos mensuales
- Informes detallados y personalizables

### Gastos Recurrentes
- Registro y seguimiento de gastos periódicos
- Gestión de estados (pagado, pendiente, parcial)
- **Alertas automáticas** de próximos pagos
- **Integración con tareas** para seguimiento
- Visualización de calendario de pagos

### Financiaciones con Tarjeta
- Registro de compras financiadas
- Seguimiento de cuotas pagadas y pendientes
- Cálculo automático de montos restantes
- Registro de pagos de cuotas

### Gestión de Inversiones
- Registro y seguimiento de diversas inversiones financieras
- Clasificación por tipos (acciones, bonos, plazo fijo, criptomonedas, etc.)
- Registro de transacciones (depósitos, retiros, dividendos)
- Seguimiento de rendimientos y valor actual
- **Alertas automáticas** de vencimientos próximos
- **Integración con tareas** para revisiones
- Historial de cotizaciones
- Comparativas de rendimiento entre inversiones

### Gestión de Préstamos
- Registro y seguimiento de préstamos bancarios y créditos
- Información completa de entidades financieras y tipos de crédito
- Cálculo automático de cuotas mensuales con amortización francesa
- Seguimiento de pagos realizados y saldos pendientes
- **Alertas automáticas** de cuotas próximas (7 días de anticipación)
- **Integración con tareas** para seguimiento de pagos
- Control de fechas de vencimiento y alertas de próximos pagos
- Gestión de garantías, seguros y comisiones
- Registro automático de pagos como gastos en el sistema
- Estados de préstamo (activo, pagado, vencido, refinanciado)

### Reconocimiento de Voz
- Carga de archivos de audio
- Transcripción de comandos de voz
- Análisis de contenido para registro de gastos
- Procesamiento de lenguaje natural para identificar detalles del gasto

### Presupuestos
- Creación y gestión de presupuestos mensuales
- Seguimiento de gastos vs presupuesto en tiempo real
- **Alertas automáticas** escalonadas (80%, 90%, 100%)
- **Integración con tareas** para seguimiento mensual
- Análisis de cumplimiento de presupuesto

### Gestión de Servicios
- Registro y seguimiento de servicios contratados
- **Alertas automáticas** de fechas de cobro
- Gestión de medios de pago
- Comparación de servicios alternativos más económicos

### Recomendaciones de Ahorro
- **Análisis de IA** de patrones de gasto
- Identificación de oportunidades de ahorro
- **Recomendaciones personalizadas** con impacto económico
- Sugerencias de servicios alternativos más económicos
- Promociones disponibles para servicios similares

### Asistente Financiero Inteligente
- **Recomendaciones automáticas** basadas en IA
- **Análisis de hábitos** financieros con OpenAI
- **Consejos personalizados** para mejorar salud financiera
- **Reportes ejecutivos** automáticos mensuales
- Interfaz conversacional para consultas financieras

### **✅ NUEVA FUNCIONALIDAD - Gestión de Tareas**
- **Creación y gestión** de tareas personales y financieras
- **Sistema de prioridades** (alta, media, baja) con códigos de color
- **Estados de tarea** (pendiente, en progreso, completada, cancelada)
- **Categorización flexible** (personal, financiera, trabajo, otros)
- **Vinculación inteligente** con elementos financieros:
  - Préstamos (seguimiento de pagos y vencimientos)
  - Gastos recurrentes (recordatorios de pago)
  - Inversiones (fechas de vencimiento y revisiones)
  - Presupuestos (alertas de seguimiento mensual)
- **Widget de dashboard** mostrando próximas tareas prioritarias
- **Filtros avanzados** por estado, categoría, prioridad y tipo
- **Búsqueda de tareas** por contenido
- **Estadísticas de cumplimiento** y productividad
- **Alertas automáticas** de vencimiento
- **Recordatorios configurables**

### Gestión de Planes y Funcionalidades
- Planes gratuitos y pagos
- Restricción de funcionalidades según el plan del usuario
- Configuración flexible de qué funcionalidades están disponibles en cada plan
- Actualización de plan desde el perfil de usuario

### Administración
- Panel de control completo para administradores
- Gestión de categorías del sistema
- **Control del motor de alertas** automático
- Monitoreo y ejecución de scrapers
- Gestión de planes y funcionalidades
- Ejecución de scripts para generar datos de prueba

## Componentes Principales

### Interfaz de Usuario

#### Dashboard Principal
- **Layout optimizado**: Organización jerárquica de información financiera
- **Header inteligente**: Saldo total con navegación + cotizaciones de dólares
- **Centro de notificaciones**: Badge dinámico con alertas no leídas
- **Situación mensual**: Cards de ingresos, gastos y balance mensual
- **Panel dual**: Gráfico de distribución de gastos + widget de tareas próximas
- **Navegación temporal**: Controles para navegar entre meses
- **Formularios**: Registro rápido + historial de transacciones

#### **✅ NUEVOS COMPONENTES - SISTEMA DE ALERTAS**
- **NotificationCenter**: Centro de notificaciones en header con badge dinámico
- **AlertsList**: Lista completa de alertas con filtros y acciones
- **AlertEngineControl**: Panel de control del motor automático para admins
- **AlertConfigForm**: Configuración granular de alertas por usuario

#### **✅ NUEVOS COMPONENTES - INTELIGENCIA ARTIFICIAL**
- **PatronesAnalisis**: Análisis de patrones con configuración de períodos
- **RecomendacionesIA**: Dashboard de recomendaciones personalizadas
- **AIFinancialCenter**: Centro principal de IA en `/ai-financiero`

#### Componentes Core
- **Sidebar**: Navegación principal de la aplicación con sección de tareas
- **FinancialDataWidget**: Gráfico de distribución de gastos del mes (simplificado)
- **DollarIndicator**: Widget compacto de cotizaciones de dólares (oficial y blue)
- **TareasWidget**: Widget de dashboard con próximas tareas prioritarias
- **ExpenseForm**: Formulario para registro de gastos
- **TransactionsList**: Lista de transacciones
- **PresupuestoForm**: Formulario para gestión de presupuestos
- **RecurringPaymentAlert**: Alertas de pagos recurrentes
- **FinancialAdvisor**: Asistente financiero inteligente
- **DatePickerWithRange**: Selector de rango de fechas
- **InversionDashboard**: Panel de control para inversiones
- **InversionForm**: Formulario para registro de inversiones
- **RendimientoChart**: Gráfico de rendimiento de inversiones
- **PlanesManager**: Gestión de planes y funcionalidades
- **ScriptsRunner**: Ejecución de scripts de datos de prueba

#### **✅ NUEVOS COMPONENTES - Gestión de Tareas**
- **TareasPage**: Página principal de gestión de tareas con filtros avanzados
- **TareaForm**: Formulario completo para crear/editar tareas
- **TareasList**: Lista filtrable y ordenable de tareas
- **TareasStats**: Estadísticas de cumplimiento y productividad

## Configuración y Despliegue

### Requisitos Previos
- Node.js v18 o superior
- npm o yarn
- PostgreSQL (para producción) - **Neon recomendado**
- **OpenAI API Key** (requerido para funcionalidades de IA)

### Instalación
```bash
# Clonar el repositorio
git clone <url-del-repositorio>

# Instalar dependencias
npm install

# Configurar variables de entorno
# Crear archivo .env con:
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/mibasededatos"
NEXTAUTH_SECRET="tu-secreto-super-seguro"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-proj-tu-api-key-de-openai"

# Sincronizar la base de datos
npx prisma db push

# Generar cliente de Prisma
npx prisma generate

# Inicializar los datos básicos
node scripts/create-plans.js
node scripts/create-funcionalidades.js

# Iniciar el servidor de desarrollo
npm run dev:full
```

### Scripts Disponibles
- `npm run dev:full`: Inicia el servidor de desarrollo con variables de entorno
- `npm run studio`: Prisma Studio con variables de entorno
- `npm run build`: Construye la aplicación para producción
- `npm start`: Inicia la aplicación en modo producción
- `npm run lint`: Ejecuta el linter
- `npx prisma db push`: Sincroniza schema sin migraciones
- `npx prisma generate`: Genera cliente tipado
- `scripts/create-plans.js`: Inicializa los planes (Gratuito y Premium)
- `scripts/create-funcionalidades.js`: Inicializa las funcionalidades y las asigna a los planes
- `GeneracionDatosPrueba/`: Contiene scripts para generar datos de prueba

## 🧪 **Testing y Verificación**

### **Páginas de Prueba Implementadas**
- **`/test-alertas`**: Pruebas completas del sistema de alertas (FASE 1)
- **`/test-fase2`**: Pruebas del motor automático de alertas (FASE 2)
- **`/test-fase3`**: Pruebas de inteligencia artificial con OpenAI (FASE 3)

### **APIs Verificadas**
- ✅ **Todas las APIs de alertas** funcionando correctamente
- ✅ **Motor automático** de evaluación operativo
- ✅ **Scheduler** funcionando con control start/stop/runOnce
- ✅ **5 APIs de IA** respondiendo correctamente con OpenAI
- ✅ **Integración completa** entre las 3 fases

## Mantenimiento y Extensión

### Agregar Nuevas Categorías
Modificar el modelo Categoria en el esquema de Prisma y ejecutar `npx prisma db push`.

### Agregar Nuevas Funcionalidades
1. Añadir la nueva funcionalidad al script `create-funcionalidades.js`
2. Asignar la funcionalidad a los planes correspondientes
3. Regenerar el cliente de Prisma con `npx prisma generate`
4. Reiniciar el servidor

### **Agregar Nuevos Tipos de Alerta**
1. Actualizar enum `TipoAlerta` en `prisma/schema.prisma`
2. Agregar lógica de evaluación en `AlertEngine.ts`
3. Actualizar componentes UI con nuevos iconos y colores
4. Ejecutar `npx prisma db push`

### **Agregar Nuevos Análisis de IA**
1. Crear nueva API en `/api/ai/`
2. Agregar método especializado en `AIAnalyzer.ts`
3. Crear prompt especializado para OpenAI
4. Implementar componente UI para visualización

### Personalización de UI
Los componentes UI se encuentran en `/src/components/ui` y utilizan TailwindCSS para estilos.

### Nuevas Funcionalidades
Para agregar nuevas funcionalidades:
1. Actualizar modelos de datos si es necesario
2. Crear o modificar componentes React
3. Agregar rutas API si se requiere
4. Implementar nuevas páginas en `/src/app`

## Contribuciones y Soporte
Para contribuir al proyecto o reportar problemas, por favor abra un issue en el repositorio de GitHub.

## 🚀 **Estado Actual del Proyecto - Enero 2025**

### **✅ 3 FASES COMPLETADAS E INTEGRADAS**

#### **FASE 1 - Sistema de Alertas Avanzado** ✅
- ✅ **Modelos implementados**: Alerta, ConfiguracionAlerta
- ✅ **APIs completas**: CRUD + configuración granular
- ✅ **UI completa**: NotificationCenter, AlertsList, página `/alertas`
- ✅ **13 tipos de alerta** con 4 niveles de prioridad
- ✅ **Centro de notificaciones** persistente en header

#### **FASE 2 - Motor Automático de Alertas** ✅
- ✅ **AlertEngine**: Evaluación automática de 8 condiciones
- ✅ **AlertScheduler**: Programador automático con patrón Singleton
- ✅ **APIs de control**: evaluate, scheduler con autenticación
- ✅ **Panel de administración**: Control completo en `/admin/alertas`
- ✅ **Página de pruebas**: `/test-fase2` completamente funcional

#### **FASE 3 - Inteligencia Artificial Completa** ✅
- ✅ **AIAnalyzer**: Motor de IA con OpenAI integrado
- ✅ **5 APIs de IA**: Análisis, recomendaciones, predicciones, reportes, anomalías
- ✅ **Integración OpenAI**: GPT-3.5-turbo y GPT-4o-mini
- ✅ **Centro de IA**: Página `/ai-financiero` con componentes especializados
- ✅ **Página de pruebas**: `/test-fase3` con todas las funcionalidades

### **Funcionalidades Base Consolidadas** ✅
- ✅ **Sistema de tareas** completo con vinculación financiera
- ✅ **Dashboard optimizado** con widgets inteligentes
- ✅ **Gestión financiera** completa (gastos, préstamos, inversiones)
- ✅ **Autenticación robusta** con NextAuth.js
- ✅ **Administración completa** con panel de control

### **Preparado para Producción** ✅
- ✅ **Deployment en Vercel** con configuración optimizada
- ✅ **Base de datos Neon** configurada y probada
- ✅ **OpenAI API** integrada y funcionando
- ✅ **Variables de entorno** documentadas
- ✅ **Testing completo** de todas las funcionalidades

---

**Documentación actualizada**: Enero 2025 - **Proyecto 100% Completado**

## 🎯 **NUEVA FUNCIONALIDAD: ASOCIACIÓN DE GASTOS RECURRENTES**

### **📋 DESCRIPCIÓN GENERAL**
El sistema permite asociar transacciones individuales a gastos recurrentes, creando relaciones padre-hijo que facilitan el seguimiento de pagos parciales y el cálculo automático de estados.

### **🔗 FUNCIONALIDADES IMPLEMENTADAS**

#### **1. Asociación en Creación de Transacciones**
- **Ubicación**: `/transacciones/nuevo` - Componente `ExpenseForm`
- **Selector dinámico** de gastos recurrentes disponibles
- **Información visual** del impacto del pago
- **Auto-llenado** de concepto desde el recurrente seleccionado
- **Cálculo automático** de saldo pendiente y porcentaje pagado

#### **2. Asociación en Edición de Transacciones**
- **Ubicación**: `/transacciones/[id]/editar`
- **Mismo selector** que en creación
- **Manejo de cambios** de asociación (A → B, A → ninguno, ninguno → A)
- **Recalculo automático** de estados en todos los recurrentes afectados
- **Consistencia garantizada** por transacciones atómicas

#### **3. Estados Dinámicos Automáticos**
```typescript
// Cálculo automático basado en pagos asociados
'pendiente'      // Sin pagos registrados
'pago_parcial'   // Pagos < 100% del monto total  
'pagado'         // Pagos ≥ 100% del monto total
```

#### **4. API de Gastos Recurrentes Disponibles**
```typescript
GET /api/gastos/recurrentes-disponibles
// Retorna gastos con estado 'pendiente' o 'pago_parcial'
// Incluye información calculada: totalPagado, saldoPendiente, porcentajePagado
```

### **🔧 IMPLEMENTACIÓN TÉCNICA**

#### **Base de Datos**
```sql
-- Relación en tabla Gasto
ALTER TABLE Gasto ADD COLUMN gastoRecurrenteId INTEGER REFERENCES GastoRecurrente(id);

-- Relación en modelo Prisma
model Gasto {
  gastoRecurrenteId  Int?              @map("gastoRecurrenteId")
  gastoRecurrente    GastoRecurrente?  @relation(fields: [gastoRecurrenteId], references: [id])
}

model GastoRecurrente {
  gastosGenerados   Gasto[]           @relation()
}
```

#### **APIs Actualizadas**
- ✅ `POST /api/gastos` - Soporte para `gastoRecurrenteId`
- ✅ `PUT /api/gastos/[id]` - Manejo de cambios de asociación
- ✅ `GET /api/gastos/recurrentes-disponibles` - Lista optimizada
- ✅ `POST /api/recurrentes/[id]/generar-pago` - Generación automática

#### **Componentes UI**
- ✅ **ExpenseForm** (creación) - Selector con información visual
- ✅ **EditarTransaccionPage** (edición) - Misma funcionalidad
- ✅ **GastosRecurrentesTable** - Estados visuales mejorados
- ✅ **NotificationCenter** - Alertas de recurrentes

### **🎪 CASOS DE USO SOPORTADOS**

#### **Scenario 1: Pago Completo**
```typescript
// Gasto recurrente: $10,000
// Usuario crea transacción: $10,000 asociada
// Resultado: estado = 'pagado'
```

#### **Scenario 2: Pago Parcial**
```typescript
// Gasto recurrente: $10,000  
// Usuario crea transacción: $3,000 asociada
// Resultado: estado = 'pago_parcial' (30% pagado)
```

#### **Scenario 3: Múltiples Pagos**
```typescript
// Gasto recurrente: $10,000
// Pago 1: $3,000 → estado = 'pago_parcial' (30%)
// Pago 2: $4,000 → estado = 'pago_parcial' (70%) 
// Pago 3: $3,000 → estado = 'pagado' (100%)
```

#### **Scenario 4: Cambio de Asociación**
```typescript
// Transacción estaba asociada a Recurrente A
// Se cambia a Recurrente B
// Resultado: 
//   - Recurrente A recalcula estado sin esta transacción
//   - Recurrente B recalcula estado con esta transacción
```

## 🚀 **MEJORAS DE PERFORMANCE IMPLEMENTADAS**

### **🔧 Next.js 15 Compatibility**
```typescript
// ANTES (Error)
export async function GET(request, { params }) {
  const id = params.id  // ❌ Error en Next.js 15
}

// DESPUÉS (Correcto)  
export async function GET(request, { params }) {
  const { id: idParam } = await params  // ✅ Correcto
}
```

### **⚡ Optimización de Transacciones**
```typescript
// ANTES: Transacción compleja con timeout de 5s
const resultado = await prisma.$transaction(async (tx) => {
  // Múltiples operaciones complejas
}, { timeout: 5000 })

// DESPUÉS: Operaciones separadas, lógica simplificada
const gastoRecurrente = await prisma.gastoRecurrente.create(data)
// Operaciones no críticas separadas con manejo de errores
```

### **🎯 Pool de Conexiones Optimizado**
```typescript
// Configuración mejorada en prisma.ts
const client = new PrismaClient({
  log: [],
  errorFormat: 'minimal',
  datasourceUrl: process.env.DATABASE_URL
});

// Timeouts en queries críticas
const resultado = await Promise.race([
  prisma.operation(),
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), 15000)
  )
]);
```

## 🔄 **FLUJO COMPLETO DE GASTOS RECURRENTES**

### **1. Creación del Gasto Recurrente**
```
Usuario → /recurrentes → "Nuevo Gasto Recurrente"
↓
Formulario: concepto, monto, periodicidad, etc.
↓  
POST /api/recurrentes → Crea registro con estado 'pendiente'
```

### **2. Asociación en Transacción Nueva**
```
Usuario → /transacciones/nuevo → Selector "Asociar a Gasto Recurrente"
↓
Lista gastos con estado 'pendiente' o 'pago_parcial'
↓
Usuario selecciona recurrente + ingresa monto
↓
POST /api/gastos con gastoRecurrenteId
↓
Sistema calcula nuevo estado automáticamente
```

### **3. Asociación en Transacción Existente**
```
Usuario → /transacciones → Editar transacción existente
↓
Formulario muestra selector de gastos recurrentes  
↓
Usuario cambia/agrega/quita asociación
↓
PUT /api/gastos/[id] con gastoRecurrenteId
↓
Sistema recalcula TODOS los recurrentes afectados
```

### **4. Generación Automática de Pagos**
```
Usuario → /recurrentes → "Generar Pago" en gasto pendiente
↓
POST /api/recurrentes/[id]/generar-pago
↓
Crea transacción automática con relación padre-hijo
↓
Actualiza estado del recurrente automáticamente
```

## 📊 **ARQUITECTURA DE COMPONENTES**

### **Frontend (React/Next.js)**
```
📁 src/components/
├── 🔄 ExpenseForm.tsx (creación con selector recurrentes)
├── 🔄 EditarTransaccionPage.tsx (edición con selector)
├── 📋 GastosRecurrentesTable.tsx (vista con estados)
└── 🔔 NotificationCenter.tsx (alertas automáticas)

📁 src/app/
├── 💰 /transacciones/nuevo (creación con asociación)
├── ✏️ /transacciones/[id]/editar (edición con asociación)  
├── 🔄 /recurrentes (gestión completa)
└── 🤖 /ai-financiero (análisis inteligente)
```

### **Backend (API Routes)**
```
📁 src/app/api/
├── 💰 /gastos/route.ts (POST con gastoRecurrenteId)
├── ✏️ /gastos/[id]/route.ts (PUT con recálculo estados)
├── 📋 /gastos/recurrentes-disponibles/route.ts (lista optimizada)
├── 🔄 /recurrentes/route.ts (CRUD recurrentes)
├── 💸 /recurrentes/[id]/generar-pago/route.ts (generación automática)
└── 🤖 /ai/* (análisis inteligente)
```

### **Base de Datos (PostgreSQL/Prisma)**
```sql
📊 Tablas principales:
├── 💰 Gasto (con gastoRecurrenteId nullable)
├── 🔄 GastoRecurrente (con gastosGenerados relation)
├── 📂 Categoria (compartida)
├── 🔔 Alerta (para notificaciones automáticas)
└── 👤 User (propietario de todos los datos)
```

## 🧪 **TESTING Y VALIDACIÓN**

### **Páginas de Prueba Disponibles**
- ✅ `/test-alertas` - Sistema de alertas
- ✅ `/test-fase2` - Motor automático  
- ✅ `/test-fase3` - Inteligencia artificial
- ✅ `/recurrentes` - Funcionalidad completa implementada

### **Casos de Prueba Críticos**
1. **✅ Crear gasto recurrente** → Estado inicial 'pendiente'
2. **✅ Asociar transacción nueva** → Cambio a 'pago_parcial'/'pagado'
3. **✅ Editar asociación existente** → Recálculo correcto de ambos recurrentes
4. **✅ Generar pago automático** → Creación correcta de relación
5. **✅ Múltiples pagos parciales** → Acumulación correcta hacia 100%

## 🔮 **ROADMAP Y MEJORAS FUTURAS**

### **Funcionalidades Sugeridas (Opcional)**
- [ ] **Alertas por WhatsApp/SMS** cuando se acerca vencimiento
- [ ] **Dashboard visual** de pagos parciales con progress bars
- [ ] **Plantillas de gastos** recurrentes comunes
- [ ] **Importación masiva** de CSV con gastos recurrentes
- [ ] **Gamificación** - badges por completar pagos a tiempo

### **Optimizaciones Técnicas (Opcional)**
- [ ] **Cache Redis** para gastos recurrentes frecuentes
- [ ] **Web Workers** para cálculos pesados de estados
- [ ] **PWA** con notificaciones push nativas
- [ ] **GraphQL** para queries más eficientes
- [ ] **WebSockets** para updates en tiempo real

## 🎯 **CONCLUSIÓN**

El sistema de gastos recurrentes está **100% completo y funcional**, proporcionando:

✅ **Asociación bidireccional** entre transacciones y recurrentes
✅ **Estados automáticos** basados en pagos reales  
✅ **Interfaz intuitiva** para usuarios finales
✅ **Arquitectura robusta** con manejo de errores
✅ **Performance optimizada** para uso en producción
✅ **Integración completa** con el resto del sistema

**La aplicación está lista para producción** con todas las funcionalidades críticas implementadas y probadas. 🚀 