import { TimeRecord, RecordType } from "@/types/time-record";

/**
 * Tipos de notificação
 */
export type NotificationType = 
  | 'TIME_RECORD_SUCCESS'
  | 'TIME_RECORD_FAILED'
  | 'ADJUSTMENT_REQUEST'
  | 'ADJUSTMENT_APPROVED'
  | 'ADJUSTMENT_REJECTED'
  | 'SYSTEM_ALERT'
  | 'COMPLIANCE_WARNING'
  | 'DAILY_SUMMARY'
  | 'OVERTIME_WARNING'
  | 'LATE_ARRIVAL'
  | 'EARLY_DEPARTURE'
  | 'MISSING_RECORD';

/**
 * Prioridades de notificação
 */
export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

/**
 * Interface para notificação
 */
export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  recipientId: string;
  recipientType: 'EMPLOYEE' | 'MANAGER' | 'ADMIN' | 'SYSTEM';
  companyId: string;
  employeeId?: string;
  timeRecordId?: string;
  adjustmentId?: string;
  metadata?: {
    location?: { latitude: number; longitude: number };
    deviceInfo?: string;
    ipAddress?: string;
    [key: string]: unknown;
  };
  read: boolean;
  createdAt: string;
  expiresAt?: string;
  actionUrl?: string;
  actionText?: string;
}

/**
 * Interface para configurações de notificação
 */
export interface NotificationConfig {
  enabled: boolean;
  types: NotificationType[];
  priority: NotificationPriority;
  channels: ('IN_APP' | 'EMAIL' | 'SMS' | 'PUSH')[];
  schedule?: {
    startTime?: string; // HH:mm
    endTime?: string; // HH:mm
    timezone?: string;
    daysOfWeek?: number[]; // 0-6 (Domingo-Sábado)
  };
  autoDelete?: {
    enabled: boolean;
    daysToKeep: number;
  };
}

/**
 * Configurações padrão para notificações
 */
export const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  enabled: true,
  types: [
    'TIME_RECORD_SUCCESS',
    'TIME_RECORD_FAILED',
    'ADJUSTMENT_REQUEST',
    'ADJUSTMENT_APPROVED',
    'ADJUSTMENT_REJECTED',
    'SYSTEM_ALERT',
    'COMPLIANCE_WARNING',
    'OVERTIME_WARNING',
    'LATE_ARRIVAL',
    'EARLY_DEPARTURE',
  ],
  priority: 'MEDIUM',
  channels: ['IN_APP'],
  autoDelete: {
    enabled: true,
    daysToKeep: 30,
  },
};

/**
 * Gera ID único para notificação
 */
function generateNotificationId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `notif_${timestamp}_${random}`;
}

/**
 * Cria notificação de registro de ponto bem-sucedido
 */
export function createTimeRecordSuccessNotification(
  timeRecord: TimeRecord,
  employeeName: string,
  _companyName: string
): Notification {
  const getTypeLabel = (type: RecordType): string => {
    switch (type) {
      case 'ENTRY': return 'Entrada';
      case 'EXIT': return 'Saída';
      case 'BREAK_START': return 'Início do Intervalo';
      case 'BREAK_END': return 'Fim do Intervalo';
      default: return type;
    }
  };

  return {
    id: generateNotificationId(),
    type: 'TIME_RECORD_SUCCESS',
    priority: 'LOW',
    title: `Ponto registrado com sucesso`,
    message: `${getTypeLabel(timeRecord.type)} registrada às ${new Date(timeRecord.timestamp).toLocaleTimeString('pt-BR')} - ${employeeName}`,
    recipientId: timeRecord.userId,
    recipientType: 'EMPLOYEE',
    companyId: timeRecord.companyId,
    employeeId: timeRecord.employeeId,
    timeRecordId: timeRecord.id,
    metadata: {
      location: timeRecord.latitude && timeRecord.longitude ? {
        latitude: timeRecord.latitude,
        longitude: timeRecord.longitude,
      } : undefined,
      deviceInfo: timeRecord.deviceInfo,
      ipAddress: timeRecord.ipAddress,
    },
    read: false,
    createdAt: new Date().toISOString(),
    actionUrl: `/funcionarios/${timeRecord.employeeId}`,
    actionText: 'Ver detalhes',
  };
}

/**
 * Cria notificação de falha no registro de ponto
 */
export function createTimeRecordFailedNotification(
  userId: string,
  employeeId: string,
  companyId: string,
  error: string,
  attemptData: Partial<TimeRecord>
): Notification {
  return {
    id: generateNotificationId(),
    type: 'TIME_RECORD_FAILED',
    priority: 'HIGH',
    title: `Falha no registro de ponto`,
    message: `Erro ao registrar ponto: ${error}`,
    recipientId: userId,
    recipientType: 'EMPLOYEE',
    companyId,
    employeeId,
    metadata: {
      location: attemptData.latitude && attemptData.longitude ? {
        latitude: attemptData.latitude,
        longitude: attemptData.longitude,
      } : undefined,
      deviceInfo: attemptData.deviceInfo,
      ipAddress: attemptData.ipAddress,
      error,
    },
    read: false,
    createdAt: new Date().toISOString(),
    actionUrl: `/bater-ponto`,
    actionText: 'Tentar novamente',
  };
}

