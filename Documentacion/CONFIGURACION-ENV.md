# 🔧 Configuración de Variables de Entorno

## 📋 Guía de Configuración

### 🚀 Configuración Rápida para Desarrollo

1. **Copia el archivo de ejemplo:**
   ```bash
   copy start-dev.ps1.example start-dev.ps1
   ```

2. **Configura las variables esenciales:**
   - `DATABASE_URL`: Conexión a PostgreSQL/Neon (REQUERIDO)
   - `NEXTAUTH_SECRET`: Secreto para autenticación (REQUERIDO)
   - `NEXTAUTH_URL`: URL de la aplicación (REQUERIDO)
   - `OPENAI_API_KEY`: Clave para asistente IA (OPCIONAL)
   - `TWILIO_*`: Configuración para notificaciones SMS (OPCIONAL)

### 🎯 Variables por Funcionalidad

#### 🔐 Autenticación (NextAuth.js)
- **NEXTAUTH_SECRET**: Secreto para firmar tokens JWT
- **NEXTAUTH_URL**: URL base de la aplicación

#### 🗄️ Base de Datos (PostgreSQL/Neon)
- **DATABASE_URL**: String de conexión completo con SSL

#### 🤖 Inteligencia Artificial (OpenAI)
- **OPENAI_API_KEY**: Para el asistente financiero inteligente

#### 📱 Notificaciones (Twilio)
- **TWILIO_ACCOUNT_SID**: ID de cuenta de Twilio
- **TWILIO_AUTH_TOKEN**: Token de autenticación
- **TWILIO_PHONE_NUMBER**: Número de teléfono verificado

### Variables de Entorno Requeridas:

```bash
# Base de datos PostgreSQL (Neon)
DATABASE_URL="postgresql://usuario:password@host/database?sslmode=require"

# NextAuth.js
NEXTAUTH_SECRET="tu-secreto-nextauth-aqui"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI API (opcional, para asesor financiero)
OPENAI_API_KEY="sk-proj-tu-clave-openai-aqui"

# Twilio (opcional, para notificaciones SMS)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""

# Configuración OCR
USE_OCR_FALLBACK="true"
```

## Seguridad

⚠️ **IMPORTANTE**: 
- Nunca subas archivos con claves API reales al repositorio
- El archivo `start-dev.ps1` está en `.gitignore` para evitar exponer secretos
- Usa `start-dev.ps1.example` como plantilla

## Uso

Una vez configurado, ejecuta:
```bash
./start-dev.ps1
``` 