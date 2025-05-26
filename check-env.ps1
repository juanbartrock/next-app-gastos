# Script para verificar variables de entorno
Write-Host "Verificando configuracion de variables de entorno..." -ForegroundColor Cyan

$errores = @()

# Verificar variables requeridas
$variablesRequeridas = @{
    "DATABASE_URL" = $env:DATABASE_URL
    "NEXTAUTH_SECRET" = $env:NEXTAUTH_SECRET  
    "NEXTAUTH_URL" = $env:NEXTAUTH_URL
}

foreach ($variable in $variablesRequeridas.GetEnumerator()) {
    if ([string]::IsNullOrEmpty($variable.Value)) {
        $errores += "[ERROR] $($variable.Key) no esta configurada"
    } else {
        if ($variable.Key -eq "DATABASE_URL") {
            Write-Host "[OK] $($variable.Key): $($variable.Value.Substring(0,50))..." -ForegroundColor Green
        } elseif ($variable.Key -eq "NEXTAUTH_SECRET") {
            Write-Host "[OK] $($variable.Key): $($variable.Value.Substring(0,20))..." -ForegroundColor Green
        } else {
            Write-Host "[OK] $($variable.Key): $($variable.Value)" -ForegroundColor Green
        }
    }
}

if ($errores.Count -gt 0) {
    Write-Host "`nErrores encontrados:" -ForegroundColor Red
    $errores | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    Write-Host "`nSoluciones:" -ForegroundColor Yellow
    Write-Host "  1. Ejecuta: .\start-dev.ps1" -ForegroundColor Yellow
    Write-Host "  2. O crea un archivo .env.local con las variables" -ForegroundColor Yellow
    Write-Host "  3. O configura las variables manualmente antes de npm run dev" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "`nTodas las variables estan configuradas correctamente!" -ForegroundColor Green
    Write-Host "Puedes ejecutar npm run dev con seguridad" -ForegroundColor Green
} 