/**
 * Cria notificação de solicitação de ajuste
 */
export function createAdjustmentRequestNotification(
  adjustmentId: string,
  originalRecordId: string,
  requestedBy: string,
  employeeId: string,
  companyId: string,
  reason: string
): Notification {
  return {
    id: generateNotificationId(),
    type: 'ADJUSTMENT_REQUEST',
    priority: 'MEDIUM',
    title: `Solicitação de ajuste de ponto`,
    message: `Nova solicitação de ajuste para registro ${originalRecordId}: ${reason}`,
    recipientId: 'manager', // Em produção, seria o ID do gestor
    recipientType: 'MANAGER',
    companyId,
    employeeId,
    adjustmentId,
    metadata: {
      requestedBy,
      originalRecordId,
      reason,
    },
    read: false,
    createdAt: new Date().toISOString(),
    actionUrl: `/empresa/ajustes`,
    actionText: 'Revisar solicitação',
  };
}

/**
 * Cria notificação de ajuste aprovado
 */
export function createAdjustmentApprovedNotification(
  adjustmentId: string,
  employeeId: string,
  companyId: string,
  approvedBy: string
): Notification {
  return {
    id: generateNotificationId(),
    type: 'ADJUSTMENT_APPROVED',
    priority: 'MEDIUM',
    title: `Ajuste de ponto aprovado`,
    message: `Seu ajuste de ponto foi aprovado por ${approvedBy}`,
    recipientId: 'employee', // Em produção, seria o ID do funcionário
    recipientType: 'EMPLOYEE',
    companyId,
    employeeId,
    adjustmentId,
    metadata: {
      approvedBy,
    },
    read: false,
    createdAt: new Date().toISOString(),
    actionUrl: `/funcionarios/${employeeId}`,
    actionText: 'Ver registro',
  };
}

/**
 * Cria notificação de ajuste rejeitado
 */
export function createAdjustmentRejectedNotification(
  adjustmentId: string,
  employeeId: string,
  companyId: string,
  rejectedBy: string,
  rejectionReason: string
): Notification {
  return {
    id: generateNotificationId(),
    type: 'ADJUSTMENT_REJECTED',
    priority: 'HIGH',
    title: `Ajuste de ponto rejeitado`,
    message: `Seu ajuste foi rejeitado: ${rejectionReason}`,
    recipientId: 'employee', // Em produção, seria o ID do funcionário
    recipientType: 'EMPLOYEE',
    companyId,
    employeeId,
    adjustmentId,
    metadata: {
      rejectedBy,
      rejectionReason,
    },
    read: false,
    createdAt: new Date().toISOString(),
    actionUrl: `/empresa/ajustes`,
    actionText: 'Ver detalhes',
  };
}

/**
 * Cria notificação de alerta de compliance
 */
export function createComplianceWarningNotification(
  employeeId: string,
  companyId: string,
  warning: string,
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
): Notification {
  const priority: NotificationPriority = severity === 'HIGH' ? 'URGENT' : severity === 'MEDIUM' ? 'HIGH' : 'MEDIUM';

  return {
    id: generateNotificationId(),
    type: 'COMPLIANCE_WARNING',
    priority,
    title: `Alerta de Compliance`,
    message: warning,
    recipientId: 'manager', // Em produção, seria o ID do gestor
    recipientType: 'MANAGER',
    companyId,
    employeeId,
    metadata: {
      severity,
      warning,
    },
    read: false,
    createdAt: new Date().toISOString(),
    actionUrl: `/empresa/compliance`,
    actionText: 'Ver alertas',
  };
}

/**
 * Cria notificação de horas extras
 */
export function createOvertimeWarningNotification(
  employeeId: string,
  companyId: string,
  overtimeHours: number,
  date: string
): Notification {
  return {
    id: generateNotificationId(),
    type: 'OVERTIME_WARNING',
    priority: 'MEDIUM',
    title: `Horas Extras Detectadas`,
    message: `${overtimeHours}h extras registradas em ${new Date(date).toLocaleDateString('pt-BR')}`,
    recipientId: 'manager', // Em produção, seria o ID do gestor
    recipientType: 'MANAGER',
    companyId,
    employeeId,
    metadata: {
      overtimeHours,
      date,
    },
    read: false,
    createdAt: new Date().toISOString(),
    actionUrl: `/relatorios`,
    actionText: 'Ver relatório',
  };
}

/**
 * Cria notificação de atraso
 */
