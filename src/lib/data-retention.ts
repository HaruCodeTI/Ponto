import { prisma } from './prisma';
import { RetentionPolicy, DataPurge, RetentionConfig } from '@/types';

const DEFAULT_RETENTION_CONFIG: RetentionConfig = {
  enabled: true,
  defaultRetentionDays: 1825, // 5 anos
  maxRetentionDays: 3650, // 10 anos
  autoPurge: true,
  purgeSchedule: 'WEEKLY',
  notificationOnPurge: true,
  requireApproval: false
};

export async function createRetentionPolicy(
  name: string,
  entityType: string,
  retentionPeriod: number,
  createdBy: string,
  companyId?: string,
  description?: string
): Promise<RetentionPolicy> {
  const config = await getRetentionConfig(companyId);
  if (!config.enabled) throw new Error('Retenção desabilitada');

  if (retentionPeriod > config.maxRetentionDays) {
    throw new Error(`Período de retenção não pode exceder ${config.maxRetentionDays} dias`);
  }

  return await prisma.retentionPolicy.create({
    data: {
      name,
      description,
      entityType,
      retentionPeriod,
      companyId,
      createdBy,
      isActive: true
    }
  });
}

export async function findRetentionPolicies(
  filters: {
    entityType?: string;
    companyId?: string;
    isActive?: boolean;
  },
  page = 1,
  limit = 50
): Promise<{ data: RetentionPolicy[]; total: number; page: number; totalPages: number }> {
  const whereClause: any = {};
  if (filters.entityType) whereClause.entityType = filters.entityType;
  if (filters.companyId) whereClause.companyId = filters.companyId;
  if (filters.isActive !== undefined) whereClause.isActive = filters.isActive;

  const [data, total] = await Promise.all([
    prisma.retentionPolicy.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.retentionPolicy.count({ where: whereClause })
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

export async function updateRetentionPolicy(
  id: string,
  updates: {
    name?: string;
    description?: string;
    retentionPeriod?: number;
    isActive?: boolean;
  }
): Promise<RetentionPolicy> {
  const config = await getRetentionConfig();
  if (updates.retentionPeriod && updates.retentionPeriod > config.maxRetentionDays) {
    throw new Error(`Período de retenção não pode exceder ${config.maxRetentionDays} dias`);
  }

  return await prisma.retentionPolicy.update({
    where: { id },
    data: updates
  });
}

export async function deleteRetentionPolicy(id: string): Promise<void> {
  await prisma.retentionPolicy.delete({ where: { id } });
}

export async function executeDataPurge(
  policyId: string,
  companyId?: string,
  executedBy?: string
): Promise<DataPurge> {
  const policy = await prisma.retentionPolicy.findUnique({ where: { id: policyId } });
  if (!policy) throw new Error('Política não encontrada');
  if (!policy.isActive) throw new Error('Política inativa');

  const config = await getRetentionConfig(companyId);
  if (!config.enabled) throw new Error('Expurgo desabilitado');

  const purge = await prisma.dataPurge.create({
    data: {
      policyId,
      entityType: policy.entityType,
      status: 'PENDING',
      companyId,
      executedBy,
      isComplianceRequired: true
    }
  });

  // Processa em background
  processPurge(purge.id).catch(console.error);

  return purge;
}

async function processPurge(purgeId: string): Promise<void> {
  try {
    const purge = await prisma.dataPurge.findUnique({ where: { id: purgeId } });
    if (!purge) return;

    const policy = await prisma.retentionPolicy.findUnique({ where: { id: purge.policyId } });
    if (!policy) return;

    await prisma.dataPurge.update({
      where: { id: purgeId },
      data: { status: 'IN_PROGRESS' }
    });

    const startTime = Date.now();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriod);

    // Simulação de expurgo (em produção, deletar registros reais)
    let recordsCount = 0;
    let purgedCount = 0;

    // Contar registros elegíveis para expurgo
    switch (policy.entityType) {
      case 'TimeRecord':
        recordsCount = await prisma.timeRecord.count({
          where: {
            timestamp: { lt: cutoffDate },
            ...(purge.companyId && { companyId: purge.companyId })
          }
        });
        break;
      case 'SystemLog':
        recordsCount = await prisma.systemLog.count({
          where: {
            timestamp: { lt: cutoffDate },
            ...(purge.companyId && { companyId: purge.companyId })
          }
        });
        break;
      case 'DataRedundancy':
        recordsCount = await prisma.dataRedundancy.count({
          where: {
            timestamp: { lt: cutoffDate },
            ...(purge.companyId && { companyId: purge.companyId })
          }
        });
        break;
      default:
        recordsCount = Math.floor(Math.random() * 1000);
    }

    // Simular expurgo
    await new Promise(resolve => setTimeout(resolve, 500));
    purgedCount = Math.floor(recordsCount * 0.9); // 90% de sucesso

    const duration = Date.now() - startTime;
    const status = purgedCount === recordsCount ? 'SUCCESS' : 
                   purgedCount > 0 ? 'PARTIAL' : 'FAILED';

    await prisma.dataPurge.update({
      where: { id: purgeId },
      data: {
        status,
        recordsCount,
        purgedCount,
        duration,
        updatedAt: new Date()
      }
    });

  } catch (error) {
    await prisma.dataPurge.update({
      where: { id: purgeId },
      data: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        updatedAt: new Date()
      }
    });
  }
}

export async function findDataPurges(
  filters: {
    policyId?: string;
    entityType?: string;
    status?: string;
    companyId?: string;
    startDate?: Date;
    endDate?: Date;
  },
  page = 1,
  limit = 50
): Promise<{ data: DataPurge[]; total: number; page: number; totalPages: number }> {
  const whereClause: any = {};
  if (filters.policyId) whereClause.policyId = filters.policyId;
  if (filters.entityType) whereClause.entityType = filters.entityType;
  if (filters.status) whereClause.status = filters.status;
  if (filters.companyId) whereClause.companyId = filters.companyId;
  if (filters.startDate || filters.endDate) {
    whereClause.timestamp = {};
    if (filters.startDate) whereClause.timestamp.gte = filters.startDate;
    if (filters.endDate) whereClause.timestamp.lte = filters.endDate;
  }

  const [data, total] = await Promise.all([
    prisma.dataPurge.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.dataPurge.count({ where: whereClause })
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

export async function getRetentionStats(_companyId?: string): Promise<{
  totalPolicies: number;
  activePolicies: number;
  totalPurges: number;
  successfulPurges: number;
  failedPurges: number;
  totalRecordsPurged: number;
  lastPurge: Date | null;
}> {
  const whereClause = companyId ? { companyId } : {};

  const [
    totalPolicies,
    activePolicies,
    totalPurges,
    successfulPurges,
    failedPurges,
    lastPurge
  ] = await Promise.all([
    prisma.retentionPolicy.count({ where: whereClause }),
    prisma.retentionPolicy.count({ where: { ...whereClause, isActive: true } }),
    prisma.dataPurge.count({ where: whereClause }),
    prisma.dataPurge.count({ where: { ...whereClause, status: 'SUCCESS' } }),
    prisma.dataPurge.count({ where: { ...whereClause, status: 'FAILED' } }),
    prisma.dataPurge.findFirst({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true }
    })
  ]);

  // Calcular total de registros expurgados
  const purges = await prisma.dataPurge.findMany({
    where: { ...whereClause, status: 'SUCCESS' },
    select: { purgedCount: true }
  });
  const totalRecordsPurged = purges.reduce((sum, purge) => sum + purge.purgedCount, 0);

  return {
    totalPolicies,
    activePolicies,
    totalPurges,
    successfulPurges,
    failedPurges,
    totalRecordsPurged,
    lastPurge: lastPurge?.timestamp || null
  };
}

async function getRetentionConfig(companyId?: string): Promise<RetentionConfig> {
  return DEFAULT_RETENTION_CONFIG;
} 