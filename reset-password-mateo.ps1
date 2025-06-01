# Script para resetear la contraseña de Mateo Pautasso
# Ejecutar desde: C:\Users\PJN\Desktop\Proyectos\next-app-gastos

Write-Host "===========================================" -ForegroundColor Green
Write-Host "🔄 RESETEO DE CONTRASEÑA - MATEO PAUTASSO" -ForegroundColor Green  
Write-Host "===========================================" -ForegroundColor Green

# Verificar que estamos en el directorio correcto
if (-not (Test-Path ".\package.json")) {
    Write-Host "❌ ERROR: No se encontró package.json" -ForegroundColor Red
    Write-Host "   Asegúrate de ejecutar desde el directorio del proyecto" -ForegroundColor Yellow
    pause
    exit 1
}

# Verificar que existe el script
if (-not (Test-Path ".\scripts\reset-password-mateo.js")) {
    Write-Host "❌ ERROR: No se encontró el script reset-password-mateo.js" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "📋 Verificaciones previas:" -ForegroundColor Cyan
Write-Host "   ✅ Directorio del proyecto: OK" -ForegroundColor Green
Write-Host "   ✅ Script de reseteo: OK" -ForegroundColor Green
Write-Host ""

# Cargar variables de entorno desde .env si existe
Write-Host "🔧 Configurando variables de entorno..." -ForegroundColor Cyan

if (Test-Path ".env") {
    Write-Host "   Cargando variables desde .env..." -ForegroundColor Yellow
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
    Write-Host "   Usando DATABASE_URL por defecto" -ForegroundColor Yellow
}

if ([string]::IsNullOrEmpty($env:NEXTAUTH_SECRET)) {
    $env:NEXTAUTH_SECRET="Ncaf95kXGB2vxISwNRXMYHZsOV0BXM4Z"
    Write-Host "   Usando NEXTAUTH_SECRET por defecto" -ForegroundColor Yellow
}

# Verificar que las variables están configuradas
Write-Host "   ✅ DATABASE_URL configurada: $($env:DATABASE_URL.Substring(0,50))..." -ForegroundColor Green
Write-Host "   ✅ NEXTAUTH_SECRET configurada: $($env:NEXTAUTH_SECRET.Substring(0,20))..." -ForegroundColor Green
Write-Host ""

# Confirmar antes de ejecutar
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "   - Se reseteará la contraseña de Mateo Pautasso" -ForegroundColor White
Write-Host "   - Nueva contraseña temporal: mateo123" -ForegroundColor White
Write-Host "   - Debe cambiarla en el primer login" -ForegroundColor White
Write-Host ""

$confirmacion = Read-Host "¿Continuar con el reseteo? (s/N)"
if ($confirmacion -ne "s" -and $confirmacion -ne "S") {
    Write-Host "❌ Operación cancelada por el usuario" -ForegroundColor Yellow
    pause
    exit 0
}

Write-Host ""
Write-Host "🚀 Ejecutando reseteo de contraseña..." -ForegroundColor Cyan

# Ejecutar el script de Node.js
node scripts/reset-password-mateo.js

$exitCode = $LASTEXITCODE

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "🎉 Reseteo completado exitosamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error durante el reseteo (código: $exitCode)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor Gray
pause 