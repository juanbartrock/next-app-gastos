# Guía de Despliegue en Vercel

Este documento proporciona instrucciones detalladas para desplegar correctamente la aplicación en Vercel.

## Requisitos Previos

1. Cuenta de Vercel
2. Cuenta de GitHub
3. Base de datos PostgreSQL externa (puedes usar [Supabase](https://supabase.com), [Neon](https://neon.tech), [Railway](https://railway.app) u otra de tu preferencia)

## Preparación para el Despliegue

### 1. Base de Datos

Asegúrate de tener una instancia de PostgreSQL vacía y disponible. La aplicación configurará automáticamente las tablas necesarias en el primer despliegue.

### 2. Variables de Entorno

Configura las siguientes variables de entorno en Vercel:

- `DATABASE_URL`: URL de conexión a tu base de datos PostgreSQL
- `NEXTAUTH_URL`: URL completa de tu aplicación (ejemplo: https://tu-app.vercel.app)
- `NEXTAUTH_SECRET`: String aleatorio para firmar cookies y tokens
- `OPENAI_API_KEY`: Clave API de OpenAI para el asesor financiero virtual

Variables opcionales:
- `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`: Para autenticación con Google
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`: Para notificaciones por WhatsApp

### 3. Configuración de Vercel

1. Conecta tu repositorio de GitHub a Vercel
2. Configura las variables de entorno mencionadas anteriormente
3. Asegúrate de que el comando de construcción esté configurado como: `npm run build`
4. Asegúrate de que el directorio de salida sea: `.next`
5. Usa Node.js versión 18.x o superior

## Proceso de Migración de Base de Datos

La aplicación está configurada para manejar las migraciones automáticamente durante el despliegue mediante el script `postbuild` que ejecuta `prisma/migrations.cjs`.

Durante el primer despliegue:
1. La aplicación verificará la conexión a la base de datos
2. Se aplicará el esquema completo usando `prisma db push`
3. Las tablas se crearán vacías, listas para ser utilizadas por el primer usuario

## Primer Uso Después del Despliegue

1. Navega a la URL de tu aplicación
2. Regístrate como el primer usuario (este será el administrador)
3. Inicializa los datos básicos del sistema ejecutando los siguientes scripts:
   ```bash
   # Inicializar planes (Gratuito y Premium)
   node scripts/create-plans.js
   
   # Inicializar funcionalidades y asignarlas a los planes
   node scripts/create-funcionalidades.js
   ```
4. La aplicación estará lista para usar con todas las funcionalidades habilitadas

## Solución de Problemas

Si encuentras problemas durante el despliegue:

1. Verifica los logs de construcción en Vercel
2. Asegúrate de que la URL de la base de datos sea accesible desde Vercel
3. Comprueba que todas las variables de entorno estén correctamente configuradas
4. Si hay problemas con las migraciones, puedes ejecutar manualmente `npx prisma db push` desde la consola de Vercel

## Actualización de la Aplicación

Para futuras actualizaciones, simplemente haz push a tu rama principal en GitHub y Vercel actualizará automáticamente la aplicación. 