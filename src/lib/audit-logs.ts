import { 
  TimeRecordAuditLog
} from "@/types/time-record";

/**
 * Configurações para logs de auditoria
 */
export interface AuditLogConfig {
  enableRealTimeLogging: boolean;
  enablePerformanceTracking: boolean;
  enableSecurityAlerts: boolean;
  retentionDays: number;
  maxLogSize: number; // em MB
  enableCompression: boolean;
  enableEncryption: boolean;
}

/**
 * Configurações padrão para logs de auditoria
 */
export const DEFAULT_AUDIT_CONFIG: AuditLogConfig = {
  enableRealTimeLogging: true,
  enablePerformanceTracking: true,
  enableSecurityAlerts: true,
  retentionDays: 1825, // 5 anos (compliance legal)
  maxLogSize: 100, // 100MB
  enableCompression: true,
  enableEncryption: false, // false para desenvolvimento
};

/**
 * Gera ID único para log de auditoria
 */
export function generateAuditLogId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `audit_${timestamp}_${random}`;
}

/**
 * Gera ID de sessão único
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Gera ID de requisição único
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Obtém informações detalhadas do dispositivo
 */
export function getDetailedDeviceInfo() {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const language = navigator.language;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Detecta tipo de dispositivo
  let deviceType: 'MOBILE' | 'DESKTOP' | 'TERMINAL' = 'DESKTOP';
  if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    deviceType = 'MOBILE';
  } else if (/iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(userAgent)) {
    deviceType = 'MOBILE'; // Tablets são tratados como mobile
  } else {
    deviceType = 'DESKTOP';
  }

  return {
    deviceId: generateDeviceFingerprint(),
    deviceType,
    userAgent,
    platform,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone,
    language,
    cookieEnabled: navigator.cookieEnabled,
    localStorageEnabled: (() => {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
      } catch {
        return false;
      }
    })(),
    sessionStorageEnabled: (() => {
      try {
        sessionStorage.setItem('test', 'test');
        sessionStorage.removeItem('test');
        return true;
      } catch {
        return false;
      }
    })(),
  };
}

/**
 * Gera fingerprint único do dispositivo
 */
function generateDeviceFingerprint(): string {
  const components: string[] = [];
  
  // Informações básicas
  components.push(navigator.userAgent);
  components.push(navigator.language);
  components.push(screen.width.toString());
  components.push(screen.height.toString());
  components.push(screen.colorDepth.toString());
  components.push(new Date().getTimezoneOffset().toString());
  
  // Informações de hardware (se disponível)
  if (navigator.hardwareConcurrency) {
    components.push(navigator.hardwareConcurrency.toString());
  }
  
  if (navigator.maxTouchPoints) {
    components.push(navigator.maxTouchPoints.toString());
  }
  
  // Combina e gera hash
  const combined = components.join('|');
  return btoa(combined).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
}

/**
 * Obtém IP do cliente (simulado para desenvolvimento)
 */
