/**
 * Tipos de registro de ponto
 */
export type RecordType = 'ENTRY' | 'EXIT' | 'BREAK_START' | 'BREAK_END';

/**
 * Interface para Registro de Ponto
 * Baseada no modelo TimeRecord do Prisma
 */
export interface TimeRecord {
  id: string;
  type: RecordType;
  timestamp: string; // ISO string
  latitude?: number;
  longitude?: number;
  ipAddress?: string;
  deviceInfo?: string;
  photoUrl?: string;
  nfcTag?: string;
  hash: string; // Hash único para garantir imutabilidade
  integrityHash: string; // Hash de integridade imutável
  integrityTimestamp: string; // Timestamp criptográfico
  createdAt: string; // ISO string
  
  // Relacionamentos
  userId: string;
  employeeId: string;
  companyId: string;
}

/**
 * Dados para criação de um novo registro de ponto
 */
export interface CreateTimeRecordData {
  type: RecordType;
  latitude?: number;
  longitude?: number;
  ipAddress?: string;
  deviceInfo?: string;
  photoUrl?: string;
  nfcTag?: string;
  userId: string;
  employeeId: string;
  companyId: string;
}

/**
 * Tipo para validação de localização
 */
export type LocationValidation = {
  isValid: boolean;
  distance?: number; // Distância em metros da empresa
  reason?: string; // Motivo da invalidação
};

/**
 * Tipo para validação de dispositivo
 */
export type DeviceValidation = {
  isValid: boolean;
  deviceId?: string;
  reason?: string;
};

/**
 * Tipo para validação de horário
 */
export type TimeValidation = {
  isValid: boolean;
  isWithinWorkHours: boolean;
  isWithinTolerance: boolean;
  reason?: string;
};

/**
 * Tipo para resultado completo de validação
 */
export type ValidationResult = {
  location: LocationValidation;
  device: DeviceValidation;
  time: TimeValidation;
  isDuplicate: boolean;
  isValid: boolean;
  errors: string[];
};

/**
 * Tipo para comprovante de ponto
 */
export type TimeRecordReceipt = {
  id: string;
  type: RecordType;
  timestamp: string;
  employeeName: string;
  companyName: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  deviceInfo?: string;
  hash: string;
  qrCode?: string; // Para verificação
};

/**
 * Tipo para filtros de histórico
 */
export type TimeRecordFilters = {
  startDate?: string;
  endDate?: string;
  type?: RecordType;
  employeeId?: string;
  companyId?: string;
};

/**
 * Tipo para resposta de registro de ponto
 */
export type TimeRecordResponse = {
  success: boolean;
  data?: TimeRecord;
  receipt?: TimeRecordReceipt;
  validation?: ValidationResult;
  error?: string;
};

/**
 * Tipo para logs de auditoria
 */
export type AuditLog = {
  id: string;
  action: 'CREATE' | 'VIEW' | 'EXPORT' | 'VALIDATE';
  userId: string;
  employeeId?: string;
  companyId: string;
  timestamp: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
};

/**
 * Tipo para justificativa de ajuste (compliance)
 */
export type AdjustmentJustification = {
  id: string;
  originalRecordId: string;
  reason: string;
  approvedBy: string;
  approvedAt: string;
  description: string;
  evidence?: string; // URL de arquivo de evidência
};

export type { PhotoCaptureResult } from "@/lib/photo-capture";

/**
 * Métodos de autenticação para registro de ponto
 */
export type AuthenticationMethod = 
  | 'MANUAL' 
  | 'NFC' 
  | 'BIOMETRIC' 
  | 'QR_CODE' 
  | 'PIN' 
  | 'FACE_ID' 
  | 'FINGERPRINT' 
  | 'WEBAUTHN';

/**
 * Status de tentativa de registro de ponto
 */
export type AttemptStatus = 
  | 'SUCCESS' 
  | 'FAILED' 
  | 'PENDING' 
  | 'CANCELLED' 
  | 'TIMEOUT' 
  | 'INVALID_LOCATION' 
  | 'INVALID_DEVICE' 
  | 'INVALID_TIME' 
  | 'DUPLICATE' 
  | 'AUTH_FAILED';

/**
 * Interface para logs de auditoria de ponto
 */
export interface TimeRecordAuditLog {
  id: string;
  timestamp: string; // ISO string
  action: 'TIME_RECORD_ATTEMPT' | 'TIME_RECORD_SUCCESS' | 'TIME_RECORD_FAILED' | 'AUTH_ATTEMPT' | 'AUTH_SUCCESS' | 'AUTH_FAILED';
  status: AttemptStatus;
  
