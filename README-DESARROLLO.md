# 🚀 **Guía de Desarrollo Local**

## 📋 **Configuración Inicial**

La aplicación utiliza **PostgreSQL** a través de **Neon** tanto en desarrollo como en producción.

### **Variables de Entorno**
El archivo `.env` debe contener:
```bash
DATABASE_URL=postgresql://neondb_owner:npg_0vBJYCp8lIbq@ep-holy-brook-acnscqwx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
NEXTAUTH_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
NEXTAUTH_URL=http://localhost:3000
```

## 🔧 **Comandos de Desarrollo**

### **Opción 1: Scripts Automáticos (Recomendado)**
```bash
# Iniciar Next.js con variables de entorno
npm run dev:full

# Iniciar Prisma Studio con variables de entorno
npm run studio
```

### **Opción 2: Scripts PowerShell Directos**
```bash
# Iniciar Next.js
.\start-dev.ps1

# Iniciar Prisma Studio
.\start-studio.ps1
```

### **Opción 3: Comandos Manuales**
```bash
# Establecer variables de entorno en PowerShell
$env:DATABASE_URL="postgresql://neondb_owner:npg_0vBJYCp8lIbq@ep-holy-brook-acnscqwx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
$env:NEXTAUTH_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
$env:NEXTAUTH_URL="http://localhost:3000"

# Luego ejecutar
npm run dev
npx prisma studio
```

## 🗃️ **Comandos de Base de Datos**

```bash
# Generar cliente Prisma
npx prisma generate

# Sincronizar schema con la base de datos
npx prisma db push

# Ver datos en Prisma Studio
npm run studio

# Verificar conexión
npx prisma db pull
```

## 🌐 **URLs de Desarrollo**

- **Aplicación**: http://localhost:3000
- **Prisma Studio**: http://localhost:5555

## ⚠️ **Solución de Problemas**

### **Error: Environment variable not found: DATABASE_URL**
1. Cerrar todos los procesos Node.js: `taskkill /F /IM node.exe`
2. Usar los scripts automáticos: `npm run dev:full` y `npm run studio`

### **Error de JWT en NextAuth**
- Verificar que `NEXTAUTH_SECRET` esté configurado correctamente
- Limpiar cache del navegador

### **Prisma Studio no carga datos**
- Usar `npm run studio` en lugar de `npx prisma studio`
- Verificar que las variables de entorno estén establecidas

## 🎯 **Flujo de Trabajo Recomendado**

1. **Abrir dos terminales**
2. **Terminal 1**: `npm run dev:full` (Next.js)
3. **Terminal 2**: `npm run studio` (Prisma Studio)
4. **Desarrollar** con ambos servidores corriendo

---
*Configuración optimizada para desarrollo con Neon PostgreSQL* 