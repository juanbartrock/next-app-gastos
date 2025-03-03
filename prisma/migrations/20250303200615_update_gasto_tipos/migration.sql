/*
  Warnings:

  - You are about to drop the column `tipo` on the `Gasto` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Gasto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "concepto" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoria" TEXT NOT NULL,
    "tipoTransaccion" TEXT NOT NULL DEFAULT 'expense',
    "tipoMovimiento" TEXT NOT NULL DEFAULT 'efectivo',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT,
    "grupoId" TEXT,
    CONSTRAINT "Gasto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Gasto_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "Grupo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Gasto" ("categoria", "concepto", "createdAt", "fecha", "grupoId", "id", "monto", "updatedAt", "userId") SELECT "categoria", "concepto", "createdAt", "fecha", "grupoId", "id", "monto", "updatedAt", "userId" FROM "Gasto";
DROP TABLE "Gasto";
ALTER TABLE "new_Gasto" RENAME TO "Gasto";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
