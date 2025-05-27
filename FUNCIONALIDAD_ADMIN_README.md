# 🔧 Funcionalidad de Administración - Guía Completa

## 📋 Resumen

Se ha implementado un sistema completo de administración que incluye:
- **ABM de Categorías y Grupos**: Solo para administradores
- **Cambio de Contraseña**: Para todos los usuarios
- **Sistema de permisos**: Basado en el campo `isAdmin` en la base de datos

## 🚀 Activación de la Funcionalidad

### 1. **Sincronización de Base de Datos** ✅ (Ya hecho)
El esquema ya incluye el campo `isAdmin` en el modelo User y el cliente de Prisma fue generado.

### 2. **Convertir Usuario en Administrador**

Para convertir un usuario existente en administrador:

```powershell
# Usando el script PowerShell (recomendado)
.\make-admin.ps1 usuario@email.com

# O directamente con Node.js
node scripts/make-admin.js usuario@email.com
```

### 3. **Verificar Estado de Administrador**

Para verificar si un usuario es administrador:

```powershell
# Usando el script PowerShell
.\check-admin.ps1 usuario@email.com

# O directamente con Node.js
node scripts/check-admin.js usuario@email.com
```

## 🎯 Acceso a las Funcionalidades

### Para **Administradores**:
1. Ir a `/configuracion`
2. Hacer clic en la pestaña **"General"**
3. Verás el **Panel de Administración** con:
   - Gestión de **Categorías**
   - Gestión de **Grupos de Categorías**
   - Operaciones de **CRUD completo**

### Para **Todos los Usuarios**:
1. Ir a `/perfil`
2. Hacer clic en la pestaña **"Seguridad"**
3. Verás el formulario de **Cambio de Contraseña** con:
   - Validación de contraseña actual
   - Indicador de fortaleza de contraseña
   - Consejos de seguridad

## 🔍 Verificación

### 1. **Comprobar que la funcionalidad funciona**:

1. **Crear un usuario administrador**:
   ```powershell
   .\make-admin.ps1 tu@email.com
   ```

2. **Iniciar sesión** con ese usuario

3. **Ir a `/configuracion`** → pestaña "General"
   - Deberías ver: "Panel de Administración" con gestión de categorías

4. **Si NO eres admin**, verás:
   - Mensaje: "Las opciones de configuración general estarán disponibles próximamente"
   - Sugerencia para contactar al administrador

### 2. **Probar cambio de contraseña**:

1. **Ir a `/perfil`** → pestaña "Seguridad"
2. **Completar el formulario** de cambio de contraseña
3. **Verificar** que se actualiza correctamente

## 🛡️ Seguridad Implementada

### **Validaciones de API**:
- ✅ Autenticación obligatoria en todas las APIs
- ✅ Verificación de permisos de admin para categorías
- ✅ Validación de contraseña actual antes del cambio
- ✅ Hasheo seguro con bcrypt

### **Validaciones de Frontend**:
- ✅ Verificación de admin via API (no en cliente)
- ✅ Estados de carga apropiados
- ✅ Mensajes de error informativos

## 📂 Archivos Creados/Modificados

### **APIs Nuevas**:
- `src/app/api/user/is-admin/route.ts` - Verificar admin
- `src/app/api/user/change-password/route.ts` - Cambiar contraseña
- `src/app/api/categorias/grupos/route.ts` - Gestión de grupos

### **APIs Modificadas**:
- `src/app/api/categorias/route.ts` - Agregada validación de admin

### **Componentes Nuevos**:
- `src/components/admin/CategoriasManager.tsx` - Gestor de categorías
- `src/components/ChangePasswordForm.tsx` - Formulario de contraseña
- `src/components/ui/alert.tsx` - Componente Alert

### **Páginas Modificadas**:
- `src/app/configuracion/page.tsx` - Agregado panel de admin
- `src/app/perfil/page.tsx` - Agregada pestaña de seguridad

### **Utilidades**:
- `src/lib/auth-utils.ts` - Función isAdmin()
- `scripts/make-admin.js` - Script para hacer admin
- `scripts/check-admin.js` - Script para verificar admin
- `make-admin.ps1` - Script PowerShell para admin
- `check-admin.ps1` - Script PowerShell para verificar

### **Base de Datos**:
- `prisma/schema.prisma` - Agregado campo `isAdmin` al modelo User

## 🐛 Solución de Problemas

### **Error: "Las opciones de configuración general estarán disponibles próximamente"**
- **Causa**: El usuario no es administrador
- **Solución**: Ejecutar `.\make-admin.ps1 usuario@email.com`

### **Error: "PrismaClient is unable to run in this browser environment"**
- **Causa**: Intentar usar Prisma en el cliente
- **Solución**: ✅ Ya solucionado - ahora usa API `/api/user/is-admin`

### **Error al generar Prisma Client**
- **Causa**: Proceso de desarrollo ejecutándose
- **Solución**: Detener servidor y ejecutar `npx prisma generate`

## 🎉 ¡Listo para Usar!

La funcionalidad está **completamente implementada** y lista para usar. 

**Próximos pasos**:
1. Crear tu primer usuario administrador
2. Probar la gestión de categorías
3. Probar el cambio de contraseña
4. ¡Disfrutar de las nuevas funcionalidades!

---

**📝 Nota**: Si encuentras algún problema, revisa este archivo y los logs de la consola del navegador. 