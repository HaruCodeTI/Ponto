import { TimeRecord } from "@/types/time-record";

/**
 * Configurações para cálculo de horas trabalhadas
 */
export interface WorkHoursConfig {
  regularHoursPerDay: number; // Horas regulares por dia (ex: 8)
  maxOvertimePerDay: number; // Máximo de horas extras por dia (ex: 2)
  maxOvertimePerWeek: number; // Máximo de horas extras por semana (ex: 10)
  breakTimeMinutes: number; // Tempo de intervalo em minutos (ex: 60)
  toleranceMinutes: number; // Tolerância para entrada/saída (ex: 15)
  workDaysPerWeek: number; // Dias de trabalho por semana (ex: 5)
  flexibleSchedule: boolean; // Se permite horário flexível
  calculateNightShift: boolean; // Se calcula adicional noturno
  nightShiftStart: string; // Início do período noturno (ex: "22:00")
  nightShiftEnd: string; // Fim do período noturno (ex: "05:00")
}

/**
 * Configurações padrão para cálculo de horas
 */
export const DEFAULT_WORK_HOURS_CONFIG: WorkHoursConfig = {
  regularHoursPerDay: 8,
  maxOvertimePerDay: 2,
  maxOvertimePerWeek: 10,
  breakTimeMinutes: 60,
  toleranceMinutes: 15,
  workDaysPerWeek: 5,
  flexibleSchedule: false,
  calculateNightShift: false,
  nightShiftStart: "22:00",
  nightShiftEnd: "05:00",
};

/**
 * Resultado do cálculo de horas trabalhadas
 */
export interface WorkHoursCalculation {
  date: string; // Data do cálculo
  employeeId: string;
  totalMinutes: number; // Total de minutos trabalhados
  regularMinutes: number; // Minutos regulares
  overtimeMinutes: number; // Minutos extras
  breakMinutes: number; // Minutos de intervalo
  nightShiftMinutes: number; // Minutos em período noturno
  delayMinutes: number; // Minutos de atraso
  earlyDepartureMinutes: number; // Minutos de saída antecipada
  isComplete: boolean; // Se tem entrada e saída
  isLate: boolean; // Se chegou atrasado
  isEarlyDeparture: boolean; // Se saiu antes
  hasOvertime: boolean; // Se tem horas extras
  hasNightShift: boolean; // Se trabalhou em período noturno
  records: TimeRecord[]; // Registros do dia
  entryTime?: string; // Horário de entrada
  exitTime?: string; // Horário de saída
  breakStartTime?: string; // Início do intervalo
  breakEndTime?: string; // Fim do intervalo
  warnings: string[]; // Avisos sobre o cálculo
  errors: string[]; // Erros no cálculo
}

/**
 * Cálculo semanal de horas trabalhadas
 */
export interface WeeklyWorkHoursCalculation {
  weekStart: string; // Início da semana
  weekEnd: string; // Fim da semana
  employeeId: string;
  totalRegularMinutes: number;
  totalOvertimeMinutes: number;
  totalBreakMinutes: number;
  totalNightShiftMinutes: number;
  totalDelayMinutes: number;
  totalEarlyDepartureMinutes: number;
  workDays: number; // Dias trabalhados
  completeDays: number; // Dias completos (entrada + saída)
  lateDays: number; // Dias com atraso
  earlyDepartureDays: number; // Dias com saída antecipada
  overtimeDays: number; // Dias com horas extras
  nightShiftDays: number; // Dias com período noturno
  dailyCalculations: WorkHoursCalculation[]; // Cálculos diários
  weeklyOvertimeExceeded: boolean; // Se excedeu limite semanal
  averageHoursPerDay: number; // Média de horas por dia
  warnings: string[];
  errors: string[];
}

/**
 * Cálculo mensal de horas trabalhadas
 */
export interface MonthlyWorkHoursCalculation {
  month: string; // YYYY-MM
  employeeId: string;
  totalRegularMinutes: number;
  totalOvertimeMinutes: number;
  totalBreakMinutes: number;
  totalNightShiftMinutes: number;
  totalDelayMinutes: number;
  totalEarlyDepartureMinutes: number;
  workDays: number;
  completeDays: number;
  lateDays: number;
  earlyDepartureDays: number;
  overtimeDays: number;
  nightShiftDays: number;
  weeklyCalculations: WeeklyWorkHoursCalculation[]; // Cálculos semanais
  monthlyOvertimeExceeded: boolean; // Se excedeu limite mensal
  averageHoursPerDay: number;
  averageOvertimePerDay: number;
  attendanceRate: number; // Taxa de presença
  punctualityRate: number; // Taxa de pontualidade
  warnings: string[];
  errors: string[];
}

