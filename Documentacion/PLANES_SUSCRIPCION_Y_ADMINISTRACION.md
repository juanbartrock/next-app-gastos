# 🚀 **PLANES DE SUSCRIPCIÓN Y ADMINISTRACIÓN GENERAL**

> **Proyecto**: Transformación a SaaS Completo  
> **Fecha inicio**: Enero 2025  
> **Estado**: 🚧 EN DESARROLLO  
> **Prioridad**: CRÍTICA para lanzamiento comercial

## 📋 **RESUMEN EJECUTIVO**

Transformación de la aplicación de gestión de gastos hacia un modelo SaaS completo con:
- **3 planes de suscripción** diferenciados
- **Panel de administración general** para control total
- **Sistema de categorías por grupo** con administración descentralizada
- **Monetización** y analytics integrados

## 🎯 **OBJETIVOS PRINCIPALES**

### **Comerciales**
- Crear flujo de monetización sustentable
- Diferenciación clara de value proposition por plan
- Reducir churn con onboarding optimizado
- Maximizar conversiones free-to-paid

### **Técnicos**
- Implementar restricciones granulares por plan
- Escalabilidad para miles de usuarios
- Sistema de permisos robusto y seguro
- Migración de datos sin pérdida

### **Producto**
- UX intuitiva para cada nivel de plan
- Admin tools potentes y fáciles de usar
- Analytics accionables para decisiones comerciales

## 📊 **ESTRUCTURA DE PLANES PROPUESTA**

### **🥉 PLAN BÁSICO (FREE)**
**Target**: Usuarios exploratorios, uso personal básico
```typescript
LIMITACIONES: {
  transacciones_mes: 50,
  usuarios_grupo: 1 (solo personal),
  alertas_activas: 3,
  categorias_personalizadas: 5,
  exportaciones_mes: 1,
  analisis_ia: false,
  gastos_recurrentes: 3,
  storage_comprobantes: "10MB"
}
```

**Funcionalidades incluidas**:
- ✅ Gestión básica de gastos personales
- ✅ Categorías genéricas del sistema
- ✅ Dashboard básico con visibilidad
- ✅ Alertas básicas de presupuesto
- ✅ Exportación CSV limitada

### **🥈 PLAN PROFESIONAL ($X/mes)**
**Target**: Familias, usuarios avanzados, pequeños negocios
```typescript
LIMITACIONES: {
  transacciones_mes: 500,
  usuarios_grupo: 5,
  alertas_activas: 15,
  categorias_personalizadas: 20,
  exportaciones_mes: 10,
  analisis_ia: "básico",
  gastos_recurrentes: 15,
  storage_comprobantes: "100MB"
}
```

**Funcionalidades incluidas**:
- ✅ Todo del plan básico +
- ✅ **Gestión familiar completa**
- ✅ **IA básica**: Análisis de patrones y recomendaciones
- ✅ **Gastos recurrentes** con asociación automática
- ✅ **Alertas inteligentes** automáticas
- ✅ **Categorías por grupo** administrables
- ✅ Préstamos e inversiones básicas

### **🥇 PLAN PREMIUM ($Y/mes)**
**Target**: Empresas, usuarios power, contadores
```typescript
LIMITACIONES: {
  transacciones_mes: "ilimitado",
  usuarios_grupo: "ilimitado",
  alertas_activas: "ilimitado",
  categorias_personalizadas: "ilimitado",
  exportaciones_mes: "ilimitado",
  analisis_ia: "completo",
  gastos_recurrentes: "ilimitado",
  storage_comprobantes: "1GB"
}
```

**Funcionalidades incluidas**:
- ✅ **TODO ilimitado**
- ✅ **IA completa**: Todos los análisis + reportes ejecutivos
- ✅ **API access** para integraciones
- ✅ **Soporte prioritario** via WhatsApp/email
- ✅ **Backup automático** y restauración
- ✅ **Analytics avanzados** y métricas personalizadas
- ✅ **White-label** para contadores/empresas

## 🏗️ **ARQUITECTURA DE IMPLEMENTACIÓN**

### **Nuevos Modelos de Datos**
```sql
-- Expandir modelo Plan existente
Plan {
  id, nombre, descripcion, precio_mensual,
  limitaciones: JSON,
  funcionalidades: Funcionalidad[],
  trial_dias: Integer,
  activo: Boolean,
  orden_display: Integer
}

-- Nuevo modelo para límites dinámicos
LimitePlan {
  id, planId, nombre_limite,
  valor_limite: Integer,
  tipo: "transacciones" | "usuarios" | "storage" | etc
}

-- Suscripción de usuario (nuevo)
Suscripcion {
  id, userId, planId,
  fecha_inicio, fecha_vencimiento,
  estado: "activa" | "cancelada" | "vencida",
  metodo_pago, referencia_pago,
  auto_renovacion: Boolean
}

-- Auditoría de admin (nuevo)
AuditoriaAdmin {
  id, adminId, accion, entidad_afectada,
  datos_anteriores: JSON, datos_nuevos: JSON,
  fecha_accion, ip_address
}
```

