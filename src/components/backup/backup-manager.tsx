'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Download, 
  Upload, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Settings,
  Calendar,
  HardDrive,
  Shield,
  Archive
} from 'lucide-react';

interface Backup {
  id: string;
  companyId: string;
  type: 'FULL' | 'INCREMENTAL' | 'DIFFERENTIAL' | 'SCHEMA_ONLY' | 'DATA_ONLY';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED' | 'RESTORING';
  fileName: string;
  filePath: string;
  fileSize: number;
  checksum: string;
  metadata: {
    company: {
      id: string;
      name: string;
      cnpj: string;
    };
    database: {
      version: string;
      tables: string[];
      recordCount: number;
    };
    backup: {
      type: string;
      compression: string;
      encryption: boolean;
      generatedAt: Date;
      duration: number;
    };
    validation: {
      isVerified: boolean;
      checksumValid: boolean;
      integrityCheck: boolean;
      verifiedAt?: Date;
    };
  };
  retentionDays: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface BackupStats {
  totalBackups: number;
  completedBackups: number;
  failedBackups: number;
  totalSize: number;
  lastBackup?: Date;
  nextScheduledBackup?: Date;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

interface BackupSchedule {
  id: string;
  companyId: string;
  type: 'FULL' | 'INCREMENTAL' | 'DIFFERENTIAL' | 'SCHEMA_ONLY' | 'DATA_ONLY';
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  time: string;
  days: number[];
  isActive: boolean;
  retentionDays: number;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface RestoreJob {
  id: string;
  companyId: string;
  backupId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  metadata: {
    backup: {
      id: string;
      fileName: string;
      type: string;
      createdAt: Date;
    };
    restore: {
      targetDatabase: string;
      options: {
        dropExisting: boolean;
        createMissing: boolean;
        preserveData: boolean;
      };
      startedAt: Date;
      estimatedDuration: number;
    };
    progress: {
      currentStep: string;
      stepsCompleted: number;
      totalSteps: number;
      currentTable?: string;
      recordsProcessed: number;
      totalRecords: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export function BackupManager() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [schedules, setSchedules] = useState<BackupSchedule[]>([]);
  const [restoreJobs, setRestoreJobs] = useState<RestoreJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedBackupType, setSelectedBackupType] = useState<string>('FULL');
  const [showCreateBackup, setShowCreateBackup] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [backupsRes, statsRes, schedulesRes] = await Promise.all([
        fetch('/api/backup?limit=20'),
        fetch('/api/backup/stats'),
        fetch('/api/backup/schedules')
      ]);

      if (backupsRes.ok) setBackups((await backupsRes.json()).data);
      if (statsRes.ok) setStats(await statsRes.json());
      if (schedulesRes.ok) setSchedules(await schedulesRes.json());
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: 'sample-company-id',
          type: selectedBackupType,
          retentionDays: 30,
          compression: true,
          encryption: false
        })
      });

