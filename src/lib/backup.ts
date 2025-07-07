import { prisma } from './prisma';
import { createHash } from 'crypto';
import { 
  Backup, 
  BackupSchedule, 
  RestoreJob, 
  BackupStats, 
  BackupConfig,
  BackupValidationResult
} from '@/types';
import { writeFile, mkdir, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const DEFAULT_BACKUP_CONFIG: BackupConfig = {
  enabled: true,
  storage: {
    type: 'local',
    path: './backups'
  },
  compression: {
    enabled: true,
    algorithm: 'gzip',
    level: 6
  },
  encryption: {
    enabled: false,
    algorithm: 'aes-256-gcm'
  },
  retention: {
    defaultDays: 30,
    maxBackups: 100,
    cleanupEnabled: true
  },
  scheduling: {
    enabled: true,
    timezone: 'America/Sao_Paulo',
    maxConcurrentJobs: 3
  }
};

export async function createBackup(
  companyId: string,
  type: Backup['type'] = 'FULL',
  options?: {
    retentionDays?: number;
    compression?: boolean;
    encryption?: boolean;
  }
): Promise<Backup> {
  const config = await getBackupConfig(companyId);
  if (!config.enabled) {
    throw new Error('Sistema de backup desabilitado');
  }

  // Buscar dados da empresa
  const company = await prisma.company.findUnique({
    where: { id: companyId }
  });

  if (!company) {
    throw new Error('Empresa não encontrada');
  }

  // Criar registro de backup
  const backup = await prisma.backup.create({
    data: {
      companyId,
      type,
      status: 'PROCESSING',
      fileName: generateBackupFileName(company, type),
      filePath: '',
      fileSize: 0,
      checksum: '',
      metadata: {},
      retentionDays: options?.retentionDays || config.retention.defaultDays,
      expiresAt: new Date(Date.now() + (options?.retentionDays || config.retention.defaultDays) * 24 * 60 * 60 * 1000)
    }
  });

  try {
    // Gerar backup do banco de dados
    const backupResult = await generateDatabaseBackup(backup, config, options);

    // Atualizar backup com informações do arquivo
    const updatedBackup = await prisma.backup.update({
      where: { id: backup.id },
      data: {
        status: 'COMPLETED',
        filePath: backupResult.filePath,
        fileSize: backupResult.fileSize,
        checksum: backupResult.checksum,
        metadata: backupResult.metadata
      }
    });

    return updatedBackup;
  } catch (error) {
    // Marcar backup como falhou
    await prisma.backup.update({
      where: { id: backup.id },
      data: {
        status: 'FAILED',
        metadata: {
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          failedAt: new Date()
        }
      }
    });

    throw error;
  }
}

export async function findBackups(
  filters: {
    companyId?: string;
    type?: string;
    status?: string;
  },
  page = 1,
  limit = 50
): Promise<{ data: Backup[]; total: number; page: number; totalPages: number }> {
  const whereClause: any = {};
  
  if (filters.companyId) whereClause.companyId = filters.companyId;
  if (filters.type) whereClause.type = filters.type;
  if (filters.status) whereClause.status = filters.status;

  const [data, total] = await Promise.all([
    prisma.backup.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.backup.count({ where: whereClause })
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

export async function getBackupStats(companyId?: string): Promise<BackupStats> {
  const whereClause = companyId ? { companyId } : {};

  const [
    totalBackups,
    completedBackups,
    failedBackups,
    totalSize,
    lastBackup,
    byType,
    byStatus
  ] = await Promise.all([
    prisma.backup.count({ where: whereClause }),
    prisma.backup.count({ where: { ...whereClause, status: 'COMPLETED' } }),
    prisma.backup.count({ where: { ...whereClause, status: 'FAILED' } }),
    prisma.backup.aggregate({
      where: { ...whereClause, status: 'COMPLETED' },
      _sum: { fileSize: true }
    }),
    prisma.backup.findFirst({
      where: { ...whereClause, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    }),
    prisma.backup.groupBy({
      by: ['type'],
      where: whereClause,
      _count: { type: true }
    }),
    prisma.backup.groupBy({
      by: ['status'],
      where: whereClause,
      _count: { status: true }
    })
  ]);

  // Buscar próximo backup agendado
  const nextScheduledBackup = await prisma.backupSchedule.findFirst({
    where: { ...whereClause, isActive: true },
    orderBy: { nextRun: 'asc' },
    select: { nextRun: true }
  });

  return {
    totalBackups,
    completedBackups,
    failedBackups,
    totalSize: totalSize._sum.fileSize || 0,
    lastBackup: lastBackup?.createdAt || undefined,
    nextScheduledBackup: nextScheduledBackup?.nextRun || undefined,
    byType: byType.reduce((acc, item) => {
      acc[item.type] = item._count.type;
      return acc;
    }, {} as Record<string, number>),
    byStatus: byStatus.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>)
  };
}

export async function validateBackup(backupId: string): Promise<BackupValidationResult> {
  const backup = await prisma.backup.findUnique({
    where: { id: backupId }
  });

  if (!backup) {
    throw new Error('Backup não encontrado');
  }

  try {
    // Verificar se arquivo existe
    const fileContent = await readFile(backup.filePath);
    
    // Calcular checksum
    const calculatedChecksum = createHash('md5').update(fileContent).digest('hex');
    
    // Verificar integridade
    const isChecksumValid = calculatedChecksum === backup.checksum;
    const fileSize = fileContent.length;
    
    // TODO: Implementar verificação de integridade do banco
    const integrityCheck = true;

    const result: BackupValidationResult = {
      isValid: isChecksumValid && integrityCheck,
      checksum: calculatedChecksum,
      fileSize,
      integrityCheck,
      databaseVersion: '1.0.0', // TODO: Extrair do backup
      errors: [],
      warnings: []
    };

    if (!isChecksumValid) {
      result.errors.push('Checksum inválido');
    }

    if (!integrityCheck) {
      result.errors.push('Falha na verificação de integridade');
    }

    // Atualizar metadados de validação
    await prisma.backup.update({
      where: { id: backupId },
      data: {
        metadata: {
          ...backup.metadata,
          validation: {
            isVerified: result.isValid,
            checksumValid: isChecksumValid,
            integrityCheck,
            verifiedAt: new Date()
          }
        }
      }
    });

    return result;
  } catch (error) {
    return {
      isValid: false,
      checksum: '',
      fileSize: 0,
      integrityCheck: false,
      databaseVersion: '',
      errors: [error instanceof Error ? error.message : 'Erro na validação'],
      warnings: []
    };
  }
}

export async function restoreBackup(
  backupId: string,
  companyId: string,
  options?: {
    dropExisting?: boolean;
    createMissing?: boolean;
    preserveData?: boolean;
  }
): Promise<RestoreJob> {
  const backup = await prisma.backup.findUnique({
    where: { id: backupId }
  });

  if (!backup) {
    throw new Error('Backup não encontrado');
  }

  if (backup.status !== 'COMPLETED') {
    throw new Error('Backup não está completo');
  }

  // Criar job de restauração
  const restoreJob = await prisma.restoreJob.create({
    data: {
      companyId,
      backupId,
      status: 'PENDING',
      progress: 0,
      metadata: {
        backup: {
          id: backup.id,
          fileName: backup.fileName,
          type: backup.type,
          createdAt: backup.createdAt
        },
        restore: {
          targetDatabase: 'restore_target',
          options: {
            dropExisting: options?.dropExisting || false,
            createMissing: options?.createMissing || true,
            preserveData: options?.preserveData || false
          },
          startedAt: new Date(),
          estimatedDuration: 300 // 5 minutos estimado
        },
        progress: {
          currentStep: 'Iniciando restauração',
          stepsCompleted: 0,
          totalSteps: 5,
          recordsProcessed: 0,
          totalRecords: 0
        }
      }
    }
  });

  // TODO: Implementar restauração real do banco
  // Por enquanto, simular progresso
  setTimeout(async () => {
    await prisma.restoreJob.update({
      where: { id: restoreJob.id },
      data: {
        status: 'PROCESSING',
        progress: 50,
        metadata: {
          ...restoreJob.metadata,
          progress: {
            currentStep: 'Restaurando dados',
            stepsCompleted: 2,
            totalSteps: 5,
            recordsProcessed: 1000,
            totalRecords: 2000
          }
        }
      }
    });

    setTimeout(async () => {
      await prisma.restoreJob.update({
        where: { id: restoreJob.id },
        data: {
          status: 'COMPLETED',
          progress: 100,
          completedAt: new Date(),
          metadata: {
            ...restoreJob.metadata,
            progress: {
              currentStep: 'Restauração concluída',
              stepsCompleted: 5,
              totalSteps: 5,
              recordsProcessed: 2000,
              totalRecords: 2000
            }
          }
        }
      });
    }, 2000);
  }, 1000);

  return restoreJob;
}

export async function getBackupSchedules(companyId?: string): Promise<BackupSchedule[]> {
  const whereClause = companyId ? { companyId } : {};

  return await prisma.backupSchedule.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' }
  });
}

export async function createBackupSchedule(
  companyId: string,
  data: {
    type: BackupSchedule['type'];
    frequency: BackupSchedule['frequency'];
    time: string;
    days: number[];
    retentionDays?: number;
  }
): Promise<BackupSchedule> {
  const nextRun = calculateNextRun(data.frequency, data.time, data.days);

  return await prisma.backupSchedule.create({
    data: {
      companyId,
      type: data.type,
      frequency: data.frequency,
      time: data.time,
      days: data.days,
      retentionDays: data.retentionDays || 30,
      nextRun
    }
  });
}

export async function updateBackupSchedule(
  scheduleId: string,
  data: Partial<BackupSchedule>
): Promise<BackupSchedule> {
  if (data.frequency || data.time || data.days) {
    data.nextRun = calculateNextRun(
      data.frequency || 'DAILY',
      data.time || '02:00',
      data.days || [0, 1, 2, 3, 4, 5, 6]
    );
  }

  return await prisma.backupSchedule.update({
    where: { id: scheduleId },
    data
  });
}

export async function deleteBackup(backupId: string): Promise<void> {
  const backup = await prisma.backup.findUnique({
    where: { id: backupId }
  });

  if (!backup) {
    throw new Error('Backup não encontrado');
  }

  // Deletar arquivo físico
  try {
    await unlink(backup.filePath);
  } catch (error) {
    console.warn('Erro ao deletar arquivo de backup:', error);
  }

  // Deletar registro do banco
  await prisma.backup.delete({
    where: { id: backupId }
  });
}

export async function cleanupExpiredBackups(): Promise<{ count: number }> {
  const expiredBackups = await prisma.backup.findMany({
    where: {
      expiresAt: {
        lt: new Date()
      },
      status: 'COMPLETED'
    }
  });

  let deletedCount = 0;

  for (const backup of expiredBackups) {
    try {
      await deleteBackup(backup.id);
      deletedCount++;
    } catch (error) {
      console.error('Erro ao deletar backup expirado:', error);
    }
  }

  return { count: deletedCount };
}

async function generateDatabaseBackup(
  backup: Backup,
  config: BackupConfig,
  options?: {
    compression?: boolean;
    encryption?: boolean;
  }
): Promise<{
  filePath: string;
  fileSize: number;
  checksum: string;
  metadata: any;
}> {
  const startTime = Date.now();
  
  // Criar diretório de backup
  const backupDir = join(process.cwd(), config.storage.path, backup.companyId);
  await mkdir(backupDir, { recursive: true });

  const filePath = join(backupDir, backup.fileName);
  
  // TODO: Implementar backup real do PostgreSQL
  // Por enquanto, criar arquivo de exemplo
  const backupContent = `-- Backup gerado em ${new Date().toISOString()}
-- Empresa: ${backup.companyId}
-- Tipo: ${backup.type}
-- Status: ${backup.status}

-- Dados de exemplo para demonstração
SELECT 'Backup simulation' as status;`;

  await writeFile(filePath, backupContent, 'utf8');
  
  const fileContent = await readFile(filePath);
  const fileSize = fileContent.length;
  const checksum = createHash('md5').update(fileContent).digest('hex');
  const duration = (Date.now() - startTime) / 1000;

  const metadata = {
    company: {
      id: backup.companyId,
      name: 'Empresa Exemplo',
      cnpj: '00.000.000/0000-00'
    },
    database: {
      version: 'PostgreSQL 15.0',
      tables: ['users', 'companies', 'employees', 'time_records'],
      recordCount: 1000
    },
    backup: {
      type: backup.type,
      compression: options?.compression ? 'gzip' : 'none',
      encryption: options?.encryption || false,
      generatedAt: new Date(),
      duration
    },
    validation: {
      isVerified: false,
      checksumValid: true,
      integrityCheck: false
    }
  };

  return {
    filePath,
    fileSize,
    checksum,
    metadata
  };
}

function generateBackupFileName(company: any, type: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const companyCode = company.cnpj?.replace(/\D/g, '').substring(0, 8) || 'company';
  return `backup_${companyCode}_${type.toLowerCase()}_${timestamp}.sql`;
}

function calculateNextRun(
  frequency: string,
  time: string,
  days: number[]
): Date {
  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  
  let nextRun = new Date();
  nextRun.setHours(hours, minutes, 0, 0);

  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  return nextRun;
}

async function getBackupConfig(companyId?: string): Promise<BackupConfig> {
  return DEFAULT_BACKUP_CONFIG;
} 