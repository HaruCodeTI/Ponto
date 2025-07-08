'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  // AlertTriangle, 
  Download,
  Plus,
  Settings,
  RefreshCw
  // Eye,
  // EyeOff
} from 'lucide-react';
import { 
  ExecutiveStats, 
  ExecutiveDashboard, 
  DashboardWidget
  // BusinessKPI,
  // GeneratedReport
} from '@/types';

interface ExecutiveDashboardProps {
  companyId?: string;
}

export function ExecutiveDashboardComponent({ companyId }: ExecutiveDashboardProps) {
  const [stats, setStats] = useState<ExecutiveStats | null>(null);
  const [selectedDashboard, setSelectedDashboard] = useState<ExecutiveDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadData();
  }, [companyId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Carregar estatísticas
      const statsResponse = await fetch(`/api/executive/stats?companyId=${companyId}`);
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Carregar dashboards
      const dashboardsResponse = await fetch(`/api/dashboards?companyId=${companyId}`);
      const dashboardsData = await dashboardsResponse.json();

      if (dashboardsData.data.length > 0) {
        setSelectedDashboard(dashboardsData.data[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderKPICard = (kpi: any) => (
    <Card key={kpi.id} className="col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{kpi.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{kpi.value.toFixed(2)}</div>
        <div className="flex items-center text-xs text-muted-foreground">
          <TrendingUp className="mr-1 h-3 w-3" />
          {kpi.trend > 0 ? '+' : ''}{kpi.trend.toFixed(1)}% vs período anterior
        </div>
        {kpi.target && (
          <div className="mt-2">
            <div className="text-xs text-muted-foreground">Meta: {kpi.target}</div>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
              <div 
                className="bg-blue-600 h-1 rounded-full" 
                style={{ width: `${Math.min((kpi.value / kpi.target) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderSystemHealth = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Saúde do Sistema
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats?.systemHealth.dataQuality}%
            </div>
            <div className="text-sm text-muted-foreground">Qualidade dos Dados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats?.systemHealth.performance}%
            </div>
            <div className="text-sm text-muted-foreground">Performance</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {stats?.systemHealth.availability}%
            </div>
            <div className="text-sm text-muted-foreground">Disponibilidade</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {stats?.systemHealth.compliance}%
            </div>
            <div className="text-sm text-muted-foreground">Compliance</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderRecentReports = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Relatórios Recentes
          </span>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Novo
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stats?.recentReports.map((report) => (
            <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">{report.name}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(report.generatedAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={report.status === 'COMPLETED' ? 'default' : 'secondary'}>
                  {report.status}
                </Badge>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderWidget = (widget: DashboardWidget) => {
    switch (widget.widgetType) {
      case 'KPI_CARD':
        return (
          <Card key={widget.id} className="col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
              {widget.description && (
                <CardDescription className="text-xs">{widget.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <div className="text-xs text-muted-foreground">Carregando...</div>
            </CardContent>
          </Card>
        );

      case 'LINE_CHART':
      case 'BAR_CHART':
        return (
          <Card key={widget.id} className="col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                Gráfico em desenvolvimento
              </div>
            </CardContent>
          </Card>
        );

      case 'TABLE':
        return (
          <Card key={widget.id} className="col-span-3">
            <CardHeader>
              <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                Tabela em desenvolvimento
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card key={widget.id} className="col-span-1">
            <CardHeader>
              <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-16 flex items-center justify-center text-muted-foreground">
                Widget em desenvolvimento
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <div>Carregando dashboard executivo...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Executivo</h1>
          <p className="text-muted-foreground">
            Visão geral e métricas de negócio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Atualizar
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-1" />
            Configurar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="dashboards">Dashboards</TabsTrigger>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPIs Principais */}
          <div>
            <h2 className="text-xl font-semibold mb-4">KPIs Principais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats?.topKPIs.map(renderKPICard)}
            </div>
          </div>

          {/* Métricas Gerais */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Funcionários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.activeKPIs || 0}</div>
                <div className="text-sm text-muted-foreground">KPIs ativos</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Dashboards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalDashboards || 0}</div>
                <div className="text-sm text-muted-foreground">Dashboards criados</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Relatórios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalReports || 0}</div>
                <div className="text-sm text-muted-foreground">Relatórios gerados</div>
              </CardContent>
            </Card>
          </div>

          {/* Saúde do Sistema e Relatórios Recentes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderSystemHealth()}
            {renderRecentReports()}
          </div>
        </TabsContent>

        <TabsContent value="dashboards" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Dashboards</h2>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Novo Dashboard
            </Button>
          </div>

          {selectedDashboard ? (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium">{selectedDashboard.name}</h3>
                {selectedDashboard.description && (
                  <p className="text-muted-foreground">{selectedDashboard.description}</p>
                )}
              </div>

              <div className="grid grid-cols-12 gap-4">
                {selectedDashboard.widgets?.map(renderWidget)}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Nenhum dashboard encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro dashboard para começar a visualizar suas métricas
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-1" />
                Criar Dashboard
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="kpis" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Indicadores de Performance</h2>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Novo KPI
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats?.topKPIs.map(renderKPICard)}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Relatórios</h2>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Gerar Relatório
            </Button>
          </div>

          {renderRecentReports()}
        </TabsContent>
      </Tabs>
    </div>
  );
} 