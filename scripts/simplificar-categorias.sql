-- Script para simplificar el modelo de categorías
-- Eliminar campos redundantes y confusos

-- 1. Verificar estado actual
SELECT 
    'ANTES' as momento,
    COUNT(*) as total_categorias,
    COUNT(CASE WHEN "esGenerica" = true THEN 1 END) as genericas,
    COUNT(CASE WHEN "esGenerica" = false THEN 1 END) as personales,
    COUNT("userId") as con_userid,
    COUNT("adminCreadorId") as con_admin,
    COUNT("grupoId") as con_grupo
FROM "Categoria" 
WHERE "activa" = true;

-- 2. Normalizar datos existentes
-- Asegurar que todas las categorías no genéricas tengan userId
UPDATE "Categoria" 
SET "userId" = "adminCreadorId"
WHERE "userId" IS NULL 
AND "adminCreadorId" IS NOT NULL 
AND "esGenerica" = false;

-- 3. Limpiar campo 'tipo' ya que tenemos 'esGenerica' y 'esPrivada'
UPDATE "Categoria" 
SET "tipo" = NULL;

-- 4. Limpiar grupoId (no se está usando en la lógica actual)
UPDATE "Categoria" 
SET "grupoId" = NULL;

-- 5. Verificar estado final
SELECT 
    'DESPUES' as momento,
    COUNT(*) as total_categorias,
    COUNT(CASE WHEN "esGenerica" = true THEN 1 END) as genericas,
    COUNT(CASE WHEN "esGenerica" = false THEN 1 END) as personales,
    COUNT("userId") as con_userid,
    COUNT("adminCreadorId") as con_admin,
    COUNT("grupoId") as con_grupo
FROM "Categoria" 
WHERE "activa" = true;

-- 6. Mostrar categorías problemáticas (si las hay)
SELECT 
    id, 
    descripcion, 
    "esGenerica", 
    "userId", 
    "adminCreadorId"
FROM "Categoria" 
WHERE "activa" = true 
AND "esGenerica" = false 
AND "userId" IS NULL; 