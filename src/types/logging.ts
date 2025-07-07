/**
 * Tipos para sistema completo de logs
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export type LogCategory = 
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'TIME_RECORD'
  | 'EMPLOYEE'
  | 'COMPANY'
  | 'SYSTEM'
  | 'NETWORK'
  | 'DATABASE'
  | 'VALIDATION'
  | 'NOTIFICATION'
  | 'BACKUP'
  | 'SYNC'
  | 'SECURITY'
  | 'PERFORMANCE'
  | 'COMPLIANCE'
  | 'OTHER';

export type LogStatus = 
  | 'SUCCESS'
  | 'FAILED'
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'CANCELLED'
  | 'TIMEOUT'
  | 'RETRY';

export type SyncType = 
  | 'PUSH'
  | 'PULL'
  | 'BIDIRECTIONAL'
  | 'BATCH'
  | 'REALTIME'
  | 'BACKUP'
  | 'RESTORE';

export type SyncStatus = 
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'SUCCESS'
  | 'FAILED'
  | 'RETRY'
  | 'CANCELLED'
  | 'CONFLICT';

export type EntityType = 
  | 'TIME_RECORD'
  | 'EMPLOYEE'
  | 'COMPANY'
  | 'NOTIFICATION'
  | 'AUDIT_LOG'
  | 'SYSTEM_LOG'
  | 'BACKUP'
  | 'CONFIGURATION';

export type DeviceType = 
  | 'MOBILE'
  | 'DESKTOP'
  | 'TABLET'
  | 'TERMINAL'
  | 'UNKNOWN';

/**
 * Interface para log do sistema
 */
export interface SystemLog {
  id: string;
  timestamp: string; // ISO string
  level: LogLevel;
  category: LogCategory;
  action: string;
  status: LogStatus;
  
  // Contexto do usuário
  userId?: string;
  employeeId?: string;
  companyId?: string;
  
  // Informações do dispositivo
  deviceType: DeviceType;
  userAgent?: string;
  ipAddress?: string;
  platform?: string;
  isOnline: boolean;
  
  // Detalhes da operação
  details: string;
  errorMessage?: string;
  stackTrace?: string;
  
  // Dados da operação
  operationData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  
  // Performance
  duration?: number; // Duração em milissegundos
  memoryUsage?: number; // Uso de memória em MB
  
  // Sincronização
  syncId?: string;
  retryCount: number;
  maxRetries: number;
  
  // Compliance
  retentionPeriod: number; // 5 anos em dias
  isComplianceRequired: boolean;
  
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

/**
 * Interface para log de sincronização
 */
export interface SyncLog {
  id: string;
  timestamp: string; // ISO string
  syncType: SyncType;
  status: SyncStatus;
  entityType: EntityType;
  entityId?: string;
  
  // Contexto do usuário
  userId?: string;
  employeeId?: string;
  companyId?: string;
  
  // Informações do dispositivo
  deviceType: DeviceType;
  userAgent?: string;
  ipAddress?: string;
  platform?: string;
  connectionType?: string;
  isOnline: boolean;
  
  // Dados da sincronização
  recordsCount: number;
  bytesTransferred: number;
  startTime: string; // ISO string
  endTime?: string; // ISO string
  duration?: number; // Duração em milissegundos
  
  // Conflitos e erros
  conflictsCount: number;
  duplicatesCount: number;
  errorsCount: number;
  
  // Detalhes dos conflitos
  conflicts?: Array<{
    entityId: string;
    localVersion: unknown;
    remoteVersion: unknown;
    resolution: 'LOCAL_WINS' | 'REMOTE_WINS' | 'MANUAL' | 'MERGE';
    resolvedBy?: string;
    resolvedAt?: string;
  }>;
  errors?: Array<{
    errorType: string;
    message: string;
    details: string;
    retryable: boolean;
  }>;
  
  // Metadados da sincronização
  syncVersion: string;
  protocol: string;
  compression: boolean;
  encryption: boolean;
  batchSize: number;
  retryCount: number;
  maxRetries: number;
  tags: string[];
  