      if (response.ok) {
        await loadData();
        setShowCreateBackup(false);
      }
    } catch (error) {
      console.error('Erro ao criar backup:', error);
    }
  };

  const validateBackup = async (backupId: string) => {
    try {
      const response = await fetch(`/api/backup/${backupId}/validate`, {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Validação: ${result.isValid ? 'Válido' : 'Inválido'}`);
        await loadData();
      }
    } catch (error) {
      console.error('Erro ao validar backup:', error);
    }
  };

  const restoreBackup = async (backupId: string) => {
    if (!confirm('Tem certeza que deseja restaurar este backup? Esta ação pode sobrescrever dados existentes.')) {
      return;
    }

    try {
      const response = await fetch(`/api/backup/${backupId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: 'sample-company-id',
          dropExisting: false,
          createMissing: true,
          preserveData: true
        })
      });

      if (response.ok) {
        const restoreJob = await response.json();
        alert(`Restauração iniciada. Job ID: ${restoreJob.id}`);
        await loadData();
      }
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      PENDING: 'Pendente',
      PROCESSING: 'Processando',
      COMPLETED: 'Concluído',
      FAILED: 'Falhou',
      EXPIRED: 'Expirado',
      RESTORING: 'Restaurando'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-gray-100 text-gray-800',
      RESTORING: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      FULL: 'Completo',
      INCREMENTAL: 'Incremental',
      DIFFERENTIAL: 'Diferencial',
      SCHEMA_ONLY: 'Apenas Schema',
      DATA_ONLY: 'Apenas Dados'
    };
    return labels[type] || type;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciador de Backup</h2>
          <p className="text-muted-foreground">
            Gerencie backups, restaurações e agendamentos automáticos
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => setShowCreateBackup(true)}>
            <Database className="h-4 w-4 mr-2" />
            Criar Backup
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Backups</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBackups}</div>
              <p className="text-xs text-muted-foreground">
                backups realizados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedBackups}</div>
              <p className="text-xs text-muted-foreground">
                de {stats.totalBackups} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tamanho Total</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
              <p className="text-xs text-muted-foreground">
                armazenamento usado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Último Backup</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.lastBackup ? new Date(stats.lastBackup).toLocaleDateString('pt-BR') : 'Nunca'}
              </div>
              <p className="text-xs text-muted-foreground">
                último backup realizado
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="schedules">Agendamentos</TabsTrigger>
          <TabsTrigger value="restore">Restaurações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Backups por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats && Object.entries(stats.byType).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm">{getTypeLabel(type)}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Backups por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats && Object.entries(stats.byStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className="text-sm">{getStatusLabel(status)}</span>
                      <Badge className={getStatusColor(status)}>{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="backups" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Backups Realizados</CardTitle>
              <CardDescription>
                Histórico de backups criados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {backups.map((backup) => (
                  <div key={backup.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        <span className="font-medium">
                          {backup.fileName}
                        </span>
                        <Badge variant="outline">
                          {getTypeLabel(backup.type)}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(backup.status)}>
                          {getStatusLabel(backup.status)}
                        </Badge>
                        {backup.status === 'COMPLETED' && (
                          <>
                            <Button
                              onClick={() => validateBackup(backup.id)}
                              variant="outline"
                              size="sm"
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Validar
                            </Button>
                            <Button
                              onClick={() => restoreBackup(backup.id)}
                              variant="outline"
                              size="sm"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Restaurar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Empresa:</span>
                        <p className="font-medium">{backup.metadata.company.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tamanho:</span>
                        <p className="font-medium">{formatFileSize(backup.fileSize)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Criado:</span>
                        <p className="font-medium">
                          {new Date(backup.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Expira:</span>
                        <p className="font-medium">
                          {new Date(backup.expiresAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    {backup.metadata.validation.isVerified && (
                      <div className="text-sm text-green-600 mt-2">
                        <CheckCircle className="h-4 w-4 inline mr-1" />
                        Backup validado em {new Date(backup.metadata.validation.verifiedAt!).toLocaleString('pt-BR')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agendamentos de Backup</CardTitle>
              <CardDescription>
                Configure backups automáticos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">
                          {getTypeLabel(schedule.type)} - {schedule.frequency}
                        </span>
                        <Badge variant={schedule.isActive ? "default" : "secondary"}>
                          {schedule.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Horário:</span>
                        <p className="font-medium">{schedule.time}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Dias:</span>
                        <p className="font-medium">
                          {schedule.days.map(d => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d]).join(', ')}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Retenção:</span>
                        <p className="font-medium">{schedule.retentionDays} dias</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Próximo:</span>
                        <p className="font-medium">
                          {schedule.nextRun ? new Date(schedule.nextRun).toLocaleString('pt-BR') : 'Não agendado'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="restore" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Jobs de Restauração</CardTitle>
              <CardDescription>
                Histórico de restaurações realizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {restoreJobs.map((job) => (
                  <div key={job.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        <span className="font-medium">
                          Restauração {job.id.substring(0, 8)}
                        </span>
                        <Badge className={getStatusColor(job.status)}>
                          {getStatusLabel(job.status)}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progresso:</span>
                        <span>{job.progress}%</span>
                      </div>
                      <Progress value={job.progress} className="w-full" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-4">
                      <div>
                        <span className="text-muted-foreground">Iniciado:</span>
                        <p className="font-medium">
                          {new Date(job.startedAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Backup:</span>
                        <p className="font-medium">{job.metadata.backup.fileName}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <p className="font-medium">{getStatusLabel(job.status)}</p>
                      </div>
                    </div>
                    {job.errorMessage && (
                      <div className="text-sm text-red-600 mt-2">
                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                        Erro: {job.errorMessage}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showCreateBackup && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Novo Backup</CardTitle>
            <CardDescription>
              Configure e execute um novo backup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="backupType">Tipo de Backup</Label>
              <Select value={selectedBackupType} onValueChange={setSelectedBackupType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL">Completo</SelectItem>
                  <SelectItem value="INCREMENTAL">Incremental</SelectItem>
                  <SelectItem value="DIFFERENTIAL">Diferencial</SelectItem>
                  <SelectItem value="SCHEMA_ONLY">Apenas Schema</SelectItem>
                  <SelectItem value="DATA_ONLY">Apenas Dados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={createBackup}>
                <Database className="h-4 w-4 mr-2" />
                Criar Backup
              </Button>
              <Button variant="outline" onClick={() => setShowCreateBackup(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 