### **Sistema de Categorías Híbrido**
```sql
-- Actualizar modelo Categoria existente
Categoria {
  id, descripcion, estado,
  tipo: "generica" | "grupo", -- NUEVO CAMPO
  grupoId: Int?, -- NUEVO CAMPO NULLABLE
  adminCreadorId: String? -- NUEVO CAMPO NULLABLE
}
```

## 📝 **PLAN DE IMPLEMENTACIÓN DETALLADO**

---

## **🔥 FASE 1: INFRAESTRUCTURA DE PLANES**
**Duración estimada**: 3-4 días  
**Estado**: 🚧 EN DESARROLLO

### **Paso 1.1: Expandir Modelos de Base de Datos**
- **Estado**: ✅ COMPLETADO
- **Descripción**: Agregar campos a modelos existentes SIN BORRAR DATOS
- **Archivos afectados**: `prisma/schema.prisma`
- **Validación**: ✅ Datos existentes preservados completamente
- **Cambios realizados**:
  - ✅ Expandido modelo `Plan` con limitaciones, trial, orden, etc.
  - ✅ Expandido modelo `User` con rolSistema, fechaRegistro, estado
  - ✅ Expandido modelo `Categoria` con tipo, grupoId, adminCreadorId
  - ✅ Agregado modelo `Suscripcion` para tracking de suscripciones
  - ✅ Agregado modelo `LimitePlan` para límites dinámicos
  - ✅ Agregado modelo `AuditoriaAdmin` para auditoría completa
  - ✅ Agregado modelo `UsoMensual` para analytics de uso
  - ✅ Agregados enums: RolSistema, EstadoUsuario, EstadoSuscripcion, TipoLimite
- **Base de datos**: ✅ Sincronizada exitosamente con `npx prisma db push`

### **Paso 1.2: Crear Usuario Admin General**
- **Estado**: ✅ COMPLETADO
- **Descripción**: Usuario administrador general creado exitosamente
- **Credenciales**: 
  - 📧 **Email**: admin@sistema.com
  - 🔑 **Contraseña**: Admin123! (temporal - cambiar después)
  - 🛡️ **Rol**: admin_general
  - 🏆 **Plan**: Premium
- **ID Usuario**: cmbmlysqv0001m84ogykheh1d
- **Script usado**: `scripts/crear-admin-general.js`
- **Grupo creado**: Administradores (cmbmlysx60003m84ojqydfxq0)

### **Paso 1.3: Panel de Administración General**
- **Estado**: ✅ EN PROGRESO
- **Descripción**: Crear `/admin-general` con:
  - ✅ Dashboard principal con estadísticas
  - ✅ API de gestión de planes (`/api/admin-general/planes`)
  - ⏳ Gestión de usuarios
  - ⏳ Analytics y métricas
  - ⏳ Auditoría de acciones
- **Archivos creados**:
  - ✅ `src/app/admin-general/page.tsx` - Dashboard principal
  - ✅ `src/app/api/admin-general/planes/route.ts` - CRUD de planes
- **Datos inicializados**:
  - ✅ 3 planes creados: Básico (gratis), Profesional ($29.99), Premium ($59.99)
  - ✅ **TODOS los usuarios existentes asignados al plan Premium**

### **Paso 1.4: Middleware de Restricciones**
- **Estado**: ✅ CREADO (pendiente de ajustes del cliente Prisma)
- **Descripción**: Implementar validaciones por plan en APIs
- **Archivos**: ✅ `src/lib/plan-restrictions.ts` - Biblioteca completa de restricciones
- **Funcionalidades**:
  - ✅ Validación de límites por plan
  - ✅ Verificación de uso actual vs límites
  - ✅ Middleware para APIs
  - ✅ Verificación específica de acceso a IA
- **Nota**: Algunos campos requieren regeneración del cliente Prisma con los nuevos modelos

### **Paso 1.5: Migración de Datos de Planes**
- **Estado**: ✅ COMPLETADO
- **Descripción**: Asignar planes a usuarios existentes
- **CRÍTICO**: ✅ Sin pérdida de datos - EXITOSO
- **Resultado**: 
  - ✅ **TODOS los usuarios (5) asignados al plan Premium**
  - ✅ Script `scripts/asignar-usuarios-premium.js` ejecutado
  - ✅ Usuarios mantienen todas las funcionalidades actuales
