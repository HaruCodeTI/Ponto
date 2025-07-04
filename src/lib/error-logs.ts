/**
 * Tipos de erro
 */
export type ErrorType = 
  | 'NETWORK_ERROR'
  | 'DATABASE_ERROR'
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'SYNC_ERROR'
  | 'DEVICE_ERROR'
  | 'LOCATION_ERROR'
  | 'PHOTO_ERROR'
  | 'NFC_ERROR'
  | 'BIOMETRIC_ERROR'
  | 'NOTIFICATION_ERROR'
  | 'HASH_ERROR'
  | 'DUPLICATE_ERROR'
  | 'TIMEOUT_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'MAINTENANCE_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Níveis de severidade
 */
export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Status de sincronização
 */
export type SyncStatus = 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED' | 'RETRY' | 'CANCELLED';

/**
 * Interface para log de erro
 */
export interface ErrorLog {
  id: string;
  timestamp: string;
  errorType: ErrorType;
  severity: SeverityLevel;
  message: string;
  details: string;
  stackTrace?: string;
  userId?: string;
  employeeId?: string;
  companyId?: string;
  deviceInfo: {
    deviceType: 'MOBILE' | 'DESKTOP' | 'TABLET' | 'UNKNOWN';
    userAgent: string;
    platform: string;
    browser?: string;
    os?: string;
  };
  ipAddress?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  context: {
    action: string;
    endpoint?: string;
    method?: string;
    requestId?: string;
    sessionId?: string;
  };
  metadata: {
    retryCount: number;
    maxRetries: number;
    retryAfter?: string;
    errorCode?: string;
    errorId?: string;
    correlationId?: string;
    tags: string[];
  };
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
}

/**
 * Interface para log de sincronização
 */
export interface SyncLog {
  id: string;
  timestamp: string;
  syncType: 'PUSH' | 'PULL' | 'BIDIRECTIONAL' | 'BATCH' | 'REALTIME';
  status: SyncStatus;
  entityType: 'TIME_RECORD' | 'EMPLOYEE' | 'COMPANY' | 'NOTIFICATION' | 'AUDIT_LOG';
  entityId?: string;
  userId?: string;
  employeeId?: string;
  companyId?: string;
  deviceInfo: {
    deviceType: 'MOBILE' | 'DESKTOP' | 'TABLET' | 'UNKNOWN';
    userAgent: string;
    platform: string;
    connectionType?: string;
    isOnline: boolean;
  };
  ipAddress?: string;
  syncData: {
    recordsCount: number;
    bytesTransferred: number;
    startTime: string;
    endTime?: string;
    duration?: number;
    conflicts?: number;
    duplicates?: number;
    errors?: number;
  };
  conflicts: {
    entityId: string;
    localVersion: unknown;
    remoteVersion: unknown;
    resolution: 'LOCAL_WINS' | 'REMOTE_WINS' | 'MANUAL' | 'MERGE';
    resolvedBy?: string;
    resolvedAt?: string;
  }[];
  errors: {
    errorType: ErrorType;
    message: string;
    details: string;
    retryable: boolean;
  }[];
  metadata: {
    syncVersion: string;
    protocol: string;
    compression: boolean;
    encryption: boolean;
    batchSize: number;
    retryCount: number;
    maxRetries: number;
    tags: string[];
  };
}

/**
 * Interface para configuração de logs
 */
export interface ErrorLogConfig {
  enableErrorLogging: boolean;
  enableSyncLogging: boolean;
  logLevel: SeverityLevel;
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
}

/**
 * Configurações padrão
 */
export const DEFAULT_ERROR_LOG_CONFIG: ErrorLogConfig = {
  enableErrorLogging: true,
  enableSyncLogging: true,
  logLevel: 'MEDIUM',
  maxLogRetention: 90, // 90 dias
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
};

/**
 * Gera ID único para log
 */
function generateLogId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Determina severidade baseada no tipo de erro
 */
