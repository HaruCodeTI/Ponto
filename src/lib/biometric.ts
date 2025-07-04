/**
 * Utilitários para autenticação biométrica (WebAuthn, Fingerprint, FaceID, etc)
 */

import {
  BiometricMethod,
  BiometricAuthConfig,
  BiometricAuthResult,
} from "@/types/biometric";

/**
 * Configuração padrão para autenticação biométrica
 */
export const DEFAULT_BIOMETRIC_CONFIG: BiometricAuthConfig = {
  method: 'WEBAUTHN',
  timeout: 10000,
  allowFallback: true,
  requireUserVerification: true,
};

/**
 * Detecta se o dispositivo suporta biometria (WebAuthn/Fingerprint/FaceID)
 */
export function isBiometricSupported(): boolean {
  return (
    !!window.PublicKeyCredential ||
    'credentials' in navigator ||
    'credentials' in window ||
    'webkitCredentials' in window
  );
}

/**
 * Detecta método biométrico disponível
 */
export function detectBiometricMethod(): BiometricMethod {
  if (window.PublicKeyCredential) return 'WEBAUTHN';
  // Simulação: em produção, detectar Fingerprint/FaceID nativo
  return 'UNKNOWN';
}

/**
 * Gera ID único para dispositivo
 */
export function generateDeviceId(): string {
  const userAgent = navigator.userAgent;
  const screenInfo = `${screen.width}x${screen.height}`;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const data = `${userAgent}-${screenInfo}-${timeZone}`;
  return btoa(data).replace(/[^a-zA-Z0-9]/g, "").substring(0, 16);
}

/**
 * Simula autenticação biométrica (mock para ambiente web)
 */
export async function authenticateBiometric(
  config: BiometricAuthConfig = DEFAULT_BIOMETRIC_CONFIG
): Promise<BiometricAuthResult> {
  try {
    if (!isBiometricSupported()) {
      throw new Error("Biometria não suportada neste dispositivo");
    }
    // Simula delay de autenticação
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));
    // Simula sucesso/erro aleatório
    if (Math.random() < 0.85) {
      return {
        success: true,
        method: config.method,
        timestamp: new Date().toISOString(),
        deviceInfo: {
          deviceId: generateDeviceId(),
          deviceType: /mobile|android|iphone|ipad|phone/i.test(navigator.userAgent) ? 'MOBILE' : 'DESKTOP',
          userAgent: navigator.userAgent,
          platform: navigator.platform,
        },
        credentialId: 'cred_' + Math.random().toString(36).substring(2, 10),
        userHandle: 'user_' + Math.random().toString(36).substring(2, 8),
      };
    } else {
      throw new Error("Falha na autenticação biométrica");
    }
  } catch (error) {
    return {
      success: false,
      method: config.method,
      error: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
      deviceInfo: {
        deviceId: generateDeviceId(),
        deviceType: /mobile|android|iphone|ipad|phone/i.test(navigator.userAgent) ? 'MOBILE' : 'DESKTOP',
        userAgent: navigator.userAgent,
        platform: navigator.platform,
      },
    };
  }
} 