  // Usuário e contexto
  userId: string;
  employeeId: string;
  companyId: string;
  
  // Método de autenticação
  authenticationMethod?: AuthenticationMethod;
  authenticationDetails?: {
    method: AuthenticationMethod;
    success: boolean;
    error?: string;
    deviceInfo?: {
      deviceId: string;
      deviceType: 'MOBILE' | 'DESKTOP' | 'TERMINAL';
      userAgent: string;
      platform: string;
    };
    credentialId?: string; // Para biometria/NFC
    cardNumber?: string; // Para NFC
  };
  
  // Localização e dispositivo
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  ipAddress?: string;
  deviceInfo: {
    deviceId: string;
    deviceType: 'MOBILE' | 'DESKTOP' | 'TERMINAL';
    userAgent: string;
    platform: string;
    screenResolution?: string;
    timezone: string;
  };
  
  // Dados do registro (se aplicável)
  timeRecordData?: {
    type: RecordType;
    timestamp: string;
    hash?: string;
    photoUrl?: string;
  };
  
  // Validações
  validations?: {
    location: LocationValidation;
    device: DeviceValidation;
    time: TimeValidation;
    isDuplicate: boolean;
    isValid: boolean;
    errors: string[];
  };
  
  // Detalhes e contexto
  details: string;
  warnings?: string[];
  metadata?: {
    sessionId?: string;
    requestId?: string;
    duration?: number; // Tempo de processamento em ms
    retryCount?: number;
    [key: string]: unknown;
  };
}

/**
 * Filtros para consulta de logs de auditoria
 */
export interface AuditLogFilters {
  startDate?: string;
  endDate?: string;
  userId?: string;
  employeeId?: string;
  companyId?: string;
  action?: TimeRecordAuditLog['action'];
  status?: AttemptStatus;
  authenticationMethod?: AuthenticationMethod;
  deviceType?: 'MOBILE' | 'DESKTOP' | 'TERMINAL';
  limit?: number;
  offset?: number;
}

/**
 * Resposta paginada de logs de auditoria
 */
