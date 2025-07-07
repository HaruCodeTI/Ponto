'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Trash2, Shield, Clock, AlertTriangle } from 'lucide-react';

interface RetentionPolicy {
  id: string;
  name: string;
  description?: string;
  entityType: string;
  retentionPeriod: number;
  isActive: boolean;
  companyId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DataPurge {
  id: string;
  timestamp: Date;
  policyId: string;
  entityType: string;
  status: string;
  recordsCount: number;
  purgedCount: number;
  error?: string;
  duration?: number;
}

interface RetentionStats {
  totalPolicies: number;
  activePolicies: number;
  totalPurges: number;
  successfulPurges: number;
  failedPurges: number;
  totalRecordsPurged: number;
  lastPurge: Date | null;
}

export function DataRetentionManager() {
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [purges, setPurges] = useState<DataPurge[]>([]);
  const [stats, setStats] = useState<RetentionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('policies');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [policiesRes, purgesRes, statsRes] = await Promise.all([
        fetch('/api/secure-storage/retention?limit=10'),
        fetch('/api/secure-storage/purge?limit=10'),
        fetch('/api/secure-storage/purge/stats')
      ]);

      if (policiesRes.ok) setPolicies((await policiesRes.json()).data);
      if (purgesRes.ok) setPurges((await purgesRes.json()).data);
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPolicy = async () => {
    try {
      const response = await fetch('/api/secure-storage/retention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Política Padrão',
          entityType: 'TimeRecord',
          retentionPeriod: 1825, // 5 anos
          description: 'Política padrão de retenção para registros de ponto'
        })
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Erro ao criar política:', error);
    }
  };

  const executePurge = async (policyId: string) => {
    try {
      const response = await fetch('/api/secure-storage/purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policyId })
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Erro ao executar expurgo:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'PARTIAL':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          <h2 className="text-2xl font-bold">Retenção e Expurgo de Dados</h2>
          <p className="text-muted-foreground">
            Gerenciamento de políticas de retenção e operações de expurgo seguro
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={createPolicy} variant="outline">
            <Shield className="h-4 w-4 mr-2" />
            Nova Política
          </Button>
          <Button onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Políticas Ativas</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activePolicies}</div>
              <p className="text-xs text-muted-foreground">
                de {stats.totalPolicies} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expurgos Bem-sucedidos</CardTitle>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successfulPurges}</div>
              <p className="text-xs text-muted-foreground">
                de {stats.totalPurges} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registros Expurgados</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRecordsPurged}</div>
              <p className="text-xs text-muted-foreground">
                total de registros removidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Último Expurgo</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.lastPurge ? new Date(stats.lastPurge).toLocaleDateString('pt-BR') : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                última operação realizada
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="policies">Políticas de Retenção</TabsTrigger>
          <TabsTrigger value="purges">Histórico de Expurgos</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Políticas de Retenção</CardTitle>
              <CardDescription>
                Configurações de retenção para diferentes tipos de dados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {policies.map((policy) => (
                  <div key={policy.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span className="font-medium">{policy.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {policy.entityType}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={policy.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {policy.isActive ? 'Ativa' : 'Inativa'}
                        </Badge>
                        <Button
                          onClick={() => executePurge(policy.id)}
                          variant="outline"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Executar Expurgo
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Período:</span>
                        <p className="font-medium">{policy.retentionPeriod} dias</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Criado por:</span>
                        <p className="font-medium">{policy.createdBy}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Criado em:</span>
                        <p className="font-medium">
                          {new Date(policy.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Atualizado:</span>
                        <p className="font-medium">
                          {new Date(policy.updatedAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    {policy.description && (
                      <div className="text-sm text-muted-foreground mt-2">
                        {policy.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purges" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Expurgos</CardTitle>
              <CardDescription>
                Registro de todas as operações de expurgo realizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {purges.map((purge) => (
                  <div key={purge.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        <span className="font-medium">Política #{purge.policyId}</span>
                        <span className="text-sm text-muted-foreground">
                          {purge.entityType}
                        </span>
                      </div>
                      <Badge className={getStatusColor(purge.status)}>
                        {purge.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Processados:</span>
                        <p className="font-medium">{purge.recordsCount}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Expurgados:</span>
                        <p className="font-medium">{purge.purgedCount}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Data:</span>
                        <p className="font-medium">
                          {new Date(purge.timestamp).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Hora:</span>
                        <p className="font-medium">
                          {new Date(purge.timestamp).toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    {purge.duration && (
                      <div className="text-sm text-muted-foreground mt-2">
                        Duração: {purge.duration}ms
                      </div>
                    )}
                    {purge.error && (
                      <div className="text-sm text-red-600 mt-2">
                        Erro: {purge.error}
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