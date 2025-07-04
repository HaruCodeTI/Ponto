import { TimeRecord } from "@/types/time-record";
import { createHash, randomBytes } from "crypto";

/**
 * Configurações para geração de hash
 */
export interface HashConfig {
  algorithm: 'SHA256' | 'SHA512' | 'MD5';
  saltLength: number;
  includeLocation: boolean;
  includeDeviceInfo: boolean;
  includeIP: boolean;
  includePhoto: boolean;
  includeNFC: boolean;
  timestampPrecision: 'milliseconds' | 'seconds' | 'minutes';
  encoding: 'hex' | 'base64' | 'base64url';
}

/**
 * Configurações padrão para hash
 */
export const DEFAULT_HASH_CONFIG: HashConfig = {
  algorithm: 'SHA256',
  saltLength: 32,
  includeLocation: true,
  includeDeviceInfo: true,
  includeIP: true,
  includePhoto: true,
  includeNFC: true,
  timestampPrecision: 'milliseconds',
  encoding: 'hex',
};

/**
 * Interface para código de verificação
 */
export interface VerificationCode {
  hash: string;
  salt: string;
  signature: string;
  timestamp: string;
  version: string;
  metadata: {
    algorithm: string;
    includedFields: string[];
    checksum: string;
  };
}

/**
 * Interface para resultado de verificação
 */
export interface VerificationResult {
  isValid: boolean;
  integrity: boolean;
  authenticity: boolean;
  timestamp: boolean;
  warnings: string[];
  errors: string[];
  details: {
    hashMatch: boolean;
    signatureValid: boolean;
    timestampValid: boolean;
    checksumValid: boolean;
  };
}

/**
 * Gera salt aleatório
 */