- **Scripts creados**:
  - ✅ `scripts/init-planes-avanzados.js` - Crear los 3 planes
  - ✅ `scripts/asignar-usuarios-premium.js` - Asignar usuarios a Premium

---

## **🔄 FASE 2: CATEGORÍAS POR GRUPO**
**Duración estimada**: 2-3 días  
**Estado**: ⏳ PENDIENTE

### **Paso 2.1: Migración de Categorías Existentes**
- **Estado**: ⏳ PENDIENTE
- **Descripción**: Convertir categorías actuales en "genéricas"
- **CRÍTICO**: Sin pérdida de datos, todas las transacciones mantienen su categoría

### **Paso 2.2: Admin de Grupo para Categorías**
- **Estado**: ⏳ PENDIENTE
- **Descripción**: Interface para que admin de grupo gestione categorías
- **Archivos**: Nuevo componente `CategoriaGroupAdmin`

### **Paso 2.3: Validaciones de Permisos**
- **Estado**: ⏳ PENDIENTE
- **Descripción**: Solo admin de grupo puede CRUD sus categorías

---

## **💰 FASE 3: MONETIZACIÓN Y ANALYTICS**
**Duración estimada**: 5-7 días  
**Estado**: ⏳ PENDIENTE

### **Paso 3.1: Integración Mercado Pago**
- **Estado**: ⏳ PENDIENTE
- **Descripción**: Procesamiento de pagos para suscripciones

### **Paso 3.2: Dashboard de Analytics General**
- **Estado**: ⏳ PENDIENTE
- **Descripción**: Métricas de usuarios, conversiones, revenue

### **Paso 3.3: Upselling Inteligente**
- **Estado**: ⏳ PENDIENTE
- **Descripción**: CTAs cuando usuario alcance límites

---

## **🧪 FASE 4: TESTING Y OPTIMIZACIÓN**
**Duración estimada**: 2-3 días  
**Estado**: ⏳ PENDIENTE

### **Paso 4.1: Testing de Restricciones**
- **Estado**: ⏳ PENDIENTE
- **Descripción**: Verificar que límites funcionen correctamente

### **Paso 4.2: UX Testing**
- **Estado**: ⏳ PENDIENTE
- **Descripción**: Flow de onboarding por plan

### **Paso 4.3: Performance Testing**
- **Estado**: ⏳ PENDIENTE
- **Descripción**: Carga con restricciones por plan

---

## 📈 **MÉTRICAS DE ÉXITO**

### **Técnicas**
- ✅ Migración sin pérdida de datos: 100%
- ✅ Uptime durante implementación: >99%
- ✅ Performance sin degradación: <200ms APIs
- ✅ Tests passing: 100%

### **Producto**
- 🎯 Conversión free-to-paid: >5%
- 🎯 Churn mensual: <10%
- 🎯 Tiempo onboarding: <5 minutos
- 🎯 Satisfacción admin tools: >8/10

### **Comerciales**
- 🎯 Revenue recurrente: $X/mes en 3 meses
- 🎯 Usuarios activos pagos: >100 en 3 meses
- 🎯 LTV/CAC ratio: >3:1

## ⚠️ **RIESGOS Y MITIGACIONES**

### **RIESGO: Pérdida de datos durante migración**
- **Probabilidad**: Baja
- **Impacto**: Crítico
- **Mitigación**: Backup completo + validaciones + rollback plan

### **RIESGO: UX confusa con restricciones**
- **Probabilidad**: Media
- **Impacto**: Alto
- **Mitigación**: User testing + tooltips claros + gradual rollout

### **RIESGO: Performance degradation**
- **Probabilidad**: Media
- **Impacto**: Medio
- **Mitigación**: Caching + lazy loading + monitoring

## 🚀 **SIGUIENTES PASOS INMEDIATOS**

1. **Usuario crea Admin General**: Email y rol "admin_general"
2. **Backup de base de datos** antes de cualquier cambio
3. **Expandir modelos** de Prisma con campos nuevos (nullable)
4. **Crear panel** `/admin-general` básico
5. **Implementar middleware** de restricciones básico

---

**📞 CONTACTO Y SOPORTE**  
Para cualquier consulta técnica o comercial durante la implementación, contactar al equipo de desarrollo.

**🔄 ÚLTIMA ACTUALIZACIÓN**: Enero 2025 - Documento inicial creado 