import { prisma } from './prisma';
import { createHash } from 'crypto';
import { AFDExport, AFDMetadata, AFDRecord, AFDConfig, AFDValidationResult } from '@/types';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

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

  // Buscar dados da empresa
  const company = await prisma.company.findUnique({
    where: { id: companyId }
  });

  if (!company) {
    throw new Error('Empresa não encontrada');
  }

  // Buscar dados do funcionário (se especificado)
  let employee = null;
  if (employeeId) {
    employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });
    if (!employee) {
      throw new Error('Funcionário não encontrado');
    }
  }

  // Buscar registros de ponto do período
  const timeRecords = await prisma.timeRecord.findMany({
    where: {
      companyId,
      employeeId: employeeId || undefined,
      timestamp: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      employee: true
    },
    orderBy: { timestamp: 'asc' }
  });

  // Gerar registros AFD
  const afdRecords = await generateAFDRecords(timeRecords, config);

  // Gerar conteúdo do arquivo AFD
  const afdContent = generateAFDContent(afdRecords, company, config);

  // Calcular checksum
  const checksum = calculateAFDChecksum(afdContent);

  // Gerar nome do arquivo
  const fileName = generateAFDFileName(company, startDate, endDate, employee);

  // Salvar arquivo
  const filePath = await saveAFDFile(fileName, afdContent);

  // Gerar metadados
  const metadata = generateAFDMetadata(
    company,
    employee,
    startDate,
    endDate,
    timeRecords,
    afdRecords,
    config
  );

  // Criar registro de exportação
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
      metadata,
      isComplianceRequired: true
    }
  });

  return afdExport;
}

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

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

