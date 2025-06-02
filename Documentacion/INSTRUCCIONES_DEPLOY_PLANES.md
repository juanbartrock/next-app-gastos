# Instrucciones para desplegar planes en producción

Este documento proporciona las instrucciones para solucionar el error "Invalid 'prisma.user.findUnique()' invocation: The column 'User.planId' does not exist in the current database" que aparece en la aplicación de producción.

## Problema

La base de datos de producción no tiene la columna `planId` en la tabla `User` ni las tablas relacionadas con los planes de suscripción, aunque están definidas en el esquema de Prisma.

## Solución

Hemos creado un script (`scripts/deploy-plans.js`) que realiza las siguientes acciones:

1. Sincroniza el esquema de Prisma con la base de datos
2. Crea los planes predeterminados (Gratuito y Premium) si no existen
3. Crea las funcionalidades y las asigna a los planes
4. Asigna el plan gratuito a todos los usuarios que no tienen plan asignado

## Pasos para ejecutar en producción

### Método 1: Despliegue desde local

1. Configura temporalmente la variable de entorno DATABASE_URL para que apunte a la base de datos de producción:

```bash
# En Windows (PowerShell)
$env:DATABASE_URL="postgresql://usuario:contraseña@tu-url-de-neon.postgres.database.cloud:5432/nombre-base-datos?sslmode=require"

# En Linux/Mac
export DATABASE_URL="postgresql://usuario:contraseña@tu-url-de-neon.postgres.database.cloud:5432/nombre-base-datos?sslmode=require"
```

2. Ejecuta el script de despliegue:

```bash
node scripts/deploy-plans.js
```

3. Restaura la variable de entorno DATABASE_URL a su valor original (para desarrollo local)

### Método 2: Despliegue en el entorno de Vercel

1. Accede a la consola de Vercel (dashboard)
2. Ve a la sección de "Settings" de tu proyecto
3. Selecciona "Functions" y "Console"
4. Ejecuta los siguientes comandos:

```bash
cd /var/task
node scripts/deploy-plans.js
```

## Verificación

Para verificar que todo funciona correctamente:

1. Accede a la aplicación de producción
2. Inicia sesión con un usuario
3. Verifica que no aparezca el error de la columna `planId`
4. Verifica que el usuario tenga asignado el plan gratuito por defecto

## Solución de problemas

Si el script falla, puedes intentar ejecutar los comandos de Prisma manualmente:

```bash
# Sincronizar el esquema con la base de datos
npx prisma db push

# O si lo anterior falla, usar migrate deploy
npx prisma migrate deploy

# Ejecutar los scripts de inicialización
node scripts/create-plans.js
node scripts/create-funcionalidades.js
```

## Notas importantes

- El script está diseñado para ser idempotente, lo que significa que se puede ejecutar varias veces sin causar problemas
- No se perderán datos existentes
- Si ya existen planes, el script no creará duplicados 