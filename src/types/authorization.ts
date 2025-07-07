import { UserRole } from '@prisma/client';

export interface Permission {
  resource: string;
  action: string;
  roles: UserRole[];
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

export interface AccessControl {
  canAccess: boolean;
  reason?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface SessionInfo {
  id: string;
  userId: string;
  userEmail: string;
  role: UserRole;
  companyId?: string;
  ipAddress?: string;
  userAgent?: string;
  lastActivity: Date;
  expiresAt: Date;
  isActive: boolean;
}

// Recursos do sistema
export const RESOURCES = {
  // Funcionários
  EMPLOYEE: 'employee',
  EMPLOYEE_LIST: 'employee:list',
  EMPLOYEE_CREATE: 'employee:create',
  EMPLOYEE_READ: 'employee:read',
  EMPLOYEE_UPDATE: 'employee:update',
  EMPLOYEE_DELETE: 'employee:delete',
  
  // Registro de Ponto
  TIME_RECORD: 'time-record',
  TIME_RECORD_CREATE: 'time-record:create',
  TIME_RECORD_READ: 'time-record:read',
  TIME_RECORD_UPDATE: 'time-record:update',
  TIME_RECORD_DELETE: 'time-record:delete',
  TIME_RECORD_ADJUST: 'time-record:adjust',
  
  // Relatórios
  REPORT: 'report',
  REPORT_GENERATE: 'report:generate',
  REPORT_EXPORT: 'report:export',
  REPORT_SCHEDULE: 'report:schedule',
  
  // Configurações
  SETTINGS: 'settings',
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',
  
  // Sistema
  SYSTEM: 'system',
  SYSTEM_USERS: 'system:users',
  SYSTEM_LOGS: 'system:logs',
  SYSTEM_BACKUP: 'system:backup',
  
  // Autenticação
  AUTH: 'auth',
  AUTH_2FA: 'auth:2fa',
  AUTH_NFC: 'auth:nfc',
  AUTH_BIOMETRIC: 'auth:biometric',
} as const;

// Ações do sistema
export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  EXPORT: 'export',
  IMPORT: 'import',
  APPROVE: 'approve',
  REJECT: 'reject',
  ADJUST: 'adjust',
  SCHEDULE: 'schedule',
  CONFIGURE: 'configure',
} as const; 