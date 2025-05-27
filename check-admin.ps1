# Script para verificar si un usuario es administrador
# Uso: .\check-admin.ps1 usuario@email.com

param(
    [Parameter(Mandatory=$true)]
    [string]$Email
)

# Verificar que el archivo .env existe
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: No se encontró el archivo .env" -ForegroundColor Red
    Write-Host "📝 Asegúrate de tener configuradas las variables de entorno" -ForegroundColor Yellow
    exit 1
}

# Cargar variables de entorno desde .env
Write-Host "🔧 Cargando variables de entorno..." -ForegroundColor Cyan

Get-Content .env | ForEach-Object {
    if ($_ -match "^([^#][^=]*)\s*=\s*(.*)$") {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        # Remover comillas si existen
        $value = $value -replace '^["\']|["\']$', ''
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

# Verificar que DATABASE_URL está configurada
$databaseUrl = $env:DATABASE_URL
if (-not $databaseUrl) {
    Write-Host "❌ Error: DATABASE_URL no está configurada" -ForegroundColor Red
    Write-Host "📝 Configura DATABASE_URL en tu archivo .env" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Información del script:" -ForegroundColor Cyan
Write-Host "   - Email a verificar: $Email" -ForegroundColor White
Write-Host "   - Base de datos: Configurada ✓" -ForegroundColor Green
Write-Host ""

Write-Host "🔍 Verificando estado de administrador..." -ForegroundColor Green

# Ejecutar el script de Node.js
try {
    node scripts/check-admin.js $Email
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host ""
        Write-Host "✅ Verificación completada" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ La verificación terminó con errores (código: $exitCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error al ejecutar la verificación: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📝 Comandos útiles:" -ForegroundColor Cyan
Write-Host "   - Hacer admin: .\make-admin.ps1 $Email" -ForegroundColor White
Write-Host "   - Verificar nuevamente: .\check-admin.ps1 $Email" -ForegroundColor White 