-- CreateTable
CREATE TABLE "Financiacion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gastoId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "cantidadCuotas" INTEGER NOT NULL,
    "cuotasPagadas" INTEGER NOT NULL DEFAULT 0,
    "cuotasRestantes" INTEGER NOT NULL,
    "montoCuota" REAL NOT NULL,
    "fechaPrimerPago" DATETIME,
    "fechaProximoPago" DATETIME,
    "diaPago" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Financiacion_gastoId_fkey" FOREIGN KEY ("gastoId") REFERENCES "Gasto" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Financiacion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Financiacion_gastoId_key" ON "Financiacion"("gastoId");