function determineSeverity(errorType: ErrorType): SeverityLevel {
  const severityMap: Record<ErrorType, SeverityLevel> = {
    NETWORK_ERROR: 'MEDIUM',
    DATABASE_ERROR: 'HIGH',
    VALIDATION_ERROR: 'LOW',
    AUTHENTICATION_ERROR: 'HIGH',
    AUTHORIZATION_ERROR: 'HIGH',
    SYNC_ERROR: 'MEDIUM',
    DEVICE_ERROR: 'MEDIUM',
    LOCATION_ERROR: 'LOW',
    PHOTO_ERROR: 'LOW',
    NFC_ERROR: 'MEDIUM',
    BIOMETRIC_ERROR: 'MEDIUM',
    NOTIFICATION_ERROR: 'LOW',
    HASH_ERROR: 'HIGH',
    DUPLICATE_ERROR: 'MEDIUM',
    TIMEOUT_ERROR: 'MEDIUM',
    RATE_LIMIT_ERROR: 'MEDIUM',
    MAINTENANCE_ERROR: 'HIGH',
    UNKNOWN_ERROR: 'HIGH',
  };
  
  return severityMap[errorType] || 'MEDIUM';
}

/**
 * Cria log de erro
 */
export async function createErrorLog(
  errorType: ErrorType,
  message: string,
  details: string,
  context: {
    action: string;
    endpoint?: string;
    method?: string;
    requestId?: string;
    sessionId?: string;
  },
  userInfo?: {
    userId?: string;
    employeeId?: string;
    companyId?: string;
  },
  deviceInfo?: {
    deviceType: 'MOBILE' | 'DESKTOP' | 'TABLET' | 'UNKNOWN';
    userAgent: string;
    platform: string;
    browser?: string;
    os?: string;
  },
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  },
  ipAddress?: string,
  stackTrace?: string,
  config: ErrorLogConfig = DEFAULT_ERROR_LOG_CONFIG
): Promise<ErrorLog> {
  if (!config.enableErrorLogging) {
    throw new Error('Error logging is disabled');
  }

  const severity = determineSeverity(errorType);
  
  // Verifica se deve logar baseado no nível configurado
  const severityLevels: SeverityLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const configLevelIndex = severityLevels.indexOf(config.logLevel);
  const errorLevelIndex = severityLevels.indexOf(severity);
  
  if (errorLevelIndex < configLevelIndex) {
    throw new Error(`Error severity ${severity} is below configured level ${config.logLevel}`);
  }

  const log: ErrorLog = {
    id: generateLogId(),
    timestamp: new Date().toISOString(),
    errorType,
    severity,
    message,
    details,
    stackTrace,
    userId: userInfo?.userId,
    employeeId: userInfo?.employeeId,
    companyId: userInfo?.companyId,
    deviceInfo: deviceInfo || {
      deviceType: 'UNKNOWN',
      userAgent: 'Unknown',
      platform: 'Unknown',
    },
    ipAddress,
    location,
    context,
    metadata: {
      retryCount: 0,
      maxRetries: config.retryConfig.maxRetries,
      tags: [errorType, severity, context.action],
    },
    resolved: false,
  };

  try {
    await saveErrorLog(log);
    console.error('Error log created:', {
      id: log.id,
      errorType: log.errorType,
      severity: log.severity,
      message: log.message,
      timestamp: log.timestamp,
    });
  } catch (error) {
    console.error('Failed to save error log:', error);
  }

  return log;
}

/**
 * Cria log de sincronização
 */