export async function getAFDStats(companyId?: string): Promise<{
  totalExports: number;
  completedExports: number;
  failedExports: number;
  totalRecords: number;
  lastExport: Date | null;
}> {
  const whereClause = companyId ? { companyId } : {};

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

export async function validateAFDFile(
  _filePath: string
): Promise<AFDValidationResult> {
  try {
    // TODO: Implementar validação completa do arquivo AFD
    // Por enquanto, retorna validação básica
    return {
      isValid: true,
      errors: [],
      warnings: [],
      recordCount: 0,
      checksum: '',
      compliance: {
        isCompliant: true,
        violations: []
      }
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [error instanceof Error ? error.message : 'Erro na validação'],
      warnings: [],
      recordCount: 0,
      checksum: '',
      compliance: {
        isCompliant: false,
        violations: ['Arquivo inválido']
      }
    };
  }
}

async function generateAFDRecords(
  timeRecords: any[],
  config: AFDConfig
): Promise<AFDRecord[]> {
  const afdRecords: AFDRecord[] = [];
  let sequence = 1;

  for (const record of timeRecords) {
    const recordType = getAFDRecordType(record.type);
    const pis = record.employee?.pis || '00000000000';
    // const date = formatAFDDate(record.timestamp, config);
    const time = formatAFDTime(record.timestamp, config);

    afdRecords.push({
      type: recordType,
      pis,
      date: record.timestamp,
      time,
      sequence: sequence++,
      nsr: generateNSR(sequence)
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

  // Header (tipo 1)
  if (config.includeHeaders) {
    const header = generateAFDHeader(company, config);
    lines.push(header);
  }

  // Records (tipos 2-9)
  for (const record of records) {
    const line = generateAFDRecordLine(record, config);
    lines.push(line);
  }

  // Trailer (tipo 9)
  if (config.includeTrailers) {
    const trailer = generateAFDTrailer(records, company, config);
    lines.push(trailer);
  }

  return lines.join(config.format.lineEnding);
}

function generateAFDHeader(company: any, config: AFDConfig): string {
  const fields = [
    '1', // Tipo
    company.cnpj.replace(/\D/g, ''), // CNPJ
    company.cei?.replace(/\D/g, '') || '000000000000', // CEI
    company.name.padEnd(150, ' '), // Razão Social
    formatAFDDate(new Date(), config), // Data
    formatAFDTime(new Date(), config), // Hora
    config.version // Versão
  ];

  return fields.join(config.format.separator);
}

function generateAFDRecordLine(record: AFDRecord, config: AFDConfig): string {
  const fields = [
    record.type, // Tipo
    record.pis, // PIS
    formatAFDDate(record.date, config), // Data
    record.time, // Hora
    record.nsr || '000000000000000000' // NSR
  ];

  return fields.join(config.format.separator);
}

function generateAFDTrailer(
  records: AFDRecord[],
  company: any,
  config: AFDConfig
): string {
  const fields = [
    '9', // Tipo
    company.cnpj.replace(/\D/g, ''), // CNPJ
    formatAFDDate(new Date(), config), // Data
    formatAFDTime(new Date(), config), // Hora
    records.length.toString().padStart(9, '0'), // Total de registros
    calculateAFDChecksum(records.map(r => r.nsr).join('')) // Checksum
  ];

  return fields.join(config.format.separator);
}

function getAFDRecordType(timeRecordType: string): '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' {
  const typeMap: Record<string, '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'> = {
    'CLOCK_IN': '2',
    'CLOCK_OUT': '3',
    'BREAK_START': '4',
    'BREAK_END': '5',
    'ADJUSTMENT': '6',
    'VERIFICATION': '7'
  };
  return typeMap[timeRecordType] || '2';
}

function formatAFDDate(date: Date, _config: AFDConfig): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString();
  return day + month + year;
}

function formatAFDTime(date: Date, _config: AFDConfig): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return hours + minutes;
}

function generateNSR(sequence: number): string {
  return sequence.toString().padStart(18, '0');
}

function calculateAFDChecksum(content: string): string {
  return createHash('md5').update(content).digest('hex').substring(0, 16);
}

function generateAFDFileName(
  company: any,
  startDate: Date,
  endDate: Date,
  employee?: any
): string {
  const companyCode = company.cnpj.replace(/\D/g, '').substring(0, 8);
  const startStr = formatAFDDate(startDate, DEFAULT_AFD_CONFIG);
  const endStr = formatAFDDate(endDate, DEFAULT_AFD_CONFIG);
  const employeeCode = employee ? `_${employee.registration}` : '';
  
  return `AFD_${companyCode}_${startStr}_${endStr}${employeeCode}.txt`;
}

async function saveAFDFile(fileName: string, content: string): Promise<string> {
  const uploadDir = join(process.cwd(), 'uploads', 'afd');
  await mkdir(uploadDir, { recursive: true });
  
  const filePath = join(uploadDir, fileName);
  await writeFile(filePath, content, 'utf8');
  
  return filePath;
}

function generateAFDMetadata(
  company: any,
  employee: any,
  startDate: Date,
  endDate: Date,
  timeRecords: any[],
  afdRecords: AFDRecord[],
  config: AFDConfig
): AFDMetadata {
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const recordCounts = {
    total: afdRecords.length,
    clockIn: afdRecords.filter(r => r.type === '2').length,
    clockOut: afdRecords.filter(r => r.type === '3').length,
    breakStart: afdRecords.filter(r => r.type === '4').length,
    breakEnd: afdRecords.filter(r => r.type === '5').length,
    adjustments: afdRecords.filter(r => r.type === '6').length
  };

  return {
    company: {
      id: company.id,
      name: company.name,
      cnpj: company.cnpj,
      cei: company.cei
    },
    employee: employee ? {
      id: employee.id,
      name: employee.name,
      pis: employee.pis || '',
      registration: employee.registration || ''
    } : undefined,
    period: {
      startDate,
      endDate,
      totalDays
    },
    records: recordCounts,
    compliance: {
      isCompliant: true,
      violations: [],
      warnings: []
    },
    export: {
      version: config.version,
      format: 'AFD',
      encoding: config.encoding,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + config.retentionDays * 24 * 60 * 60 * 1000)
    }
  };
}

async function getAFDConfig(_companyId?: string): Promise<AFDConfig> {
  return DEFAULT_AFD_CONFIG;
} 