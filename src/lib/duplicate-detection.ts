import { 
  TimeRecord, 
  DuplicateDetectionConfig, 
  DuplicateDetectionResult, 
  DuplicateDetectionStrategy,
  DuplicateRules
} from '@/types/time-record';

/**
 * Utilitários para detecção de duplicação de ponto
 */

/**
 * Configuração padrão para detecção de duplicação
 */
export function getDefaultDuplicateDetectionConfig(): DuplicateDetectionConfig {
  return {
    timeWindowMinutes: 5, // 5 minutos de janela
    checkLocation: true,
    locationThresholdMeters: 100, // 100 metros
    checkDevice: true,
    checkIP: true,
    allowMultipleSameType: false,
    maxRecordsPerDay: 8, // Máximo 8 registros por dia (entrada, saída, 2 pausas)
  };
}

/**
 * Calcula distância entre duas coordenadas (fórmula de Haversine)
 */
function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371e3; // Raio da Terra em metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Verifica se dois registros estão na mesma janela de tempo
 */
function isInTimeWindow(
  record1: TimeRecord, 
  record2: TimeRecord, 
  windowMinutes: number
): boolean {
  const time1 = new Date(record1.timestamp).getTime();
  const time2 = new Date(record2.timestamp).getTime();
  const diffMinutes = Math.abs(time1 - time2) / (1000 * 60);
  
  return diffMinutes <= windowMinutes;
}

/**
 * Verifica se dois registros têm localização similar
 */
function hasSimilarLocation(
  record1: TimeRecord, 
  record2: TimeRecord, 
  thresholdMeters: number
): boolean {
  if (!record1.latitude || !record1.longitude || !record2.latitude || !record2.longitude) {
    return false;
  }

  const distance = calculateDistance(
    record1.latitude, 
    record1.longitude, 
    record2.latitude, 
    record2.longitude
  );

  return distance <= thresholdMeters;
}

/**
 * Verifica se dois registros têm dispositivo similar
 */
function hasSimilarDevice(record1: TimeRecord, record2: TimeRecord): boolean {
  if (!record1.deviceInfo || !record2.deviceInfo) {
    return false;
  }

  // Compara informações básicas do dispositivo
  const device1 = record1.deviceInfo.toLowerCase();
  const device2 = record2.deviceInfo.toLowerCase();

  // Verifica se ambos são mobile ou desktop
  const isMobile1 = device1.includes('mobile') || device1.includes('android') || device1.includes('ios');
  const isMobile2 = device2.includes('mobile') || device2.includes('android') || device2.includes('ios');

  return isMobile1 === isMobile2;
}

/**
 * Verifica se dois registros têm IP similar
 */
function hasSimilarIP(record1: TimeRecord, record2: TimeRecord): boolean {
  if (!record1.ipAddress || !record2.ipAddress) {
    return false;
  }

  // Compara IPs (pode ser expandido para verificar subnets)
  return record1.ipAddress === record2.ipAddress;
}

/**
 * Verifica se há múltiplos registros do mesmo tipo no mesmo dia
 */
function hasMultipleSameType(
  newRecord: TimeRecord, 
  existingRecords: TimeRecord[]
): boolean {
  const sameDayRecords = existingRecords.filter(record => {
    const recordDate = new Date(record.timestamp).toDateString();
    const newRecordDate = new Date(newRecord.timestamp).toDateString();
    return recordDate === newRecordDate && record.type === newRecord.type;
  });

  return sameDayRecords.length > 0;
}

/**
 * Verifica se excedeu o limite de registros por dia
 */
function hasExceededDailyLimit(
  newRecord: TimeRecord, 
  existingRecords: TimeRecord[], 
  maxRecords: number
): boolean {
  const sameDayRecords = existingRecords.filter(record => {
    const recordDate = new Date(record.timestamp).toDateString();
    const newRecordDate = new Date(newRecord.timestamp).toDateString();
    return recordDate === newRecordDate;
  });

  return sameDayRecords.length >= maxRecords;
}

/**
 * Detecta duplicação de ponto usando estratégia específica
 */
