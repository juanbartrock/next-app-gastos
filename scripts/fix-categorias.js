const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixCategorias() {
  try {
    console.log('🔧 Iniciando arreglo de categorías...')
    
    // 1. Buscar categorías sin userId pero con adminCreadorId
    const categoriasSinUserId = await prisma.$queryRaw`
      SELECT id, descripcion, "adminCreadorId" 
      FROM "Categoria" 
      WHERE "userId" IS NULL 
      AND "adminCreadorId" IS NOT NULL 
      AND "esGenerica" = false
    `
    
    console.log(`📋 Encontradas ${categoriasSinUserId.length} categorías sin userId`)
    
    if (categoriasSinUserId.length > 0) {
      // 2. Actualizar las categorías para asignar userId = adminCreadorId
      const result = await prisma.$queryRaw`
        UPDATE "Categoria" 
        SET "userId" = "adminCreadorId"
        WHERE "userId" IS NULL 
        AND "adminCreadorId" IS NOT NULL 
        AND "esGenerica" = false
      `
      
      console.log('✅ Categorías actualizadas:', result)
    }
    
    // 3. Mostrar resumen final
    const resumen = await prisma.$queryRaw`
      SELECT 
        "esGenerica",
        COUNT(*) as total,
        COUNT("userId") as con_userid,
        COUNT("adminCreadorId") as con_admin
      FROM "Categoria" 
      WHERE "activa" = true
      GROUP BY "esGenerica"
      ORDER BY "esGenerica"
    `
    
    console.log('📊 Resumen final de categorías:')
    console.table(resumen)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixCategorias() 