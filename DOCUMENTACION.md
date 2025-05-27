# 📋 Documentación Técnica: Sistema de Gestión de Gastos

## 🎯 Descripción General
Sistema integral de gestión financiera personal y grupal desarrollado con tecnologías modernas. Permite el control completo de finanzas personales incluyendo transacciones, inversiones, préstamos, presupuestos y análisis inteligente con IA.

**✅ Características destacadas**:
- Datos reales únicamente (sin simulaciones)
- Arquitectura escalable y moderna
- Integración con APIs externas
- Análisis financiero inteligente
- Multi-dispositivo y responsive

## 🛠️ Stack Tecnológico

### Backend
- **Next.js 15** - Framework React con App Router y Server Components
- **TypeScript** - Tipado estático para mayor robustez y mantenibilidad
- **Prisma 6.8** - ORM moderno con type safety para PostgreSQL
- **NextAuth.js 4.24** - Autenticación segura y flexible
- **PostgreSQL/Neon** - Base de datos relacional en la nube
- **Zod** - Validación de esquemas y tipos

### Frontend
- **React 18** - Biblioteca de interfaces de usuario con Concurrent Features
- **TailwindCSS 4** - Framework CSS utilitario de última generación
- **Shadcn/ui** - Sistema de componentes accesibles y modernos
- **Recharts 2.15** - Visualización de datos interactiva y responsive
- **React Hook Form** - Gestión eficiente de formularios
- **Lucide React** - Iconografía consistente y optimizada