/**
 * Calcula horas trabalhadas para um dia específico
 */
export function calculateDailyWorkHours(
  records: TimeRecord[],
  config: WorkHoursConfig = DEFAULT_WORK_HOURS_CONFIG
): WorkHoursCalculation {
  if (records.length === 0) {
    return {
      date: new Date().toISOString().split('T')[0],
      employeeId: '',
      totalMinutes: 0,
      regularMinutes: 0,
      overtimeMinutes: 0,
      breakMinutes: 0,
      nightShiftMinutes: 0,
      delayMinutes: 0,
      earlyDepartureMinutes: 0,
      isComplete: false,
      isLate: false,
      isEarlyDeparture: false,
      hasOvertime: false,
      hasNightShift: false,
      records: [],
      warnings: ['Nenhum registro encontrado'],
      errors: [],
    };
  }

  const employeeId = records[0].employeeId;
  const date = new Date(records[0].timestamp).toISOString().split('T')[0];
  
  // Ordena registros por timestamp
  const sortedRecords = records.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Encontra registros por tipo
  const entry = sortedRecords.find(r => r.type === 'ENTRY');
  const exit = sortedRecords.find(r => r.type === 'EXIT');
  const breakStart = sortedRecords.find(r => r.type === 'BREAK_START');
  const breakEnd = sortedRecords.find(r => r.type === 'BREAK_END');

  const calculation: WorkHoursCalculation = {
    date,
    employeeId,
    totalMinutes: 0,
    regularMinutes: 0,
    overtimeMinutes: 0,
    breakMinutes: 0,
    nightShiftMinutes: 0,
    delayMinutes: 0,
    earlyDepartureMinutes: 0,
    isComplete: false,
    isLate: false,
    isEarlyDeparture: false,
    hasOvertime: false,
    hasNightShift: false,
    records: sortedRecords,
    entryTime: entry?.timestamp,
    exitTime: exit?.timestamp,
    breakStartTime: breakStart?.timestamp,
    breakEndTime: breakEnd?.timestamp,
    warnings: [],
    errors: [],
  };

  // Se não tem entrada, não pode calcular
  if (!entry) {
    calculation.errors.push('Registro de entrada não encontrado');
    return calculation;
  }

  // Se não tem saída, marca como incompleto
  if (!exit) {
    calculation.warnings.push('Registro de saída não encontrado - cálculo parcial');
    calculation.isComplete = false;
  } else {
    calculation.isComplete = true;
  }

  // Calcula tempo total trabalhado
  if (entry && exit) {
    const entryTime = new Date(entry.timestamp);
    const exitTime = new Date(exit.timestamp);
    
    // Tempo total em minutos
    let totalMinutes = (exitTime.getTime() - entryTime.getTime()) / (1000 * 60);
    
    // Subtrai intervalo se existir
    if (breakStart && breakEnd) {
      const breakStartTime = new Date(breakStart.timestamp);
      const breakEndTime = new Date(breakEnd.timestamp);
      const breakMinutes = (breakEndTime.getTime() - breakStartTime.getTime()) / (1000 * 60);
      
      totalMinutes -= breakMinutes;
      calculation.breakMinutes = breakMinutes;
      
      // Verifica se o intervalo está dentro do esperado
      const expectedBreakMinutes = config.breakTimeMinutes;
      if (Math.abs(breakMinutes - expectedBreakMinutes) > config.toleranceMinutes) {
        calculation.warnings.push(`Intervalo fora do padrão: ${Math.round(breakMinutes)}min (esperado: ${expectedBreakMinutes}min)`);
      }
    }

    calculation.totalMinutes = totalMinutes;

    // Calcula horas regulares vs extras
    const regularMinutes = Math.min(totalMinutes, config.regularHoursPerDay * 60);
    const overtimeMinutes = Math.max(0, totalMinutes - regularMinutes);
    
    calculation.regularMinutes = regularMinutes;
    calculation.overtimeMinutes = overtimeMinutes;
    calculation.hasOvertime = overtimeMinutes > 0;

    // Verifica se excedeu limite diário de horas extras
    if (overtimeMinutes > config.maxOvertimePerDay * 60) {
      calculation.warnings.push(`Horas extras excedem limite diário: ${Math.round(overtimeMinutes / 60)}h (máximo: ${config.maxOvertimePerDay}h)`);
    }

    // Calcula período noturno se habilitado
    if (config.calculateNightShift) {
      calculation.nightShiftMinutes = calculateNightShiftMinutes(entryTime, exitTime, config);
      calculation.hasNightShift = calculation.nightShiftMinutes > 0;
    }

    // Calcula atrasos e saídas antecipadas (baseado em horário padrão 8h-17h)
    const standardEntryTime = new Date(entryTime);
    standardEntryTime.setHours(8, 0, 0, 0);
    
    const standardExitTime = new Date(exitTime);
    standardExitTime.setHours(17, 0, 0, 0);

    // Atraso na entrada
    if (entryTime > standardEntryTime) {
      const delayMinutes = (entryTime.getTime() - standardEntryTime.getTime()) / (1000 * 60);
      calculation.delayMinutes = delayMinutes;
      calculation.isLate = delayMinutes > config.toleranceMinutes;
      
      if (calculation.isLate) {
        calculation.warnings.push(`Entrada com atraso: ${Math.round(delayMinutes)}min`);
      }
    }

    // Saída antecipada
    if (exitTime < standardExitTime) {
      const earlyDepartureMinutes = (standardExitTime.getTime() - exitTime.getTime()) / (1000 * 60);
      calculation.earlyDepartureMinutes = earlyDepartureMinutes;
      calculation.isEarlyDeparture = earlyDepartureMinutes > config.toleranceMinutes;
      
      if (calculation.isEarlyDeparture) {
        calculation.warnings.push(`Saída antecipada: ${Math.round(earlyDepartureMinutes)}min`);
      }
    }
  }

  return calculation;
}

