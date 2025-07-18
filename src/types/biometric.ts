/**
 * Tipos para autenticação biométrica (WebAuthn, Fingerprint, FaceID, etc)
 */

export type BiometricMethod = 'FINGERPRINT' | 'FACE' | 'WEBAUTHN' | 'PIN' | 'UNKNOWN';

export interface BiometricAuthConfig {
  method: BiometricMethod;
  timeout: number; // Timeout em ms
  allowFallback: boolean; // Permitir fallback para senha/PIN
  requireUserVerification: boolean;
}

export interface BiometricAuthResult {
  success: boolean;
  method: BiometricMethod;
  error?: string;
  warnings?: string[];
  timestamp: string; // ISO string
  deviceInfo?: {
    deviceId: string;
    deviceType: 'MOBILE' | 'DESKTOP' | 'TERMINAL';
    userAgent: string;
    platform?: string;
  };
  credentialId?: string;
  userHandle?: string;
}

export interface BiometricAuthEvent {
  type: 'AUTH_START' | 'AUTH_SUCCESS' | 'AUTH_ERROR' | 'AUTH_TIMEOUT';
  method: BiometricMethod;
  error?: string;
  timestamp: string;
  deviceInfo?: {
    deviceId: string;
    deviceType: 'MOBILE' | 'DESKTOP' | 'TERMINAL';
    userAgent: string;
    platform?: string;
  };
}

export interface BiometricData {
  id: string;
  employeeId: string;
  type: 'FINGERPRINT' | 'FACE' | 'VOICE';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BiometricScanResult {
  success: boolean;
  employeeId?: string;
  type?: string;
  error?: string;
}

export interface BiometricSetup {
  type: 'FINGERPRINT' | 'FACE' | 'VOICE';
  employeeId: string;
} 