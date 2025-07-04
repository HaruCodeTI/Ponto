import { DeviceValidation } from "@/types/time-record";

/**
 * Configurações para validação de dispositivo
 */
export interface DeviceValidationConfig {
  requireDeviceFingerprint: boolean; // Se é obrigatório gerar fingerprint único
  requireDeviceInfo: boolean; // Se é obrigatório capturar informações do dispositivo
  allowMobile: boolean; // Se permite dispositivos móveis
  allowDesktop: boolean; // Se permite desktops
  allowTablet: boolean; // Se permite tablets
  blockVirtualMachines: boolean; // Se bloqueia VMs
  blockEmulators: boolean; // Se bloqueia emuladores
  requireSecureContext: boolean; // Se requer contexto seguro (HTTPS)
  maxDevicesPerUser: number; // Máximo de dispositivos por usuário
  sessionTimeoutMinutes: number; // Timeout da sessão do dispositivo
}

/**
 * Informações detalhadas do dispositivo
 */
export interface DeviceInfo {
  deviceId: string; // ID único do dispositivo
  deviceType: 'MOBILE' | 'DESKTOP' | 'TABLET' | 'UNKNOWN';
  platform: string; // iOS, Android, Windows, macOS, Linux
  browser: string; // Chrome, Firefox, Safari, Edge
  browserVersion: string;
  userAgent: string;
  screenResolution: string; // width x height
  colorDepth: number;
  timezone: string;
  language: string;
  languages: string[];
  cookieEnabled: boolean;
  localStorageEnabled: boolean;
  sessionStorageEnabled: boolean;
  webGLVendor?: string;
  webGLRenderer?: string;
  canvasFingerprint?: string;
  audioFingerprint?: string;
  hardwareConcurrency?: number;
  maxTouchPoints?: number;
  isSecureContext: boolean;
  isVirtualMachine: boolean;
  isEmulator: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/**
 * Resultado da validação de dispositivo
 */
export interface DeviceValidationResult {
  isValid: boolean;
  deviceInfo: DeviceInfo;
  deviceId: string;
  reason?: string;
  warnings: string[];
  errors: string[];
  confidence: number; // 0-1, confiança da validação
  metadata: {
    validationTime: string;
    sessionId?: string;
    requestId?: string;
    duration: number; // Tempo de processamento em ms
  };
}

/**
 * Configurações padrão para validação de dispositivo
 */
export const DEFAULT_DEVICE_CONFIG: DeviceValidationConfig = {
  requireDeviceFingerprint: true,
  requireDeviceInfo: true,
  allowMobile: true,
  allowDesktop: true,
  allowTablet: true,
  blockVirtualMachines: true,
  blockEmulators: true,
  requireSecureContext: false, // false para desenvolvimento
  maxDevicesPerUser: 3,
  sessionTimeoutMinutes: 480, // 8 horas
};

/**
 * Gera fingerprint único do dispositivo
 */
export function generateDeviceFingerprint(): string {
  const components: string[] = [];

  // Informações básicas do navegador
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

  // Fingerprint do canvas (se disponível)
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
      components.push(canvas.toDataURL());
    }
  } catch {
    // Ignora erro se canvas não estiver disponível
  }

  // Combina todos os componentes e gera hash
  const combined = components.join('|');
  return btoa(combined).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
}

/**
 * Detecta tipo de dispositivo
 */
export function detectDeviceType(): 'MOBILE' | 'DESKTOP' | 'TABLET' | 'UNKNOWN' {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Detecta mobile
  if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
    // Detecta tablet
    if (/ipad|android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(userAgent)) {
      return 'TABLET';
    }
    return 'MOBILE';
  }
  
  return 'DESKTOP';
}

/**
 * Detecta se é uma máquina virtual
 */
export function detectVirtualMachine(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Detecta VMs comuns
  const vmIndicators = [
    'virtualbox',
    'vmware',
    'parallels',
    'qemu',
    'xen',
    'hyper-v',
    'docker',
    'wine',
  ];
  
  return vmIndicators.some(indicator => userAgent.includes(indicator));
}

