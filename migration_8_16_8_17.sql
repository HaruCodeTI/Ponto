-- Migração para módulos 8.16 e 8.17
-- Armazenamento seguro com redundância e Disaster Recovery

-- Enums para módulo 8.16
CREATE TYPE "RedundancyStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED', 'PARTIAL', 'VERIFIED', 'CORRUPTED');
CREATE TYPE "IntegrityCheckType" AS ENUM ('HASH_VERIFICATION', 'DATA_CONSISTENCY', 'REFERENTIAL_INTEGRITY', 'COMPLETE_SCAN', 'INCREMENTAL_SCAN', 'BACKUP_VERIFICATION');
CREATE TYPE "IntegrityCheckStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED', 'PARTIAL_SUCCESS', 'CORRUPTION_DETECTED');
CREATE TYPE "BackupType" AS ENUM ('FULL', 'INCREMENTAL', 'DIFFERENTIAL', 'SELECTIVE', 'COMPLIANCE');
CREATE TYPE "BackupStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED', 'CANCELLED', 'VERIFIED', 'EXPIRED');
CREATE TYPE "StorageType" AS ENUM ('PRIMARY_DATABASE', 'BACKUP_DATABASE', 'FILE_STORAGE', 'CLOUD_STORAGE', 'ARCHIVE_STORAGE', 'COMPLIANCE_STORAGE');

-- Enums para módulo 8.17
CREATE TYPE "RestoreStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED', 'PARTIAL', 'CANCELLED', 'VERIFIED');

-- Tabela DataRedundancy (módulo 8.16)
CREATE TABLE "DataRedundancy" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "status" "RedundancyStatus" NOT NULL,
    "entityData" JSONB NOT NULL,
    "hash" TEXT NOT NULL,
    "primaryStorage" TEXT NOT NULL,
    "backupStorage" TEXT NOT NULL,
    "replicationCount" INTEGER NOT NULL DEFAULT 1,
    "replicas" JSONB NOT NULL,
    "verificationHash" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "retentionPeriod" INTEGER NOT NULL DEFAULT 1825,
    "isComplianceRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataRedundancy_pkey" PRIMARY KEY ("id")
);

-- Tabela DataIntegrityCheck (módulo 8.16)
CREATE TABLE "DataIntegrityCheck" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkType" "IntegrityCheckType" NOT NULL,
    "status" "IntegrityCheckStatus" NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "dateRange" JSONB,
    "totalRecords" INTEGER NOT NULL DEFAULT 0,
    "verifiedRecords" INTEGER NOT NULL DEFAULT 0,
    "corruptedRecords" INTEGER NOT NULL DEFAULT 0,
    "missingRecords" INTEGER NOT NULL DEFAULT 0,
    "issues" JSONB,
    "fixes" JSONB,
    "duration" INTEGER,
    "memoryUsage" INTEGER,
    "companyId" TEXT,
    "userId" TEXT,
    "retentionPeriod" INTEGER NOT NULL DEFAULT 1825,
    "isComplianceRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataIntegrityCheck_pkey" PRIMARY KEY ("id")
);

-- Tabela BackupOperation (módulo 8.16)
CREATE TABLE "BackupOperation" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operationType" "BackupType" NOT NULL,
    "status" "BackupStatus" NOT NULL,
    "entityTypes" TEXT[] NOT NULL,
    "dateRange" JSONB,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "fileHash" TEXT,
    "primaryLocation" TEXT NOT NULL,
    "backupLocations" TEXT[] NOT NULL,
    "compressionRatio" DOUBLE PRECISION,
    "encryptionType" TEXT,
    "retentionDays" INTEGER NOT NULL DEFAULT 1825,
    "duration" INTEGER,
    "recordsProcessed" INTEGER NOT NULL DEFAULT 0,
    "recordsBackedUp" INTEGER NOT NULL DEFAULT 0,
    "companyId" TEXT,
    "userId" TEXT,
    "isComplianceRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupOperation_pkey" PRIMARY KEY ("id")
);

-- Tabela StorageHealth (módulo 8.16)
CREATE TABLE "StorageHealth" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "storageType" "StorageType" NOT NULL,
    "location" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isHealthy" BOOLEAN NOT NULL DEFAULT true,
    "responseTime" INTEGER,
    "throughput" DOUBLE PRECISION,
    "errorRate" DOUBLE PRECISION,
    "totalSpace" INTEGER,
    "usedSpace" INTEGER,
    "freeSpace" INTEGER,
    "lastError" TEXT,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageHealth_pkey" PRIMARY KEY ("id")
);

-- Tabela RestoreOperation (módulo 8.17)
CREATE TABLE "RestoreOperation" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "RestoreStatus" NOT NULL,
    "backupId" TEXT NOT NULL,
    "entityTypes" TEXT[] NOT NULL,
    "dateRange" JSONB,
    "fileName" TEXT,
    "fileHash" TEXT,
    "restoredCount" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "duration" INTEGER,
    "companyId" TEXT,
    "userId" TEXT,
    "isComplianceRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestoreOperation_pkey" PRIMARY KEY ("id")
);

-- Índices para DataRedundancy
CREATE INDEX "DataRedundancy_timestamp_idx" ON "DataRedundancy"("timestamp");
CREATE INDEX "DataRedundancy_entityType_idx" ON "DataRedundancy"("entityType");
CREATE INDEX "DataRedundancy_entityId_idx" ON "DataRedundancy"("entityId");
CREATE INDEX "DataRedundancy_status_idx" ON "DataRedundancy"("status");
CREATE INDEX "DataRedundancy_companyId_idx" ON "DataRedundancy"("companyId");

-- Índices para DataIntegrityCheck
CREATE INDEX "DataIntegrityCheck_timestamp_idx" ON "DataIntegrityCheck"("timestamp");
CREATE INDEX "DataIntegrityCheck_checkType_idx" ON "DataIntegrityCheck"("checkType");
CREATE INDEX "DataIntegrityCheck_status_idx" ON "DataIntegrityCheck"("status");
CREATE INDEX "DataIntegrityCheck_entityType_idx" ON "DataIntegrityCheck"("entityType");
CREATE INDEX "DataIntegrityCheck_companyId_idx" ON "DataIntegrityCheck"("companyId");

-- Índices para BackupOperation
CREATE INDEX "BackupOperation_timestamp_idx" ON "BackupOperation"("timestamp");
CREATE INDEX "BackupOperation_operationType_idx" ON "BackupOperation"("operationType");
CREATE INDEX "BackupOperation_status_idx" ON "BackupOperation"("status");
CREATE INDEX "BackupOperation_companyId_idx" ON "BackupOperation"("companyId");

-- Índices para StorageHealth
CREATE INDEX "StorageHealth_timestamp_idx" ON "StorageHealth"("timestamp");
CREATE INDEX "StorageHealth_storageType_idx" ON "StorageHealth"("storageType");
CREATE INDEX "StorageHealth_isAvailable_idx" ON "StorageHealth"("isAvailable");
CREATE INDEX "StorageHealth_isHealthy_idx" ON "StorageHealth"("isHealthy");
CREATE INDEX "StorageHealth_companyId_idx" ON "StorageHealth"("companyId");

-- Índices para RestoreOperation
CREATE INDEX "RestoreOperation_timestamp_idx" ON "RestoreOperation"("timestamp");
CREATE INDEX "RestoreOperation_status_idx" ON "RestoreOperation"("status");
CREATE INDEX "RestoreOperation_companyId_idx" ON "RestoreOperation"("companyId"); 