# 💳 Propuesta: Sistema de Financiación con Tarjetas Mejorado

## 🎯 Problema Actual
- Las financiaciones no distinguen entre diferentes tarjetas
- Al pagar una tarjeta específica, las cuotas de otras tarjetas aparecen mezcladas
- No hay forma de saber qué cuotas corresponden a qué tarjeta
- Falta granularidad en el control de pagos por tarjeta

## 🚀 Solución Propuesta

### OPCIÓN 1: Campo Tarjeta Simple (Recomendada para implementación rápida)

#### Cambios en Base de Datos
```sql
-- Agregar campo nombreTarjeta a Financiacion
ALTER TABLE Financiacion ADD COLUMN nombreTarjeta TEXT;
```

#### Actualización del Modelo Prisma
```prisma
model Financiacion {
  id               Int       @id @default(autoincrement())
  gastoId          Int       @unique
  userId           String
  nombreTarjeta    String?   // NUEVO CAMPO
  cantidadCuotas   Int
  cuotasPagadas    Int       @default(0)
  cuotasRestantes  Int
  montoCuota       Float
  fechaPrimerPago  DateTime?
  fechaProximoPago DateTime?
  diaPago          Int?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  gasto            Gasto     @relation(fields: [gastoId], references: [id], onDelete: Cascade)
  user             User      @relation(fields: [userId], references: [id])
}
```

#### Modificaciones en ExpenseForm
```typescript
// Agregar campo para nombre de tarjeta cuando tipo es "tarjeta"
const [nombreTarjeta, setNombreTarjeta] = useState("")

// En el JSX, agregar después del select de tipo de movimiento:
{movementType === "tarjeta" && (
  <div className="space-y-2">
    <Label htmlFor="nombreTarjeta">Nombre de la Tarjeta</Label>
    <Input
      id="nombreTarjeta"
      type="text"
      value={nombreTarjeta}
      onChange={(e) => setNombreTarjeta(e.target.value)}
      placeholder="Ej: Visa Banco Macro, Mastercard BBVA"
    />
  </div>
)}

// Al crear la financiación, incluir nombreTarjeta:
const financiacionResponse = await fetch('/api/financiacion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    gastoId: data.id,
    cantidadCuotas: parseInt(cantidadCuotas),
    montoCuota,
    fechaPrimerPago: parsedFechaPrimerPago,
    diaPago: diaPago ? parseInt(diaPago) : null,
    nombreTarjeta: nombreTarjeta.trim() || null
  })
})
```

#### Mejoras en Página de Financiación
```typescript
// Agrupar financiaciones por tarjeta
const financiacionesPorTarjeta = financiaciones.reduce((acc, fin) => {
  const tarjeta = fin.nombreTarjeta || 'Sin especificar'
  if (!acc[tarjeta]) acc[tarjeta] = []
  acc[tarjeta].push(fin)
  return acc
}, {} as Record<string, Financiacion[]>)

// Mostrar pestañas o secciones por tarjeta
return (
  <div>
    {Object.entries(financiacionesPorTarjeta).map(([nombreTarjeta, financiaciones]) => (
      <Card key={nombreTarjeta} className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {nombreTarjeta}
          </CardTitle>
          <CardDescription>
            {financiaciones.length} financiación(es) activa(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tabla específica para esta tarjeta */}
          <FinanciacionTable financiaciones={financiaciones} />
        </CardContent>
      </Card>
    ))}
  </div>
)
```

### OPCIÓN 2: Modelo Tarjeta Completo (Más robusto)

