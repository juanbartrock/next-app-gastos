# Script para resetear la contraseña de Monica Alvarez
# Ejecuta el script de Node.js con las variables de entorno necesarias

Write-Host "🔄 INICIANDO RESETEO DE CONTRASEÑA MONICA ALVAREZ" -ForegroundColor Red
Write-Host "=================================================" -ForegroundColor Red

# Cargar variables de entorno
Write-Host "🔧 Configurando variables de entorno..." -ForegroundColor Blue

# DATABASE_URL
if ([string]::IsNullOrEmpty($env:DATABASE_URL)) {
    $env:DATABASE_URL="postgresql://neondb_owner:npg_0vBJYCp8lIbq@ep-holy-brook-acnscqwx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
}

# NEXTAUTH_SECRET
if ([string]::IsNullOrEmpty($env:NEXTAUTH_SECRET)) {
    $env:NEXTAUTH_SECRET="Ncaf95kXGB2vxISwNRXMAA8iVRHZm1vcxvjPGCLpBqE="
}

Write-Host "[OK] DATABASE_URL configurada: $($env:DATABASE_URL.Substring(0,50))..." -ForegroundColor Yellow
Write-Host "[OK] NEXTAUTH_SECRET configurada: $($env:NEXTAUTH_SECRET.Substring(0,20))..." -ForegroundColor Yellow

# Verificar si Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js detectado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Node.js no está instalado o no está en el PATH" -ForegroundColor Red
    exit 1
}

# Verificar si el script existe
if (-not (Test-Path "scripts/reset-password-monica.js")) {
    Write-Host "❌ ERROR: Script reset-password-monica.js no encontrado" -ForegroundColor Red
    Write-Host "   Ruta esperada: scripts/reset-password-monica.js" -ForegroundColor Yellow
    exit 1
}

# Ejecutar el script
Write-Host ""
Write-Host "🚀 Ejecutando reseteo de contraseña..." -ForegroundColor Blue
Write-Host "=================================================" -ForegroundColor Blue

try {
    # Ejecutar el script de Node.js
    node scripts/reset-password-monica.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "🎉 RESETEO EJECUTADO EXITOSAMENTE" -ForegroundColor Green
        Write-Host "=================================================" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ ERROR EN LA EJECUCIÓN DEL RESETEO" -ForegroundColor Red
        Write-Host "Código de salida: $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host ""
    Write-Host "❌ ERROR AL EJECUTAR EL SCRIPT:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 