function generateSalt(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Gera checksum para validação
 */
function generateChecksum(data: string): string {
  return createHash('md5').update(data).digest('hex').substring(0, 8);
}

/**
 * Gera hash avançado para registro de ponto
 */
export function generateAdvancedHash(
  timeRecord: TimeRecord,
  config: HashConfig = DEFAULT_HASH_CONFIG
): VerificationCode {
  const salt = generateSalt(config.saltLength);
  const timestamp = new Date(timeRecord.timestamp);
  
  // Formata timestamp conforme precisão
  let formattedTimestamp: string;
  switch (config.timestampPrecision) {
    case 'minutes':
      formattedTimestamp = timestamp.toISOString().substring(0, 16);
      break;
    case 'seconds':
      formattedTimestamp = timestamp.toISOString().substring(0, 19);
      break;
    default:
      formattedTimestamp = timestamp.toISOString();
  }

  // Constrói string base para hash
  let baseString = `${timeRecord.type}|${timeRecord.userId}|${timeRecord.employeeId}|${timeRecord.companyId}|${formattedTimestamp}`;
  
  const includedFields: string[] = ['type', 'userId', 'employeeId', 'companyId', 'timestamp'];

  // Adiciona localização se habilitado
  if (config.includeLocation && timeRecord.latitude && timeRecord.longitude) {
    baseString += `|${timeRecord.latitude.toFixed(6)}|${timeRecord.longitude.toFixed(6)}`;
    includedFields.push('location');
  }

  // Adiciona informações do dispositivo se habilitado
  if (config.includeDeviceInfo && timeRecord.deviceInfo) {
    baseString += `|${timeRecord.deviceInfo}`;
    includedFields.push('deviceInfo');
  }

  // Adiciona IP se habilitado
  if (config.includeIP && timeRecord.ipAddress) {
    baseString += `|${timeRecord.ipAddress}`;
    includedFields.push('ipAddress');
  }

  // Adiciona foto se habilitado
  if (config.includePhoto && timeRecord.photoUrl) {
    baseString += `|${timeRecord.photoUrl}`;
    includedFields.push('photoUrl');
  }

  // Adiciona NFC se habilitado
  if (config.includeNFC && timeRecord.nfcTag) {
    baseString += `|${timeRecord.nfcTag}`;
    includedFields.push('nfcTag');
  }

  // Adiciona salt
  baseString += `|${salt}`;

  // Gera hash com algoritmo especificado
  let hash: string;
  switch (config.algorithm) {
    case 'SHA512':
      hash = createHash('sha512').update(baseString).digest(config.encoding);
      break;
    case 'MD5':
      hash = createHash('md5').update(baseString).digest(config.encoding);
      break;
    default:
      hash = createHash('sha256').update(baseString).digest(config.encoding);
  }

  // Gera assinatura digital (simulada - em produção seria com chave privada)
  const signature = createHash('sha256').update(`${hash}|${salt}|${formattedTimestamp}`).digest('hex');

  // Gera checksum para validação
  const checksum = generateChecksum(`${hash}|${signature}|${formattedTimestamp}`);

  return {
    hash,
    salt,
    signature,
    timestamp: formattedTimestamp,
    version: '1.0',
    metadata: {
      algorithm: config.algorithm,
      includedFields,
      checksum,
    },
  };
}

/**
 * Verifica integridade de um registro
 */
export function verifyRecordIntegrity(
  timeRecord: TimeRecord,
  verificationCode: VerificationCode,
  config: HashConfig = DEFAULT_HASH_CONFIG
): VerificationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  let isValid = true;
  let integrity = true;
  let authenticity = true;
  let timestamp = true;

  // Verifica se o hash atual corresponde ao esperado
  const currentVerification = generateAdvancedHash(timeRecord, config);
  const hashMatch = currentVerification.hash === verificationCode.hash;
  
  if (!hashMatch) {
    errors.push('Hash não corresponde - possível alteração nos dados');
    integrity = false;
    isValid = false;
  }

  // Verifica assinatura
  const expectedSignature = createHash('sha256')
    .update(`${verificationCode.hash}|${verificationCode.salt}|${verificationCode.timestamp}`)
    .digest('hex');
  
  const signatureValid = expectedSignature === verificationCode.signature;
  if (!signatureValid) {
    errors.push('Assinatura inválida - possível adulteração');
    authenticity = false;
    isValid = false;
  }

  // Verifica timestamp
  const recordTimestamp = new Date(timeRecord.timestamp);
  const verificationTimestamp = new Date(verificationCode.timestamp);
  const timeDiff = Math.abs(recordTimestamp.getTime() - verificationTimestamp.getTime());
  
  // Tolerância de 1 minuto para diferenças de timestamp
  const timestampValid = timeDiff <= 60000;
  if (!timestampValid) {
    warnings.push('Diferença significativa no timestamp');
    timestamp = false;
  }

  // Verifica checksum
  const expectedChecksum = generateChecksum(
    `${verificationCode.hash}|${verificationCode.signature}|${verificationCode.timestamp}`
  );
  const checksumValid = expectedChecksum === verificationCode.metadata.checksum;
  
  if (!checksumValid) {
    errors.push('Checksum inválido - possível corrupção de dados');
    integrity = false;
    isValid = false;
  }

  // Verifica versão
  if (verificationCode.version !== '1.0') {
    warnings.push('Versão do código de verificação não é a mais recente');
  }

  // Verifica campos incluídos
  const expectedFields = config.includeLocation ? ['location'] : [];
  if (config.includeDeviceInfo) expectedFields.push('deviceInfo');
  if (config.includeIP) expectedFields.push('ipAddress');
  if (config.includePhoto) expectedFields.push('photoUrl');
  if (config.includeNFC) expectedFields.push('nfcTag');

  const missingFields = expectedFields.filter(field => 
    !verificationCode.metadata.includedFields.includes(field)
  );

  if (missingFields.length > 0) {
    warnings.push(`Campos não incluídos no hash: ${missingFields.join(', ')}`);
  }

  return {
    isValid,
    integrity,
    authenticity,
    timestamp,
    warnings,
    errors,
    details: {
      hashMatch,
      signatureValid,
      timestampValid,
      checksumValid,
    },
  };
}

/**
 * Gera QR Code para verificação
 */
export function generateVerificationQRCode(verificationCode: VerificationCode): string {
  const data = {
    hash: verificationCode.hash,
    signature: verificationCode.signature,
    timestamp: verificationCode.timestamp,
    version: verificationCode.version,
    checksum: verificationCode.metadata.checksum,
  };

  // Em produção, isso seria convertido para QR Code real
  return `ponto://verify/${Buffer.from(JSON.stringify(data)).toString('base64')}`;
}

/**
 * Valida QR Code de verificação
 */
export function validateVerificationQRCode(qrData: string): {
  isValid: boolean;
  data?: unknown;
  error?: string;
} {
  try {
    // Remove prefixo se presente
    const cleanData = qrData.replace('ponto://verify/', '');
    const decoded = Buffer.from(cleanData, 'base64').toString();
    const data = JSON.parse(decoded);

    // Validações básicas
    if (!data.hash || !data.signature || !data.timestamp || !data.version) {
      return { isValid: false, error: 'Dados incompletos no QR Code' };
    }

    // Verifica checksum
    const expectedChecksum = generateChecksum(
      `${data.hash}|${data.signature}|${data.timestamp}`
    );

    if (data.checksum !== expectedChecksum) {
      return { isValid: false, error: 'Checksum inválido' };
    }

    return { isValid: true, data };
  } catch {
    return { isValid: false, error: 'QR Code inválido ou corrompido' };
  }
}

