# Script mejorado para iniciar Next.js con variables de entorno
Write-Host "Configurando variables de entorno..." -ForegroundColor Green

# Cargar variables de entorno desde .env si existe
if (Test-Path ".env") {
    Write-Host "Cargando variables desde .env..." -ForegroundColor Cyan
    Get-Content .env | ForEach-Object {
        if ($_ -match "^([^#][^=]*)\s*=\s*(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            # Remover comillas si existen
            $value = $value -replace '^["'']|["'']$', ''
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

# Configurar valores por defecto para variables faltantes
if ([string]::IsNullOrEmpty($env:DATABASE_URL)) {
    $env:DATABASE_URL="postgresql://neondb_owner:npg_0vBJYCp8lIbq@ep-holy-brook-acnscqwx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
}

if ([string]::IsNullOrEmpty($env:NEXTAUTH_SECRET)) {
    $env:NEXTAUTH_SECRET="Ncaf95kXGB2vxISwNRXMYHZsOV0BXM4Z"
    Write-Host "[INFO] Usando NEXTAUTH_SECRET por defecto" -ForegroundColor Cyan
}

if ([string]::IsNullOrEmpty($env:NEXTAUTH_URL)) {
    $env:NEXTAUTH_URL="http://localhost:3000"
    Write-Host "[INFO] Usando NEXTAUTH_URL por defecto" -ForegroundColor Cyan
}

# Verificar que las variables están configuradas
Write-Host "[OK] DATABASE_URL configurada: $($env:DATABASE_URL.Substring(0,50))..." -ForegroundColor Yellow
Write-Host "[OK] NEXTAUTH_SECRET configurada: $($env:NEXTAUTH_SECRET.Substring(0,20))..." -ForegroundColor Yellow
Write-Host "[OK] NEXTAUTH_URL configurada: $env:NEXTAUTH_URL" -ForegroundColor Yellow

# Verificar OpenAI API Key
if ([string]::IsNullOrEmpty($env:OPENAI_API_KEY)) {
    Write-Host "[AVISO] OPENAI_API_KEY no configurada" -ForegroundColor Yellow
    Write-Host "        Para habilitar IA avanzada, configura tu API key de OpenAI en el archivo .env" -ForegroundColor Yellow
} else {
    Write-Host "[OK] OPENAI_API_KEY configurada: $($env:OPENAI_API_KEY.Substring(0,10))..." -ForegroundColor Green
}

# Limpiar caché de Next.js si existe
if (Test-Path ".next") {
    Write-Host "Limpiando cache de Next.js..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
}

Write-Host "Iniciando Next.js..." -ForegroundColor Green
Write-Host "La aplicacion estara disponible en: http://localhost:3000" -ForegroundColor Magenta
Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Red
Write-Host ""

# Iniciar el servidor
npm run dev 