export function detectDuplicate(
  newRecord: TimeRecord,
  existingRecords: TimeRecord[],
  config: DuplicateDetectionConfig = getDefaultDuplicateDetectionConfig(),
  strategy: DuplicateDetectionStrategy = 'HYBRID'
): DuplicateDetectionResult {
  const result: DuplicateDetectionResult = {
    isDuplicate: false,
    duplicateType: 'NONE',
    confidence: 0,
    similarRecords: [],
    warnings: [],
    errors: []
  };

  try {
    // Filtra registros do mesmo funcionário
    const employeeRecords = existingRecords.filter(
      record => record.employeeId === newRecord.employeeId
    );

    if (employeeRecords.length === 0) {
      return result;
    }

    let maxConfidence = 0;
    let detectedType: DuplicateDetectionResult['duplicateType'] = 'NONE';
    let similarRecords: TimeRecord[] = [];

    // Verifica duplicação por janela de tempo
    if (strategy === 'TIME_WINDOW' || strategy === 'HYBRID') {
      const timeWindowDuplicates = employeeRecords.filter(record =>
        isInTimeWindow(newRecord, record, config.timeWindowMinutes)
      );

      if (timeWindowDuplicates.length > 0) {
        const confidence = Math.min(0.9, timeWindowDuplicates.length * 0.3);
        if (confidence > maxConfidence) {
          maxConfidence = confidence;
          detectedType = 'TIME_WINDOW';
          similarRecords = timeWindowDuplicates;
        }
      }
    }

    // Verifica duplicação por localização
    if (config.checkLocation && (strategy === 'LOCATION_BASED' || strategy === 'HYBRID')) {
      const locationDuplicates = employeeRecords.filter(record =>
        hasSimilarLocation(newRecord, record, config.locationThresholdMeters)
      );

      if (locationDuplicates.length > 0) {
        const confidence = Math.min(0.8, locationDuplicates.length * 0.25);
        if (confidence > maxConfidence) {
          maxConfidence = confidence;
          detectedType = 'LOCATION';
          similarRecords = locationDuplicates;
        }
      }
    }

    // Verifica duplicação por dispositivo
    if (config.checkDevice && (strategy === 'DEVICE_BASED' || strategy === 'HYBRID')) {
      const deviceDuplicates = employeeRecords.filter(record =>
        hasSimilarDevice(newRecord, record)
      );

      if (deviceDuplicates.length > 0) {
        const confidence = Math.min(0.7, deviceDuplicates.length * 0.2);
        if (confidence > maxConfidence) {
          maxConfidence = confidence;
          detectedType = 'DEVICE';
          similarRecords = deviceDuplicates;
        }
      }
    }

    // Verifica duplicação por IP
    if (config.checkIP && (strategy === 'DEVICE_BASED' || strategy === 'HYBRID')) {
      const ipDuplicates = employeeRecords.filter(record =>
        hasSimilarIP(newRecord, record)
      );

      if (ipDuplicates.length > 0) {
        const confidence = Math.min(0.6, ipDuplicates.length * 0.15);
        if (confidence > maxConfidence) {
          maxConfidence = confidence;
          detectedType = 'IP';
          similarRecords = ipDuplicates;
        }
      }
    }

    // Verifica múltiplos registros do mesmo tipo
    if (!config.allowMultipleSameType) {
      if (hasMultipleSameType(newRecord, employeeRecords)) {
        const confidence = 0.95;
        if (confidence > maxConfidence) {
          maxConfidence = confidence;
          detectedType = 'SAME_TYPE';
          similarRecords = employeeRecords.filter(record => record.type === newRecord.type);
        }
      }
    }

    // Verifica limite diário
    if (hasExceededDailyLimit(newRecord, employeeRecords, config.maxRecordsPerDay)) {
      const confidence = 0.9;
      if (confidence > maxConfidence) {
        maxConfidence = confidence;
        detectedType = 'MAX_DAILY';
        similarRecords = employeeRecords;
      }
    }

    // Define resultado final
    result.isDuplicate = maxConfidence > 0.5; // Threshold de 50%
    result.duplicateType = detectedType;
    result.confidence = maxConfidence;
    result.similarRecords = similarRecords;

    // Adiciona informações detalhadas
    if (similarRecords.length > 0) {
      const closestRecord = similarRecords.reduce((closest, current) => {
        const closestTime = new Date(closest.timestamp).getTime();
        const currentTime = new Date(current.timestamp).getTime();
        const newTime = new Date(newRecord.timestamp).getTime();
        
        const closestDiff = Math.abs(closestTime - newTime);
        const currentDiff = Math.abs(currentTime - newTime);
        
        return currentDiff < closestDiff ? current : closest;
      });

      result.timeDifference = Math.abs(
        new Date(newRecord.timestamp).getTime() - new Date(closestRecord.timestamp).getTime()
      ) / (1000 * 60);

      if (newRecord.latitude && newRecord.longitude && closestRecord.latitude && closestRecord.longitude) {
        result.locationDifference = calculateDistance(
          newRecord.latitude,
          newRecord.longitude,
          closestRecord.latitude,
          closestRecord.longitude
        );
      }
    }

    // Adiciona warnings baseados na confiança
    if (maxConfidence > 0.7) {
      result.warnings.push(`Alta probabilidade de duplicação detectada (${Math.round(maxConfidence * 100)}%)`);
    } else if (maxConfidence > 0.5) {
      result.warnings.push(`Possível duplicação detectada (${Math.round(maxConfidence * 100)}%)`);
    }

  } catch (error) {
    result.errors.push(`Erro na detecção de duplicação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }

  return result;
}

/**
 * Gera regras de duplicação personalizadas para um funcionário
 */
export function generateDuplicateRules(
  employeeId: string,
  companyId: string,
  employeeConfig?: Partial<DuplicateDetectionConfig>
): DuplicateRules {
  const defaultConfig = getDefaultDuplicateDetectionConfig();
  const config = { ...defaultConfig, ...employeeConfig };

  return {
    employeeId,
    companyId,
    rules: {
      timeWindowMinutes: config.timeWindowMinutes,
      locationThresholdMeters: config.locationThresholdMeters,
      maxRecordsPerDay: config.maxRecordsPerDay,
      allowedTypesPerDay: ['ENTRY', 'EXIT', 'BREAK_START', 'BREAK_END'],
      blockedTypesPerDay: [],
    },
    exceptions: {
      allowMultipleEntries: false,
      allowMultipleExits: false,
      allowMultipleBreaks: true, // Permite múltiplas pausas
      specialDays: [], // Feriados e datas especiais
    },
  };
}

/**
 * Gera relatório de detecção de duplicação
 */
export function generateDuplicateReport(result: DuplicateDetectionResult): string {
  let report = `=== Relatório de Detecção de Duplicação ===\n`;
  report += `Data/Hora: ${new Date().toLocaleString('pt-BR')}\n`;
  report += `É duplicado: ${result.isDuplicate ? 'Sim' : 'Não'}\n`;
  report += `Tipo de duplicação: ${result.duplicateType}\n`;
  report += `Confiança: ${Math.round(result.confidence * 100)}%\n\n`;

  if (result.similarRecords.length > 0) {
    report += `Registros similares encontrados: ${result.similarRecords.length}\n`;
    
    if (result.timeDifference) {
      report += `Diferença de tempo: ${result.timeDifference.toFixed(1)} minutos\n`;
    }
    
    if (result.locationDifference) {
      report += `Diferença de localização: ${result.locationDifference.toFixed(0)} metros\n`;
    }

    report += `\nRegistros similares:\n`;
    result.similarRecords.slice(0, 3).forEach((record, index) => {
      report += `${index + 1}. ${record.type} - ${new Date(record.timestamp).toLocaleString('pt-BR')}\n`;
    });
  }

  if (result.warnings.length > 0) {
    report += `\nAvisos:\n`;
    result.warnings.forEach(warning => report += `- ${warning}\n`);
  }

  if (result.errors.length > 0) {
    report += `\nErros:\n`;
    result.errors.forEach(error => report += `- ${error}\n`);
  }

  return report;
}

/**
 * Simula dados de registros existentes para demonstração
 */
export function generateMockExistingRecords(employeeId: string): TimeRecord[] {
  const now = new Date();
  const records: TimeRecord[] = [];

  // Registro de entrada de hoje (se for dia útil)
  if (now.getDay() !== 0 && now.getDay() !== 6) {
    const entryTime = new Date(now);
    entryTime.setHours(8, 0, 0, 0);
    
    records.push({
      id: `record_${employeeId}_${entryTime.getTime()}_entry`,
      type: 'ENTRY',
      timestamp: entryTime.toISOString(),
      latitude: -23.5505,
      longitude: -46.6333,
      ipAddress: '192.168.1.100',
      deviceInfo: 'Mobile App',
      hash: `hash_${Math.random().toString(36).substring(2, 16)}`,
      createdAt: entryTime.toISOString(),
      userId: `user_${employeeId}`,
      employeeId,
      companyId: '1',
    });
  }

  // Registro de ontem
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (yesterday.getDay() !== 0 && yesterday.getDay() !== 6) {
    const entryTime = new Date(yesterday);
    entryTime.setHours(8, 15, 0, 0);
    
    records.push({
      id: `record_${employeeId}_${entryTime.getTime()}_entry`,
      type: 'ENTRY',
      timestamp: entryTime.toISOString(),
      latitude: -23.5505,
      longitude: -46.6333,
      ipAddress: '192.168.1.100',
      deviceInfo: 'Mobile App',
      hash: `hash_${Math.random().toString(36).substring(2, 16)}`,
      createdAt: entryTime.toISOString(),
      userId: `user_${employeeId}`,
      employeeId,
      companyId: '1',
    });

    const exitTime = new Date(yesterday);
    exitTime.setHours(17, 30, 0, 0);
    
    records.push({
      id: `record_${employeeId}_${exitTime.getTime()}_exit`,
      type: 'EXIT',
      timestamp: exitTime.toISOString(),
      latitude: -23.5505,
      longitude: -46.6333,
      ipAddress: '192.168.1.100',
      deviceInfo: 'Mobile App',
      hash: `hash_${Math.random().toString(36).substring(2, 16)}`,
      createdAt: exitTime.toISOString(),
      userId: `user_${employeeId}`,
      employeeId,
      companyId: '1',
    });
  }

  return records;
} 