/**
 * Calcula horas trabalhadas para uma semana
 */
export function calculateWeeklyWorkHours(
  dailyCalculations: WorkHoursCalculation[],
  _config: WorkHoursConfig = DEFAULT_WORK_HOURS_CONFIG
): WeeklyWorkHoursCalculation {
  if (dailyCalculations.length === 0) {
    return {
      weekStart: '',
      weekEnd: '',
      employeeId: '',
      totalRegularMinutes: 0,
      totalOvertimeMinutes: 0,
      totalBreakMinutes: 0,
      totalNightShiftMinutes: 0,
      totalDelayMinutes: 0,
      totalEarlyDepartureMinutes: 0,
      workDays: 0,
      completeDays: 0,
      lateDays: 0,
      earlyDepartureDays: 0,
      overtimeDays: 0,
      nightShiftDays: 0,
      dailyCalculations: [],
      weeklyOvertimeExceeded: false,
      averageHoursPerDay: 0,
      warnings: ['Nenhum cálculo diário fornecido'],
      errors: [],
    };
  }

  const employeeId = dailyCalculations[0].employeeId;
  const dates = dailyCalculations.map(d => new Date(d.date)).sort((a, b) => a.getTime() - b.getTime());
  const weekStart = dates[0].toISOString().split('T')[0];
  const weekEnd = dates[dates.length - 1].toISOString().split('T')[0];

  const calculation: WeeklyWorkHoursCalculation = {
    weekStart,
    weekEnd,
    employeeId,
    totalRegularMinutes: 0,
    totalOvertimeMinutes: 0,
    totalBreakMinutes: 0,
    totalNightShiftMinutes: 0,
    totalDelayMinutes: 0,
    totalEarlyDepartureMinutes: 0,
    workDays: dailyCalculations.length,
    completeDays: 0,
    lateDays: 0,
    earlyDepartureDays: 0,
    overtimeDays: 0,
    nightShiftDays: 0,
    dailyCalculations,
    weeklyOvertimeExceeded: false,
    averageHoursPerDay: 0,
    warnings: [],
    errors: [],
  };

  // Soma todos os valores
  dailyCalculations.forEach(daily => {
    calculation.totalRegularMinutes += daily.regularMinutes;
    calculation.totalOvertimeMinutes += daily.overtimeMinutes;
    calculation.totalBreakMinutes += daily.breakMinutes;
    calculation.totalNightShiftMinutes += daily.nightShiftMinutes;
    calculation.totalDelayMinutes += daily.delayMinutes;
    calculation.totalEarlyDepartureMinutes += daily.earlyDepartureMinutes;
    
    if (daily.isComplete) calculation.completeDays++;
    if (daily.isLate) calculation.lateDays++;
    if (daily.isEarlyDeparture) calculation.earlyDepartureDays++;
    if (daily.hasOvertime) calculation.overtimeDays++;
    if (daily.hasNightShift) calculation.nightShiftDays++;
  });

  // Calcula médias
  calculation.averageHoursPerDay = calculation.workDays > 0 
    ? (calculation.totalRegularMinutes + calculation.totalOvertimeMinutes) / (calculation.workDays * 60)
    : 0;

  // Verifica se excedeu limite semanal de horas extras
  const weeklyOvertimeHours = calculation.totalOvertimeMinutes / 60;
  calculation.weeklyOvertimeExceeded = weeklyOvertimeHours > _config.maxOvertimePerWeek;
  
  if (calculation.weeklyOvertimeExceeded) {
    calculation.warnings.push(`Horas extras excedem limite semanal: ${Math.round(weeklyOvertimeHours)}h (máximo: ${_config.maxOvertimePerWeek}h)`);
  }

  // Verifica se trabalhou mais dias que o esperado
  if (calculation.workDays > _config.workDaysPerWeek) {
    calculation.warnings.push(`Trabalhou ${calculation.workDays} dias (esperado: ${_config.workDaysPerWeek})`);
  }

  return calculation;
}

