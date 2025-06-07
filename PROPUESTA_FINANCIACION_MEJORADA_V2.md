# 💳 Propuesta V2: Sistema de Financiación sin Duplicación de Gastos

## 🚨 Problema Real Identificado

### Duplicación de Gastos
```
❌ FLUJO ACTUAL (PROBLEMÁTICO):
1. Usuario paga tarjeta: "Pago Visa Macro $50,000" (1 gasto)
2. Usuario marca cuotas pagadas en /financiacion
3. Sistema genera: "Cuota 1/12", "Cuota 2/12", etc. (N gastos más)
4. RESULTADO: Gastos duplicados! 💥
```

### Falta de Especificidad en Tarjetas
```
❌ PROBLEMA ACTUAL:
- "Visa" → ¿Visa Macro o Visa Ciudad?
- "Mastercard" → ¿Mastercard BBVA o Mastercard Galicia?
```

## 🚀 Solución Integral Propuesta

### OPCIÓN A: Vinculación de Pagos (Recomendada)

#### 1. Nuevo Modelo: PagoTarjeta
```prisma
model PagoTarjeta {
  id                String              @id @default(cuid())
  concepto          String              // "Pago Tarjeta Visa Macro"
  monto             Float
  fecha             DateTime
  tipoMovimiento    String              @default("digital")
  tarjetaEspecifica String              // "Visa Macro", "Visa Ciudad", "Mastercard BBVA"
  userId            String
  gastoId           Int                 @unique // Vinculado al gasto real del pago
  createdAt         DateTime            @default(now())
  
  gasto             Gasto               @relation(fields: [gastoId], references: [id])
  user              User                @relation(fields: [userId], references: [id])
  cuotasVinculadas  CuotaVinculada[]    // Cuotas que se pagaron con este pago
}

model CuotaVinculada {
  id               String         @id @default(cuid())
  financiacionId   Int
  pagoTarjetaId    String
  montoCuota       Float          // Monto de esta cuota específica
  fechaVinculacion DateTime       @default(now())
  
  financiacion     Financiacion   @relation(fields: [financiacionId], references: [id])
  pagoTarjeta      PagoTarjeta    @relation(fields: [pagoTarjetaId], references: [id])
  
  @@unique([financiacionId, pagoTarjetaId])
}
```

#### 2. Actualización Modelo Financiacion
```prisma
model Financiacion {
  id                 Int                @id @default(autoincrement())
  gastoId            Int                @unique
  userId             String
  tarjetaEspecifica  String             // "Visa Macro", "Visa Ciudad", "Mastercard BBVA"
  cantidadCuotas     Int
  cuotasPagadas      Int                @default(0)
  cuotasRestantes    Int
  montoCuota         Float
  fechaPrimerPago    DateTime?
  fechaProximoPago   DateTime?
  diaPago            Int?
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt
  
  gasto              Gasto              @relation(fields: [gastoId], references: [id], onDelete: Cascade)
  user               User               @relation(fields: [userId], references: [id])
  cuotasVinculadas   CuotaVinculada[]   // Cuotas ya pagadas
}
```

### OPCIÓN B: Marcado Simple sin Duplicación

#### Nuevo Campo en Financiacion
```prisma
model Financiacion {
  // ... campos existentes
  tarjetaEspecifica  String     // "Visa Macro", "Visa Ciudad"
  pagoVinculadoId    Int?       // ID del gasto que pagó esta financiación
  
  pagoVinculado      Gasto?     @relation("PagoFinanciacion", fields: [pagoVinculadoId], references: [id])
}
```

## 🎯 Flujos de Uso Mejorados

### Flujo A: Crear Gasto Financiado
```typescript
// 1. Usuario crea gasto tipo "tarjeta"
Usuario selecciona: "Tarjeta"
Usuario especifica: "Visa Macro" (dropdown con sus tarjetas)
Usuario configura: 12 cuotas, primer pago, etc.

// 2. Sistema crea financiación
financiacion = {
  gastoId: gastoCreado.id,
  tarjetaEspecifica: "Visa Macro",
  cantidadCuotas: 12,
  montoCuota: 8333.33
}
```

