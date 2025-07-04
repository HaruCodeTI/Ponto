import { 
  WorkDaySchedule, 
  WeeklyWorkSchedule, 
  WorkTimeValidation, 
  WorkTimeValidationConfig,
  RecordType 
} from '@/types/time-record';

/**
 * Utilitários para validação de horário de trabalho
 */

/**
 * Converte string de horário (HH:mm) para minutos desde meia-noite
 */
export function timeStringToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Converte minutos desde meia-noite para string de horário (HH:mm)
 */
export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Obtém o horário atual formatado (HH:mm)
 */
export function getCurrentTimeString(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * Obtém o dia da semana atual (0-6, onde 0 = Domingo)
 */
export function getCurrentDayOfWeek(): number {
  return new Date().getDay();
}

/**
 * Obtém o nome do dia da semana
 */
export function getDayName(dayOfWeek: number): string {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return days[dayOfWeek];
}

/**
 * Verifica se um horário está dentro de um intervalo
 */
export function isTimeInRange(
  time: string, 
  startTime: string, 
  endTime: string, 
  toleranceMinutes: number = 0
): boolean {
  const timeMinutes = timeStringToMinutes(time);
  const startMinutes = timeStringToMinutes(startTime);
  const endMinutes = timeStringToMinutes(endTime);
  
  // Ajusta com tolerância
  const adjustedStart = startMinutes - toleranceMinutes;
  const adjustedEnd = endMinutes + toleranceMinutes;
  
  return timeMinutes >= adjustedStart && timeMinutes <= adjustedEnd;
}

/**
 * Calcula a diferença em minutos entre dois horários
 */
export function getTimeDifference(time1: string, time2: string): number {
  const minutes1 = timeStringToMinutes(time1);
  const minutes2 = timeStringToMinutes(time2);
  return Math.abs(minutes1 - minutes2);
}

/**
 * Cria uma jornada semanal padrão (segunda a sexta, 8h às 17h)
 */
export function createDefaultWeeklySchedule(employeeId: string): WeeklyWorkSchedule {
  const workDays: WorkDaySchedule[] = [
    {
      dayOfWeek: 1, // Segunda
      dayName: 'Segunda',
      isWorkDay: true,
      startTime: '08:00',
      endTime: '17:00',
      breakStartTime: '12:00',
      breakEndTime: '13:00',
      toleranceMinutes: 15
    },
    {
      dayOfWeek: 2, // Terça
      dayName: 'Terça',
      isWorkDay: true,
      startTime: '08:00',
      endTime: '17:00',
      breakStartTime: '12:00',
      breakEndTime: '13:00',
      toleranceMinutes: 15
    },
    {
      dayOfWeek: 3, // Quarta
      dayName: 'Quarta',
      isWorkDay: true,
      startTime: '08:00',
      endTime: '17:00',
      breakStartTime: '12:00',
      breakEndTime: '13:00',
      toleranceMinutes: 15
    },
    {
      dayOfWeek: 4, // Quinta
      dayName: 'Quinta',
      isWorkDay: true,
      startTime: '08:00',
      endTime: '17:00',
      breakStartTime: '12:00',
      breakEndTime: '13:00',
      toleranceMinutes: 15
    },
    {
      dayOfWeek: 5, // Sexta
      dayName: 'Sexta',
      isWorkDay: true,
      startTime: '08:00',
      endTime: '17:00',
      breakStartTime: '12:00',
      breakEndTime: '13:00',
      toleranceMinutes: 15
    },
    {
      dayOfWeek: 6, // Sábado
      dayName: 'Sábado',
      isWorkDay: false,
      toleranceMinutes: 0
    },
    {
      dayOfWeek: 0, // Domingo
      dayName: 'Domingo',
      isWorkDay: false,
      toleranceMinutes: 0
    }
  ];

  return {
    employeeId,
    workDays,
    totalWeeklyHours: 40,
    isFlexible: false,
    maxDailyHours: 8,
    minDailyHours: 6
  };
}

/**
 * Obtém a configuração de validação padrão
 */
export function getDefaultValidationConfig(): WorkTimeValidationConfig {
  return {
    allowEarlyEntry: true,
    allowLateExit: true,
    maxEarlyEntryMinutes: 30,
    maxLateExitMinutes: 60,
    requireBreak: true,
    minBreakMinutes: 30,
    maxBreakMinutes: 120,
    flexibleSchedule: false,
    gracePeriodMinutes: 5
  };
}

/**
 * Valida se um registro de ponto está dentro do horário de trabalho
 */
export function validateWorkTime(
  recordType: RecordType,
  timestamp: string,
  weeklySchedule: WeeklyWorkSchedule,
  config: WorkTimeValidationConfig = getDefaultValidationConfig()
): WorkTimeValidation {
  const recordDate = new Date(timestamp);
  const dayOfWeek = recordDate.getDay();
  const currentTime = `${recordDate.getHours().toString().padStart(2, '0')}:${recordDate.getMinutes().toString().padStart(2, '0')}`;
  
  // Encontra o horário do dia atual
  const currentDaySchedule = weeklySchedule.workDays.find(day => day.dayOfWeek === dayOfWeek);
  
  const validation: WorkTimeValidation = {
    isValid: true,
    isWithinWorkHours: false,
    isWithinTolerance: false,
    isWorkDay: currentDaySchedule?.isWorkDay || false,
    currentDaySchedule,
    currentTime,
    toleranceMinutes: currentDaySchedule?.toleranceMinutes || 0,
    warnings: [],
    errors: []
  };

  // Se não é dia de trabalho
  if (!currentDaySchedule?.isWorkDay) {
    validation.isValid = false;
    validation.errors.push(`Não é dia de trabalho (${currentDaySchedule?.dayName})`);
    return validation;
  }

  // Se não tem horário definido
  if (!currentDaySchedule.startTime || !currentDaySchedule.endTime) {
    validation.isValid = false;
    validation.errors.push('Horário de trabalho não definido para este dia');
    return validation;
  }

  validation.expectedStartTime = currentDaySchedule.startTime;
  validation.expectedEndTime = currentDaySchedule.endTime;

  // Validação específica por tipo de registro
  switch (recordType) {
    case 'ENTRY':
      return validateEntryTime(validation, config);
    case 'EXIT':
      return validateExitTime(validation, config);
    case 'BREAK_START':
      return validateBreakStartTime(validation, config);
    case 'BREAK_END':
      return validateBreakEndTime(validation, config);
    default:
      validation.isValid = false;
      validation.errors.push('Tipo de registro inválido');
      return validation;
  }
}

/**
 * Valida horário de entrada
 */
function validateEntryTime(
  validation: WorkTimeValidation,
  config: WorkTimeValidationConfig
): WorkTimeValidation {
  const { currentTime, expectedStartTime, toleranceMinutes } = validation;
  
  if (!expectedStartTime) {
    validation.isValid = false;
    validation.errors.push('Horário de entrada não definido');
    return validation;
  }

  const currentMinutes = timeStringToMinutes(currentTime);
  const startMinutes = timeStringToMinutes(expectedStartTime);
  const toleranceStart = startMinutes - toleranceMinutes - config.gracePeriodMinutes;
  const toleranceEnd = startMinutes + toleranceMinutes + config.gracePeriodMinutes;

  // Verifica se está dentro do horário de trabalho
  validation.isWithinWorkHours = currentMinutes >= toleranceStart && currentMinutes <= toleranceEnd;
  validation.isWithinTolerance = validation.isWithinWorkHours;

  // Calcula atraso se aplicável
  if (currentMinutes > startMinutes + toleranceMinutes) {
    validation.delayMinutes = currentMinutes - (startMinutes + toleranceMinutes);
    validation.warnings.push(`Entrada com ${validation.delayMinutes} minutos de atraso`);
  }

  // Verifica entrada muito antecipada
  if (config.allowEarlyEntry && currentMinutes < startMinutes - config.maxEarlyEntryMinutes) {
    validation.warnings.push(`Entrada muito antecipada (${config.maxEarlyEntryMinutes} minutos antes do horário)`);
  }

  if (!config.allowEarlyEntry && currentMinutes < startMinutes) {
    validation.isValid = false;
    validation.errors.push('Entrada antecipada não permitida');
  }

  return validation;
}

/**
 * Valida horário de saída
 */
function validateExitTime(
  validation: WorkTimeValidation,
  config: WorkTimeValidationConfig
): WorkTimeValidation {
  const { currentTime, expectedEndTime, toleranceMinutes } = validation;
  
  if (!expectedEndTime) {
    validation.isValid = false;
    validation.errors.push('Horário de saída não definido');
    return validation;
  }

  const currentMinutes = timeStringToMinutes(currentTime);
  const endMinutes = timeStringToMinutes(expectedEndTime);
  const toleranceStart = endMinutes - toleranceMinutes - config.gracePeriodMinutes;
  const toleranceEnd = endMinutes + toleranceMinutes + config.gracePeriodMinutes;

  // Verifica se está dentro do horário de trabalho
  validation.isWithinWorkHours = currentMinutes >= toleranceStart && currentMinutes <= toleranceEnd;
  validation.isWithinTolerance = validation.isWithinWorkHours;

  // Calcula saída antecipada se aplicável
  if (currentMinutes < endMinutes - toleranceMinutes) {
    validation.earlyDepartureMinutes = (endMinutes - toleranceMinutes) - currentMinutes;
    validation.warnings.push(`Saída com ${validation.earlyDepartureMinutes} minutos de antecedência`);
  }

  // Verifica saída muito tardia
  if (config.allowLateExit && currentMinutes < endMinutes + config.maxLateExitMinutes) {
    validation.warnings.push(`Saída muito tardia (${config.maxLateExitMinutes} minutos após o horário)`);
  }

  if (!config.allowLateExit && currentMinutes > endMinutes) {
    validation.isValid = false;
    validation.errors.push('Saída tardia não permitida');
  }

  return validation;
}

/**
 * Valida início do intervalo
 */
function validateBreakStartTime(
  validation: WorkTimeValidation,
  _config: WorkTimeValidationConfig
): WorkTimeValidation {
  const { currentTime, currentDaySchedule } = validation;
  
  if (!currentDaySchedule?.breakStartTime) {
    validation.isValid = false;
    validation.errors.push('Horário de intervalo não definido');
    return validation;
  }

  const currentMinutes = timeStringToMinutes(currentTime);
  const breakStartMinutes = timeStringToMinutes(currentDaySchedule.breakStartTime);
  const tolerance = 15; // Tolerância para início do intervalo

  validation.isWithinWorkHours = Math.abs(currentMinutes - breakStartMinutes) <= tolerance;
  validation.isWithinTolerance = validation.isWithinWorkHours;

  if (!validation.isWithinTolerance) {
    validation.warnings.push('Início do intervalo fora do horário esperado');
  }

  return validation;
}

/**
 * Valida fim do intervalo
 */
function validateBreakEndTime(
  validation: WorkTimeValidation,
  _config: WorkTimeValidationConfig
): WorkTimeValidation {
  const { currentTime, currentDaySchedule } = validation;
  
  if (!currentDaySchedule?.breakEndTime) {
    validation.isValid = false;
    validation.errors.push('Horário de fim do intervalo não definido');
    return validation;
  }

  const currentMinutes = timeStringToMinutes(currentTime);
  const breakEndMinutes = timeStringToMinutes(currentDaySchedule.breakEndTime);
  const tolerance = 15; // Tolerância para fim do intervalo

  validation.isWithinWorkHours = Math.abs(currentMinutes - breakEndMinutes) <= tolerance;
  validation.isWithinTolerance = validation.isWithinWorkHours;

  if (!validation.isWithinTolerance) {
    validation.warnings.push('Fim do intervalo fora do horário esperado');
  }

  return validation;
}

/**
 * Gera relatório de validação de horário
 */
export function generateWorkTimeReport(validation: WorkTimeValidation): string {
  const { currentDaySchedule, currentTime, isWorkDay, isValid, warnings, errors } = validation;
  
  let report = `=== Relatório de Validação de Horário ===\n`;
  report += `Data/Hora: ${new Date().toLocaleString('pt-BR')}\n`;
  report += `Dia: ${currentDaySchedule?.dayName || 'N/A'}\n`;
  report += `Horário atual: ${currentTime}\n`;
  report += `É dia de trabalho: ${isWorkDay ? 'Sim' : 'Não'}\n`;
  report += `Válido: ${isValid ? 'Sim' : 'Não'}\n\n`;

  if (currentDaySchedule?.startTime && currentDaySchedule?.endTime) {
    report += `Horário esperado: ${currentDaySchedule.startTime} - ${currentDaySchedule.endTime}\n`;
    report += `Tolerância: ${currentDaySchedule.toleranceMinutes} minutos\n\n`;
  }

  if (validation.delayMinutes) {
    report += `⚠️ Atraso: ${validation.delayMinutes} minutos\n`;
  }

  if (validation.earlyDepartureMinutes) {
    report += `⚠️ Saída antecipada: ${validation.earlyDepartureMinutes} minutos\n`;
  }

  if (warnings.length > 0) {
    report += `\nAvisos:\n`;
    warnings.forEach(warning => report += `- ${warning}\n`);
  }

  if (errors.length > 0) {
    report += `\nErros:\n`;
    errors.forEach(error => report += `- ${error}\n`);
  }

  return report;
}

/**
 * Simula dados de jornada semanal para demonstração
 */
export function generateMockWeeklySchedule(employeeId: string): WeeklyWorkSchedule {
  return {
    employeeId,
    workDays: [
      {
        dayOfWeek: 1,
        dayName: 'Segunda',
        isWorkDay: true,
        startTime: '08:00',
        endTime: '17:00',
        breakStartTime: '12:00',
        breakEndTime: '13:00',
        toleranceMinutes: 15
      },
      {
        dayOfWeek: 2,
        dayName: 'Terça',
        isWorkDay: true,
        startTime: '08:00',
        endTime: '17:00',
        breakStartTime: '12:00',
        breakEndTime: '13:00',
        toleranceMinutes: 15
      },
      {
        dayOfWeek: 3,
        dayName: 'Quarta',
        isWorkDay: true,
        startTime: '08:00',
        endTime: '17:00',
        breakStartTime: '12:00',
        breakEndTime: '13:00',
        toleranceMinutes: 15
      },
      {
        dayOfWeek: 4,
        dayName: 'Quinta',
        isWorkDay: true,
        startTime: '08:00',
        endTime: '17:00',
        breakStartTime: '12:00',
        breakEndTime: '13:00',
        toleranceMinutes: 15
      },
      {
        dayOfWeek: 5,
        dayName: 'Sexta',
        isWorkDay: true,
        startTime: '08:00',
        endTime: '17:00',
        breakStartTime: '12:00',
        breakEndTime: '13:00',
        toleranceMinutes: 15
      },
      {
        dayOfWeek: 6,
        dayName: 'Sábado',
        isWorkDay: false,
        toleranceMinutes: 0
      },
      {
        dayOfWeek: 0,
        dayName: 'Domingo',
        isWorkDay: false,
        toleranceMinutes: 0
      }
    ],
    totalWeeklyHours: 40,
    isFlexible: false,
    maxDailyHours: 8,
    minDailyHours: 6
  };
} 