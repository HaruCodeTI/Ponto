'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Download,
  RefreshCw,
  Activity,
  HardDrive,
  Cloud
} from 'lucide-react';

interface RedundancyStats {
  totalRedundancies: number;
  successfulRedundancies: number;
  failedRedundancies: number;
  averageReplicationTime: number;
  storageUtilization: number;
  lastBackup: Date | null;
  integrityIssues: number;
}

interface DataRedundancy {
  id: string;
  timestamp: Date;
  entityType: string;
  entityId: string;
  operation: string;
  status: string;
  replicationCount: number;
  companyId: string;
}

interface DataIntegrityCheck {
  id: string;
  timestamp: Date;
  checkType: string;
  status: string;
  totalRecords: number;
  verifiedRecords: number;
  corruptedRecords: number;
  missingRecords: number;
  duration?: number;
}

interface BackupOperation {
  id: string;
  timestamp: Date;
  operationType: string;
  status: string;
  entityTypes: string[];
  fileName?: string;
  fileSize?: number;
  recordsProcessed: number;
  recordsBackedUp: number;
  duration?: number;
}

interface StorageHealth {
  id: string;
  timestamp: Date;
  storageType: string;
  location: string;
  isAvailable: boolean;
  isHealthy: boolean;
  responseTime?: number;
  throughput?: number;
  errorRate?: number;
  totalSpace?: number;
  usedSpace?: number;
  freeSpace?: number;
}

