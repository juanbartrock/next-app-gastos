-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "phoneNumber" TEXT,
    "planId" TEXT,
    CONSTRAINT "User_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Grupo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "adminId" TEXT NOT NULL,
    CONSTRAINT "Grupo_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GrupoMiembro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grupoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'miembro',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GrupoMiembro_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "Grupo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GrupoMiembro_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Gasto" (
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
    "categoriaId" INTEGER,
    CONSTRAINT "Gasto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Gasto_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "Grupo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Gasto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "descripcion" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "grupo_categoria" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GastoRecurrente" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "concepto" TEXT NOT NULL,
    "periodicidad" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "comentario" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "categoriaId" INTEGER,
    "proximaFecha" DATETIME,
    "ultimoPago" DATETIME,
    CONSTRAINT "GastoRecurrente_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GastoRecurrente_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

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

-- CreateTable
CREATE TABLE "Presupuesto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "categoriaId" INTEGER,
    "mes" INTEGER NOT NULL,
    "año" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Presupuesto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Presupuesto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Servicio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "monto" REAL NOT NULL,
    "medioPago" TEXT NOT NULL,
    "tarjeta" TEXT,
    "fechaCobro" DATETIME,
    "fechaVencimiento" DATETIME,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Servicio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Promocion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "urlOrigen" TEXT,
    "descuento" REAL,
    "porcentajeAhorro" REAL,
    "fechaVencimiento" DATETIME,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" DATETIME NOT NULL,
    "servicioId" INTEGER,
    "estado" TEXT NOT NULL DEFAULT 'active',
    CONSTRAINT "Promocion_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServicioAlternativo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "monto" REAL NOT NULL,
    "urlOrigen" TEXT,
    "promocionId" INTEGER NOT NULL,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" DATETIME NOT NULL,
    CONSTRAINT "ServicioAlternativo_promocionId_fkey" FOREIGN KEY ("promocionId") REFERENCES "Promocion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TipoInversion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "icono" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT,
    CONSTRAINT "TipoInversion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Inversion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "montoInicial" REAL NOT NULL,
    "montoActual" REAL NOT NULL,
    "rendimientoTotal" REAL NOT NULL DEFAULT 0,
    "rendimientoAnual" REAL,
    "fechaInicio" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" DATETIME,
    "estado" TEXT NOT NULL DEFAULT 'activa',
    "tipoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plataforma" TEXT,
    "notas" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inversion_tipoId_fkey" FOREIGN KEY ("tipoId") REFERENCES "TipoInversion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Inversion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TransaccionInversion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inversionId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descripcion" TEXT,
    "comprobante" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TransaccionInversion_inversionId_fkey" FOREIGN KEY ("inversionId") REFERENCES "Inversion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CotizacionInversion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inversionId" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fuente" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CotizacionInversion_inversionId_fkey" FOREIGN KEY ("inversionId") REFERENCES "Inversion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GastoDetalle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gastoId" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" REAL NOT NULL DEFAULT 1,
    "precioUnitario" REAL,
    "subtotal" REAL NOT NULL,
    "seguimiento" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GastoDetalle_gastoId_fkey" FOREIGN KEY ("gastoId") REFERENCES "Gasto" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Prestamo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entidadFinanciera" TEXT NOT NULL,
    "tipoCredito" TEXT NOT NULL,
    "montoSolicitado" REAL NOT NULL,
    "montoAprobado" REAL NOT NULL,
    "montoDesembolsado" REAL NOT NULL,
    "saldoActual" REAL NOT NULL,
    "tasaInteres" REAL NOT NULL,
    "plazoMeses" INTEGER NOT NULL,
    "cuotaMensual" REAL NOT NULL,
    "cuotasPagadas" INTEGER NOT NULL DEFAULT 0,
    "cuotasPendientes" INTEGER NOT NULL,
    "fechaDesembolso" DATETIME NOT NULL,
    "fechaPrimeraCuota" DATETIME NOT NULL,
    "fechaProximaCuota" DATETIME,
    "fechaVencimiento" DATETIME NOT NULL,
    "diaPago" INTEGER,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "proposito" TEXT,
    "garantia" TEXT,
    "seguroVida" BOOLEAN NOT NULL DEFAULT false,
    "seguroDesempleo" BOOLEAN NOT NULL DEFAULT false,
    "comisiones" REAL DEFAULT 0,
    "gastosNotariales" REAL DEFAULT 0,
    "numeroCredito" TEXT,
    "observaciones" TEXT,
    "documentos" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Prestamo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PagoPrestamo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prestamoId" TEXT NOT NULL,
    "numeroCuota" INTEGER NOT NULL,
    "montoPagado" REAL NOT NULL,
    "montoCapital" REAL NOT NULL,
    "montoInteres" REAL NOT NULL,
    "montoSeguro" REAL DEFAULT 0,
    "montoComision" REAL DEFAULT 0,
    "fechaPago" DATETIME NOT NULL,
    "fechaVencimiento" DATETIME NOT NULL,
    "diasMora" INTEGER DEFAULT 0,
    "interesMora" REAL DEFAULT 0,
    "metodoPago" TEXT,
    "comprobante" TEXT,
    "observaciones" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PagoPrestamo_prestamoId_fkey" FOREIGN KEY ("prestamoId") REFERENCES "Prestamo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "esPago" BOOLEAN NOT NULL DEFAULT false,
    "precioMensual" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Funcionalidad" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "slug" TEXT NOT NULL,
    "icono" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FuncionalidadPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planId" TEXT NOT NULL,
    "funcionalidadId" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FuncionalidadPlan_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FuncionalidadPlan_funcionalidadId_fkey" FOREIGN KEY ("funcionalidadId") REFERENCES "Funcionalidad" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "GrupoMiembro_grupoId_userId_key" ON "GrupoMiembro"("grupoId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Financiacion_gastoId_key" ON "Financiacion"("gastoId");

-- CreateIndex
CREATE UNIQUE INDEX "Presupuesto_categoriaId_mes_año_userId_key" ON "Presupuesto"("categoriaId", "mes", "año", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TipoInversion_nombre_userId_key" ON "TipoInversion"("nombre", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CotizacionInversion_inversionId_fecha_key" ON "CotizacionInversion"("inversionId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Funcionalidad_slug_key" ON "Funcionalidad"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "FuncionalidadPlan_planId_funcionalidadId_key" ON "FuncionalidadPlan"("planId", "funcionalidadId");
