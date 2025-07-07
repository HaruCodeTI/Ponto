'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe, 
  Webhook, 
  Database, 
  Activity, 
  Settings, 
  Plus,
  Play,
  Pause,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import { 
  IntegrationStats, 
  ExternalAPI, 
  Webhook as WebhookType, 
  DataSync,
  APITestResult
} from '@/types';

interface IntegrationManagerProps {
  companyId?: string;
}

export function IntegrationManager({ companyId }: IntegrationManagerProps) {
  const [stats, setStats] = useState<IntegrationStats | null>(null);
  const [apis, setApis] = useState<ExternalAPI[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookType[]>([]);
  const [syncs, setSyncs] = useState<DataSync[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [testResults, setTestResults] = useState<Record<string, APITestResult>>({});

  useEffect(() => {
    loadData();
  }, [companyId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Carregar estatísticas
      const statsResponse = await fetch(`/api/integrations/stats?companyId=${companyId}`);
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Carregar APIs
      const apisResponse = await fetch(`/api/external-apis?companyId=${companyId}`);
      const apisData = await apisResponse.json();
      setApis(apisData.data);

      // Carregar webhooks
      const webhooksResponse = await fetch(`/api/webhooks?companyId=${companyId}`);
      const webhooksData = await webhooksResponse.json();
      setWebhooks(webhooksData.data);

      // TODO: Carregar sincronizações
      setSyncs([]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testAPI = async (apiId: string, endpointId: string) => {
    try {
      const response = await fetch(`/api/external-apis/${apiId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpointId })
      });
      
      const result = await response.json();
      setTestResults(prev => ({ ...prev, [apiId]: result }));
    } catch (error) {
      console.error('Erro ao testar API:', error);
    }
  };

  const deliverWebhook = async (webhookId: string) => {
    try {
      await fetch(`/api/webhooks/${webhookId}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'test',
          payload: { message: 'Test webhook delivery' }
        })
      });
      
      // Recarregar dados
      loadData();
    } catch (error) {
      console.error('Erro ao entregar webhook:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'DELIVERED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'PENDING':
      case 'RUNNING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      'COMPLETED': 'default',
      'DELIVERED': 'default',
      'FAILED': 'destructive',
      'PENDING': 'secondary',
      'RUNNING': 'secondary'
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <div>Carregando integrações...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciador de Integrações</h1>
          <p className="text-muted-foreground">
            APIs externas, webhooks e sincronização de dados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Atualizar
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-1" />
            Nova Integração
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="apis">APIs Externas</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="syncs">Sincronização</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  APIs Externas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalAPIs || 0}</div>
                <div className="text-sm text-muted-foreground">
                  {stats?.activeAPIs || 0} ativas
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Webhooks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalWebhooks || 0}</div>
                <div className="text-sm text-muted-foreground">
                  {stats?.activeWebhooks || 0} ativos
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Requisições
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalRequests || 0}</div>
                <div className="text-sm text-muted-foreground">
                  {stats?.successfulRequests || 0} bem-sucedidas
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(stats?.averageResponseTime || 0)}ms
                </div>
                <div className="text-sm text-muted-foreground">
                  Tempo médio de resposta
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Saúde do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle>Saúde do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats?.systemHealth.availability.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Disponibilidade</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats?.systemHealth.performance.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Performance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats?.systemHealth.reliability.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Confiabilidade</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {stats?.systemHealth.security.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Segurança</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* APIs Mais Utilizadas */}
          <Card>
            <CardHeader>
              <CardTitle>APIs Mais Utilizadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.topAPIs.map((api) => (
                  <div key={api.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{api.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {api.requestCount} requisições
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {api.successRate.toFixed(1)}% sucesso
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        {Math.round(api.avgResponseTime)}ms
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Erros Recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Erros Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.recentErrors.map((error) => (
                  <div key={error.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{error.message}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(error.timestamp).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <Badge variant="destructive">{error.level}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apis" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">APIs Externas</h2>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Nova API
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {apis.map((api) => (
              <Card key={api.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      {api.name}
                    </CardTitle>
                    <Badge variant={api.isActive ? 'default' : 'secondary'}>
                      {api.isActive ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  <CardDescription>{api.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Provedor:</span>
                      <span className="font-medium">{api.provider}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Tipo:</span>
                      <span className="font-medium">{api.apiType}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>URL:</span>
                      <span className="font-mono text-xs">{api.baseUrl}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Endpoints:</span>
                      <span className="font-medium">{api.endpoints?.length || 0}</span>
                    </div>
                    
                    {testResults[api.id] && (
                      <div className="mt-3 p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2 text-sm">
                          {testResults[api.id].success ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                          <span>Teste: {testResults[api.id].success ? 'Sucesso' : 'Falha'}</span>
                          <span>({testResults[api.id].responseTime}ms)</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => api.endpoints?.[0] && testAPI(api.id, api.endpoints[0].id)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Testar
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4 mr-1" />
                        Configurar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Webhooks</h2>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Novo Webhook
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {webhooks.map((webhook) => (
              <Card key={webhook.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Webhook className="h-5 w-5" />
                      {webhook.name}
                    </CardTitle>
                    <Badge variant={webhook.isActive ? 'default' : 'secondary'}>
                      {webhook.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <CardDescription>{webhook.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>URL:</span>
                      <span className="font-mono text-xs">{webhook.url}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Eventos:</span>
                      <span className="font-medium">{webhook.events.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Entregas:</span>
                      <span className="font-medium">{webhook.deliveries?.length || 0}</span>
                    </div>
                    
                    {webhook.deliveries?.[0] && (
                      <div className="mt-3 p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2 text-sm">
                          {getStatusIcon(webhook.deliveries[0].status)}
                          <span>Última entrega: {getStatusBadge(webhook.deliveries[0].status)}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => deliverWebhook(webhook.id)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Testar
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4 mr-1" />
                        Configurar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="syncs" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Sincronização de Dados</h2>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Nova Sincronização
            </Button>
          </div>

          {syncs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Nenhuma sincronização encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  Configure sincronizações para manter seus dados atualizados
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-1" />
                  Criar Sincronização
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {syncs.map((sync) => (
                <Card key={sync.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        {sync.name}
                      </CardTitle>
                      {getStatusBadge(sync.status)}
                    </div>
                    <CardDescription>{sync.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Origem:</span>
                        <span className="font-medium">{sync.sourceTable}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Destino:</span>
                        <span className="font-medium">{sync.targetTable}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Registros:</span>
                        <span className="font-medium">{sync.recordsSynced}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Erros:</span>
                        <span className="font-medium text-red-600">{sync.errorCount}</span>
                      </div>

                      <div className="flex items-center gap-2 mt-4">
                        <Button size="sm" variant="outline">
                          <Play className="h-4 w-4 mr-1" />
                          Executar
                        </Button>
                        <Button size="sm" variant="outline">
                          <Pause className="h-4 w-4 mr-1" />
                          Pausar
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4 mr-1" />
                          Configurar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 