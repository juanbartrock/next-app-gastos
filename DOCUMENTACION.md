# Documentación: Aplicación de Gestión de Gastos

## Descripción General
Esta aplicación está diseñada para ayudar a los usuarios a gestionar sus gastos personales y grupales. Permite el registro de transacciones financieras, la categorización de gastos, la formación de grupos para gastos compartidos y ofrece visualizaciones para análisis financiero.

## Tecnologías Utilizadas

### Backend
- **Next.js**: Framework React con renderizado del lado del servidor (SSR) y generación de sitios estáticos (SSG).
- **Prisma**: ORM (Object-Relational Mapping) para manejar la base de datos.
- **SQLite**: Base de datos relacional utilizada en desarrollo.
- **NextAuth.js**: Solución de autenticación para Next.js.

### Frontend
- **React**: Biblioteca para construir interfaces de usuario.
- **TailwindCSS**: Framework CSS utilitario para el diseño.
- **Shadcn/ui**: Componentes UI reutilizables.
- **Recharts**: Biblioteca para visualización de datos.
- **React Day Picker**: Para selección de fechas.
- **Sonner**: Biblioteca para notificaciones toast.

## Estructura del Proyecto

### Directorios Principales
- `/src/app`: Contiene las rutas y páginas de la aplicación.
- `/src/components`: Componentes reutilizables.
- `/src/lib`: Funciones y utilidades.
- `/prisma`: Configuración y esquema de la base de datos.
- `/public`: Archivos estáticos.

### Rutas Principales
- `/`: Página principal (dashboard)
- `/login`: Autenticación de usuarios
- `/register`: Registro de nuevos usuarios
- `/transacciones`: Gestión de transacciones
- `/grupos`: Gestión de grupos de gastos compartidos
- `/recurrentes`: Gestión de gastos recurrentes
- `/financiacion`: Gestión de financiaciones con tarjeta
- `/voz`: Reconocimiento de voz para registro de gastos

## Modelos de Datos

### Usuario (User)
Almacena información de usuarios, incluyendo autenticación y perfiles.
- ID, nombre, email, contraseña, etc.
- Relación con gastos, grupos y sesiones.
- Relación con gastos recurrentes y financiaciones.

### Gasto (Gasto)
Registra las transacciones financieras.
- Concepto, monto, fecha, categoría
- Tipo de transacción: ingreso o gasto
- Tipo de movimiento: efectivo, digital, ahorro, tarjeta
- Asociación con usuario y/o grupo
- Relación con financiación (para gastos con tarjeta)

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

## Funcionalidades Principales

### Gestión de Gastos
- Registro de gastos e ingresos
- Categorización
- Filtrado por fecha, categoría, tipo
- Visualización en gráficos y tablas

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

### Reconocimiento de Voz
- Carga de archivos de audio
- Transcripción de comandos de voz
- Análisis de contenido para registro de gastos
- Procesamiento de lenguaje natural para identificar detalles del gasto

## Configuración y Despliegue

### Requisitos Previos
- Node.js v16 o superior
- npm o yarn

### Instalación
```bash
# Clonar el repositorio
git clone <url-del-repositorio>

# Instalar dependencias
npm install

# Configurar variables de entorno
# Crear archivo .env con:
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="tu-secreto"
NEXTAUTH_URL="http://localhost:3000"

# Inicializar la base de datos
npx prisma migrate dev

# Iniciar el servidor de desarrollo
npm run dev
```

### Scripts Disponibles
- `npm run dev`: Inicia el servidor de desarrollo
- `npm run build`: Construye la aplicación para producción
- `npm start`: Inicia la aplicación en modo producción
- `npm run lint`: Ejecuta el linter

## Mantenimiento y Extensión

### Agregar Nuevas Categorías
Modificar el modelo Categoria en el esquema de Prisma y ejecutar una migración.

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

---

Documentación actualizada: Marzo 2024 