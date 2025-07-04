import { getCurrentLocation, Location, validateLocation } from "./geolocation";
import { LocationValidation, CreateTimeRecordData, RecordType, TimeRecordAuditLog, AuditLogFilters, AuditLogResponse, AuditLogStats, AuthenticationMethod, AttemptStatus } from "@/types/time-record";

/**
 * Captura geolocalização para registro de ponto
 * Inclui validações específicas e tratamento de erros
 */
export async function captureLocationForTimeRecord(): Promise<{
  location: Location | null;
  validation: LocationValidation;
  error?: string;
}> {
  try {
    const location = await getCurrentLocation();
    
    return {
      location,
      validation: {
        isValid: true,
        distance: 0, // Será calculado quando comparado com localização da empresa
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    
    return {
      location: null,
      validation: {
        isValid: false,
        reason: errorMessage,
      },
      error: errorMessage,
    };
  }
}

/**
 * Valida localização do funcionário em relação à empresa
 */
export function validateEmployeeLocation(
  employeeLocation: Location,
  companyLocation: Location,
  maxDistance: number = 100, // 100 metros por padrão
): LocationValidation {
  const validation = validateLocation(employeeLocation, companyLocation, maxDistance);
  
  return {
    isValid: validation.isValid,
    distance: validation.distance,
    reason: validation.error,
  };
}

/**
 * Gera dados de registro de ponto com geolocalização
 */
export async function generateTimeRecordData(
  type: RecordType,
  userId: string,
  employeeId: string,
  companyId: string,
  companyLocation?: Location,
): Promise<{
  data: CreateTimeRecordData;
  locationValidation: LocationValidation;
  error?: string;
}> {
  // Captura localização
  const locationResult = await captureLocationForTimeRecord();
  
  if (!locationResult.location) {
    return {
      data: {
        type,
        userId,
        employeeId,
        companyId,
        deviceInfo: getDeviceInfo(),
        ipAddress: await getClientIP(),
      },
      locationValidation: locationResult.validation,
      error: locationResult.error,
    };
  }

  // Valida localização se empresa tiver coordenadas
  let locationValidation: LocationValidation = { isValid: true };
  if (companyLocation) {
    locationValidation = validateEmployeeLocation(locationResult.location, companyLocation);
  }

  // Gera dados do registro
  const data: CreateTimeRecordData = {
    type,
    latitude: locationResult.location.latitude,
    longitude: locationResult.location.longitude,
    userId,
    employeeId,
    companyId,
    deviceInfo: getDeviceInfo(),
    ipAddress: await getClientIP(),
  };

  return {
    data,
    locationValidation,
  };
}

/**
 * Obtém informações do dispositivo
 */
function getDeviceInfo(): string {
  if (typeof window === "undefined") return "Server";
  
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const language = navigator.language;
  
  return `${platform} - ${userAgent} - ${language}`;
}

/**
 * Obtém IP do cliente (simulado - em produção seria via API)
 */
async function getClientIP(): Promise<string | undefined> {
  try {
    // Em produção, isso seria obtido via API externa ou headers do servidor
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  } catch {
    return undefined;
  }
}

/**
 * Gera hash único para o registro de ponto
 */
export function generateTimeRecordHash(
  location: Location,
  timestamp: Date,
  userId: string,
  type: RecordType,
): string {
  const data = `${location.latitude}-${location.longitude}-${timestamp.getTime()}-${userId}-${type}`;
  return btoa(data).replace(/[^a-zA-Z0-9]/g, "");
}

/**
 * Formata localização para exibição
 */
export function formatLocationForDisplay(location: Location): string {
  const lat = Math.abs(location.latitude);
  const lon = Math.abs(location.longitude);
  const latDir = location.latitude >= 0 ? "N" : "S";
  const lonDir = location.longitude >= 0 ? "E" : "W";

  return `${lat.toFixed(6)}°${latDir}, ${lon.toFixed(6)}°${lonDir}`;
}

/**
 * Gera ID único para log de auditoria
 */
function generateAuditLogId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Obtém informações detalhadas do dispositivo
 */
function getDetailedDeviceInfo() {
  if (typeof window === "undefined") {
    return {
      deviceId: "server",
      deviceType: "DESKTOP" as const,
      userAgent: "Server",
      platform: "Server",
      screenResolution: undefined,
      timezone: "UTC",
    };
  }

  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Detecta tipo de dispositivo
  let deviceType: 'MOBILE' | 'DESKTOP' | 'TERMINAL' = 'DESKTOP';
  if (/mobile|android|iphone|ipad|phone/.test(userAgent.toLowerCase())) {
    deviceType = 'MOBILE';
  } else if (/terminal|kiosk|point-of-sale/.test(userAgent.toLowerCase())) {
    deviceType = 'TERMINAL';
  }

  // Gera ID único do dispositivo
  const deviceId = btoa(`${platform}-${userAgent}-${timezone}`).replace(/[^a-zA-Z0-9]/g, "").substring(0, 16);

  return {
    deviceId,
    deviceType,
    userAgent,
    platform,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone,
  };
}

/**
 * Cria log de auditoria de tentativa de registro de ponto
 */
export async function createTimeRecordAuditLog(
  payload: {
    userId: string;
    employeeId: string;
    companyId: string;
    action: TimeRecordAuditLog['action'];
    status: AttemptStatus;
    authenticationMethod?: AuthenticationMethod;
    authenticationDetails?: TimeRecordAuditLog['authenticationDetails'];
    location?: Location;
    timeRecordData?: TimeRecordAuditLog['timeRecordData'];
    validations?: TimeRecordAuditLog['validations'];
    details: string;
    warnings?: string[];
    metadata?: TimeRecordAuditLog['metadata'];
  }
): Promise<TimeRecordAuditLog> {
  const startTime = Date.now();
  
  try {
    const deviceInfo = getDetailedDeviceInfo();
    const ipAddress = await getClientIP();
    
    const log: TimeRecordAuditLog = {
      id: generateAuditLogId(),
      timestamp: new Date().toISOString(),
      action: payload.action,
      status: payload.status,
      userId: payload.userId,
      employeeId: payload.employeeId,
      companyId: payload.companyId,
      authenticationMethod: payload.authenticationMethod,
      authenticationDetails: payload.authenticationDetails,
      location: payload.location ? {
        latitude: payload.location.latitude,
        longitude: payload.location.longitude,
      } : undefined,
      ipAddress,
      deviceInfo,
      timeRecordData: payload.timeRecordData,
      validations: payload.validations,
      details: payload.details,
      warnings: payload.warnings,
      metadata: {
        ...payload.metadata,
        duration: Date.now() - startTime,
        sessionId: generateSessionId(),
        requestId: generateAuditLogId(),
      },
    };

    // Em produção, salvaria no banco de dados
    // Por enquanto, simula salvamento
    await simulateSaveAuditLog(log);
    
    return log;
  } catch (error) {
    // Log de erro na criação do log (meta-log)
    console.error('Erro ao criar log de auditoria:', error);
    
    // Retorna log básico de erro
    return {
      id: generateAuditLogId(),
      timestamp: new Date().toISOString(),
      action: payload.action,
      status: 'FAILED',
      userId: payload.userId,
      employeeId: payload.employeeId,
      companyId: payload.companyId,
      deviceInfo: getDetailedDeviceInfo(),
      details: `Erro ao criar log: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      metadata: {
        duration: Date.now() - startTime,
        error: true,
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
  });
}

/**
 * Gera ID de sessão único
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Consulta logs de auditoria com filtros
 */
export async function queryAuditLogs(filters: AuditLogFilters): Promise<AuditLogResponse> {
  // Em produção, consultaria o banco de dados
  // Por enquanto, retorna dados simulados
  const mockLogs: TimeRecordAuditLog[] = generateMockAuditLogs(50);
  
  // Aplica filtros básicos
  let filteredLogs = mockLogs.filter(log => {
    if (filters.userId && log.userId !== filters.userId) return false;
    if (filters.employeeId && log.employeeId !== filters.employeeId) return false;
    if (filters.companyId && log.companyId !== filters.companyId) return false;
    if (filters.action && log.action !== filters.action) return false;
    if (filters.status && log.status !== filters.status) return false;
    if (filters.authenticationMethod && log.authenticationMethod !== filters.authenticationMethod) return false;
    if (filters.deviceType && log.deviceInfo.deviceType !== filters.deviceType) return false;
    
    if (filters.startDate && new Date(log.timestamp) < new Date(filters.startDate)) return false;
    if (filters.endDate && new Date(log.timestamp) > new Date(filters.endDate)) return false;
    
    return true;
  });

  // Paginação
  const limit = filters.limit || 20;
  const offset = filters.offset || 0;
  const total = filteredLogs.length;
  const logs = filteredLogs.slice(offset, offset + limit);
  const hasMore = offset + limit < total;

  return {
    logs,
    total,
    page: Math.floor(offset / limit) + 1,
    limit,
    hasMore,
  };
}

/**
 * Gera logs de auditoria simulados para demonstração
 */
function generateMockAuditLogs(count: number): TimeRecordAuditLog[] {
  const logs: TimeRecordAuditLog[] = [];
  const methods: AuthenticationMethod[] = ['MANUAL', 'NFC', 'BIOMETRIC', 'FACE_ID', 'FINGERPRINT'];
  const statuses: AttemptStatus[] = ['SUCCESS', 'FAILED', 'INVALID_LOCATION', 'AUTH_FAILED'];
  const actions: TimeRecordAuditLog['action'][] = ['TIME_RECORD_ATTEMPT', 'TIME_RECORD_SUCCESS', 'TIME_RECORD_FAILED', 'AUTH_ATTEMPT', 'AUTH_SUCCESS', 'AUTH_FAILED'];
  
  for (let i = 0; i < count; i++) {
    const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Últimos 30 dias
    const method = methods[Math.floor(Math.random() * methods.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    
    logs.push({
      id: generateAuditLogId(),
      timestamp: timestamp.toISOString(),
      action,
      status,
      userId: `user_${Math.floor(Math.random() * 10) + 1}`,
      employeeId: `emp_${Math.floor(Math.random() * 20) + 1}`,
      companyId: '1',
      authenticationMethod: method,
      authenticationDetails: {
        method,
        success: status === 'SUCCESS',
        error: status !== 'SUCCESS' ? 'Erro simulado' : undefined,
        deviceInfo: getDetailedDeviceInfo(),
        credentialId: method === 'BIOMETRIC' ? `cred_${Math.random().toString(36).substring(2, 8)}` : undefined,
        cardNumber: method === 'NFC' ? `NFC${Math.random().toString(36).substring(2, 8).toUpperCase()}` : undefined,
      },
      location: {
        latitude: -23.5505 + (Math.random() - 0.5) * 0.01,
        longitude: -46.6333 + (Math.random() - 0.5) * 0.01,
      },
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      deviceInfo: getDetailedDeviceInfo(),
      timeRecordData: status === 'SUCCESS' ? {
        type: Math.random() > 0.5 ? 'ENTRY' : 'EXIT',
        timestamp: timestamp.toISOString(),
        hash: `hash_${Math.random().toString(36).substring(2, 16)}`,
      } : undefined,
      validations: {
        location: { isValid: Math.random() > 0.1 },
        device: { isValid: Math.random() > 0.05 },
        time: { isValid: Math.random() > 0.05, isWithinWorkHours: Math.random() > 0.1, isWithinTolerance: Math.random() > 0.05 },
        isDuplicate: Math.random() > 0.95,
        isValid: status === 'SUCCESS',
        errors: status !== 'SUCCESS' ? ['Erro simulado'] : [],
      },
      details: `Tentativa de registro via ${method} - ${status}`,
      warnings: Math.random() > 0.7 ? ['Aviso simulado'] : undefined,
      metadata: {
        duration: 100 + Math.random() * 500,
        sessionId: generateSessionId(),
        requestId: generateAuditLogId(),
        retryCount: Math.floor(Math.random() * 3),
      },
    });
  }
  
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Obtém estatísticas de auditoria
 */
export async function getAuditLogStats(filters: Omit<AuditLogFilters, 'limit' | 'offset'>): Promise<AuditLogStats> {
  const response = await queryAuditLogs({ ...filters, limit: 1000 }); // Busca mais dados para estatísticas
  const logs = response.logs;
  
  const totalAttempts = logs.length;
  const successfulAttempts = logs.filter(log => log.status === 'SUCCESS').length;
  const failedAttempts = totalAttempts - successfulAttempts;
  const successRate = totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0;
  
  // Estatísticas por método
  const attemptsByMethod: Record<AuthenticationMethod, number> = {
    MANUAL: 0, NFC: 0, BIOMETRIC: 0, QR_CODE: 0, PIN: 0, FACE_ID: 0, FINGERPRINT: 0, WEBAUTHN: 0,
  };
  
  // Estatísticas por status
  const attemptsByStatus: Record<AttemptStatus, number> = {
    SUCCESS: 0, FAILED: 0, PENDING: 0, CANCELLED: 0, TIMEOUT: 0, 
    INVALID_LOCATION: 0, INVALID_DEVICE: 0, INVALID_TIME: 0, DUPLICATE: 0, AUTH_FAILED: 0,
  };
  
  // Estatísticas por tipo de dispositivo
  const attemptsByDeviceType: Record<'MOBILE' | 'DESKTOP' | 'TERMINAL', number> = {
    MOBILE: 0, DESKTOP: 0, TERMINAL: 0,
  };
  
  // Estatísticas por hora
  const attemptsByHour: Record<number, number> = {};
  for (let i = 0; i < 24; i++) attemptsByHour[i] = 0;
  
  let totalProcessingTime = 0;
  let processingTimeCount = 0;
  
  logs.forEach(log => {
    if (log.authenticationMethod) {
      attemptsByMethod[log.authenticationMethod]++;
    }
    
    attemptsByStatus[log.status]++;
    attemptsByDeviceType[log.deviceInfo.deviceType]++;
    
    const hour = new Date(log.timestamp).getHours();
    attemptsByHour[hour]++;
    
    if (log.metadata?.duration) {
      totalProcessingTime += log.metadata.duration;
      processingTimeCount++;
    }
  });
  
  return {
    totalAttempts,
    successfulAttempts,
    failedAttempts,
    successRate,
    attemptsByMethod,
    attemptsByStatus,
    attemptsByDeviceType,
    attemptsByHour,
    averageProcessingTime: processingTimeCount > 0 ? totalProcessingTime / processingTimeCount : 0,
  };
} 