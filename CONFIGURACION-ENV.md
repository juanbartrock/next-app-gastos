# Configuración de Variables de Entorno

## Archivos de Configuración

### Para desarrollo local:

1. **Copia el archivo de ejemplo:**
   ```bash
   copy start-dev.ps1.example start-dev.ps1
   ```

2. **Edita `start-dev.ps1` con tus valores reales:**
   - `DATABASE_URL`: Tu URL de conexión a PostgreSQL/Neon
   - `NEXTAUTH_SECRET`: Un secreto aleatorio para NextAuth.js
   - `NEXTAUTH_URL`: URL de tu aplicación (http://localhost:3000 para desarrollo)
   - `OPENAI_API_KEY`: Tu clave API de OpenAI (opcional)
   - `TWILIO_*`: Configuración de Twilio para SMS (opcional)

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