### Integraciones y APIs
- **OpenAI API** - Asistente financiero inteligente con GPT
- **Twilio** - Notificaciones SMS y WhatsApp
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
│   │   ├── dashboard/         # Dashboard principal
│   │   ├── transacciones/     # Gestión de transacciones
│   │   ├── grupos/            # Gastos grupales
│   │   ├── prestamos/         # Gestión de préstamos
│   │   ├── inversiones/       # Portfolio de inversiones
│   │   ├── admin/             # Panel de administración
│   │   ├── financial-advisor/ # Asistente financiero IA
│   │   └── ...               # Otras rutas
│   ├── components/            # Componentes reutilizables
│   │   └── ui/               # Componentes UI de Shadcn
│   ├── lib/                  # Utilidades y configuraciones
│   ├── contexts/             # Contextos de React
│   ├── providers/            # Proveedores de la aplicación
│   └── scraping/             # Sistema de web scraping
├── prisma/                   # Configuración de base de datos
│   ├── schema.prisma         # Esquema de la base de datos
│   └── migrations/           # Migraciones de BD
├── public/                   # Archivos estáticos
├── scripts/                  # Scripts de utilidades
└── docs/                     # Documentación del proyecto
```

### 🎯 Patrones de Arquitectura
- **App Router**: Utilización completa del nuevo sistema de rutas de Next.js 15
- **Server Components**: Renderizado del lado del servidor por defecto
- **Client Components**: Solo cuando se requiere interactividad
- **API Routes**: Endpoints RESTful con validación de tipos
- **Middleware**: Protección de rutas y autenticación
- **Contexts**: Gestión de estado global (Currency, Sidebar)
- **Custom Hooks**: Lógica reutilizable encapsulada

### Rutas Principales
- `/`: Página principal (dashboard)
- `/login`: Autenticación de usuarios
- `/register`: Registro de nuevos usuarios
- `/dashboard`: Panel principal con resumen financiero
- `/transacciones`: Gestión de transacciones
- `/grupos`: Gestión de grupos de gastos compartidos
- `/recurrentes`: Gestión de gastos recurrentes
- `/financiacion`: Gestión de financiaciones con tarjeta
- `/inversiones`: Gestión de inversiones y seguimiento de rendimientos
- `/prestamos`: Gestión de préstamos y créditos bancarios
- `/tareas`: Gestión de tareas personales y financieras
  - `/tareas/nueva`: Formulario para crear nuevas tareas
- `/voz`: Reconocimiento de voz para registro de gastos
- `/presupuestos`: Gestión de presupuestos mensuales
- `/perfil`: Gestión del perfil de usuario y planes
- `/configuracion`: Configuración de la aplicación
- `/recomendaciones-ahorro`: Sugerencias para ahorrar dinero
- `/informes`: Informes detallados y análisis financiero
- `/financial-advisor`: Asistente financiero inteligente
- `/admin`: Panel de administración
  - `/admin/categorias`: Gestión de categorías
  - `/admin/scraping`: Gestión de scrapers
  - `/admin/planes`: Gestión de planes y funcionalidades
  - `/admin/scripts-prueba`: Ejecución de scripts de datos de prueba
- `/home`: Página de inicio para usuarios no autenticados
- `/welcome`: Página de bienvenida para nuevos usuarios

## Modelos de Datos

### Usuario (User)
Almacena información de usuarios, incluyendo autenticación y perfiles.
- ID, nombre, email, contraseña, etc.
- Relación con gastos, grupos y sesiones.
- Relación con gastos recurrentes, financiaciones y presupuestos.
- Relación con servicios contratados e inversiones.
- Relación con tipos de inversión personalizados.
- Relación con plan de suscripción.

### Gasto (Gasto)
Registra las transacciones financieras.
- Concepto, monto, fecha, categoría
- Tipo de transacción: ingreso o gasto
- Tipo de movimiento: efectivo, digital, ahorro, tarjeta
- Asociación con usuario y/o grupo
- Relación con financiación (para gastos con tarjeta)
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

### Gasto Recurrente (GastoRecurrente)
Para gestión de gastos que se repiten periódicamente.
- Concepto, monto, periodicidad
- Estado (pagado, pendiente, parcial, n/a)
- Fechas de próximo pago y último pago
- Relación con categoría y usuario

### Financiación (Financiacion)
Para gestión de gastos financiados con tarjeta de crédito.
- Relación con el gasto asociado
- Cantidad total de cuotas y cuotas pagadas
- Monto de cada cuota
- Fechas de pago y día de pago mensual
- Relación con usuario

### Presupuesto (Presupuesto)
Para gestión de presupuestos mensuales por categoría.
- Nombre, monto, categoría
- Mes y año de aplicación
- Relación con usuario
- Control de presupuesto por categoría

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

### Inversión (Inversion)
Registra y hace seguimiento de inversiones financieras.
- Nombre, descripción, monto inicial y actual
- Rendimiento total y anual estimado
- Fechas de inicio y vencimiento
- Estado (activa, cerrada, vencida)
- Plataforma (banco, broker, exchange)
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

### Préstamo (Prestamo)
Gestiona préstamos obtenidos de entidades financieras.
- Información de la entidad financiera y tipo de crédito
- Montos (solicitado, aprobado, desembolsado, saldo actual)
- Tasa de interés y plazo en meses
- Cuota mensual y seguimiento de pagos
- Fechas de desembolso, primera cuota y vencimiento
- Estado del préstamo (activo, pagado, vencido, refinanciado)
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

### Tarea (Tarea)
Gestiona tareas personales y financieras del usuario.
- Título, descripción detallada
- Fecha de vencimiento y prioridad (alta, media, baja)
- Estado (pendiente, en_progreso, completada, cancelada)
- Categorización (personal, financiera, trabajo, otros)
- Recordatorio configurado
- Vinculación opcional con elementos financieros (préstamos, gastos recurrentes, inversiones, presupuestos)
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

## Funcionalidades Principales

### Gestión de Gastos
- Registro de gastos e ingresos
- Categorización
- Filtrado por fecha, categoría, tipo
- Visualización en gráficos y tablas
- Registro detallado de ítems para tickets con múltiples productos

### Gestión de Grupos
- Creación y administración de grupos
- Invitación de miembros
- Gastos compartidos
- Distribución de gastos entre miembros

### Autenticación
- Registro de usuarios
- Inicio de sesión con credenciales
- Gestión de sesiones

### Reportes y Análisis
- Visualización de gastos por categoría
- Tendencias de gastos por período
- Distribución de ingresos vs gastos
- Balance general de finanzas
- Informes detallados y personalizables

### Gastos Recurrentes
- Registro y seguimiento de gastos periódicos
- Gestión de estados (pagado, pendiente, parcial)
- Alertas de próximos pagos
- Visualización de calendario de pagos

### Financiaciones con Tarjeta
- Registro de compras financiadas
- Seguimiento de cuotas pagadas y pendientes
- Cálculo de montos restantes
- Registro de pagos de cuotas

### Gestión de Inversiones
- Registro y seguimiento de diversas inversiones financieras
- Clasificación por tipos (acciones, bonos, plazo fijo, criptomonedas, etc.)
- Registro de transacciones (depósitos, retiros, dividendos)
- Seguimiento de rendimientos y valor actual
- Historial de cotizaciones
- Comparativas de rendimiento entre inversiones

### Gestión de Préstamos
- Registro y seguimiento de préstamos bancarios y créditos
- Información completa de entidades financieras y tipos de crédito
- Cálculo automático de cuotas mensuales con amortización francesa
- Seguimiento de pagos realizados y saldos pendientes
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
- Seguimiento de gastos vs presupuesto
- Alertas de sobrepasamiento de límites
- Análisis de cumplimiento de presupuesto

### Gestión de Servicios
- Registro y seguimiento de servicios contratados
- Alertas de fechas de cobro
- Gestión de medios de pago
- Comparación de servicios alternativos

### Recomendaciones de Ahorro
- Análisis de patrones de gasto
- Identificación de oportunidades de ahorro
- Sugerencias de servicios alternativos más económicos
- Promociones disponibles para servicios similares

### Asistente Financiero
- Recomendaciones personalizadas
- Análisis de hábitos financieros
- Consejos para mejorar salud financiera
- Interfaz conversacional para consultas financieras

### Gestión de Tareas
- Creación y gestión de tareas personales y financieras
- Sistema de prioridades (alta, media, baja) con códigos de color
- Estados de tarea (pendiente, en progreso, completada, cancelada)
- Categorización flexible (personal, financiera, trabajo, otros)
- Vinculación inteligente con elementos financieros:
  - Préstamos (seguimiento de pagos y vencimientos)
  - Gastos recurrentes (recordatorios de pago)
  - Inversiones (fechas de vencimiento y revisiones)
  - Presupuestos (alertas de seguimiento mensual)
- Widget de dashboard mostrando próximas tareas prioritarias
- Filtros avanzados por estado, categoría, prioridad y tipo
- Búsqueda de tareas por contenido
- Estadísticas de cumplimiento
- Recordatorios configurables

### Gestión de Planes y Funcionalidades
- Planes gratuitos y pagos
- Restricción de funcionalidades según el plan del usuario
- Configuración flexible de qué funcionalidades están disponibles en cada plan
- Actualización de plan desde el perfil de usuario

### Administración
- Panel de control para administradores
- Gestión de categorías
- Monitoreo y ejecución de scrapers
- Gestión de planes y funcionalidades
- Ejecución de scripts para generar datos de prueba

## Componentes Principales

### Interfaz de Usuario

#### Dashboard Principal
- **Layout optimizado**: Organización jerárquica de información financiera
- **Header inteligente**: Saldo total con navegación + cotizaciones de dólares
- **Situación mensual**: Cards de ingresos, gastos y balance mensual
- **Panel dual**: Gráfico de distribución de gastos + widget de tareas próximas
- **Navegación temporal**: Controles para navegar entre meses
- **Formularios**: Registro rápido + historial de transacciones

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

#### Gestión de Tareas
- **TareasPage**: Página principal de gestión de tareas con filtros avanzados
- **TareaForm**: Formulario completo para crear/editar tareas
- **TareasList**: Lista filtrable y ordenable de tareas
- **TareasStats**: Estadísticas de cumplimiento y productividad

## Configuración y Despliegue

### Requisitos Previos
- Node.js v16 o superior
- npm o yarn
- PostgreSQL (para producción)

### Instalación
```bash
# Clonar el repositorio
git clone <url-del-repositorio>