/**
 * Gera hash simplificado para compatibilidade
 */
export function generateSimpleHash(data: Record<string, unknown>, timestamp: Date): string {
  const base = `${data.type}-${data.userId}-${data.employeeId}-${data.companyId}-${timestamp.getTime()}`;
  return createHash('sha256').update(base).digest('hex');
}

/**
 * Gera código de verificação legível
 */
export function generateReadableCode(verificationCode: VerificationCode): string {
  const shortHash = verificationCode.hash.substring(0, 8);
  const shortSignature = verificationCode.signature.substring(0, 8);
  const timestamp = new Date(verificationCode.timestamp);
  const timeString = timestamp.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  return `${shortHash}-${shortSignature}-${timeString}`.toUpperCase();
}

/**
 * Verifica se dois registros são idênticos
 */
export function compareRecords(
  record1: TimeRecord,
  record2: TimeRecord,
  _config: HashConfig = DEFAULT_HASH_CONFIG
): {
  areIdentical: boolean;
  differences: string[];
  similarity: number;
} {
  const differences: string[] = [];
  let matchingFields = 0;
  let totalFields = 0;

  const fields = [
    'type', 'userId', 'employeeId', 'companyId', 'timestamp',
    'latitude', 'longitude', 'ipAddress', 'deviceInfo', 'photoUrl', 'nfcTag'
  ];

  fields.forEach(field => {
    totalFields++;
    const value1 = ((record1 as unknown) as Record<string, unknown>)[field];
    const value2 = ((record2 as unknown) as Record<string, unknown>)[field];

    if (value1 !== value2) {
      differences.push(`${field}: "${value1}" vs "${value2}"`);
    } else {
      matchingFields++;
    }
  });

  const similarity = (matchingFields / totalFields) * 100;

  return {
    areIdentical: differences.length === 0,
    differences,
    similarity,
  };
}

/**
 * Gera relatório de verificação
 */
export function generateVerificationReport(
  timeRecord: TimeRecord,
  verificationCode: VerificationCode,
  config: HashConfig = DEFAULT_HASH_CONFIG
): string {
  const verification = verifyRecordIntegrity(timeRecord, verificationCode, config);
  
  let report = `=== RELATÓRIO DE VERIFICAÇÃO ===\n\n`;
  report += `Registro ID: ${timeRecord.id}\n`;
  report += `Tipo: ${timeRecord.type}\n`;
  report += `Funcionário: ${timeRecord.employeeId}\n`;
  report += `Empresa: ${timeRecord.companyId}\n`;
  report += `Data/Hora: ${new Date(timeRecord.timestamp).toLocaleString('pt-BR')}\n\n`;

  report += `=== CÓDIGO DE VERIFICAÇÃO ===\n`;
  report += `Hash: ${verificationCode.hash}\n`;
  report += `Assinatura: ${verificationCode.signature}\n`;
  report += `Timestamp: ${verificationCode.timestamp}\n`;
  report += `Versão: ${verificationCode.version}\n`;
  report += `Algoritmo: ${verificationCode.metadata.algorithm}\n`;
  report += `Checksum: ${verificationCode.metadata.checksum}\n\n`;

  report += `=== RESULTADO DA VERIFICAÇÃO ===\n`;
  report += `Status: ${verification.isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}\n`;
  report += `Integridade: ${verification.integrity ? '✅ OK' : '❌ COMPROMETIDA'}\n`;
  report += `Autenticidade: ${verification.authenticity ? '✅ OK' : '❌ COMPROMETIDA'}\n`;
  report += `Timestamp: ${verification.timestamp ? '✅ OK' : '⚠️ DIFERENÇA'}\n\n`;

  if (verification.warnings.length > 0) {
    report += `=== AVISOS ===\n`;
    verification.warnings.forEach(warning => {
      report += `⚠️ ${warning}\n`;
    });
    report += `\n`;
  }

  if (verification.errors.length > 0) {
    report += `=== ERROS ===\n`;
    verification.errors.forEach(error => {
      report += `❌ ${error}\n`;
    });
    report += `\n`;
  }

  report += `=== CÓDIGO LEGÍVEL ===\n`;
  report += `${generateReadableCode(verificationCode)}\n\n`;

  report += `=== QR CODE ===\n`;
  report += `${generateVerificationQRCode(verificationCode)}\n\n`;

  report += `Gerado em: ${new Date().toLocaleString('pt-BR')}\n`;

  return report;
} 