/**
 * Calcula horas trabalhadas para um mês
 */
export function calculateMonthlyWorkHours(
  weeklyCalculations: WeeklyWorkHoursCalculation[],
  _config: WorkHoursConfig = DEFAULT_WORK_HOURS_CONFIG
): MonthlyWorkHoursCalculation {
  if (weeklyCalculations.length === 0) {
    return {
      month: '',
      employeeId: '',
      totalRegularMinutes: 0,
      totalOvertimeMinutes: 0,
      totalBreakMinutes: 0,
      totalNightShiftMinutes: 0,
      totalDelayMinutes: 0,
      totalEarlyDepartureMinutes: 0,
      workDays: 0,
      completeDays: 0,
      lateDays: 0,
      earlyDepartureDays: 0,
      overtimeDays: 0,
      nightShiftDays: 0,
      weeklyCalculations: [],
      monthlyOvertimeExceeded: false,
      averageHoursPerDay: 0,
      averageOvertimePerDay: 0,
      attendanceRate: 0,
      punctualityRate: 0,
      warnings: ['Nenhum cálculo semanal fornecido'],
      errors: [],
    };
  }

  const employeeId = weeklyCalculations[0].employeeId;
  const month = new Date(weeklyCalculations[0].weekStart).toISOString().substring(0, 7); // YYYY-MM

  const calculation: MonthlyWorkHoursCalculation = {
    month,
    employeeId,
    totalRegularMinutes: 0,
    totalOvertimeMinutes: 0,
    totalBreakMinutes: 0,
    totalNightShiftMinutes: 0,
    totalDelayMinutes: 0,
    totalEarlyDepartureMinutes: 0,
    workDays: 0,
    completeDays: 0,
    lateDays: 0,
    earlyDepartureDays: 0,
    overtimeDays: 0,
    nightShiftDays: 0,
    weeklyCalculations,
    monthlyOvertimeExceeded: false,
    averageHoursPerDay: 0,
    averageOvertimePerDay: 0,
    attendanceRate: 0,
    punctualityRate: 0,
    warnings: [],
    errors: [],
  };

  // Soma todos os valores das semanas
  weeklyCalculations.forEach(weekly => {
    calculation.totalRegularMinutes += weekly.totalRegularMinutes;
    calculation.totalOvertimeMinutes += weekly.totalOvertimeMinutes;
    calculation.totalBreakMinutes += weekly.totalBreakMinutes;
    calculation.totalNightShiftMinutes += weekly.totalNightShiftMinutes;
    calculation.totalDelayMinutes += weekly.totalDelayMinutes;
    calculation.totalEarlyDepartureMinutes += weekly.totalEarlyDepartureMinutes;
    
    calculation.workDays += weekly.workDays;
    calculation.completeDays += weekly.completeDays;
    calculation.lateDays += weekly.lateDays;
    calculation.earlyDepartureDays += weekly.earlyDepartureDays;
    calculation.overtimeDays += weekly.overtimeDays;
    calculation.nightShiftDays += weekly.nightShiftDays;
  });

  // Calcula médias
  calculation.averageHoursPerDay = calculation.workDays > 0 
    ? (calculation.totalRegularMinutes + calculation.totalOvertimeMinutes) / (calculation.workDays * 60)
    : 0;
    
  calculation.averageOvertimePerDay = calculation.workDays > 0 
    ? calculation.totalOvertimeMinutes / (calculation.workDays * 60)
    : 0;

  // Calcula taxas
  calculation.attendanceRate = calculation.workDays > 0 
    ? (calculation.completeDays / calculation.workDays) * 100
    : 0;
    
  calculation.punctualityRate = calculation.completeDays > 0 
    ? ((calculation.completeDays - calculation.lateDays) / calculation.completeDays) * 100
    : 0;

  // Verifica se excedeu limite mensal (44h extras por mês é o limite legal)
  const monthlyOvertimeHours = calculation.totalOvertimeMinutes / 60;
  calculation.monthlyOvertimeExceeded = monthlyOvertimeHours > 44;
  
  if (calculation.monthlyOvertimeExceeded) {
    calculation.warnings.push(`Horas extras excedem limite mensal: ${Math.round(monthlyOvertimeHours)}h (máximo: 44h)`);
  }

  return calculation;
}

