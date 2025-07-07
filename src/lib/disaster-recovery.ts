import { prisma } from './prisma';
import { RestoreOperation, RestoreConfig } from '@/types';

const DEFAULT_RESTORE_CONFIG: RestoreConfig = {
  enabled: true,
  allowedEntityTypes: [
    'TimeRecord',
    'SystemLog',
    'DataRedundancy',
    'Employee',
    'Company',
    'User'
  ],
  maxRestoreRangeDays: 90,
  requireApproval: true,
  notificationOnRestore: true,
  retentionPeriod: 1825
};

export async function startRestore(
  backupId: string,
  entityTypes: string[],
  companyId?: string,
  userId?: string,
  dateRange?: { startDate: Date; endDate: Date }
): Promise<RestoreOperation> {
  const config = await getRestoreConfig(companyId);
  if (!config.enabled) throw new Error('Restauração desabilitada');

  // Busca o backup
  const backup = await prisma.backupOperation.findUnique({ where: { id: backupId } });
  if (!backup) throw new Error('Backup não encontrado');

  // Cria registro de restauração
  const restore = await prisma.restoreOperation.create({
    data: {
      status: 'PENDING',
      backupId,
      entityTypes,
      dateRange,
      fileName: backup.fileName,
      fileHash: backup.fileHash,
      companyId,
      userId,
      isComplianceRequired: true
    }
  });

  // Processa em background
  processRestore(restore.id).catch(console.error);

  return restore;
}

async function processRestore(restoreId: string): Promise<void> {
  try {
    const restore = await prisma.restoreOperation.findUnique({ where: { id: restoreId } });
    if (!restore) return;

    await prisma.restoreOperation.update({
      where: { id: restoreId },
      data: { status: 'IN_PROGRESS' }
    });

    // Simulação de restauração (em produção, restaurar dados reais)
    await new Promise(resolve => setTimeout(resolve, 1000));
    const restoredCount = Math.floor(Math.random() * 100) + 1;

    await prisma.restoreOperation.update({
      where: { id: restoreId },
      data: {
        status: 'SUCCESS',
        restoredCount,
        duration: 1000,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    await prisma.restoreOperation.update({
      where: { id: restoreId },
      data: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        updatedAt: new Date()
      }
    });
  }
}

export async function findRestoreOperations(
  filters: {
    status?: string;
    companyId?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  },
  page = 1,
  limit = 50
): Promise<{ data: RestoreOperation[]; total: number; page: number; totalPages: number }> {
  const whereClause: any = {};
  if (filters.status) whereClause.status = filters.status;
  if (filters.companyId) whereClause.companyId = filters.companyId;
  if (filters.userId) whereClause.userId = filters.userId;
  if (filters.startDate || filters.endDate) {
    whereClause.timestamp = {};
    if (filters.startDate) whereClause.timestamp.gte = filters.startDate;
    if (filters.endDate) whereClause.timestamp.lte = filters.endDate;
  }

  const [data, total] = await Promise.all([
    prisma.restoreOperation.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.restoreOperation.count({ where: whereClause })
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

export async function getRestoreConfig(companyId?: string): Promise<RestoreConfig> {
  return DEFAULT_RESTORE_CONFIG;
} 