export async function createSyncLog(
  syncType: SyncLog['syncType'],
  entityType: SyncLog['entityType'],
  entityId: string,
  userInfo?: {
    userId?: string;
    employeeId?: string;
    companyId?: string;
  },
  deviceInfo?: {
    deviceType: 'MOBILE' | 'DESKTOP' | 'TABLET' | 'UNKNOWN';
    userAgent: string;
    platform: string;
    connectionType?: string;
    isOnline: boolean;
  },
  ipAddress?: string,
  config: ErrorLogConfig = DEFAULT_ERROR_LOG_CONFIG
): Promise<SyncLog> {
  if (!config.enableSyncLogging) {
    throw new Error('Sync logging is disabled');
  }

  const log: SyncLog = {
    id: generateLogId(),
    timestamp: new Date().toISOString(),
    syncType,
    status: 'PENDING',
    entityType,
    entityId,
    userId: userInfo?.userId,
    employeeId: userInfo?.employeeId,
    companyId: userInfo?.companyId,
    deviceInfo: deviceInfo || {
      deviceType: 'UNKNOWN',
      userAgent: 'Unknown',
      platform: 'Unknown',
      isOnline: true,
    },
    ipAddress,
    syncData: {
      recordsCount: 0,
      bytesTransferred: 0,
      startTime: new Date().toISOString(),
    },
    conflicts: [],
    errors: [],
    metadata: {
      syncVersion: '1.0',
      protocol: 'REST',
      compression: false,
      encryption: true,
      batchSize: 100,
      retryCount: 0,
      maxRetries: config.retryConfig.maxRetries,
      tags: [syncType, entityType, 'sync'],
    },
  };

  try {
    await saveSyncLog(log);
    console.log('Sync log created:', {
      id: log.id,
      syncType: log.syncType,
      entityType: log.entityType,
      status: log.status,
      timestamp: log.timestamp,
    });
  } catch (error) {
    console.error('Failed to save sync log:', error);
  }

  return log;
}

/**
 * Atualiza status de sincronização
 */