  // Compliance
  retentionPeriod: number; // 5 anos em dias
  isComplianceRequired: boolean;
  
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

/**
 * Interface para log de uso
 */
export interface UsageLog {
  id: string;
  timestamp: string; // ISO string
  action: string;
  resource: string;
  resourceId?: string;
  
  // Contexto do usuário
  userId: string;
  employeeId?: string;
  companyId: string;
  
  // Informações da sessão
  sessionId?: string;
  requestId?: string;
  
  // Informações do dispositivo
  deviceType: DeviceType;
  userAgent?: string;
  ipAddress?: string;
  platform?: string;
  isOnline: boolean;
  
  // Detalhes da operação
  method?: string; // Método HTTP
  endpoint?: string; // Endpoint acessado
  statusCode?: number; // Código de status
  responseTime?: number; // Tempo de resposta em ms
  
  // Dados da operação
  requestData?: Record<string, unknown>;
  responseData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  
  // Performance
  duration?: number; // Duração em milissegundos
  memoryUsage?: number; // Uso de memória em MB
  
  // Compliance
  retentionPeriod: number; // 5 anos em dias
  isComplianceRequired: boolean;
  
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

/**
 * Dados para criação de log do sistema
 */
export interface CreateSystemLogData {
  level: LogLevel;
  category: LogCategory;
  action: string;
  status: LogStatus;
  details: string;
  
  // Contexto do usuário
  userId?: string;
  employeeId?: string;
  companyId?: string;
  
  // Informações do dispositivo
  deviceType: DeviceType;
  userAgent?: string;
  ipAddress?: string;
  platform?: string;
  isOnline?: boolean;
  
  // Detalhes da operação
  errorMessage?: string;
  stackTrace?: string;
  operationData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  
  // Performance
  duration?: number;
  memoryUsage?: number;
  
  // Sincronização
  syncId?: string;
  retryCount?: number;
  maxRetries?: number;
}

/**
 * Dados para criação de log de sincronização
 */
export interface CreateSyncLogData {
  syncType: SyncType;
  entityType: EntityType;
  entityId?: string;
  
  // Contexto do usuário
  userId?: string;
  employeeId?: string;
  companyId?: string;
  
  // Informações do dispositivo
  deviceType: DeviceType;
  userAgent?: string;
  ipAddress?: string;
  platform?: string;
  connectionType?: string;
  isOnline?: boolean;
  
  // Dados da sincronização
  recordsCount?: number;
  bytesTransferred?: number;
  
  // Metadados da sincronização
  syncVersion?: string;
  protocol?: string;
  compression?: boolean;
  encryption?: boolean;
  batchSize?: number;
  maxRetries?: number;
  tags?: string[];
}

/**
 * Dados para criação de log de uso
 */
export interface CreateUsageLogData {
  action: string;
  resource: string;
  resourceId?: string;
  
  // Contexto do usuário
  userId: string;
  employeeId?: string;
  companyId: string;
  
  // Informações da sessão
  sessionId?: string;
  requestId?: string;
  
  // Informações do dispositivo
  deviceType: DeviceType;
  userAgent?: string;
  ipAddress?: string;
  platform?: string;
  isOnline?: boolean;
  
  // Detalhes da operação
  method?: string;
  endpoint?: string;
  statusCode?: number;
  responseTime?: number;
  
