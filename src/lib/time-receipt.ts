import { prisma } from './prisma';
import { createHash } from 'crypto';
import { TimeRecordReceipt, ReceiptData, ReceiptConfig } from '@/types';

const DEFAULT_RECEIPT_CONFIG: ReceiptConfig = {
  enabled: true,
  includeQrCode: true,
  includeLocation: true,
  includeDeviceInfo: true,
  validityHours: 24,
  verificationUrl: 'https://ponto.empresa.com/verificar',
  template: 'COMPLIANCE'
};

export async function generateTimeReceipt(
  _timeRecordId: string,
  _employeeId: string,
  _companyId: string,
  receiptType: 'CLOCK_IN' | 'CLOCK_OUT' | 'BREAK_START' | 'BREAK_END' | 'ADJUSTMENT' | 'VERIFICATION'
): Promise<TimeRecordReceipt> {
  const config = await getReceiptConfig();
  if (!config.enabled) {
    throw new Error('Geração de comprovantes desabilitada');
  }

  // Buscar dados do registro de ponto
  const timeRecord = await prisma.timeRecord.findUnique({
    where: { id: _timeRecordId },
    include: {
      employee: true,
      company: true
    }
  });

  if (!timeRecord) {
    throw new Error('Registro de ponto não encontrado');
  }

  // Buscar dados do funcionário
  const employee = await prisma.employee.findUnique({
    where: { id: _employeeId }
  });

  if (!employee) {
    throw new Error('Funcionário não encontrado');
  }

  // Buscar dados da empresa
  const company = await prisma.company.findUnique({
    where: { id: _companyId }
  });

  if (!company) {
    throw new Error('Empresa não encontrada');
  }

  // Gerar dados do comprovante
  const receiptData: ReceiptData = {
    employee: {
      id: employee.id,
      name: employee.name,
      registration: employee.registration || '',
      department: employee.department || undefined,
      position: employee.position || undefined
    },
    company: {
      id: company.id,
      name: company.name,
      cnpj: company.cnpj,
      address: company.address || undefined
    },
    timeRecord: {
      id: timeRecord.id,
      timestamp: timeRecord.timestamp,
      type: timeRecord.type,
      location: config.includeLocation && timeRecord.latitude && timeRecord.longitude ? {
        latitude: timeRecord.latitude,
        longitude: timeRecord.longitude,
        address: timeRecord.location || undefined
      } : undefined,
      device: config.includeDeviceInfo && timeRecord.deviceId ? {
        id: timeRecord.deviceId,
        type: timeRecord.deviceType || 'UNKNOWN',
        identifier: timeRecord.deviceIdentifier || ''
      } : undefined
    },
    receipt: {
      id: `receipt-${Date.now()}`,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + config.validityHours * 60 * 60 * 1000),
      verificationUrl: config.verificationUrl
    }
  };

  // Gerar hash para verificação de integridade
  const hash = generateReceiptHash(receiptData);

  // Gerar código QR (simulação)
  const qrCode = config.includeQrCode ? generateQrCode(receiptData, hash) : undefined;

  // Criar comprovante no banco
  const receipt = await prisma.timeRecordReceipt.create({
    data: {
      timeRecordId: _timeRecordId,
      employeeId: _employeeId,
      companyId: _companyId,
      receiptType,
      receiptData,
      hash,
      qrCode,
      isComplianceRequired: true
    }
  });

  return receipt;
}

export async function verifyTimeReceipt(
  receiptId: string,
  verifiedBy: string
): Promise<TimeRecordReceipt> {
  const receipt = await prisma.timeRecordReceipt.findUnique({
    where: { id: receiptId }
  });

  if (!receipt) {
    throw new Error('Comprovante não encontrado');
  }

  if (receipt.isVerified) {
    throw new Error('Comprovante já foi verificado');
  }

  // Verificar se não expirou
  const receiptData = receipt.receiptData as ReceiptData;
  if (new Date() > receiptData.receipt.expiresAt) {
    throw new Error('Comprovante expirado');
  }

  // Verificar integridade
  const expectedHash = generateReceiptHash(receiptData);
  if (receipt.hash !== expectedHash) {
    throw new Error('Comprovante corrompido');
  }

  // Marcar como verificado
  const updatedReceipt = await prisma.timeRecordReceipt.update({
    where: { id: receiptId },
    data: {
      isVerified: true,
      verifiedAt: new Date(),
      verifiedBy
    }
  });

  return updatedReceipt;
}

