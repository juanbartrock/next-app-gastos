# 💳 FinanzIA - Integración MercadoPago - Documentación Completa

## 🎯 Estado: ✅ COMPLETADO Y FUNCIONAL

**Fecha de integración**: Enero 2025  
**Entorno**: Sandbox configurado, listo para producción  
**Compatibilidad**: Next.js 15, PostgreSQL, Argentina

---

## 📋 **Resumen de la Integración**

### ✅ **Funcionalidades Implementadas**
- 🔹 **Creación de pagos** para suscripciones de planes
- 🔹 **Webhook handler** para notificaciones automáticas
- 🔹 **Páginas de resultado** (éxito, fallo, pendiente)
- 🔹 **Verificación de pagos** y estados
- 🔹 **Base de datos** integrada con modelos específicos
- 🔹 **Configuración opcional** (no afecta build)
- 🔹 **Manejo de errores** robusto

### 🏗️ **Arquitectura**

```
┌─ Frontend ─────────────────────┐    ┌─ Backend APIs ─────────────┐    ┌─ MercadoPago ─────┐
│                                │    │                            │    │                   │
│ /planes                        │───▶│ POST /api/suscripciones/   │───▶│ Preferences API   │
│ (Selección de plan)           │    │      crear-pago            │    │                   │
│                                │    │                            │    │                   │
│ Link de pago MercadoPago      │◀───│ GET /api/suscripciones/    │◀───│ Payments API      │
│                                │    │     verificar-pago         │    │                   │
│                                │    │                            │    │                   │
│ /suscripcion/exito            │◀───│ POST /api/mercadopago/     │◀───│ Webhooks         │
│ /suscripcion/fallo            │    │      webhook               │    │                   │
│ /suscripcion/pendiente        │    │                            │    │                   │
└────────────────────────────────┘    └────────────────────────────┘    └───────────────────┘
```

---

## 🔧 **Configuración**

### **Variables de Entorno**
```bash
# MercadoPago Argentina
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxx    # Sandbox
MERCADOPAGO_PUBLIC_KEY=TEST-xxxxx      # Frontend (opcional)

# Para producción (cambiar TEST por APP)
MERCADOPAGO_ACCESS_TOKEN=APP-xxxxx     # Producción
MERCADOPAGO_PUBLIC_KEY=APP-xxxxx       # Producción
```

### **URLs de Webhook** (configurar en MercadoPago Dashboard)
```
Sandbox: https://tu-app.vercel.app/api/mercadopago/webhook
Producción: https://tu-dominio.com/api/mercadopago/webhook
```

---

## 🗄️ **Base de Datos**

### **Modelos Principales**

#### **PagoSuscripcionMP**
```sql
- id: String (PK)
- userId: String (FK → User)
- suscripcionId: String (FK → Suscripcion)
- planId: String (FK → Plan)
- concepto: String
- monto: Float

-- MercadoPago específico
- mpPaymentId: Int (único, asignado por MP)
- mpPreferenceId: String (ID de preferencia)
- mpStatus: EstadoPagoMP (PENDING, APPROVED, etc.)
- mpExternalReference: String (referencia única)
- mpPaymentType: TipoPagoMP
- mpPaymentMethod: String

-- Metadatos
- tipoPago: String (inicial, renovacion, etc.)
- mesFacturado: Int
- añoFacturado: Int
- fechaCreacion: DateTime
- fechaPago: DateTime
```

#### **WebhookMercadoPago**
```sql
- id: String (PK)
- pagoSuscripcionId: String (FK)
- mpResource: String
- mpTopic: String
- mpId: String
- webhookData: Json
- procesado: Boolean
- fechaRecibido: DateTime
```

#### **Enums**
```typescript
enum EstadoPagoMP {
  PENDING, APPROVED, REJECTED, CANCELLED, IN_PROCESS, REFUNDED
}

enum TipoPagoMP {
  CREDIT_CARD, DEBIT_CARD, CASH, BANK_TRANSFER, DIGITAL_WALLET, OTHER
}
```

---

## 🚀 **APIs Implementadas**

### **1. Crear Pago** 
```typescript
POST /api/suscripciones/crear-pago

Body: {
  planId: string,
  tipoPago?: 'inicial' | 'renovacion',
  montoCustom?: number,
  conceptoCustom?: string
}

Response: {
  success: true,
  payment_id: string,
  preference_id: string,
  init_point: string,    // URL para pagar
  external_reference: string,
  success_url: string,
  failure_url: string,
  pending_url: string
}
```

### **2. Verificar Pago**
```typescript
GET /api/suscripciones/verificar-pago?paymentId=123

Response: {
  found: boolean,
  payment?: {
    id: string,
    status: EstadoPagoMP,
    monto: number,
    fechaPago?: Date
  }
}
```

### **3. Webhook**
```typescript
POST /api/mercadopago/webhook

Headers: {
  'x-signature': string,    // Verificación de seguridad
  'x-request-id': string
}

Body: {
  resource: string,
  topic: string,
  id: string,
  live_mode: boolean
}
```