export async function updateSyncLogStatus(
  logId: string,
  status: SyncStatus,
  syncData?: Partial<SyncLog['syncData']>,
  errors?: SyncLog['errors']
): Promise<void> {
  try {
    // Em produção, isso seria uma atualização no banco
    console.log('Sync log status updated:', {
      logId,
      status,
      syncData,
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to update sync log status:', error);
  }
}

/**
 * Resolve erro
 */
export async function resolveError(
  logId: string,
  resolvedBy: string,
  resolution: string
): Promise<void> {
  try {
    // Em produção, isso seria uma atualização no banco
    console.log('Error resolved:', {
      logId,
      resolvedBy,
      resolution,
      resolvedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to resolve error:', error);
  }
}

/**
 * Busca logs de erro
 */
export async function getErrorLogs(
  filters: {
    errorType?: ErrorType;
    severity?: SeverityLevel;
    userId?: string;
    employeeId?: string;
    companyId?: string;
    resolved?: boolean;
    startDate?: string;
    endDate?: string;
  } = {},
  _limit: number = 100,
  _offset: number = 0
): Promise<ErrorLog[]> {
  try {
    // Em produção, isso seria uma consulta no banco
    console.log('Fetching error logs with filters:', filters);
    
    // Simula retorno
    return [];
  } catch (error) {
    console.error('Failed to fetch error logs:', error);
    return [];
  }
}

/**
 * Busca logs de sincronização
 */
export async function getSyncLogs(
  filters: {
    syncType?: SyncLog['syncType'];
    status?: SyncStatus;
    entityType?: SyncLog['entityType'];
    userId?: string;
    employeeId?: string;
    companyId?: string;
    startDate?: string;
    endDate?: string;
  } = {},
  _limit: number = 100,
  _offset: number = 0
): Promise<SyncLog[]> {
  try {
    // Em produção, isso seria uma consulta no banco
    console.log('Fetching sync logs with filters:', filters);
    
    // Simula retorno
    return [];
  } catch (error) {
    console.error('Failed to fetch sync logs:', error);
    return [];
  }
}

/**
 * Gera estatísticas de erro
 */
export async function getErrorStats(
  startDate: string,
  endDate: string,
  filters: {
    errorType?: ErrorType;
    severity?: SeverityLevel;
    userId?: string;
    employeeId?: string;
    companyId?: string;
  } = {}
): Promise<{
  totalErrors: number;
  errorsByType: Record<ErrorType, number>;
  errorsBySeverity: Record<SeverityLevel, number>;
  errorsByUser: Record<string, number>;
  errorsByDevice: Record<string, number>;
  resolutionTime: {
    average: number;
    median: number;
    min: number;
    max: number;
  };
  trends: {
    date: string;
    count: number;
  }[];
}> {
  try {
    // Em produção, isso seria uma consulta agregada no banco
    console.log('Generating error stats:', { startDate, endDate, filters });
    
    return {
      totalErrors: 0,
      errorsByType: {} as Record<ErrorType, number>,
      errorsBySeverity: {} as Record<SeverityLevel, number>,
      errorsByUser: {},
      errorsByDevice: {},
      resolutionTime: {
        average: 0,
        median: 0,
        min: 0,
        max: 0,
      },
      trends: [],
    };
  } catch (error) {
    console.error('Failed to generate error stats:', error);
    throw error;
  }
}

/**
 * Gera estatísticas de sincronização
 */
export async function getSyncStats(
  startDate: string,
  endDate: string,
  filters: {
    syncType?: SyncLog['syncType'];
    status?: SyncStatus;
    entityType?: SyncLog['entityType'];
    userId?: string;
    employeeId?: string;
    companyId?: string;
  } = {}
): Promise<{
  totalSyncs: number;
  syncsByType: Record<SyncLog['syncType'], number>;
  syncsByStatus: Record<SyncStatus, number>;
  syncsByEntity: Record<SyncLog['entityType'], number>;
  dataTransferred: number;
  averageDuration: number;
  successRate: number;
  conflictRate: number;
  errorRate: number;
  trends: {
    date: string;
    count: number;
    successCount: number;
    failureCount: number;
  }[];
}> {
  try {
    // Em produção, isso seria uma consulta agregada no banco
    console.log('Generating sync stats:', { startDate, endDate, filters });
    
    return {
      totalSyncs: 0,
      syncsByType: {} as Record<SyncLog['syncType'], number>,
      syncsByStatus: {} as Record<SyncStatus, number>,
      syncsByEntity: {} as Record<SyncLog['entityType'], number>,
      dataTransferred: 0,
      averageDuration: 0,
      successRate: 0,
      conflictRate: 0,
      errorRate: 0,
      trends: [],
    };
  } catch (error) {
    console.error('Failed to generate sync stats:', error);
    throw error;
  }
}

/**
 * Salva log de erro (simulado)
 */
async function saveErrorLog(_log: ErrorLog): Promise<void> {
  // Em produção, isso seria salvo no banco de dados
  // await prisma.errorLog.create({ data: log });
  
  // Por enquanto, apenas simula salvamento
  await new Promise(resolve => setTimeout(resolve, 10));
}

/**
 * Salva log de sincronização (simulado)
 */
async function saveSyncLog(_log: SyncLog): Promise<void> {
  // Em produção, isso seria salvo no banco de dados
  // await prisma.syncLog.create({ data: log });
  
  // Por enquanto, apenas simula salvamento
  await new Promise(resolve => setTimeout(resolve, 10));
}

/**
 * Gera relatório de erros
 */
export function generateErrorReport(logs: ErrorLog[]): string {
  let report = `=== RELATÓRIO DE ERROS ===\n\n`;
  report += `Período: ${logs[0]?.timestamp} até ${logs[logs.length - 1]?.timestamp}\n`;
  report += `Total de Erros: ${logs.length}\n\n`;

  // Estatísticas por tipo
  const errorsByType = logs.reduce((acc, _log) => {
    acc[_log.errorType] = (acc[_log.errorType] || 0) + 1;
    return acc;
  }, {} as Record<ErrorType, number>);

  report += `=== ERROS POR TIPO ===\n`;
  Object.entries(errorsByType).forEach(([type, count]) => {
    report += `${type}: ${count}\n`;
  });
  report += `\n`;

  // Estatísticas por severidade
  const errorsBySeverity = logs.reduce((acc, _log) => {
    acc[_log.severity] = (acc[_log.severity] || 0) + 1;
    return acc;
  }, {} as Record<SeverityLevel, number>);

  report += `=== ERROS POR SEVERIDADE ===\n`;
  Object.entries(errorsBySeverity).forEach(([severity, count]) => {
    report += `${severity}: ${count}\n`;
  });
  report += `\n`;

  // Logs detalhados
  report += `=== LOGS DETALHADOS ===\n`;
  logs.forEach((log, index) => {
    report += `${index + 1}. ${log.timestamp} - ${log.errorType} (${log.severity})\n`;
    report += `   Mensagem: ${log.message}\n`;
    report += `   Usuário: ${log.userId || 'N/A'} | Funcionário: ${log.employeeId || 'N/A'}\n`;
    report += `   Dispositivo: ${log.deviceInfo.deviceType} | IP: ${log.ipAddress || 'N/A'}\n`;
    report += `   Ação: ${log.context.action}\n`;
    report += `   Resolvido: ${log.resolved ? 'Sim' : 'Não'}\n`;
    if (log.resolved) {
      report += `   Resolvido por: ${log.resolvedBy} em ${log.resolvedAt}\n`;
      report += `   Resolução: ${log.resolution}\n`;
    }
    report += `\n`;
  });

  return report;
}

/**
 * Gera relatório de sincronização
 */
export function generateSyncReport(logs: SyncLog[]): string {
  let report = `=== RELATÓRIO DE SINCRONIZAÇÃO ===\n\n`;
  report += `Período: ${logs[0]?.timestamp} até ${logs[logs.length - 1]?.timestamp}\n`;
  report += `Total de Sincronizações: ${logs.length}\n\n`;

  // Estatísticas por tipo
  const syncsByType = logs.reduce((acc, _log) => {
    acc[_log.syncType] = (acc[_log.syncType] || 0) + 1;
    return acc;
  }, {} as Record<SyncLog['syncType'], number>);

  report += `=== SINCRONIZAÇÕES POR TIPO ===\n`;
  Object.entries(syncsByType).forEach(([type, count]) => {
    report += `${type}: ${count}\n`;
  });
  report += `\n`;

  // Estatísticas por status
  const syncsByStatus = logs.reduce((acc, _log) => {
    acc[_log.status] = (acc[_log.status] || 0) + 1;
    return acc;
  }, {} as Record<SyncStatus, number>);

  report += `=== SINCRONIZAÇÕES POR STATUS ===\n`;
  Object.entries(syncsByStatus).forEach(([status, count]) => {
    report += `${status}: ${count}\n`;
  });
  report += `\n`;

  // Estatísticas por entidade
  const syncsByEntity = logs.reduce((acc, _log) => {
    acc[_log.entityType] = (acc[_log.entityType] || 0) + 1;
    return acc;
  }, {} as Record<SyncLog['entityType'], number>);

  report += `=== SINCRONIZAÇÕES POR ENTIDADE ===\n`;
  Object.entries(syncsByEntity).forEach(([entity, count]) => {
    report += `${entity}: ${count}\n`;
  });
  report += `\n`;

  // Logs detalhados
  report += `=== LOGS DETALHADOS ===\n`;
  logs.forEach((log, index) => {
    report += `${index + 1}. ${log.timestamp} - ${log.syncType} (${log.status})\n`;
    report += `   Entidade: ${log.entityType} | ID: ${log.entityId || 'N/A'}\n`;
    report += `   Usuário: ${log.userId || 'N/A'} | Funcionário: ${log.employeeId || 'N/A'}\n`;
    report += `   Dispositivo: ${log.deviceInfo.deviceType} | Online: ${log.deviceInfo.isOnline}\n`;
    report += `   Registros: ${log.syncData.recordsCount} | Bytes: ${log.syncData.bytesTransferred}\n`;
    if (log.syncData.duration) {
      report += `   Duração: ${log.syncData.duration}ms\n`;
    }
    if (log.conflicts.length > 0) {
      report += `   Conflitos: ${log.conflicts.length}\n`;
    }
    if (log.errors.length > 0) {
      report += `   Erros: ${log.errors.length}\n`;
    }
    report += `\n`;
  });

  return report;
} 