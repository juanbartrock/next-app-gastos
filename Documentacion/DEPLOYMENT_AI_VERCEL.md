# 🚀 Guía de Deployment - IA en Vercel

> **Aplicación**: Sistema de Gestión de Gastos con IA (FASE 3)
> 
> **Plataforma**: Vercel + Neon PostgreSQL + OpenAI

---

## ⚠️ **CONSIDERACIONES CRÍTICAS**

### **1. Límites de Vercel por Plan**

| Plan | Timeout Funciones | Memoria | Bandwidth | OpenAI Compatible |
|------|------------------|---------|-----------|-------------------|
| **Hobby** | 10s | 1024MB | 100GB | ⚠️ Limitado |
| **Pro** | 60s | 3008MB | 1TB | ✅ Recomendado |
| **Enterprise** | 900s | 3008MB | Ilimitado | ✅ Ideal |

**🚨 IMPORTANTE**: Para FASE 3 con IA, se recomienda mínimo **Plan Pro** debido a:
- Timeouts de OpenAI (5-15 segundos)
- Procesamiento de datos complejos
- Múltiples consultas a base de datos

### **2. Configuración de Variables de Entorno**

```bash
# Vercel Dashboard -> Project -> Settings -> Environment Variables

# Database
DATABASE_URL=postgresql://...@ep-...-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require

# Authentication
NEXTAUTH_SECRET=tu-secret-super-seguro-aqui
NEXTAUTH_URL=https://tu-app.vercel.app

# OpenAI (CRÍTICO para FASE 3)
OPENAI_API_KEY=sk-proj-...

# Optional
NEXT_TELEMETRY_DISABLED=1
NODE_ENV=production
```

**⚠️ Verificar**: Que `NEXTAUTH_URL` coincida exactamente con tu dominio de Vercel.

---

## 🔧 **CONFIGURACIÓN OPTIMIZADA**

### **1. Timeouts Configurados en vercel.json**

```json
{
  "functions": {
    "src/app/api/ai/**/route.ts": {
      "maxDuration": 30
    },
    "src/app/api/alertas/evaluate/route.ts": {
      "maxDuration": 25
    },
    "src/app/api/alertas/scheduler/route.ts": {
      "maxDuration": 20
    }
  }
}
```

### **2. Headers de Cache para APIs de IA**

```json
{
  "headers": [
    {
      "source": "/api/ai/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "s-maxage=300, stale-while-revalidate=600" }
      ]
    }
  ]
}
```

### **3. Optimización de Build**

```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next",
      "config": {
        "installCommand": "npm install --legacy-peer-deps",
        "buildCommand": "npx prisma generate && next build"
      }
    }
  ]
}
```

---

## 📊 **MONITOREO Y PERFORMANCE**

### **1. Métricas a Vigilar**

- **Function Duration**: APIs de IA deben mantenerse <30s
- **Memory Usage**: Picos durante análisis de IA
- **Error Rate**: Especialmente errores de OpenAI
- **Bandwidth**: Respuestas JSON grandes de IA

### **2. Logs Importantes**

```bash
# Vercel Dashboard -> Functions -> Ver logs de:
/api/ai/analizar-patrones
/api/ai/recomendaciones
/api/ai/alertas-predictivas
/api/ai/reporte-inteligente
/api/ai/detectar-anomalias
```

### **3. Alertas Recomendadas**

- Timeout de funciones >25s
- Error rate >5% en APIs de IA
- Uso de memoria >2GB
- Respuestas de OpenAI fallidas

---

## 🛡️ **SEGURIDAD EN PRODUCCIÓN**

### **1. Rate Limiting**

```typescript
// Implementar en middleware.ts
export function middleware(request: NextRequest) {
  // Rate limiting para APIs de IA
  if (request.nextUrl.pathname.startsWith('/api/ai')) {
    // Máximo 10 requests por minuto por usuario
    return rateLimitCheck(request)
  }
}
```

### **2. Validación de Entrada**

```typescript
// En cada API de IA
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    // Validación adicional de parámetros
    // ...
  } catch (error) {
    // Log detallado para debugging en Vercel
    console.error('AI API Error:', {
      error: error.message,
      userId: session?.user?.id,
      timestamp: new Date().toISOString()
    })
  }
}
```

### **3. Manejo de Secretos**

