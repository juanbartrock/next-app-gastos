# Script mejorado para iniciar Next.js con variables de entorno
Write-Host "Configurando variables de entorno..." -ForegroundColor Green

# Configurar variables de entorno
$env:DATABASE_URL="postgresql://neondb_owner:npg_0vBJYCp8lIbq@ep-holy-brook-acnscqwx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
$env:NEXTAUTH_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
$env:NEXTAUTH_URL="http://localhost:3000"
$env:OPENAI_API_KEY=""

# Verificar que las variables están configuradas
Write-Host "[OK] DATABASE_URL configurada: $($env:DATABASE_URL.Substring(0,50))..." -ForegroundColor Yellow
Write-Host "[OK] NEXTAUTH_SECRET configurada: $($env:NEXTAUTH_SECRET.Substring(0,20))..." -ForegroundColor Yellow
Write-Host "[OK] NEXTAUTH_URL configurada: $env:NEXTAUTH_URL" -ForegroundColor Yellow

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