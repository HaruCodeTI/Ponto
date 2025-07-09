/* eslint-disable no-unreachable */
import { createHash } from 'crypto';
import { AFDExport, AFDMetadata, AFDRecord, AFDConfig, AFDValidationResult } from '@/types';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/prisma';

// Configuração padrão para a exportação AFD
const DEFAULT_AFD_CONFIG: AFDConfig = {
  enabled: true,
  version: '3.0',
  encoding: 'ISO-8859-1',
  includeHeaders: true,
  includeTrailers: true,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  retentionDays: 60,
  compliance: {
    requireValidation: true,
    validateChecksum: true,
    requireApproval: false
  },
  format: {
    dateFormat: 'DDMMYYYY',
    timeFormat: 'HHMM',
    separator: '|',
    lineEnding: '\r\n'
  }
};

/**
 * Gera e salva um arquivo de exportação no formato AFD.
 */
export async function generateAFDExport(
  companyId: string,
  startDate: Date,
  endDate: Date,
  employeeId?: string
): Promise<AFDExport> {
  const config = await getAFDConfig(companyId);
  if (!config.enabled) {
    throw new Error('Exportação AFD desabilitada');
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    throw new Error('Empresa não encontrada');
  }

  let employee: any | null = null;
  if (employeeId) {
    employee = await prisma.employee.findUnique({ where: { id: employeeId } }) as any | null;
    if (!employee) {
      throw new Error('Funcionário não encontrado');
    }
  }

  const timeRecords = await prisma.timeRecord.findMany({
    where: {
      companyId,
      employeeId: employeeId || undefined,
      timestamp: { gte: startDate, lte: endDate }
    },
    include: { employee: true },
    orderBy: { timestamp: 'asc' }
  });

  const afdRecords = await generateAFDRecords(timeRecords as any[], config);
  const afdContent = generateAFDContent(afdRecords, company as any, config);
  const checksum = calculateAFDChecksum(afdContent);
  const fileName = generateAFDFileName(company as any, startDate, endDate, employee);
  const filePath = await saveAFDFile(fileName, afdContent);
  const metadata = generateAFDMetadata(company as any, employee, startDate, endDate, timeRecords as any[], afdRecords, config);

  const afdExport = await prisma.aFDExport.create({
    data: {
      companyId,
      employeeId,
      startDate,
      endDate,
      fileName,
      filePath,
      fileSize: Buffer.byteLength(afdContent, 'utf8'),
      recordCount: afdRecords.length,
      status: 'COMPLETED',
      afdVersion: config.version,
      checksum,
      metadata: metadata as unknown as any,
      isComplianceRequired: true
    }
  });

  return afdExport as unknown as AFDExport;
}

/**
 * Busca exportações AFD com base em filtros e paginação.
 */
export async function findAFDExports(
  filters: {
    companyId?: string;
    employeeId?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string;
  },
  page = 1,
  limit = 50
): Promise<{ data: AFDExport[]; total: number; page: number; totalPages: number }> {
  const whereClause: any = {};
  
  if (filters.companyId) whereClause.companyId = filters.companyId;
  if (filters.employeeId) whereClause.employeeId = filters.employeeId;
  if (filters.startDate || filters.endDate) {
    whereClause.startDate = {};
    if (filters.startDate) whereClause.startDate.gte = filters.startDate;
    if (filters.endDate) whereClause.startDate.lte = filters.endDate;
  }
  if (filters.status) whereClause.status = filters.status;

  const [data, total] = await Promise.all([
    prisma.aFDExport.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.aFDExport.count({ where: whereClause })
  ]);

  return { data: data as unknown as AFDExport[], total, page, totalPages: Math.ceil(total / limit) };
}

/**
 * Coleta estatísticas sobre as exportações AFD.
 */
export async function getAFDStats(companyId?: string): Promise<{
  totalExports: number;
  completedExports: number;
  failedExports: number;
  totalRecords: number;
  lastExport: Date | null;
}> {
  const whereClause: any = companyId ? { companyId } : {};

  const [
    totalExports,
    completedExports,
    failedExports,
    lastExport,
    totalRecords
  ] = await Promise.all([
    prisma.aFDExport.count({ where: whereClause }),
    prisma.aFDExport.count({ where: { ...whereClause, status: 'COMPLETED' } }),
    prisma.aFDExport.count({ where: { ...whereClause, status: 'FAILED' } }),
    prisma.aFDExport.findFirst({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    }),
    prisma.aFDExport.aggregate({
      where: whereClause,
      _sum: { recordCount: true }
    })
  ]);

  return {
    totalExports,
    completedExports,
    failedExports,
    totalRecords: totalRecords._sum.recordCount || 0,
    lastExport: lastExport?.createdAt || null
  };
}

/**
 * Valida um arquivo AFD (simulação).
 */
