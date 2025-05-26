# 🗃️ **Guía de Migraciones de Base de Datos**

## 📋 **Configuración Actual**

La aplicación utiliza **PostgreSQL** a través de **Neon** tanto en desarrollo como en producción.

### **Variables de Entorno**
```bash
DATABASE_URL=postgresql://neondb_owner:npg_0vBJYCp8lIbq@ep-holy-brook-acnscqwx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
NEXTAUTH_SECRET=tu-secreto-super-seguro-para-desarrollo
NEXTAUTH_URL=http://localhost:3000
```

## 🔧 **Comandos Básicos**

### **Desarrollo Local**
```bash
# Generar cliente Prisma
npx prisma generate

# Sincronizar schema con la base de datos
npx prisma db push

# Ver datos en Prisma Studio
npx prisma studio

# Verificar conexión
npx prisma db pull
```

### **Migraciones en Producción**
```bash
# ⚠️ SOLO para cambios de schema importantes
npx prisma migrate deploy
```

## 🚨 **Advertencias de Seguridad**

1. **NO usar `npx prisma db push --accept-data-loss` en producción**
2. **NO usar `npx prisma migrate reset` en producción**
3. **Siempre hacer backup antes de migraciones importantes**
4. **Los datos son compartidos entre desarrollo y producción**

## 📊 **Ventajas de la Configuración Actual**

- ✅ **Datos consistentes** entre desarrollo y producción
- ✅ **Sin reseteo accidental** de base de datos
- ✅ **Configuración simplificada** (solo PostgreSQL)
- ✅ **Backup automático** por Neon
- ✅ **Escalabilidad** de PostgreSQL

## 🔄 **Flujo de Trabajo**

1. **Desarrollo**: Trabajar directamente con Neon
2. **Cambios de Schema**: Usar `npx prisma db push`
3. **Deploy**: Automático sin scripts de migración
4. **Datos**: Persistentes y compartidos

---
*Última actualización: $(Get-Date -Format "yyyy-MM-dd")* 