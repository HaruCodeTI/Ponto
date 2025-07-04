/**
 * Tipos para autenticação NFC e crachá digital
 */

/**
 * Interface para dados do crachá NFC
 */
export interface NFCCard {
  id: string;
  cardNumber: string; // Número único do crachá
  employeeId: string; // ID do funcionário associado
  companyId: string; // ID da empresa
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'EXPIRED';
  issuedAt: string; // ISO string
  expiresAt?: string; // ISO string (opcional)
  lastUsedAt?: string; // ISO string
  usageCount: number; // Contador de usos
  maxUsageCount?: number; // Limite de usos (opcional)
  permissions: NFCPermission[];
  metadata?: {
    cardType: 'STANDARD' | 'VIP' | 'TEMPORARY';
    department?: string;
    role?: string;
  };
}

/**
 * Permissões do crachá NFC
 */
export type NFCPermission = 
  | 'TIME_RECORD_ENTRY'
  | 'TIME_RECORD_EXIT'
  | 'TIME_RECORD_BREAK'
  | 'ACCESS_RESTRICTED_AREAS'
  | 'ADMIN_OVERRIDE'
  | 'REPORT_ACCESS';

/**
 * Resultado da leitura NFC
 */
export interface NFCReadResult {
  success: boolean;
  cardData?: NFCCard;
  error?: string;
  timestamp: string; // ISO string
  deviceInfo?: {
    deviceId: string;
    deviceType: 'MOBILE' | 'DESKTOP' | 'TERMINAL';
    userAgent: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  };
}

/**
 * Dados para criação de crachá NFC
 */
export interface CreateNFCCardData {
  employeeId: string;
  companyId: string;
  cardNumber: string;
  expiresAt?: string;
  maxUsageCount?: number;
  permissions: NFCPermission[];
  metadata?: {
    cardType: 'STANDARD' | 'VIP' | 'TEMPORARY';
    department?: string;
    role?: string;
  };
}

/**
 * Dados para atualização de crachá NFC
 */
export interface UpdateNFCCardData {
  status?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'EXPIRED';
  expiresAt?: string;
  maxUsageCount?: number;
  permissions?: NFCPermission[];
  metadata?: {
    cardType?: 'STANDARD' | 'VIP' | 'TEMPORARY';
    department?: string;
    role?: string;
  };
}

/**
 * Configurações para leitura NFC
 */
export interface NFCConfig {
  timeout: number; // Timeout em ms
  retryCount: number; // Número de tentativas
  requireLocation: boolean; // Se requer localização
  requireDeviceValidation: boolean; // Se requer validação de dispositivo
  allowedCardTypes: ('STANDARD' | 'VIP' | 'TEMPORARY')[];
  maxDistance?: number; // Distância máxima em metros
}

/**
 * Evento de leitura NFC
 */
export interface NFCReadEvent {
  type: 'READ_START' | 'READ_SUCCESS' | 'READ_ERROR' | 'READ_TIMEOUT';
  cardData?: NFCCard;
  error?: string;
  timestamp: string;
  deviceInfo?: {
    deviceId: string;
    deviceType: 'MOBILE' | 'DESKTOP' | 'TERMINAL';
    userAgent: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  };
}

/**
 * Resposta da API de autenticação NFC
 */
export interface NFCAuthResponse {
  success: boolean;
  authenticated: boolean;
  cardData?: NFCCard;
  employeeData?: {
    id: string;
    name: string;
    cpf: string;
    role: string;
    department?: string;
  };
  timeRecord?: {
    id: string;
    type: 'ENTRY' | 'EXIT' | 'BREAK_START' | 'BREAK_END';
    timestamp: string;
    hash: string;
  };
  error?: string;
  warnings?: string[];
}

/**
 * Log de auditoria NFC
 */
export interface NFCAuditLog {
  id: string;
  cardId: string;
  employeeId: string;
  companyId: string;
  action: 'CARD_READ' | 'AUTH_SUCCESS' | 'AUTH_FAILED' | 'CARD_BLOCKED' | 'CARD_EXPIRED';
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  deviceInfo: {
    deviceId: string;
    deviceType: 'MOBILE' | 'DESKTOP' | 'TERMINAL';
    userAgent: string;
    ipAddress?: string;
  };
  details: string;
  metadata?: Record<string, unknown>;
} 