/**
 * Calcula minutos trabalhados em período noturno
 */
function calculateNightShiftMinutes(
  entryTime: Date,
  exitTime: Date,
  _config: WorkHoursConfig
): number {
  const [nightStartHour, nightStartMinute] = _config.nightShiftStart.split(':').map(Number);
  const [nightEndHour, nightEndMinute] = _config.nightShiftEnd.split(':').map(Number);
  
  let nightShiftMinutes = 0;
  const currentTime = new Date(entryTime);
  
  while (currentTime < exitTime) {
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();
    
    // Verifica se está no período noturno
    const isNightShift = (
      (hour > nightStartHour || (hour === nightStartHour && minute >= nightStartMinute)) ||
      (hour < nightEndHour || (hour === nightEndHour && minute < nightEndMinute))
    );
    
    if (isNightShift) {
      nightShiftMinutes++;
    }
    
    // Avança 1 minuto
    currentTime.setMinutes(currentTime.getMinutes() + 1);
  }
  
  return nightShiftMinutes;
}

/**
 * Formata minutos para exibição (ex: 125 -> "2h 5min")
 */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (hours === 0) {
    return `${remainingMinutes}min`;
  }
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
}

/**
 * Converte horas para minutos
 */
export function hoursToMinutes(hours: number): number {
  return hours * 60;
}

/**
 * Converte minutos para horas
 */
export function minutesToHours(minutes: number): number {
  return minutes / 60;
}

/**
 * Configurações para cálculo de salário
 */
export interface SalaryConfig {
  baseSalary: number; // Salário base mensal
  workHoursPerDay: number; // Horas de trabalho por dia (ex: 8)
  workDaysPerWeek: number; // Dias de trabalho por semana (ex: 5)
  workDaysPerMonth: number; // Dias de trabalho por mês (ex: 22)
  toleranceMinutes: number; // Tolerância para atrasos (ex: 15)
  discountPerAbsence: number; // Desconto por falta (ex: 1 dia de salário)
  discountPerLate: number; // Desconto por atraso (ex: 0.5 dia de salário)
  discountPerEarlyDeparture: number; // Desconto por saída antecipada (ex: 0.5 dia de salário)
  overtimeRate: number; // Taxa de horas extras (ex: 1.5)
  nightShiftRate: number; // Taxa de adicional noturno (ex: 1.2)
}

/**
 * Configurações padrão para cálculo de salário
 */