#### Nuevo Modelo Tarjeta
```prisma
model Tarjeta {
  id               String         @id @default(cuid())
  nombre           String         // "Visa Banco Macro"
  entidad          String         // "Banco Macro"
  tipo             String         // "Visa", "Mastercard", "Amex"
  numero           String?        // Últimos 4 dígitos
  fechaVencimiento DateTime?
  diaCorte         Int?          // Día del mes de corte
  diaPago          Int?          // Día del mes de pago
  limiteCredito    Float?
  userId           String
  activa           Boolean        @default(true)
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  
  financiaciones   Financiacion[]
  user             User           @relation(fields: [userId], references: [id])
  
  @@unique([userId, nombre])
}

model Financiacion {
  id               Int       @id @default(autoincrement())
  gastoId          Int       @unique
  userId           String
  tarjetaId        String?   // Relación con Tarjeta
  cantidadCuotas   Int
  cuotasPagadas    Int       @default(0)
  cuotasRestantes  Int
  montoCuota       Float
  fechaPrimerPago  DateTime?
  fechaProximoPago DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  
  gasto            Gasto     @relation(fields: [gastoId], references: [id], onDelete: Cascade)
  tarjeta          Tarjeta?  @relation(fields: [tarjetaId], references: [id])
  user             User      @relation(fields: [userId], references: [id])
}
```

### OPCIÓN 3: Sistema de Pagos de Tarjetas (Más avanzado)

#### Nuevo Modelo PagoTarjeta
```prisma
model PagoTarjeta {
  id               String         @id @default(cuid())
  tarjetaId        String
  fechaPago        DateTime
  montoPagado      Float
  tipoMovimiento   String         @default("digital")
  concepto         String?        // "Pago mínimo", "Pago total", etc.
  userId           String
  createdAt        DateTime       @default(now())
  
  tarjeta          Tarjeta        @relation(fields: [tarjetaId], references: [id])
  user             User           @relation(fields: [userId], references: [id])
  cuotasPagadas    CuotaPagada[]  // Relación con cuotas específicas
}

model CuotaPagada {
  id               String         @id @default(cuid())
  financiacionId   Int
  pagoTarjetaId    String
  montoPagado      Float          // Parte del pago que se aplicó a esta cuota
  fechaPago        DateTime
  
  financiacion     Financiacion   @relation(fields: [financiacionId], references: [id])
  pagoTarjeta      PagoTarjeta    @relation(fields: [pagoTarjetaId], references: [id])
  
  @@unique([financiacionId, pagoTarjetaId])
}
```

## 🎯 Recomendación

**OPCIÓN 1** es la más práctica para implementar de inmediato:
- ✅ Cambio mínimo en la base de datos
- ✅ Fácil de implementar en formularios existentes
- ✅ Soluciona el problema principal
- ✅ Compatible con el sistema actual

## 🛠️ Implementación Paso a Paso

### Paso 1: Actualizar Base de Datos
```bash
# Agregar columna a tabla existente
npx prisma db push
```

### Paso 2: Actualizar Formulario de Gastos
- Agregar campo "Nombre de Tarjeta" cuando tipo es "tarjeta"
- Validar que se ingrese nombre si es financiación

### Paso 3: Actualizar API de Financiación
- Incluir `nombreTarjeta` en creación
- Filtrar por tarjeta en consultas

### Paso 4: Mejorar Página de Financiación
- Agrupar por tarjeta
- Mostrar totales por tarjeta
- Filtros por tarjeta específica

## 🎪 Flujo Mejorado

```typescript
// Usuario crea gasto tipo "tarjeta"
1. Selecciona "Tarjeta" en tipo de movimiento
2. Ingresa "Visa Banco Macro" en nombre de tarjeta
3. Configura cuotas y fechas
4. Sistema crea financiación con nombreTarjeta

// Usuario ve financiaciones
1. Sección "Visa Banco Macro" con sus cuotas
2. Sección "Mastercard BBVA" con sus cuotas  
3. Totales separados por tarjeta
4. Puede pagar cuotas específicas por tarjeta

// Usuario paga tarjeta
1. Selecciona tarjeta específica
2. Ve solo las cuotas de esa tarjeta
3. Marca cuotas como pagadas
4. Sistema actualiza solo esa tarjeta
```

¿Te parece bien esta propuesta? ¿Prefieres empezar con la Opción 1 o te interesa alguna de las otras? 