---

## 🌐 **Páginas de Resultado**

### **Éxito** (`/suscripcion/exito`)
- ✅ Confirmación de pago exitoso
- 📊 Detalles del plan activado
- 🔗 Redirección automática al dashboard

### **Fallo** (`/suscripcion/fallo`)
- ❌ Mensaje de error amigable
- 🔄 Opción para reintentar
- 📞 Información de contacto

### **Pendiente** (`/suscripcion/pendiente`)
- ⏳ Estado de pago en proceso
- 🔄 Auto-refresh cada 30 segundos
- 📧 Notificación de seguimiento

---

## 🔐 **Seguridad**

### **Validaciones Implementadas**
- ✅ Verificación de sesión de usuario
- ✅ Validación de planes existentes
- ✅ External reference único por transacción
- ✅ Verificación de webhooks (headers MP)
- ✅ Transacciones atómicas en BD

### **Manejo de Errores**
- 🔹 **401**: Usuario no autenticado
- 🔹 **400**: Datos inválidos o plan no encontrado
- 🔹 **503**: MercadoPago no configurado
- 🔹 **500**: Error interno (con logs detallados)

---

## 🧪 **Testing**

### **Datos de Prueba (Sandbox)**
```typescript
// Tarjetas de test que APRUEBAN
Visa: 4509 9535 6623 3704
Mastercard: 5031 7557 3453 0604
CVV: 123
Vencimiento: 11/25
Titular: APRO

// Tarjetas de test que RECHAZAN
Visa: 4000 0000 0000 0002
Titular: OTHE
```

### **Flujo de Testing**
1. 🎯 Usar página `/planes` 
2. 🔘 Seleccionar plan premium
3. 💳 Completar con datos de test
4. ✅ Verificar redirección a `/suscripcion/exito`
5. 📊 Confirmar actualización en BD

---

## 🚀 **Deployment a Producción**

### **Checklist Pre-Deploy**
- [ ] Cambiar credenciales TEST → APP
- [ ] Configurar webhook URL en MP Dashboard
- [ ] Verificar variables de entorno en Vercel
- [ ] Probar flujo completo en staging
- [ ] Configurar monitoring de pagos

### **Variables Vercel**
```bash
MERCADOPAGO_ACCESS_TOKEN=APP-xxxxx
MERCADOPAGO_PUBLIC_KEY=APP-xxxxx
NEXTAUTH_URL=https://tu-dominio.com
```

### **Configuración MercadoPago Dashboard**
- 🔹 **Webhooks**: https://tu-dominio.com/api/mercadopago/webhook
- 🔹 **URLs de retorno**: Automáticas (configuradas en código)
- 🔹 **Métodos de pago**: Todos habilitados

---

## 📈 **Monitoreo y Logs**

### **Logs Importantes**
```typescript
// Creación exitosa
✅ Pago creado exitosamente: { payment_id, preference_id, init_point }

// Webhook recibido
🔔 Webhook MercadoPago: { topic, resource, id }

// Error en creación
❌ Error creando pago: { error, details }
```

### **Métricas a Monitorear**
- 📊 Tasa de conversión de pagos
- 💰 Revenue por plan
- 🔄 Rechazos y reintentos
- ⏱️ Tiempo de procesamiento

---

## 🆘 **Troubleshooting**

### **Problemas Comunes**

#### 🔸 "No podés pagarte a vos mismo"
**Causa**: Usuario logueado en MP en el mismo navegador  
**Solución**: Usar ventana incógnito o logout de MP

#### 🔸 "auto_return invalid. back_url.success must be defined"
**Causa**: URLs no válidas para auto_return  
**Solución**: Comentar `auto_return` en desarrollo local

#### 🔸 Error 503 "MercadoPago no configurado"
**Causa**: Variable MERCADOPAGO_ACCESS_TOKEN no definida  
**Solución**: Configurar variable en .env o Vercel

#### 🔸 Webhook no recibe notificaciones
**Causa**: URL mal configurada en MP Dashboard  
**Solución**: Verificar URL pública y HTTPS

---

## 🔮 **Próximas Mejoras**

### **Fase 4 - Expansión de Pagos**
- [ ] 🔄 **Suscripciones recurrentes** automáticas
- [ ] 💰 **Split payments** para gastos grupales  
- [ ] 🎁 **Códigos promocionales** con descuentos
- [ ] 📱 **QR de pago** para pagos rápidos
- [ ] 🏦 **Integración bancaria** (CBU/CVU)
- [ ] 📧 **Notificaciones email** automáticas
- [ ] 📊 **Analytics avanzados** de pagos

---

## 📞 **Soporte**

**Documentación MercadoPago**: https://www.mercadopago.com.ar/developers  
**Estado de la integración**: ✅ COMPLETADO  
**Última actualización**: Enero 2025 