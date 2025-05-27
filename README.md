# 💰 Sistema de Gestión de Gastos Personales

Una aplicación web completa para la gestión de finanzas personales y grupales, desarrollada con Next.js 15, React 18, TypeScript y PostgreSQL.

## 🚀 Características Principales

### 💳 Gestión Financiera
- **Transacciones**: Registro de ingresos y gastos con categorización automática
- **Gastos Grupales**: Gestión de gastos compartidos entre múltiples usuarios
- **Gastos Recurrentes**: Automatización de pagos periódicos y recordatorios
- **Presupuestos**: Control mensual por categorías con alertas de límites
- **Inversiones**: Seguimiento de portafolios con cálculo de rendimientos
- **Préstamos**: Gestión completa de créditos con amortización francesa

### 📊 Análisis y Reportes
- **Dashboard Interactivo**: Visualización en tiempo real de la situación financiera
- **Gráficos Avanzados**: Análisis de tendencias y patrones de gasto
- **Informes Detallados**: Reportes personalizables por períodos y categorías
- **Asesor Financiero IA**: Recomendaciones inteligentes basadas en OpenAI

### 🛠️ Funcionalidades Avanzadas
- **Reconocimiento de Voz**: Registro de gastos mediante comandos de voz
- **OCR de Tickets**: Extracción automática de datos de comprobantes
- **Scraping de Promociones**: Búsqueda automática de ofertas y descuentos
- **Notificaciones**: Alertas por WhatsApp/SMS usando Twilio
- **Multi-moneda**: Soporte para diferentes divisas con cotizaciones en tiempo real

## 🏗️ Tecnologías

### Backend
- **Next.js 15** - Framework React con App Router
- **TypeScript** - Tipado estático para mayor robustez
- **Prisma** - ORM moderno para PostgreSQL
- **NextAuth.js** - Autenticación segura y flexible
- **PostgreSQL/Neon** - Base de datos en la nube

### Frontend
- **React 18** - Biblioteca de interfaces de usuario
- **TailwindCSS 4** - Framework CSS utilitario
- **Shadcn/ui** - Componentes UI accesibles y modernos
- **Recharts** - Visualización de datos interactiva
- **Lucide React** - Iconografía consistente

### Integraciones
- **OpenAI API** - Asistente financiero inteligente
- **Twilio** - Notificaciones SMS/WhatsApp
- **Puppeteer** - Web scraping para promociones
- **Cheerio** - Parsing de contenido web

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+ 
- PostgreSQL (local o Neon)
- Git

### Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd next-app-gastos
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="tu-secret-key"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-..." # Opcional
TWILIO_ACCOUNT_SID="..." # Opcional
TWILIO_AUTH_TOKEN="..." # Opcional
```

4. **Configurar base de datos**
```bash
npx prisma generate
npx prisma db push
```

5. **Iniciar desarrollo**
```bash
npm run dev:full
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── api/               # API Routes
│   ├── dashboard/         # Dashboard principal
│   ├── transacciones/     # Gestión de transacciones
│   ├── grupos/            # Gastos grupales
│   ├── prestamos/         # Gestión de préstamos
│   ├── inversiones/       # Gestión de inversiones
│   ├── admin/             # Panel de administración
│   └── ...
├── components/            # Componentes reutilizables
│   └── ui/               # Componentes UI de Shadcn
├── lib/                  # Utilidades y configuraciones
├── contexts/             # Contextos de React
├── providers/            # Proveedores de la aplicación
└── scraping/             # Sistema de scraping
```

## 🔧 Scripts Disponibles

```bash
npm run dev:full        # Desarrollo con variables de entorno
npm run dev:check       # Verificar configuración
npm run build          # Build de producción
npm run studio         # Prisma Studio
npm run lint           # Linting del código
npm run clean          # Limpiar cache
```

## 📱 Funcionalidades por Módulo

### Dashboard
- Resumen financiero mensual
- Gráficos de ingresos vs gastos
- Saldos por tipo de cuenta
- Transacciones recientes

### Transacciones
- Registro rápido de gastos/ingresos
- Categorización automática
- Filtros avanzados
- Exportación de datos

### Grupos
- Creación de grupos de gastos
- División automática de costos
- Historial de participantes
- Liquidación de deudas

### Inversiones
- Portfolio tracking
- Cálculo de rendimientos
- Histórico de cotizaciones
- Análisis de performance

### Préstamos
- Simulador de cuotas
- Seguimiento de pagos
- Cálculo de intereses
- Reportes de amortización

## 🔐 Seguridad

- Autenticación con NextAuth.js
- Validación de datos con Zod
- Sanitización de inputs
- Rate limiting en APIs
- Encriptación de contraseñas

## 🌐 Deployment

### Vercel (Recomendado)
1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Deploy automático en cada push

### Manual
```bash
npm run build
npm start
```

## 📚 Documentación Adicional

- [Configuración de Entorno](./CONFIGURACION-ENV.md)
- [Guía de Desarrollo](./README-DESARROLLO.md)
- [Documentación Completa](./DOCUMENTACION.md)
- [Instrucciones de Deploy](./DEPLOYMENT.md)

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto es privado y propietario.

## 🆘 Soporte

Para soporte técnico o consultas, contactar al equipo de desarrollo.

---

**Desarrollado con ❤️ usando Next.js y TypeScript**