export const DEFAULT_SALARY_CONFIG: SalaryConfig = {
  baseSalary: 2000, // R$ 2.000,00
  workHoursPerDay: 8,
  workDaysPerWeek: 5,
  workDaysPerMonth: 22,
  toleranceMinutes: 15,
  discountPerAbsence: 1, // 1 dia de salário
  discountPerLate: 0.5, // 0.5 dia de salário
  discountPerEarlyDeparture: 0.5, // 0.5 dia de salário
  overtimeRate: 1.5, // 50% de adicional
  nightShiftRate: 1.2, // 20% de adicional
};

/**
 * Resultado do cálculo de salário proporcional
 */
export interface ProportionalSalaryCalculation {
  employeeId: string;
  period: string; // YYYY-MM
  baseSalary: number;
  proportionalSalary: number;
  totalWorkedHours: number;
  totalExpectedHours: number;
  attendanceRate: number; // Taxa de presença
  absences: number;
  lates: number;
  earlyDepartures: number;
  overtimeHours: number;
  nightShiftHours: number;
  overtimeValue: number;
  nightShiftValue: number;
  absencesDiscount: number;
  latesDiscount: number;
  earlyDeparturesDiscount: number;
  totalDiscounts: number;
  finalSalary: number;
  warnings: string[];
  errors: string[];
}

/**
 * Calcula salário proporcional baseado em horas trabalhadas
 */
export function calculateProportionalSalary(
  monthlyCalculation: MonthlyWorkHoursCalculation,
  salaryConfig: SalaryConfig = DEFAULT_SALARY_CONFIG
): ProportionalSalaryCalculation {
  const calculation: ProportionalSalaryCalculation = {
    employeeId: monthlyCalculation.employeeId,
    period: monthlyCalculation.month,
    baseSalary: salaryConfig.baseSalary,
    proportionalSalary: 0,
    totalWorkedHours: 0,
    totalExpectedHours: 0,
    attendanceRate: 0,
    absences: 0,
    lates: 0,
    earlyDepartures: 0,
    overtimeHours: 0,
    nightShiftHours: 0,
    overtimeValue: 0,
    nightShiftValue: 0,
    absencesDiscount: 0,
    latesDiscount: 0,
    earlyDeparturesDiscount: 0,
    totalDiscounts: 0,
    finalSalary: 0,
    warnings: [],
    errors: [],
  };

  // Calcula horas trabalhadas vs esperadas
  const totalWorkedMinutes = monthlyCalculation.totalRegularMinutes + monthlyCalculation.totalOvertimeMinutes;
  const totalExpectedMinutes = salaryConfig.workDaysPerMonth * salaryConfig.workHoursPerDay * 60;
  
  calculation.totalWorkedHours = minutesToHours(totalWorkedMinutes);
  calculation.totalExpectedHours = minutesToHours(totalExpectedMinutes);
  
  // Calcula salário proporcional
  const attendanceRate = totalWorkedMinutes / totalExpectedMinutes;
  calculation.attendanceRate = attendanceRate * 100;
  calculation.proportionalSalary = salaryConfig.baseSalary * attendanceRate;

  // Calcula faltas, atrasos e saídas antecipadas
  calculation.absences = salaryConfig.workDaysPerMonth - monthlyCalculation.workDays;
  calculation.lates = monthlyCalculation.lateDays;
  calculation.earlyDepartures = monthlyCalculation.earlyDepartureDays;
  calculation.overtimeHours = minutesToHours(monthlyCalculation.totalOvertimeMinutes);
  calculation.nightShiftHours = minutesToHours(monthlyCalculation.totalNightShiftMinutes);

  // Calcula valores de horas extras e adicional noturno
  const hourlyRate = salaryConfig.baseSalary / (salaryConfig.workDaysPerMonth * salaryConfig.workHoursPerDay);
  calculation.overtimeValue = calculation.overtimeHours * hourlyRate * (salaryConfig.overtimeRate - 1);
  calculation.nightShiftValue = calculation.nightShiftHours * hourlyRate * (salaryConfig.nightShiftRate - 1);

  // Calcula descontos
  calculation.absencesDiscount = calculation.absences * (salaryConfig.baseSalary / salaryConfig.workDaysPerMonth) * salaryConfig.discountPerAbsence;
  calculation.latesDiscount = calculation.lates * (salaryConfig.baseSalary / salaryConfig.workDaysPerMonth) * salaryConfig.discountPerLate;
  calculation.earlyDeparturesDiscount = calculation.earlyDepartures * (salaryConfig.baseSalary / salaryConfig.workDaysPerMonth) * salaryConfig.discountPerEarlyDeparture;
  
  calculation.totalDiscounts = calculation.absencesDiscount + calculation.latesDiscount + calculation.earlyDeparturesDiscount;

  // Calcula salário final
  calculation.finalSalary = calculation.proportionalSalary + calculation.overtimeValue + calculation.nightShiftValue - calculation.totalDiscounts;

  // Adiciona avisos
  if (calculation.absences > 0) {
    calculation.warnings.push(`${calculation.absences} faltas detectadas`);
  }
  if (calculation.lates > 0) {
    calculation.warnings.push(`${calculation.lates} atrasos detectados`);
  }
  if (calculation.earlyDepartures > 0) {
    calculation.warnings.push(`${calculation.earlyDepartures} saídas antecipadas detectadas`);
  }
  if (calculation.attendanceRate < 80) {
    calculation.warnings.push(`Taxa de presença baixa: ${calculation.attendanceRate.toFixed(1)}%`);
  }

  return calculation;
}