export async function findTimeReceipts(
  filters: {
    timeRecordId?: string;
    employeeId?: string;
    companyId?: string;
    receiptType?: string;
    isVerified?: boolean;
    startDate?: Date;
    endDate?: Date;
  },
  page = 1,
  limit = 50
): Promise<{ data: TimeRecordReceipt[]; total: number; page: number; totalPages: number }> {
  const whereClause: any = {};
  
  if (filters.timeRecordId) whereClause.timeRecordId = filters.timeRecordId;
  if (filters.employeeId) whereClause.employeeId = filters.employeeId;
  if (filters.companyId) whereClause.companyId = filters.companyId;
  if (filters.receiptType) whereClause.receiptType = filters.receiptType;
  if (filters.isVerified !== undefined) whereClause.isVerified = filters.isVerified;
  if (filters.startDate || filters.endDate) {
    whereClause.timestamp = {};
    if (filters.startDate) whereClause.timestamp.gte = filters.startDate;
    if (filters.endDate) whereClause.timestamp.lte = filters.endDate;
  }

  const [data, total] = await Promise.all([
    prisma.timeRecordReceipt.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.timeRecordReceipt.count({ where: whereClause })
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

export async function getReceiptStats(companyId?: string): Promise<{
  totalReceipts: number;
  verifiedReceipts: number;
  expiredReceipts: number;
  receiptsByType: Record<string, number>;
  lastReceipt: Date | null;
}> {
  const whereClause = companyId ? { companyId } : {};

  const [
    totalReceipts,
    verifiedReceipts,
    lastReceipt,
    receiptsByType
  ] = await Promise.all([
    prisma.timeRecordReceipt.count({ where: whereClause }),
    prisma.timeRecordReceipt.count({ where: { ...whereClause, isVerified: true } }),
    prisma.timeRecordReceipt.findFirst({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true }
    }),
    prisma.timeRecordReceipt.groupBy({
      by: ['receiptType'],
      where: whereClause,
      _count: { receiptType: true }
    })
  ]);

  // Calcular expirados
  const now = new Date();
  const expiredReceipts = await prisma.timeRecordReceipt.count({
    where: {
      ...whereClause,
      receiptData: {
        path: ['receipt', 'expiresAt'],
        lt: now
      }
    }
  });

  // Converter para objeto
  const receiptsByTypeObj: Record<string, number> = {};
  receiptsByType.forEach(item => {
    receiptsByTypeObj[item.receiptType] = item._count.receiptType;
  });

  return {
    totalReceipts,
    verifiedReceipts,
    expiredReceipts,
    receiptsByType: receiptsByTypeObj,
    lastReceipt: lastReceipt?.timestamp || null
  };
}

function generateReceiptHash(receiptData: ReceiptData): string {
  const dataString = JSON.stringify({
    employee: receiptData.employee,
    company: receiptData.company,
    timeRecord: {
      id: receiptData.timeRecord.id,
      timestamp: receiptData.timeRecord.timestamp,
      type: receiptData.timeRecord.type
    },
    receipt: {
      id: receiptData.receipt.id,
      generatedAt: receiptData.receipt.generatedAt
    }
  });
  
  return createHash('sha256').update(dataString).digest('hex');
}

function generateQrCode(receiptData: ReceiptData, hash: string): string {
  // Simulação de geração de QR Code
  // Em produção, usar biblioteca como qrcode
  const qrData = {
    receiptId: receiptData.receipt.id,
    hash,
    verificationUrl: receiptData.receipt.verificationUrl,
    timestamp: receiptData.receipt.generatedAt
  };
  
  return Buffer.from(JSON.stringify(qrData)).toString('base64');
}

async function getReceiptConfig(companyId?: string): Promise<ReceiptConfig> {
  return DEFAULT_RECEIPT_CONFIG;
} 