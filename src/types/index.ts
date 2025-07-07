export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorVerify {
  token: string;
  backupCode?: string;
}

export interface TwoFactorStatus {
  enabled: boolean;
  setupComplete: boolean;
}

// Módulo 8.16 - Armazenamento seguro com redundância
export interface DataRedundancy {
  id: string;
  timestamp: Date;
  entityType: string;
  entityId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED' | 'PARTIAL' | 'VERIFIED' | 'CORRUPTED';
  entityData: any;
  hash: string;
  primaryStorage: string;
  backupStorage: string;
  replicationCount: number;
  replicas: ReplicaStatus[];
  verificationHash: string;
  companyId: string;
  userId?: string;
  sessionId?: string;
  retentionPeriod: number;
  isComplianceRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReplicaStatus {
  id: string;
  location: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'VERIFIED' | 'CORRUPTED';
  hash: string;
  timestamp: Date;
  error?: string;
}

export interface DataIntegrityCheck {
  id: string;
  timestamp: Date;
  checkType: 'HASH_VERIFICATION' | 'DATA_CONSISTENCY' | 'REFERENTIAL_INTEGRITY' | 'COMPLETE_SCAN' | 'INCREMENTAL_SCAN' | 'BACKUP_VERIFICATION';
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED' | 'PARTIAL_SUCCESS' | 'CORRUPTION_DETECTED';
  entityType?: string;
  entityId?: string;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  totalRecords: number;
  verifiedRecords: number;
  corruptedRecords: number;
  missingRecords: number;
  issues?: IntegrityIssue[];
  fixes?: IntegrityFix[];
  duration?: number;
  memoryUsage?: number;
  companyId?: string;
  userId?: string;
  retentionPeriod: number;
  isComplianceRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrityIssue {
  id: string;
  type: 'HASH_MISMATCH' | 'MISSING_RECORD' | 'CORRUPTED_DATA' | 'REFERENTIAL_ERROR';
  entityType: string;
  entityId: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: Date;
  details?: any;
}

export interface IntegrityFix {
  id: string;
  issueId: string;
  type: 'RESTORE_FROM_BACKUP' | 'RECALCULATE_HASH' | 'REPAIR_REFERENCE' | 'RECREATE_RECORD';
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';
  description: string;
  timestamp: Date;
  details?: any;
}

export interface BackupOperation {
  id: string;
  timestamp: Date;
  operationType: 'FULL' | 'INCREMENTAL' | 'DIFFERENTIAL' | 'SELECTIVE' | 'COMPLIANCE';
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'VERIFIED' | 'EXPIRED';
  entityTypes: string[];
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  fileName?: string;
  fileSize?: number;
  fileHash?: string;
  primaryLocation: string;
  backupLocations: string[];
  compressionRatio?: number;
  encryptionType?: string;
  retentionDays: number;
  duration?: number;
  recordsProcessed: number;
  recordsBackedUp: number;
  companyId?: string;
  userId?: string;
  isComplianceRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StorageHealth {
  id: string;
  timestamp: Date;
  storageType: 'PRIMARY_DATABASE' | 'BACKUP_DATABASE' | 'FILE_STORAGE' | 'CLOUD_STORAGE' | 'ARCHIVE_STORAGE' | 'COMPLIANCE_STORAGE';
  location: string;
  isAvailable: boolean;
  isHealthy: boolean;
  responseTime?: number;
  throughput?: number;
  errorRate?: number;
  totalSpace?: number;
  usedSpace?: number;
  freeSpace?: number;
  lastError?: string;
  errorCount: number;
  companyId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RedundancyConfig {
  enabled: boolean;
  replicationCount: number;
  primaryStorage: string;
  backupStorages: string[];
  autoVerification: boolean;
  verificationInterval: number; // em minutos
  retentionPeriod: number; // em dias
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  encryptionType?: string;
}

export interface IntegrityCheckConfig {
  enabled: boolean;
  checkTypes: string[];
  schedule: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'MANUAL';
  scheduleTime?: string; // HH:mm
  scheduleDay?: number; // 1-31 para mensal
  scheduleWeekday?: number; // 0-6 para semanal
  autoFix: boolean;
  notificationOnIssues: boolean;
  retentionPeriod: number; // em dias
}

export interface BackupConfig {
  enabled: boolean;
  backupTypes: string[];
  schedule: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'MANUAL';
  scheduleTime?: string; // HH:mm
  scheduleDay?: number; // 1-31 para mensal
  scheduleWeekday?: number; // 0-6 para semanal
  retentionDays: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  encryptionType?: string;
  locations: string[];
  maxFileSize?: number; // em MB
  parallelBackups: number;
}

export interface StorageHealthConfig {
  enabled: boolean;
  checkInterval: number; // em minutos
  thresholds: {
    responseTime: number; // em ms
    errorRate: number; // em %
    diskUsage: number; // em %
  };
  notifications: {
    onUnavailable: boolean;
    onUnhealthy: boolean;
    onThresholdExceeded: boolean;
  };
  retentionPeriod: number; // em dias
}
