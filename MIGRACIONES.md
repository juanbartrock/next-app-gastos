# Guía de Migraciones de Base de Datos

## ⚠️ IMPORTANTE: Migraciones Seguras

Este proyecto ya NO resetea automáticamente la base de datos en producción para proteger tus datos.

## 🔄 Cómo aplicar cambios al esquema de base de datos

### En Desarrollo Local:
```bash
# 1. Hacer cambios en prisma/schema.prisma
# 2. Crear y aplicar migración
npx prisma migrate dev --name nombre_de_la_migracion

# 3. Generar cliente actualizado
npx prisma generate
```

### En Producción (Neon/Vercel):
```bash
# OPCIÓN 1: Migración segura (RECOMENDADO)
npx prisma migrate deploy

# OPCIÓN 2: Solo si es absolutamente necesario y tienes backup
npx prisma db push
```

## 🚨 Scripts Eliminados por Seguridad

Los siguientes scripts fueron eliminados para proteger tus datos:
- `postbuild`: Ya no ejecuta migraciones automáticas
- `seed`: Ya no puebla la base con datos de prueba
- `db:reset`: Ya no resetea la base de datos
- `prisma/migrations.cjs`: Script que reseteaba la base en producción
- `prisma/db-check.js`: Script de verificación que podía causar problemas

## 📋 Proceso Recomendado para Cambios de Esquema

1. **Desarrollo Local:**
   - Modifica `prisma/schema.prisma`
   - Ejecuta `npx prisma migrate dev`
   - Prueba los cambios localmente

2. **Staging/Preview:**
   - Haz commit y push de los cambios
   - Vercel construirá automáticamente
   - La base de datos NO se modificará automáticamente

3. **Producción:**
   - Ejecuta manualmente `npx prisma migrate deploy` en tu base de Neon
   - O usa la interfaz de Neon para aplicar cambios

## 🛡️ Protección de Datos

- ✅ La base de datos en Neon ya NO se resetea automáticamente
- ✅ Los deploys de Vercel ya NO afectan los datos existentes
- ✅ Solo se genera el cliente Prisma durante el build
- ✅ Las migraciones deben aplicarse manualmente en producción

## 🔧 Si Necesitas Resetear (Solo en Emergencias)

```bash
# SOLO EN DESARROLLO LOCAL
npx prisma migrate reset

# NUNCA ejecutes esto en producción sin backup
``` 