export function SecureStorageManager() {
  const [stats, setStats] = useState<RedundancyStats | null>(null);
  const [redundancies, setRedundancies] = useState<DataRedundancy[]>([]);
  const [integrityChecks, setIntegrityChecks] = useState<DataIntegrityCheck[]>([]);
  const [backupOperations, setBackupOperations] = useState<BackupOperation[]>([]);
  const [storageHealth, setStorageHealth] = useState<StorageHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [statsRes, redundanciesRes, integrityRes, backupRes, healthRes] = await Promise.all([
        fetch('/api/secure-storage/stats'),
        fetch('/api/secure-storage/redundancy?limit=10'),
        fetch('/api/secure-storage/integrity?limit=10'),
        fetch('/api/secure-storage/backup?limit=10'),
        fetch('/api/secure-storage/health?limit=10')
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (redundanciesRes.ok) setRedundancies((await redundanciesRes.json()).data);
      if (integrityRes.ok) setIntegrityChecks((await integrityRes.json()).data);
      if (backupRes.ok) setBackupOperations((await backupRes.json()).data);
      if (healthRes.ok) setStorageHealth((await healthRes.json()).data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      const response = await fetch('/api/secure-storage/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityTypes: ['TimeRecord', 'SystemLog', 'DataRedundancy'],
          operationType: 'FULL'
        })
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Erro ao criar backup:', error);
    }
  };

  const runIntegrityCheck = async () => {
    try {
      const response = await fetch('/api/secure-storage/integrity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkType: 'COMPLETE_SCAN'
        })
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Erro ao executar verificação de integridade:', error);
    }
  };

  const checkStorageHealth = async () => {
    try {
      const response = await fetch('/api/secure-storage/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storageType: 'PRIMARY_DATABASE',
          location: 'primary-database'
        })
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Erro ao verificar saúde do storage:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
      case 'VERIFIED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
      case 'CORRUPTED':
      case 'CORRUPTION_DETECTED':
        return 'bg-red-100 text-red-800';
      case 'PARTIAL':
      case 'PARTIAL_SUCCESS':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStorageTypeIcon = (type: string) => {
    switch (type) {
      case 'PRIMARY_DATABASE':
      case 'BACKUP_DATABASE':
        return <Database className="h-4 w-4" />;
      case 'FILE_STORAGE':
        return <HardDrive className="h-4 w-4" />;
      case 'CLOUD_STORAGE':
        return <Cloud className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
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
          <h1 className="text-3xl font-bold">Armazenamento Seguro</h1>
          <p className="text-muted-foreground">
            Gerenciamento de redundância, integridade e backup de dados
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={createBackup} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Criar Backup
          </Button>
          <Button onClick={runIntegrityCheck} variant="outline">
            <CheckCircle className="h-4 w-4 mr-2" />
            Verificar Integridade
          </Button>
          <Button onClick={checkStorageHealth} variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Verificar Saúde
          </Button>
          <Button onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="redundancy">Redundância</TabsTrigger>
          <TabsTrigger value="integrity">Integridade</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="health">Saúde</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Redundâncias</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalRedundancies}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.successfulRedundancies} bem-sucedidas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalRedundancies > 0 
                      ? Math.round((stats.successfulRedundancies / stats.totalRedundancies) * 100)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.failedRedundancies} falhas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Utilização do Storage</CardTitle>
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.storageUtilization}%</div>
                  <Progress value={stats.storageUtilization} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Problemas de Integridade</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.integrityIssues}</div>
                  <p className="text-xs text-muted-foreground">
                    Requerem atenção
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Redundâncias Recentes</CardTitle>
                <CardDescription>
                  Últimas operações de redundância
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {redundancies.slice(0, 5).map((redundancy) => (
                    <div key={redundancy.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{redundancy.entityType}</p>
                        <p className="text-sm text-muted-foreground">
                          {redundancy.operation} • {redundancy.replicationCount} réplicas
                        </p>
                      </div>
                      <Badge className={getStatusColor(redundancy.status)}>
                        {redundancy.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Verificações de Integridade</CardTitle>
                <CardDescription>
                  Últimas verificações realizadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {integrityChecks.slice(0, 5).map((check) => (
                    <div key={check.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{check.checkType}</p>
                        <p className="text-sm text-muted-foreground">
                          {check.verifiedRecords}/{check.totalRecords} verificados
                        </p>
                      </div>
                      <Badge className={getStatusColor(check.status)}>
                        {check.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="redundancy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Redundância de Dados</CardTitle>
              <CardDescription>
                Histórico de operações de redundância
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {redundancies.map((redundancy) => (
                  <div key={redundancy.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span className="font-medium">{redundancy.entityType}</span>
                        <span className="text-sm text-muted-foreground">#{redundancy.entityId}</span>
                      </div>
                      <Badge className={getStatusColor(redundancy.status)}>
                        {redundancy.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Operação:</span>
                        <p className="font-medium">{redundancy.operation}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Réplicas:</span>
                        <p className="font-medium">{redundancy.replicationCount}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Data:</span>
                        <p className="font-medium">
                          {new Date(redundancy.timestamp).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Hora:</span>
                        <p className="font-medium">
                          {new Date(redundancy.timestamp).toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Verificação de Integridade</CardTitle>
              <CardDescription>
                Histórico de verificações de integridade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrityChecks.map((check) => (
                  <div key={check.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">{check.checkType}</span>
                      </div>
                      <Badge className={getStatusColor(check.status)}>
                        {check.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-muted-foreground">Total:</span>
                        <p className="font-medium">{check.totalRecords}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Verificados:</span>
                        <p className="font-medium text-green-600">{check.verifiedRecords}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Corrompidos:</span>
                        <p className="font-medium text-red-600">{check.corruptedRecords}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Faltantes:</span>
                        <p className="font-medium text-orange-600">{check.missingRecords}</p>
                      </div>
                    </div>
                    {check.duration && (
                      <div className="text-sm text-muted-foreground">
                        Duração: {check.duration}ms
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Operações de Backup</CardTitle>
              <CardDescription>
                Histórico de backups realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {backupOperations.map((backup) => (
                  <div key={backup.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        <span className="font-medium">{backup.operationType}</span>
                        <span className="text-sm text-muted-foreground">
                          {backup.entityTypes.join(', ')}
                        </span>
                      </div>
                      <Badge className={getStatusColor(backup.status)}>
                        {backup.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Processados:</span>
                        <p className="font-medium">{backup.recordsProcessed}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Backup:</span>
                        <p className="font-medium">{backup.recordsBackedUp}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Arquivo:</span>
                        <p className="font-medium">{backup.fileName || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tamanho:</span>
                        <p className="font-medium">
                          {backup.fileSize ? `${Math.round(backup.fileSize / 1024 / 1024)}MB` : 'N/A'}
                        </p>
                      </div>
                    </div>
                    {backup.duration && (
                      <div className="text-sm text-muted-foreground mt-2">
                        Duração: {backup.duration}ms
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Saúde do Storage</CardTitle>
              <CardDescription>
                Monitoramento de saúde dos sistemas de armazenamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {storageHealth.map((health) => (
                  <div key={health.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStorageTypeIcon(health.storageType)}
                        <span className="font-medium">{health.storageType}</span>
                        <span className="text-sm text-muted-foreground">{health.location}</span>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={health.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {health.isAvailable ? 'Disponível' : 'Indisponível'}
                        </Badge>
                        <Badge className={health.isHealthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {health.isHealthy ? 'Saudável' : 'Não Saudável'}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {health.responseTime && (
                        <div>
                          <span className="text-muted-foreground">Tempo de Resposta:</span>
                          <p className="font-medium">{health.responseTime}ms</p>
                        </div>
                      )}
                      {health.throughput && (
                        <div>
                          <span className="text-muted-foreground">Throughput:</span>
                          <p className="font-medium">{health.throughput.toFixed(1)}MB/s</p>
                        </div>
                      )}
                      {health.errorRate !== undefined && (
                        <div>
                          <span className="text-muted-foreground">Taxa de Erro:</span>
                          <p className="font-medium">{health.errorRate.toFixed(2)}%</p>
                        </div>
                      )}
                      {health.totalSpace && health.usedSpace && (
                        <div>
                          <span className="text-muted-foreground">Uso:</span>
                          <p className="font-medium">
                            {Math.round((health.usedSpace / health.totalSpace) * 100)}%
                          </p>
                        </div>
                      )}
                    </div>
                    {health.lastError && (
                      <div className="text-sm text-red-600 mt-2">
                        Último erro: {health.lastError}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 