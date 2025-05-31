# Script para crear el usuario Mateo Pautasso
# Ejecuta el script de Node.js con las variables de entorno necesarias

Write-Host "🚀 INICIANDO CREACIÓN DE USUARIO MATEO PAUTASSO" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Verificar si el archivo .env existe
if (-not (Test-Path ".env")) {
    Write-Host "❌ ERROR: Archivo .env no encontrado" -ForegroundColor Red
    Write-Host "   Asegúrate de estar en el directorio del proyecto" -ForegroundColor Yellow
    exit 1
}

# Verificar si Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js detectado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Node.js no está instalado o no está en el PATH" -ForegroundColor Red
    exit 1
}

# Verificar si el script existe
if (-not (Test-Path "scripts/create-mateo-user.js")) {
    Write-Host "❌ ERROR: Script create-mateo-user.js no encontrado" -ForegroundColor Red
    Write-Host "   Ruta esperada: scripts/create-mateo-user.js" -ForegroundColor Yellow
    exit 1
}

# Cargar variables de entorno desde .env
Write-Host "🔧 Cargando variables de entorno..." -ForegroundColor Blue
$envContent = Get-Content ".env"
foreach ($line in $envContent) {
    if ($line -match "^([^=]+)=(.*)$") {
        $key = $matches[1]
        $value = $matches[2]
        # Remover comillas si existen
        $value = $value -replace '^"(.*)"$', '$1'
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

# Verificar DATABASE_URL
$databaseUrl = [Environment]::GetEnvironmentVariable("DATABASE_URL", "Process")
if (-not $databaseUrl) {
    Write-Host "❌ ERROR: DATABASE_URL no encontrada en .env" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Variables de entorno cargadas correctamente" -ForegroundColor Green

# Ejecutar el script
Write-Host ""
Write-Host "🚀 Ejecutando script de creación..." -ForegroundColor Blue
Write-Host "=================================================" -ForegroundColor Blue

try {
    # Ejecutar el script de Node.js
    node scripts/create-mateo-user.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "🎉 SCRIPT EJECUTADO EXITOSAMENTE" -ForegroundColor Green
        Write-Host "=================================================" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ ERROR EN LA EJECUCIÓN DEL SCRIPT" -ForegroundColor Red
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