/**
 * Formata valor monetário para exibição
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Resultado do cálculo de banco de horas
 */
export interface WorkTimeBankCalculation {
  employeeId: string;
  period: string; // YYYY-MM
  totalCredits: number; // Minutos positivos (horas extras)
  totalDebits: number; // Minutos negativos (faltas, atrasos, saídas antecipadas)
  balance: number; // Saldo final em minutos
  credits: Array<{ date: string; minutes: number; reason: string }>;
  debits: Array<{ date: string; minutes: number; reason: string }>;
  warnings: string[];
  errors: string[];
}

/**
 * Calcula banco de horas para um mês
 */
export function calculateWorkTimeBank(
  monthlyCalculation: MonthlyWorkHoursCalculation
): WorkTimeBankCalculation {
  const credits: Array<{ date: string; minutes: number; reason: string }> = [];
  const debits: Array<{ date: string; minutes: number; reason: string }> = [];

  // Percorre todos os dias do mês
  monthlyCalculation.weeklyCalculations.forEach(week => {
    week.dailyCalculations.forEach(day => {
      // Horas extras (crédito)
      if (day.overtimeMinutes > 0) {
        credits.push({
          date: day.date,
          minutes: day.overtimeMinutes,
          reason: 'Horas Extras',
        });
      }
      // Atrasos (débito)
      if (day.delayMinutes > 0) {
        debits.push({
          date: day.date,
          minutes: day.delayMinutes,
          reason: 'Atraso',
        });
      }
      // Saída antecipada (débito)
      if (day.earlyDepartureMinutes > 0) {
        debits.push({
          date: day.date,
          minutes: day.earlyDepartureMinutes,
          reason: 'Saída Antecipada',
        });
      }
      // Falta (débito)
      if (!day.isComplete) {
        debits.push({
          date: day.date,
          minutes: 8 * 60, // Considera 8h como falta
          reason: 'Falta',
        });
      }
    });
  });

  const totalCredits = credits.reduce((sum, c) => sum + c.minutes, 0);
  const totalDebits = debits.reduce((sum, d) => sum + d.minutes, 0);
  const balance = totalCredits - totalDebits;

  const warnings: string[] = [];
  if (balance < 0) warnings.push('Saldo negativo no banco de horas');
  if (totalCredits > 40 * 60) warnings.push('Acúmulo de horas extras acima do permitido (40h)');

  return {
    employeeId: monthlyCalculation.employeeId,
    period: monthlyCalculation.month,
    totalCredits,
    totalDebits,
    balance,
    credits,
    debits,
    warnings,
    errors: [],
  };
}

/**
 * Formata saldo de banco de horas para exibição
 */
export function formatWorkTimeBank(minutes: number): string {
  const sign = minutes < 0 ? '-' : '';
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const mins = Math.round(abs % 60);
  if (hours === 0) return `${sign}${mins}min`;
  if (mins === 0) return `${sign}${hours}h`;
  return `${sign}${hours}h ${mins}min`;
} 