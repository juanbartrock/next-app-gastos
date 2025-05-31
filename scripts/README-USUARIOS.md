# Scripts de Gestión de Usuarios

## 📋 Descripción

Este directorio contiene scripts para la gestión de usuarios en la aplicación de gastos. Los scripts facilitan la creación de usuarios con configuraciones específicas y su asignación a grupos.

## 🚀 Scripts Disponibles

### 1. `create-mateo-user.js`
Script específico para crear el usuario **Mateo Pautasso** con los siguientes datos:

- **Nombre**: Mateo Pautasso
- **Email**: mateo.pautasso@gmail.com
- **Teléfono**: +54 9 11 2560-2009
- **Grupo**: Familia
- **Contraseña temporal**: password123

#### Funcionalidades:
- ✅ Verifica si el usuario ya existe antes de crear
- ✅ Busca un grupo existente llamado "Familia"
- ✅ Si el grupo "Familia" existe, añade al usuario como miembro
- ✅ Si no existe, crea el grupo y asigna al usuario como administrador
- ✅ Manejo de errores y validaciones completas

### 2. `create-basic-users.js`
Script genérico para crear usuarios básicos del sistema.

### 3. `create-test-user.js`
Script para crear un usuario de prueba con credenciales simples.

## 🔧 Ejecución

### Opción 1: Usando PowerShell (Recomendado)
```powershell
# Para Mateo Pautasso
.\create-mateo.ps1
```

### Opción 2: Directamente con Node.js
```powershell
# Cargar variables de entorno y ejecutar
$env:DATABASE_URL = "tu-database-url-aqui"
node scripts/create-mateo-user.js
```

### Opción 3: Usando el script start-dev existente
```powershell
# Si tienes configurado start-dev.ps1
.\start-dev.ps1 && node scripts/create-mateo-user.js
```

## 📊 Resultado del Script Mateo

### ✅ Ejecución Exitosa
```
==============================================
🚀 CREANDO USUARIO MATEO PAUTASSO
==============================================
🔍 Verificando si el usuario ya existe...
🔐 Generando hash de contraseña...
👤 Creando usuario...
✅ Usuario creado exitosamente:
   Nombre: Mateo Pautasso
   Email: mateo.pautasso@gmail.com
   Teléfono: +54 9 11 2560-2009
   ID: cmbbg9j0t0000m81csdvhbhfx
🔍 Buscando grupo Familia existente...
📁 Grupo Familia encontrado (ID: cm7yprpif0001l1033q7fu6f0)
✅ Usuario añadido al grupo Familia existente
==============================================
🎉 PROCESO COMPLETADO EXITOSAMENTE
==============================================
📝 DATOS DE ACCESO:
   Email: mateo.pautasso@gmail.com
   Contraseña temporal: password123
⚠️  IMPORTANTE: Cambiar contraseña en el primer login
==============================================
```

## 🔐 Información de Acceso

| Campo | Valor |
|-------|--------|
| **Email** | mateo.pautasso@gmail.com |
| **Contraseña Temporal** | password123 |
| **Teléfono** | +54 9 11 2560-2009 |
| **Grupo** | Familia |
| **Rol en Grupo** | Miembro (si el grupo ya existía) / Admin (si se creó nuevo) |

> ⚠️ **IMPORTANTE**: La contraseña `password123` es temporal y debe cambiarse en el primer login por seguridad.

## 🛠️ Estructura de Base de Datos

### Usuario Creado
```sql
User {
  id: "cmbbg9j0t0000m81csdvhbhfx"
  name: "Mateo Pautasso"
  email: "mateo.pautasso@gmail.com"
  phoneNumber: "+54 9 11 2560-2009"
  password: "[HASH_BCRYPT]"
  isAdmin: false
}
```

### Relación con Grupo
```sql
GrupoMiembro {
  grupoId: "cm7yprpif0001l1033q7fu6f0"
  userId: "cmbbg9j0t0000m81csdvhbhfx"
  rol: "miembro" | "admin"
}
```

## 🔄 Casos de Uso

### Si el usuario ya existe:
- ✅ El script detecta el usuario existente
- ✅ Verifica su membresía en el grupo "Familia"
- ✅ Si no pertenece al grupo, lo añade automáticamente

### Si el grupo "Familia" no existe:
- ✅ Crea un nuevo grupo llamado "Familia"
- ✅ Asigna al usuario como administrador del grupo
- ✅ Establece la descripción: "Grupo familiar para gestión de gastos compartidos"

### Si el grupo "Familia" ya existe:
- ✅ Añade al usuario como miembro del grupo existente
- ✅ Mantiene la estructura de administración actual

## 🧩 Personalización

Para crear scripts similares para otros usuarios, puedes copiar `create-mateo-user.js` y modificar:

```javascript
const userData = {
  name: 'Nuevo Usuario',
  email: 'nuevo@email.com',
  password: 'password123',
  phoneNumber: '+54 9 11 XXXX-XXXX'
};

const grupoDestino = {
  nombre: 'NombreGrupo',
  descripcion: 'Descripción del grupo'
};
```

## 📋 Requisitos

- Node.js instalado
- Variables de entorno configuradas (DATABASE_URL)
- Acceso a la base de datos PostgreSQL/Neon
- Dependencias instaladas: `prisma`, `bcryptjs`

## 🚨 Troubleshooting

### Error de conexión a base de datos:
```bash
# Verificar variable de entorno
echo $env:DATABASE_URL

# Verificar conectividad con Prisma
npx prisma db push
```

### Error de dependencias:
```bash
# Instalar dependencias faltantes
npm install bcryptjs @prisma/client
```

### Error de permisos PowerShell:
```bash
# Ejecutar directamente con Node.js
node scripts/create-mateo-user.js
``` 