export function createLateArrivalNotification(
  employeeId: string,
  companyId: string,
  delayMinutes: number,
  expectedTime: string,
  actualTime: string
): Notification {
  return {
    id: generateNotificationId(),
    type: 'LATE_ARRIVAL',
    priority: 'MEDIUM',
    title: `Atraso Detectado`,
    message: `Funcionário chegou ${delayMinutes} minutos atrasado (${expectedTime} → ${actualTime})`,
    recipientId: 'manager', // Em produção, seria o ID do gestor
    recipientType: 'MANAGER',
    companyId,
    employeeId,
    metadata: {
      delayMinutes,
      expectedTime,
      actualTime,
    },
    read: false,
    createdAt: new Date().toISOString(),
    actionUrl: `/funcionarios/${employeeId}`,
    actionText: 'Ver registro',
  };
}

/**
 * Cria notificação de saída antecipada
 */
export function createEarlyDepartureNotification(
  employeeId: string,
  companyId: string,
  earlyMinutes: number,
  expectedTime: string,
  actualTime: string
): Notification {
  return {
    id: generateNotificationId(),
    type: 'EARLY_DEPARTURE',
    priority: 'MEDIUM',
    title: `Saída Antecipada`,
    message: `Funcionário saiu ${earlyMinutes} minutos antes (${expectedTime} → ${actualTime})`,
    recipientId: 'manager', // Em produção, seria o ID do gestor
    recipientType: 'MANAGER',
    companyId,
    employeeId,
    metadata: {
      earlyMinutes,
      expectedTime,
      actualTime,
    },
    read: false,
    createdAt: new Date().toISOString(),
    actionUrl: `/funcionarios/${employeeId}`,
    actionText: 'Ver registro',
  };
}

/**
 * Cria notificação de registro ausente
 */
export function createMissingRecordNotification(
  employeeId: string,
  companyId: string,
  date: string,
  missingType: RecordType
): Notification {
  const getTypeLabel = (type: RecordType): string => {
    switch (type) {
      case 'ENTRY': return 'entrada';
      case 'EXIT': return 'saída';
      case 'BREAK_START': return 'início do intervalo';
      case 'BREAK_END': return 'fim do intervalo';
      default: return type;
    }
  };

  return {
    id: generateNotificationId(),
    type: 'MISSING_RECORD',
    priority: 'HIGH',
    title: `Registro Ausente`,
    message: `Registro de ${getTypeLabel(missingType)} ausente em ${new Date(date).toLocaleDateString('pt-BR')}`,
    recipientId: 'employee', // Em produção, seria o ID do funcionário
    recipientType: 'EMPLOYEE',
    companyId,
    employeeId,
    metadata: {
      date,
      missingType,
    },
    read: false,
    createdAt: new Date().toISOString(),
    actionUrl: `/bater-ponto`,
    actionText: 'Registrar ponto',
  };
}

/**
 * Cria notificação de resumo diário
 */
export function createDailySummaryNotification(
  companyId: string,
  date: string,
  summary: {
    totalEmployees: number;
    presentEmployees: number;
    absentEmployees: number;
    lateEmployees: number;
    overtimeEmployees: number;
  }
): Notification {
  return {
    id: generateNotificationId(),
    type: 'DAILY_SUMMARY',
    priority: 'LOW',
    title: `Resumo Diário - ${new Date(date).toLocaleDateString('pt-BR')}`,
    message: `${summary.presentEmployees}/${summary.totalEmployees} presentes, ${summary.lateEmployees} atrasos, ${summary.overtimeEmployees} horas extras`,
    recipientId: 'manager', // Em produção, seria o ID do gestor
    recipientType: 'MANAGER',
    companyId,
    metadata: {
      date,
      summary,
    },
    read: false,
    createdAt: new Date().toISOString(),
    actionUrl: `/relatorios`,
    actionText: 'Ver relatório completo',
  };
}

/**
 * Simula envio de notificação via WebSocket
 */
export async function sendNotification(notification: Notification): Promise<void> {
  // Em produção, isso seria enviado via WebSocket
  console.log('Enviando notificação:', notification);
  
  // Simula delay de rede
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Em produção, seria:
  // await websocket.send(JSON.stringify(notification));
}

/**
 * Marca notificação como lida
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  // Em produção, isso seria salvo no banco
  console.log('Marcando notificação como lida:', notificationId);
}

/**
 * Busca notificações do usuário
 */
export async function getUserNotifications(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ notifications: Notification[]; total: number }> {
  // Em produção, isso seria buscado do banco
  // Por enquanto, retorna dados simulados
  const mockNotifications: Notification[] = [
    createTimeRecordSuccessNotification(
      {
        id: '1',
        type: 'ENTRY',
        timestamp: new Date().toISOString(),
        hash: 'hash1',
        createdAt: new Date().toISOString(),
        userId,
        employeeId: 'emp1',
        companyId: 'comp1',
      },
      'João Silva',
      'Empresa ABC'
    ),
  ];

  return {
    notifications: mockNotifications.slice(offset, offset + limit),
    total: mockNotifications.length,
  };
}

/**
 * Deleta notificações antigas
 */
export async function cleanupOldNotifications(daysToKeep: number = 30): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  // Em produção, isso deletaria notificações antigas do banco
  console.log('Limpando notificações antigas antes de:', cutoffDate.toISOString());
} 