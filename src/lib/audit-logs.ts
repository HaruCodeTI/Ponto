import { prisma } from './prisma';
import { 
  AuditLog, 
  SecurityAlert, 
  DataRetentionPolicy, 
  PrivacyConsent, 
  AuditReport, 
  AuditStats,
  AuditFilter,
  AuditExportOptions,
  ComplianceCheck
} from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

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
    status: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'PENDING' | 'CANCELLED';
    details: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<AuditLog> {
  const session = await getServerSession(authOptions);
  
  const auditLog = await prisma.auditLog.create({
    data: {
      companyId: payload.companyId,
      userId: payload.userId || session?.user?.id || undefined,
      employeeId: payload.employeeId,
      sessionId: generateSessionId(),
      action: payload.action,
      category: 'SECURITY',
      severity: 'HIGH',
      status: payload.status,
      resourceType: 'USER',
      resourceId: payload.userId,
      oldValues: {},
      newValues: {},
      metadata: {
        user: {
          id: session?.user?.id,
          email: session?.user?.email,
          name: session?.user?.name,
          role: session?.user?.role
        },
        session: {
          id: generateSessionId(),
          startTime: undefined,
          duration: undefined
        },
        request: {
          method: 'POST',
          url: '/api/audit',
          headers: {},
          body: payload.metadata ? JSON.stringify(payload.metadata) : undefined
        },
        response: {
          statusCode: 200,
          duration: 0,
          size: 0
        },
        context: {
          browser: payload.userAgent || 'Unknown',
          os: 'Unknown',
          device: 'Unknown',
          screen: 'Unknown'
        },
        performance: {
          memoryUsage: 0,
          cpuUsage: 0,
          networkLatency: 0
        },
        security: {
          isEncrypted: true,
          hasValidToken: !!session?.user,
          permissions: []
        },
        ...payload.metadata
      },
      ipAddress: payload.ipAddress || await getClientIP(),
      userAgent: payload.userAgent || 'Unknown',
      location: 'Unknown'
    }
  });

  // Verificar se precisa criar alerta de segurança
  await checkSecurityAlerts(auditLog);

  return auditLog;
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
    status: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'PENDING' | 'CANCELLED';
    details: string;
    metadata?: Record<string, unknown>;
  }
): Promise<AuditLog> {
  const session = await getServerSession(authOptions);
  
  const auditLog = await prisma.auditLog.create({
    data: {
      companyId: payload.companyId,
      userId: payload.userId || session?.user?.id || undefined,
      employeeId: payload.employeeId,
      sessionId: generateSessionId(),
      action: payload.action,
      category: 'OTHER',
      severity: 'HIGH',
      status: payload.status,
      resourceType: 'SYSTEM',
      resourceId: 'SYSTEM',
      oldValues: {},
      newValues: {},
      metadata: {
        user: {
          id: session?.user?.id,
          email: session?.user?.email,
          name: session?.user?.name,
          role: session?.user?.role
        },
        session: {
          id: generateSessionId(),
          startTime: undefined,
          duration: undefined
        },
        request: {
          method: 'POST',
          url: '/api/audit',
          headers: {},
          body: payload.metadata ? JSON.stringify(payload.metadata) : undefined
        },
        response: {
          statusCode: 200,
          duration: 0,
          size: 0
        },
        context: {
          browser: 'Unknown',
          os: 'Unknown',
          device: 'Unknown',
          screen: 'Unknown'
        },
        performance: {
          memoryUsage: 0,
          cpuUsage: 0,
          networkLatency: 0
        },
        security: {
          isEncrypted: true,
          hasValidToken: !!session?.user,
          permissions: []
        },
        ...payload.metadata
      },
      ipAddress: 'Unknown',
      userAgent: 'Unknown',
      location: 'Unknown'
    }
  });

  return auditLog;
}

/**
 * Simula salvamento de log (em produção seria no banco)
 */