### Flujo B: Registrar Pago de Tarjeta (NUEVO)
```typescript
// Página: /financiacion/pagar-tarjeta

// 1. Usuario crea gasto normal de pago de tarjeta
gastoPago = crear_gasto({
  concepto: "Pago Tarjeta Visa Macro",
  monto: 50000,
  categoria: "Pago Tarjeta",
  tipoMovimiento: "digital"
})

// 2. Usuario selecciona cuotas a vincular
cuotasSeleccionadas = [
  { financiacionId: 1, montoCuota: 8333 },  // Cuota 1
  { financiacionId: 2, montoCuota: 8333 },  // Cuota 2
  { financiacionId: 3, montoCuota: 8334 }   // Cuota 3
]

// 3. Sistema vincula sin crear gastos adicionales
pagoTarjeta = crear_pago_tarjeta({
  gastoId: gastoPago.id,
  tarjetaEspecifica: "Visa Macro",
  cuotasVinculadas: cuotasSeleccionadas
})

// 4. Sistema actualiza financiaciones
actualizar_financiaciones(cuotasSeleccionadas)
```

### Flujo C: Ver Estado de Financiaciones
```typescript
// Página: /financiacion (MEJORADA)

financiacionesPorTarjeta = {
  "Visa Macro": [
    {
      id: 1,
      concepto: "Supermercado",
      cuotasPagadas: 3,  // Vinculadas a pagos reales
      cuotasRestantes: 9,
      ultimoPago: "15/01/2025 - Pago Tarjeta $50,000"  // Referencia al gasto real
    }
  ],
  "Visa Ciudad": [
    {
      id: 2,
      concepto: "Viaje",
      cuotasPagadas: 0,
      cuotasRestantes: 24,
      ultimoPago: null
    }
  ]
}
```

## 🛠️ Implementación Paso a Paso

### Paso 1: Actualizar Base de Datos
```sql
-- Agregar campo para identificar tarjeta específica
ALTER TABLE Financiacion ADD COLUMN tarjetaEspecifica TEXT;

-- Crear tabla para pagos de tarjeta (Opción A)
CREATE TABLE PagoTarjeta (
  id TEXT PRIMARY KEY,
  concepto TEXT NOT NULL,
  monto REAL NOT NULL,
  fecha DATETIME NOT NULL,
  tarjetaEspecifica TEXT NOT NULL,
  userId TEXT NOT NULL,
  gastoId INTEGER UNIQUE NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla para vincular cuotas pagadas
CREATE TABLE CuotaVinculada (
  id TEXT PRIMARY KEY,
  financiacionId INTEGER NOT NULL,
  pagoTarjetaId TEXT NOT NULL,
  montoCuota REAL NOT NULL,
  fechaVinculacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(financiacionId, pagoTarjetaId)
);
```

### Paso 2: Crear API para Pago de Tarjeta
```typescript
// POST /api/financiacion/pagar-tarjeta
export async function POST(request: NextRequest) {
  const { 
    concepto,
    monto,
    tarjetaEspecifica,
    cuotasSeleccionadas,
    tipoMovimiento 
  } = await request.json()

  // 1. Crear gasto real del pago
  const gastoPago = await prisma.gasto.create({
    data: {
      concepto,
      monto,
      categoria: "Pago Tarjeta",
      tipoMovimiento,
      userId: usuario.id
    }
  })

  // 2. Crear registro de pago de tarjeta
  const pagoTarjeta = await prisma.pagoTarjeta.create({
    data: {
      concepto,
      monto,
      tarjetaEspecifica,
      gastoId: gastoPago.id,
      userId: usuario.id
    }
  })

  // 3. Vincular cuotas SIN crear gastos adicionales
  for (const cuota of cuotasSeleccionadas) {
    await prisma.cuotaVinculada.create({
      data: {
        financiacionId: cuota.financiacionId,
        pagoTarjetaId: pagoTarjeta.id,
        montoCuota: cuota.montoCuota
      }
    })

    // 4. Actualizar contadores de financiación
    await prisma.financiacion.update({
      where: { id: cuota.financiacionId },
      data: {
        cuotasPagadas: { increment: 1 },
        cuotasRestantes: { decrement: 1 }
      }
    })
  }

  return NextResponse.json({ pagoTarjeta, gastoPago })
}
```

