import { prisma } from './prisma';
import { TimeSheetMirror, MirrorData, DailyRecord, MirrorAdjustment, MirrorConfig } from '@/types';

const DEFAULT_MIRROR_CONFIG: MirrorConfig = {
  enabled: true,
  autoGenerate: true,
  requireApproval: false,
  includeWeekends: false,
  includeHolidays: false,
  workSchedule: {
    startTime: '08:00',
    endTime: '18:00',
    breakStart: '12:00',
    breakEnd: '13:00',
    toleranceMinutes: 15
  },
  overtime: {
    enabled: true,
    thresholdHours: 8,
    rate: 1.5
  },
  compliance: {
    minWorkHours: 6,
    maxWorkHours: 12,
    maxOvertimeHours: 4
  }
};

export async function generateTimeSheetMirror(
  employeeId: string,
  companyId: string,
  month: number,
  year: number
): Promise<TimeSheetMirror> {
  const config = await getMirrorConfig(companyId);
  if (!config.enabled) {
    throw new Error('Geração de espelho de ponto desabilitada');
  }

  // Verificar se já existe espelho para o período
  const existingMirror = await prisma.timeSheetMirror.findUnique({
    where: {
      employeeId_month_year: {
        employeeId,
        month,
        year
      }
    }
  });

  if (existingMirror) {
    throw new Error('Espelho de ponto já existe para este período');
  }

  // Buscar dados do funcionário
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId }
  });

  if (!employee) {
    throw new Error('Funcionário não encontrado');
  }

  // Buscar dados da empresa
  const company = await prisma.company.findUnique({
    where: { id: companyId }
  });

  if (!company) {
    throw new Error('Empresa não encontrada');
  }

  // Calcular período
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  // Buscar registros de ponto do período
  const timeRecords = await prisma.timeRecord.findMany({
    where: {
      employeeId,
      timestamp: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { timestamp: 'asc' }
  });

  // Gerar dados do espelho
  const mirrorData = await generateMirrorData(
    employee,
    company,
    month,
    year,
    timeRecords,
    config
  );

  // Buscar ajustes aplicados
  const adjustments = await getMirrorAdjustments(employeeId, month, year);

  // Calcular totais
  const totalWorkHours = mirrorData.summary.totalWorkHours;
  const totalBreakHours = mirrorData.summary.totalBreakHours;
  const totalOvertimeHours = mirrorData.summary.totalOvertimeHours;
  const totalAbsences = mirrorData.summary.totalAbsences;
  const totalDelays = mirrorData.summary.totalDelays;
  const workDays = mirrorData.summary.workDays;
  const totalDays = mirrorData.summary.totalDays;

  // Criar espelho no banco
  const mirror = await prisma.timeSheetMirror.create({
    data: {
      employeeId,
      companyId,
      month,
      year,
      status: config.requireApproval ? 'PENDING_APPROVAL' : 'GENERATED',
      totalWorkHours,
      totalBreakHours,
      totalOvertimeHours,
      totalAbsences,
      totalDelays,
      workDays,
      totalDays,
      mirrorData,
      adjustments: adjustments.length > 0 ? adjustments : undefined,
      isComplianceRequired: true
    }
  });

  return mirror;
}

export async function approveTimeSheetMirror(
  mirrorId: string,
  approvedBy: string,
  notes?: string
): Promise<TimeSheetMirror> {
  const mirror = await prisma.timeSheetMirror.findUnique({
    where: { id: mirrorId }
  });

  if (!mirror) {
    throw new Error('Espelho de ponto não encontrado');
  }

  if (mirror.status !== 'PENDING_APPROVAL') {
    throw new Error('Espelho não está pendente de aprovação');
  }

  const updatedMirror = await prisma.timeSheetMirror.update({
    where: { id: mirrorId },
    data: {
      status: 'APPROVED',
      approvedBy,
      approvedAt: new Date(),
      notes: notes || mirror.notes
    }
  });

  return updatedMirror;
}