export async function validateAFDFile(
  _filePath: string
): Promise<AFDValidationResult> {
  try {
    // TODO: Implementar validação completa do arquivo AFD
    return {
      isValid: true, errors: [], warnings: [], recordCount: 0, checksum: '',
      compliance: { isCompliant: true, violations: [] }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido na validação';
    return {
      isValid: false, errors: [message], warnings: [], recordCount: 0, checksum: '',
      compliance: { isCompliant: false, violations: ['Arquivo inválido'] }
    };
  }
}

type TimeRecordWithEmployee = any;

async function generateAFDRecords(
  timeRecords: TimeRecordWithEmployee[],
  config: AFDConfig
): Promise<AFDRecord[]> {
  const afdRecords: AFDRecord[] = [];
  let sequence = 1;

  for (const record of timeRecords) {
    afdRecords.push({
      type: getAFDRecordType(record.type),
      pis: record.employee?.pis || '00000000000',
      date: record.timestamp,
      time: formatAFDTime(record.timestamp, config),
      sequence: sequence,
      nsr: generateNSR(sequence++)
    });
  }

  return afdRecords;
}

function generateAFDContent(
  records: AFDRecord[],
  company: any,
  config: AFDConfig
): string {
  const lines: string[] = [];
  if (config.includeHeaders) lines.push(generateAFDHeader(company, config));
  lines.push(...records.map(record => generateAFDRecordLine(record, config)));
  if (config.includeTrailers) {
      const trailerContent = records.map(r => r.nsr).join('');
      lines.push(generateAFDTrailer(records, company, config, trailerContent));
  }
  return lines.join(config.format.lineEnding);
}

function generateAFDHeader(company: any, config: AFDConfig): string {
  const fields = [
    '1',
    (company.cnpj || '').replace(/\D/g, '').padStart(14, '0'),
    (company.cei || '').replace(/\D/g, '').padEnd(12, '0'),
    (company.name || '').padEnd(150, ' '),
    formatAFDDate(new Date(), config),
    formatAFDTime(new Date(), config),
    config.version
  ];
  return fields.join(config.format.separator);
}

function generateAFDRecordLine(record: AFDRecord, config: AFDConfig): string {
  const fields = [
    record.type,
    record.pis,
    formatAFDDate(record.date, config),
    record.time,
    record.nsr || '0'.repeat(9) // NSR deve ter 9 dígitos
  ];
  return fields.join(config.format.separator);
}

function generateAFDTrailer(
  records: AFDRecord[],
  company: any,
  config: AFDConfig,
  contentForChecksum: string
): string {
  const fields = [
    '9',
    (company.cnpj || '').replace(/\D/g, '').padStart(14, '0'),
    formatAFDDate(new Date(), config),
    formatAFDTime(new Date(), config),
    records.length.toString().padStart(9, '0'),
    calculateAFDChecksum(contentForChecksum)
  ];
  return fields.join(config.format.separator);
}

function getAFDRecordType(timeRecordType: string): '2' | '3' | '4' | '5' | '6' | '7' {
  switch (timeRecordType) {
    case 'CLOCK_IN': return '2';
    case 'CLOCK_OUT': return '3';
    case 'BREAK_START': return '4';
    case 'BREAK_END': return '5';
    case 'ADJUSTMENT': return '6';
    case 'VERIFICATION': return '7';
    default: return '2';
  }
}

function formatAFDDate(date: Date, _config: AFDConfig): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString();
  return `${day}${month}${year}`;
}

function formatAFDTime(date: Date, _config: AFDConfig): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}${minutes}`;
}

function generateNSR(sequence: number): string {
  return sequence.toString().padStart(9, '0');
}

function calculateAFDChecksum(content: string): string {
  return createHash('md5').update(content).digest('hex').substring(0, 16);
}

function generateAFDFileName(
  company: any,
  startDate: Date,
  endDate: Date,
  employee?: any | null
): string {
  const companyCode = (company.cnpj || '').replace(/\D/g, '').substring(0, 8);
  const startStr = formatAFDDate(startDate, DEFAULT_AFD_CONFIG);
  const endStr = formatAFDDate(endDate, DEFAULT_AFD_CONFIG);
  const employeeCode = employee ? `_${employee.registration}` : '';
  
  return `AFD_${companyCode}_${startStr}_${endStr}${employeeCode}.txt`;
}

async function saveAFDFile(fileName: string, content: string): Promise<string> {
  const uploadDir = join(process.cwd(), 'uploads', 'afd');
  await mkdir(uploadDir, { recursive: true });
  const filePath = join(uploadDir, fileName);
  await writeFile(filePath, content, { encoding: 'utf8' });
  return filePath;
}

function generateAFDMetadata(
  company: any,
  employee: any | null,
  startDate: Date,
  endDate: Date,
  _timeRecords: any[],
  afdRecords: AFDRecord[],
  config: AFDConfig
): AFDMetadata {
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const recordCounts = afdRecords.reduce((acc, record) => {
    acc.total++;
    if (record.type === '2') acc.clockIn++;
    else if (record.type === '3') acc.clockOut++;
    else if (record.type === '4') acc.breakStart++;
    else if (record.type === '5') acc.breakEnd++;
    else if (record.type === '6') acc.adjustments++;
    return acc;
  }, { total: 0, clockIn: 0, clockOut: 0, breakStart: 0, breakEnd: 0, adjustments: 0 });

  return {
    company: { id: company.id, name: company.name, cnpj: company.cnpj, cei: company.cei },
    employee: employee ? { id: employee.id, name: employee.name, pis: employee.pis || '', registration: employee.registration || '' } : undefined,
    period: { startDate, endDate, totalDays },
    records: recordCounts,
    compliance: { isCompliant: true, violations: [], warnings: [] },
    export: {
      version: config.version, format: 'AFD', encoding: config.encoding, generatedAt: new Date(),
      expiresAt: new Date(Date.now() + config.retentionDays * 24 * 60 * 60 * 1000)
    }
  };
}

async function getAFDConfig(_companyId?: string): Promise<AFDConfig> {
  // No futuro, a configuração pode ser carregada do banco de dados.
  return DEFAULT_AFD_CONFIG;
}