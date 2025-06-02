# Script para aplicar cambios del esquema de Prisma a la base de datos
$env:DATABASE_URL="postgresql://neondb_owner:npg_0vBJYCp8lIbq@ep-holy-brook-acnscqwx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
$env:NEXTAUTH_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
$env:NEXTAUTH_URL="http://localhost:3000"

Write-Host "Aplicando cambios del esquema de Prisma a la base de datos..."
Write-Host "DATABASE_URL configurada: $($env:DATABASE_URL.Substring(0,50))..."

npx prisma db push

Write-Host "Generando cliente de Prisma..."
npx prisma generate 