### Paso 3: Nueva Página de Pago de Tarjeta
```typescript
// /financiacion/pagar-tarjeta/page.tsx

export default function PagarTarjetaPage() {
  const [tarjetaSeleccionada, setTarjetaSeleccionada] = useState("")
  const [financiacionesPendientes, setFinanciacionesPendientes] = useState([])
  const [cuotasSeleccionadas, setCuotasSeleccionadas] = useState([])
  const [montoPago, setMontoPago] = useState("")

  // Cargar financiaciones pendientes por tarjeta
  useEffect(() => {
    if (tarjetaSeleccionada) {
      fetch(`/api/financiacion?tarjeta=${tarjetaSeleccionada}&pendientes=true`)
        .then(res => res.json())
        .then(setFinanciacionesPendientes)
    }
  }, [tarjetaSeleccionada])

  return (
    <div>
      <h1>Registrar Pago de Tarjeta</h1>
      
      {/* Selector de tarjeta específica */}
      <Select value={tarjetaSeleccionada} onValueChange={setTarjetaSeleccionada}>
        <SelectItem value="Visa Macro">Visa Macro</SelectItem>
        <SelectItem value="Visa Ciudad">Visa Ciudad</SelectItem>
        <SelectItem value="Mastercard BBVA">Mastercard BBVA</SelectItem>
      </Select>

      {/* Input de monto pagado */}
      <Input 
        type="number"
        value={montoPago}
        onChange={(e) => setMontoPago(e.target.value)}
        placeholder="Monto pagado"
      />

      {/* Lista de cuotas pendientes para seleccionar */}
      {financiacionesPendientes.map(fin => (
        <Card key={fin.id}>
          <CardContent>
            <Checkbox 
              checked={cuotasSeleccionadas.includes(fin.id)}
              onCheckedChange={(checked) => {
                if (checked) {
                  setCuotasSeleccionadas([...cuotasSeleccionadas, fin.id])
                } else {
                  setCuotasSeleccionadas(cuotasSeleccionadas.filter(id => id !== fin.id))
                }
              }}
            />
            <span>{fin.gasto.concepto} - Cuota ${fin.montoCuota}</span>
          </CardContent>
        </Card>
      ))}

      <Button onClick={handlePagarTarjeta}>
        Registrar Pago y Vincular Cuotas
      </Button>
    </div>
  )
}
```

## 🎯 Ventajas de esta Propuesta

### ✅ Ventajas
- **No duplica gastos**: Un solo gasto por el pago real de tarjeta
- **Trazabilidad completa**: Sabe exactamente qué cuotas se pagaron y cuándo
- **Flexibilidad**: Puede pagar cuotas parciales o mezcladas
- **Especificidad**: Diferencia "Visa Macro" de "Visa Ciudad"
- **Histórico**: Mantiene relación entre pagos reales y cuotas

### ✅ Casos de Uso Soportados
- ✅ Pago mínimo de tarjeta (solo algunas cuotas)
- ✅ Pago total de tarjeta (todas las cuotas pendientes)
- ✅ Pago parcial mixto (cuotas de diferentes compras)
- ✅ Múltiples tarjetas del mismo banco
- ✅ Histórico de qué se pagó y cuándo

## 🤔 ¿Qué te parece esta propuesta?

1. **¿Resuelve el problema de duplicación de gastos?**
2. **¿La especificidad de tarjetas es suficiente?**
3. **¿Prefieres Opción A (completa) u Opción B (simple)?**
4. **¿Quieres que empecemos la implementación?**

La complejidad es media-alta, pero el valor es muy alto para un uso real del sistema. 🎯 