async function simulateSaveAuditLog(log: AuditLog): Promise<void> {
  // Simula delay de salvamento
  await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 20));
  
  // Em produção, salvaria no banco de dados
  // await prisma.auditLog.create({ data: log });
  
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
export function generateAuditReportText(logs: AuditLog[]): string {
  let report = `=== RELATÓRIO DE AUDITORIA ===\n\n`;
  report += `Data de Geração: ${new Date().toLocaleString('pt-BR')}\n`;
  report += `Total de Logs: ${logs.length}\n\n`;
  
  // Estatísticas
  const stats = {
    success: logs.filter(log => log.status === 'SUCCESS').length,
    failed: logs.filter(log => log.status === 'FAILED').length,
    authFailed: logs.filter(log => log.status === 'LOGIN_FAILED').length,
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
export function exportAuditLogs(logs: AuditLog[], format: 'JSON' | 'CSV' | 'TEXT'): string {
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

async function checkSecurityAlerts(auditLog: AuditLog): Promise<void> {
  // Verificar múltiplas tentativas de login falhadas
  if (auditLog.action === 'LOGIN_FAILED') {
    const recentFailures = await prisma.auditLog.count({
      where: {
        userId: auditLog.userId,
        action: 'LOGIN_FAILED',
        timestamp: {
          gte: new Date(Date.now() - 15 * 60 * 1000) // Últimos 15 minutos
        }
      }
    });

    if (recentFailures >= 5) {
      await createSecurityAlert({
        companyId: auditLog.companyId,
        type: 'MULTIPLE_FAILED_ATTEMPTS',
        severity: 'HIGH',
        title: 'Múltiplas tentativas de login falhadas',
        description: `Usuário ${auditLog.userId} tentou fazer login ${recentFailures} vezes em 15 minutos`,
        source: 'AUDIT_LOG',
        metadata: {
          trigger: {
            condition: 'Multiple failed login attempts',
            threshold: 5,
            currentValue: recentFailures,
            timeWindow: 15
          },
          context: {
            userId: auditLog.userId,
            ipAddress: auditLog.ipAddress,
            timestamp: auditLog.timestamp
          }
        }
      });
    }
  }

  // Verificar acesso a dados sensíveis
  if (auditLog.category === 'DATA_ACCESS' && auditLog.severity === 'HIGH') {
    await createSecurityAlert({
      companyId: auditLog.companyId,
      type: 'DATA_EXPORT',
      severity: 'MEDIUM',
      title: 'Acesso a dados sensíveis detectado',
      description: `Usuário ${auditLog.userId} acessou dados sensíveis`,
      source: 'AUDIT_LOG',
      metadata: {
        context: {
          userId: auditLog.userId,
          resourceType: auditLog.resourceType,
          resourceId: auditLog.resourceId,
          timestamp: auditLog.timestamp
        }
      }
    });
  }
}

export async function createSecurityAlert(
  data: {
    companyId: string;
    type: SecurityAlert['type'];
    severity: SecurityAlert['severity'];
    title: string;
    description: string;
    source: string;
    metadata?: any;
  }
): Promise<SecurityAlert> {
  return await prisma.securityAlert.create({
    data: {
      companyId: data.companyId,
      type: data.type,
      severity: data.severity,
      status: 'OPEN',
      title: data.title,
      description: data.description,
      source: data.source,
      metadata: {
        trigger: {
          condition: 'Manual',
          threshold: 0,
          currentValue: 0,
          timeWindow: 0
        },
        context: {
          timestamp: new Date()
        },
        impact: {
          riskLevel: data.severity,
          recommendations: []
        },
        investigation: {
          evidence: [],
          timeline: [],
          relatedLogs: []
        },
        ...data.metadata
      }
    }
  });
}

export async function findSecurityAlerts(
  filters: {
    companyId?: string;
    type?: string;
    severity?: string;
    status?: string;
  },
  page = 1,
  limit = 50
): Promise<{ data: SecurityAlert[]; total: number; page: number; totalPages: number }> {
  const whereClause: any = {};
  
  if (filters.companyId) whereClause.companyId = filters.companyId;
  if (filters.type) whereClause.type = filters.type;
  if (filters.severity) whereClause.severity = filters.severity;
  if (filters.status) whereClause.status = filters.status;

  const [data, total] = await Promise.all([
    prisma.securityAlert.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.securityAlert.count({ where: whereClause })
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

export async function acknowledgeSecurityAlert(
  alertId: string,
  acknowledgedBy: string
): Promise<SecurityAlert> {
  return await prisma.securityAlert.update({
    where: { id: alertId },
    data: {
      status: 'ACKNOWLEDGED',
      acknowledgedBy,
      acknowledgedAt: new Date()
    }
  });
}

export async function resolveSecurityAlert(
  alertId: string,
  resolvedBy: string
): Promise<SecurityAlert> {
  return await prisma.securityAlert.update({
    where: { id: alertId },
    data: {
      status: 'RESOLVED',
      resolvedBy,
      resolvedAt: new Date()
    }
  });
}

export async function getDataRetentionPolicies(companyId?: string): Promise<DataRetentionPolicy[]> {
  const whereClause = companyId ? { companyId } : {};

  return await prisma.dataRetentionPolicy.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' }
  });
}

export async function createDataRetentionPolicy(
  data: {
    companyId: string;
    dataType: string;
    retentionDays: number;
    description?: string;
  }
): Promise<DataRetentionPolicy> {
  return await prisma.dataRetentionPolicy.create({
    data: {
      companyId: data.companyId,
      dataType: data.dataType,
      retentionDays: data.retentionDays,
      description: data.description,
      isActive: true
    }
  });
}

export async function getPrivacyConsents(
  filters: {
    companyId?: string;
    userId?: string;
    consentType?: string;
    status?: string;
  },
  page = 1,
  limit = 50
): Promise<{ data: PrivacyConsent[]; total: number; page: number; totalPages: number }> {
  const whereClause: any = {};
  
  if (filters.companyId) whereClause.companyId = filters.companyId;
  if (filters.userId) whereClause.userId = filters.userId;
  if (filters.consentType) whereClause.consentType = filters.consentType;
  if (filters.status) whereClause.status = filters.status;

  const [data, total] = await Promise.all([
    prisma.privacyConsent.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.privacyConsent.count({ where: whereClause })
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

export async function createPrivacyConsent(
  data: {
    companyId: string;
    userId: string;
    consentType: PrivacyConsent['consentType'];
    status: PrivacyConsent['status'];
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
  }
): Promise<PrivacyConsent> {
  return await prisma.privacyConsent.create({
    data: {
      companyId: data.companyId,
      userId: data.userId,
      consentType: data.consentType,
      status: data.status,
      grantedAt: data.status === 'GRANTED' ? new Date() : undefined,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      metadata: {
        version: '1.0',
        legalBasis: 'Consent',
        purpose: 'Data processing',
        dataCategories: ['personal', 'usage'],
        thirdParties: [],
        retentionPeriod: 365,
        withdrawalMethod: 'Email',
        contactInfo: {
          email: 'privacy@company.com'
        },
        userPreferences: {
          marketing: false,
          analytics: true,
          essential: true
        },
        ...data.metadata
      }
    }
  });
}

export async function createAuditReport(data: {
  companyId: string;
  type: string;
  title: string;
  description: string;
  data: any;
  status?: string;
}): Promise<any> {
  const report = await prisma.auditReport.create({
    data: {
      companyId: data.companyId,
      type: data.type,
      title: data.title,
      description: data.description,
      data: data.data,
      status: data.status || 'DRAFT'
    }
  });

  return report;
}

export async function findAuditReports(
  filters: {
    companyId?: string;
    reportType?: string;
    status?: string;
  },
  page = 1,
  limit = 50
): Promise<{ data: AuditReport[]; total: number; page: number; totalPages: number }> {
  const whereClause: any = {};
  
  if (filters.companyId) whereClause.companyId = filters.companyId;
  if (filters.reportType) whereClause.reportType = filters.reportType;
  if (filters.status) whereClause.status = filters.status;

  const [data, total] = await Promise.all([
    prisma.auditReport.findMany({
      where: whereClause,
      orderBy: { generatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.auditReport.count({ where: whereClause })
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

export async function getAuditStats(companyId?: string): Promise<AuditStats> {
  const whereClause = companyId ? { companyId } : {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalLogs,
    todayLogs,
    criticalLogs,
    securityAlerts,
    openAlerts,
    byCategory,
    bySeverity,
    byStatus,
    topActions
  ] = await Promise.all([
    prisma.auditLog.count({ where: whereClause }),
    prisma.auditLog.count({ 
      where: { ...whereClause, timestamp: { gte: today } }
    }),
    prisma.auditLog.count({ 
      where: { ...whereClause, severity: 'CRITICAL' }
    }),
    prisma.securityAlert.count({ where: whereClause }),
    prisma.securityAlert.count({ 
      where: { ...whereClause, status: 'OPEN' }
    }),
    prisma.auditLog.groupBy({
      by: ['category'],
      where: whereClause,
      _count: { category: true }
    }),
    prisma.auditLog.groupBy({
      by: ['severity'],
      where: whereClause,
      _count: { severity: true }
    }),
    prisma.auditLog.groupBy({
      by: ['status'],
      where: whereClause,
      _count: { status: true }
    }),
    prisma.auditLog.groupBy({
      by: ['action'],
      where: whereClause,
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
      take: 10
    })
  ]);

  // Buscar alertas recentes
  const recentAlerts = await prisma.securityAlert.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  // Calcular score de compliance
  const complianceScore = await calculateComplianceScore(companyId);

  // Calcular compliance de retenção de dados
  const dataRetentionCompliance = await calculateDataRetentionCompliance(companyId);

  // Calcular taxa de consentimento de privacidade
  const privacyConsentRate = await calculatePrivacyConsentRate(companyId);

  // Buscar issues de compliance
  const complianceIssues = await findComplianceIssues(companyId);

  return {
    totalLogs,
    todayLogs,
    criticalLogs,
    securityAlerts,
    openAlerts,
    complianceScore,
    dataRetentionCompliance,
    privacyConsentRate,
    byCategory: byCategory.reduce((acc, item) => {
      acc[item.category] = item._count.category;
      return acc;
    }, {} as Record<string, number>),
    bySeverity: bySeverity.reduce((acc, item) => {
      acc[item.severity] = item._count.severity;
      return acc;
    }, {} as Record<string, number>),
    byStatus: byStatus.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>),
    topActions: topActions.map(item => ({
      action: item.action,
      count: item._count.action
    })),
    recentAlerts,
    complianceIssues
  };
}

async function calculateComplianceScore(companyId?: string): Promise<number> {
  const whereClause = companyId ? { companyId } : {};
  
  const [
    totalLogs,
    criticalLogs,
    securityAlerts,
    complianceViolations
  ] = await Promise.all([
    prisma.auditLog.count({ where: whereClause }),
    prisma.auditLog.count({ 
      where: { ...whereClause, severity: 'CRITICAL' }
    }),
    prisma.securityAlert.count({ 
      where: { ...whereClause, severity: { in: ['HIGH', 'CRITICAL'] } }
    }),
    prisma.auditLog.count({ 
      where: { ...whereClause, category: 'COMPLIANCE', status: 'FAILURE' }
    })
  ]);

  if (totalLogs === 0) return 100;

  const criticalScore = Math.max(0, 100 - (criticalLogs / totalLogs) * 100);
  const securityScore = Math.max(0, 100 - (securityAlerts / totalLogs) * 100);
  const complianceScore = Math.max(0, 100 - (complianceViolations / totalLogs) * 100);

  return Math.round((criticalScore + securityScore + complianceScore) / 3);
}

async function calculateDataRetentionCompliance(companyId?: string): Promise<number> {
  const whereClause = companyId ? { companyId } : {};
  
  const policies = await prisma.dataRetentionPolicy.findMany({
    where: { ...whereClause, isActive: true }
  });

  if (policies.length === 0) return 0;

  let compliantPolicies = 0;

  for (const policy of policies) {
    const expiredData = await prisma.auditLog.count({
      where: {
        ...whereClause,
        timestamp: {
          lt: new Date(Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000)
        }
      }
    });

    if (expiredData === 0) {
      compliantPolicies++;
    }
  }

  return Math.round((compliantPolicies / policies.length) * 100);
}

async function calculatePrivacyConsentRate(companyId?: string): Promise<number> {
  const whereClause = companyId ? { companyId } : {};
  
  const [totalConsents, grantedConsents] = await Promise.all([
    prisma.privacyConsent.count({ where: whereClause }),
    prisma.privacyConsent.count({ 
      where: { ...whereClause, status: 'GRANTED' }
    })
  ]);

  if (totalConsents === 0) return 0;

  return Math.round((grantedConsents / totalConsents) * 100);
}

async function findComplianceIssues(companyId?: string): Promise<Array<{
  type: string;
  count: number;
  severity: string;
}>> {
  const whereClause = companyId ? { companyId } : {};
  
  const issues = [];

  // Verificar violações LGPD
  const lgpdViolations = await prisma.auditLog.count({
    where: { ...whereClause, category: 'PRIVACY', status: 'FAILURE' }
  });
  if (lgpdViolations > 0) {
    issues.push({
      type: 'LGPD Violations',
      count: lgpdViolations,
      severity: 'HIGH'
    });
  }

  // Verificar alertas de segurança não resolvidos
  const openSecurityAlerts = await prisma.securityAlert.count({
    where: { ...whereClause, status: 'OPEN', severity: { in: ['HIGH', 'CRITICAL'] } }
  });
  if (openSecurityAlerts > 0) {
    issues.push({
      type: 'Open Security Alerts',
      count: openSecurityAlerts,
      severity: 'CRITICAL'
    });
  }

  // Verificar falhas de auditoria
  const auditFailures = await prisma.auditLog.count({
    where: { ...whereClause, category: 'AUDIT_FAILURE' }
  });
  if (auditFailures > 0) {
    issues.push({
      type: 'Audit Failures',
      count: auditFailures,
      severity: 'MEDIUM'
    });
  }

  return issues;
}

/**
 * Busca logs de auditoria com filtros
 */
export async function findAuditLogs(
  filters: {
    companyId?: string;
    userId?: string;
    employeeId?: string;
    action?: string;
    category?: string;
    severity?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  },
  page = 1,
  limit = 50
): Promise<{ data: AuditLog[]; total: number; page: number; totalPages: number }> {
  const whereClause: any = {};
  
  if (filters.companyId) whereClause.companyId = filters.companyId;
  if (filters.userId) whereClause.userId = filters.userId;
  if (filters.employeeId) whereClause.employeeId = filters.employeeId;
  if (filters.action) whereClause.action = filters.action;
  if (filters.category) whereClause.category = filters.category;
  if (filters.severity) whereClause.severity = filters.severity;
  if (filters.status) whereClause.status = filters.status;
  
  if (filters.startDate || filters.endDate) {
    whereClause.timestamp = {};
    if (filters.startDate) whereClause.timestamp.gte = filters.startDate;
    if (filters.endDate) whereClause.timestamp.lte = filters.endDate;
  }

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.auditLog.count({ where: whereClause })
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Cria log de auditoria genérico
 */
export async function createAuditLog(
  payload: {
    userId: string;
    employeeId: string;
    companyId: string;
    action: string;
    category: 'AUTHENTICATION' | 'AUTHORIZATION' | 'DATA_ACCESS' | 'DATA_MODIFICATION' | 'SYSTEM_CONFIG' | 'SECURITY' | 'COMPLIANCE' | 'BACKUP_RESTORE' | 'REPORT_GENERATION' | 'USER_MANAGEMENT' | 'EMPLOYEE_MANAGEMENT' | 'TIME_RECORD' | 'PAYROLL' | 'NOTIFICATION' | 'API_ACCESS' | 'FILE_OPERATION' | 'DATABASE_OPERATION' | 'NETWORK_ACCESS' | 'PRIVACY' | 'OTHER';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    status: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'PENDING' | 'CANCELLED';
    resourceType: string;
    resourceId: string;
    details: string;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<AuditLog> {
  const session = await getServerSession(authOptions);
  
  const auditLog = await prisma.auditLog.create({
    data: {
      companyId: payload.companyId,
      userId: payload.userId || session?.user?.id || undefined,
      employeeId: payload.employeeId,
      sessionId: generateSessionId(),
      action: payload.action,
      category: payload.category,
      severity: payload.severity,
      status: payload.status,
      resourceType: payload.resourceType,
      resourceId: payload.resourceId,
      oldValues: payload.oldValues || {},
      newValues: payload.newValues || {},
      metadata: {
        user: {
          id: session?.user?.id,
          email: session?.user?.email,
          name: session?.user?.name,
          role: session?.user?.role
        },
        session: {
          id: generateSessionId(),
          startTime: undefined,
          duration: undefined
        },
        request: {
          method: 'POST',
          url: '/api/audit',
          headers: {},
          body: payload.metadata ? JSON.stringify(payload.metadata) : undefined
        },
        response: {
          statusCode: 200,
          duration: 0,
          size: 0
        },
        context: {
          browser: payload.userAgent || 'Unknown',
          os: 'Unknown',
          device: 'Unknown',
          screen: 'Unknown'
        },
        performance: {
          memoryUsage: 0,
          cpuUsage: 0,
          networkLatency: 0
        },
        security: {
          isEncrypted: true,
          hasValidToken: !!session?.user,
          permissions: []
        },
        ...payload.metadata
      },
      ipAddress: payload.ipAddress || await getClientIP(),
      userAgent: payload.userAgent || 'Unknown',
      location: 'Unknown'
    }
  });

  return auditLog;
} 