export interface AuditLogResponse {
  logs: TimeRecordAuditLog[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Estatísticas de auditoria
 */
export interface AuditLogStats {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  successRate: number;
  attemptsByMethod: Record<AuthenticationMethod, number>;
  attemptsByStatus: Record<AttemptStatus, number>;
  attemptsByDeviceType: Record<'MOBILE' | 'DESKTOP' | 'TERMINAL', number>;
  attemptsByHour: Record<number, number>;
  averageProcessingTime: number;
}

/**
 * Tipos de relatório de ponto
 */
export type ReportType = 
  | 'DAILY_SUMMARY' 
  | 'WEEKLY_SUMMARY' 
  | 'MONTHLY_SUMMARY' 
  | 'EMPLOYEE_DETAILED' 
  | 'COMPANY_OVERVIEW' 
  | 'ATTENDANCE_ANALYSIS' 
  | 'OVERTIME_REPORT' 
  | 'LATE_ARRIVALS' 
  | 'EARLY_DEPARTURES' 
  | 'ABSENCES';

/**
 * Filtros para relatórios de ponto
 */
export interface TimeRecordReportFilters {
  startDate: string; // ISO string
  endDate: string; // ISO string
  reportType: ReportType;
  employeeId?: string;
  companyId?: string;
  departmentId?: string;
  includeInactive?: boolean;
  groupBy?: 'DAY' | 'WEEK' | 'MONTH' | 'EMPLOYEE' | 'DEPARTMENT';
  sortBy?: 'DATE' | 'EMPLOYEE' | 'HOURS' | 'OVERTIME' | 'LATES';
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Dados agregados de ponto por período
 */
export interface TimeRecordAggregatedData {
  date: string; // ISO string
  employeeId: string;
  employeeName: string;
  department?: string;
  totalHours: number; // Em horas
  regularHours: number;
  overtimeHours: number;
  breakHours: number;
  entryTime?: string; // ISO string
  exitTime?: string; // ISO string
  breakStartTime?: string; // ISO string
  breakEndTime?: string; // ISO string
  isComplete: boolean; // Se tem entrada e saída
  isLate: boolean;
  isEarlyDeparture: boolean;
  hasOvertime: boolean;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  records: TimeRecord[]; // Registros individuais do dia
}

/**
 * Estatísticas de ponto
 */
export interface TimeRecordStats {
  totalEmployees: number;
  totalDays: number;
  totalHours: number;
  totalOvertime: number;
  totalLates: number;
  totalAbsences: number;
  averageHoursPerDay: number;
  averageOvertimePerDay: number;
  attendanceRate: number; // Percentual de presença
  punctualityRate: number; // Percentual de pontualidade
  overtimeRate: number; // Percentual de horas extras
}

/**
 * Resumo diário de ponto
 */
export interface DailyTimeRecordSummary {
  date: string; // ISO string
  totalEmployees: number;
  presentEmployees: number;
  absentEmployees: number;
  lateEmployees: number;
  earlyDepartures: number;
  overtimeEmployees: number;
  totalHours: number;
  totalOvertime: number;
  averageHours: number;
  attendanceRate: number;
  punctualityRate: number;
}

/**
 * Resumo semanal de ponto
 */
export interface WeeklyTimeRecordSummary {
  weekStart: string; // ISO string
  weekEnd: string; // ISO string
  weekNumber: number;
  totalEmployees: number;
  totalDays: number;
  totalHours: number;
  totalOvertime: number;
  totalLates: number;
  totalAbsences: number;
  averageHoursPerDay: number;
  averageOvertimePerDay: number;
  attendanceRate: number;
  punctualityRate: number;
  dailySummaries: DailyTimeRecordSummary[];
}

/**
 * Resumo mensal de ponto
 */
export interface MonthlyTimeRecordSummary {
  month: string; // YYYY-MM
  year: number;
  monthNumber: number;
  totalEmployees: number;
  totalDays: number;
  totalHours: number;
  totalOvertime: number;
  totalLates: number;
  totalAbsences: number;
  averageHoursPerDay: number;
  averageOvertimePerDay: number;
  attendanceRate: number;
  punctualityRate: number;
  weeklySummaries: WeeklyTimeRecordSummary[];
}

/**
 * Análise de presença
 */
export interface AttendanceAnalysis {
  employeeId: string;
  employeeName: string;
  department?: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  earlyDepartureDays: number;
  attendanceRate: number;
  punctualityRate: number;
  averageHoursPerDay: number;
  totalOvertime: number;
  mostCommonEntryTime?: string;
  mostCommonExitTime?: string;
  patterns: {
    frequentLates: boolean;
    frequentEarlyDepartures: boolean;
    frequentOvertime: boolean;
    irregularPattern: boolean;
  };
}

/**
 * Relatório de horas extras
 */
export interface OvertimeReport {
  employeeId: string;
  employeeName: string;
  department?: string;
  totalOvertime: number;
  averageOvertimePerDay: number;
  overtimeDays: number;
  maxOvertimeInDay: number;
  overtimeByDay: Record<string, number>; // date -> hours
  overtimeByWeek: Record<string, number>; // week -> hours
  overtimeByMonth: Record<string, number>; // month -> hours
  isExcessive: boolean; // Se excede limite legal
  recommendations?: string[];
}

/**
 * Relatório de atrasos
 */
export interface LateArrivalsReport {
  employeeId: string;
  employeeName: string;
  department?: string;
  totalLates: number;
  averageDelay: number; // Em minutos
  maxDelay: number;
  latesByDay: Record<string, number>; // date -> minutes
  latesByWeek: Record<string, number>; // week -> count
  latesByMonth: Record<string, number>; // month -> count
  isFrequent: boolean; // Se é frequente
  reasons?: string[]; // Possíveis motivos
}

/**
 * Relatório de saídas antecipadas
 */
export interface EarlyDeparturesReport {
  employeeId: string;
  employeeName: string;
  department?: string;
  totalEarlyDepartures: number;
  averageEarlyDeparture: number; // Em minutos
  maxEarlyDeparture: number;
  earlyDeparturesByDay: Record<string, number>; // date -> minutes
  earlyDeparturesByWeek: Record<string, number>; // week -> count
  earlyDeparturesByMonth: Record<string, number>; // month -> count
  isFrequent: boolean;
  reasons?: string[];
}

/**
 * Relatório de ausências
 */
export interface AbsencesReport {
  employeeId: string;
  employeeName: string;
  department?: string;
  totalAbsences: number;
  justifiedAbsences: number;
  unjustifiedAbsences: number;
  absenceRate: number;
  absencesByDay: Record<string, boolean>; // date -> absent
  absencesByWeek: Record<string, number>; // week -> count
  absencesByMonth: Record<string, number>; // month -> count
  consecutiveAbsences: number;
  isExcessive: boolean;
  recommendations?: string[];
}

/**
 * Resposta de relatório de ponto
 */
export interface TimeRecordReportResponse {
  reportType: ReportType;
  filters: TimeRecordReportFilters;
  stats: TimeRecordStats;
  data: TimeRecordAggregatedData[];
  summaries?: {
    daily?: DailyTimeRecordSummary[];
    weekly?: WeeklyTimeRecordSummary[];
    monthly?: MonthlyTimeRecordSummary[];
  };
  analyses?: {
    attendance?: AttendanceAnalysis[];
    overtime?: OvertimeReport[];
    lates?: LateArrivalsReport[];
    earlyDepartures?: EarlyDeparturesReport[];
    absences?: AbsencesReport[];
  };
  generatedAt: string; // ISO string
  totalRecords: number;
}

/**
 * Configurações de exportação de relatório
 */
export interface ReportExportConfig {
  format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON';
  includeCharts?: boolean;
  includeDetails?: boolean;
  includeSummary?: boolean;
  customFields?: string[];
  fileName?: string;
}

/**
 * Tipos para validação de horário de trabalho
 */

/** Horário de trabalho diário */
export interface WorkDaySchedule {
  dayOfWeek: number; // 0-6 (Domingo-Sábado)
  dayName: string; // 'Segunda', 'Terça', etc.
  isWorkDay: boolean;
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  breakStartTime?: string; // HH:mm
  breakEndTime?: string; // HH:mm
  toleranceMinutes: number; // Tolerância para entrada/saída
}

/** Jornada semanal completa */
export interface WeeklyWorkSchedule {
  employeeId: string;
  workDays: WorkDaySchedule[];
  totalWeeklyHours: number;
  isFlexible: boolean; // Se permite flexibilidade de horário
  maxDailyHours: number;
  minDailyHours: number;
}

/** Resultado da validação de horário */
export interface WorkTimeValidation {
  isValid: boolean;
  isWithinWorkHours: boolean;
  isWithinTolerance: boolean;
  isWorkDay: boolean;
  currentDaySchedule?: WorkDaySchedule;
  currentTime: string; // HH:mm
  expectedStartTime?: string; // HH:mm
  expectedEndTime?: string; // HH:mm
  toleranceMinutes: number;
  delayMinutes?: number; // Minutos de atraso (se aplicável)
  earlyDepartureMinutes?: number; // Minutos de saída antecipada (se aplicável)
  warnings: string[];
  errors: string[];
}

/** Configuração de validação de horário */
export interface WorkTimeValidationConfig {
  allowEarlyEntry: boolean; // Permitir entrada antes do horário
  allowLateExit: boolean; // Permitir saída após o horário
  maxEarlyEntryMinutes: number; // Máximo de minutos para entrada antecipada
  maxLateExitMinutes: number; // Máximo de minutos para saída tardia
  requireBreak: boolean; // Se é obrigatório registrar intervalo
  minBreakMinutes: number; // Mínimo de minutos de intervalo
  maxBreakMinutes: number; // Máximo de minutos de intervalo
  flexibleSchedule: boolean; // Se permite horário flexível
  gracePeriodMinutes: number; // Período de tolerância adicional
}

/**
 * Tipos para detecção de duplicação de ponto
 */

/** Configuração de detecção de duplicação */
export interface DuplicateDetectionConfig {
  timeWindowMinutes: number; // Janela de tempo para considerar duplicação (ex: 5 minutos)
  checkLocation: boolean; // Se deve verificar localização similar
  locationThresholdMeters: number; // Distância máxima para considerar localização similar
  checkDevice: boolean; // Se deve verificar dispositivo similar
  checkIP: boolean; // Se deve verificar IP similar
  allowMultipleSameType: boolean; // Se permite múltiplos registros do mesmo tipo no mesmo dia
  maxRecordsPerDay: number; // Máximo de registros por dia por funcionário
}

/** Resultado da verificação de duplicação */
export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  duplicateType: 'TIME_WINDOW' | 'LOCATION' | 'DEVICE' | 'IP' | 'SAME_TYPE' | 'MAX_DAILY' | 'NONE';
  confidence: number; // 0-1, confiança da detecção
  similarRecords: TimeRecord[]; // Registros similares encontrados
  timeDifference?: number; // Diferença em minutos do registro mais próximo
  locationDifference?: number; // Diferença em metros da localização mais próxima
  warnings: string[];
  errors: string[];
}

/** Estratégias de detecção de duplicação */
export type DuplicateDetectionStrategy = 
  | 'EXACT_MATCH' // Correspondência exata
  | 'TIME_WINDOW' // Janela de tempo
  | 'LOCATION_BASED' // Baseado em localização
  | 'DEVICE_BASED' // Baseado em dispositivo
  | 'HYBRID' // Combinação de estratégias
  | 'AI_BASED'; // Baseado em IA (futuro)

/** Configuração de regras de duplicação */
export interface DuplicateRules {
  employeeId: string;
  companyId: string;
  rules: {
    timeWindowMinutes: number;
    locationThresholdMeters: number;
    maxRecordsPerDay: number;
    allowedTypesPerDay: RecordType[];
    blockedTypesPerDay: RecordType[];
  };
  exceptions: {
    allowMultipleEntries: boolean;
    allowMultipleExits: boolean;
    allowMultipleBreaks: boolean;
    specialDays: string[]; // Datas especiais (feriados, etc.)
  };
}

export type AdjustmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

/**
 * Interface para ajuste de registro de ponto
 */
export interface TimeRecordAdjustment {
  id: string;
  originalRecordId: string;
  originalRecord: TimeRecord;
  
  // Dados do ajuste
  adjustedTimestamp: string; // ISO string
  adjustedType?: RecordType;
  reason: string;
  evidence?: string;
  
  // Aprovação
  approvedBy: string;
  approvedAt: string; // ISO string
  approvalStatus: AdjustmentStatus;
  
  // Auditoria
  requestedBy: string;
  requestedAt: string; // ISO string
  companyId: string;
  
  // Campos de compliance
  complianceReason?: string;
  legalBasis?: string;
  retentionPeriod: number; // 5 anos em dias
  
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

/**
 * Dados para criação de ajuste
 */
export interface CreateAdjustmentData {
  originalRecordId: string;
  adjustedTimestamp: string; // ISO string
  adjustedType?: RecordType;
  reason: string;
  evidence?: string;
  complianceReason?: string;
  legalBasis?: string;
  requestedBy: string;
  companyId: string;
}

/**
 * Dados para aprovação de ajuste
 */
export interface ApproveAdjustmentData {
  adjustmentId: string;
  approvedBy: string;
  approvalStatus: 'APPROVED' | 'REJECTED';
  approvalNotes?: string;
}

/**
 * Filtros para busca de ajustes
 */
export interface AdjustmentFilters {
  companyId?: string;
  employeeId?: string;
  originalRecordId?: string;
  approvalStatus?: AdjustmentStatus;
  startDate?: string;
  endDate?: string;
  requestedBy?: string;
  approvedBy?: string;
  limit?: number;
  offset?: number;
}

/**
 * Resposta de ajustes
 */
export interface AdjustmentResponse {
  adjustments: TimeRecordAdjustment[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Estatísticas de ajustes
 */
export interface AdjustmentStats {
  totalAdjustments: number;
  pendingAdjustments: number;
  approvedAdjustments: number;
  rejectedAdjustments: number;
  averageProcessingTime: number; // Em horas
  adjustmentsByReason: Record<string, number>;
  adjustmentsByMonth: Record<string, number>;
  complianceRate: number; // Percentual de ajustes com base legal
}

/**
 * Motivos de compliance para ajustes
 */
export type ComplianceReason = 
  | 'FORGOT_TO_REGISTER'
  | 'TECHNICAL_FAILURE'
  | 'SYSTEM_ERROR'
  | 'POWER_OUTAGE'
  | 'NETWORK_ISSUE'
  | 'DEVICE_MALFUNCTION'
  | 'HUMAN_ERROR'
  | 'LEGAL_REQUIREMENT'
  | 'MEDICAL_EMERGENCY'
  | 'FAMILY_EMERGENCY'
  | 'PUBLIC_TRANSPORT_DELAY'
  | 'WEATHER_CONDITIONS'
  | 'OTHER';

/**
 * Base legal para ajustes
 */
export type LegalBasis = 
  | 'PORTARIA_671_2021'
  | 'CLT_ART_74'
  | 'CLT_ART_75'
  | 'CONVENCAO_COLETIVA'
  | 'ACORDO_COLETIVO'
  | 'POLITICA_INTERNA'
  | 'OTHER';

/**
 * Configuração de ajustes por empresa
 */
export interface AdjustmentConfig {
  companyId: string;
  allowAdjustments: boolean;
  requireApproval: boolean;
  maxAdjustmentDays: number; // Dias após o registro
  requireEvidence: boolean;
  allowedReasons: ComplianceReason[];
  autoApprovalLimit: number; // Minutos para auto-aprovação
  notificationRecipients: string[]; // Emails para notificação
  complianceMode: boolean; // Modo compliance ativo
  retentionPeriod: number; // Dias de retenção
} 