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

export interface RestoreOperation {
  id: string;
  timestamp: Date;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED' | 'PARTIAL' | 'CANCELLED' | 'VERIFIED';
  backupId: string;
  entityTypes: string[];
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  fileName?: string;
  fileHash?: string;
  restoredCount: number;
  error?: string;
  duration?: number;
  companyId?: string;
  userId?: string;
  isComplianceRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RestoreConfig {
  enabled: boolean;
  allowedEntityTypes: string[];
  maxRestoreRangeDays: number;
  requireApproval: boolean;
  notificationOnRestore: boolean;
  retentionPeriod: number;
}

export interface RetentionPolicy {
  id: string;
  name: string;
  description?: string;
  entityType: string;
  retentionPeriod: number; // em dias
  isActive: boolean;
  companyId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataPurge {
  id: string;
  timestamp: Date;
  policyId: string;
  entityType: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED' | 'PARTIAL' | 'CANCELLED';
  recordsCount: number;
  purgedCount: number;
  error?: string;
  duration?: number;
  companyId?: string;
  executedBy?: string;
  isComplianceRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RetentionConfig {
  enabled: boolean;
  defaultRetentionDays: number;
  maxRetentionDays: number;
  autoPurge: boolean;
  purgeSchedule: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  notificationOnPurge: boolean;
  requireApproval: boolean;
}

export interface TimeRecordReceipt {
  id: string;
  timestamp: Date;
  timeRecordId: string;
  employeeId: string;
  companyId: string;
  receiptType: 'CLOCK_IN' | 'CLOCK_OUT' | 'BREAK_START' | 'BREAK_END' | 'ADJUSTMENT' | 'VERIFICATION';
  receiptData: ReceiptData;
  hash: string;
  qrCode?: string;
  isVerified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  isComplianceRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReceiptData {
  employee: {
    id: string;
    name: string;
    registration: string;
    department?: string;
    position?: string;
  };
  company: {
    id: string;
    name: string;
    cnpj: string;
    address?: string;
  };
  timeRecord: {
    id: string;
    timestamp: Date;
    type: string;
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    device?: {
      id: string;
      type: string;
      identifier: string;
    };
  };
  receipt: {
    id: string;
    generatedAt: Date;
    expiresAt: Date;
    verificationUrl?: string;
  };
}

export interface ReceiptConfig {
  enabled: boolean;
  includeQrCode: boolean;
  includeLocation: boolean;
  includeDeviceInfo: boolean;
  validityHours: number;
  verificationUrl: string;
  template: 'SIMPLE' | 'DETAILED' | 'COMPLIANCE';
}

export interface TimeSheetMirror {
  id: string;
  employeeId: string;
  companyId: string;
  month: number;
  year: number;
  status: 'DRAFT' | 'GENERATED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXPORTED';
  totalWorkHours: number;
  totalBreakHours: number;
  totalOvertimeHours: number;
  totalAbsences: number;
  totalDelays: number;
  workDays: number;
  totalDays: number;
  mirrorData: MirrorData;
  adjustments?: MirrorAdjustment[];
  notes?: string;
  approvedBy?: string;
  approvedAt?: Date;
  isComplianceRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MirrorData {
  employee: {
    id: string;
    name: string;
    registration: string;
    department?: string;
    position?: string;
  };
  company: {
    id: string;
    name: string;
    cnpj: string;
  };
  period: {
    month: number;
    year: number;
    startDate: Date;
    endDate: Date;
  };
  dailyRecords: DailyRecord[];
  summary: {
    totalWorkHours: number;
    totalBreakHours: number;
    totalOvertimeHours: number;
    totalAbsences: number;
    totalDelays: number;
    workDays: number;
    totalDays: number;
    averageWorkHours: number;
    averageBreakHours: number;
  };
  compliance: {
    isCompliant: boolean;
    violations: string[];
    warnings: string[];
  };
}

export interface DailyRecord {
  date: Date;
  dayOfWeek: string;
  isWorkDay: boolean;
  isHoliday: boolean;
  isWeekend: boolean;
  records: {
    clockIn?: Date;
    breakStart?: Date;
    breakEnd?: Date;
    clockOut?: Date;
  };
  workHours: number;
  breakHours: number;
  overtimeHours: number;
  isAbsent: boolean;
  isDelayed: boolean;
  delayMinutes: number;
  notes?: string;
}

export interface MirrorAdjustment {
  id: string;
  type: 'ADDITION' | 'SUBTRACTION' | 'CORRECTION';
  reason: string;
  hours: number;
  date: Date;
  appliedBy: string;
  appliedAt: Date;
  notes?: string;
}

export interface MirrorConfig {
  enabled: boolean;
  autoGenerate: boolean;
  requireApproval: boolean;
  includeWeekends: boolean;
  includeHolidays: boolean;
  workSchedule: {
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    breakStart: string; // HH:mm
    breakEnd: string; // HH:mm
    toleranceMinutes: number;
  };
  overtime: {
    enabled: boolean;
    thresholdHours: number;
    rate: number;
  };
  compliance: {
    minWorkHours: number;
    maxWorkHours: number;
    maxOvertimeHours: number;
  };
}

export interface AFDExport {
  id: string;
  companyId: string;
  employeeId?: string;
  startDate: Date;
  endDate: Date;
  fileName: string;
  filePath: string;
  fileSize: number;
  recordCount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
  afdVersion: string;
  checksum: string;
  metadata: AFDMetadata;
  isComplianceRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AFDMetadata {
  company: {
    id: string;
    name: string;
    cnpj: string;
    cei?: string;
  };
  employee?: {
    id: string;
    name: string;
    pis: string;
    registration: string;
  };
  period: {
    startDate: Date;
    endDate: Date;
    totalDays: number;
  };
  records: {
    total: number;
    clockIn: number;
    clockOut: number;
    breakStart: number;
    breakEnd: number;
    adjustments: number;
  };
  compliance: {
    isCompliant: boolean;
    violations: string[];
    warnings: string[];
  };
  export: {
    version: string;
    format: string;
    encoding: string;
    generatedAt: Date;
    expiresAt: Date;
  };
}

export interface AFDRecord {
  type: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
  pis: string;
  date: Date;
  time: string;
  reason?: string;
  sequence?: number;
  nsr?: string;
}

export interface AFDConfig {
  enabled: boolean;
  version: string;
  encoding: string;
  includeHeaders: boolean;
  includeTrailers: boolean;
  maxFileSize: number;
  retentionDays: number;
  compliance: {
    requireValidation: boolean;
    validateChecksum: boolean;
    requireApproval: boolean;
  };
  format: {
    dateFormat: string;
    timeFormat: string;
    separator: string;
    lineEnding: string;
  };
}

export interface AFDValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recordCount: number;
  checksum: string;
  compliance: {
    isCompliant: boolean;
    violations: string[];
  };
}

export interface Notification {
  id: string;
  companyId: string;
  userId?: string;
  employeeId?: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'ALERT' | 'REMINDER' | 'APPROVAL' | 'SYSTEM';
  title: string;
  message: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  category: string;
  metadata?: NotificationMetadata;
  isRead: boolean;
  isArchived: boolean;
  readAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationMetadata {
  actionUrl?: string;
  actionText?: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
}

export interface NotificationPreference {
  id: string;
  companyId: string;
  userId?: string;
  employeeId?: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  categories: NotificationCategories;
  quietHours?: QuietHours;
  frequency: 'IMMEDIATE' | 'HOURLY' | 'DAILY' | 'WEEKLY';
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationCategories {
  ponto: boolean;
  relatorios: boolean;
  sistema: boolean;
  compliance: boolean;
  aprovacoes: boolean;
  alertas: boolean;
  lembretes: boolean;
}

export interface QuietHours {
  enabled: boolean;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  timezone: string;
  days: number[]; // 0-6 (domingo-sábado)
}

export interface NotificationStats {
  total: number;
  unread: number;
  archived: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  category: string;
  variables: string[];
  isActive: boolean;
}

export interface WebSocketMessage {
  type: 'notification' | 'status' | 'error';
  data: any;
  timestamp: Date;
}

export interface Backup {
  id: string;
  companyId: string;
  type: 'FULL' | 'INCREMENTAL' | 'DIFFERENTIAL' | 'SCHEMA_ONLY' | 'DATA_ONLY';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED' | 'RESTORING';
  fileName: string;
  filePath: string;
  fileSize: number;
  checksum: string;
  metadata: BackupMetadata;
  retentionDays: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BackupMetadata {
  company: {
    id: string;
    name: string;
    cnpj: string;
  };
  database: {
    version: string;
    tables: string[];
    recordCount: number;
  };
  backup: {
    type: string;
    compression: string;
    encryption: boolean;
    generatedAt: Date;
    duration: number; // segundos
  };
  validation: {
    isVerified: boolean;
    checksumValid: boolean;
    integrityCheck: boolean;
    verifiedAt?: Date;
  };
}

export interface BackupSchedule {
  id: string;
  companyId: string;
  type: 'FULL' | 'INCREMENTAL' | 'DIFFERENTIAL' | 'SCHEMA_ONLY' | 'DATA_ONLY';
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  time: string; // HH:mm
  days: number[]; // 0-6 (domingo-sábado)
  isActive: boolean;
  retentionDays: number;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RestoreJob {
  id: string;
  companyId: string;
  backupId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number; // 0-100
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  metadata: RestoreMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface RestoreMetadata {
  backup: {
    id: string;
    fileName: string;
    type: string;
    createdAt: Date;
  };
  restore: {
    targetDatabase: string;
    options: {
      dropExisting: boolean;
      createMissing: boolean;
      preserveData: boolean;
    };
    startedAt: Date;
    estimatedDuration: number;
  };
  progress: {
    currentStep: string;
    stepsCompleted: number;
    totalSteps: number;
    currentTable?: string;
    recordsProcessed: number;
    totalRecords: number;
  };
}

export interface BackupStats {
  totalBackups: number;
  completedBackups: number;
  failedBackups: number;
  totalSize: number;
  lastBackup?: Date;
  nextScheduledBackup?: Date;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface BackupConfig {
  enabled: boolean;
  storage: {
    type: 'local' | 's3' | 'gcs' | 'azure';
    path: string;
    credentials?: Record<string, string>;
  };
  compression: {
    enabled: boolean;
    algorithm: 'gzip' | 'bzip2' | 'lz4';
    level: number;
  };
  encryption: {
    enabled: boolean;
    algorithm: 'aes-256-gcm' | 'aes-256-cbc';
    key?: string;
  };
  retention: {
    defaultDays: number;
    maxBackups: number;
    cleanupEnabled: boolean;
  };
  scheduling: {
    enabled: boolean;
    timezone: string;
    maxConcurrentJobs: number;
  };
}

export interface BackupValidationResult {
  isValid: boolean;
  checksum: string;
  fileSize: number;
  integrityCheck: boolean;
  databaseVersion: string;
  errors: string[];
  warnings: string[];
}

export interface AuditLog {
  id: string;
  companyId: string;
  userId?: string;
  employeeId?: string;
  sessionId?: string;
  action: string;
  category: 'AUTHENTICATION' | 'AUTHORIZATION' | 'DATA_ACCESS' | 'DATA_MODIFICATION' | 'SYSTEM_CONFIG' | 'SECURITY' | 'COMPLIANCE' | 'BACKUP_RESTORE' | 'REPORT_GENERATION' | 'USER_MANAGEMENT' | 'EMPLOYEE_MANAGEMENT' | 'TIME_RECORD' | 'PAYROLL' | 'NOTIFICATION' | 'API_ACCESS' | 'FILE_OPERATION' | 'DATABASE_OPERATION' | 'NETWORK_ACCESS' | 'PRIVACY' | 'OTHER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'PENDING' | 'CANCELLED';
  resourceType?: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  metadata: AuditMetadata;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  timestamp: Date;
  createdAt: Date;
}

export interface AuditMetadata {
  user: {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
  };
  session: {
    id?: string;
    startTime?: Date;
    duration?: number;
  };
  request: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: any;
  };
  response: {
    statusCode?: number;
    duration?: number;
    size?: number;
  };
  context: {
    browser?: string;
    os?: string;
    device?: string;
    screen?: string;
  };
  performance: {
    memoryUsage?: number;
    cpuUsage?: number;
    networkLatency?: number;
  };
  security: {
    isEncrypted?: boolean;
    hasValidToken?: boolean;
    permissions?: string[];
  };
}

export interface SecurityAlert {
  id: string;
  companyId: string;
  type: 'SUSPICIOUS_LOGIN' | 'MULTIPLE_FAILED_ATTEMPTS' | 'UNUSUAL_ACCESS_PATTERN' | 'DATA_EXPORT' | 'CONFIGURATION_CHANGE' | 'PRIVILEGE_ESCALATION' | 'DATA_BREACH_ATTEMPT' | 'MALWARE_DETECTION' | 'NETWORK_INTRUSION' | 'COMPLIANCE_VIOLATION' | 'AUDIT_FAILURE' | 'BACKUP_FAILURE' | 'SYSTEM_ERROR' | 'PERFORMANCE_ISSUE' | 'OTHER';
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'FALSE_POSITIVE';
  title: string;
  description: string;
  source: string;
  metadata: SecurityAlertMetadata;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityAlertMetadata {
  trigger: {
    condition: string;
    threshold: number;
    currentValue: number;
    timeWindow: number;
  };
  context: {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    timestamp: Date;
  };
  impact: {
    affectedUsers?: number;
    affectedData?: string[];
    riskLevel: string;
    recommendations: string[];
  };
  investigation: {
    evidence: string[];
    timeline: Array<{
      timestamp: Date;
      event: string;
      details: string;
    }>;
    relatedLogs: string[];
  };
}

export interface DataRetentionPolicy {
  id: string;
  companyId: string;
  dataType: string;
  retentionDays: number;
  isActive: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrivacyConsent {
  id: string;
  companyId: string;
  userId: string;
  consentType: 'DATA_COLLECTION' | 'DATA_PROCESSING' | 'DATA_SHARING' | 'MARKETING' | 'COOKIES' | 'ANALYTICS' | 'THIRD_PARTY' | 'LEGAL_BASIS' | 'OTHER';
  status: 'GRANTED' | 'DENIED' | 'REVOKED' | 'EXPIRED' | 'PENDING';
  grantedAt?: Date;
  revokedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata: ConsentMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsentMetadata {
  version: string;
  legalBasis: string;
  purpose: string;
  dataCategories: string[];
  thirdParties: string[];
  retentionPeriod: number;
  withdrawalMethod: string;
  contactInfo: {
    email: string;
    phone?: string;
    address?: string;
  };
  userPreferences: {
    marketing: boolean;
    analytics: boolean;
    essential: boolean;
  };
}

export interface AuditReport {
  id: string;
  companyId: string;
  reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM' | 'COMPLIANCE' | 'SECURITY' | 'PRIVACY' | 'DATA_ACCESS' | 'USER_ACTIVITY' | 'SYSTEM_ACTIVITY' | 'OTHER';
  period: string;
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
  generatedBy: string;
  generatedAt: Date;
  filePath?: string;
  fileSize?: number;
  metadata: AuditReportMetadata;
  createdAt: Date;
}

export interface AuditReportMetadata {
  summary: {
    totalEvents: number;
    criticalEvents: number;
    securityAlerts: number;
    complianceViolations: number;
    dataAccessCount: number;
    uniqueUsers: number;
  };
  categories: Record<string, number>;
  severity: Record<string, number>;
  topActions: Array<{
    action: string;
    count: number;
    percentage: number;
  }>;
  topUsers: Array<{
    userId: string;
    userName: string;
    actionCount: number;
    lastActivity: Date;
  }>;
  security: {
    suspiciousLogins: number;
    failedAttempts: number;
    privilegeEscalations: number;
    dataExports: number;
  };
  compliance: {
    lgpdViolations: number;
    retentionPolicyBreaches: number;
    consentIssues: number;
    auditFailures: number;
  };
  performance: {
    averageResponseTime: number;
    peakUsage: number;
    errorRate: number;
    availability: number;
  };
}

export interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  criticalLogs: number;
  securityAlerts: number;
  openAlerts: number;
  complianceScore: number;
  dataRetentionCompliance: number;
  privacyConsentRate: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  topActions: Array<{
    action: string;
    count: number;
  }>;
  recentAlerts: SecurityAlert[];
  complianceIssues: Array<{
    type: string;
    count: number;
    severity: string;
  }>;
}

export interface AuditFilter {
  companyId?: string;
  userId?: string;
  category?: string;
  severity?: string;
  status?: string;
  resourceType?: string;
  resourceId?: string;
  action?: string;
  dateFrom?: Date;
  dateTo?: Date;
  ipAddress?: string;
}

export interface AuditExportOptions {
  format: 'json' | 'csv' | 'pdf' | 'excel';
  includeMetadata: boolean;
  includeOldValues: boolean;
  includeNewValues: boolean;
  compress: boolean;
  encrypt: boolean;
  retentionDays: number;
}

export interface ComplianceCheck {
  id: string;
  type: string;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'PENDING';
  score: number;
  details: string;
  recommendations: string[];
  lastChecked: Date;
  nextCheck: Date;
  metadata: any;
}

export interface ExecutiveDashboard {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isPublic: boolean;
  layout: DashboardLayout;
  filters: DashboardFilters;
  refreshInterval?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  widgets?: DashboardWidget[];
}

export interface DashboardLayout {
  grid: {
    columns: number;
    rows: number;
    gap: number;
  };
  theme: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  responsive: {
    mobile: boolean;
    tablet: boolean;
    desktop: boolean;
  };
}

export interface DashboardFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  departments?: string[];
  employees?: string[];
  locations?: string[];
  customFilters?: Record<string, any>;
}

export interface DashboardWidget {
  id: string;
  dashboardId: string;
  widgetType: 'KPI_CARD' | 'LINE_CHART' | 'BAR_CHART' | 'PIE_CHART' | 'TABLE' | 'GAUGE' | 'HEATMAP' | 'FUNNEL' | 'SCATTER_PLOT' | 'AREA_CHART' | 'METRIC_GRID' | 'ALERT_LIST' | 'ACTIVITY_FEED' | 'CUSTOM_HTML';
  title: string;
  description?: string;
  position: WidgetPosition;
  size: WidgetSize;
  config: WidgetConfig;
  dataSource: string;
  refreshInterval?: number;
  isVisible: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetPosition {
  x: number;
  y: number;
  z?: number;
}

export interface WidgetSize {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface WidgetConfig {
  chartType?: string;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  showLabels?: boolean;
  animation?: boolean;
  customOptions?: Record<string, any>;
}

export interface BusinessKPI {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  category: 'PRODUCTIVITY' | 'ATTENDANCE' | 'OVERTIME' | 'COMPLIANCE' | 'SECURITY' | 'FINANCIAL' | 'OPERATIONAL' | 'CUSTOMER' | 'EMPLOYEE' | 'SYSTEM';
  formula: string;
  unit?: string;
  target?: number;
  threshold?: number;
  dataSource: string;
  refreshInterval: number;
  isActive: boolean;
  isVisible: boolean;
  metadata: KPIMetadata;
  createdAt: Date;
  updatedAt: Date;
  values?: KPIValue[];
}

export interface KPIMetadata {
  calculation: {
    method: string;
    parameters: Record<string, any>;
    dependencies: string[];
  };
  display: {
    format: string;
    precision: number;
    prefix?: string;
    suffix?: string;
  };
  alerting: {
    enabled: boolean;
    conditions: Array<{
      operator: string;
      value: number;
      action: string;
    }>;
  };
  history: {
    retentionDays: number;
    aggregation: string;
  };
}

export interface KPIValue {
  id: string;
  kpiId: string;
  value: number;
  target?: number;
  threshold?: number;
  period: string;
  timestamp: Date;
  metadata: KPIValueMetadata;
  createdAt: Date;
}

export interface KPIValueMetadata {
  calculation: {
    startTime: Date;
    endTime: Date;
    duration: number;
    recordsProcessed: number;
  };
  context: {
    filters: Record<string, any>;
    parameters: Record<string, any>;
  };
  quality: {
    confidence: number;
    dataQuality: number;
    completeness: number;
  };
}

export interface ReportTemplate {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  type: 'DAILY_SUMMARY' | 'WEEKLY_REPORT' | 'MONTHLY_REPORT' | 'QUARTERLY_REPORT' | 'YEARLY_REPORT' | 'CUSTOM_PERIOD' | 'REAL_TIME' | 'AD_HOC' | 'COMPLIANCE' | 'AUDIT' | 'FINANCIAL' | 'OPERATIONAL';
  format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON' | 'HTML' | 'POWER_BI' | 'TABLEAU' | 'CUSTOM';
  schedule?: ReportSchedule;
  config: ReportConfig;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportSchedule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
  time: string; // HH:mm
  days?: number[]; // Para frequência semanal
  dayOfMonth?: number; // Para frequência mensal
  timezone: string;
  recipients: string[];
  isActive: boolean;
}

export interface ReportConfig {
  sections: Array<{
    title: string;
    type: string;
    dataSource: string;
    filters?: Record<string, any>;
    layout?: Record<string, any>;
  }>;
  styling: {
    theme: string;
    colors: string[];
    fonts: Record<string, string>;
    logo?: string;
  };
  options: {
    includeCharts: boolean;
    includeTables: boolean;
    includeKPIs: boolean;
    pageBreak: boolean;
    watermark?: string;
  };
}

export interface GeneratedReport {
  id: string;
  companyId: string;
  templateId?: string;
  name: string;
  type: ReportTemplate['type'];
  format: ReportTemplate['format'];
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
  filePath?: string;
  fileSize?: number;
  downloadUrl?: string;
  metadata: GeneratedReportMetadata;
  generatedBy: string;
  generatedAt: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export interface GeneratedReportMetadata {
  generation: {
    startTime: Date;
    endTime?: Date;
    duration?: number;
    progress: number;
  };
  content: {
    pages: number;
    sections: number;
    charts: number;
    tables: number;
  };
  quality: {
    resolution: string;
    compression: string;
    fileFormat: string;
  };
  access: {
    downloadCount: number;
    lastDownloaded?: Date;
    expiresAt?: Date;
  };
}

export interface DataExport {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  dataSource: string;
  filters: Record<string, any>;
  columns: string[];
  format: 'CSV' | 'EXCEL' | 'JSON' | 'XML' | 'SQL' | 'CUSTOM';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
  filePath?: string;
  fileSize?: number;
  downloadUrl?: string;
  metadata: DataExportMetadata;
  requestedBy: string;
  requestedAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export interface DataExportMetadata {
  processing: {
    startTime: Date;
    endTime?: Date;
    duration?: number;
    recordsProcessed: number;
    recordsExported: number;
  };
  file: {
    encoding: string;
    delimiter?: string;
    compression?: string;
    password?: string;
  };
  access: {
    downloadCount: number;
    lastDownloaded?: Date;
    expiresAt?: Date;
  };
}

export interface BIIntegration {
  id: string;
  companyId: string;
  name: string;
  type: 'POWER_BI' | 'TABLEAU' | 'QLIK' | 'LOOKER' | 'METABASE' | 'GRAFANA' | 'CUSTOM';
  config: BIConfig;
  isActive: boolean;
  lastSync?: Date;
  syncInterval: number;
  metadata: BIMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface BIConfig {
  connection: {
    type: string;
    host: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    ssl?: boolean;
  };
  authentication: {
    method: string;
    token?: string;
    apiKey?: string;
    oauth?: Record<string, any>;
  };
  sync: {
    tables: string[];
    schedule: string;
    incremental: boolean;
    filters?: Record<string, any>;
  };
}

export interface BIMetadata {
  status: {
    lastSync: Date;
    nextSync: Date;
    syncStatus: string;
    errorCount: number;
  };
  performance: {
    avgSyncTime: number;
    recordsSynced: number;
    dataSize: number;
  };
  monitoring: {
    alerts: boolean;
    notifications: string[];
    healthCheck: string;
  };
}

export interface ExecutiveStats {
  totalDashboards: number;
  activeKPIs: number;
  totalReports: number;
  recentExports: number;
  biIntegrations: number;
  topKPIs: Array<{
    id: string;
    name: string;
    value: number;
    target?: number;
    trend: number;
  }>;
  recentReports: GeneratedReport[];
  systemHealth: {
    dataQuality: number;
    performance: number;
    availability: number;
    compliance: number;
  };
}

export interface KPITrend {
  kpiId: string;
  kpiName: string;
  values: Array<{
    period: string;
    value: number;
    target?: number;
    threshold?: number;
  }>;
  trend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
  };
}

export interface DashboardData {
  dashboard: ExecutiveDashboard;
  widgets: Array<{
    widget: DashboardWidget;
    data: any;
    lastUpdated: Date;
  }>;
  kpis: BusinessKPI[];
  alerts: Array<{
    type: string;
    message: string;
    severity: string;
    timestamp: Date;
  }>;
}

export interface ExternalAPI {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  provider: string;
  apiType: 'REST' | 'GRAPHQL' | 'SOAP' | 'WEBHOOK' | 'OAUTH' | 'API_KEY' | 'BASIC_AUTH' | 'JWT' | 'CUSTOM';
  baseUrl: string;
  version: string;
  config: APIConfig;
  credentials: APICredentials;
  isActive: boolean;
  rateLimit?: APIRateLimit;
  lastSync?: Date;
  syncInterval: number;
  metadata: APIMetadata;
  createdAt: Date;
  updatedAt: Date;
  endpoints?: APIEndpoint[];
  requests?: APIRequest[];
}

export interface APIConfig {
  authentication: {
    type: string;
    method: string;
    tokenUrl?: string;
    scopes?: string[];
  };
  headers: Record<string, string>;
  timeout: number;
  retry: {
    attempts: number;
    backoff: string;
    maxDelay: number;
  };
  rateLimiting: {
    enabled: boolean;
    requestsPerMinute: number;
    burstLimit: number;
  };
  security: {
    sslVerify: boolean;
    certificateValidation: boolean;
  };
}

export interface APICredentials {
  apiKey?: string;
  username?: string;
  password?: string;
  token?: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  custom?: Record<string, any>;
}

export interface APIRateLimit {
  window: string;
  limit: number;
  remaining: number;
  resetAt: Date;
}

export interface APIMetadata {
  documentation: {
    url?: string;
    version?: string;
    lastUpdated?: Date;
  };
  monitoring: {
    enabled: boolean;
    metrics: string[];
    alerts: boolean;
  };
  compliance: {
    gdpr: boolean;
    sox: boolean;
    hipaa: boolean;
  };
}

export interface APIEndpoint {
  id: string;
  apiId: string;
  name: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  description?: string;
  parameters: EndpointParameters;
  headers: Record<string, string>;
  response: EndpointResponse;
  isActive: boolean;
  rateLimit?: APIRateLimit;
  timeout: number;
  retryConfig: RetryConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface EndpointParameters {
  path: Record<string, ParameterDefinition>;
  query: Record<string, ParameterDefinition>;
  body?: ParameterDefinition;
  headers?: Record<string, ParameterDefinition>;
}

export interface ParameterDefinition {
  type: string;
  required: boolean;
  description?: string;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  };
}

export interface EndpointResponse {
  success: {
    statusCode: number;
    schema: any;
    examples: any[];
  };
  error: {
    statusCode: number;
    schema: any;
    examples: any[];
  };
}

export interface RetryConfig {
  maxAttempts: number;
  backoffStrategy: 'fixed' | 'exponential' | 'linear';
  initialDelay: number;
  maxDelay: number;
  retryableStatusCodes: number[];
}

export interface APIRequest {
  id: string;
  apiId: string;
  endpointId?: string;
  method: APIEndpoint['method'];
  url: string;
  headers: Record<string, string>;
  body?: any;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'TIMEOUT' | 'CANCELLED' | 'RETRYING';
  responseCode?: number;
  responseBody?: any;
  errorMessage?: string;
  duration?: number;
  retryCount: number;
  metadata: RequestMetadata;
  requestedAt: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface RequestMetadata {
  userAgent: string;
  ipAddress: string;
  correlationId: string;
  tags: string[];
  priority: 'low' | 'normal' | 'high' | 'critical';
}

export interface Webhook {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  url: string;
  events: string[];
  secret: string;
  headers: Record<string, string>;
  isActive: boolean;
  retryConfig: WebhookRetryConfig;
  timeout: number;
  metadata: WebhookMetadata;
  createdAt: Date;
  updatedAt: Date;
  deliveries?: WebhookDelivery[];
}

export interface WebhookRetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
}

export interface WebhookMetadata {
  security: {
    signatureVerification: boolean;
    ipWhitelist?: string[];
    userAgentValidation?: boolean;
  };
  monitoring: {
    enabled: boolean;
    alertOnFailure: boolean;
    alertThreshold: number;
  };
  performance: {
    timeout: number;
    maxPayloadSize: number;
    compression: boolean;
  };
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'RETRYING' | 'CANCELLED';
  responseCode?: number;
  responseBody?: string;
  errorMessage?: string;
  duration?: number;
  retryCount: number;
  deliveredAt?: Date;
  createdAt: Date;
}

export interface DataSync {
  id: string;
  companyId: string;
  apiId: string;
  name: string;
  description?: string;
  sourceTable: string;
  targetTable: string;
  mapping: FieldMapping[];
  schedule: SyncSchedule;
  lastSync?: Date;
  nextSync?: Date;
  status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PAUSED' | 'SCHEDULED';
  recordsSynced: number;
  errorCount: number;
  isActive: boolean;
  metadata: SyncMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
  defaultValue?: any;
  required: boolean;
}

export interface SyncSchedule {
  frequency: 'manual' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  interval?: number;
  time?: string; // HH:mm
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  dayOfMonth?: number; // 1-31
  timezone: string;
  isActive: boolean;
}

export interface SyncMetadata {
  lastSyncDetails: {
    startTime: Date;
    endTime?: Date;
    duration?: number;
    recordsProcessed: number;
    recordsSynced: number;
    errors: Array<{
      record: any;
      error: string;
      timestamp: Date;
    }>;
  };
  performance: {
    avgSyncTime: number;
    avgRecordsPerSecond: number;
    peakMemoryUsage: number;
  };
  monitoring: {
    alerts: boolean;
    failureThreshold: number;
    successThreshold: number;
  };
}

export interface APIMonitoring {
  id: string;
  apiId: string;
  metric: string;
  value: number;
  timestamp: Date;
  metadata: MonitoringMetadata;
}

export interface MonitoringMetadata {
  tags: string[];
  unit: string;
  threshold?: {
    warning: number;
    critical: number;
  };
  aggregation: 'min' | 'max' | 'avg' | 'sum' | 'count';
}

export interface IntegrationLog {
  id: string;
  companyId: string;
  apiId?: string;
  webhookId?: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  message: string;
  details?: any;
  timestamp: Date;
  createdAt: Date;
}

export interface IntegrationStats {
  totalAPIs: number;
  activeAPIs: number;
  totalWebhooks: number;
  activeWebhooks: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  topAPIs: Array<{
    id: string;
    name: string;
    requestCount: number;
    successRate: number;
    avgResponseTime: number;
  }>;
  recentErrors: IntegrationLog[];
  systemHealth: {
    availability: number;
    performance: number;
    reliability: number;
    security: number;
  };
}

export interface WebhookEvent {
  id: string;
  name: string;
  description: string;
  payload: any;
  timestamp: Date;
  source: string;
  metadata: Record<string, any>;
}

export interface APITestResult {
  success: boolean;
  responseCode?: number;
  responseTime: number;
  responseBody?: any;
  error?: string;
  timestamp: Date;
  endpoint: string;
  method: string;
}

export interface IntegrationConfig {
  global: {
    defaultTimeout: number;
    maxRetries: number;
    rateLimitEnabled: boolean;
    monitoringEnabled: boolean;
    loggingLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  };
  security: {
    encryptionEnabled: boolean;
    sslVerification: boolean;
    ipWhitelist: string[];
    apiKeyRotation: boolean;
  };
  monitoring: {
    alerting: boolean;
    metricsRetention: number;
    logRetention: number;
    performanceThresholds: {
      responseTime: number;
      errorRate: number;
      availability: number;
    };
  };
}

export interface AIModel {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  type: 'ANOMALY_DETECTION' | 'PREDICTIVE_ANALYTICS' | 'PATTERN_RECOGNITION' | 'CLASSIFICATION' | 'REGRESSION' | 'CLUSTERING' | 'RECOMMENDATION' | 'NLP' | 'COMPUTER_VISION' | 'TIME_SERIES' | 'FRAUD_DETECTION' | 'CUSTOM';
  version: string;
  status: 'DRAFT' | 'TRAINING' | 'ACTIVE' | 'INACTIVE' | 'DEPRECATED' | 'ERROR' | 'UPDATING';
  config: ModelConfig;
  metadata: ModelMetadata;
  accuracy?: number;
  lastTrained?: Date;
  nextTraining?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  trainings?: ModelTraining[];
  predictions?: Prediction[];
  anomalies?: AnomalyDetection[];
  insights?: AIInsight[];
  performance?: MLPerformance[];
}

export interface ModelConfig {
  algorithm: {
    name: string;
    version: string;
    parameters: Record<string, any>;
  };
  preprocessing: {
    normalization: boolean;
    scaling: string;
    encoding: string;
    featureSelection: string[];
  };
  training: {
    epochs: number;
    batchSize: number;
    learningRate: number;
    validationSplit: number;
    earlyStopping: boolean;
  };
  evaluation: {
    metrics: string[];
    crossValidation: boolean;
    testSize: number;
  };
  deployment: {
    environment: string;
    resources: {
      cpu: number;
      memory: number;
      gpu?: number;
    };
    scaling: {
      minReplicas: number;
      maxReplicas: number;
    };
  };
}

export interface ModelMetadata {
  framework: {
    name: string;
    version: string;
    backend: string;
  };
  data: {
    trainingSize: number;
    validationSize: number;
    testSize: number;
    features: number;
    classes?: number;
  };
  performance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    auc?: number;
  };
  business: {
    useCase: string;
    stakeholders: string[];
    successMetrics: string[];
    roi?: number;
  };
}

export interface ModelTraining {
  id: string;
  modelId: string;
  version: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'VALIDATING';
  config: TrainingConfig;
  dataset: DatasetInfo;
  metrics: TrainingMetrics;
  artifacts: TrainingArtifacts;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  errorMessage?: string;
  createdBy: string;
  createdAt: Date;
}

export interface TrainingConfig {
  hyperparameters: Record<string, any>;
  dataAugmentation: boolean;
  regularization: {
    dropout: number;
    l1: number;
    l2: number;
  };
  optimization: {
    optimizer: string;
    learningRate: number;
    momentum: number;
  };
  callbacks: string[];
}

export interface DatasetInfo {
  name: string;
  version: string;
  size: number;
  features: string[];
  target: string;
  split: {
    training: number;
    validation: number;
    test: number;
  };
}

export interface TrainingMetrics {
  loss: {
    training: number[];
    validation: number[];
  };
  accuracy: {
    training: number[];
    validation: number[];
  };
  final: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
}

export interface TrainingArtifacts {
  modelPath: string;
  weightsPath: string;
  configPath: string;
  logsPath: string;
  visualizations: string[];
}

export interface Prediction {
  id: string;
  modelId: string;
  input: any;
  output: any;
  confidence: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  metadata: PredictionMetadata;
  processingTime: number;
  createdAt: Date;
}

export interface PredictionMetadata {
  modelVersion: string;
  features: string[];
  preprocessing: Record<string, any>;
  postprocessing: Record<string, any>;
  timestamp: Date;
  requestId: string;
}

export interface AnomalyDetection {
  id: string;
  companyId: string;
  modelId: string;
  dataSource: string;
  anomalyType: 'TIME_RECORD_ANOMALY' | 'LOCATION_ANOMALY' | 'DEVICE_ANOMALY' | 'BEHAVIOR_ANOMALY' | 'PATTERN_ANOMALY' | 'SYSTEM_ANOMALY' | 'SECURITY_ANOMALY' | 'PERFORMANCE_ANOMALY' | 'CUSTOM';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  data: AnomalyData;
  score: number;
  threshold: number;
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
  createdAt: Date;
}

export interface AnomalyData {
  timestamp: Date;
  values: Record<string, any>;
  context: {
    employeeId?: string;
    location?: string;
    device?: string;
    action?: string;
  };
  baseline: {
    expected: any;
    actual: any;
    deviation: number;
  };
  features: Record<string, number>;
}

export interface MLDataset {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  type: 'TRAINING' | 'VALIDATION' | 'TEST' | 'PRODUCTION' | 'CUSTOM';
  source: string;
  schema: DatasetSchema;
  size: number;
  records: number;
  quality: DatasetQuality;
  isActive: boolean;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DatasetSchema {
  fields: Array<{
    name: string;
    type: string;
    description?: string;
    required: boolean;
    constraints?: Record<string, any>;
  }>;
  primaryKey: string[];
  indexes: string[];
  relationships: Array<{
    table: string;
    fields: string[];
    type: string;
  }>;
}

export interface DatasetQuality {
  completeness: number;
  accuracy: number;
  consistency: number;
  timeliness: number;
  validity: number;
  uniqueness: number;
  issues: Array<{
    type: string;
    count: number;
    severity: string;
    description: string;
  }>;
}

export interface MLFeature {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  type: 'NUMERICAL' | 'CATEGORICAL' | 'TEMPORAL' | 'TEXT' | 'BOOLEAN' | 'COMPLEX' | 'CUSTOM';
  dataType: string;
  source: string;
  transformation: FeatureTransformation;
  importance?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureTransformation {
  type: string;
  parameters: Record<string, any>;
  validation: {
    min?: number;
    max?: number;
    pattern?: string;
    allowedValues?: any[];
  };
  scaling?: {
    method: string;
    parameters: Record<string, any>;
  };
  encoding?: {
    method: string;
    parameters: Record<string, any>;
  };
}

export interface MLExperiment {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  objective: string;
  hypothesis?: string;
  config: ExperimentConfig;
  status: 'PLANNED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'ANALYZING';
  results?: ExperimentResults;
  conclusion?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExperimentConfig {
  models: string[];
  datasets: string[];
  hyperparameters: Record<string, any[]>;
  evaluation: {
    metrics: string[];
    crossValidation: boolean;
    testSize: number;
  };
  constraints: {
    maxTime: number;
    maxTrials: number;
    budget?: number;
  };
}

export interface ExperimentResults {
  bestModel: {
    id: string;
    score: number;
    config: Record<string, any>;
  };
  trials: Array<{
    id: string;
    config: Record<string, any>;
    score: number;
    status: string;
    duration: number;
  }>;
  analysis: {
    featureImportance: Record<string, number>;
    hyperparameterImpact: Record<string, number>;
    learningCurves: any[];
  };
}

export interface AIInsight {
  id: string;
  companyId: string;
  modelId?: string;
  type: 'TREND_ANALYSIS' | 'PATTERN_DISCOVERY' | 'ANOMALY_INSIGHT' | 'PREDICTION_INSIGHT' | 'OPTIMIZATION' | 'RISK_ALERT' | 'OPPORTUNITY' | 'PERFORMANCE_INSIGHT' | 'CUSTOM';
  title: string;
  description: string;
  data: InsightData;
  confidence: number;
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendations: InsightRecommendation[];
  isRead: boolean;
  isActioned: boolean;
  actionedAt?: Date;
  actionedBy?: string;
  createdAt: Date;
}

export interface InsightData {
  summary: string;
  details: Record<string, any>;
  visualizations: Array<{
    type: string;
    data: any;
    config: Record<string, any>;
  }>;
  trends: Array<{
    metric: string;
    direction: 'up' | 'down' | 'stable';
    magnitude: number;
    period: string;
  }>;
  correlations: Array<{
    feature1: string;
    feature2: string;
    correlation: number;
  }>;
}

export interface InsightRecommendation {
  id: string;
  title: string;
  description: string;
  action: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: number;
  timeline: string;
  resources: string[];
}

export interface MLPerformance {
  id: string;
  modelId: string;
  metric: string;
  value: number;
  timestamp: Date;
  metadata: PerformanceMetadata;
}

export interface PerformanceMetadata {
  context: Record<string, any>;
  tags: string[];
  version: string;
  environment: string;
}

export interface AIConfig {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  config: AIConfiguration;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIConfiguration {
  general: {
    enabled: boolean;
    environment: string;
    logLevel: string;
  };
  models: {
    autoRetrain: boolean;
    retrainInterval: number;
    accuracyThreshold: number;
    driftDetection: boolean;
  };
  monitoring: {
    enabled: boolean;
    metrics: string[];
    alerts: boolean;
    retention: number;
  };
  security: {
    encryption: boolean;
    accessControl: boolean;
    auditLogging: boolean;
  };
}

export interface AIStats {
  totalModels: number;
  activeModels: number;
  totalPredictions: number;
  successfulPredictions: number;
  totalAnomalies: number;
  resolvedAnomalies: number;
  totalInsights: number;
  actionedInsights: number;
  averageAccuracy: number;
  topModels: Array<{
    id: string;
    name: string;
    type: string;
    accuracy: number;
    predictions: number;
  }>;
  recentAnomalies: AnomalyDetection[];
  recentInsights: AIInsight[];
  systemHealth: {
    modelPerformance: number;
    dataQuality: number;
    systemReliability: number;
    predictionLatency: number;
  };
}

export interface PredictionRequest {
  modelId: string;
  input: any;
  options?: {
    timeout?: number;
    priority?: 'low' | 'normal' | 'high';
    metadata?: Record<string, any>;
  };
}

export interface PredictionResponse {
  id: string;
  modelId: string;
  input: any;
  output: any;
  confidence: number;
  processingTime: number;
  metadata: Record<string, any>;
  timestamp: Date;
}

export interface ModelDeployment {
  id: string;
  modelId: string;
  environment: string;
  status: 'DEPLOYING' | 'ACTIVE' | 'FAILED' | 'SCALING' | 'UPDATING';
  config: DeploymentConfig;
  metrics: DeploymentMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeploymentConfig {
  replicas: number;
  resources: {
    cpu: string;
    memory: string;
    gpu?: string;
  };
  scaling: {
    minReplicas: number;
    maxReplicas: number;
    targetCPU: number;
    targetMemory: number;
  };
  networking: {
    port: number;
    protocol: string;
    timeout: number;
  };
}

export interface DeploymentMetrics {
  requests: number;
  latency: number;
  errors: number;
  cpuUsage: number;
  memoryUsage: number;
  throughput: number;
}