  // Dados da operação
  requestData?: Record<string, unknown>;
  responseData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  
  // Performance
  duration?: number;
  memoryUsage?: number;
}

/**
 * Filtros para busca de logs do sistema
 */
export interface SystemLogFilters {
  level?: LogLevel;
  category?: LogCategory;
  status?: LogStatus;
  userId?: string;
  employeeId?: string;
  companyId?: string;
  deviceType?: DeviceType;
  syncId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * Filtros para busca de logs de sincronização
 */
export interface SyncLogFilters {
  syncType?: SyncType;
  status?: SyncStatus;
  entityType?: EntityType;
  userId?: string;
  employeeId?: string;
  companyId?: string;
  deviceType?: DeviceType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * Filtros para busca de logs de uso
 */
export interface UsageLogFilters {
  action?: string;
  resource?: string;
  userId?: string;
  employeeId?: string;
  companyId?: string;
  deviceType?: DeviceType;
  sessionId?: string;
  method?: string;
  statusCode?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * Resposta de logs do sistema
 */
export interface SystemLogResponse {
  logs: SystemLog[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Resposta de logs de sincronização
 */
export interface SyncLogResponse {
  logs: SyncLog[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Resposta de logs de uso
 */
export interface UsageLogResponse {
  logs: UsageLog[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Estatísticas de logs do sistema
 */
export interface SystemLogStats {
  totalLogs: number;
  logsByLevel: Record<LogLevel, number>;
  logsByCategory: Record<LogCategory, number>;
  logsByStatus: Record<LogStatus, number>;
  logsByDeviceType: Record<DeviceType, number>;
  errorRate: number; // Percentual de erros
  averageResponseTime: number; // Tempo médio de resposta
  criticalErrors: number;
  trends: Array<{
    date: string;
    count: number;
    errorCount: number;
    criticalCount: number;
  }>;
}

/**
 * Estatísticas de logs de sincronização
 */
export interface SyncLogStats {
  totalSyncs: number;
  syncsByType: Record<SyncType, number>;
  syncsByStatus: Record<SyncStatus, number>;
  syncsByEntity: Record<EntityType, number>;
  dataTransferred: number; // Total de bytes transferidos
  averageDuration: number; // Duração média em ms
  successRate: number; // Taxa de sucesso
  conflictRate: number; // Taxa de conflitos
  errorRate: number; // Taxa de erros
  trends: Array<{
    date: string;
    count: number;
    successCount: number;
    failureCount: number;
  }>;
}

/**
 * Estatísticas de logs de uso
 */
export interface UsageLogStats {
  totalRequests: number;
  requestsByAction: Record<string, number>;
  requestsByResource: Record<string, number>;
  requestsByDeviceType: Record<DeviceType, number>;
  requestsByStatusCode: Record<number, number>;
  averageResponseTime: number; // Tempo médio de resposta
  errorRate: number; // Taxa de erros (4xx, 5xx)
  activeUsers: number; // Usuários únicos
  peakUsageHour: number; // Hora de pico
  trends: Array<{
    date: string;
    count: number;
    errorCount: number;
    uniqueUsers: number;
  }>;
}

/**
 * Configuração de logs
 */
export interface LoggingConfig {
  enableSystemLogging: boolean;
  enableSyncLogging: boolean;
  enableUsageLogging: boolean;
  logLevel: LogLevel;
  maxLogRetention: number; // dias
  maxLogSize: number; // MB
  enableRealTimeAlerts: boolean;
  alertThresholds: {
    criticalErrors: number;
    highErrors: number;
    syncFailures: number;
    timeWindow: number; // minutos
  };
  retryConfig: {
    maxRetries: number;
    baseDelay: number; // ms
    maxDelay: number; // ms
    backoffMultiplier: number;
  };
  complianceConfig: {
    retentionPeriod: number; // dias (mínimo 5 anos)
    isComplianceRequired: boolean;
    auditTrailRequired: boolean;
    encryptionRequired: boolean;
  };
}

/**
 * Configurações padrão
 */
export const DEFAULT_LOGGING_CONFIG: LoggingConfig = {
  enableSystemLogging: true,
  enableSyncLogging: true,
  enableUsageLogging: true,
  logLevel: 'INFO',
  maxLogRetention: 1825, // 5 anos
  maxLogSize: 1000, // 1GB
  enableRealTimeAlerts: true,
  alertThresholds: {
    criticalErrors: 5,
    highErrors: 20,
    syncFailures: 10,
    timeWindow: 15, // 15 minutos
  },
  retryConfig: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
  },
  complianceConfig: {
    retentionPeriod: 1825, // 5 anos
    isComplianceRequired: true,
    auditTrailRequired: true,
    encryptionRequired: true,
  },
}; 