/**
 * Utilitários para autenticação biométrica (WebAuthn, Fingerprint, FaceID, etc)
 */

import {
  BiometricMethod,
  BiometricAuthConfig,
  BiometricAuthResult,
} from "@/types/biometric";
import { prisma } from './prisma';
import { BiometricData, BiometricScanResult } from '@/types/biometric';

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

/**
 * Simula leitura biométrica
 * Em produção, isso seria integrado com hardware real
 */
export function simulateBiometricScan(type: 'FINGERPRINT' | 'FACE' | 'VOICE'): string {
  // Simula um ID único de biometria
  const randomId = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${type}-${randomId}`;
}

/**
 * Valida tipo de biometria
 */
export function validateBiometricType(type: string): boolean {
  return ['FINGERPRINT', 'FACE', 'VOICE'].includes(type);
}

/**
 * Busca dados biométricos por tipo e ID
 */
export async function findBiometricData(employeeId: string, type: string): Promise<BiometricData | null> {
  try {
    const data = await prisma.biometricData.findFirst({
      where: { 
        employeeId,
        type,
        isActive: true
      },
    });

    if (!data) return null;

    return {
      id: data.id,
      employeeId: data.employeeId,
      type: data.type as 'FINGERPRINT' | 'FACE' | 'VOICE',
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    console.error('Erro ao buscar dados biométricos:', error);
    return null;
  }
}

/**
 * Processa scan biométrico
 */
export async function processBiometricScan(employeeId: string, type: string): Promise<BiometricScanResult> {
  try {
    // Valida tipo
    if (!validateBiometricType(type)) {
      return {
        success: false,
        error: 'Tipo de biometria inválido',
      };
    }

    // Busca dados no banco
    const data = await findBiometricData(employeeId, type);
    
    if (!data) {
      return {
        success: false,
        error: 'Dados biométricos não encontrados',
      };
    }

    if (!data.isActive) {
      return {
        success: false,
        error: 'Biometria inativa',
      };
    }

    return {
      success: true,
      employeeId: data.employeeId,
      type: data.type,
    };
  } catch (error) {
    console.error('Erro ao processar scan biométrico:', error);
    return {
      success: false,
      error: 'Erro interno do sistema',
    };
  }
}

/**
 * Cria novos dados biométricos
 */
export async function createBiometricData(employeeId: string, type: string): Promise<BiometricData | null> {
  try {
    if (!validateBiometricType(type)) {
      throw new Error('Tipo de biometria inválido');
    }

    const data = await prisma.biometricData.create({
      data: {
        employeeId,
        type,
      },
    });

    return {
      id: data.id,
      employeeId: data.employeeId,
      type: data.type as 'FINGERPRINT' | 'FACE' | 'VOICE',
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    console.error('Erro ao criar dados biométricos:', error);
    return null;
  }
}

/**
 * Desativa dados biométricos
 */
export async function deactivateBiometricData(id: string): Promise<boolean> {
  try {
    await prisma.biometricData.update({
      where: { id },
      data: { isActive: false },
    });
    return true;
  } catch (error) {
    console.error('Erro ao desativar dados biométricos:', error);
    return false;
  }
}

/**
 * Lista dados biométricos de um funcionário
 */
export async function listBiometricData(employeeId: string): Promise<BiometricData[]> {
  try {
    const data = await prisma.biometricData.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });

    return data.map(item => ({
      id: item.id,
      employeeId: item.employeeId,
      type: item.type as 'FINGERPRINT' | 'FACE' | 'VOICE',
      isActive: item.isActive,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  } catch (error) {
    console.error('Erro ao listar dados biométricos:', error);
    return [];
  }
} 