export async function findTimeSheetMirrors(
  filters: {
    employeeId?: string;
    companyId?: string;
    month?: number;
    year?: number;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  },
  page = 1,
  limit = 50
): Promise<{ data: TimeSheetMirror[]; total: number; page: number; totalPages: number }> {
  const whereClause: any = {};
  
  if (filters.employeeId) whereClause.employeeId = filters.employeeId;
  if (filters.companyId) whereClause.companyId = filters.companyId;
  if (filters.month) whereClause.month = filters.month;
  if (filters.year) whereClause.year = filters.year;
  if (filters.status) whereClause.status = filters.status;
  if (filters.startDate || filters.endDate) {
    whereClause.createdAt = {};
    if (filters.startDate) whereClause.createdAt.gte = filters.startDate;
    if (filters.endDate) whereClause.createdAt.lte = filters.endDate;
  }

  const [data, total] = await Promise.all([
    prisma.timeSheetMirror.findMany({
      where: whereClause,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.timeSheetMirror.count({ where: whereClause })
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

export async function getMirrorStats(companyId?: string): Promise<{
  totalMirrors: number;
  approvedMirrors: number;
  pendingMirrors: number;
  mirrorsByStatus: Record<string, number>;
  lastMirror: Date | null;
}> {
  const whereClause = companyId ? { companyId } : {};

  const [
    totalMirrors,
    approvedMirrors,
    pendingMirrors,
    lastMirror,
    mirrorsByStatus
  ] = await Promise.all([
    prisma.timeSheetMirror.count({ where: whereClause }),
    prisma.timeSheetMirror.count({ where: { ...whereClause, status: 'APPROVED' } }),
    prisma.timeSheetMirror.count({ where: { ...whereClause, status: 'PENDING_APPROVAL' } }),
    prisma.timeSheetMirror.findFirst({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    }),
    prisma.timeSheetMirror.groupBy({
      by: ['status'],
      where: whereClause,
      _count: { status: true }
    })
  ]);

  // Converter para objeto
  const mirrorsByStatusObj: Record<string, number> = {};
  mirrorsByStatus.forEach(item => {
    mirrorsByStatusObj[item.status] = item._count.status;
  });

  return {
    totalMirrors,
    approvedMirrors,
    pendingMirrors,
    mirrorsByStatus: mirrorsByStatusObj,
    lastMirror: lastMirror?.createdAt || null
  };
}

async function generateMirrorData(
  employee: any,
  company: any,
  month: number,
  year: number,
  timeRecords: any[],
  config: MirrorConfig
): Promise<MirrorData> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  const totalDays = endDate.getDate();

  const dailyRecords: DailyRecord[] = [];
  let totalWorkHours = 0;
  let totalBreakHours = 0;
  let totalOvertimeHours = 0;
  let totalAbsences = 0;
  let totalDelays = 0;
  let workDays = 0;

  // Gerar registros diários
  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.toLocaleDateString('pt-BR', { weekday: 'long' });
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isHoliday = false; // TODO: Integrar com calendário de feriados
    const isWorkDay = !isWeekend && !isHoliday;

    // Buscar registros do dia
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayRecords = timeRecords.filter(record => 
      record.timestamp >= dayStart && record.timestamp <= dayEnd
    );

    // Processar registros do dia
    const records = {
      clockIn: dayRecords.find(r => r.type === 'CLOCK_IN')?.timestamp,
      breakStart: dayRecords.find(r => r.type === 'BREAK_START')?.timestamp,
      breakEnd: dayRecords.find(r => r.type === 'BREAK_END')?.timestamp,
      clockOut: dayRecords.find(r => r.type === 'CLOCK_OUT')?.timestamp
    };

    // Calcular horas
    const workHours = calculateWorkHours(records, config);
    const breakHours = calculateBreakHours(records, config);
    const overtimeHours = calculateOvertimeHours(workHours, config);

    // Verificar ausência e atraso
    const isAbsent = isWorkDay && !records.clockIn;
    const isDelayed = isWorkDay && records.clockIn && isDelayed(records.clockIn, config);
    const delayMinutes = isDelayed ? calculateDelayMinutes(records.clockIn!, config) : 0;

    if (isWorkDay) {
      if (!isAbsent) workDays++;
      if (isAbsent) totalAbsences++;
      if (isDelayed) totalDelays++;
    }

    totalWorkHours += workHours;
    totalBreakHours += breakHours;
    totalOvertimeHours += overtimeHours;

    dailyRecords.push({
      date,
      dayOfWeek,
      isWorkDay,
      isHoliday,
      isWeekend,
      records,
      workHours,
      breakHours,
      overtimeHours,
      isAbsent,
      isDelayed,
      delayMinutes
    });
  }

  // Calcular médias
  const averageWorkHours = workDays > 0 ? totalWorkHours / workDays : 0;
  const averageBreakHours = workDays > 0 ? totalBreakHours / workDays : 0;

  // Verificar compliance
  const compliance = checkCompliance(
    totalWorkHours,
    totalOvertimeHours,
    totalAbsences,
    config
  );

  return {
    employee: {
      id: employee.id,
      name: employee.name || 'Nome não informado',
      registration: employee.registration || '',
      department: employee.department || undefined,
      position: employee.position || undefined
    },
    company: {
      id: company.id,
      name: company.name,
      cnpj: company.cnpj
    },
    period: {
      month,
      year,
      startDate,
      endDate
    },
    dailyRecords,
    summary: {
      totalWorkHours,
      totalBreakHours,
      totalOvertimeHours,
      totalAbsences,
      totalDelays,
      workDays,
      totalDays,
      averageWorkHours,
      averageBreakHours
    },
    compliance
  };
}

function calculateWorkHours(records: any, config: MirrorConfig): number {
  if (!records.clockIn || !records.clockOut) return 0;

  const start = new Date(records.clockIn);
  const end = new Date(records.clockOut);
  const totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

  // Subtrair intervalo
  let breakMinutes = 0;
  if (records.breakStart && records.breakEnd) {
    const breakStart = new Date(records.breakStart);
    const breakEnd = new Date(records.breakEnd);
    breakMinutes = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60);
  }

  return Math.max(0, (totalMinutes - breakMinutes) / 60);
}

function calculateBreakHours(records: any, config: MirrorConfig): number {
  if (!records.breakStart || !records.breakEnd) return 0;

  const start = new Date(records.breakStart);
  const end = new Date(records.breakEnd);
  const minutes = (end.getTime() - start.getTime()) / (1000 * 60);

  return minutes / 60;
}

function calculateOvertimeHours(workHours: number, config: MirrorConfig): number {
  if (!config.overtime.enabled) return 0;
  return Math.max(0, workHours - config.overtime.thresholdHours);
}

function isDelayed(clockIn: Date, config: MirrorConfig): boolean {
  const [hours, minutes] = config.workSchedule.startTime.split(':').map(Number);
  const expectedTime = new Date(clockIn);
  expectedTime.setHours(hours, minutes, 0, 0);

  const toleranceMs = config.workSchedule.toleranceMinutes * 60 * 1000;
  return clockIn.getTime() > expectedTime.getTime() + toleranceMs;
}

function calculateDelayMinutes(clockIn: Date, config: MirrorConfig): number {
  const [hours, minutes] = config.workSchedule.startTime.split(':').map(Number);
  const expectedTime = new Date(clockIn);
  expectedTime.setHours(hours, minutes, 0, 0);

  const delayMs = clockIn.getTime() - expectedTime.getTime();
  return Math.max(0, delayMs / (1000 * 60));
}

function checkCompliance(
  totalWorkHours: number,
  totalOvertimeHours: number,
  totalAbsences: number,
  config: MirrorConfig
): { isCompliant: boolean; violations: string[]; warnings: string[] } {
  const violations: string[] = [];
  const warnings: string[] = [];

  if (totalWorkHours < config.compliance.minWorkHours) {
    violations.push(`Horas trabalhadas abaixo do mínimo (${config.compliance.minWorkHours}h)`);
  }

  if (totalWorkHours > config.compliance.maxWorkHours) {
    violations.push(`Horas trabalhadas acima do máximo (${config.compliance.maxWorkHours}h)`);
  }

  if (totalOvertimeHours > config.compliance.maxOvertimeHours) {
    violations.push(`Horas extras acima do limite (${config.compliance.maxOvertimeHours}h)`);
  }

  if (totalAbsences > 5) {
    warnings.push('Número elevado de faltas no período');
  }

  return {
    isCompliant: violations.length === 0,
    violations,
    warnings
  };
}

async function getMirrorAdjustments(employeeId: string, month: number, year: number): Promise<MirrorAdjustment[]> {
  // TODO: Implementar busca de ajustes aplicados ao espelho
  return [];
}

async function getMirrorConfig(companyId?: string): Promise<MirrorConfig> {
  return DEFAULT_MIRROR_CONFIG;
} 