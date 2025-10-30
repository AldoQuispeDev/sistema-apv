-- CreateTable
CREATE TABLE `Usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `apellidoP` VARCHAR(191) NOT NULL,
    `apellidoM` VARCHAR(191) NOT NULL,
    `correo` VARCHAR(191) NOT NULL,
    `dni` VARCHAR(191) NULL,
    `domicilio` VARCHAR(191) NULL,
    `password` VARCHAR(191) NOT NULL,
    `rol` ENUM('ADMIN', 'JUNTA_DIRECTIVA', 'SOCIO') NOT NULL DEFAULT 'JUNTA_DIRECTIVA',
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Usuario_correo_key`(`correo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Socio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dni` VARCHAR(191) NOT NULL,
    `nombres` VARCHAR(191) NOT NULL,
    `apellidoP` VARCHAR(191) NOT NULL,
    `apellidoM` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NULL,
    `domicilio` VARCHAR(191) NULL,
    `etapa` INTEGER NOT NULL,
    `nombrePariente` VARCHAR(191) NULL,
    `apellidosPariente` VARCHAR(191) NULL,
    `numLote` VARCHAR(191) NULL,
    `manzana` VARCHAR(191) NULL,
    `areaLote` DOUBLE NULL,
    `montoTotal` DOUBLE NULL,
    `contrato` VARCHAR(191) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Socio_dni_etapa_key`(`dni`, `etapa`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Aporte` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `socioId` INTEGER NOT NULL,
    `cuotaId` INTEGER NULL,
    `monto` DOUBLE NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `observacion` VARCHAR(191) NULL,
    `voucher` VARCHAR(191) NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'PENDIENTE',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AporteDetalle` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `aporteId` INTEGER NOT NULL,
    `cuotaId` INTEGER NOT NULL,
    `monto` DOUBLE NOT NULL,
    `aplicadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AporteDetalle_aporteId_cuotaId_key`(`aporteId`, `cuotaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CargoDirectiva` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `cargo` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `CargoDirectiva_usuarioId_key`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ModeloContrato` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` VARCHAR(191) NOT NULL,
    `archivo` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,

    UNIQUE INDEX `ModeloContrato_tipo_key`(`tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Contrato` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `socioId` INTEGER NOT NULL,
    `usuarioId` INTEGER NOT NULL,
    `modeloId` INTEGER NOT NULL,
    `etapaProyecto` INTEGER NOT NULL,
    `rutaArchivo` VARCHAR(191) NOT NULL,
    `montoLetras` VARCHAR(191) NULL,
    `ciudadFirma` VARCHAR(191) NULL,
    `fechaFirma` DATETIME(3) NULL,
    `fechaGenerado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `estado` VARCHAR(191) NOT NULL DEFAULT 'VIGENTE',

    UNIQUE INDEX `Contrato_socio_etapa_key`(`socioId`, `etapaProyecto`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CronogramaPago` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `socioId` INTEGER NOT NULL,
    `contratoId` INTEGER NOT NULL,
    `cuotaNro` INTEGER NOT NULL,
    `monto` DOUBLE NOT NULL,
    `montoPagado` DOUBLE NOT NULL DEFAULT 0,
    `fechaPago` DATETIME(3) NOT NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'PENDIENTE',
    `puntualidad` VARCHAR(191) NOT NULL DEFAULT 'PENDIENTE',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Auditoria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `accion` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Aporte` ADD CONSTRAINT `Aporte_socioId_fkey` FOREIGN KEY (`socioId`) REFERENCES `Socio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Aporte` ADD CONSTRAINT `Aporte_cuotaId_fkey` FOREIGN KEY (`cuotaId`) REFERENCES `CronogramaPago`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AporteDetalle` ADD CONSTRAINT `AporteDetalle_aporteId_fkey` FOREIGN KEY (`aporteId`) REFERENCES `Aporte`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AporteDetalle` ADD CONSTRAINT `AporteDetalle_cuotaId_fkey` FOREIGN KEY (`cuotaId`) REFERENCES `CronogramaPago`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CargoDirectiva` ADD CONSTRAINT `CargoDirectiva_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contrato` ADD CONSTRAINT `Contrato_socioId_fkey` FOREIGN KEY (`socioId`) REFERENCES `Socio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contrato` ADD CONSTRAINT `Contrato_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contrato` ADD CONSTRAINT `Contrato_modeloId_fkey` FOREIGN KEY (`modeloId`) REFERENCES `ModeloContrato`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CronogramaPago` ADD CONSTRAINT `CronogramaPago_socioId_fkey` FOREIGN KEY (`socioId`) REFERENCES `Socio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CronogramaPago` ADD CONSTRAINT `CronogramaPago_contratoId_fkey` FOREIGN KEY (`contratoId`) REFERENCES `Contrato`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Auditoria` ADD CONSTRAINT `Auditoria_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
