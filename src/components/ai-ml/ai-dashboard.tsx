'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Activity,
  Play,
  RefreshCw,
  BarChart3,
  Target,
  Zap,
  Shield
} from 'lucide-react';
import { AIStats, AIModel, AnomalyDetection, AIInsight } from '@/types';

interface AIDashboardProps {
  companyId?: string;
}

export function AIDashboard({ companyId }: AIDashboardProps) {
  const [stats, setStats] = useState<AIStats | null>(null);
  const [models, setModels] = useState<AIModel[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [companyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, modelsRes, anomaliesRes, insightsRes] = await Promise.all([
        fetch('/api/ai-ml/stats'),
        fetch('/api/ai-models?limit=5'),
        fetch('/api/anomalies?limit=5'),
        fetch('/api/ai-insights?limit=5')
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (modelsRes.ok) setModels((await modelsRes.json()).data);
      if (anomaliesRes.ok) setAnomalies((await anomaliesRes.json()).data);
      if (insightsRes.ok) setInsights((await insightsRes.json()).data);
    } catch (error) {
      console.error('Erro ao carregar dados de IA:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'secondary';
      case 'LOW': return 'default';
      default: return 'default';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'CRITICAL': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'secondary';
      case 'LOW': return 'default';
      default: return 'default';
    }
  };

  const getModelTypeIcon = (type: string) => {
    switch (type) {
      case 'ANOMALY_DETECTION': return <AlertTriangle className="h-4 w-4" />;
      case 'PREDICTIVE_ANALYTICS': return <TrendingUp className="h-4 w-4" />;
      case 'CLASSIFICATION': return <Target className="h-4 w-4" />;
      case 'REGRESSION': return <BarChart3 className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modelos Ativos</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeModels || 0}</div>
            <p className="text-xs text-muted-foreground">
              de {stats?.totalModels || 0} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predições</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.successfulPredictions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalPredictions ? 
                `${((stats.successfulPredictions / stats.totalPredictions) * 100).toFixed(1)}% sucesso` : 
                '0% sucesso'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anomalias</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAnomalies || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.resolvedAnomalies || 0} resolvidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insights</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalInsights || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.actionedInsights || 0} acionados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Saúde do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Saúde do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Performance dos Modelos</span>
                <span>{stats?.systemHealth.modelPerformance.toFixed(1)}%</span>
              </div>
              <Progress value={stats?.systemHealth.modelPerformance || 0} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Qualidade dos Dados</span>
                <span>{stats?.systemHealth.dataQuality.toFixed(1)}%</span>
              </div>
              <Progress value={stats?.systemHealth.dataQuality || 0} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Confiabilidade</span>
                <span>{stats?.systemHealth.systemReliability.toFixed(1)}%</span>
              </div>
              <Progress value={stats?.systemHealth.systemReliability || 0} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Latência (ms)</span>
                <span>{stats?.systemHealth.predictionLatency}</span>
              </div>
              <Progress 
                value={Math.max(0, 100 - (stats?.systemHealth.predictionLatency || 0))} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Principal */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="models">Modelos</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalias</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Modelos Principais */}
            <Card>
              <CardHeader>
                <CardTitle>Modelos Principais</CardTitle>
                <CardDescription>Top 5 modelos por performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.topModels.map((model) => (
                    <div key={model.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getModelTypeIcon(model.type)}
                        <div>
                          <p className="font-medium">{model.name}</p>
                          <p className="text-sm text-muted-foreground">{model.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{(model.accuracy * 100).toFixed(1)}%</p>
                        <p className="text-sm text-muted-foreground">{model.predictions} pred.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Anomalias Recentes */}
            <Card>
              <CardHeader>
                <CardTitle>Anomalias Recentes</CardTitle>
                <CardDescription>Últimas detecções</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {anomalies.map((anomaly) => (
                    <div key={anomaly.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <div>
                          <p className="font-medium">{anomaly.description}</p>
                          <p className="text-sm text-muted-foreground">{anomaly.anomalyType}</p>
                        </div>
                      </div>
                      <Badge variant={getSeverityColor(anomaly.severity) as any}>
                        {anomaly.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Modelos de IA</CardTitle>
              <CardDescription>Gerencie seus modelos de machine learning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {models.map((model) => (
                  <div key={model.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {getModelTypeIcon(model.type)}
                      <div>
                        <h3 className="font-medium">{model.name}</h3>
                        <p className="text-sm text-muted-foreground">{model.description}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{model.type}</Badge>
                          <Badge variant={model.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {model.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {model.accuracy && (
                        <div className="text-right">
                          <p className="font-medium">{(model.accuracy * 100).toFixed(1)}%</p>
                          <p className="text-sm text-muted-foreground">Precisão</p>
                        </div>
                      )}
                      <Button size="sm" variant="outline">
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detecção de Anomalias</CardTitle>
              <CardDescription>Monitore e gerencie anomalias detectadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {anomalies.map((anomaly) => (
                  <div key={anomaly.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-500 mt-1" />
                        <div>
                          <h3 className="font-medium">{anomaly.description}</h3>
                          <p className="text-sm text-muted-foreground">
                            {anomaly.dataSource} • {anomaly.anomalyType}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant={getSeverityColor(anomaly.severity) as any}>
                              {anomaly.severity}
                            </Badge>
                            <Badge variant="outline">
                              Score: {(anomaly.score * 100).toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {new Date(anomaly.createdAt).toLocaleDateString()}
                        </p>
                        {!anomaly.isResolved && (
                          <Button size="sm" className="mt-2">
                            Resolver
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Insights de IA</CardTitle>
              <CardDescription>Análises e recomendações inteligentes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.map((insight) => (
                  <div key={insight.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="h-5 w-5 text-yellow-500 mt-1" />
                        <div>
                          <h3 className="font-medium">{insight.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {insight.description}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant={getImpactColor(insight.impact) as any}>
                              {insight.impact}
                            </Badge>
                            <Badge variant="outline">
                              Confiança: {(insight.confidence * 100).toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {new Date(insight.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {!insight.isRead && (
                            <Button size="sm" variant="outline">
                              Marcar como lido
                            </Button>
                          )}
                          {!insight.isActioned && (
                            <Button size="sm">
                              Acionar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar Dados
            </Button>
            <Button variant="outline">
              <Brain className="h-4 w-4 mr-2" />
              Novo Modelo
            </Button>
            <Button variant="outline">
              <Target className="h-4 w-4 mr-2" />
              Treinar Modelo
            </Button>
            <Button variant="outline">
              <Shield className="h-4 w-4 mr-2" />
              Configurar Segurança
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 