- ✅ **OPENAI_API_KEY**: Nunca en código, solo en Vercel env vars
- ✅ **DATABASE_URL**: Con connection pooling habilitado
- ✅ **NEXTAUTH_SECRET**: Generar con crypto strong

---

## 📈 **OPTIMIZACIONES ESPECÍFICAS**

### **1. OpenAI Optimizations**

```typescript
// En AIAnalyzer.ts
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 25000, // 25s timeout (menor que Vercel)
  maxRetries: 2,   // Reintentos automáticos
})
```

### **2. Database Connection Pooling**

```bash
# En DATABASE_URL, asegurar connection pooling
postgresql://user:pass@host/db?sslmode=require&connection_limit=10&pool_timeout=20
```

### **3. Response Optimization**

```typescript
// Reducir tamaño de respuestas JSON
return NextResponse.json({
  success: true,
  data: optimizedData,
  // Omitir metadatos innecesarios en producción
  ...(process.env.NODE_ENV === 'development' && { debug: debugInfo })
})
```

---

## 🚨 **PROBLEMAS COMUNES Y SOLUCIONES**

### **1. Timeout de Funciones**

**Problema**: Function timeout después de 10s
```
Error: Function execution timed out
```

**Solución**:
- Upgrade a Plan Pro de Vercel
- Configurar `maxDuration: 30` en vercel.json
- Optimizar prompts de OpenAI

### **2. Errores de OpenAI**

**Problema**: Rate limiting o API errors
```
Error: Rate limit exceeded for OpenAI
```

**Solución**:
- Implementar exponential backoff
- Cache de resultados temporales
- Manejo de errores robusto

### **3. Memory Limits**

**Problema**: Out of memory durante análisis
```
Error: JavaScript heap out of memory
```

**Solución**:
- Limitar datasets a 100 transacciones
- Procesamiento en chunks
- Optimizar consultas Prisma

### **4. Cold Starts**

**Problema**: Primera ejecución lenta
```
Function cold start delay
```

**Solución**:
- Warmer functions (opcional)
- Optimizar imports
- Lazy loading de dependencias

---

## ✅ **CHECKLIST DE DEPLOYMENT**

### **Pre-Deployment**
- [ ] Variables de entorno configuradas en Vercel
- [ ] `vercel.json` con timeouts optimizados
- [ ] Tests de APIs de IA pasando
- [ ] OpenAI API key válida y con créditos
- [ ] Neon database accesible desde Vercel

### **Post-Deployment**
- [ ] Verificar `/api/ai/*` endpoints responden
- [ ] Test completo en `/test-fase3`
- [ ] Monitorear logs de funciones
- [ ] Verificar performance de OpenAI
- [ ] Confirmar timeouts no se exceden

### **Monitoring Continuo**
- [ ] Dashboard de Vercel Analytics
- [ ] Logs de errores de OpenAI
- [ ] Métricas de uso de IA
- [ ] Performance de base de datos
- [ ] Costos de OpenAI

---

## 💰 **ESTIMACIÓN DE COSTOS**

### **Vercel (Plan Pro - $20/mes)**
- Functions: Incluidas hasta límites
- Bandwidth: 1TB incluido
- ✅ Recomendado para producción

### **OpenAI (Pay-per-use)**
- GPT-3.5-turbo: ~$0.002/1K tokens
- GPT-4o-mini: ~$0.15/1M tokens
- Estimado: $10-50/mes para uso moderado

### **Neon PostgreSQL**
- Plan gratuito: 3GB storage
- Plan Pro: $19/mes para más storage
- ✅ Plan gratuito suficiente inicialmente

**Total Estimado**: $20-90/mes para aplicación completa

---

## 🎯 **RECOMENDACIONES FINALES**

### **Para Producción Inmediata**
1. **Plan Pro de Vercel** (obligatorio para IA)
2. **Monitoring activo** de timeouts y errores
3. **Rate limiting** en APIs de IA
4. **Backup de database** regular

### **Para Escalabilidad**
1. **Implementar cache** de resultados de IA
2. **Queue system** para análisis largos
3. **Horizontal scaling** con edge functions
4. **Analytics** de uso de IA

---

**✅ ¡La aplicación está lista para deployment en Vercel con IA!**

La configuración actual soporta todas las funcionalidades de FASE 3 con OpenAI, incluyendo análisis de patrones, recomendaciones, alertas predictivas y reportes inteligentes. 