/**
 * Detecta se é um emulador
 */
export function detectEmulator(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Detecta emuladores comuns
  const emulatorIndicators = [
    'emulator',
    'android sdk',
    'genymotion',
    'bluestacks',
    'nox',
    'mumu',
    'ldplayer',
  ];
  
  return emulatorIndicators.some(indicator => userAgent.includes(indicator));
}

/**
 * Obtém informações detalhadas do dispositivo
 */
export function getDeviceInfo(): DeviceInfo {
  const deviceType = detectDeviceType();
  const isVM = detectVirtualMachine();
  const isEmulator = detectEmulator();
  
  // Detecta plataforma
  let platform = 'Unknown';
  if (navigator.platform) {
    if (navigator.platform.includes('Win')) platform = 'Windows';
    else if (navigator.platform.includes('Mac')) platform = 'macOS';
    else if (navigator.platform.includes('Linux')) platform = 'Linux';
    else if (navigator.platform.includes('iPhone')) platform = 'iOS';
    else if (navigator.platform.includes('Android')) platform = 'Android';
  }
  
  // Detecta navegador
  let browser = 'Unknown';
  let browserVersion = '';
  if (navigator.userAgent.includes('Chrome')) {
    browser = 'Chrome';
    const match = navigator.userAgent.match(/Chrome\/(\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (navigator.userAgent.includes('Firefox')) {
    browser = 'Firefox';
    const match = navigator.userAgent.match(/Firefox\/(\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (navigator.userAgent.includes('Safari')) {
    browser = 'Safari';
    const match = navigator.userAgent.match(/Version\/(\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (navigator.userAgent.includes('Edge')) {
    browser = 'Edge';
    const match = navigator.userAgent.match(/Edge\/(\d+)/);
    browserVersion = match ? match[1] : '';
  }
  
  // Gera fingerprint do canvas
  let canvasFingerprint = '';
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
      canvasFingerprint = canvas.toDataURL();
    }
  } catch {
    // Ignora erro
  }
  
  return {
    deviceId: generateDeviceFingerprint(),
    deviceType,
    platform,
    browser,
    browserVersion,
    userAgent: navigator.userAgent,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    languages: [...(navigator.languages || [navigator.language])],
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
    webGLVendor: (() => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;
        return gl ? gl.getParameter(gl.VENDOR) : undefined;
      } catch {
        return undefined;
      }
    })(),
    webGLRenderer: (() => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;
        return gl ? gl.getParameter(gl.RENDERER) : undefined;
      } catch {
        return undefined;
      }
    })(),
    canvasFingerprint,
    audioFingerprint: '', // Implementar se necessário
    hardwareConcurrency: navigator.hardwareConcurrency,
    maxTouchPoints: navigator.maxTouchPoints,
    isSecureContext: window.isSecureContext,
    isVirtualMachine: isVM,
    isEmulator: isEmulator,
    isMobile: deviceType === 'MOBILE',
    isTablet: deviceType === 'TABLET',
    isDesktop: deviceType === 'DESKTOP',
  };
}

/**
 * Valida dispositivo baseado nas configurações
 */
export async function validateDevice(
  config: DeviceValidationConfig = DEFAULT_DEVICE_CONFIG,
): Promise<DeviceValidationResult> {
  const startTime = Date.now();
  const deviceInfo = getDeviceInfo();
  const warnings: string[] = [];
  const errors: string[] = [];
  let isValid = true;
  let reason = '';

  // Validação de contexto seguro
  if (config.requireSecureContext && !deviceInfo.isSecureContext) {
    isValid = false;
    errors.push('Contexto seguro (HTTPS) é obrigatório');
    reason = 'Contexto inseguro';
  }

  // Validação de tipo de dispositivo
  if (!config.allowMobile && deviceInfo.isMobile) {
    isValid = false;
    errors.push('Dispositivos móveis não são permitidos');
    reason = 'Dispositivo móvel não permitido';
  }

  if (!config.allowDesktop && deviceInfo.isDesktop) {
    isValid = false;
    errors.push('Desktops não são permitidos');
    reason = 'Desktop não permitido';
  }

  if (!config.allowTablet && deviceInfo.isTablet) {
    isValid = false;
    errors.push('Tablets não são permitidos');
    reason = 'Tablet não permitido';
  }

  // Validação de máquina virtual
  if (config.blockVirtualMachines && deviceInfo.isVirtualMachine) {
    isValid = false;
    errors.push('Máquinas virtuais não são permitidas');
    reason = 'Máquina virtual detectada';
  }

  // Validação de emulador
  if (config.blockEmulators && deviceInfo.isEmulator) {
    isValid = false;
    errors.push('Emuladores não são permitidos');
    reason = 'Emulador detectado';
  }

  // Warnings para informações suspeitas
  if (deviceInfo.isVirtualMachine) {
    warnings.push('Máquina virtual detectada - pode indicar tentativa de fraude');
  }

  if (deviceInfo.isEmulator) {
    warnings.push('Emulador detectado - pode indicar tentativa de fraude');
  }

  if (!deviceInfo.isSecureContext) {
    warnings.push('Contexto não seguro - recomenda-se usar HTTPS');
  }

  // Calcula confiança baseada nas validações
  let confidence = 1.0;
  if (deviceInfo.isVirtualMachine) confidence -= 0.3;
  if (deviceInfo.isEmulator) confidence -= 0.3;
  if (!deviceInfo.isSecureContext) confidence -= 0.1;
  if (warnings.length > 0) confidence -= 0.1 * warnings.length;
  confidence = Math.max(0, confidence);

  const duration = Date.now() - startTime;

  return {
    isValid,
    deviceInfo,
    deviceId: deviceInfo.deviceId,
    reason: reason || undefined,
    warnings,
    errors,
    confidence,
    metadata: {
      validationTime: new Date().toISOString(),
      duration,
    },
  };
}

/**
 * Converte resultado para o tipo DeviceValidation
 */
export function toDeviceValidation(result: DeviceValidationResult): DeviceValidation {
  return {
    isValid: result.isValid,
    deviceId: result.deviceId,
    reason: result.reason,
  };
}

/**
 * Gera relatório detalhado de validação de dispositivo
 */
export function generateDeviceValidationReport(result: DeviceValidationResult): string {
  const { deviceInfo, isValid, warnings, errors, confidence } = result;
  
  let report = `=== RELATÓRIO DE VALIDAÇÃO DE DISPOSITIVO ===\n\n`;
  report += `Status: ${isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}\n`;
  report += `Confiança: ${Math.round(confidence * 100)}%\n`;
  report += `Device ID: ${deviceInfo.deviceId}\n\n`;
  
  report += `=== INFORMAÇÕES DO DISPOSITIVO ===\n`;
  report += `Tipo: ${deviceInfo.deviceType}\n`;
  report += `Plataforma: ${deviceInfo.platform}\n`;
  report += `Navegador: ${deviceInfo.browser} ${deviceInfo.browserVersion}\n`;
  report += `Resolução: ${deviceInfo.screenResolution}\n`;
  report += `Timezone: ${deviceInfo.timezone}\n`;
  report += `Idioma: ${deviceInfo.language}\n`;
  report += `Contexto Seguro: ${deviceInfo.isSecureContext ? 'Sim' : 'Não'}\n`;
  report += `Máquina Virtual: ${deviceInfo.isVirtualMachine ? 'Sim' : 'Não'}\n`;
  report += `Emulador: ${deviceInfo.isEmulator ? 'Sim' : 'Não'}\n\n`;
  
  if (warnings.length > 0) {
    report += `=== AVISOS ===\n`;
    warnings.forEach(warning => {
      report += `⚠️ ${warning}\n`;
    });
    report += `\n`;
  }
  
  if (errors.length > 0) {
    report += `=== ERROS ===\n`;
    errors.forEach(error => {
      report += `❌ ${error}\n`;
    });
    report += `\n`;
  }
  
  report += `=== METADADOS ===\n`;
  report += `Tempo de Validação: ${result.metadata.validationTime}\n`;
  report += `Duração: ${result.metadata.duration}ms\n`;
  
  return report;
} 