export async function getClientIP(): Promise<string | undefined> {
  try {
    // Em produção, seria obtido do header X-Forwarded-For ou similar
    // Por enquanto, simula um IP
    return `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  } catch {
    return undefined;
  }
}

/**
 * Cria log de auditoria de segurança
 */
export async function createSecurityAuditLog(
  payload: {
    userId: string;
    employeeId: string;
    companyId: string;
    action: 'LOGIN_ATTEMPT' | 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'PASSWORD_CHANGE' | 'PERMISSION_CHANGE' | 'DATA_ACCESS' | 'SYSTEM_ACCESS';
    status: 'SUCCESS' | 'FAILED' | 'BLOCKED' | 'SUSPICIOUS';
    details: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<TimeRecordAuditLog> {
  const startTime = Date.now();
  
  try {
    const deviceInfo = getDetailedDeviceInfo();
    const ipAddress = payload.ipAddress || await getClientIP();
    
    const log: TimeRecordAuditLog = {
      id: generateAuditLogId(),
      timestamp: new Date().toISOString(),
      action: 'AUTH_ATTEMPT', // Mapeia para ação de auditoria
      status: payload.status === 'SUCCESS' ? 'SUCCESS' : 'AUTH_FAILED',
      userId: payload.userId,
      employeeId: payload.employeeId,
      companyId: payload.companyId,
      authenticationMethod: 'MANUAL',
      authenticationDetails: {
        method: 'MANUAL',
        success: payload.status === 'SUCCESS',
        error: payload.status !== 'SUCCESS' ? payload.details : undefined,
        deviceInfo,
      },
      ipAddress,
      deviceInfo,
      details: payload.details,
      metadata: {
        ...payload.metadata,
        duration: Date.now() - startTime,
        sessionId: generateSessionId(),
        requestId: generateRequestId(),
        securityEvent: true,
        originalAction: payload.action,
      },
    };

    // Em produção, salvaria no banco de dados
    await simulateSaveAuditLog(log);
    
    return log;
  } catch {
    console.error('Erro ao criar log de segurança');
    
    return {
      id: generateAuditLogId(),
      timestamp: new Date().toISOString(),
      action: 'AUTH_ATTEMPT',
      status: 'FAILED',
      userId: payload.userId,
      employeeId: payload.employeeId,
      companyId: payload.companyId,
      deviceInfo: getDetailedDeviceInfo(),
      details: `Erro ao criar log de segurança: Erro desconhecido`,
      metadata: {
        duration: Date.now() - startTime,
        error: true,
        securityEvent: true,
      },
    };
  }
}

/**
 * Cria log de auditoria de sistema
 */
export async function createSystemAuditLog(
  payload: {
    userId: string;
    employeeId: string;
    companyId: string;
    action: 'SYSTEM_STARTUP' | 'SYSTEM_SHUTDOWN' | 'BACKUP_START' | 'BACKUP_COMPLETE' | 'MAINTENANCE_START' | 'MAINTENANCE_COMPLETE' | 'ERROR_LOG' | 'PERFORMANCE_ALERT';
    status: 'SUCCESS' | 'FAILED' | 'WARNING' | 'INFO';
    details: string;
    metadata?: Record<string, unknown>;
  }
): Promise<TimeRecordAuditLog> {
  const startTime = Date.now();
  
  try {
    const deviceInfo = getDetailedDeviceInfo();
    
    const log: TimeRecordAuditLog = {
      id: generateAuditLogId(),
      timestamp: new Date().toISOString(),
      action: 'TIME_RECORD_ATTEMPT', // Mapeia para ação de auditoria
      status: payload.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
      userId: payload.userId,
      employeeId: payload.employeeId,
      companyId: payload.companyId,
      deviceInfo,
      details: payload.details,
      metadata: {
        ...payload.metadata,
        duration: Date.now() - startTime,
        sessionId: generateSessionId(),
        requestId: generateRequestId(),
        systemEvent: true,
        originalAction: payload.action,
      },
    };

    await simulateSaveAuditLog(log);
    
    return log;
  } catch {
    console.error('Erro ao criar log de sistema');
    
    return {
      id: generateAuditLogId(),
      timestamp: new Date().toISOString(),
      action: 'TIME_RECORD_ATTEMPT',
      status: 'FAILED',
      userId: payload.userId,
      employeeId: payload.employeeId,
      companyId: payload.companyId,
      deviceInfo: getDetailedDeviceInfo(),
      details: `Erro ao criar log de sistema: Erro desconhecido`,
      metadata: {
        duration: Date.now() - startTime,
        error: true,
        systemEvent: true,
      },
    };
  }
}

/**
 * Simula salvamento de log (em produção seria no banco)
 */
async function simulateSaveAuditLog(log: TimeRecordAuditLog): Promise<void> {
  // Simula delay de salvamento
  await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 20));
  
  // Em produção, salvaria no banco de dados
  // await prisma.timeRecordAuditLog.create({ data: log });
  
  // Por enquanto, apenas log no console
  console.log('Log de auditoria salvo:', {
    id: log.id,
    action: log.action,
    status: log.status,
    userId: log.userId,
    timestamp: log.timestamp,
    securityEvent: log.metadata?.securityEvent,
    systemEvent: log.metadata?.systemEvent,
  });
}

/**
 * Gera relatório de auditoria em formato texto
 */
export function generateAuditReport(logs: TimeRecordAuditLog[]): string {
  let report = `=== RELATÓRIO DE AUDITORIA ===\n\n`;
  report += `Data de Geração: ${new Date().toLocaleString('pt-BR')}\n`;
  report += `Total de Logs: ${logs.length}\n\n`;
  
  // Estatísticas
  const stats = {
    success: logs.filter(log => log.status === 'SUCCESS').length,
    failed: logs.filter(log => log.status === 'FAILED').length,
    authFailed: logs.filter(log => log.status === 'AUTH_FAILED').length,
    mobile: logs.filter(log => log.deviceInfo.deviceType === 'MOBILE').length,
    desktop: logs.filter(log => log.deviceInfo.deviceType === 'DESKTOP').length,
  };
  
  report += `=== ESTATÍSTICAS ===\n`;
  report += `Sucessos: ${stats.success}\n`;
  report += `Falhas: ${stats.failed}\n`;
  report += `Falhas de Autenticação: ${stats.authFailed}\n`;
  report += `Dispositivos Móveis: ${stats.mobile}\n`;
  report += `Desktops: ${stats.desktop}\n\n`;
  
  // Logs detalhados
  report += `=== LOGS DETALHADOS ===\n`;
  logs.forEach((log, index) => {
    report += `${index + 1}. ${log.timestamp} - ${log.action} - ${log.status}\n`;
    report += `   Usuário: ${log.userId} | Funcionário: ${log.employeeId}\n`;
    report += `   Dispositivo: ${log.deviceInfo.deviceType} | IP: ${log.ipAddress || 'N/A'}\n`;
    report += `   Detalhes: ${log.details}\n`;
    if (log.warnings && log.warnings.length > 0) {
      report += `   Avisos: ${log.warnings.join(', ')}\n`;
    }
    report += `\n`;
  });
  
  return report;
}

/**
 * Exporta logs para diferentes formatos
 */
export function exportAuditLogs(logs: TimeRecordAuditLog[], format: 'JSON' | 'CSV' | 'TEXT'): string {
  switch (format) {
    case 'JSON':
      return JSON.stringify(logs, null, 2);
    
    case 'CSV': {
      const headers = ['ID', 'Timestamp', 'Action', 'Status', 'UserId', 'EmployeeId', 'CompanyId', 'Details'];
      const rows = logs.map(log => [
        log.id,
        log.timestamp,
        log.action,
        log.status,
        log.userId,
        log.employeeId,
        log.companyId,
        log.details,
      ]);
      
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      return csvContent;
    }
    
    case 'TEXT': {
      const headers = ['ID', 'Timestamp', 'Action', 'Status', 'UserID', 'EmployeeID', 'DeviceType', 'IP', 'Details'];
      const csvRows = [headers.join(',')];
      
      logs.forEach(log => {
        const row = [
          log.id,
          log.timestamp,
          log.action,
          log.status,
          log.userId,
          log.employeeId,
          log.deviceInfo.deviceType,
          log.ipAddress || '',
          `"${log.details.replace(/"/g, '""')}"`,
        ];
        csvRows.push(row.join(','));
      });
      
      return csvRows.join('\n');
    }
    
    default:
      return JSON.stringify(logs, null, 2);
  }
} 