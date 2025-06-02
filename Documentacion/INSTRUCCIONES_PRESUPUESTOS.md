# Solución para el Problema de Presupuestos

## Problema Identificado
El API de presupuestos está fallando porque el modelo `Presupuesto` no existe en la base de datos, aunque ya está definido en el esquema de Prisma.

## Solución

### Paso 1: Aplicar el esquema a la base de datos
Ejecuta el siguiente comando desde el directorio raíz del proyecto:

```powershell
powershell -ExecutionPolicy Bypass -File .\db-push.ps1
```

O alternativamente:

```powershell
# Cargar variables de entorno
$env:DATABASE_URL="postgresql://neondb_owner:npg_0vBJYCp8lIbq@ep-holy-brook-acnscqwx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"

# Aplicar cambios del esquema
npx prisma db push

# Generar cliente de Prisma
npx prisma generate
```

### Paso 2: Restaurar el código del API
Una vez aplicado el esquema, descomenta las líneas en `src/app/api/presupuestos/route.ts`:

1. **En la función GET**: Restaurar la consulta a `prisma.presupuesto.findMany()`
2. **En la función POST**: Restaurar la lógica de creación de presupuestos

## Estado Actual
- ✅ **Esquema actualizado**: El modelo `Presupuesto` está definido en `prisma/schema.prisma`
- ✅ **Relaciones configuradas**: Usuario ↔ Presupuesto, Categoría ↔ Presupuesto
- ⏳ **Pendiente**: Aplicar cambios a la base de datos
- ⏳ **Pendiente**: Restaurar código del API

## Modelo Presupuesto
```prisma
model Presupuesto {
  id          String     @id @default(cuid())
  nombre      String     // Nombre descriptivo del presupuesto
  monto       Float      // Monto presupuestado
  mes         Int        // Mes del presupuesto (1-12)
  año         Int        // Año del presupuesto
  categoriaId Int        // Categoría asociada
  userId      String     // Usuario propietario del presupuesto
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  categoria   Categoria  @relation(fields: [categoriaId], references: [id], onDelete: Cascade)
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, categoriaId, mes, año])
}
```

## Funcionalidades que incluirá
- ✅ Crear presupuestos mensuales por categoría
- ✅ Evitar duplicados (un presupuesto por categoría/mes/año)
- ✅ Calcular gasto actual vs presupuesto
- ✅ Mostrar porcentaje consumido
- ✅ Mostrar monto disponible

Una vez ejecutado `npx prisma db push`, los presupuestos funcionarán completamente. 