# Instalar dependencias
npm install

# Configurar variables de entorno
# Crear archivo .env con:
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/mibasededatos"
NEXTAUTH_SECRET="tu-secreto"
NEXTAUTH_URL="http://localhost:3000"

# Inicializar la base de datos
npx prisma migrate dev

# Inicializar los datos básicos
node scripts/create-plans.js
node scripts/create-funcionalidades.js

# Iniciar el servidor de desarrollo
npm run dev
```

### Scripts Disponibles
- `npm run dev`: Inicia el servidor de desarrollo
- `npm run build`: Construye la aplicación para producción
- `npm start`: Inicia la aplicación en modo producción
- `npm run lint`: Ejecuta el linter
- `scripts/create-plans.js`: Inicializa los planes (Gratuito y Premium)
- `scripts/create-funcionalidades.js`: Inicializa las funcionalidades y las asigna a los planes
- `GeneracionDatosPrueba/`: Contiene scripts para generar datos de prueba

## Mantenimiento y Extensión

### Agregar Nuevas Categorías
Modificar el modelo Categoria en el esquema de Prisma y ejecutar una migración.

### Agregar Nuevas Funcionalidades
1. Añadir la nueva funcionalidad al script `create-funcionalidades.js`
2. Asignar la funcionalidad a los planes correspondientes
3. Regenerar el cliente de Prisma con `npx prisma generate`
4. Reiniciar el servidor

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

## Cambios Recientes (Enero 2025)

### Sistema de Tareas Implementado
- ✅ **Modelo de datos completo** para tareas personales y financieras
- ✅ **API completa** con endpoints CRUD y operaciones especiales
- ✅ **Widget de dashboard** mostrando próximas tareas prioritarias
- ✅ **Página de gestión** con filtros avanzados y estadísticas
- ✅ **Formulario completo** para crear tareas con vista previa
- ✅ **Integración** con elementos financieros (préstamos, inversiones, etc.)
- ✅ **Navegación** agregada al sidebar principal

### Mejoras del Dashboard
- ✅ **Reorganización del layout** para mejor flujo de información
- ✅ **Header optimizado** con saldo total y cotizaciones de dólares
- ✅ **Widget de cotizaciones** compacto y alineado
- ✅ **Simplificación** del panel financiero (solo gráfico de gastos)
- ✅ **Orden jerárquico** mejorado: situación mensual → gráficos → formularios
- ✅ **Eliminación** de elementos redundantes y obsoletos

### Correcciones Técnicas
- ✅ **Problemas de autenticación** resueltos con variables de entorno
- ✅ **Componentes UI faltantes** instalados (AlertDialog, Sonner)
- ✅ **Usuario de prueba** creado (test@test.com / 123456)
- ✅ **Sistema de notificaciones** configurado correctamente

---

Documentación actualizada: Enero 2025 